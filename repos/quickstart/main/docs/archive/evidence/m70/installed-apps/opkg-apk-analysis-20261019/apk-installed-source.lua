local function get_installed_and_cache()
    local metadir = "/tmp/run/istore-meta/meta"
    local cachedir = "/tmp/cache/istore"
    local cachefile = cachedir .. "/installed.json"
    local nixio = require "nixio"
    local fs   = require "nixio.fs"
    local jsonc = require "luci.jsonc"
    local result = {}
    local lock, msg = flock("/var/lock/istore-installed.lock", "lock")
    local ms = fs.stat(metadir)
    local cs = fs.stat(cachefile)
    if not ms then
        result = {}
    elseif not cs or ms["mtime"] > cs["mtime"] then
        local cacheable = true
        local itr = fs.dir(metadir)
        local data = {}
        if itr then
            local i18n = require("luci.i18n")
            local pkg
            for pkg in itr do
                if pkg:match("^.*%.json$") then
                    local metafile = metadir .. "/" .. pkg
                    local metadata = fs.readfile(metafile)
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
                        local time = nil
                        local istat = fs.stat(metafile)
                        if istat ~= nil then
                            time = istat["mtime"]
                        else
                            cacheable = false
                        end
                        if time ~= nil then
                            meta.time = tonumber(time)
                            data[#data+1] = meta
                        end
                    end
                end
            end
        end
        result = data
        if cacheable then
            fs.mkdirr(cachedir)
            local oflags = nixio.open_flags("wronly", "creat", "trunc")
            local mfile, code, msg = nixio.open(cachefile, oflags)
            mfile:writeall(jsonc.stringify(result))
            mfile:close()
        end
    else
        result = jsonc.parse(fs.readfile(cachefile) or "")
    end
    lock:lock("ulock")
    lock:close()
    return result
end

