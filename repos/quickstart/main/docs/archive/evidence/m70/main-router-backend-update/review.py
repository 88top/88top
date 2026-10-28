#!/usr/bin/env python3
"""Current A API + UI check. Only POST is unchanged homepage configuration."""
import hashlib
import json
import os
from pathlib import Path
import secrets
import shlex
import subprocess
import urllib.request

HERE = Path(__file__).resolve().parent
OUT = HERE / 'actual-r1'
assert not OUT.exists()
OUT.mkdir()
BASE = 'http://192.168.30.1'
SID = None


def remote(command):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', 'root@192.168.30.1', 'sh -s'], input=command, text=True, timeout=30)


def ubus(method, body):
    text = remote('ubus -S call session ' + method + ' ' + shlex.quote(json.dumps(body)))
    return json.loads(text) if text.strip() else {}


def api(path, payload=None):
    request = urllib.request.Request(BASE + '/cgi-bin/luci/istore' + path,
                                    data=json.dumps(payload).encode() if payload is not None else None,
                                    headers={'Cookie': 'sysauth_http=' + SID, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=15) as response:
        assert response.status == 200
        body = json.load(response)
        assert not body.get('error') and body.get('success') in [None, 0]
        return body['result']


def file_state():
    return remote('sha256sum /etc/quickstart/home-layout.json /etc/quickstart/home-launcher.json; stat -c "%i:%Y:%s:%a" /etc/quickstart/home-layout.json /etc/quickstart/home-launcher.json').strip().splitlines()


def protected():
    commands = ['sha256sum /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /etc/init.d/quickstart /usr/lib/opkg/status /usr/lib/lua/luci/view/quickstart/main.htm /www/luci-static/quickstart/index.js /www/luci-static/quickstart/style.css /www/luci-static/quickstart/vendor.js /www/luci-static/quickstart/i18n/en.json',
                'for name in netifd dnsmasq uhttpd odhcpd startdhns; do echo "$name"; pidof "$name" || true; done',
                'ip -4 route show default', 'ip -4 -o addr show dev br-lan', 'ip netns list']
    result = [remote(command).strip().splitlines() for command in commands]
    return result


report = {'host': '192.168.30.1', 'result': 'running', 'scope': 'Actual APIs, unchanged home saves, existing LAN reads and readonly UI'}
report['before'] = protected()
try:
    SID = ubus('create', {'timeout': 300})['ubus_rpc_session']
    ubus('set', {'ubus_rpc_session': SID, 'values': {'username': 'root', 'token': secrets.token_hex(16)}})
    for scope, objects in [('access-group', [['*', 'read']]), ('uci', [['*', 'read']]), ('ubus', [['luci', 'getFeatures'], ['file', 'list'], ['uci', 'changes']])]:
        ubus('grant', {'ubus_rpc_session': SID, 'scope': scope, 'objects': objects})
    values = {}
    report['domains'] = {}
    # First authenticated GET initializes only missing domains using the
    # production one-time migration. Never replace an existing configuration.
    for domain in ['layout', 'launcher']:
        current = api('/home/v1/' + domain + '/')
        assert current['state'] == 'saved'
        values[domain] = current
        disk = json.loads(remote('cat /etc/quickstart/home-' + domain + '.json'))
        assert current['version'] == disk['generation'] + ':' + str(disk['revision'])
        assert current['value'] == disk['value']
        report['domains'][domain] = {'state': current['state'], 'version': current['version'], 'schemaVersion': current['value']['schemaVersion'], 'diskMatches': True, 'migration': disk.get('migration')}
    report['filesBeforeNoop'] = file_state()
    for domain, current in values.items():
        saved = api('/home/v1/' + domain + '/', {'expectedVersion': current['version'], 'value': current['value']})
        assert saved == current, 'Unchanged save must preserve version and value'
        assert api('/home/v1/' + domain + '/') == current
        report['domains'][domain]['unchangedSaveVerified'] = True
    report['filesAfterNoop'] = file_state()
    assert report['filesBeforeNoop'] == report['filesAfterNoop'], 'Unchanged saves rewrote files'
    context = api('/lanctrl/v2/router-context/')
    dhcp = api('/lanctrl/v2/lan-dhcp-settings/')
    devices = api('/lanctrl/v2/devices/')
    assert context['dhcpAuthority'] == 'local' and context['routeEditability']['editable'] is True
    assert dhcp['editable'] is True and dhcp['settings']['poolStart'] == '192.168.30.2' and dhcp['settings']['poolEnd'] == '192.168.30.249'
    report['lan'] = {'dhcpAuthority': context['dhcpAuthority'], 'routeEditable': context['routeEditability']['editable'], 'dhcp': dhcp['settings'], 'deviceCount': len(devices['devices'])}
    keep = remote('sysupgrade -l').splitlines()
    report['backupCoverage'] = {path: path in keep for path in ['/etc/quickstart/home-layout.json', '/etc/quickstart/home-launcher.json']}
    assert all(report['backupCoverage'].values())
    env = dict(os.environ, NODE_PATH='/config/playwright-runner/node_modules', QS_BACKEND_SID=SID, QS_BACKEND_OUT=str(OUT))
    test = subprocess.run(['/var/cache/build-cache/run.sh', '--', 'node', str(HERE / 'review.cjs')], env=env, timeout=150)
    report['uiExitCode'] = test.returncode
    assert test.returncode == 0, 'Actual UI failed'
    report['filesAfterUI'] = file_state()
    assert report['filesAfterUI'] == report['filesAfterNoop'], 'Readonly UI rewrote homepage'
    report['after'] = protected()
    assert report['after'] == report['before'], 'Protected state changed'
    report['runtime'] = remote('/usr/sbin/quickstart version --more').strip()
    report['pid'] = remote('pidof quickstart').strip()
    report['runningSHA'] = remote('sha256sum /proc/' + report['pid'] + '/exe').split()[0]
    assert report['runningSHA'] == json.loads((HERE / 'deployment.json').read_text())['binarySHA']
    report['result'] = 'passed'
finally:
    if SID:
        ubus('destroy', {'ubus_rpc_session': SID})
        report['sessionsDestroyed'] = 1
    (OUT / 'device.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
