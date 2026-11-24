# HiveMind local server: localhost only, fixed port (browser storage is per origin), no caching so code updates apply.
import http.server, mimetypes, os

mimetypes.add_type("text/javascript", ".js")  # Windows registry can map .js to text/plain, which breaks ES modules
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

print("HiveMind is running at http://127.0.0.1:8742 (keep this window open)")
http.server.ThreadingHTTPServer(("127.0.0.1", 8742), Handler).serve_forever()
