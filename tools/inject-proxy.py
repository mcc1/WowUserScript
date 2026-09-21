"""Reverse-proxy a target site on localhost with the local userscript + libs injected.

Why this exists: the userscripts are only testable inside a userscript manager,
and the desktop app's built-in browser has none. It also blocks cross-origin
requests from external sites to localhost, so injecting local files into the
live site is impossible. Serving the site itself from 127.0.0.1 with our
scripts inlined into <head> sidesteps both. Verification only — never ship.

    python tools/inject-proxy.py keystoneloot.io keystoneloot-zh-hant.user.js
    python tools/inject-proxy.py --port 8766 archon.gg archon-zh-hant.user.js

The @require lines of the userscript are resolved to the local libs/ copies in
order, then the userscript itself is appended. Open http://127.0.0.1:<port>/…

Known limits of the proxied page (not script bugs):
- Sites that load Wowhead power.js with Next.js `lazyOnload` wait for the
  window `load` event; if a third-party resource hangs it, inject power.js by
  hand and call `$WowheadPower.refreshLinks(true)`.
- Cross-origin fetches that rely on GM_xmlhttpRequest (wago.tools has no CORS
  header) fall back to plain fetch and fail here.
"""
import argparse
import gzip
import http.server
import os
import re
import socketserver
import sys
import urllib.error
import urllib.request
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOP = {
    'content-encoding', 'transfer-encoding', 'content-length', 'connection',
    'content-security-policy', 'content-security-policy-report-only',
    'strict-transport-security',
}


def resolve_inject_files(userscript):
    """Map each @require in the userscript header to its local libs/ file."""
    files = []
    with open(os.path.join(ROOT, userscript), encoding='utf-8') as handle:
        for line in handle:
            if line.startswith('// ==/UserScript=='):
                break
            match = re.match(r'//\s*@require\s+\S*?/(libs/[^?\s]+)', line)
            if match:
                files.append(match.group(1))
    files.append(userscript)
    return files


def make_handler(upstream, inject_files):
    tags = ''.join('<script src="/__local/%s"></script>' % f for f in inject_files)

    class Handler(http.server.SimpleHTTPRequestHandler):
        protocol_version = 'HTTP/1.1'

        def log_message(self, *args):
            pass

        def serve_local(self):
            rel = self.path[len('/__local/'):].split('?')[0]
            full = os.path.join(ROOT, rel)
            if not os.path.isfile(full):
                self.send_response(404)
                self.send_header('Content-Length', '0')
                self.end_headers()
                return
            with open(full, 'rb') as handle:
                data = handle.read()
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if self.path.startswith('/__local/'):
                self.serve_local()
                return

            request = urllib.request.Request(upstream + self.path, headers={
                'User-Agent': self.headers.get('User-Agent', 'Mozilla/5.0'),
                'Accept': self.headers.get('Accept', '*/*'),
                'Accept-Language': 'en',
                'Accept-Encoding': 'gzip, deflate',
            })
            try:
                response = urllib.request.urlopen(request, timeout=30)
                status, headers, body = response.status, response.headers, response.read()
            except urllib.error.HTTPError as error:
                status, headers, body = error.code, error.headers, error.read()

            encoding = (headers.get('Content-Encoding') or '').lower()
            if encoding == 'gzip':
                body = gzip.decompress(body)
            elif encoding == 'deflate':
                body = zlib.decompress(body)

            if 'text/html' in headers.get('Content-Type', ''):
                text = body.decode('utf-8', 'replace')
                body = text.replace('</head>', tags + '</head>', 1).encode('utf-8')

            self.send_response(status)
            for key, value in headers.items():
                if key.lower() in HOP:
                    continue
                if key.lower() == 'location' and value.startswith(upstream):
                    value = value[len(upstream):]
                self.send_header(key, value)
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    return Handler


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('host', help='upstream host, e.g. keystoneloot.io')
    parser.add_argument('userscript', help='userscript at the repo root, e.g. keystoneloot-zh-hant.user.js')
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()

    inject_files = resolve_inject_files(args.userscript)
    print('injecting:', ', '.join(inject_files), file=sys.stderr)
    print('open http://127.0.0.1:%d/' % args.port, file=sys.stderr)
    with Server(('127.0.0.1', args.port), make_handler('https://' + args.host, inject_files)) as server:
        server.serve_forever()


if __name__ == '__main__':
    main()
