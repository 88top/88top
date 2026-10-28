#!/usr/bin/env python3
"""Task-scoped B frontend replacement, with private backup and no service reload."""
import hashlib
import json
from pathlib import Path
import re
import shlex
import subprocess
import sys
import zipfile

candidate = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2])
assert not output.exists()
manifest = dict(line.split('=', 1) for line in (candidate / 'MANIFEST').read_text().splitlines())
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
assert manifest['frontend_git_sha'] == commit
assert not subprocess.check_output(['git', 'status', '--porcelain'], text=True).strip(), 'Freeze a clean source before deployment'
short = commit[:7]
assert re.fullmatch(r'[0-9a-f]{7}', short)
backup = '/root/quickstart-backups/home-0166-time-' + short + '-r2'
template = '/usr/lib/lua/luci/view/quickstart/main.htm'
web = '/www/luci-static/quickstart/'
quote = shlex.quote
asset_key = lambda name: 'web.' + name.replace('/', '.')


def remote(command, data=None):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5',
                                    'root@192.168.30.244', command], input=data, timeout=30)


def snapshot():
    service = json.loads(remote('ubus -S call service list \'{"name":"fastnet"}\''))
    return {'quickstartPIDs': remote('pidof quickstart').decode().split(),
            'startdhnsPIDs': remote('pidof startdhns').decode().split(),
            'fastnetPIDs': sorted(i['pid'] for i in service.get('fastnet', {}).get('instances', {}).values() if i.get('running')),
            'protected': remote('sha256sum /usr/sbin/quickstart /usr/bin/quickstart-netpolicy /usr/sbin/FastNet /etc/config/fastnet /usr/libexec/istoree/fastnet.sh /usr/lib/opkg/status').decode().splitlines(),
            'defaultRoute': remote('ip -4 route show default').decode().strip(),
            'policyEnabled': remote('uci -q get quickstart-netpolicy.main.enabled').decode().strip(),
            'policyPIDs': remote('pidof quickstart-netpolicy || true').decode().split()}


report = {'host': '192.168.30.244', 'frontendGitSha': commit, 'assetVersion': manifest['asset_version'],
          'privateBackup': backup, 'scope': 'Frontend files/cache key only; no package installation or service reload',
          'result': 'running', 'updated': []}
report['before'] = snapshot()
assert report['before']['policyEnabled'] == '0' and not report['before']['policyPIDs']
old_manifest = dict(line.split('=', 1) for line in Path('bin/previews/48b4a95/MANIFEST').read_text().splitlines())
for name in ['index.js', 'style.css', 'vendor.js', 'i18n/en.json']:
    assert remote('sha256sum ' + quote(web + name)).decode().split()[0] == old_manifest[asset_key(name)], 'Current B frontend changed since preflight'
original_template = remote('cat ' + quote(template))
updated_template, count = re.subn(rb'local asset_version = "[^"]+"', b'local asset_version = "' + manifest['asset_version'].encode() + b'"', original_template)
assert count == 1
remote('set -eu\numask 077\ntest ! -e ' + quote(backup) + '\nmkdir -p ' + quote(backup)
       + '\ncp -a ' + quote(web.rstrip('/')) + ' ' + quote(backup + '/web')
       + '\ncp -p ' + quote(template) + ' ' + quote(backup + '/main.htm'))
try:
    with zipfile.ZipFile(candidate / 'quickstart_web.zip') as archive:
        for name in ['style.css', 'index.js', 'vendor.js', 'i18n/en.json']:
            data = archive.read('luci-static/quickstart/' + name)
            assert hashlib.sha256(data).hexdigest() == manifest[asset_key(name)]
            if manifest[asset_key(name)] == old_manifest[asset_key(name)]:
                continue
            target = web + name
            temporary = target + '.time-' + short
            remote('set -eu\ntest ! -e ' + quote(temporary) + '\ncat > ' + quote(temporary), data)
            remote('set -eu\nchmod 644 ' + quote(temporary) + '\nmv ' + quote(temporary) + ' ' + quote(target))
            report['updated'].append(name)
    temporary = template + '.time-' + short
    remote('set -eu\ntest ! -e ' + quote(temporary) + '\ncat > ' + quote(temporary), updated_template)
    remote('set -eu\nchmod 644 ' + quote(temporary) + '\nmv ' + quote(temporary) + ' ' + quote(template))
    for name in ['index.js', 'style.css', 'vendor.js', 'i18n/en.json']:
        assert remote('sha256sum ' + quote(web + name)).decode().split()[0] == manifest[asset_key(name)]
    report['after'] = snapshot()
    assert report['before'] == report['after'], 'Protected configuration/process/package state changed'
    report['result'] = 'passed'
except Exception as error:
    report['result'] = 'failed'
    report['failure'] = str(error)
    for name in report['updated']:
        remote('cp -p ' + quote(backup + '/web/' + name) + ' ' + quote(web + name))
    remote('cp -p ' + quote(backup + '/main.htm') + ' ' + quote(template))
    report['frontendRolledBack'] = True
    raise
finally:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
