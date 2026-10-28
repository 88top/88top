#!/usr/bin/env python3
"""Remove only the two empty/default files created by the bounded B rehearsal."""
import hashlib
import json
from pathlib import Path
import shlex
import subprocess

HERE=Path(__file__).resolve().parent
OUT=HERE/'enable-artifact-cleanup.json'
assert not OUT.exists()

def remote(command):
    return subprocess.check_output(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=5','root@192.168.30.244','sh -s'],input=command.encode(),timeout=20)

assert not remote('pidof quickstart-netpolicy || true').strip()
assert remote('uci -q get quickstart-netpolicy.main.enabled').strip()==b'0'
items=[]
for name in ['hostname_bindings.txt','rate_limit_policy.txt']:
    path='/usr/share/quickstart-netpolicy/'+name
    data=remote('cat '+shlex.quote(path))
    assert data==b'' if name=='hostname_bindings.txt' else data.strip()==b'false\n0 0','Unexpected non-default policy file; retain it'
    items.append({'path':path,'size':len(data),'sha256':hashlib.sha256(data).hexdigest()})
for item in items:
    path=shlex.quote(item['path'])
    assert remote('sha256sum '+path).decode().split()[0]==item['sha256']
    remote('rm '+path)
report={'host':'192.168.30.244','removed':items,'remaining':remote('find /usr/share/quickstart-netpolicy -type f').decode().strip().splitlines(),'result':'passed','note':'Both files were absent before the enable rehearsal; native service is stopped and main.enabled=0. Only empty bindings and disabled/zero default policy were removed.'}
OUT.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
