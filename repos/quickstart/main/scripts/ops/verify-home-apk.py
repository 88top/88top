#!/usr/bin/env python3
"""Read APK v3 metadata/payload with its SDK tool on the isolated builder."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shlex
import subprocess

p = argparse.ArgumentParser()
p.add_argument('build_id')
p.add_argument('runtime', type=Path)
p.add_argument('output', type=Path)
p.add_argument('--arch', choices=['x86_64', 'aarch64'], required=True)
p.add_argument('--package-release', default='2')
a = p.parse_args()
assert re.fullmatch(r'quickstart-home-[A-Za-z0-9._-]+', a.build_id)
assert not a.output.exists()
manifest = dict(line.split('=', 1) for line in (a.runtime / 'MANIFEST').read_text().splitlines())
assets = a.runtime / 'web/luci-static/quickstart'
expected = {str(f.relative_to(assets)): hashlib.sha256(f.read_bytes()).hexdigest()
            for f in assets.rglob('*') if f.is_file()}
config = {'build': a.build_id, 'arch': a.arch, 'release': a.package_release,
          'manifest': manifest, 'assets': expected}
program = r'''
import hashlib,json,struct,subprocess,tempfile
from pathlib import Path
c=CONFIG
base=Path('/builders/projects/quickstart-home-builder')
root=base/'releases'/c['build']
assert (root/'build.status').read_text().strip()=='status=success'
subprocess.run(['sha256sum','-c','SHA256SUMS'],cwd=root,check=True,stdout=subprocess.DEVNULL)
platform='rockchip-armv8' if c['arch']=='aarch64' else 'x86-64'
sdk=base/'state/sdk/apk'/('openwrt-sdk-25.12.2-'+platform+'_gcc-14.3.0_musl.Linux-x86_64')
tool=str(sdk/'staging_dir/host/bin/apk')
files=sorted((root/'apk').rglob('*.apk'))
assert len(files)==3
version=c['manifest']['version'].replace('-test','_git')+'-r'+c['release']
versions={'quickstart':version,'luci-app-quickstart':version,'quickstart-netpolicy':'0.2.0_git20260928-r'+c['release']}
seen=set(); report={'arch':c['arch'],'build':c['build'],'packages':[]}
digest=lambda b:hashlib.sha256(b).hexdigest()
for file in files:
 metadata=json.loads(subprocess.check_output([tool,'adbdump','--format','json',str(file)]))['info']
 name=metadata['name'];assert name in versions and name not in seen;seen.add(name)
 assert metadata['version']==versions[name],metadata
 arch='noarch' if name.startswith('luci-') else ('aarch64_generic' if c['arch']=='aarch64' else 'x86_64')
 assert metadata['arch']==arch,metadata
 with tempfile.TemporaryDirectory(prefix='verify-apk-',dir=base/'work') as temporary:
  target=Path(temporary)
  subprocess.run([tool,'--allow-untrusted','--network=no','extract','--no-chown','--destination',temporary,str(file)],check=True,stdout=subprocess.DEVNULL)
  binary=None
  if name=='quickstart':
   binary=(target/'usr/sbin/quickstart').read_bytes()
   assert digest(binary)==c['manifest']['quickstart.'+c['arch']]
   assert 'smartmontools-drivedb' in metadata['depends']
   keep=(target/'lib/upgrade/keep.d/quickstart').read_text().splitlines()
   assert all('/etc/quickstart/home-'+domain+'.json'+suffix in keep for domain in ['layout','launcher'] for suffix in ['', '.bak','.damaged','.bak.damaged'])
   assert all(not (target/('etc/quickstart/home-'+domain+'.json'+suffix)).exists() for domain in ['layout','launcher'] for suffix in ['', '.bak','.damaged','.bak.damaged'])
  elif name=='quickstart-netpolicy':
   binary=(target/'usr/bin/quickstart-netpolicy').read_bytes()
   m=json.loads((target/'usr/share/quickstart-netpolicy/manifest.json').read_text())
   assert m['product']==name and m['version']=='0.2.0-test20260928'
   assert m['target']==c['arch']+'-unknown-linux-musl' and m['binarySha256']==digest(binary)
  else:
   assets=target/'www/luci-static/quickstart'
   assert {str(f.relative_to(assets)) for f in assets.rglob('*') if f.is_file()}==set(c['assets'])
   for relative,sha in c['assets'].items():
    assert digest((target/'www/luci-static/quickstart'/relative).read_bytes())==sha,relative
   assert c['manifest']['asset_version'] in (target/'usr/lib/lua/luci/view/quickstart/main.htm').read_text()
  if binary:
   assert binary[:6]==b'\x7fELF\x02\x01'
   assert struct.unpack_from('<H',binary,18)[0]==(183 if c['arch']=='aarch64' else 62)
  report['packages'].append({'path':str(file.relative_to(root)),'sha256':digest(file.read_bytes()),'metadata':metadata,'elfSha256':digest(binary) if binary else None})
assert seen==set(versions)
report['result']='passed'
print(json.dumps(report))
'''.replace('CONFIG', repr(config), 1)
result = subprocess.check_output(['ssh', '-p', '7022', '-o', 'BatchMode=yes',
                                  'abc@192.168.9.19', 'python3 -c ' + shlex.quote(program)], text=True, timeout=180)
report = json.loads(result)
a.output.parent.mkdir(parents=True, exist_ok=True)
a.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'arch': a.arch, 'result': report['result'], 'packages': len(report['packages'])}))
