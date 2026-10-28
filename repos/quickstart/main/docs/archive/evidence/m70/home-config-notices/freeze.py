#!/usr/bin/env python3
"""Freeze the tested frontend only; this is not a backend/package release."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).with_name('candidate.json')
assert not OUT.exists()
assert not subprocess.check_output(['git', 'diff', 'HEAD', '--', 'web'], cwd=ROOT), 'Commit tested frontend first'
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
archive = ROOT / 'web/dist/quickstart_web.zip'
with zipfile.ZipFile(archive) as bundle:
    hashes = {item.filename.removeprefix('luci-static/quickstart/'): hashlib.sha256(bundle.read(item)).hexdigest() for item in bundle.infolist() if not item.is_dir()}
target = ROOT / 'bin/previews' / commit[:7]
assert not target.exists()
target.mkdir()
shutil.copy2(archive, target / archive.name)
fingerprint = hashlib.sha256(''.join(hashes[name] for name in ['index.js', 'i18n/en.json', 'style.css', 'vendor.js']).encode()).hexdigest()[:12]
report = {'frontendGitSha': commit, 'archive': str(target / archive.name), 'hashes': hashes,
          'assetVersion': '0.16.6-test20261018-preview-' + commit[:7] + '-' + fingerprint,
          'scope': 'Frontend-only preview; actual A backend remains 0.14.0; no package release'}
OUT.write_text(json.dumps(report, indent=2) + '\n')
(target / 'MANIFEST').write_text('frontend_git_sha=' + commit + '\nasset_version=' + report['assetVersion'] + '\n' + '\n'.join('web.' + name.replace('/', '.') + '=' + value for name, value in hashes.items()) + '\n')
print(json.dumps({key: value for key, value in report.items() if key != 'hashes'}, indent=2))
