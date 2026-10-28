#!/usr/bin/env python3
"""B-only business baseline; temporary LuCI session is always destroyed.

No network policy, passwords, processes or services are changed. A production\nhomepage read may initialize its absent configuration once. Raw API
objects, credentials and cookies are excluded from the persisted report.
"""
import datetime
import json
import os
from pathlib import Path
import secrets
import shlex
import subprocess
import sys
import urllib.error
import urllib.request

HOST = '192.168.30.244'
OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=False)


def remote(command):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5',
                                    'root@' + HOST, command], text=True, timeout=20)


def ubus(method, data):
    raw = remote('ubus -S call session ' + method + ' ' + shlex.quote(json.dumps(data)))
    return json.loads(raw) if raw.strip() else {}


report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'host': HOST, 'readOnlyNetworkPolicy': True, 'homepageMayInitialize': True, 'apis': {}}
report['board'] = json.loads(remote('ubus call system board'))
report['version'] = remote('/usr/sbin/quickstart version').strip()
report['packages'] = remote("opkg list-installed | sed -n '/quickstart/p; /netpolicy/p; /luci-base/p'").strip().splitlines()
report['fingerprints'] = remote('sha256sum /usr/sbin/quickstart /www/luci-static/quickstart/index.js /www/luci-static/quickstart/i18n/en.json').strip().splitlines()
sid = ubus('create', {'timeout': 300})['ubus_rpc_session']
try:
    ubus('set', {'ubus_rpc_session': sid, 'values': {'username': 'root', 'token': secrets.token_hex(16)}})
    # This firmware's LuCI shell calls rpcd even while rendering read-only
    # pages; missing ubus ACL is presented as an expired login session.
    # Match a temporary admin session, used only by the read-only runner.
    ubus('grant', {'ubus_rpc_session': sid, 'scope': 'ubus', 'objects': [['*', '*']]})
    ubus('grant', {'ubus_rpc_session': sid, 'scope': 'access-group', 'objects': [['*', 'read']]})
    ubus('grant', {'ubus_rpc_session': sid, 'scope': 'uci', 'objects': [['*', 'read']]})
    for name, endpoint in {
        'inventory': 'lanctrl/v2/devices/', 'routerContext': 'lanctrl/v2/router-context/',
        'traffic': 'lanctrl/v2/device-traffic/', 'apps': 'app/install-list/',
        'layout': 'home/v1/layout/',
    }.items():
        entry = {}
        request = urllib.request.Request('http://' + HOST + '/cgi-bin/luci/istore/' + endpoint,
                                         headers={'Cookie': 'sysauth_http=' + sid})
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                entry['http'] = response.status
                raw = response.read(512 * 1024 + 1)
            value = json.loads(raw) if len(raw) <= 512 * 1024 else None
            if name == 'apps':
                entry['businessResult'] = isinstance(value, list)
                entry['count'] = len(value) if isinstance(value, list) else None
            else:
                entry['businessResult'] = isinstance(value, dict) and isinstance(value.get('result'), dict) and not value.get('error') and value.get('success', 0) == 0
                if isinstance(value, dict):
                    entry['success'] = value.get('success')
                    result = value.get('result') or {}
                    if name == 'inventory':
                        entry['count'] = len(result.get('devices') or [])
        except urllib.error.HTTPError as error:
            entry.update(http=error.code, businessResult=False)
        except (OSError, ValueError):
            entry.update(http=0, businessResult=False, error='unavailable_or_invalid_response')
        report['apis'][name] = entry
    env = dict(os.environ, NODE_PATH='/config/playwright-runner/node_modules', QS_PREFLIGHT_HOST=HOST,
               QS_PREFLIGHT_SID=sid, QS_PREFLIGHT_OUT=str(OUT.resolve()))
    ui = subprocess.run(['node', str(Path(__file__).with_name('home-current-readonly.cjs'))], env=env, timeout=100)
    report['uiExitCode'] = ui.returncode
finally:
    ubus('destroy', {'ubus_rpc_session': sid})
    report['sessionDestroyed'] = True
    (OUT / 'preflight.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
