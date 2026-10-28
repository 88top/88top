#!/usr/bin/env python3
"""Back up B's actual files privately before a matched homepage package upgrade."""
import argparse
import json
from pathlib import Path
import re
import shlex
import subprocess

p = argparse.ArgumentParser()
p.add_argument('stage')
p.add_argument('output', type=Path)
a = p.parse_args()
assert re.fullmatch(r'/root/quickstart-package-candidates/home-[a-z0-9-]+', a.stage)
assert not a.output.exists()
command = 'stage=' + shlex.quote(a.stage) + r'''
set -eu
umask 077
test ! -e "$stage"
test "$(uci -q get quickstart-netpolicy.main.enabled)" = 0
test -z "$(pidof quickstart-netpolicy || true)"
mkdir -p "$stage/backup"
chmod 700 "$stage" "$stage/backup"
record() {
    destination=$1
    shift
    : > "$stage/$destination"
    for file in "$@"; do
        if test -f "$file"; then sha256sum "$file" >> "$stage/$destination"
        else printf 'MISSING  %s\n' "$file" >> "$stage/$destination"; fi
    done
}
record home-before.sha256 /etc/quickstart/home-layout.json /etc/quickstart/home-layout.json.bak /etc/quickstart/home-layout.json.damaged /etc/quickstart/home-layout.json.bak.damaged /etc/quickstart/home-launcher.json /etc/quickstart/home-launcher.json.bak /etc/quickstart/home-launcher.json.damaged /etc/quickstart/home-launcher.json.bak.damaged
record config-before.sha256 /etc/config/network /etc/config/dhcp /etc/config/firewall /etc/config/quickstart /etc/config/eqos /etc/config/floatip /etc/config/quickstart-netpolicy
record business-before.sha256 /etc/quickstart/device-profiles.json /etc/quickstart/device-classifications.json /etc/quickstart/manual-devices.json /etc/quickstart/device-groups.json /etc/quickstart/rate-limit-provider
ip -4 route show default > "$stage/default-route-before.txt"
ip -4 addr show dev br-lan > "$stage/address-before.txt"
cp -p /etc/config/network "$stage/backup/network.before"
for package in quickstart luci-app-quickstart quickstart-netpolicy; do
    opkg files "$package"
done | awk '/^\// {print}' | sort -u > "$stage/owned-paths.txt"
cat "$stage/home-before.sha256" "$stage/config-before.sha256" "$stage/business-before.sha256" | awk '$1 != "MISSING" {print $2}' > "$stage/state-paths.txt"
cat "$stage/owned-paths.txt" "$stage/state-paths.txt" | sort -u | while IFS= read -r file; do
    if test -f "$file" || test -L "$file"; then printf '%s\n' "${file#/}"; fi
done > "$stage/backup-paths.txt"
tar -C / -czf "$stage/backup/preinstall.tar.gz" -T "$stage/backup-paths.txt"
tar -C / -czf "$stage/backup/package-records.tar.gz" usr/lib/opkg/status usr/lib/opkg/info/quickstart.control usr/lib/opkg/info/quickstart.list usr/lib/opkg/info/luci-app-quickstart.control usr/lib/opkg/info/luci-app-quickstart.list usr/lib/opkg/info/quickstart-netpolicy.control usr/lib/opkg/info/quickstart-netpolicy.list
chmod 600 "$stage/backup/"*
sha256sum "$stage/backup/preinstall.tar.gz" "$stage/backup/package-records.tar.gz" "$stage/backup/network.before"
'''
result = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5',
                         'root@192.168.30.244', command], text=True, capture_output=True, timeout=90)
report = {'host': '192.168.30.244', 'stage': a.stage, 'result': 'passed' if result.returncode == 0 else 'failed',
          'exitCode': result.returncode, 'privateBackupFingerprints': result.stdout.strip().splitlines(),
          'diagnostic': result.stderr.strip(), 'scope': 'private backup only; no config or service changes'}
a.output.parent.mkdir(parents=True, exist_ok=True)
a.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False))
raise SystemExit(result.returncode)
