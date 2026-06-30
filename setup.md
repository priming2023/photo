# 포토부스 설치 가이드

> **하이브리드 구조** — 웹앱(Vercel)과 Electron 키오스크가 **같은 앱**을 공유합니다.  
> 웹은 브라우저/PWA로, 매장 PC는 Electron으로 접속하며 영수증 프린터만 Electron 전용 기능입니다.

---

## 개발자 인수인계 (설치·배송 담당자용)

아래만 있으면 **클론 → 빌드 → 매장 PC 설치 → 배송**까지 진행할 수 있습니다.

| 항목 | 위치 | 상태 |
|---|---|---|
| 소스코드 | `https://github.com/priming2023/photo` | ✅ 협력자 초대 후 clone |
| API 키·환경변수 | 저장소 루트 `.env` | ✅ 포함됨 (별도 전달 불필요) |
| 설치 가이드 | 이 파일 (`setup.md`) | ✅ 0장부터 순서대로 |
| Windows 원클릭 빌드 | `scripts/windows-build.bat` | ✅ 더블클릭 → `release/*.exe` |
| DB/스토리지 SQL | `supabase/*.sql` | ✅ 이미 운영 중 (재실행 불필요) |
| 웹앱 배포 | `https://phto-orcin.vercel.app` | ✅ 이미 배포됨 |

**담당 개발자가 할 일 (요약)**

1. 저장소 clone → `npm install` (또는 `scripts/windows-build.bat` 실행)
2. `npm run electron:build:win` 으로 설치파일 생성
3. 매장 키오스크 PC에 `.exe` 설치
4. exe 옆 `.env`에 `PRINTER_NAME=프린터이름` 입력 (B-3 참고)
5. 테스트 촬영 1회 (AI 변환 · 영수증 · QR 확인)
6. 완성된 PC 배송

**코드 수정**은 `src/`(화면·AI 프롬프트), `electron/`(프린터·키오스크), `src/config/store.ts`(매장명)에서 가능합니다. 수정 후 다시 빌드하면 됩니다.

---

## 0. 처음부터 끝까지 — GitHub에서 받아 영수증 사진기에 설치 (전체 순서)

> 이 장은 **개발자 PC에서 설치 파일(.exe)을 만들고**, 그 파일을 **실제 매장 영수증 사진기(키오스크 PC)에 설치**하기까지의 모든 명령어와 행동을 순서대로 정리한 것입니다.  
> A 단계(빌드)는 개발자 PC에서, B 단계(설치)는 매장 사진기에서 진행합니다.

### A. 개발자 PC — 소스 받아서 설치 파일 만들기

#### A-1. 필수 프로그램 설치 (최초 1회)

| 프로그램 | 설치 방법 | 확인 명령 |
|---|---|---|
| **Git** | <https://git-scm.com/downloads> | `git --version` |
| **Node.js LTS (20+)** | <https://nodejs.org> 에서 LTS 설치 | `node -v` / `npm -v` |

```bash
# 세 명령 모두 버전이 출력되면 준비 완료
git --version
node -v
npm -v
```

#### A-2. GitHub 저장소 클론

```bash
# 원하는 폴더로 이동 후 클론
git clone https://github.com/priming2023/photo.git
cd photo
```

> 이미 받아둔 경우 최신화만 합니다.
> ```bash
> cd photo
> git pull origin main
> ```

#### A-3. 의존성 설치

```bash
npm install
```

#### A-4. 환경변수 파일(.env) 작성

```bash
# 예시 파일을 복사한 뒤 값 채우기
cp .env.example .env
```

`.env`를 열어 아래 값을 채웁니다. (자세한 항목은 2-2 참고)

```env
VITE_FAL_KEY=발급받은_Fal_키
VITE_SUPABASE_URL=https://프로젝트.supabase.co
VITE_SUPABASE_ANON_KEY=발급받은_anon_키
VITE_PUBLIC_APP_URL=https://phto-orcin.vercel.app
PRINTER_NAME=                # 빌드 단계에서는 비워둬도 됨
```

