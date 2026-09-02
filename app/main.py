# app/main.py
import webview
import subprocess
import threading
import os
import time

# Fix for WebKitGTK bugs in Linux VMs / X11
os.environ['WEBKIT_DISABLE_COMPOSITING_MODE'] = '1'
os.environ['WEBKIT_DISABLE_DMABUF_RENDERER'] = '1'
os.environ['LIBGL_ALWAYS_SOFTWARE'] = '1'

from src.config import SPLASH_WIDTH, SPLASH_HEIGHT, SPLASH_BG_COLOR
from src.utils import get_screen_path, get_center_position
from src.bridge import Api

def stream_logs(pipe, tag):
    try:
        for line in iter(pipe.readline, ''):
            if line:
                print(f"[{tag}] {line.rstrip()}")
    finally:
        pipe.close()

def stream_process_logs(process, tag):
    threading.Thread(target=stream_logs, args=(process.stdout, tag), daemon=True).start()
    threading.Thread(target=stream_logs, args=(process.stderr, tag), daemon=True).start()

def main():
    splash_url = get_screen_path('splash.html')
    
    screen = webview.screens[0]
    x_pos, y_pos = get_center_position(screen, SPLASH_WIDTH, SPLASH_HEIGHT)
    
    api = Api()

    splash_window = webview.create_window(
        'Zyros Loading...', 
        splash_url,
        frameless=True,
        width=SPLASH_WIDTH, 
        height=SPLASH_HEIGHT,
        x=x_pos,
        y=y_pos,
        resizable=False,
        on_top=True,
        background_color=SPLASH_BG_COLOR,
        js_api=api
    )
    api.splash_window = splash_window
    
    webview.start(http_server=True)

if __name__ == '__main__':
    main()
