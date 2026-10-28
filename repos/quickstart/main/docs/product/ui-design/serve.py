#!/usr/bin/env python3
"""Quickstart design-only server. Serves prototype and existing original icons."""
import argparse
import json
import os
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit, unquote

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ICONS = ROOT / 'web/public/luci-static/quickstart/device-icons'


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HERE), **kwargs)

    def do_GET(self):
        if urlsplit(self.path).path == '/health':
            data = json.dumps({'owner': str(HERE), 'pid': os.getpid()}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

    def translate_path(self, path):
        name = unquote(urlsplit(path).path)
        if name.startswith('/assets/device-icons/'):
            asset = ICONS / Path(name).name
            return str(asset if asset.suffix == '.webp' else HERE / '__missing__')
        if name in ['/', '/devicemanagement']:
            return str(HERE / 'index.html')
        return super().translate_path(path)


if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('--bind', default='0.0.0.0')
    args.add_argument('--port', type=int, default=5180)
    opts = args.parse_args()
    print(f'Quickstart design preview: http://{opts.bind}:{opts.port}/', flush=True)
    HTTPServer((opts.bind, opts.port), Handler).serve_forever()
