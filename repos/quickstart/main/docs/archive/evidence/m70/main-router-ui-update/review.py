#!/usr/bin/env python3
"""A-only root read session for actual UI review, always destroyed."""
import json
import os
from pathlib import Path
import secrets
import shlex
import subprocess

OUT = Path(__file__).resolve().parent
REVIEW = OUT / 'ui-r3'
assert not REVIEW.exists()
REVIEW.mkdir()


def remote(command):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', 'root@192.168.30.1', command], text=True, timeout=20)


def ubus(method, body):
    raw = remote('ubus -S call session ' + method + ' ' + shlex.quote(json.dumps(body)))
    return json.loads(raw) if raw.strip() else {}


def snapshot():
    return remote('sha256sum /usr/sbin/quickstart /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /usr/lib/opkg/status; pidof quickstart; ip -4 route show default').strip().splitlines()


sid = None
report = {'host': '192.168.30.1', 'scope': 'Authenticated actual UI; no application writes', 'before': snapshot()}
try:
    sid = ubus('create', {'timeout': 300})['ubus_rpc_session']
    ubus('set', {'ubus_rpc_session': sid, 'values': {'username': 'root', 'token': secrets.token_hex(16)}})
    for scope, objects in [('access-group', [['*', 'read']]), ('uci', [['*', 'read']]), ('ubus', [['luci', 'getFeatures'], ['file', 'list'], ['uci', 'changes']])]:
        ubus('grant', {'ubus_rpc_session': sid, 'scope': scope, 'objects': objects})
    env = dict(os.environ, NODE_PATH='/config/playwright-runner/node_modules', QS_MAIN_SID=sid, QS_MAIN_OUT=str(REVIEW))
    result = subprocess.run(['/var/cache/build-cache/run.sh', '--', 'node', str(OUT / 'review.cjs')], env=env, timeout=180)
    report['uiExitCode'] = result.returncode
    report['after'] = snapshot()
    assert report['before'] == report['after']
    assert result.returncode == 0, 'UI review failed; preserve screenshots/report'
    report['result'] = 'passed'
finally:
    if sid:
        ubus('destroy', {'ubus_rpc_session': sid})
        report['sessionsDestroyed'] = 1
    (OUT / 'ui-session-r3.json').write_text(json.dumps(report, indent=2) + '\n')
