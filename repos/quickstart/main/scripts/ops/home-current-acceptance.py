#!/usr/bin/env python3
"""B-only authenticated homepage acceptance; temporary root sessions destroyed.

This intentionally exercises homepage configuration writes, restoring the
captured baseline through optimistic versions. It never changes network policy.
"""
import datetime
import json
import os
from pathlib import Path
import secrets
import shlex
import subprocess
import sys
import tarfile

HOST = '192.168.30.244'
OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=False)


def remote(command):
    return subprocess.check_output(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', 'root@' + HOST, command], text=True, timeout=30)


def ubus(method, data):
    result = remote('ubus -S call session ' + method + ' ' + shlex.quote(json.dumps(data)))
    return json.loads(result) if result.strip() else {}


sessions = []
report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'host': HOST,
          'scope': 'homepage-config-only', 'board': json.loads(remote('ubus call system board')),
          'version': remote('/usr/sbin/quickstart version --more').strip(),
          'fingerprints': remote('sha256sum /usr/sbin/quickstart /www/luci-static/quickstart/index.js /www/luci-static/quickstart/style.css /www/luci-static/quickstart/vendor.js /www/luci-static/quickstart/i18n/en.json').strip().splitlines(),
          'processFingerprints': remote('for pid in $({ pidof quickstart; pidof startdhns; } 2>/dev/null | tr " " "\\n" | sort -u); do sha256sum /proc/$pid/exe; done').strip().splitlines(),
          'packages': remote("opkg list-installed | awk '$1 ~ /^(quickstart|luci-app-quickstart|quickstart-netpolicy)$/ {print}'").strip().splitlines()}
if os.environ.get('QS_EXPECT_ENTRY_SHA'):
    report['entryScriptSha256'] = remote('sha256sum /usr/libexec/istoree/istoreenhance.sh').split()[0]
    assert report['entryScriptSha256'] == os.environ['QS_EXPECT_ENTRY_SHA'], 'Installed dynamic entry script differs'
if os.environ.get('QS_EXPECT_MANIFEST'):
    manifest = dict(line.split('=', 1) for line in Path(os.environ['QS_EXPECT_MANIFEST']).read_text().splitlines())
    assert report['version'].split()[:2] == [manifest['version'], manifest['git_sha']], report['version']
    expected = {'/usr/sbin/quickstart': manifest['quickstart.x86_64'],
                '/www/luci-static/quickstart/index.js': manifest['web.index.js'],
                '/www/luci-static/quickstart/style.css': manifest['web.style.css'],
                '/www/luci-static/quickstart/vendor.js': manifest['web.vendor.js'],
                '/www/luci-static/quickstart/i18n/en.json': manifest['web.i18n.en.json']}
    actual = {line.split()[1]: line.split()[0] for line in report['fingerprints']}
    assert actual == expected, 'Installed files do not match the runtime manifest'
    assert report['processFingerprints'] and all(line.split()[0] == manifest['quickstart.x86_64']
                                               for line in report['processFingerprints']), 'Running process differs from package'
    package_version = manifest['version']
    if os.environ.get('QS_ACCEPT_RUNTIME_CANDIDATE') == '1':
        package_version = os.environ['QS_EXPECT_PACKAGE_VERSION']
        report['installation'] = 'Direct runtime candidate; original opkg package records retained, not a package-install acceptance'
    expected_packages = {'quickstart - ' + package_version + '-2',
                         'luci-app-quickstart - ' + package_version + '-r2',
                         'quickstart-netpolicy - 0.2.0-test20260928-2'}
    assert set(report['packages']) == expected_packages, report['packages']
    policy_archive = Path(os.environ['QS_EXPECT_MANIFEST']).parent / 'quickstart-netpolicy-0.2.0-test20260928-x86_64-unknown-linux-musl.tar.gz'
    with tarfile.open(policy_archive) as archive:
        frozen_policy = json.load(archive.extractfile('manifest.json'))
    installed_policy = json.loads(remote('cat /usr/share/quickstart-netpolicy/manifest.json'))
    assert installed_policy == frozen_policy, 'Installed NetPolicy manifest differs from the frozen archive'
    policy_sha = remote('sha256sum /usr/bin/quickstart-netpolicy').split()[0]
    assert policy_sha == frozen_policy['binarySha256'], 'Installed NetPolicy binary differs from its archive'
    policy_enabled = remote('uci -q get quickstart-netpolicy.main.enabled').strip()
    policy_process = remote('pidof quickstart-netpolicy || true').strip()
    assert policy_enabled == '0' and not policy_process, 'Homepage package acceptance must not enable the policy engine'
    report['netpolicy'] = {'binarySha256': policy_sha, 'manifest': installed_policy,
                           'enabled': policy_enabled, 'running': bool(policy_process)}
    report['matchedManifest'] = manifest['git_sha']
    os.environ['QS_EXPECT_ASSET_VERSION'] = manifest['asset_version']
