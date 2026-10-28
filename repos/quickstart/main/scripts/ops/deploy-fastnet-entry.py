#!/usr/bin/env python3
"""B-only entry/meta candidate, preserving package records and running FastNet."""
import argparse
import hashlib
import json
from pathlib import Path
import shlex
import subprocess

p = argparse.ArgumentParser()
p.add_argument('script', type=Path)
p.add_argument('output', type=Path)
a = p.parse_args()
assert not a.output.exists()
source = a.script.read_bytes()
script_sha = hashlib.sha256(source).hexdigest()
stage = '/root/quickstart-fastnet-entry-' + script_sha[:12]
q = shlex.quote


def remote(command, data=None):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5',
                                    'root@192.168.30.244', command], input=data, timeout=30)


def snapshot():
    service = json.loads(remote('ubus -S call service list \'{"name":"fastnet"}\''))
    return {'configSha256': remote('sha256sum /etc/config/fastnet').decode().split()[0],
            'binarySha256': remote('sha256sum /usr/sbin/FastNet').decode().split()[0],
            'runningPIDs': sorted(i['pid'] for i in service.get('fastnet', {}).get('instances', {}).values() if i.get('running'))}


before = snapshot()
metadata = json.loads(remote('cat /usr/lib/opkg/meta/fastnet.json'))
assert metadata['name'] == 'fastnet' and metadata['entry'] == '/cgi-bin/luci/admin/services/fastnet'
assert metadata.get('uci') in (None, 'fastnet')
updated = {**metadata, 'uci': 'fastnet', 'flags': list(dict.fromkeys([*metadata.get('flags', []), 'entrysh']))}
report = {'result': 'running', 'host': '192.168.30.244', 'privateBackup': stage, 'before': before,
          'scriptSha256': script_sha, 'scope': 'Direct script and meta capability replacement only; package version records retained'}
try:
    remote('set -eu\numask 077\ntest ! -e ' + q(stage) + '\nmkdir ' + q(stage)
           + '\ncp -p /usr/lib/opkg/meta/fastnet.json ' + q(stage + '/fastnet.json.before')
           + '\nif test -f /usr/libexec/istoree/fastnet.sh; then cp -p /usr/libexec/istoree/fastnet.sh ' + q(stage + '/fastnet.sh.before') + '; fi')
    remote('cat > ' + q(stage + '/fastnet.sh.candidate'), source)
    remote('cat > ' + q(stage + '/fastnet.json.candidate'), (json.dumps(updated, ensure_ascii=False) + '\n').encode())
    # Stage in each destination directory so rename remains atomic.
    remote('set -eu\nmkdir -p /usr/libexec/istoree\ncp ' + q(stage + '/fastnet.sh.candidate')
           + ' /usr/libexec/istoree/.fastnet.candidate\nchmod 755 /usr/libexec/istoree/.fastnet.candidate\nmv /usr/libexec/istoree/.fastnet.candidate /usr/libexec/istoree/fastnet.sh\ncp '
           + q(stage + '/fastnet.json.candidate') + ' /usr/lib/opkg/meta/.fastnet.candidate\nchmod 644 /usr/lib/opkg/meta/.fastnet.candidate\nmv /usr/lib/opkg/meta/.fastnet.candidate /usr/lib/opkg/meta/fastnet.json')
    assert remote('sha256sum /usr/libexec/istoree/fastnet.sh').decode().split()[0] == script_sha
    report['status'] = json.loads(remote('/usr/libexec/istoree/fastnet.sh status'))
    assert report['status']['app'] == 'fastnet'
    report['after'] = snapshot()
    assert report['before'] == report['after'], 'FastNet config, binary or runtime PID changed'
    actual = json.loads(remote('cat /usr/lib/opkg/meta/fastnet.json'))
    assert actual == updated
    report['metaChanges'] = ['uci=fastnet', 'flags includes entrysh']
    report['installedMetaVersion'] = str(actual['version']) + '-r' + str(actual['release'])
    report['result'] = 'passed'
except Exception as e:
    report['result'] = 'failed'
    report['failure'] = str(e)
    raise
finally:
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))
