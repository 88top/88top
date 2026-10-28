#!/usr/bin/env python3
"""Only replace A frontend/key after checking the preceding installed candidate."""
import hashlib
import io
import json
from pathlib import Path
import re
import shlex
import subprocess
import tarfile
import zipfile

HERE = Path(__file__).resolve().parent
OUT = HERE / 'deployment.json'
assert not OUT.exists()
CANDIDATE = json.loads((HERE / 'candidate.json').read_text())
OLD = json.loads((HERE.parent / 'main-router-ui-update/deployment-r2.json').read_text())
assert OLD['result'] == 'passed'
WEB = '/www/luci-static/quickstart/'
TEMPLATE = '/usr/lib/lua/luci/view/quickstart/main.htm'
BACKUP = '/root/quickstart-backups/config-notice-' + CANDIDATE['frontendGitSha'][:7]
Q = shlex.quote


def remote(command, data=None):
    if data is None:
        data = command.encode()
        command = 'sh -s'
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', 'root@192.168.30.1', command], input=data, timeout=45)


def snapshot():
    return remote('sha256sum /usr/sbin/quickstart /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /usr/lib/opkg/status; pidof quickstart; ip -4 route show default').decode().strip().splitlines()


def hashes():
    return {line.split()[1].removeprefix(WEB): line.split()[0] for line in remote('sha256sum ' + ' '.join(Q(WEB + name) for name in CANDIDATE['hashes'])).decode().splitlines()}


assert set(CANDIDATE['hashes']) == set(OLD['expectedHashes'])
changed = [name for name, value in CANDIDATE['hashes'].items() if value != OLD['expectedHashes'][name]]
assert set(changed) <= {'index.js', 'style.css', 'vendor.js', 'i18n/en.json'}
assert hashes() == OLD['expectedHashes'], 'A changed since previous deployment'
report = {'host': '192.168.30.1', 'scope': 'Only changed frontend files and cache key; no backend/package/config/service changes',
          'frontendGitSha': CANDIDATE['frontendGitSha'], 'assetVersion': CANDIDATE['assetVersion'],
          'backup': BACKUP, 'changed': changed, 'before': snapshot(), 'result': 'preparing'}
assert report['before'] == OLD['after'], 'Protected A state changed'
original = remote('cat ' + Q(TEMPLATE))
assert OLD['assetVersion'].encode() in original
template, count = re.subn(rb'local asset_version = "[^"]+"', b'local asset_version = "' + CANDIDATE['assetVersion'].encode() + b'"', original)
assert count == 1
remote('set -eu\numask 077\ntest ! -e ' + Q(BACKUP) + '\nmkdir -p ' + Q(BACKUP + '/stage') + '\ncp -a ' + Q(WEB.rstrip('/')) + ' ' + Q(BACKUP + '/web') + '\ncp -p ' + Q(TEMPLATE) + ' ' + Q(BACKUP + '/main.htm'))
try:
    payload = io.BytesIO()
    with zipfile.ZipFile(CANDIDATE['archive']) as bundle, tarfile.open(fileobj=payload, mode='w:gz') as archive:
        for name in changed + ['_main.htm']:
            data = template if name == '_main.htm' else bundle.read('luci-static/quickstart/' + name)
            if name != '_main.htm':
                assert hashlib.sha256(data).hexdigest() == CANDIDATE['hashes'][name]
            info = tarfile.TarInfo(name)
            info.size = len(data)
            info.mode = 0o644
            archive.addfile(info, io.BytesIO(data))
    remote('tar -xzf - -C ' + Q(BACKUP + '/stage'), payload.getvalue())
    commands = ['set -eu']
    for name, target in [(name, WEB + name) for name in changed] + [('_main.htm', TEMPLATE)]:
        commands += ['cp ' + Q(BACKUP + '/stage/' + name) + ' ' + Q(target + '.notice-new'), 'chmod 644 ' + Q(target + '.notice-new'), 'mv ' + Q(target + '.notice-new') + ' ' + Q(target)]
    remote('\n'.join(commands))
    report['installedHashes'] = hashes()
    assert report['installedHashes'] == CANDIDATE['hashes']
    assert remote('cat ' + Q(TEMPLATE)) == template
    report['after'] = snapshot()
    assert report['before'] == report['after']
    report['result'] = 'passed'
except Exception as error:
    report['result'] = 'failed'
    report['failure'] = str(error)
    remote('set -eu\n' + '\n'.join('cp -p ' + Q(BACKUP + '/web/' + name) + ' ' + Q(WEB + name) for name in changed) + '\ncp -p ' + Q(BACKUP + '/main.htm') + ' ' + Q(TEMPLATE))
    report['frontendRestored'] = True
    raise
finally:
    OUT.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key != 'installedHashes'}, indent=2))
