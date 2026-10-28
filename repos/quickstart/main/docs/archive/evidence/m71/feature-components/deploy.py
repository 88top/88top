#!/usr/bin/env python3
"""B-only task rollout. Existing DHCP namespace helper is deliberately retained."""
import hashlib
import io
import json
from pathlib import Path
import re
import shlex
import subprocess
import sys
import tarfile
import zipfile

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
BACKEND_ONLY='--backend-only' in sys.argv
OUT=HERE/('backend-deployment.json' if BACKEND_ONLY else 'deployment.json')
assert not OUT.exists()
CANDIDATE=json.loads((HERE/'candidate.json').read_text())
BACKUP='/root/quickstart-backups/m71-components-'+CANDIDATE['commit'][:7]+('-backend' if BACKEND_ONLY else '')
WEB='/www/luci-static/quickstart/'
TEMPLATE='/usr/lib/lua/luci/view/quickstart/main.htm'
Q=shlex.quote

def remote(command,data=None):
    if data is None:data=command.encode();command='sh -s'
    return subprocess.check_output(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=5','root@192.168.30.244',command],input=data,timeout=45)

def snapshot():
    return remote('sha256sum /etc/config/* /etc/quickstart/home-layout.json /etc/quickstart/home-launcher.json /usr/lib/opkg/status /usr/bin/quickstart-netpolicy /etc/init.d/quickstart; ip -4 route show default; pidof startdhns; pidof quickstart-netpolicy || true').decode().strip().splitlines()

report={'host':'192.168.30.244','candidate':CANDIDATE['commit'],'scope':'B serve backend only; frontend retained while visual acceptance is pending' if BACKEND_ONLY else 'B serve backend and frontend/cache key; no package hooks, no policy changes','backup':BACKUP,'before':snapshot(),'result':'preparing'}
assert remote('/usr/sbin/quickstart version --more').decode().startswith('0.16.6-test20261018 c9624a3')
assert not remote('pidof quickstart-netpolicy || true').strip()
assert remote('uci -q get quickstart-netpolicy.main.enabled').strip()==b'0'
assert not subprocess.check_output(['git','diff','c9624a3','--','backend/dhns','backend/modules/dhns','backend/service/dhns.go','backend/cmd/backend/backend-main.go'],cwd=ROOT),'DHNS helper source changed; audit helper rollout separately'
service=json.loads(remote('ubus -S call service list \'{"name":"quickstart"}\''))
report['oldServePID']=list(service['quickstart']['instances'].values())[0]['pid']
old_manifest=dict(line.split('=',1) for line in (ROOT/'bin/previews/9f31d4f/MANIFEST').read_text().splitlines())
names=['index.js','style.css','vendor.js','i18n/en.json']
for name in names:assert remote('sha256sum '+Q(WEB+name)).decode().split()[0]==old_manifest['web.'+name.replace('/','.')]
if BACKEND_ONLY:names=[]
old_template=remote('cat '+Q(TEMPLATE))
new_template,count=re.subn(rb'local asset_version = "[^"]+"',b'local asset_version = "'+CANDIDATE['assetVersion'].encode()+b'"',old_template)
assert count==1
remote('set -eu\numask 077\ntest ! -e '+Q(BACKUP)+'\nmkdir -p '+Q(BACKUP+'/stage')+'\ncp -p /usr/sbin/quickstart '+Q(BACKUP+'/quickstart')+'\ncp -a '+Q(WEB.rstrip('/'))+' '+Q(BACKUP+'/web')+'\ncp -p '+Q(TEMPLATE)+' '+Q(BACKUP+'/main.htm')+'\ncp -a /etc/config '+Q(BACKUP+'/config'))
try:
    buffer=io.BytesIO()
    with tarfile.open(fileobj=buffer,mode='w:gz') as archive,zipfile.ZipFile(Path(CANDIDATE['candidate'])/'quickstart_web.zip') as bundle:
        files={name:bundle.read('luci-static/quickstart/'+name) for name in names}
        files['_backend']=(Path(CANDIDATE['candidate'])/'quickstart.x86_64').read_bytes()
        assert hashlib.sha256(files['_backend']).hexdigest()==CANDIDATE['binarySHA']
        if not BACKEND_ONLY:files['_main.htm']=new_template
        for name,data in files.items():
            if name in names:assert hashlib.sha256(data).hexdigest()==CANDIDATE['hashes'][name]
            item=tarfile.TarInfo(name);item.size=len(data);item.mode=0o755 if name=='_backend' else 0o644;archive.addfile(item,io.BytesIO(data))
    remote('tar -xzf - -C '+Q(BACKUP+'/stage'),buffer.getvalue())
    commands=['set -eu']
    for name,target in [(name,WEB+name) for name in names]+[('_backend','/usr/sbin/quickstart')]+([] if BACKEND_ONLY else [('_main.htm',TEMPLATE)]):
        commands+=['cp -p '+Q(BACKUP+'/stage/'+name)+' '+Q(target+'.m71-new'),'mv '+Q(target+'.m71-new')+' '+Q(target)]
    commands+=['/etc/init.d/quickstart restart']
    remote('\n'.join(commands))
    service=json.loads(remote('ubus -S call service list \'{"name":"quickstart"}\''))
    report['servePID']=list(service['quickstart']['instances'].values())[0]['pid']
    assert report['servePID']!=report['oldServePID']
    report['runningSHA']=remote('sha256sum /proc/'+str(report['servePID'])+'/exe').decode().split()[0]
    assert report['runningSHA']==CANDIDATE['binarySHA']
    report['version']=remote('/usr/sbin/quickstart version --more').decode().strip()
    report['after']=snapshot();assert report['before']==report['after'],'Protected B state changed'
    for name in names:assert remote('sha256sum '+Q(WEB+name)).decode().split()[0]==CANDIDATE['hashes'][name]
    report['retainedDHNSHelper']='Existing process retained; relevant helper source is byte-identical to c9624a3. This is not a full package/runtime upgrade acceptance.'
    report['result']='passed'
except Exception as error:
    report['result']='failed';report['failure']=str(error)
    commands=['set -eu','cp -p '+Q(BACKUP+'/quickstart')+' /usr/sbin/quickstart.m71-new','mv /usr/sbin/quickstart.m71-new /usr/sbin/quickstart']
    commands+=['cp -p '+Q(BACKUP+'/web/'+name)+' '+Q(WEB+name) for name in names]
    commands+=['cp -p '+Q(BACKUP+'/main.htm')+' '+Q(TEMPLATE),'/etc/init.d/quickstart restart']
    remote('\n'.join(commands));report['rolledBack']=True
    raise
finally:
    OUT.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
