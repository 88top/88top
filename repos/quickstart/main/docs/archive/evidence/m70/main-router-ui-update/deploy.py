#!/usr/bin/env python3
"""A-only frontend update authorized for role review. No service/config writes."""
import datetime
import hashlib
import io
import json
from pathlib import Path
import re
import shlex
import subprocess
import tarfile
import zipfile

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).with_name('deployment-r2.json')
assert not OUT.exists()
CANDIDATE = ROOT / 'bin/previews/9f31d4f'
MANIFEST = dict(line.split('=', 1) for line in (CANDIDATE / 'MANIFEST').read_text().splitlines())
assert MANIFEST['frontend_git_sha'] == '9f31d4f756e28efa34def21e74b603f1568e8665'
assert not subprocess.check_output(['git', 'diff', MANIFEST['frontend_git_sha'], '--', 'web'], cwd=ROOT), 'Frontend source changed'
WEB = '/www/luci-static/quickstart'
TEMPLATE = '/usr/lib/lua/luci/view/quickstart/main.htm'
BACKUP = '/root/quickstart-backups/main-ui-9f31d4f-20261022-r2'
Q = shlex.quote


def remote(command, data=None):
    if data is None:
        data = command.encode()
        command = 'sh -s'
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', 'root@192.168.30.1', command], input=data, timeout=60)


def snapshot():
    return remote('sha256sum /usr/sbin/quickstart /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /usr/lib/opkg/status; pidof quickstart; ip -4 route show default').decode().strip().splitlines()


report = {'host': '192.168.30.1', 'time': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'frontendGitSha': MANIFEST['frontend_git_sha'], 'assetVersion': MANIFEST['asset_version'],
          'scope': 'Frontend/static resources and template cache key only; no package, backend, configuration or service changes',
          'knownLimitation': 'Backend 0.14.0 has no home/v1 persistence: built-in temporary homepage, configuration saves disabled',
          'backup': BACKUP, 'result': 'preparing'}
report['before'] = snapshot()
assert report['before'] == json.loads(OUT.with_name('preflight.json').read_text())['after']
original = remote('cat ' + Q(TEMPLATE))
template, count = re.subn(rb'local asset_version = "[^"]+"', b'local asset_version = "' + MANIFEST['asset_version'].encode() + b'"', original)
assert count == 1
files = {}
with zipfile.ZipFile(CANDIDATE / 'quickstart_web.zip') as archive:
    for info in archive.infolist():
        if info.is_dir():
            continue
        assert info.filename.startswith('luci-static/quickstart/')
        name = info.filename.removeprefix('luci-static/quickstart/')
        assert re.fullmatch(r'[A-Za-z0-9_./-]+', name) and '..' not in name.split('/')
        files[name] = archive.read(info)
for name in ['index.js', 'vendor.js', 'style.css', 'i18n/en.json']:
    assert hashlib.sha256(files[name]).hexdigest() == MANIFEST['web.' + name.replace('/', '.')]
report['expectedHashes'] = {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}
remote('set -eu\numask 077\ntest ! -e ' + Q(BACKUP) + '\nmkdir -p ' + Q(BACKUP + '/stage')
       + '\ncp -a ' + Q(WEB) + ' ' + Q(BACKUP + '/web') + '\ncp -p ' + Q(TEMPLATE) + ' ' + Q(BACKUP + '/main.htm'))
try:
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode='w:gz') as archive:
        for name, data in {**files, '_main.htm': template}.items():
            info = tarfile.TarInfo(name)
            info.size = len(data)
            info.mode = 0o644
            archive.addfile(info, io.BytesIO(data))
    remote('tar -xzf - -C ' + Q(BACKUP + '/stage'), buffer.getvalue())
    # Each file is renamed into place. The template cache key changes last.
    commands = ['set -eu']
    for name in files:
        target = WEB + '/' + name
        commands += ['mkdir -p ' + Q(str(Path(target).parent)),
                     'cp ' + Q(BACKUP + '/stage/' + name) + ' ' + Q(target + '.main-ui-new'),
                     'chmod 644 ' + Q(target + '.main-ui-new'),
                     'mv ' + Q(target + '.main-ui-new') + ' ' + Q(target)]
    commands += ['cp ' + Q(BACKUP + '/stage/_main.htm') + ' ' + Q(TEMPLATE + '.main-ui-new'),
                 'chmod 644 ' + Q(TEMPLATE + '.main-ui-new'),
                 'mv ' + Q(TEMPLATE + '.main-ui-new') + ' ' + Q(TEMPLATE)]
    remote('\n'.join(commands))
    actual = remote('sha256sum ' + ' '.join(Q(WEB + '/' + name) for name in files)).decode().splitlines()
    report['installedHashes'] = {line.split()[1].removeprefix(WEB + '/'): line.split()[0] for line in actual}
    assert report['installedHashes'] == report['expectedHashes']
    assert remote('cat ' + Q(TEMPLATE)) == template
    report['after'] = snapshot()
    assert report['after'] == report['before'], 'Protected router state changed'
    report['result'] = 'passed'
except Exception as error:
    report['result'] = 'failed'
    report['failure'] = str(error)
    commands = ['set -eu']
    for name in files:
        backup = BACKUP + '/web/' + name
        target = WEB + '/' + name
        commands.append('if test -f ' + Q(backup) + '; then cp -p ' + Q(backup) + ' ' + Q(target) + '; else rm -f ' + Q(target) + '; fi')
    commands.append('cp -p ' + Q(BACKUP + '/main.htm') + ' ' + Q(TEMPLATE))
    remote('\n'.join(commands))
    report['frontendRestored'] = True
    raise
finally:
    OUT.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key not in ['expectedHashes', 'installedHashes']}, indent=2))
