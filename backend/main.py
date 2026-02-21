import webview
import os
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
from api import AppAPI
import time
from dotenv import load_dotenv

if hasattr(sys, 'frozen'):
    class DummyFile(object):
        def write(self, x): pass
        def flush(self): pass

    sys.stdout = DummyFile()
    sys.stderr = DummyFile()
# 1. 실행 환경에 따라 기준 경로(root)를 잡습니다.
if hasattr(sys, '_MEIPASS'):
    # 빌드 후 (.exe 실행 시)
    current_dir = os.path.join(sys._MEIPASS, 'backend')
else:
    # 디버그 모드 (python main.py 실행 시)
    current_dir = os.path.dirname(os.path.abspath(__file__))

def get_resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."),relative_path)

def main():
    #base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    #html_path = os.path.join(base_dir,'frontend','index.html')
    
    project_root = os.path.dirname(current_dir)
    
    html_path = os.path.join(project_root,'frontend','dist','index.html')
    icon_path = os.path.join(current_dir,'assets','cheeze.png')
    
    if not os.path.exists(html_path):
        print('Error: React를 먼저 빌드 해야합니다 (npm run build)')
        return
    
    api = AppAPI()
    load_dotenv()
    title = os.getenv('ORIGINAL_TITLE')
    window = webview.create_window(
        title=title,
        url = html_path,
        js_api = api,
        width=1000,
        height=800,
        #icon = icon_path
        #hidden=True
    )
    
    api.set_window(window)
    is_debug = not getattr(sys, 'frozen',False)
    webview.start(debug=is_debug,icon=icon_path)
    

if __name__ == "__main__":
    main()