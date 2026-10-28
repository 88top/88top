#!/usr/bin/env python3
"""Focused non-destructive audit. Never sends malformed REST params to production.

Uses SSH-created temporary sessions, not a real successful password login.
Persists only status/codes, never passwords, tokens, cookies or response bodies.
"""
import datetime
import http.client
import json
from pathlib import Path
import secrets
import shlex
import ssl
import subprocess
import urllib.parse

HOST = '192.168.30.7'
API = '/cgi-bin/luci/istore/'
OUT = Path(__file__).with_name('results.json')
PASSWORD_GUARD_SHA = '6fa07b1301e709d5d56a6ef69fa2a58bb4d4bfc4815d666f71c33c7f30149574'
sessions = []
checks = []
ctx = ssl._create_unverified_context()


def remote(command):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', 'root@'+HOST, command],
                                   text=True, timeout=20)


def ubus(method, data):
    raw = remote('ubus -S call session '+method+' '+shlex.quote(json.dumps(data)))
    return json.loads(raw) if raw.strip() else {}


def session(username, token=True):
    sid = ubus('create', {'timeout': 300})['ubus_rpc_session']
    sessions.append(sid)
    value = {'username': username}
    if token:
        value['token'] = secrets.token_hex(16)
    ubus('set', {'ubus_rpc_session': sid, 'values': value})
    if username == 'root':
        for scope, objects in [('ubus', [['*', '*']]), ('access-group', [['*', 'read'], ['luci-base', 'read'], ['luci-base', 'write']]),
                               ('uci', [['*', 'read']])]:
            ubus('grant', {'ubus_rpc_session': sid, 'scope': scope, 'objects': objects})
    return sid, value.get('token')


def request(path, headers=(), body=None, method='GET', tls=True):
    c = (http.client.HTTPSConnection(HOST, context=ctx, timeout=15) if tls else
         http.client.HTTPConnection(HOST, 10000, timeout=15))
    try:
        c.putrequest(method, path)
        for k, v in headers:
            c.putheader(k, v)
        if body is not None:
            c.putheader('Content-Length', str(len(body)))
        c.endheaders(body)
        r = c.getresponse()
        raw = r.read(1048576)
        try:
            value = json.loads(raw)
        except (ValueError, UnicodeError):
            value = None
        return r.status, value, dict((k.lower(), v) for k, v in r.getheaders())
    finally:
        c.close()


def record(name, result, passed):
    status, value, headers = result
    checks.append({'name': name, 'passed': bool(passed), 'http': status,
                   'success': value.get('success') if isinstance(value, dict) else None,
                   'rpcError': value.get('error', {}).get('code') if isinstance(value, dict)
                       and isinstance(value.get('error'), dict) else None,
                   'ubusStatus': value['result'][0] if isinstance(value, dict)
                       and isinstance(value.get('result'), list) and value['result'] else None,
                   'sessionCookieIssued': 'sysauth' in headers.get('set-cookie', '')
                       and '1970' not in headers.get('set-cookie', '')})


def denied(name, path=API+'system/version/', **kw):
    result = request(path, **kw)
    status, value, _ = result
    record(name, result, status in (400, 401, 403, 404, 405) or
           isinstance(value, dict) and value.get('success') == -1001)


def rpc(method, data, sid='0'*32, path='/ubus/'):
    return request(path, method='POST', headers=[('Content-Type', 'application/json')],
                   body=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': 'call',
                                    'params': [sid, 'session', method, data]}).encode())


