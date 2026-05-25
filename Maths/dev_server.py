"""
GEII Visual Toolbox — Dev Server
================================
Drop-in replacement for `python -m http.server 8123`.

Why this exists
---------------
The browser caches ES modules aggressively. When `main.js` is cache-busted via
`?v=Date.now()` but its sub-imports (e.g. `./plots/fusion-modes.js`) are NOT,
the browser may serve a stale sub-module — causing import errors like
"does not provide an export named X".

This server sends `Cache-Control: no-store, no-cache, must-revalidate` on every
JS/CSS/HTML/JSON response so the browser ALWAYS fetches fresh during dev.

Usage
-----
    python dev_server.py          # default port 8123
    python dev_server.py 8200     # custom port

Production note
---------------
For deploy, replace this with a real static host (Cloudflare, Netlify) and
enable proper caching with content-hash filenames. This server is DEV ONLY.
"""

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    """Static handler that disables caching for hot-reload friendliness."""

    # MIME type overrides — make sure .js modules are served correctly
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".json": "application/json",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".wasm": "application/wasm",
    }

    def end_headers(self):
        # Anti-cache headers on every response.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        # Allow ES module CORS in case of cross-origin tooling
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, format, *args):
        # Quieter logs — only show non-2xx responses
        try:
            status = int(args[1])
            if status >= 400:
                sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))
        except (IndexError, ValueError):
            sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    with ThreadingHTTPServer(("", port), NoCacheHandler) as httpd:
        print(f"╔══════════════════════════════════════════════════════════════╗")
        print(f"║  GEII Visual Toolbox — Dev Server                              ║")
        print(f"║  http://localhost:{port}/                                       ║")
        print(f"║  Cache: DISABLED (every request → fresh)                       ║")
        print(f"╚══════════════════════════════════════════════════════════════╝")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[server] stopped.")


if __name__ == "__main__":
    main()
