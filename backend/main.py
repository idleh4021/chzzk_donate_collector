import webview
import os
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
from api import AppAPI

def main():
    #base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    #html_path = os.path.join(base_dir,'frontend','index.html')
    
    project_root = os.path.dirname(current_dir)
    
    html_path = os.path.join(project_root,'frontend','dist','index.html')
    
    if not os.path.exists(html_path):
        print('Error: React를 먼저 빌드 해야합니다 (npm run build)')
        return
    
    api = AppAPI()
    
    window = webview.create_window(
        title='예제',
        url = html_path,
        js_api = api,
        width=1000,
        height=800
    )
    
    webview.start(debug=True)
    
    
if __name__ == "__main__":
    main()