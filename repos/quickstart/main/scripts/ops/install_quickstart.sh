#!/bin/sh
# Quickstart 1023-homepage: default to read-only inspection.
set -eu

RELEASE_URL='https://fw.koolcenter.com/iStoreOS/alpha/quickstart/1023-homepage'
MODE=check
BACKUP_FILE=
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
usage() {
    cat <<'EOF'
Quickstart 1023-homepage (Alpha)
  sh install_quickstart.sh --check
  sh install_quickstart.sh --install --backup-file /mnt/EXTERNAL/system-backup.tar.gz

Default: read-only inspection, without downloads, index updates or installation.
Installation requires an existing full-system backup on external storage and
two interactive confirmations. Downloaded packages and logs are retained.
EOF
}
while [ "$#" -gt 0 ]; do
    case "$1" in
        --check) MODE=check; shift ;;
        --install) MODE=install; shift ;;
        --backup-file)
            [ "$#" -ge 2 ] || fail '--backup-file needs a path'
            BACKUP_FILE=$2; shift 2 ;;
        --help|-h) usage; exit 0 ;;
        *) fail "Unknown argument: $1" ;;
    esac
done

MACHINE=$(uname -m)
case "$MACHINE" in
    aarch64|arm64) ARCH=arm64 ;;
    x86_64|amd64) ARCH=x86_64 ;;
    *) fail "Unsupported architecture: $MACHINE" ;;
esac
HAS_OPKG=0
HAS_APK=0
if command -v opkg >/dev/null 2>&1 &&
    opkg status base-files 2>/dev/null | grep -q '^Status: .* installed$'; then
    HAS_OPKG=1
fi
if command -v apk >/dev/null 2>&1 && apk info -e base-files >/dev/null 2>&1; then
    HAS_APK=1
fi
case "$HAS_OPKG/$HAS_APK" in
    1/0) FORMAT=ipk ;;
    0/1) FORMAT=apk ;;
    *) fail "Ambiguous/invalid package databases: opkg=$HAS_OPKG apk=$HAS_APK" ;;
esac

QS_VERSION=0.17.0-test20261022
NP_VERSION=0.2.0-test20260928
UI_VERSION=0.17.0-test20261022-r1
case "$ARCH/$FORMAT" in
    x86_64/ipk)
        QS_FILE=quickstart_0.17.0-test20261022-1_x86_64.ipk
        NP_FILE=quickstart-netpolicy_0.2.0-test20260928-3_x86_64.ipk
        UI_FILE=luci-app-quickstart_0.17.0-test20261022-r1_all.ipk
        QS_VERSION=$QS_VERSION-1; NP_VERSION=$NP_VERSION-3
        QS_SHA=23765e3d41b69badce0d7520f806f6f6dfc5294f20cd60ccb348159f3acd49c4
        NP_SHA=13c1113e1115c2f63b352ae3e0c90beb4ac710387ae8d52672469bc906cbe54f
        UI_SHA=216c548d9e65084fdc92681301bd5cd048230deb0e684e71031c68336019adc9
        ;;
    arm64/ipk)
        QS_FILE=quickstart_0.17.0-test20261022-r1_aarch64_generic.ipk
        NP_FILE=quickstart-netpolicy_0.2.0-test20260928-r3_aarch64_generic.ipk
        UI_FILE=luci-app-quickstart_0.17.0-test20261022-r1_all.ipk
        QS_VERSION=$QS_VERSION-r1; NP_VERSION=$NP_VERSION-r3
        QS_SHA=e45612baeec5e0cc6c1ffc5fc737460d4f53d446595124577ae30bdf5910a745
        NP_SHA=94769586beda39850027bfcd45fa9cc07c6acd516b01d582995841802807fcab
        UI_SHA=d6ef4d0c9a77c9f562e1ff4682f07fda225f7516ae44bacc93f1e1f04ceaf209
        ;;
    x86_64/apk|arm64/apk)
        QS_FILE=quickstart-0.17.0_git20261022-r1.apk
        NP_FILE=quickstart-netpolicy-0.2.0_git20260928-r3.apk
        UI_FILE=luci-app-quickstart-0.17.0_git20261022-r1.apk
        QS_VERSION=0.17.0_git20261022-r1
        NP_VERSION=0.2.0_git20260928-r3
        UI_VERSION=0.17.0_git20261022-r1
        if [ "$ARCH" = x86_64 ]; then
            QS_SHA=0cd73176a0669016e10bfd6fcf6012a779f3aa52697e3c0ee0e32f966898c57b
            NP_SHA=99d949d6bf7731737fa2057091f76e6b8a1e65c01127de830eee7c24095489b4
            UI_SHA=3b3c248cf4a24191641a58a32eb938afaac17835f6134f7637ef117b1bbf7048
        else
            QS_SHA=b4f74560b4b685e32e2ce96727eded8ee3dc005645db7eb6a31e5b9033134551
            NP_SHA=ef86b2b834f6858e5fb9cd0cd511713ab9bb7c4e76d13f3c00dcaec124b845f2
            UI_SHA=3b3c248cf4a24191641a58a32eb938afaac17835f6134f7637ef117b1bbf7048
        fi
        ;;
esac
DOWNLOAD_URL=$RELEASE_URL/$ARCH/$FORMAT
printf 'Architecture: %s -> %s\nPackage format: %s\nDownload: %s/\n' "$MACHINE" "$ARCH" "$FORMAT" "$DOWNLOAD_URL"
printf 'Targets:\n  %s\n  %s\n  %s\n' "$QS_FILE" "$NP_FILE" "$UI_FILE"
printf 'Current packages:\n'
if [ "$FORMAT" = ipk ]; then
    opkg list-installed | grep -E '^(quickstart|quickstart-netpolicy|luci-app-quickstart) - ' || true
