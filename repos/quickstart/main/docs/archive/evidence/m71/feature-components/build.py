#!/usr/bin/env python3
"""Freeze a clean candidate; preserve SDK/release semantics (local preview only)."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import zipfile

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
assert not subprocess.check_output(['git','diff','HEAD','--','backend','web'],cwd=ROOT)
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
assert 'BUILD_CACHE_WORK_DIR' in os.environ,'Run with the SSD wrapper'
build=Path(os.environ['BUILD_CACHE_WORK_DIR'])/('m71-backend-'+commit[:7])
build.mkdir(exist_ok=True)
log=HERE/'backend-build.log'
assert not log.exists()
with log.open('w') as output:
    result=subprocess.run(['make','build-amd64'],cwd=ROOT,env=dict(os.environ,BUILD_DIR=str(build)),stdout=output,stderr=subprocess.STDOUT)
assert result.returncode==0,'See backend-build.log'
binary=build/'quickstart.amd64'
version=subprocess.check_output([str(binary),'version','--more'],text=True).strip()
assert version.startswith('0.17.0-test20261022 '+commit)
candidate=ROOT/'bin/previews'/commit[:7]
assert not candidate.exists()
candidate.mkdir()
shutil.copy2(binary,candidate/'quickstart.x86_64')
shutil.copy2(ROOT/'web/dist/quickstart_web.zip',candidate/'quickstart_web.zip')
with zipfile.ZipFile(candidate/'quickstart_web.zip') as archive:
    hashes={item.filename.removeprefix('luci-static/quickstart/'):hashlib.sha256(archive.read(item)).hexdigest() for item in archive.infolist() if not item.is_dir()}
fingerprint=hashlib.sha256(''.join(hashes[name] for name in ['index.js','i18n/en.json','style.css','vendor.js']).encode()).hexdigest()[:12]
report={'commit':commit,'version':version,'candidate':str(candidate),'buildOutput':str(binary),'nodeModules':str((ROOT/'web/node_modules').resolve()),'webOutput':str(ROOT/'web/dist'),'hashes':hashes,'binarySHA':hashlib.sha256(binary.read_bytes()).hexdigest(),'assetVersion':'0.17.0-test20261022-preview-'+commit[:7]+'-'+fingerprint,'scope':'B local runtime/UI candidate; no SDK/package/push/release'}
(HERE/'candidate.json').write_text(json.dumps(report,indent=2)+'\n')
(candidate/'MANIFEST').write_text('git_sha='+commit+'\nasset_version='+report['assetVersion']+'\nquickstart.x86_64='+report['binarySHA']+'\n'+'\n'.join('web.'+name.replace('/','.')+'='+value for name,value in hashes.items())+'\n')
print(json.dumps({key:value for key,value in report.items() if key!='hashes'},indent=2))
