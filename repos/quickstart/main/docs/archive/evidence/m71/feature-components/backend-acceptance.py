#!/usr/bin/env python3
"""Current B component API checks; optional bounded native enable/restore.

Never installs packages, switches providers, or touches A. Sessions stay in RAM.
"""
import json
from pathlib import Path
import secrets
import shlex
import subprocess
import sys
import time
import urllib.error
import urllib.request

HERE=Path(__file__).resolve().parent
OUT=HERE/'backend-acceptance-startup.json'
assert not OUT.exists()
ENABLE='--enable-restore' in sys.argv
BASE='http://192.168.30.244'
PREFIX='/cgi-bin/luci/istore/lanctrl/v2/'

def remote(command):
    return subprocess.check_output(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=5','root@192.168.30.244','sh -s'],input=command,text=True,timeout=45)

def ubus(method,body):
    raw=remote('ubus -S call session '+method+' '+shlex.quote(json.dumps(body)))
    return json.loads(raw) if raw.strip() else {}

def snapshot():
    return remote('sha256sum /etc/config/* /etc/quickstart/home-*.json /usr/lib/opkg/status /usr/bin/quickstart-netpolicy; ip -4 route show default; pidof startdhns; pidof quickstart-netpolicy || true; for link in /etc/rc.d/*quickstart-netpolicy; do printf "%s %s\\n" "$link" "$(readlink "$link")"; done; uci -q changes quickstart-netpolicy').strip().splitlines()

sid=None;backup=None
report={'host':'192.168.30.244','enableRestoreRequested':ENABLE,'scope':'Current backend API; native enable then restore only if explicitly requested; no package install or provider/network writes','before':snapshot(),'result':'running'}

def exchange(path,body=None,authenticated=True):
    headers={'Content-Type':'application/json'}
    if authenticated: headers['Cookie']='sysauth_http='+sid
    request=urllib.request.Request(BASE+PREFIX+path,data=json.dumps(body).encode() if body is not None else None,headers=headers)
    try:
        with urllib.request.urlopen(request,timeout=50) as response:
            return response.status,json.loads(response.read())
    except urllib.error.HTTPError as error:
        return error.code,{'denied':error.code}

try:
    sid=ubus('create',{'timeout':240})['ubus_rpc_session']
    ubus('set',{'ubus_rpc_session':sid,'values':{'username':'root','token':secrets.token_hex(16)}})
    ubus('grant',{'ubus_rpc_session':sid,'scope':'access-group','objects':[['*','read'],['*','write']]})
    status,catalog=exchange('feature-components/')
    assert status==200 and catalog.get('success',0)==0 and not catalog.get('error'),catalog
    items=catalog['result']['components']
    assert catalog['result']['schemaVersion']==1 and [item['id'] for item in items]==['quickstart-native','eqos','floatip']
    report['catalogBefore']=catalog
    status,denied=exchange('feature-components/',authenticated=False)
    assert status!=200 or denied.get('success',0)!=0,'Unauthenticated catalogue accepted'
    report['unauthenticatedDenied']={'http':status,'response':denied}
    # The public LuCI proxy must strip spoofed forwarded identity.
    request=urllib.request.Request(BASE+PREFIX+'feature-components/',headers={'X-Forwarded-Sid':'a'*32,'X-Forwarded-Token':'spoof','X-Forwarded-User':'root'})
    try:
        with urllib.request.urlopen(request,timeout=10) as response:
            payload=response.read();assert response.status!=200 or json.loads(payload).get('success',0)!=0,'Spoofed identity accepted'
    except urllib.error.HTTPError:
        pass
    report['spoofedIdentityDenied']=True
    native=items[0]
    assert native['status']['state']=='disabled',native
    body={'capabilityKey':'device_speed_limit','action':'enable','draftToken':'m71-native-enable'}
    status,preview=exchange('capability-action/plan/',body)
    assert status==200 and preview.get('success',0)==0 and preview['result']['plan']['canApply'],preview
    report['enablePreview']=preview
    status,cancelled=exchange('capability-action/apply/',dict(body,confirm=False,expectedState='disabled'))
    assert status==200 and cancelled['result']['cancelled'] and not cancelled['result']['changed'],cancelled
    report['cancelledWithoutWrite']=cancelled
    assert snapshot()==report['before'],'Preview/cancellation changed B'
    if ENABLE:
        # No pre-existing policies may be resumed during this acceptance.
        assert remote('find /usr/share/quickstart-netpolicy -type f ! -name LICENSE ! -name NOTICE ! -name manifest.json').strip()=='','Existing policy files; refuse enabling'
        assert remote('uci -q changes quickstart-netpolicy').strip()==''
        assert remote('uci -q get quickstart-netpolicy.main.enabled').strip()=='0'
        assert remote('pidof quickstart-netpolicy || true').strip()==''
        backup='/root/quickstart-backups/m71-native-enable-'+secrets.token_hex(5)
        q=shlex.quote(backup)
        remote('set -eu\numask 077\nmkdir '+q+'\ncp -p /etc/config/quickstart-netpolicy '+q+'/config\nif /etc/init.d/quickstart-netpolicy enabled; then touch '+q+'/boot-enabled; fi')
        status,applied=exchange('capability-action/apply/',dict(body,confirm=True,expectedState='disabled'))
        report['enableApply']={'http':status,'response':applied}
        observations=[]
        deadline=time.monotonic()+60
        while True:
            status,enabled=exchange('feature-components/')
            observed=enabled.get('result',{}).get('components',[{}])[0]
            observations.append({'secondsRemaining':round(max(0,deadline-time.monotonic()),1),'http':status,'component':observed})
            if observed.get('status',{}).get('state')=='available' or time.monotonic()>=deadline:break
            time.sleep(3)
        report['startupObservations']=observations
        report['catalogEnabled']=enabled
        assert status==200 and enabled.get('success',0)==0
        observed=enabled['result']['components'][0]
        assert observed['status']['state']=='available',observed
        assert enabled['result']['currentProvider']==catalog['result']['currentProvider'],'Enable changed selected provider'
        assert remote('uci -q get quickstart-netpolicy.main.enabled').strip()=='1'
        assert remote('pidof quickstart-netpolicy').strip()
        report['nativeReadyVerified']=True
    report['result']='passed'
except Exception as error:
    report['result']='failed';report['failure']=str(error)
    raise
finally:
    try:
        if backup:
            q=shlex.quote(backup)
            remote('set -eu\n/etc/init.d/quickstart-netpolicy stop\ncp -p '+q+'/config /etc/config/quickstart-netpolicy.m71-restore\nmv /etc/config/quickstart-netpolicy.m71-restore /etc/config/quickstart-netpolicy\nif test -e '+q+'/boot-enabled; then /etc/init.d/quickstart-netpolicy enable; else /etc/init.d/quickstart-netpolicy disable; fi')
            report['nativeRestored']=True
            # Preflight required these paths to be absent. A ready engine may
            # create empty bindings and a disabled/zero policy on shutdown.
            for name,expected in [('hostname_bindings.txt',''),('rate_limit_policy.txt','false\n0 0')]:
                path='/usr/share/quickstart-netpolicy/'+name
                content=remote('if test -f '+shlex.quote(path)+'; then cat '+shlex.quote(path)+'; fi')
                assert content.strip()==expected,'Unexpected policy data; retain it for inspection'
                remote('rm -f '+shlex.quote(path))
            report['defaultArtifactsRemoved']=True
        report['after']=snapshot()
        assert report['before']==report['after'],'B protected state was not restored'
        if sid:
            status,catalog=exchange('feature-components/');report['catalogAfter']=catalog
            assert status==200 and catalog.get('success',0)==0 and catalog['result']['components'][0]['status']['state']=='disabled'
    except Exception as error:
        report['result']='failed';report['cleanupFailure']=str(error)
        raise
    finally:
        if sid: ubus('destroy',{'ubus_rpc_session':sid});report['sessionsDestroyed']=1
        OUT.write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps({key:report.get(key) for key in ['result','host','nativeReadyVerified','nativeRestored','failure','cleanupFailure','sessionsDestroyed']},indent=2))