#### A-5. (선택) 실행 테스트

```bash
# 브라우저 + Electron 키오스크가 함께 떠서 동작 확인
npm run electron:start
```

#### A-6. 윈도우 설치파일(.exe) 빌드

**방법 ① 원클릭 (가장 쉬움, 추천)**

`scripts\windows-build.bat` 파일을 **더블클릭**하면 의존성 설치 → 빌드 → 설치파일 생성까지 자동으로 진행되고, 끝나면 `release\` 폴더가 자동으로 열립니다.

**방법 ② 명령어로 직접**

```bash
# 윈도우 설치파일(.exe)만 생성 (결과물은 release/ 폴더)
npm run electron:build:win
```

> 빌드 스크립트: `electron:build:win`(윈도우 exe), `electron:build:mac`(맥 dmg), `electron:build`(현재 OS 기준)

빌드가 끝나면 `release/` 폴더에 아래 파일이 생성됩니다.

| 매장 사진기 OS | 매장에 전달할 파일 |
|---|---|
| Windows | `release/월드킹 포토부스 Setup 1.0.0.exe` |
| macOS | `release/월드킹 포토부스 1.0.0.dmg` |

> **이미 빌드된 exe가 있으면** A-1~A-6을 건너뛰고 `release/월드킹 포토부스 Setup 1.0.0.exe` 를 바로 매장 사진기로 복사해도 됩니다. (코드를 수정했을 때만 다시 빌드)

> **크로스 빌드 가능:** macOS에서도 `npm run electron:build:win` 으로 윈도우 `.exe` 생성이 됩니다. (electron-builder가 wine을 자동으로 내려받아 사용 — 최초 1회 인터넷에서 약 130MB 다운로드)

#### A-7. GitHub Release 업로드 (자동 업데이트용)

매장 앱은 `electron-updater`로 GitHub Release를 확인합니다.  
따라서 새 버전을 배포하려면 설치파일을 GitHub Release에 올려야 합니다.

> 단순히 USB로 설치만 할 때는 이 단계를 건너뛰어도 됩니다.  
> **매장 PC 자동 업데이트까지 사용하려면 이 단계가 필요합니다.**

##### A-7-1. GitHub 토큰 준비 (최초 1회)

1. GitHub 접속 → 우측 상단 프로필 → **Settings**
2. **Developer settings** → **Personal access tokens**
3. Fine-grained token 또는 classic token 생성
4. Repository는 `priming2023/photo` 선택
5. 권한은 최소 **Contents: Read and write** 필요
6. 생성된 토큰을 복사합니다. (다시 볼 수 없으니 안전한 곳에 보관)

##### A-7-2. 버전 번호 올리기

GitHub Release는 같은 버전을 중복 업로드할 수 없습니다.  
배포 전 `package.json`의 `version`을 올립니다.

예시:

```json
{
  "version": "1.0.1"
}
```

또는 명령어로 올릴 수 있습니다.

```bash
# 패치 버전 증가: 1.0.0 -> 1.0.1
npm version patch
```

##### A-7-3. 윈도우에서 원클릭 업로드 (추천)

Windows PC에서 아래 파일을 더블클릭합니다.

```text
scripts\windows-publish-release.bat
```

토큰이 설정되어 있지 않으면 배치 파일이 설정 방법을 안내합니다.

현재 PowerShell/CMD 창에서만 임시로 설정:

```bat
set GH_TOKEN=여기에_GitHub_토큰_붙여넣기
scripts\windows-publish-release.bat
```

Windows에 영구 등록:

```bat
setx GH_TOKEN "여기에_GitHub_토큰_붙여넣기"
```

> `setx`를 사용한 뒤에는 새 터미널을 열어야 적용됩니다.

##### A-7-4. 명령어로 직접 업로드

```bash
# Windows exe 빌드 + GitHub Release 업로드
npm run electron:publish:win
```

업로드가 성공하면 GitHub 저장소의 **Releases** 화면에 아래 파일들이 올라갑니다.

| 파일 | 용도 |
|---|---|
| `월드킹 포토부스 Setup x.x.x.exe` | 신규 설치용 설치파일 |
| `latest.yml` | Windows 자동 업데이트 정보 |
| `.blockmap` | 자동 업데이트 차이 다운로드용 |

##### A-7-5. 매장 앱 자동 업데이트 확인

1. 매장 PC에서 앱을 실행합니다.
2. 앱 시작 시 GitHub Release를 자동 확인합니다.
3. 업데이트가 있으면 백그라운드에서 내려받습니다.
4. 다음 실행 또는 앱 종료 후 재실행 시 새 버전이 적용됩니다.

관리자가 즉시 반영하려면:

1. `Ctrl+Shift+X`로 앱 종료
2. 앱 다시 실행
3. 새 버전 적용 여부 확인

#### A-8. 매장으로 전달할 파일 2개 준비

USB 또는 클라우드로 아래 **2개**를 매장 사진기로 복사합니다.

1. 설치 파일 (`월드킹 포토부스 Setup.exe`)
2. `.env` 파일 (매장용 `PRINTER_NAME`이 들어갈 파일 — B-3에서 작성)

---

### B. 매장 영수증 사진기(키오스크 PC) — 설치 및 가동

#### B-1. 영수증 프린터 연결 및 드라이버 설치

1. 80mm 영수증 프린터를 USB로 사진기 PC에 연결합니다.
2. 제조사 드라이버를 설치합니다. (예: EPSON TM-T20, 빅솔론 SRP 등)
3. Windows `설정 → Bluetooth 및 장치 → 프린터 및 스캐너`에서 프린터가 보이는지 확인합니다.
4. **프린터 이름을 정확히 메모**합니다. (예: `EPSON TM-T20II Receipt`)
5. 80mm 용지 폭으로 테스트 인쇄가 되는지 확인합니다.

> 프린터 정확한 이름 확인(명령으로도 가능):
> ```powershell
> # Windows PowerShell
> Get-Printer | Select-Object Name
> ```

#### B-2. 설치 파일 실행

1. A-8에서 받은 `월드킹 포토부스 Setup.exe`를 더블클릭합니다.
2. 설치가 끝나면 자동으로 앱이 실행됩니다. (oneClick 설치)

#### B-3. .env 파일 배치 (프린터 이름 입력)

설치된 **실행 파일(.exe)이 있는 폴더**에 `.env` 파일을 둡니다.

- 기본 설치 경로(Windows oneClick):  
  `C:\Users\<사용자명>\AppData\Local\Programs\월드킹 포토부스\`

`.env` 내용 (B-1에서 메모한 프린터 이름 입력):

```env
VITE_PUBLIC_APP_URL=https://phto-orcin.vercel.app
PRINTER_NAME=EPSON TM-T20II Receipt
# 인터넷이 불안정한 매장이면 아래 주석 해제 (로컬 dist 사용)
# ELECTRON_USE_LOCAL=true
```

> 앱을 한 번 종료 후 다시 실행해야 `.env`가 적용됩니다. (`Ctrl+Shift+X`로 종료)

#### B-4. 카메라 권한 허용

1. 웹캠을 USB로 연결합니다.
2. 앱 실행 시 카메라 권한 요청이 나오면 **허용**합니다. (Electron이 자동 허용 처리)
3. 미리보기 화면에 카메라 영상이 보이는지 확인합니다.

#### B-5. 최종 점검 (실제 1회 촬영)

1. 직업·나이·성별 선택 → 촬영 진행
2. AI 변환 결과(컬러 미래 사진)가 나오는지 확인
3. **영수증 인쇄하기** 버튼 → 80mm 영수증이 정상 출력되는지 확인
4. 영수증의 QR을 휴대폰으로 스캔 → 사진 페이지가 열리는지 확인

#### B-6. 자동 시작 / 자동 업데이트

- **자동 시작:** Windows 부팅 시 앱이 자동 실행되도록 자동 등록됩니다. (별도 설정 불필요)
- **자동 업데이트:** 개발자가 GitHub Release를 올리면 매장 앱이 자동으로 내려받아 다음 실행 시 적용됩니다.
- **키오스크 잠금:** 평상시 전체화면 키오스크로 잠깁니다. 관리가 필요할 땐 `Ctrl+Shift+Q`로 해제 (단축키는 2-6 참고).

---

## 1. 웹앱 접속 (브라우저 / PWA)

### 브라우저에서 바로 사용

1. 아래 주소로 접속합니다.
   ```
   https://phto-orcin.vercel.app
   ```
2. 카메라 권한을 허용하면 바로 촬영·AI 변환·QR 공유가 가능합니다.
3. 영수증 인쇄는 브라우저 기본 인쇄(`window.print`)로 동작합니다.

### 홈 화면에 추가 (PWA)

| OS | 방법 |
|---|---|
| **iPhone/iPad** | Safari → 공유 → **홈 화면에 추가** |
| **Android** | Chrome → 메뉴(⋮) → **홈 화면에 추가** 또는 **앱 설치** |
| **Windows/Mac** | Chrome 주소창 오른쪽 설치 아이콘 클릭 |

PWA로 설치하면 앱처럼 전체 화면으로 실행됩니다.

---

## 2. Electron 키오스크 설치 (매장 PC)

Electron은 **키오스크 셸** 역할을 합니다. 실제 화면은 Vercel에 배포된 웹앱을 불러오며, 영수증 프린터 연동만 Electron이 담당합니다.

```
┌─────────────────────────────────────┐
│  Electron (키오스크 + 프린터)        │
│  ┌───────────────────────────────┐  │
│  │  Vercel 웹앱 (HTTPS)          │  │
│  │  카메라 · AI · QR · Supabase  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ↕ 네트워크 장애 시
┌─────────────────────────────────────┐
│  localhost:37564 (dist/ 로컬 폴백)   │
└─────────────────────────────────────┘
```

### 2-1. 사전 준비

| 항목 | 요구사항 |
|---|---|
| OS | Windows 10+ 또는 macOS 12+ |
| 해상도 | 1920×1080 이상 권장 |
| 네트워크 | AI 변환(Fal.ai) 및 Supabase 접속 필요 |
| 웹캠 | USB 연결 + OS 카메라 권한 허용 |
| 프린터 | 80mm 영수증 프린터 (Windows 장치 관리자에서 이름 확인) |

### 2-2. 환경변수 (.env)

프로젝트 루트 또는 **설치된 exe 옆**에 `.env` 파일을 둡니다.

```env
# 웹앱 URL (Electron이 이 주소를 불러옴)
VITE_PUBLIC_APP_URL=https://phto-orcin.vercel.app

