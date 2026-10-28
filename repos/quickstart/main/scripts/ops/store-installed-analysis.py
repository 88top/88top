#!/usr/bin/env python3
"""Sequential read-only store comparison on the two user-designated devices.

Only installed GET is requested. Its own runtime cache/lock may be created.
Temporary root LuCI sessions are always destroyed; no secrets enter evidence.
"""
import datetime
import hashlib
import json
from pathlib import Path
import secrets
import shlex
import statistics
import subprocess
import sys
import time
import urllib.request

out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=False)
report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'devices': [],
          'scope': 'installed GET and SSH reads only; no package/config/service changes'}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


for host, manager, metadata in [('192.168.30.244', 'opkg', '/usr/lib/opkg/meta'),
                                ('192.168.9.140', 'apk', '/lib/apk/meta')]:
    device = {'host': host, 'manager': manager, 'requests': [], 'sessionDestroyed': False}
    report['devices'].append(device)
    sid = None

    def remote(command):
        result = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5',
                                 'root@' + host, command], text=True, capture_output=True, timeout=30)
        if result.returncode:
            raise RuntimeError('SSH read failed on ' + host)
        return result.stdout

    def ubus(method, data):
        value = remote('ubus -S call session ' + method + ' ' + shlex.quote(json.dumps(data)))
        return json.loads(value) if value.strip() else {}

    protected = r'''for file in /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/istore /etc/config/quickstart /etc/config/eqos /etc/config/floatip /etc/config/quickstart-netpolicy /etc/quickstart/home-layout.json /etc/quickstart/home-launcher.json; do if test -f "$file"; then sha256sum "$file"; else printf 'MISSING %s\n' "$file"; fi; done'''
    cache = r'''for file in /tmp/cache/istore/installed.json /var/lock/istore-installed.lock; do if test -f "$file"; then sha256sum "$file"; else printf 'MISSING %s\n' "$file"; fi; done'''
    try:
        device['board'] = json.loads(remote('ubus call system board'))
        device['storePackage'] = remote('opkg list-installed luci-app-store' if manager == 'opkg'
                                        else 'apk query --installed --fields name,version luci-app-store').strip()
        device['protectedBefore'] = remote(protected).splitlines()
        device['cacheBefore'] = remote(cache).splitlines()
        source = remote('cat /usr/lib/lua/luci/controller/store.lua')
        device['storeSourceSha256'] = hashlib.sha256(source.encode()).hexdigest()
        begin = source.index('local function get_installed_and_cache()')
        end = source.index('\nfunction store_action', begin)
        (out / (manager + '-installed-source.lua')).write_text(source[begin:end] + '\n')
        device['metadataFiles'] = remote('ls -1 ' + shlex.quote(metadata) + '/*.json').strip().splitlines()
        package_command = ("opkg list-installed | awk '$1 ~ /^app-meta-/ {print $1}'" if manager == 'opkg'
                           else "apk info 2>/dev/null | sed -n '/^app-meta-/p'")
        device['installedMetaPackages'] = remote(package_command).strip().splitlines()
        sid = ubus('create', {'timeout': 120})['ubus_rpc_session']
        ubus('set', {'ubus_rpc_session': sid, 'values': {'username': 'root', 'token': secrets.token_hex(16)}})
        for scope, objects in [('ubus', [['*', '*']]), ('access-group', [['*', 'read']]), ('uci', [['*', 'read']])]:
            ubus('grant', {'ubus_rpc_session': sid, 'scope': scope, 'objects': objects})
        opener = urllib.request.build_opener(NoRedirect)
        ids = None
        for _ in range(3):
            request = urllib.request.Request('http://' + host + '/cgi-bin/luci/admin/store/installed',
                                             headers={'Cookie': 'sysauth_http=' + sid, 'Accept': 'application/json'}, method='GET')
            start = time.perf_counter()
            with opener.open(request, timeout=8) as response:
                raw = response.read(2 * 1024 * 1024 + 1)
                elapsed = (time.perf_counter() - start) * 1000
                assert len(raw) <= 2 * 1024 * 1024
                rows = json.loads(raw)
                assert response.status == 200 and isinstance(rows, list)
                current_ids = sorted(row['name'] for row in rows)
                assert len(current_ids) == len(set(current_ids))
                if ids is not None:
                    assert current_ids == ids
                ids = current_ids
                device['requests'].append({'method': 'GET', 'path': '/cgi-bin/luci/admin/store/installed',
                                           'status': response.status, 'elapsedMs': round(elapsed, 2),
                                           'bytes': len(raw), 'count': len(rows)})
                # Retain names and field types only, never arbitrary link contents.
                device['apps'] = [{'name': row['name'], 'entryPresent': bool(row.get('entry')),
                                   'fieldTypes': {key: type(value).__name__ for key, value in row.items()}}
                                  for row in rows]
        device['medianMs'] = round(statistics.median(r['elapsedMs'] for r in device['requests']), 2)
        device['metadataIds'] = sorted(Path(file).stem for file in device['metadataFiles'])
        device['packageIds'] = sorted(pkg.removeprefix('app-meta-') for pkg in device['installedMetaPackages'])
        assert ids == device['metadataIds'] == device['packageIds'], 'Installed API/metadata/packages differ'
        device['cacheAfter'] = remote(cache).splitlines()
        device['protectedAfter'] = remote(protected).splitlines()
        assert device['protectedBefore'] == device['protectedAfter'], 'Protected configuration changed'
        device['result'] = 'passed'
    except Exception as error:
        # Avoid exceptions that might print session-bearing subprocess arguments.
        device['result'] = 'failed'
        device['failureType'] = type(error).__name__
    finally:
        if sid:
            ubus('destroy', {'ubus_rpc_session': sid})
            device['sessionDestroyed'] = True
        (out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: device.get(key) for key in ['host', 'manager', 'storePackage', 'result', 'requests',
                                                      'medianMs', 'failureType', 'sessionDestroyed']}, ensure_ascii=False))
raise SystemExit(0 if all(d['result'] == 'passed' for d in report['devices']) else 1)
