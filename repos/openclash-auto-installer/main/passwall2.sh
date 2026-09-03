#!/bin/sh
set -eu

LOCKDIR="/tmp/passwall2-install.lock"
GH_API="https://api.github.com/repos/Openwrt-Passwall/openwrt-passwall2/releases/latest"
GH_REPO_PAGE="https://github.com/Openwrt-Passwall/openwrt-passwall2"
SF_BASE="https://sourceforge.net/projects/openwrt-passwall-build/files"
TMPFILES=""

register_tmp() {
    TMPFILES="$TMPFILES $1"
}

cleanup() {
    rmdir "$LOCKDIR" 2>/dev/null || true
    for f in $TMPFILES; do
        rm -f "$f" 2>/dev/null || true
    done
}

trap cleanup EXIT INT TERM

log() {
    printf '%s\n' "==> $*"
}

warn() {
    printf '%s\n' "[WARN] $*" >&2
}

die() {
    printf '%s\n' "[ERROR] $*" >&2
    exit 1
}

need_cmd() {
    command -v "$1" >/dev/null 2>&1 || die "缺少命令: $1"
}

refresh_luci() {
    rm -rf /tmp/luci-* /tmp/.luci* /tmp/etc/config/ucitrack /var/run/luci-indexcache 2>/dev/null || true
    if [ -x /etc/init.d/rpcd ]; then
        /etc/init.d/rpcd restart >/dev/null 2>&1 || warn "rpcd 重启失败"
    fi
}

download_file() {
    url="$1"
    output="$2"

    if command -v curl >/dev/null 2>&1; then
        curl -fsSL --retry 3 --connect-timeout 15 "$url" -o "$output" && return 0
        warn "curl 下载失败（将尝试跳过证书验证重试）: $url"
        curl -kfsSL --retry 2 --connect-timeout 15 "$url" -o "$output" && return 0
    fi

    if command -v wget >/dev/null 2>&1; then
        wget -qO "$output" "$url" && return 0
        warn "wget 下载失败（将尝试跳过证书验证重试）: $url"
        wget --no-check-certificate -qO "$output" "$url" && return 0
    fi

    return 1
}

fetch_text() {
    url="$1"
    tmp="$(mktemp /tmp/passwall2-page.XXXXXX)"
    register_tmp "$tmp"
    download_file "$url" "$tmp" || {
        rm -f "$tmp"
        return 1
    }
    cat "$tmp"
    rm -f "$tmp"
}

find_pkg_link() {
    page="$1"
    pkg="$2"
    ext="$3"
    link="$(printf '%s' "$page" | grep -o 'href="/projects/openwrt-passwall-build/files/[^"]*'"${pkg}"'[-_][^"]*\.'"${ext}"'[^"]*"' | sed 's|^href="||;s|"$||' | head -n1)"
    if [ -z "$link" ]; then
        warn "在 SourceForge 页面中未找到包: $pkg"
        return 1
    fi
    printf '%s\n' "$link"
}

download_pkg_from_dir() {
    pkg="$1"
    dir="$2"
    ext="$3"
    sf_dir_url="${SF_BASE}/${PACKAGE_DIR}/${dir}/"
    page="$(fetch_text "$sf_dir_url")" || {
        warn "无法获取目录页: $sf_dir_url"
        return 1
    }
    link="$(find_pkg_link "$page" "$pkg" "$ext")" || return 1

    case "$link" in
        */stats/timeline)
            link="${link%/stats/timeline}"
            ;;
    esac

    filename="$(basename "$link")"
    output="/tmp/$filename"
    register_tmp "$output"
    download_url="https://sourceforge.net${link}/download"

    log "下载: $filename" >&2
    download_file "$download_url" "$output" || {
        warn "下载失败: $download_url"
        return 1
    }
    [ -s "$output" ] || {
        warn "下载文件为空: $output"
        return 1
    }
    printf '%s\n' "$output"
}

fetch_github_latest_tag_page() {
    page="$(fetch_text "${GH_REPO_PAGE}/releases/latest")" || return 1
    printf '%s\n' "$page" \
        | sed -n 's|.*href="/Openwrt-Passwall/openwrt-passwall2/releases/tag/\([^"/?#]*\)".*|\1|p' \
        | head -n1
}

fetch_github_release_asset_urls_page() {
    tag="$1"
    [ -n "$tag" ] || return 1
    page="$(fetch_text "${GH_REPO_PAGE}/releases/expanded_assets/${tag}")" || return 1
    printf '%s\n' "$page" \
        | sed -n 's|.*href="\(/Openwrt-Passwall/openwrt-passwall2/releases/download/[^"]*\)".*|https://github.com\1|p'
}