# 영수증 프린터 (Windows 장치 관리자 → 프린터 이름 그대로)
PRINTER_NAME=EPSON TM-T20

# 오프라인/로컬 테스트 시에만 사용
# ELECTRON_USE_LOCAL=true
```

> API 키(`VITE_FAL_KEY`, `VITE_SUPABASE_*`)는 Vercel에 설정되어 있으므로 Electron exe 옆 `.env`에는 **프린터 이름과 URL만** 있어도 됩니다.

### 2-3. 개발 환경에서 테스트

```bash
# 의존성 설치
npm install

# Vite + Electron 동시 실행 (localhost:5173)
npm run electron:start
```

### 2-4. 설치 파일 빌드

```bash
# dist/ 생성 + Electron 설치 파일 생성
npm run electron:build
```

빌드 결과물 (`release/` 폴더):

| OS | 파일 |
|---|---|
| Windows | `월드킹 포토부스 Setup.exe` |
| macOS | `월드킹 포토부스.dmg` |

### 2-5. 매장 PC 설치 순서

1. `release/` 폴더의 설치 파일을 매장 PC로 복사
2. 설치 실행 (Windows: Setup.exe 더블클릭)
3. 설치 경로 옆에 `.env` 파일 배치 (`PRINTER_NAME` 설정)
4. 영수증 프린터 드라이버 설치 + Windows 기본 프린터 설정
5. 앱 실행 → 테스트 촬영 1회 (변환 · 인쇄 · QR 스캔 확인)
6. Windows 시작 시 자동 실행은 앱이 자동 등록합니다

### 2-6. 관리자 단축키

| 단축키 | 동작 |
|---|---|
| `Ctrl+Shift+Q` | 키오스크 모드 해제 (창 조작 가능) |
| `Ctrl+Shift+K` | 키오스크 모드 복귀 |
| `Ctrl+Shift+R` | 페이지 새로고침 |
| `Ctrl+Shift+X` | 앱 완전 종료 |

> macOS에서는 `Control` 대신 `Ctrl` 키를 사용합니다.

---

## 3. Vercel 웹 배포

웹앱 코드를 수정한 뒤 Vercel에 배포합니다.

```bash
# .env 기반으로 Vercel 환경변수 동기화 + 배포
npm run deploy
```

또는 `main` 브랜치 push 시 GitHub Actions가 자동 배포합니다.

Vercel 대시보드 → Settings → Environment Variables 에 아래 값이 있어야 합니다.

```
VITE_FAL_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_PUBLIC_APP_URL
```

---

## 4. 문제 해결

### 웹앱이 갑자기 안 열리거나 이전 화면이 보임

**원인:** PWA 서비스 워커가 예전 JS 파일을 캐시했을 수 있습니다.

**해결:**
1. 브라우저 → 개발자 도구 → Application → Service Workers → **Unregister**
2. 또는 시크릿 창에서 `https://phto-orcin.vercel.app` 접속
3. Electron: `Ctrl+Shift+R` 로 강제 새로고침

