import subprocess
import os
import platform

def run():
    # 1. 경로 설정
    root_dir = os.getcwd()
    frontend_dir = os.path.join(root_dir, "frontend")
    backend_dir = os.path.join(root_dir, "backend")

    # 2. React 빌드
    print("📦 [1/2] 프론트엔드 빌드 시작...")
    # shell=True는 윈도우에서 필요하며, 명령어를 해당 폴더(cwd)에서 실행합니다.
    build_process = subprocess.run(
        "npm run build", 
        shell=True, 
        cwd=frontend_dir
    )

    if build_process.returncode != 0:
        print("❌ 빌드 중 오류가 발생했습니다.")
        return

    # 3. Python 실행 (uv run)
    print("🚀 [2/2] 백엔드 실행 중...")
    try:
        # backend 폴더로 이동하여 main.py 실행
        subprocess.run(
            "uv run main.py", 
            shell=True, 
            cwd=backend_dir
        )
    except KeyboardInterrupt:
        print("\n👋 사용자에 의해 종료되었습니다.")

if __name__ == "__main__":
    run()