try:
    for _ in range(2):
        sid = ubus('create', {'timeout': 900})['ubus_rpc_session']
        sessions.append(sid)
        ubus('set', {'ubus_rpc_session': sid, 'values': {'username': 'root', 'token': secrets.token_hex(16)}})
        for scope, objects in [('ubus', [['*', '*']]), ('access-group', [['*', 'read']]), ('uci', [['*', 'read']])]:
            ubus('grant', {'ubus_rpc_session': sid, 'scope': scope, 'objects': objects})
    env = dict(os.environ, NODE_PATH='/config/playwright-runner/node_modules', QS_ACCEPT_HOST=HOST,
               QS_ACCEPT_SID=sessions[0], QS_ACCEPT_SECOND_SID=sessions[1], QS_ACCEPT_OUT=str(OUT.resolve()))
    test_script = Path(__file__).with_name('home-current-acceptance.cjs')
    if os.environ.get('QS_ACCEPT_LAYOUT_NOTICE') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/layout-notice-review.cjs'
    if os.environ.get('QS_ACCEPT_WIDGET_MENUS') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/widget-menu-removal-review.cjs'
    if os.environ.get('QS_ACCEPT_CONNECTION_WIZARD') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/connection-wizard-review.cjs'
    if os.environ.get('QS_ACCEPT_SYSTEM_LOADING') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/system-loading-review.cjs'
        env['QS_SYSTEM_EVIDENCE'] = str(OUT.resolve() / 'system-loading')
    if os.environ.get('QS_ACCEPT_INSTALLED_APPS') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/installed-apps-review.cjs'
        env['QS_INSTALLED_EVIDENCE'] = str(OUT.resolve() / 'installed-apps')
    if os.environ.get('QS_ACCEPT_APP_ICONS') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/installed-app-icons-review.cjs'
        env['QS_ICONS_EVIDENCE'] = str(OUT.resolve() / 'app-icons')
    if os.environ.get('QS_ACCEPT_LAUNCHER_ENTRY') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/launcher-entry-review.cjs'
        env['QS_ENTRY_EVIDENCE'] = str(OUT.resolve() / 'launcher-entry')
    if os.environ.get('QS_ACCEPT_PINNED_ENTRY') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/pinned-entry-review.cjs'
        env['QS_PINNED_EVIDENCE'] = str(OUT.resolve() / 'pinned-entry')
    if os.environ.get('QS_ACCEPT_SCROLL_TRACE') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/home-scroll-trace.cjs'
        env['QS_SCROLL_TRACE_EVIDENCE'] = str(OUT.resolve() / 'scroll-trace')
    if os.environ.get('QS_ACCEPT_REFRESH') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/home-refresh-review.cjs'
        env['QS_REFRESH_EVIDENCE'] = str(OUT.resolve() / 'refresh')
    if os.environ.get('QS_ACCEPT_APP_HEADER') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/app-header-review.cjs'
        env['QS_APP_HEADER_EVIDENCE'] = str(OUT.resolve() / 'app-header')
    if os.environ.get('QS_ACCEPT_DETAIL_HEADER') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/detail-header-review.cjs'
        env['QS_DETAIL_HEADER_EVIDENCE'] = str(OUT.resolve() / 'detail-header')
    if os.environ.get('QS_ACCEPT_FASTNET') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/fastnet-entry-review.cjs'
        env['QS_FASTNET_EVIDENCE'] = str(OUT.resolve() / 'fastnet')
    if os.environ.get('QS_ACCEPT_HOME_COLOR') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/home-semantic-colour-device-review.cjs'
    if os.environ.get('QS_ACCEPT_HOME_SPACING') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/home-page-spacing-review.cjs'
    if os.environ.get('QS_ACCEPT_HEADER_BAND') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/home-header-band-review.cjs'
    if os.environ.get('QS_ACCEPT_SYSTEM_TIME') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/system-time-alignment-review.cjs'
    if os.environ.get('QS_ACCEPT_SYSTEM_FACTS') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/system-facts-review.cjs'
    if os.environ.get('QS_ACCEPT_SERVICE_WIDGETS') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/service-widgets-review.cjs'
    if os.environ.get('QS_ACCEPT_DEVICE_SPACING') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/device-page-spacing-review.cjs'
    if os.environ.get('QS_ACCEPT_DEVICE_VISUAL') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/device-visual-refinement-review.cjs'
    if os.environ.get('QS_ACCEPT_LAN_SETTINGS') == '1':
        test_script = Path(__file__).resolve().parents[2] / 'docs/product/ui-design/lan-settings-refinement-review.cjs'
    result = subprocess.run(['node', str(test_script)], env=env, timeout=480)
    report['uiExitCode'] = result.returncode
finally:
    for sid in sessions:
        ubus('destroy', {'ubus_rpc_session': sid})
    report['sessionsDestroyed'] = len(sessions)
    (OUT / 'device.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
sys.exit(report.get('uiExitCode', 1))