find_github_pkg_url() {
    pkg="$1"
    ext="$2"
    {
        if [ -n "${GH_RELEASE_JSON:-}" ]; then
            printf '%s\n' "$GH_RELEASE_JSON" \
                | sed 's/"browser_download_url"/\
"browser_download_url"/g' \
                | sed -n 's/.*"browser_download_url":[[:space:]]*"\([^"]*\)".*/\1/p'
        fi
        [ -z "${GH_RELEASE_ASSET_URLS:-}" ] || printf '%s\n' "$GH_RELEASE_ASSET_URLS"
    } \
        | grep "/${pkg}[-_][0-9][^/]*\.${ext}$" \
        | head -n1
}

download_passwall2_pkg() {
    pkg="$1"
    dir="$2"
    ext="$3"
    url="$(find_github_pkg_url "$pkg" "$ext")"

    if [ -n "$url" ]; then
        filename="$(basename "$url")"
        output="/tmp/$filename"
        register_tmp "$output"
        log "下载: $filename" >&2
        if download_file "$url" "$output" && [ -s "$output" ]; then
            printf '%s\n' "$output"
            return 0
        fi
        warn "GitHub release asset 下载失败，回退 SourceForge 目录: $pkg"
    fi

    download_pkg_from_dir "$pkg" "$dir" "$ext"
}

is_package_installed() {
    pkg="$1"
    case "$PKG_MGR" in
        opkg) opkg list-installed "$pkg" 2>/dev/null | grep -q "^${pkg} -" ;;
        apk) apk info -e "$pkg" >/dev/null 2>&1 ;;
    esac
}

get_installed_version() {
    pkg="$1"
    case "$PKG_MGR" in
        opkg)
            opkg status "$pkg" 2>/dev/null | sed -n 's/^Version: //p' | head -n1 || true
            ;;
        apk)
            VER="$(apk list --installed --manifest "$pkg" 2>/dev/null | awk -v name="$pkg" '$1 == name {print $2; exit}' || true)"
            [ -n "$VER" ] || VER="$(apk info -a "$pkg" 2>/dev/null | sed -n 's/^[Vv]ersion:[[:space:]]*//p' | head -n1 || true)"
            printf '%s' "$VER"
            ;;
    esac
}

maybe_update_pkg_index() {
    case "$PKG_MGR" in
        opkg) opkg update || warn "opkg update 未完全成功，将继续使用已缓存的软件源索引" ;;
        apk) apk update || warn "apk update 未完全成功，将继续使用已缓存的软件源索引" ;;
    esac
}

install_passwall2_dependency() {
    pkg="$1"
    is_package_installed "$pkg" && return 0

    log "安装 PassWall2 依赖: $pkg"
    case "$PKG_MGR" in
        opkg) opkg install "$pkg" >/dev/null 2>&1 && return 0 ;;
        apk) apk add "$pkg" >/dev/null 2>&1 && return 0 ;;
    esac

    dep_pkg="$(download_pkg_from_dir "$pkg" passwall_packages "$PKG_EXT")" ||
        die "无法从软件源或 PassWall2 构建目录获取依赖: $pkg"
    case "$PKG_MGR" in
        opkg) opkg install "$dep_pkg" || die "安装 PassWall2 依赖失败: $pkg" ;;
        apk) apk add --allow-untrusted "$dep_pkg" || die "安装 PassWall2 依赖失败: $pkg" ;;
    esac
}

install_passwall2_dependencies() {
    for pkg in tcping geoview v2ray-geoip v2ray-geosite; do
        install_passwall2_dependency "$pkg"
    done
}

if ! mkdir "$LOCKDIR" 2>/dev/null; then
    die "已有另一个 PassWall2 任务正在运行"
fi

if command -v opkg >/dev/null 2>&1; then
    PKG_MGR="opkg"
elif command -v apk >/dev/null 2>&1; then
    PKG_MGR="apk"
else
    die "未检测到 opkg 或 apk，当前系统暂不支持"
fi

need_cmd "$PKG_MGR"
need_cmd sed
need_cmd grep
need_cmd basename
need_cmd mktemp
need_cmd awk

[ -f /etc/openwrt_release ] || die "未检测到 /etc/openwrt_release"
# shellcheck disable=SC1091
. /etc/openwrt_release

ARCH="${DISTRIB_ARCH:-}"
REL_RAW="${DISTRIB_RELEASE:-}"
TARGET_NAME="${DISTRIB_TARGET:-}"
[ -n "$ARCH" ] || die "无法识别系统架构"
[ -n "$REL_RAW" ] || die "无法识别系统版本"

normalize_release_for_passwall2() {
    rel="$1"
    pkg_mgr="$2"
    case "$rel:$pkg_mgr" in
        25.*:apk) printf '25.12' ;;
        25.*:opkg|24.*:*) printf '24.10' ;;
        23.05*:opkg|23.0*:opkg) printf '23.05' ;;
        22.03*:opkg|22.0*:opkg) printf '22.03' ;;
        *SNAPSHOT*) printf 'snapshots' ;;
        *) printf '' ;;
    esac
}

