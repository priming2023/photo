@echo off
chcp 65001 >nul
title 월드킹 포토부스 - GitHub Release 업로드

REM ============================================================
REM  월드킹 포토부스 - Windows 설치파일 빌드 + GitHub Release 업로드
REM  사용법:
REM    1) GitHub Personal Access Token 을 GH_TOKEN 환경변수에 설정
REM    2) 이 파일을 더블클릭
REM ============================================================

cd /d "%~dp0\.."

echo.
echo ============================================================
echo   월드킹 포토부스 - GitHub Release 업로드를 시작합니다.
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [오류] Node.js가 설치되어 있지 않습니다.
  echo        https://nodejs.org 에서 LTS 버전을 먼저 설치하세요.
  echo.
  pause
  exit /b 1
)

if "%GH_TOKEN%"=="" (
  echo [오류] GH_TOKEN 환경변수가 없습니다.
  echo.
  echo GitHub Release 업로드에는 GitHub Personal Access Token 이 필요합니다.
  echo.
  echo 1. GitHub ^> Settings ^> Developer settings ^> Personal access tokens
  echo 2. Fine-grained token 또는 classic token 생성
  echo 3. Repository: priming2023/photo 선택
  echo 4. 권한: Contents Read and write
  echo 5. 아래 명령으로 현재 창에 토큰 설정 후 다시 실행
  echo.
  echo    set GH_TOKEN=여기에_토큰_붙여넣기
  echo    scripts\windows-publish-release.bat
  echo.
  echo 영구 등록하려면:
  echo    setx GH_TOKEN "여기에_토큰_붙여넣기"
  echo.
  pause
  exit /b 1
)

echo [1/3] 의존성 설치 중...
call npm install
if errorlevel 1 (
  echo [오류] npm install 실패
  pause
  exit /b 1
)

echo.
echo [2/3] Windows 설치파일 빌드 + GitHub Release 업로드 중...
call npm run electron:publish:win
if errorlevel 1 (
  echo [오류] GitHub Release 업로드 실패
  echo        GH_TOKEN 권한, 인터넷 연결, package.json version 중복 여부를 확인하세요.
  pause
  exit /b 1
)

echo.
echo [3/3] 완료!
echo ============================================================
echo   GitHub Release 업로드가 완료되었습니다.
echo   매장 앱은 실행 시 업데이트를 확인하고 자동으로 내려받습니다.
echo ============================================================
echo.

if exist "release" start "" "release"

pause
