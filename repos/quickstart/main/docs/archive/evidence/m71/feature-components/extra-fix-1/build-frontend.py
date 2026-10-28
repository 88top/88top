#!/usr/bin/env python3
"""Freeze only this UI candidate; retain the already-checked abfe06f backend."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import zipfile

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
assert not subprocess.check_output(['git','status','--porcelain'],cwd=ROOT),'Commit the candidate first'
assert 'BUILD_CACHE_WORK_DIR' in os.environ,'Use the SSD wrapper'
assert not subprocess.check_output(['git','diff','abfe06f','--','backend'],cwd=ROOT),'Backend changed; do not reuse its old candidate'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
assert not (HERE/'candidate.json').exists()
with (HERE/'web-build.log').open('w') as output:
    result=subprocess.run(['make','build-web'],cwd=ROOT,stdout=output,stderr=subprocess.STDOUT)
assert result.returncode==0,'See web-build.log'
candidate=ROOT/'bin/previews'/commit[:7]
assert not candidate.exists()
candidate.mkdir()
shutil.copy2(ROOT/'web/dist/quickstart_web.zip',candidate/'quickstart_web.zip')
with zipfile.ZipFile(candidate/'quickstart_web.zip') as archive:
    hashes={item.filename.removeprefix('luci-static/quickstart/'):hashlib.sha256(archive.read(item)).hexdigest() for item in archive.infolist() if not item.is_dir()}
fingerprint=hashlib.sha256(''.join(hashes[name] for name in ['index.js','i18n/en.json','style.css','vendor.js']).encode()).hexdigest()[:12]
backend=json.loads((HERE.parent/'candidate.json').read_text())
report={'commit':commit,'candidate':str(candidate),'backendCommit':backend['commit'],'backendSHA':backend['binarySHA'],'backendVersion':backend['version'],'webOutput':str(ROOT/'web/dist'),'nodeModules':str((ROOT/'web/node_modules').resolve()),'hashes':hashes,'assetVersion':'0.17.0-test20261022-preview-'+commit[:7]+'-'+fingerprint,'scope':'B frontend only; backend source matches abfe06f; no SDK/package/restart'}
(HERE/'candidate.json').write_text(json.dumps(report,indent=2)+'\n')
(candidate/'MANIFEST').write_text('git_sha='+commit+'\nasset_version='+report['assetVersion']+'\nbackend.git_sha='+backend['commit']+'\n'+'\n'.join('web.'+name.replace('/','.')+'='+value for name,value in hashes.items())+'\n')
print(json.dumps({key:value for key,value in report.items() if key!='hashes'},indent=2))