SUPPORTED_RELEASE="$(normalize_release_for_passwall2 "$REL_RAW" "$PKG_MGR")"
[ -n "$SUPPORTED_RELEASE" ] || die "当前系统版本 ${REL_RAW} / 包管理器 ${PKG_MGR} 暂未适配 PassWall2 安装脚本。建议使用 OpenWrt 25.12+ apk，或 OpenWrt/iStoreOS/ImmortalWrt 22.03、23.05、24.10 opkg 系。"

case "$SUPPORTED_RELEASE" in
    snapshots)
        PACKAGE_DIR="snapshots/packages/$ARCH"
        ;;
    *)
        PACKAGE_DIR="releases/packages-$SUPPORTED_RELEASE/$ARCH"
        ;;
esac

log "System release: $REL_RAW"
log "Arch: $ARCH"
log "Package manager: $PKG_MGR"
[ -n "$TARGET_NAME" ] && log "Target: $TARGET_NAME"
log "Package dir: $PACKAGE_DIR"
if [ "$SUPPORTED_RELEASE" != "$REL_RAW" ]; then
    warn "当前系统版本 ${REL_RAW} 将按兼容目录 ${SUPPORTED_RELEASE} 匹配 PassWall2 软件源。"
fi
if [ "$PKG_MGR" = "apk" ]; then
    warn "检测到 OpenWrt 25.12+ apk 环境，将尝试安装上游 .apk 包；若上游尚未发布当前架构构建，会明确失败。"
fi

GH_RELEASE_JSON="$(fetch_text "$GH_API" 2>/dev/null || true)"
GH_LATEST="$(printf '%s' "$GH_RELEASE_JSON" | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1 || true)"
if [ -z "$GH_LATEST" ]; then
    GH_LATEST="$(fetch_github_latest_tag_page 2>/dev/null || true)"
fi
[ -n "$GH_LATEST" ] && log "GitHub latest release: $GH_LATEST"
GH_RELEASE_ASSET_URLS=""
if [ -z "$GH_RELEASE_JSON" ] && [ -n "$GH_LATEST" ]; then
    GH_RELEASE_ASSET_URLS="$(fetch_github_release_asset_urls_page "$GH_LATEST" 2>/dev/null || true)"
    [ -n "$GH_RELEASE_ASSET_URLS" ] && log "GitHub release assets: 已通过网页兜底获取"
fi

case "$PKG_MGR" in
    opkg)
        PKG_EXT="ipk"
        ;;
    apk)
        PKG_EXT="apk"
        ;;
    *)
        die "未知包管理器: $PKG_MGR"
        ;;
esac
OLD_VER="$(get_installed_version luci-app-passwall2)"
log "当前已安装版本: ${OLD_VER:-not installed}"
log "按接近手动 ${PKG_EXT} 的方式安装 / 更新 PassWall2"
maybe_update_pkg_index
install_passwall2_dependencies

MAIN_PKG="$(download_passwall2_pkg luci-app-passwall2 passwall2 "$PKG_EXT")" || die "下载 luci-app-passwall2 ${PKG_EXT} 失败，请检查当前系统版本/架构是否存在对应构建，或稍后重试。"
LANG_PKG="$(download_passwall2_pkg luci-i18n-passwall2-zh-cn passwall2 "$PKG_EXT")" || die "下载 luci-i18n-passwall2-zh-cn ${PKG_EXT} 失败，请稍后重试。"

case "$PKG_MGR" in
    opkg)
        INSTALL_OK=1
        if opkg install "$MAIN_PKG" "$LANG_PKG"; then
            INSTALL_OK=0
        fi
        ;;
    apk)
        INSTALL_OK=1
        if apk add --allow-untrusted "$MAIN_PKG" "$LANG_PKG"; then
            INSTALL_OK=0
        fi
        ;;
esac

if [ "$INSTALL_OK" -ne 0 ]; then
    cat >&2 <<EOF
[ERROR] PassWall2 安装失败。
可能原因：
1. 当前固件版本与 PassWall2 预编译包不匹配
2. 当前架构缺少对应依赖包，或软件源中没有兼容构建
3. 第三方固件重写了软件源，导致依赖解析异常

建议排查：
- OpenWrt 25.12+ / apk 环境请确认上游已发布对应 .apk 构建
- opkg 环境确认系统版本优先使用 22.03 / 23.05 / 24.10 系
- 执行 ${PKG_MGR} update 后重试
- 检查系统软件源配置是否存在异常或重复源
- 如为非标准固件（如 QWRT / GDQ 等），兼容性取决于上游是否提供对应构建
EOF
    exit 1
fi

NEW_VER="$(get_installed_version luci-app-passwall2)"
log "安装后版本: ${NEW_VER:-unknown}"

refresh_luci
warn "默认不主动修改 /etc/config/passwall2；如界面初次显示异常，可手动刷新页面或重新登录 LuCI"
warn "如界面初次显示为英文，请刷新页面，中文语言包会自动生效"
log "PassWall2 处理完成"
