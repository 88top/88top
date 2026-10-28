#!/usr/bin/env python3
"""B-only entry status sandbox, atomic script replacement, no service actions."""
import hashlib
import json
from pathlib import Path
import shlex
import subprocess
import sys

source = Path(sys.argv[1]).read_text()
out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=False)
host = '192.168.30.244'


def remote(command):
    result = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', 'root@' + host,
                             'sh', '-s'], input=command, text=True, capture_output=True, timeout=45)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or 'remote entry operation failed')
    if result.stderr:
        with (out / 'diagnostic.log').open('a') as log: log.write(result.stderr)
    return result.stdout


report = {'host': host, 'sourceSha256': hashlib.sha256(source.encode()).hexdigest(), 'cases': []}
harness = r'''
set -eu
scratch=$(mktemp -d /tmp/qs-entry-status.XXXXXX)
trap 'rm -rf "$scratch"' EXIT HUP INT TERM
mkdir "$scratch/bin"
printf %s SOURCE_TEXT > "$scratch/original"
sed "s#^ISTOREENHANCE_BIN=.*#ISTOREENHANCE_BIN=$scratch/installed#" "$scratch/original" > "$scratch/entry.sh"
touch "$scratch/installed"; chmod 700 "$scratch/installed"
cat > "$scratch/bin/ubus" <<'MOCK'
#!/bin/sh
[ "${QS_ENTRY_TEST_ERROR:-0}" = 0 ] || exit 1
cat "$QS_ENTRY_TEST_STATE"
MOCK
cat > "$scratch/bin/uci" <<'MOCK'
#!/bin/sh
printf '%s' "${QS_ENTRY_TEST_PORT:-}"
MOCK
chmod 700 "$scratch/bin/ubus" "$scratch/bin/uci"
check() {
    name=$1; state=$2; port=$3; failed=$4
    printf %s "$state" > "$scratch/state"
    code=0
    PATH="$scratch/bin:$PATH" QS_ENTRY_TEST_STATE="$scratch/state" QS_ENTRY_TEST_PORT="$port" QS_ENTRY_TEST_ERROR="$failed" sh "$scratch/entry.sh" status 192.168.30.244 > "$scratch/result" || code=$?
    printf '%s\t%s\t' "$name" "$code"; tr -d '\n' < "$scratch/result"; printf '\n'
}
check running '{"istoreenhance":{"instances":{"instance1":{"running":true,"pid":123}}}}' 5003 0
check stopped '{"istoreenhance":{"instances":{"instance1":{"running":false}}}}' 5003 0
check no-service '{}' 5003 0
check multi '{"istoreenhance":{"instances":{"one":{"running":false},"two":{"running":true}}}}' 5050 0
check default-port '{"istoreenhance":{"instances":{"one":{"running":true}}}}' '' 0
check bad-port '{"istoreenhance":{"instances":{"one":{"running":true}}}}' 'abc' 0
check range-port '{"istoreenhance":{"instances":{"one":{"running":true}}}}' 65536 0
check invalid-json 'truncated' 5003 0
check read-failed '{}' 5003 1
rm "$scratch/installed"
check undeployed '{}' 5003 0
'''.replace('SOURCE_TEXT', shlex.quote(source))
harness_output = remote(harness)
(out / 'sandbox.log').write_text(harness_output)
for line in harness_output.splitlines():
    name, code, encoded = line.split('\t'); code = int(code)
    body = json.loads(encoded) if encoded else None
    expected_error = name in ['bad-port', 'range-port', 'invalid-json', 'read-failed']
    assert bool(code) == expected_error, (name, code)
    if not expected_error:
        assert body['running'] == (name in ['running', 'multi', 'default-port']), (name, body)
        assert body['deployed'] == (name != 'undeployed')
        assert ('web' in body) == body['running']
        if name == 'multi': assert body['port'] == '5050'
        if name == 'default-port': assert body['port'] == '5003'
    report['cases'].append({'name': name, 'exitCode': code, 'status': body})
protected = r'''for file in /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /etc/config/istoreenhance /etc/quickstart/home-layout.json /etc/quickstart/home-launcher.json; do if test -f "$file"; then sha256sum "$file"; else printf 'MISSING %s\n' "$file"; fi; done'''
report['protectedBefore'] = remote(protected).splitlines()
before = json.loads(remote("ubus -S call service list '{\"name\":\"istoreenhance\"}'"))
old_sha = remote('sha256sum /usr/libexec/istoree/istoreenhance.sh').split()[0]
backup = '/root/quickstart-entry-backups/istoreenhance-' + report['sourceSha256'][:12]
deployment = r'''
set -eu
umask 077
test "$(sha256sum /usr/libexec/istoree/istoreenhance.sh | cut -d' ' -f1)" = OLD_SHA
test ! -e BACKUP
mkdir -p BACKUP
cp -p /usr/libexec/istoree/istoreenhance.sh BACKUP/original.sh
printf %s SOURCE_TEXT > /usr/libexec/istoree/.istoreenhance.qs-candidate
chmod 755 /usr/libexec/istoree/.istoreenhance.qs-candidate
sh -n /usr/libexec/istoree/.istoreenhance.qs-candidate
mv /usr/libexec/istoree/.istoreenhance.qs-candidate /usr/libexec/istoree/istoreenhance.sh
sha256sum /usr/libexec/istoree/istoreenhance.sh
'''.replace('OLD_SHA', shlex.quote(old_sha)).replace('BACKUP', shlex.quote(backup)).replace('SOURCE_TEXT', shlex.quote(source))
report['installedSha256'] = remote(deployment).split()[0]
assert report['installedSha256'] == report['sourceSha256']
after = json.loads(remote("ubus -S call service list '{\"name\":\"istoreenhance\"}'"))
assert before == after, 'service changed during entry update'
report['status'] = json.loads(remote('/usr/libexec/istoree/istoreenhance.sh status 192.168.30.244'))
assert report['status']['running'] == any(i.get('running') for i in after.get('istoreenhance', {}).get('instances', {}).values())
report['serviceUnchanged'] = True
report['protectedAfter'] = remote(protected).splitlines()
assert report['protectedBefore'] == report['protectedAfter']
report['backup'] = backup
report['originalSha256'] = old_sha
report['result'] = 'passed'
(out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'result': report['result'], 'cases': len(report['cases']), 'status': report['status'],
                  'installedSha256': report['installedSha256'], 'serviceUnchanged': True}, ensure_ascii=False))
