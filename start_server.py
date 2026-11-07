import http.server
import socketserver
import webbrowser
import urllib.parse
import os
import sys
import glob

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(DIRECTORY, '전기기능사 실기 공개문제')


def find_problem_pdf(prob_num):
    pattern = os.path.join(PDF_DIR, f'전기기능사-{prob_num:03d}-*.pdf')
    matches = sorted(glob.glob(pattern))
    return matches[0] if matches else None


def build_merged_pdf_bytes(items):
    """
    items: list of (prob_num, page_num_1based)
    전기기능사 실기 공개문제 폴더의 원본 PDF에서 지정한 페이지만 추출해 하나의 PDF 바이트로 병합
    """
    import pymupdf
    out_doc = pymupdf.open()
    opened_docs = {}
    try:
        for prob_num, page_num in items:
            if prob_num not in opened_docs:
                pdf_path = find_problem_pdf(prob_num)
                if not pdf_path or not os.path.isfile(pdf_path):
                    continue
                opened_docs[prob_num] = pymupdf.open(pdf_path)
            src_doc = opened_docs[prob_num]
            idx = page_num - 1
            if 0 <= idx < len(src_doc):
                out_doc.insert_pdf(src_doc, from_page=idx, to_page=idx)
        return out_doc.tobytes(garbage=3, deflate=True)
    finally:
        for d in opened_docs.values():
            d.close()
        out_doc.close()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/merge-pdf':
            self.handle_merge_pdf(parsed.query)
            return
        super().do_GET()

    def handle_merge_pdf(self, query_string):
        try:
            params = urllib.parse.parse_qs(query_string)
            # items 형식: "1:5,1:6,1:7,2:5..."
            raw_items = params.get('items', [''])[0]
            filename = params.get('filename', ['전기기능사_실기_공개문제_선택페이지.pdf'])[0]
            if not filename.lower().endswith('.pdf'):
                filename += '.pdf'

            items = []
            for token in raw_items.split(','):
                token = token.strip()
                if ':' in token:
                    p_str, pg_str = token.split(':', 1)
                    items.append((int(p_str), int(pg_str)))

            if not items:
                self.send_error(400, 'No pages specified')
                return

            pdf_bytes = build_merged_pdf_bytes(items)
            encoded_name = urllib.parse.quote(filename)

            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Length', str(len(pdf_bytes)))
            self.send_header('Content-Disposition', f"inline; filename*=UTF-8''{encoded_name}")
            self.end_headers()
            self.wfile.write(pdf_bytes)
        except Exception as e:
            self.send_error(500, f'PDF Merge Error: {e}')

    def end_headers(self):
        # 로컬 캐시 방지 헤더
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()


def run():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}/index.html"
            print("=" * 60)
            print(f"[Electric Sequence] Server is running at: {url}")
            print("=" * 60)
            webbrowser.open(url)
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 10048:  # 포트 충돌 시 8001로 시도
            with socketserver.TCPServer(("", PORT + 1), Handler) as httpd:
                url = f"http://localhost:{PORT + 1}/index.html"
                print(f"👉 접속 주소: {url}")
                webbrowser.open(url)
                httpd.serve_forever()
        else:
            raise e


if __name__ == '__main__':
    run()
