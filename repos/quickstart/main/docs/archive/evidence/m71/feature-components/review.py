#!/usr/bin/env python3
"""B-only authenticated UI review; projected writes never reach the router."""
import json
import os
from pathlib import Path
import secrets
import shlex
import subprocess
import sys

HERE=Path(__file__).resolve().parent
OUT=HERE/sys.argv[1]
assert not OUT.exists()
OUT.mkdir(parents=True)

def remote(command):
    return subprocess.check_output(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=5','root@192.168.30.244','sh -s'],input=command,text=True,timeout=30)

def ubus(method,body):
    result=remote('ubus -S call session '+method+' '+shlex.quote(json.dumps(body)))
    return json.loads(result) if result.strip() else {}

def snapshot():
    return remote('sha256sum /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /etc/config/quickstart-netpolicy /etc/quickstart/home-layout.json /etc/quickstart/home-launcher.json /usr/sbin/quickstart /usr/bin/quickstart-netpolicy /usr/lib/opkg/status; ip -4 route show default; pidof quickstart; pidof startdhns; pidof quickstart-netpolicy || true').strip().splitlines()

sid=None
report={'host':'192.168.30.244','before':snapshot(),'scope':'Installed B or explicit browser-only candidate/projection; no real writes'}
try:
    sid=ubus('create',{'timeout':600})['ubus_rpc_session']
    ubus('set',{'ubus_rpc_session':sid,'values':{'username':'root','token':secrets.token_hex(16)}})
    for scope,objects in [('access-group',[['*','read']]),('uci',[['*','read']]),('ubus',[['luci','getFeatures'],['file','list'],['uci','changes']])]:
        ubus('grant',{'ubus_rpc_session':sid,'scope':scope,'objects':objects})
    env=dict(os.environ,NODE_PATH='/config/playwright-runner/node_modules',QS_COMPONENT_SID=sid,QS_COMPONENT_OUT=str(OUT))
    completed=subprocess.run(['/var/cache/build-cache/run.sh','--','node',str(HERE/'review.cjs')],env=env,timeout=420)
    report['exitCode']=completed.returncode
    report['after']=snapshot()
    assert report['before']==report['after'],'Readonly UI changed B'
    assert completed.returncode==0,'UI failed; evidence retained'
    report['result']='passed'
finally:
    if sid:
        ubus('destroy',{'ubus_rpc_session':sid})
        report['sessionsDestroyed']=1
    (OUT/'device.json').write_text(json.dumps(report,indent=2)+'\n')
