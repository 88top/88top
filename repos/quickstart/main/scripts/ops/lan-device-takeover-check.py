#!/usr/bin/env python3
"""Read-only current-version check. Creates and destroys only temporary auth sessions.

Run: rtk python3 scripts/ops/lan-device-takeover-check.py [output-directory]
A is deliberately excluded: its baseline is collected once, serially, by hand.
No device identity, session ID or credential is written into the evidence.
"""
import datetime
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/quickstart-takeover')
OUT.mkdir(parents=True, exist_ok=True)


def remote(host, command):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5',
                                    f'root@{host}', command], text=True, timeout=30)


def ubus(host, method, data):
    return remote(host, f'ubus -S call session {method} {shlex.quote(json.dumps(data))}')


report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'hosts': {}}
for host in ['192.168.30.244', '192.168.30.93']:
    entry = {'version': remote(host, '/usr/sbin/quickstart version').strip(), 'apis': {}}
    report['hosts'][host] = entry
    sid = json.loads(ubus(host, 'create', {'timeout': 300}))['ubus_rpc_session']
    try:
        ubus(host, 'set', {'ubus_rpc_session': sid, 'values': {'username': 'root', 'token': 'quickstart-readonly-audit'}})
        ubus(host, 'grant', {'ubus_rpc_session': sid, 'scope': 'ubus', 'objects': [['*', '*']]})
        # LuCI dispatcher and backend auth use different ACL scopes on some firmware.
        ubus(host, 'grant', {'ubus_rpc_session': sid, 'scope': 'access-group', 'objects': [['*', 'read']]})
        ubus(host, 'grant', {'ubus_rpc_session': sid, 'scope': 'uci', 'objects': [['*', 'read']]})
        for endpoint in ['devices', 'network-rules', 'device-traffic', 'router-context']:
            url = f'http://127.0.0.1:3038/cgi-bin/luci/istore/lanctrl/v2/{endpoint}/'
            header = f'-H {shlex.quote("X-Forwarded-Sid: " + sid)}' if host == '192.168.30.93' else ''
            try:
                raw = remote(host, f'curl -sS --max-time 10 {header} -w "\\n%{{http_code}}" {shlex.quote(url)}')
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
                entry['apis'][endpoint] = {'http': 0, 'businessResult': False, 'error': 'request_failed_or_timed_out'}
                continue
            body, status = raw.rsplit('\n', 1)
            api = {'http': int(status), 'businessResult': False}
            try:
                data = json.loads(body)
                api.update(success=data.get('success'), businessResult=isinstance(data.get('result'), dict) and not data.get('error') and (data.get('success') or 0) >= 0)
                result = data.get('result') or {}
                if endpoint == 'devices':
                    devices = result.get('devices', [])
                    api.update(deviceCount=len(devices), onlineCount=sum(bool(d.get('online')) for d in devices), health=result.get('health'))
                elif endpoint == 'device-traffic':
                    api.update(health=result.get('health'), itemCount=len(result.get('items', [])))
                elif endpoint == 'network-rules':
                    api['ruleCount'] = len(result.get('rules', []))
                else:
                    api['context'] = result
            except json.JSONDecodeError:
                api['error'] = body[:80]
            entry['apis'][endpoint] = api
        env = dict(os.environ, NODE_PATH='/config/playwright-runner/node_modules', QS_AUDIT_SID=sid,
                   QS_AUDIT_HOST=host, QS_AUDIT_OUT=str(OUT.resolve()))
        completed = subprocess.run(['node', str(ROOT / 'scripts/ops/lan-device-readonly-ui.cjs')], env=env, timeout=120)
        entry['uiExitCode'] = completed.returncode
    finally:
        ubus(host, 'destroy', {'ubus_rpc_session': sid})
        entry['sessionDestroyed'] = True
        (OUT / 'current-api.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
passed = all(a['businessResult'] for h in report['hosts'].values() for a in h['apis'].values())
for host in report['hosts']:
    ui_path = OUT / f'{host}-ui.json'
    if not ui_path.exists():
        passed = False
        continue
    ui = json.loads(ui_path.read_text())
    passed = passed and len(ui['views']) == 3 and not any(ui[k] for k in ['consoleErrors', 'requestFailures', 'badResponses'])
    passed = passed and all(v['currentDeviceSurface'] and v['navigated'] and not v['failureVisible'] and not v['overflow'] for v in ui['views'])
sys.exit(0 if passed else 1)
