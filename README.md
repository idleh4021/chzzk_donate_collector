🧀 Chzzk Donate Collector

치지직 후원 데이터 수집기입니다.

치지직 스트리머의 실시간 후원 내역을 수집하고 관리하기 위한 데스크톱 애플리케이션입니다.

🛠 Tech Stack

    Backend: Python 3.10+ (FastAPI / uv package manager)

    Frontend: React (Vite)

    Desktop Wrapper: pywebview

    Build Tool: PyInstaller

## 주요기능

프로그램 내 필터 설정을 통해 원하는 조건의 후원 데이터만 효율적으로 집계할 수 있습니다.

1. **기준 치즈 입력** - 후원을 식별할 최소 단위를 입력합니다.

2. **수집 조건 선택** 

   - **정확히 일치:** 입력한 기준 치즈 금액과 정확히 일치하는 후원만 기록합니다.
   - **기준 치즈 이상:** 입력한 금액보다 크거나 같은 모든 후원을 기록합니다.

3. **나머지 허용 설정** - '기준 치즈 이상' 수집 시, 금액이 기준 치즈의 배수로 딱 나누어떨어지지 않는 경우(예: 기준 100개 설정 시 150개 후원)에도 집계할지 여부를 결정합니다.(나머지는 카운트 되지 않음)

4. **집계 방식 (Count Logic)** 
 
   - **후원 1회:** 후원 발생 건수당 1회로 집계합니다.
   - **기준 치즈 배수:** 총 후원 금액을 기준 치즈로 나눈 배수만큼 횟수를 집계합니다.  
     *(예: 기준 치즈가 100개일 때 500개 후원이 들어오면 5회로 집계)*

💻 개발 및 실행 방법

   ⚙️환경 설정 (Backend)

uv를 사용하여 가상환경 및 의존성을 설치합니다.


    # 프로젝트 루트에서
    ```
    uv sync

    python run_app.py
    ```


📦 배포 파일 빌드 (PyInstaller)

Windows 환경에서 독립형 실행 파일(.exe)을 생성하는 방법입니다. 아이콘 및 정적 자산 경로가 포함되어 있습니다.

```
uv run pyinstaller --noconsole --onefile \
--icon="backend/assets/icon.ico" \
--add-data "frontend/dist;frontend/dist" \
--add-data "backend/assets;backend/assets" \
--collect-all webview \
backend/main.py
```

⚠️ 주의 사항

    경로 설정: 빌드된 환경(sys._MEIPASS)에서도 리소스를 찾을 수 있도록 내부 경로 처리가 적용되어 있습니다.

