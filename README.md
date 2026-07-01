# 월드킹 포토부스 📸

AI 사진 변환 키오스크 — **하나의 코드**로 웹앱(Vercel)과 매장 키오스크(Electron)를 함께 운영하는 하이브리드 포토부스입니다.

직업·나이·성별을 선택해 촬영하면 AI가 미래 모습을 생성하고, 영수증으로 인쇄하거나 QR로 휴대폰에 공유합니다.

---

## ✨ 주요 기능

- **AI 사진 변환** — Fal.ai 기반으로 직업/나이/성별에 맞춘 미래 모습 생성
- **QR 공유** — Supabase Storage 업로드 후 QR로 휴대폰 전송
- **영수증 인쇄** — 매장 키오스크(Electron)에서 80mm 영수증 프린터 직접 연동
- **하이브리드 실행** — 브라우저 / PWA / Electron 키오스크 동일 코드 공유
- **자동 업데이트** — `electron-updater` + GitHub Release 기반 매장 PC 자동 갱신

## 🛠 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프론트엔드 | React 18, TypeScript, Vite, Tailwind CSS |
| 데스크톱 | Electron 31, electron-builder, electron-updater |
| 백엔드/저장 | Supabase (DB + Storage) |
| AI | Fal.ai |
| 모니터링 | Sentry (선택) |
| 배포 | Vercel (웹), GitHub Release (데스크톱) |

---

## 🚀 빠른 시작 (개발자)

### 1. 사전 준비

| 프로그램 | 버전 | 확인 |
|---|---|---|
| Git | 최신 | `git --version` |
| Node.js | **20 LTS 이상** (권장 22) | `node -v` |

### 2. 클론 & 의존성 설치

```bash
git clone https://github.com/priming2023/photo.git
cd photo
npm install
```

### 3. 환경변수

클론하면 **`.env`가 이미 포함**되어 있습니다. 별도 설정 없이 바로 실행·빌드할 수 있습니다.

| 변수 | 설명 | 비고 |
|---|---|---|
| `VITE_FAL_KEY` | AI 사진 변환 API 키 | 저장소에 포함됨 |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | 사진 업로드·QR | 저장소에 포함됨 |
| `VITE_PUBLIC_APP_URL` | QR 링크용 공개 앱 URL | Vercel 배포 주소 |
| `PRINTER_NAME` | 영수증 프린터 이름 | **매장 PC 설치 시** 장치 관리자 이름으로 채움 |

> 매장 키오스크에 설치할 때는 `setup.md` **B-3** 절을 따라 exe 옆 `.env`에 `PRINTER_NAME`만 추가하면 됩니다.

### 4. 실행

```bash
# 웹앱만 (브라우저 개발)
npm run dev

# Electron 키오스크 + Vite 동시 실행
npm run electron:start
```

### 5. 빌드

```bash
npm run build              # 웹 빌드 (dist/)
npm run electron:build:win # Windows 설치파일(.exe)
npm run electron:build:mac # macOS 설치파일(.dmg)
```

빌드 결과물은 `release/` 폴더에 생성됩니다.

> 📖 **설치파일 만들기 → 매장 PC 설치 → 배송까지 전체 순서는 [`setup.md`](./setup.md) 0장을 따르세요.**  
> Windows에서는 `scripts/windows-build.bat` 더블클릭만으로 `.exe` 빌드가 가능합니다.

> 🎬 **키즈카페 홍보 릴스 3편** (대본·촬영·편집·업로드 가이드): [`promo/README.md`](./promo/README.md)

---

## 🗄 Supabase 초기 설정

새 Supabase 프로젝트라면 `supabase/` 폴더의 SQL을 SQL Editor에서 실행해야 합니다.

```text
supabase/photo_sessions.sql   # 세션 테이블
supabase/photos_bucket.sql    # 사진 스토리지 버킷
supabase/photo_stats.sql      # 통계
supabase/cleanup_cron.sql     # 오래된 사진 자동 정리 (선택)
```

---

## 📁 프로젝트 구조

```text
photo/
├─ src/              # React 웹앱 (App, components, config, utils)
├─ electron/         # Electron 메인 프로세스 (main, preload, 로컬서버, 프린터)
├─ supabase/         # DB/Storage 초기화 SQL
├─ scripts/          # Windows 빌드·배포 원클릭 배치
├─ tool/             # Vercel 배포 / GitHub Secrets 스크립트
├─ public/           # PWA 매니페스트, 아이콘
├─ .env.example      # 환경변수 템플릿
└─ setup.md          # 전체 설치·운영 상세 가이드
```

## 📜 주요 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | Vite 개발 서버 |
| `npm run electron:start` | Vite + Electron 동시 실행 |
| `npm run build` | 웹앱 프로덕션 빌드 |
| `npm run electron:build:win` | Windows 설치파일 빌드 |
| `npm run electron:build:mac` | macOS 설치파일 빌드 |
| `npm run electron:publish:win` | 빌드 + GitHub Release 업로드 |
| `npm run deploy` | Vercel 배포 |
| `npm run lint` | ESLint 검사 |

---

© 2026 Humaner Inc. / 월드킹 포토부스. All rights reserved.
