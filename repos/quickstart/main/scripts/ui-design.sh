#!/usr/bin/env bash
# Independent preview owner. Never stop an unrelated listener on 5180.
set -euo pipefail
repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
server="$repo_root/scripts/ui-design-server.cjs"
legacy_server="$repo_root/docs/product/ui-design/serve.py"
cache_runner=/var/cache/build-cache/run.sh
owner=$(printf '%s' "$repo_root" | sha256sum | cut -c 1-12)
runtime_dir="${XDG_RUNTIME_DIR:-/tmp}/quickstart-ui-design-$UID-$owner"
mkdir -p -m 700 "$runtime_dir"
pid_file="$runtime_dir/5180.pid"
log_file="$runtime_dir/5180.log"
exec 9>"$runtime_dir/5180.lock"
flock 9
running() {
    pid=""
    [[ -f "$pid_file" ]] || return 1
    read -r pid < "$pid_file" || return 1
    [[ "$pid" =~ ^[1-9][0-9]*$ ]] || return 1
    kill -0 "$pid" 2>/dev/null || return 1
    [[ -r "/proc/$pid/cmdline" ]] || return 1
    local -a args=()
    mapfile -d '' -t args < "/proc/$pid/cmdline"
    [[ "${args[1]:-}" == "$server" || ( "${args[1]:-}" == '-u' && "${args[2]:-}" == "$legacy_server" ) ]]
}
port_busy() { [[ -n "$(ss -H -ltn 'sport = :5180')" ]]; }
case "${1:-status}" in
    run)
        if running || port_busy; then
            echo 'Port 5180 is occupied; no process was stopped.' >&2; exit 1
        fi
        echo "$$" > "$pid_file"
        exec 9>&-
        cd "$repo_root/web"
        exec "$cache_runner" --project "$repo_root" -- node "$server"
        ;;
    start)
        if running; then echo "Already running: PID=$pid http://127.0.0.1:5180/"; exit 0; fi
        if port_busy; then echo 'Port 5180 is occupied; no process was stopped.' >&2; exit 1; fi
        command -v setsid >/dev/null
        [[ -x "$cache_runner" ]] || { echo "SSD build-cache entry missing: $cache_runner" >&2; exit 1; }
        cd "$repo_root/web"
        nohup setsid "$cache_runner" --project "$repo_root" -- node "$server" > "$log_file" 2>&1 < /dev/null 9>&- &
        pid=$!
        echo "$pid" > "$pid_file"
        # Vue cold builds can exceed 40s on a busy shared development host.
        for ((attempt=0; attempt<1800; attempt++)); do
            if ! kill -0 "$pid" 2>/dev/null; then rm -f "$pid_file"; cat "$log_file" >&2; exit 1; fi
            if running && curl -fsS --max-time 1 http://127.0.0.1:5180/health 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d["owner"]==sys.argv[1] and d["pid"]==int(sys.argv[2]) else 1)' "$repo_root/docs/product/ui-design" "$pid" 2>/dev/null; then
                echo "Started: PID=$pid http://127.0.0.1:5180/"; echo "Log: $log_file"; exit 0
            fi
            sleep 0.1
        done
        if running; then kill "$pid"; fi
        rm -f "$pid_file"
        echo "Preview did not become ready; inspect $log_file" >&2; exit 1
        ;;
    stop)
        if running; then
            kill "$pid"
            for ((attempt=0; attempt<40; attempt++)); do
                if ! running; then rm -f "$pid_file"; echo 'Stopped.'; exit 0; fi
                sleep 0.1
            done
            echo "Recorded preview did not exit; inspect PID=$pid." >&2; exit 1
        fi
        rm -f "$pid_file"; echo 'Not running.'
        ;;
    status)
        if running; then echo "Running: PID=$pid http://127.0.0.1:5180/"; else echo 'Not running.'; fi
        ss -ltnp 'sport = :5180'
        ;;
    logs) if [[ -f "$log_file" ]]; then tail -n 50 "$log_file"; else echo 'No log yet.'; fi ;;
    *) echo "Usage: $0 {start|run|stop|status|logs}" >&2; exit 2 ;;
esac
