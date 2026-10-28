local function get_installed_and_cache()
    local metadir = "/usr/lib/opkg/meta"
    local cachedir = "/tmp/cache/istore"
    local cachefile = cachedir .. "/installed.json"
    local metapkgpre = "app-meta-"
    local nixio = require "nixio"
    local fs   = require "nixio.fs"
    local ipkg = require "luci.model.ipkg"
    local jsonc = require "luci.jsonc"
    local result = {}
    local lock, msg = flock("/var/lock/istore-installed.lock", "lock")
    local ms = fs.stat(metadir)
    local cs = fs.stat(cachefile)
    if not ms then
        result = {}
    elseif not cs or ms["mtime"] > cs["mtime"] then
        local itr = fs.dir(metadir)
        local data = {}
        if itr then
            local i18n = require("luci.i18n")
            local pkg
            for pkg in itr do
                if pkg:match("^.*%.json$") then
                    local metadata = fs.readfile(metadir .. "/" .. pkg)
                    if metadata ~= nil then
                        local meta = jsonc.parse(metadata)
                        if meta == nil then
                            local name = pkg:gsub("^(.-)%.json$", "%1")
                            meta = {
                                name = name,
                                title = "{ " .. name .. " }",
                                author = "<UNKNOWN>",
                                version = "0.0.0",
                                description = i18n.translate("This package is broken! Please reinstall or uninstall it."),
                                depends = {},
                                tags = {"broken"},
                                broken = true,
                            }
                        end
                        local metapkg = metapkgpre .. meta.name
                        local status = ipkg.status(metapkg)
                        if next(status) ~= nil then
                            meta.time = tonumber(status[metapkg]["Installed-Time"])
                            data[#data+1] = meta
                        end
                    end
                end
            end
        end
        result = data
        fs.mkdirr(cachedir)
        local oflags = nixio.open_flags("rdwr", "creat")
        local mfile, code, msg = nixio.open(cachefile, oflags)
        mfile:writeall(jsonc.stringify(result))
        mfile:close()
    else
        result = jsonc.parse(fs.readfile(cachefile) or "")
    end
    lock:lock("ulock")
    lock:close()
    return result
end

