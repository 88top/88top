#!/usr/bin/env python3
"""Single-app entrysh status protocol on designated opkg/APK devices; no service actions."""
import datetime
import json
from pathlib import Path
import secrets
import shlex
import subprocess
import sys
import urllib.parse
import urllib.request

out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=False)
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'devices':[]}
for host in ['192.168.30.244','192.168.9.140']:
    sid=None;item={'host':host,'sessionDestroyed':False};report['devices'].append(item)
    def remote(command):
        r=subprocess.run(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=5','root@'+host,command],text=True,capture_output=True,timeout=15)
        if r.returncode:raise RuntimeError('Remote protocol setup failed')
        return r.stdout
    def ubus(method,data):
        raw=remote('ubus -S call session '+method+' '+shlex.quote(json.dumps(data)))
        return json.loads(raw) if raw.strip() else {}
    try:
        sid=ubus('create',{'timeout':120})['ubus_rpc_session'];ubus('set',{'ubus_rpc_session':sid,'values':{'username':'root','token':secrets.token_hex(16)}})
        for scope,objects in [('ubus',[['*','*']]),('access-group',[['*','read']]),('uci',[['*','read']])]:ubus('grant',{'ubus_rpc_session':sid,'scope':scope,'objects':objects})
        headers={'Cookie':'sysauth_http='+sid,'Accept':'application/json'}
        with urllib.request.urlopen(urllib.request.Request('http://'+host+'/cgi-bin/luci/admin/store/token',headers=headers),timeout=5) as r:token=json.load(r)['token']
        assert isinstance(token,str) and token
        before=remote('sha256sum /etc/config/istoreenhance /etc/config/network /etc/quickstart/home-launcher.json 2>/dev/null || true')
        payload=urllib.parse.urlencode({'token':token,'package':'istoreenhance','hostname':host,'update':'1'}).encode()
        request=urllib.request.Request('http://'+host+'/cgi-bin/luci/admin/store/entrysh',data=payload,headers={**headers,'Content-Type':'application/x-www-form-urlencoded'},method='POST')
        with urllib.request.urlopen(request,timeout=5) as r:item['httpStatus']=r.status;body=json.load(r)
        assert body['code']==200 and not body['errors'] and len(body['status'])==1
        status=body['status'][0];assert status['app']=='istoreenhance' and isinstance(status['running'],bool)
        item['entry']={key:status.get(key) for key in ['app','running','deployed','web','protocol','port','href']}
        state=json.loads(remote("ubus -S call service list '{\"name\":\"istoreenhance\"}'"))
        item['observedRunning']=any(i.get('running') for i in state.get('istoreenhance',{}).get('instances',{}).values())
        item['scriptRunningMatchesObserved']=item['observedRunning']==status['running']
        assert before==remote('sha256sum /etc/config/istoreenhance /etc/config/network /etc/quickstart/home-launcher.json 2>/dev/null || true')
        item['scope']='One fresh istoreenhance status only; runtime cache may update; no install/start/stop/config write'
        item['result']='passed'
    finally:
        if sid:ubus('destroy',{'ubus_rpc_session':sid});item['sessionDestroyed']=True
        (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(item,ensure_ascii=False))
