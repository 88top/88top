#!/usr/bin/env python3
"""B-only read-only config check; allow one explicitly reviewed DHNS init."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shlex
import subprocess

p = argparse.ArgumentParser()
p.add_argument('output', type=Path)
p.add_argument('--allow-dhns-init', action='store_true')
p.add_argument('--stage', default='/root/quickstart-package-candidates/home-0162-eda99c4-r2')
a = p.parse_args()
assert not a.output.exists()
stage = a.stage
assert re.fullmatch(r'/root/quickstart-package-candidates/home-[a-z0-9-]+', stage), 'Invalid private B stage'


def remote(command, data=None):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5',
                                    'root@192.168.30.244', command], input=data, timeout=30)


digest = lambda value: hashlib.sha256(value).hexdigest()
report = {'host': '192.168.30.244', 'checks': [], 'normalizations': [], 'result': 'running'}
try:
    for name in ['home-before.sha256', 'config-before.sha256', 'business-before.sha256']:
        for line in remote('cat ' + shlex.quote(stage + '/' + name)).decode().splitlines():
            expected, path = line.split(None, 1)
            assert path.startswith(('/etc/config/', '/etc/quickstart/'))
            if expected == 'MISSING':
                remote('test ! -e ' + shlex.quote(path))
            else:
                assert re.fullmatch('[0-9a-f]{64}', expected)
                current = remote('cat ' + shlex.quote(path))
                if digest(current) != expected:
                    assert a.allow_dhns_init and path == '/etc/config/network', 'Configuration changed: ' + path
                    added = [part for part in current.splitlines(keepends=True)
                             if re.fullmatch(rb"[ \t]*list ports ['\"]dheth0['\"]\r?\n", part)]
                    assert len(added) == 1, 'DHNS exception requires exactly one known bridge-port line'
                    original = current.replace(added[0], b'', 1)
                    assert digest(original) == expected, 'Change extends beyond the reviewed DHNS init'
                    backup = stage + '/backup/network.before.recovered'
                    exists = subprocess.run(['ssh', '-o', 'BatchMode=yes', 'root@192.168.30.244',
                                             'test -e ' + shlex.quote(backup)], timeout=10).returncode == 0
                    if exists:
                        assert digest(remote('cat ' + shlex.quote(backup))) == expected
                    else:
                        remote('set -eu\numask 077\ntest ! -e ' + shlex.quote(backup)
                               + '\ncat > ' + shlex.quote(backup), original)
                    report['normalizations'].append({'path': path, 'beforeSha256': expected,
                                                     'afterSha256': digest(current),
                                                     'onlyChange': "list ports 'dheth0'",
                                                     'recoveredPrivateBackup': backup})
            report['checks'].append(path)
    before = remote('cat ' + shlex.quote(stage + '/default-route-before.txt'))
    after = remote('ip -4 route show default')
    assert before == after, 'Default route changed'
    assert b'inet 192.168.30.244/24' in remote('ip -4 addr show dev br-lan')
    report['defaultRoute'] = after.decode().strip()
    report['checks'].append('LAN address and default route unchanged')
    report['result'] = 'passed'
except Exception as error:
    report['result'] = 'failed'
    report['failure'] = str(error)
    raise
finally:
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False))