### Electron에서 카메라가 안 됨

**원인:** 예전 버전은 `file://` 로컬 파일을 열어 카메라(HTTPS 필수)가 차단되었습니다.

**해결:** 최신 Electron은 Vercel HTTPS URL을 불러옵니다. `.env`에 `VITE_PUBLIC_APP_URL`이 올바른지 확인하세요.

### 영수증이 인쇄되지 않음

1. `.env`의 `PRINTER_NAME`이 Windows 장치 관리자의 프린터 이름과 **정확히 일치**하는지 확인
2. 프린터 드라이버 설치 및 용지(80mm) 설정 확인
3. Electron이 아닌 웹 브라우저에서는 `window.print()`로 동작 (프린터 지정 불가)

### AI 변환 실패

1. Vercel 환경변수 `VITE_FAL_KEY` 확인
2. 인터넷 연결 확인 (Fal.ai API 호출 필요)
3. Fal.ai 대시보드에서 API 키 잔액·만료 확인

### QR 코드 생성 실패

1. Vercel 환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 확인
2. Supabase Dashboard → SQL Editor에서 `supabase/photo_sessions.sql`, `supabase/photos_bucket.sql` 실행 여부 확인

---

## 5. 아키텍처 요약

| 실행 방식 | URL | 카메라 | 영수증 인쇄 | 자동 업데이트 |
|---|---|---|---|---|
| **웹 브라우저** | vercel.app | ✅ HTTPS | 브라우저 인쇄 | Vercel 배포 즉시 |
| **PWA (홈 화면)** | vercel.app | ✅ HTTPS | 브라우저 인쇄 | Vercel 배포 즉시 |
| **Electron 키오스크** | vercel.app (기본) | ✅ HTTPS | 프린터 직접 연동 | GitHub Release 자동 |

---

*마지막 업데이트: 2026-06-30*
