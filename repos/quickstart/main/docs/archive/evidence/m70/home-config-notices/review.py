#!/usr/bin/env python3
"""A-only serial authenticated check; credentials stay in memory, no business writes."""
import json
import os
from pathlib import Path
import secrets
import shlex
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
OUT = ROOT / sys.argv[1]
assert not OUT.exists()
OUT.mkdir(parents=True)


def remote(command):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', 'root@192.168.30.1', 'sh -s'], input=command, text=True, timeout=25)


def ubus(method, body):
    raw = remote('ubus -S call session ' + method + ' ' + shlex.quote(json.dumps(body)))
    return json.loads(raw) if raw.strip() else {}


def snapshot():
    return remote('sha256sum /usr/sbin/quickstart /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /usr/lib/opkg/status; pidof quickstart; ip -4 route show default').strip().splitlines()


sid = None
report = {'host': '192.168.30.1', 'before': snapshot(), 'runtime': remote('/usr/sbin/quickstart version --more').strip()}
try:
    sid = ubus('create', {'timeout': 300})['ubus_rpc_session']
    ubus('set', {'ubus_rpc_session': sid, 'values': {'username': 'root', 'token': secrets.token_hex(16)}})
    for scope, objects in [('access-group', [['*', 'read']]), ('uci', [['*', 'read']]), ('ubus', [['luci', 'getFeatures'], ['file', 'list'], ['uci', 'changes']])]:
        ubus('grant', {'ubus_rpc_session': sid, 'scope': scope, 'objects': objects})
    env = dict(os.environ, NODE_PATH='/config/playwright-runner/node_modules', QS_NOTICE_SID=sid, QS_NOTICE_OUT=str(OUT))
    result = subprocess.run(['/var/cache/build-cache/run.sh', '--', 'node', str(ROOT / 'review.cjs')], env=env, timeout=180)
    report['exitCode'] = result.returncode
    report['after'] = snapshot()
    assert report['before'] == report['after']
    assert result.returncode == 0, 'Notice review failed; evidence retained'
    report['result'] = 'passed'
finally:
    if sid:
        ubus('destroy', {'ubus_rpc_session': sid})
        report['sessionsDestroyed'] = 1
    (OUT / 'device.json').write_text(json.dumps(report, indent=2) + '\n')
