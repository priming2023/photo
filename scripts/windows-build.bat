@echo off
chcp 65001 >nul
title 월드킹 포토부스 - 윈도우 설치파일 빌드

REM ============================================================
REM  월드킹 포토부스 - Windows 설치파일(.exe) 원클릭 빌드 스크립트
REM  사용법: 이 파일을 더블클릭하세요.
REM  (사전 조건: Node.js LTS 설치 / 인터넷 연결)
REM ============================================================

REM 이 배치파일이 있는 폴더의 상위(프로젝트 루트)로 이동
cd /d "%~dp0\.."

echo.
echo ============================================================
echo   월드킹 포토부스 - Windows 설치파일 빌드를 시작합니다.
echo ============================================================
echo.

REM --- 1. Node.js 설치 확인 ---
where node >nul 2>nul
if errorlevel 1 (
  echo [오류] Node.js가 설치되어 있지 않습니다.
  echo        https://nodejs.org 에서 LTS 버전을 먼저 설치하세요.
  echo.
  pause
  exit /b 1
)
echo [1/4] Node.js 확인 완료
for /f "delims=" %%v in ('node -v') do echo        Node 버전: %%v
echo.

REM --- 2. .env 파일 확인 ---
if not exist ".env" (
  if exist ".env.example" (
    echo [안내] .env 파일이 없어 .env.example 을 복사합니다.
    copy ".env.example" ".env" >nul
    echo        => .env 파일을 열어 API 키와 PRINTER_NAME 을 채워주세요.
  ) else (
    echo [경고] .env 파일이 없습니다. 빌드는 진행하지만 키 설정이 필요할 수 있습니다.
  )
  echo.
)

REM --- 3. 의존성 설치 ---
echo [2/4] 의존성 설치 중... (npm install)
call npm install
if errorlevel 1 (
  echo [오류] npm install 실패. 인터넷 연결을 확인하세요.
  pause
  exit /b 1
)
echo.

REM --- 4. 웹 빌드 + Windows 설치파일 생성 ---
echo [3/4] 웹 빌드 + Windows 설치파일(.exe) 생성 중...
call npm run electron:build:win
if errorlevel 1 (
  echo [오류] 설치파일 빌드 실패. 위 메시지를 확인하세요.
  pause
  exit /b 1
)
echo.

echo [4/4] 빌드 완료!
echo ============================================================
echo   설치파일 위치: release\ 폴더
echo   파일 이름 예시: "월드킹 포토부스 Setup.exe"
echo ============================================================
echo.

REM release 폴더 자동 열기
if exist "release" start "" "release"

pause
