#!/usr/bin/env python3
"""Explicitly authorized A backend rollout; never run package/DHNS hooks."""
import hashlib
import json
from pathlib import Path
import shlex
import subprocess
import tarfile
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUT = HERE / 'deployment.json'
assert not OUT.exists()
RELEASE = ROOT / 'bin/releases/c9624a3'
ARCHIVE = RELEASE / 'quickstart-binary-0.16.6-test20261018.tar.gz'
MANIFEST = dict(line.split('=', 1) for line in (RELEASE / 'MANIFEST').read_text().splitlines())
assert MANIFEST['git_sha'] == 'c9624a38ffe11b45f484b2858ddf16088ae7a6a7'
assert not subprocess.check_output(['git', 'diff', MANIFEST['git_sha'], '--', 'backend'], cwd=ROOT)
assert hashlib.sha256(ARCHIVE.read_bytes()).hexdigest() == (RELEASE / (ARCHIVE.name + '.sha256')).read_text().split()[0]
with tarfile.open(ARCHIVE) as archive:
    data = archive.extractfile('quickstart-binary-0.16.6-test20261018/quickstart.x86_64').read()
assert data[:5] == b'\x7fELF\x02' and int.from_bytes(data[18:20], 'little') == 62
assert hashlib.sha256(data).hexdigest() == MANIFEST['quickstart.x86_64']
BACKUP = '/root/quickstart-backups/backend-c9624a3-20261022-r1'
BINARY = '/usr/sbin/quickstart'
TEMP = '/usr/sbin/quickstart.backend-c9624a3-new'
KEEP = '/lib/upgrade/keep.d/quickstart-home'
Q = shlex.quote
keep = ''.join('/etc/quickstart/home-' + domain + '.json' + suffix + '\n' for domain in ['layout', 'launcher'] for suffix in ['', '.bak', '.damaged', '.bak.damaged']).encode()


def remote(command, payload=None):
    if payload is None:
        payload = command.encode()
        command = 'sh -s'
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', 'root@192.168.30.1', command], input=payload, timeout=45)


def snapshot():
    return {
        'protected': remote('sha256sum /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /etc/init.d/quickstart /usr/lib/opkg/status /usr/lib/lua/luci/view/quickstart/main.htm /www/luci-static/quickstart/index.js /www/luci-static/quickstart/style.css /www/luci-static/quickstart/vendor.js /www/luci-static/quickstart/i18n/en.json').decode().splitlines(),
        'otherProcesses': remote('for name in netifd dnsmasq uhttpd odhcpd startdhns; do echo "$name"; pidof "$name" || true; done').decode().splitlines(),
        'defaultRoute': remote('ip -4 route show default').decode().strip(),
        'lanAddresses': remote('ip -4 -o addr show dev br-lan').decode().strip(),
        'namespaces': remote('ip netns list').decode().strip(),
    }


report = {'host': '192.168.30.1', 'runtimeVersion': MANIFEST['version'], 'backendGitSha': MANIFEST['git_sha'],
          'binarySHA': MANIFEST['quickstart.x86_64'], 'backup': BACKUP,
          'scope': 'Backend binary + homepage backup retention; restart only Quickstart, preserve frontend/network/packages', 'result': 'preparing'}
assert remote('uname -m').decode().strip() == 'x86_64'
report['oldVersion'] = remote(BINARY + ' version --more').decode().strip()
assert report['oldVersion'].startswith('0.14.0 b60f6e53')
report['oldSHA'] = remote('sha256sum ' + BINARY).decode().split()[0]
assert report['oldSHA'] == 'ff301c5ad570bc662a5218a43a0da649fae3ebdbf10c5e00f1d3bbf45026f11a'
report['oldPID'] = remote('pidof quickstart').decode().strip()
service = json.loads(remote('ubus -S call service list \'{"name":"quickstart"}\''))
instances = list(service['quickstart']['instances'].values())
assert len(instances) == 1 and instances[0]['command'] == [BINARY, 'serve', '--unix', '/var/run/quickstart/local.sock']
assert remote('uci -q get quickstart.main.disable_dhns || true').decode().strip() != '1'
assert not remote('pidof startdhns || true').strip()
assert not remote('ip netns list').strip()
remote('set -eu\ntest ! -e ' + Q(KEEP) + '\ntest ! -e ' + Q(TEMP))
report['before'] = snapshot()
remote('set -eu\numask 077\ntest ! -e ' + Q(BACKUP) + '\nmkdir -p ' + Q(BACKUP)
       + '\ncp -p ' + BINARY + ' ' + Q(BACKUP + '/quickstart')
       + '\ncp -a /etc/config ' + Q(BACKUP + '/config')
       + '\ncp -a /etc/quickstart ' + Q(BACKUP + '/quickstart-data'))
installed = False
try:
    remote('set -eu\ncat > ' + Q(TEMP) + '\nchmod 755 ' + Q(TEMP), data)
    assert remote('sha256sum ' + Q(TEMP)).decode().split()[0] == report['binarySHA']
    assert remote(Q(TEMP) + ' version --more').decode().strip().startswith(MANIFEST['version'] + ' ' + MANIFEST['git_sha'])
    remote('set -eu\nmv ' + Q(TEMP) + ' ' + BINARY)
    installed = True
    remote('/etc/init.d/quickstart restart')
    for attempt in range(12):
        time.sleep(1)
        raw = remote('ubus -S call service list \'{"name":"quickstart"}\'')
        state = json.loads(raw).get('quickstart', {}).get('instances', {})
        if any(instance.get('running') for instance in state.values()):
            break
    else:
        raise RuntimeError('Quickstart did not resume')
    pid = remote('pidof quickstart').decode().strip()
    assert pid.isdigit() and pid != report['oldPID']
    report['newPID'] = pid
    report['runningSHA'] = remote('sha256sum /proc/' + pid + '/exe').decode().split()[0]
    assert report['runningSHA'] == report['binarySHA']
    report['newVersion'] = remote(BINARY + ' version --more').decode().strip()
    report['localHealth'] = json.loads(remote('wget -q -T 5 -O - http://127.0.0.1:3038/cgi-bin/luci/istore/system/version/'))
    # Existing old package lacks the modern keep.d entry. Add only the eight
    # homepage paths; never edit opkg metadata or install empty JSON files.
    remote('set -eu\ncat > ' + Q(KEEP + '.new') + '\nchmod 644 ' + Q(KEEP + '.new') + '\nmv ' + Q(KEEP + '.new') + ' ' + Q(KEEP), keep)
    report['keepPaths'] = remote('cat ' + Q(KEEP)).decode().splitlines()
    report['after'] = snapshot()
    assert report['after'] == report['before'], 'Protected main-router state changed'
    report['result'] = 'passed'
except Exception as error:
    report['failure'] = str(error)
    report['result'] = 'failed'
    if installed:
        remote('set -eu\ncp -p ' + Q(BACKUP + '/quickstart') + ' ' + Q(TEMP) + '\nmv ' + Q(TEMP) + ' ' + BINARY + '\n/etc/init.d/quickstart restart')
        report['oldBackendRestored'] = True
    # Only remove this task's keep file; network configs are never restored or
    # overwritten on failure because a concurrent user may have changed them.
    remote('rm -f ' + Q(KEEP) + ' ' + Q(KEEP + '.new') + ' ' + Q(TEMP))
    raise
finally:
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
