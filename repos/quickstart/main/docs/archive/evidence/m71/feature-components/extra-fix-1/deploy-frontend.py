#!/usr/bin/env python3
"""B-only atomic per-file frontend/cache-key update, no service restart."""
import hashlib
import io
import json
from pathlib import Path
import re
import shlex
import subprocess
import tarfile
import urllib.request
import zipfile

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
OUT=HERE/'deployment.json'
assert not OUT.exists()
C=json.loads((HERE/'candidate.json').read_text())
assert not subprocess.check_output(['git','diff',C['commit'],'--','backend','web'],cwd=ROOT)
WEB='/www/luci-static/quickstart/'
TEMPLATE='/usr/lib/lua/luci/view/quickstart/main.htm'
BACKUP='/root/quickstart-backups/m71-components-ui-'+C['commit'][:7]
NAMES=['index.js','style.css','vendor.js','i18n/en.json']
Q=shlex.quote

def remote(command,data=None):
    if data is None:data=command.encode();command='sh -s'
    return subprocess.check_output(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=5','root@192.168.30.244',command],input=data,timeout=45)

def snapshot():
    return remote('sha256sum /etc/config/* /etc/quickstart/home-*.json /usr/sbin/quickstart /usr/bin/quickstart-netpolicy /usr/lib/opkg/status /etc/init.d/quickstart; ip -4 route show default; pidof quickstart; pidof startdhns; pidof quickstart-netpolicy || true').decode().strip().splitlines()

def hashes():
    return {line.split()[1].removeprefix(WEB):line.split()[0] for line in remote('sha256sum '+' '.join(Q(WEB+name) for name in C['hashes'])).decode().splitlines()}

report={'host':'192.168.30.244','frontendCommit':C['commit'],'backendCommit':C['backendCommit'],'assetVersion':C['assetVersion'],'scope':'Frontend/cache key only; no process restart, package hooks, policy or configuration writes','backup':BACKUP,'before':snapshot(),'result':'preparing'}
old=hashes();baseline=dict(line.split('=',1) for line in (ROOT/'bin/previews/9f31d4f/MANIFEST').read_text().splitlines())
for name,digest in old.items():
    if name in NAMES:assert digest==baseline['web.'+name.replace('/','.')],name+' no longer matches B baseline'
    else:assert digest==C['hashes'][name],name+' unexpectedly changed; audit full payload'
assert remote('sha256sum /usr/sbin/quickstart').decode().split()[0]==C['backendSHA']
assert remote('/usr/sbin/quickstart version --more').decode().strip()==C['backendVersion']
service=json.loads(remote('ubus -S call service list \'{"name":"quickstart"}\''))
report['servePID']=list(service['quickstart']['instances'].values())[0]['pid']
assert remote('sha256sum /proc/'+str(report['servePID'])+'/exe').decode().split()[0]==C['backendSHA']
old_template=remote('cat '+Q(TEMPLATE))
new_template,count=re.subn(rb'local asset_version = "[^"]+"',b'local asset_version = "'+C['assetVersion'].encode()+b'"',old_template)
assert count==1
remote('set -eu\numask 077\ntest ! -e '+Q(BACKUP)+'\nmkdir -p '+Q(BACKUP+'/stage')+'\ncp -a '+Q(WEB.rstrip('/'))+' '+Q(BACKUP+'/web')+'\ncp -p '+Q(TEMPLATE)+' '+Q(BACKUP+'/main.htm'))
try:
    buffer=io.BytesIO()
    with tarfile.open(fileobj=buffer,mode='w:gz') as archive,zipfile.ZipFile(Path(C['candidate'])/'quickstart_web.zip') as bundle:
        files={name:bundle.read('luci-static/quickstart/'+name) for name in NAMES}
        files['_main.htm']=new_template
        for name,data in files.items():
            if name in NAMES:assert hashlib.sha256(data).hexdigest()==C['hashes'][name]
            item=tarfile.TarInfo(name);item.size=len(data);item.mode=0o644;archive.addfile(item,io.BytesIO(data))
    remote('tar -xzf - -C '+Q(BACKUP+'/stage'),buffer.getvalue())
    commands=['set -eu']
    for name,target in [(name,WEB+name) for name in NAMES]+[('_main.htm',TEMPLATE)]:
        commands+=['cp -p '+Q(BACKUP+'/stage/'+name)+' '+Q(target+'.m71-new'),'mv '+Q(target+'.m71-new')+' '+Q(target)]
    remote('\n'.join(commands))
    report['installedHashes']=hashes();assert report['installedHashes']==C['hashes']
    report['publicHashes']={}
    for name in NAMES:
        request=urllib.request.Request('http://192.168.30.244/luci-static/quickstart/'+name+'?v='+C['assetVersion'],headers={'Cache-Control':'no-cache'})
        with urllib.request.urlopen(request,timeout=20) as response:
            assert response.status==200
            digest=hashlib.sha256(response.read()).hexdigest();assert digest==C['hashes'][name],name+' public mismatch'
            report['publicHashes'][name]=digest
    report['after']=snapshot();assert report['before']==report['after'],'Protected B state changed'
    report['result']='passed'
except Exception as error:
    report['result']='failed';report['failure']=str(error)
    remote('\n'.join(['set -eu']+['cp -p '+Q(BACKUP+'/web/'+name)+' '+Q(WEB+name) for name in NAMES]+['cp -p '+Q(BACKUP+'/main.htm')+' '+Q(TEMPLATE)]))
    report['rolledBack']=True
    raise
finally:
    OUT.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({key:report.get(key) for key in ['result','frontendCommit','servePID','assetVersion','publicHashes','failure']},indent=2))