else
    apk list --installed quickstart quickstart-netpolicy luci-app-quickstart || true
fi
if command -v quickstart >/dev/null 2>&1; then quickstart version || true; fi
df -h / /tmp
if [ "$MODE" = check ]; then
    printf 'Read-only check complete. Use --install --backup-file PATH to install.\n'
    exit 0
fi

[ "$(id -u)" = 0 ] || fail 'Installation requires root'
[ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ] ||
    fail 'Provide an existing, nonempty full-system backup with --backup-file'
BACKUP_FILE=$(readlink -f "$BACKUP_FILE")
BACKUP_MOUNT=$(df -P "$BACKUP_FILE" | awk 'NR==2 {print $NF}')
case "$BACKUP_MOUNT" in
    ''|/|/tmp|/overlay|/ext_overlay|/rom) fail 'The full-system backup must be on external storage' ;;
esac
command -v curl >/dev/null 2>&1 || fail 'curl with HTTPS certificate support is required'
command -v sha256sum >/dev/null 2>&1 || fail 'sha256sum is required'
confirm() {
    printf '%s Type INSTALL to continue: ' "$1"
    ANSWER=
    if ! read -r ANSWER </dev/tty; then fail 'Interactive confirmation is required'; fi
    [ "$ANSWER" = INSTALL ] || fail 'Cancelled; existing files are retained'
}
printf 'Full-system backup: %s (mount: %s)\n' "$BACKUP_FILE" "$BACKUP_MOUNT"
confirm 'Confirm that this is a valid full-system backup. Update indexes and download these Alpha packages?'
if [ "$FORMAT" = ipk ]; then opkg update; else apk update; fi
WORK=$(mktemp -d /tmp/quickstart-1023-homepage.XXXXXX)
printf 'Keeping downloaded files and logs in %s\n' "$WORK"
cd "$WORK"
for FILE in "$QS_FILE" "$NP_FILE" "$UI_FILE"; do
    curl --fail --location --silent --show-error --proto '=https' --proto-redir '=https' \
        --connect-timeout 20 --max-time 300 "$DOWNLOAD_URL/$FILE" --output "$FILE"
    [ -s "$FILE" ] || fail "Empty download: $FILE"
done
printf '%s  %s\n%s  %s\n%s  %s\n' \
    "$QS_SHA" "$QS_FILE" "$NP_SHA" "$NP_FILE" "$UI_SHA" "$UI_FILE" >SHA256SUMS
sha256sum -c SHA256SUMS
ls -lh "$QS_FILE" "$NP_FILE" "$UI_FILE"
cat SHA256SUMS
df -h / /tmp
if [ "$FORMAT" = ipk ]; then
    if opkg --noaction install "./$QS_FILE" "./$NP_FILE" "./$UI_FILE" >preflight.log 2>&1; then
        cat preflight.log
    else cat preflight.log; fail 'Dependency/architecture preflight failed'; fi
else
    if apk add --simulate --allow-untrusted "./$QS_FILE" "./$NP_FILE" "./$UI_FILE" >preflight.log 2>&1; then
        cat preflight.log
    else cat preflight.log; fail 'Dependency/architecture preflight failed'; fi
fi
confirm 'SHA256 and dependency preflight passed. Install backend/netpolicy, then LuCI?'
if [ "$FORMAT" = ipk ]; then
    opkg install "./$QS_FILE" "./$NP_FILE" >install-runtime.log 2>&1 || {
        cat install-runtime.log; fail 'Runtime installation failed; LuCI was not installed'; }
    cat install-runtime.log
    opkg install "./$UI_FILE" >install-luci.log 2>&1 || {
        cat install-luci.log; fail 'LuCI installation failed'; }
else
    apk add --allow-untrusted "./$QS_FILE" "./$NP_FILE" >install-runtime.log 2>&1 || {
        cat install-runtime.log; fail 'Runtime installation failed; LuCI was not installed'; }
    cat install-runtime.log
    apk add --allow-untrusted "./$UI_FILE" >install-luci.log 2>&1 || {
        cat install-luci.log; fail 'LuCI installation failed'; }
fi
cat install-luci.log
check_version() {
    PACKAGE=$1 EXPECTED=$2
    if [ "$FORMAT" = ipk ]; then
        ACTUAL=$(opkg status "$PACKAGE" | awk '/^Version: / {print $2}')
        opkg status "$PACKAGE" | grep -q '^Status: .* installed$' || fail "$PACKAGE is not installed"
        [ "$ACTUAL" = "$EXPECTED" ] || fail "$PACKAGE version mismatch: $ACTUAL, expected $EXPECTED"
    else
        apk info -e "$PACKAGE=$EXPECTED" >/dev/null ||
            fail "$PACKAGE version mismatch: expected $EXPECTED"
    fi
    printf 'Verified installed: %s %s\n' "$PACKAGE" "$EXPECTED"
}
check_version quickstart "$QS_VERSION"
check_version quickstart-netpolicy "$NP_VERSION"
check_version luci-app-quickstart "$UI_VERSION"
quickstart version
if [ -x /etc/init.d/quickstart ]; then /etc/init.d/quickstart status; fi
printf 'Package installation verified. Verify authenticated homepage and /lanctrl/v2/devices/ before accepting business functionality.\n'
