#!/usr/bin/env python3
"""Inspect exact homepage IPKs without installing or extracting archive paths."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
import subprocess
import tarfile

p = argparse.ArgumentParser()
p.add_argument('build_root', type=Path)
p.add_argument('runtime', type=Path)
p.add_argument('output', type=Path)
p.add_argument('--arch', choices=['x86_64', 'aarch64'], required=True)
p.add_argument('--package-release', default='2')
a = p.parse_args()
assert not a.output.exists(), 'Evidence already exists'
assert (a.build_root / 'build.status').read_text().strip() == 'status=success'
subprocess.run(['sha256sum', '-c', 'SHA256SUMS'], cwd=a.build_root, check=True, stdout=subprocess.DEVNULL)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def members(blob):
    with tarfile.open(fileobj=io.BytesIO(blob), mode='r:*') as archive:
        return {m.name.removeprefix('./'): archive.extractfile(m).read()
                for m in archive.getmembers() if m.isfile()}


def unpack(file):
    if file.read_bytes()[:8] == b'!<arch>\n':
        names = subprocess.check_output(['ar', 't', str(file)], text=True).splitlines()
        outer = {n: subprocess.check_output(['ar', 'p', str(file), n]) for n in names}
    else:
        outer = members(file.read_bytes())
    control = members(next(v for k, v in outer.items() if k.startswith('control.tar')))
    data = members(next(v for k, v in outer.items() if k.startswith('data.tar')))
    fields = dict(line.split(': ', 1) for line in control['control'].decode().splitlines() if ': ' in line)
    return fields, control, data


manifest = dict(line.split('=', 1) for line in (a.runtime / 'MANIFEST').read_text().splitlines())
release = ('-r' if a.arch == 'aarch64' else '-') + a.package_release
expected_versions = {'quickstart': manifest['version'] + release,
                     'quickstart-netpolicy': '0.2.0-test20260928' + release,
                     'luci-app-quickstart': manifest['version'] + '-r' + a.package_release}
files = sorted((a.build_root / 'ipk').rglob('*.ipk'))
assert len(files) == 3, files
seen = set()
report = {'arch': a.arch, 'packages': []}
machine = {'x86_64': 62, 'aarch64': 183}[a.arch]
home_paths = {'/etc/quickstart/home-' + domain + '.json' + suffix
              for domain in ['layout', 'launcher'] for suffix in ['', '.bak', '.damaged', '.bak.damaged']}
for file in files:
    fields, control, data = unpack(file)
    name = fields['Package']
    assert name not in seen and name in expected_versions, name
    seen.add(name)
    assert fields['Version'] == expected_versions[name], fields
    expected_arch = 'all' if name.startswith('luci-') else ('aarch64_generic' if a.arch == 'aarch64' else a.arch)
    assert fields['Architecture'] == expected_arch, fields
    if name == 'quickstart':
        binary = data['usr/sbin/quickstart']
        assert binary == (a.runtime / ('quickstart.' + a.arch)).read_bytes()
        assert 'smartmontools-drivedb' in fields['Depends']
        # OpenWrt removes runtime-only paths from conffiles: the package must
        # not ship placeholder JSON (which would break missing-only migration).
        assert '/etc/config/quickstart' in set(control['conffiles'].decode().splitlines())
        assert all(path.removeprefix('/') not in data for path in home_paths)
        assert home_paths <= set(data['lib/upgrade/keep.d/quickstart'].decode().splitlines())
    elif name == 'quickstart-netpolicy':
        binary = data['usr/bin/quickstart-netpolicy']
        policy_manifest = json.loads(data['usr/share/quickstart-netpolicy/manifest.json'])
        assert policy_manifest['product'] == name
        assert policy_manifest['version'] == '0.2.0-test20260928'
        assert policy_manifest['target'] == a.arch + '-unknown-linux-musl'
        assert policy_manifest['binarySha256'] == digest(binary)
    else:
        binary = None
        assets = a.runtime / 'web/luci-static/quickstart'
        asset_prefix = 'www/luci-static/quickstart/'
        assert {key.removeprefix(asset_prefix) for key in data if key.startswith(asset_prefix)} == {
            str(source.relative_to(assets)) for source in assets.rglob('*') if source.is_file()}
        for source in assets.rglob('*'):
            if source.is_file():
                key = 'www/luci-static/quickstart/' + str(source.relative_to(assets))
                assert data[key] == source.read_bytes(), key
        template = data['usr/lib/lua/luci/view/quickstart/main.htm'].decode()
        assert manifest['asset_version'] in template
    if binary is not None:
        assert binary[:4] == b'\x7fELF' and binary[4] == 2 and binary[5] == 1
        assert struct.unpack_from('<H', binary, 18)[0] == machine
    report['packages'].append({'path': str(file), 'sha256': digest(file.read_bytes()),
                               'metadata': fields, 'elfSha256': digest(binary) if binary else None,
                               'payloadFileCount': len(data)})
assert seen == set(expected_versions)
a.output.parent.mkdir(parents=True, exist_ok=True)
a.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'arch': a.arch, 'packages': sorted(seen), 'result': 'passed'}))
