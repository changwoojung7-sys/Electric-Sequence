import http.server
import socketserver
import webbrowser
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # 로컬 캐시 방지 헤더
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run():
    os.chdir(DIRECTORY)
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}/index.html"
            print("=" * 60)
            print(f"[Electric Sequence] Server is running at: {url}")
            print("=" * 60)
            webbrowser.open(url)
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 10048: # 포트 충돌 시 8001로 시도
            with socketserver.TCPServer(("", PORT + 1), Handler) as httpd:
                url = f"http://localhost:{PORT + 1}/index.html"
                print(f"👉 접속 주소: {url}")
                webbrowser.open(url)
                httpd.serve_forever()
        else:
            raise e

if __name__ == '__main__':
    run()
