#!/usr/bin/env python3
"""Low-frequency, serial, read-only A compatibility check; destroy root session."""
import datetime
import json
from pathlib import Path
import secrets
import shlex
import subprocess
import time
import urllib.error
import urllib.request

HOST = '192.168.30.1'
OUT = Path(__file__).with_name('preflight.json')
assert not OUT.exists()


def remote(command):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', 'root@' + HOST, command], text=True, timeout=20)


def ubus(method, body):
    text = remote('ubus -S call session ' + method + ' ' + shlex.quote(json.dumps(body)))
    return json.loads(text) if text.strip() else {}


report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'host': HOST,
          'scope': 'Read-only compatibility; no deployment, configuration or service changes', 'apis': []}
sid = None
try:
    report['board'] = json.loads(remote('ubus -S call system board'))
    report['runtime'] = remote('/usr/sbin/quickstart version --more').strip()
    report['before'] = remote('sha256sum /usr/sbin/quickstart /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /usr/lib/opkg/status; pidof quickstart; ip -4 route show default').strip().splitlines()
    template = remote('cat /usr/lib/lua/luci/view/quickstart/main.htm')
    report['templateFeatures'] = {name: name in template for name in ['asset_version', 'vue_base', 'vue_lang', 'quickstart_features', 'quickstart_configs']}
    sid = ubus('create', {'timeout': 300})['ubus_rpc_session']
    ubus('set', {'ubus_rpc_session': sid, 'values': {'username': 'root', 'token': secrets.token_hex(16)}})
    for scope, objects in [('access-group', [['*', 'read']]), ('uci', [['*', 'read']]), ('ubus', [['luci', 'getFeatures'], ['file', 'list'], ['uci', 'changes']])]:
        ubus('grant', {'ubus_rpc_session': sid, 'scope': scope, 'objects': objects})
    for endpoint in ['/home/v1/layout/', '/home/v1/launcher/', '/lanctrl/v2/router-context/', '/lanctrl/v2/lan-dhcp-settings/', '/lanctrl/globalConfigs/', '/lanctrl/v2/devices/', '/lanctrl/v2/gateway-targets/']:
        request = urllib.request.Request('http://' + HOST + '/cgi-bin/luci/istore' + endpoint, headers={'Cookie': 'sysauth_http=' + sid})
        item = {'path': endpoint}
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                item['http'] = response.status
                item['contentType'] = response.headers.get('Content-Type')
                body = json.load(response)
                item['success'] = body.get('success')
                item['error'] = body.get('error')
                result = body.get('result')
                item['resultKeys'] = list(result) if isinstance(result, dict) else type(result).__name__
                if endpoint.endswith('/router-context/') and isinstance(result, dict):
                    item['role'] = {k: result.get(k) for k in ['dhcpAuthority', 'topologyPosition', 'routeEditability']}
                if endpoint.endswith('/lan-dhcp-settings/') and isinstance(result, dict):
                    item['editable'] = result.get('editable')
        except urllib.error.HTTPError as error:
            item['http'] = error.code
            item['bodyExcerpt'] = error.read(180).decode(errors='replace')
        except Exception as error:
            item['failure'] = str(error)
        report['apis'].append(item)
        time.sleep(0.4)
    report['after'] = remote('sha256sum /usr/sbin/quickstart /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /usr/lib/opkg/status; pidof quickstart; ip -4 route show default').strip().splitlines()
    assert report['before'] == report['after'], 'Protected A state changed'
    report['compatible'] = all(x.get('http') == 200 and not x.get('error') and x.get('resultKeys') not in [None, 'NoneType'] for x in report['apis'])
finally:
    if sid:
        ubus('destroy', {'ubus_rpc_session': sid})
        report['sessionsDestroyed'] = 1
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
