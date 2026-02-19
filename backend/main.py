import webview
import os
from api import AppAPI

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    html_path = os.path.join(base_dir,'frontend','index.html')
    
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