completed = False
try:
    root, token = session('root')
    guest, _ = session('security-audit-guest')
    tokenless, _ = session('root', token=False)
    forged = [('X-Forwarded-Sid', root), ('X-Forwarded-Token', token)]
    guest_cookie = [('Cookie', 'sysauth_https='+guest)]
    for name, headers in [
        ('no cookie; valid root forwarding headers', forged),
        ('no cookie; lowercase forwarding headers', [(k.lower(), v) for k, v in forged]),
        ('no cookie; underscore forwarding headers', [(k.replace('-', '_'), v) for k, v in forged]),
        ('no cookie; mixed forwarding headers', [('X-Forwarded_Sid', root), ('X-Forwarded_Token', token)]),
        ('no cookie; duplicate forwarding headers', forged+forged),
        ('guest cookie; valid root forwarding headers', guest_cookie+forged),
        ('guest cookie; underscore root forwarding headers', guest_cookie+[(k.replace('-', '_'), v) for k, v in forged]),
        ('tokenless root session cookie', [('Cookie', 'sysauth_https='+tokenless)]),
        ('forged HTTP_AUTH_USER/PASS CGI headers', [('Auth-User', 'root'), ('Auth-Pass', 'invalid')]),
    ]:
        denied(name, headers=headers)
    denied('query session id is not authentication', path=API+'system/version/?sid='+root+'&ubus_rpc_session='+root)
    for tls in (True, False):
        label = 'HTTPS' if tls else 'HTTP10000'
        for path in ('system/version/', 'u/system/version/', 'system/getToken/', 'home/v1/layout/'):
            denied(label+' anonymous '+path, path=API+path, tls=tls)
        result = request(API+'system/version/', headers=[('Cookie',
                         ('sysauth_https=' if tls else 'sysauth_http=')+root)], tls=tls)
        record(label+' valid root session control', result,
               result[0] == 200 and isinstance(result[1], dict) and isinstance(result[1].get('result'), dict))
    for path in ('system/setPassword/', 'system/reboot/', 'lanctrl/v2/network-rules/'):
        # Invalid JSON means even an accidental missing guard cannot act.
        denied('anonymous write '+path, path=API+path, method='POST',
               headers=[('Content-Type', 'application/json')], body=b'{')
    for path in ('/api/dhns/connect/', '/api/lcd/simple/'):
        denied('Unix-only route inaccessible over LuCI '+path, path='/cgi-bin/luci'+path)
    for method, data in [('get', {}), ('list', {}), ('create', {'timeout': 1}),
                         ('set', {'ubus_rpc_session': guest, 'values': {'audit': 'denied'}}),
                         ('grant', {'ubus_rpc_session': guest, 'scope': 'audit', 'objects': [['audit', 'read']]})]:
        result = rpc(method, data)
        record('anonymous /ubus session.'+method, result,
               isinstance(result[1], dict) and result[1].get('error', {}).get('code') in (-32002, -32602))
    result = rpc('get', {'ubus_rpc_session': root})
    record('anonymous cannot target root using argument SID', result,
           isinstance(result[1], dict) and result[1].get('error', {}).get('code') in (-32002, -32602))
    result = rpc('get', {}, sid=guest)
    record('non-root session cannot read session data via /ubus', result,
           isinstance(result[1], dict) and result[1].get('error', {}).get('code') == -32002)
    for method in ('get', 'list', 'create', 'set', 'grant'):
        result = rpc(method, {}, path='/cgi-bin/luci/admin/ubus')
        record('anonymous LuCI ubus alias session.'+method, result,
               isinstance(result[1], dict) and result[1].get('error', {}).get('code') == -32002)
    for name, data in [
        ('missing password', {'username': 'root'}),
        ('null password', {'username': 'root', 'password': None}),
        ('numeric password', {'username': 'root', 'password': 1}),
        ('empty password', {'username': 'root', 'password': ''}),
        ('invalid password', {'username': 'root', 'password': secrets.token_hex(24)}),
        ('missing username', {'password': 'invalid'}),
    ]:
        result = rpc('login', data)
        value = result[1]
        record('/ubus login '+name, result, isinstance(value, dict)
               and isinstance(value.get('result'), list) and value['result'][0] in (2, 6)
               and not any(isinstance(v, dict) and 'ubus_rpc_session' in v for v in value['result']))
    for name, form in [('missing password', {'luci_username': 'root'}),
                       ('invalid password', {'luci_username': 'root', 'luci_password': secrets.token_hex(24)})]:
        result = request('/cgi-bin/luci/admin/', method='POST',
                         headers=[('Content-Type', 'application/x-www-form-urlencoded')],
                         body=urllib.parse.urlencode(form).encode())
        record('LuCI form '+name, result, result[0] == 403
               and result[2].get('x-luci-login-required') == 'yes'
               and 'sysauth' not in result[2].get('set-cookie', ''))
    result = request(API+'system/getToken/', headers=[('Cookie', 'sysauth_https='+root)])
    record('root token belongs to validated session', result,
           result[0] == 200 and result[1].get('result', {}).get('token') == token)
    # NEVER run these on an old binary: {} could otherwise clear root's password.
    # Pin both installed and actually running image before exercising the guard.
    verify = remote('sha256sum /usr/sbin/quickstart; for p in $(pidof quickstart); do sha256sum /proc/$p/exe; done')
    hashes = [line.split()[0] for line in verify.splitlines()]
    if len(hashes) < 2 or any(h != PASSWORD_GUARD_SHA for h in hashes):
        raise RuntimeError('password guard image not verified; refusing password requests')
    shadow_before = remote('sha256sum /etc/shadow').split()[0]
    for name, body in [
        ('missing field', {}), ('null request', None), ('null field', {'password': None}),
        ('empty string', {'password': ''}), ('NUL terminator', {'password': '\x00'}),
        ('embedded NUL', {'password': 'audit\x00suffix'}),
        ('line feed', {'password': 'audit\nroot:other'}), ('carriage return', {'password': 'audit\r'}),
    ]:
        result = request(API+'system/setPassword/', method='POST',
                         headers=[('Cookie', 'sysauth_https='+root), ('Origin', 'https://'+HOST),
                                  ('Content-Type', 'application/json')], body=json.dumps(body).encode())
        record('authenticated password guard '+name, result,
               result[0] == 200 and isinstance(result[1], dict)
               and result[1].get('success') == -1000)
    checks.append({'name': 'shadow unchanged after rejected password requests',
                   'passed': remote('sha256sum /etc/shadow').split()[0] == shadow_before})
    result = request('/cgi-bin/luci/admin/logout', headers=[('Cookie', 'sysauth_https='+root)])
    record('LuCI logout clears session cookie', result,
           result[0] in (302, 303) and '1970' in result[2].get('set-cookie', ''))
    denied('old root cookie after actual LuCI logout', headers=[('Cookie', 'sysauth_https='+root)])
    try:
        ubus('get', {'ubus_rpc_session': root})
        absent = False
    except subprocess.CalledProcessError as error:
        absent = error.returncode == 4
    checks.append({'name': 'logout destroyed rpcd session', 'passed': absent})
    if absent:
        sessions.remove(root)
    completed = True
finally:
    errors = 0
    for sid in sessions:
        try:
            ubus('destroy', {'ubus_rpc_session': sid})
        except subprocess.CalledProcessError as error:
            if error.returncode != 4:
                errors += 1
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'host': HOST,
              'checks': checks, 'completed': completed, 'cleanupErrors': errors,
              'passwordLoginVerified': False,
              'passed': completed and not errors and all(c['passed'] for c in checks),
              'malformedRestParamsSentToProduction': False}
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'passed': report['passed'], 'checks': len(checks),
                  'failures': [c for c in checks if not c['passed']]}))
raise SystemExit(0 if report['passed'] else 1)
