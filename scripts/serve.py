#!/usr/bin/env python
# -*- coding: utf-8 -*-
r"""
serve.py —— 在本机预览网站（只给自己看；发布到 GitHub Pages 以后不需要它）

    python C:\Users\xudon\Desktop\protein_db_site\scripts\serve.py          # 然后浏览器打开 http://localhost:8765
    python ...\serve.py --port 8766                                          # 8765 被占用时换个端口

和 python -m http.server 一样，只是每个文件都告诉浏览器「每次先检查有没有更新」（Cache-Control: no-cache），
数据更新后刷新一下就是新的（2026-10-19：用 http.server 时浏览器一直显示旧版，Ctrl+F5 也没用）。
窗口开着网站才能打开；关掉窗口（或 Ctrl+C）就停了。
"""
import argparse
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map, **{'.gz': 'application/gzip'})

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


def main():
    ap = argparse.ArgumentParser(description='本机预览网站（不缓存）')
    ap.add_argument('--port', type=int, default=8765)
    args = ap.parse_args()
    handler = functools.partial(NoCacheHandler, directory=ROOT)
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError:
        sys.exit('端口 %d 已被占用（可能之前开的预览还在运行）：关掉那个窗口，或者加 --port 8766 换一个端口' % args.port)
    print('网站预览：http://localhost:%d  （这个窗口别关；按 Ctrl+C 停止）' % args.port, flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
