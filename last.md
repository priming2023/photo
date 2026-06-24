# last.md — 미래의 내 모습 포토부스 : 마무리 체크리스트

> **3회 검토 완료** (2026-06-24)  
> 기술·운영·비즈니스 세 관점에서 남은 작업을 우선순위 순으로 정리했습니다.  
> 완료 시 `[x]`로 체크하세요.

---

## 🔴 1순위 — 현장 설치 전 필수

### 1-1. Electron 키오스크 완성

| 항목 | 현재 상태 | 해야 할 일 |
|------|----------|-----------|
| **보안 설정** | `nodeIntegration: true`, `contextIsolation: false` | preload.js 분리 + contextIsolation: true 로 변경 권장 |
| **관리자 탈출 단축키** | 없음 (kiosk: true → 빠져나올 방법 없음) | Ctrl+Shift+Q 등 숨김 단축키로 kiosk 해제 |
| **앱 아이콘** | 없음 (기본 Electron 아이콘) | `assets/icon.png`, `icon.ico`, `icon.icns` 제작 |
| **자동 재시작** | 크래시 시 아무것도 안 됨 | Windows 서비스 또는 PM2로 앱 감시·재시작 |
| **시작 시 자동 실행** | 없음 | Windows: 레지스트리 등록 or electron-builder `autoLaunch` |
| **환경변수 (.env) 주입** | 빌드 번들에 포함됨 | 배포 시 `.env`가 번들에 포함되는지 최종 확인 필요 |

```bash
# 관리자 탈출 단축키 추가 예시 (electron/main.js)
const { globalShortcut } = require('electron');
app.whenReady().then(() => {
  globalShortcut.register('Ctrl+Shift+Q', () => {
    mainWindow.setKiosk(false);
    mainWindow.setFullScreen(false);
  });
});
```

- [x] `electron/main.js` — 관리자 탈출 단축키 추가 (Ctrl+Shift+Q 해제 / Ctrl+Shift+K 복귀)
- [x] `electron/main.js` — contextIsolation 보안 개선 (preload.js 분리)
- [x] `assets/` — 앱 아이콘 파일 추가 (`assets/icon.png`)
- [x] `package.json` — electron-builder icon 경로 설정
- [x] Windows 시작 시 자동 실행 (`app.setLoginItemSettings` — 프로덕션 빌드 시)
- [ ] Windows 자동 재시작 (크래시 감시 — PM2 또는 서비스, 현장 PC 세팅 시)

---

### 1-2. 영수증 프린터 직접 연동

**현재**: `mainWindow.webContents.print({ silent: true })` → 기본 프린터로 전체 페이지 인쇄  
**문제**: 영수증 용지 크기(58mm/80mm) 지정 없음, 어떤 프린터든 나옴

```javascript
// electron/main.js — 영수증 프린터 지정 인쇄 예시
ipcMain.on('print-receipt', (event) => {
  if (mainWindow) {
    mainWindow.webContents.print({
      silent: true,
      printBackground: true,
      color: false,
      copies: 1,
      deviceName: process.env.PRINTER_NAME || '',  // 환경변수로 프린터 지정
      pageSize: { width: 80000, height: 200000 },  // 80mm 용지 (마이크론 단위)
    }, (success, reason) => {
      if (!success) console.error('프린트 실패:', reason);
      event.reply('print-result', { success, reason });
    });
  }
});
```

- [x] `.env.example` — `PRINTER_NAME` 추가
- [x] `electron/main.js` — 영수증 이미지만 숨김 창에서 인쇄 + `deviceName` 지정
- [x] `Result.tsx` — 인쇄 성공/실패 IPC 응답 + UI 표시
- [ ] 실제 영수증 프린터로 출력 테스트 (Epson TM, Star Micronics 등 — 현장에서)
- [x] 프린터 목록 조회 IPC (`list-printers`)

---

### 1-3. Vercel 환경 변수 확인

- [ ] Vercel 대시보드 → Settings → Environment Variables 에서 아래 3개 확인

```
VITE_FAL_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_PUBLIC_APP_URL=https://phto-orcin.vercel.app
```

---

### 1-4. Supabase SQL 최종 실행 확인

- [ ] `supabase/photo_sessions.sql` 실행 완료 여부 확인
- [ ] `supabase/photos_bucket.sql` 실행 완료 여부 확인  
- [ ] `supabase/migrate_original_url.sql` (ALTER TABLE) 실행 완료 여부 확인

---

## 🟠 2순위 — 품질 향상 (현장 초기 운영 중 적용)

### 2-1. 키오스크 UX — 유휴 시 자동 홈 복귀

**현재**: 사용자가 중간에 이탈해도 해당 화면에 멈춰 있음  
**목표**: 30~60초 조작 없으면 홈 화면으로 자동 복귀

```typescript
// App.tsx에 추가
const IDLE_TIMEOUT_MS = 45_000;

useEffect(() => {
  let timer: ReturnType<typeof setTimeout>;
  const reset = () => {
    clearTimeout(timer);
    if (screen !== 'HOME' && screen !== 'PROCESSING') {
      timer = setTimeout(() => handleReset(), IDLE_TIMEOUT_MS);
    }
  };
  window.addEventListener('pointerdown', reset);
  window.addEventListener('keydown', reset);
  reset();
  return () => {
    clearTimeout(timer);
    window.removeEventListener('pointerdown', reset);
    window.removeEventListener('keydown', reset);
  };
}, [screen]);
```

- [x] `App.tsx` — 유휴 자동 리셋 타이머 추가 (45초)
- [x] Processing 중엔 타이머 멈추도록 예외 처리

---

### 2-2. 카메라 권한 거부 시 사용자 안내

**현재**: 권한 거부 시 콘솔 에러만, 화면은 "카메라를 준비하고 있어요..." 멈춤  

- [x] `Camera.tsx` — 권한 거부/오류 상태 감지 후 안내 메시지 표시

---

### 2-3. AI 변환 실패 재시도 버튼

**현재**: 실패 시 "처음으로" 버튼만 → 직업/나이/성별 다시 선택해야 함

- [x] `Processing.tsx` — 실패 시 "다시 시도" + "다시 찍기" 버튼 추가

---

### 2-4. AI 파라미터 미세조정

- [x] **여성 55/65세 노화** — `FEMALE_AGE_BOOST` 강화 (NOT 30/40/45 명시)
- [x] **남성 65세** — `MALE_AGE_BOOST` + 네거티브 `too young` 강화
- [x] **어린이 감지** — 임계값 8→9, id_weight 보정 -0.06/-0.04
- [x] **안경** — uncertain 제거, strict threshold (이전 배포)
- [x] `simmar.md` 업데이트 예정 (배포 후 현장 테스트)

---

### 2-5. 영수증 디자인 개선

- [x] 영수증 하단 QR 저장 안내 문구 추가
- [x] 가게 주소·연락처 (`VITE_STORE_ADDRESS`, `VITE_STORE_PHONE`)
- [x] 상단 로고 이미지 (`/icon-192.png`)

---

## 🟡 3순위 — 운영 안정성 (1개월 이후)

### 3-1. Supabase 만료 사진 정리 자동화

**현재**: 클라이언트에서 사진 찍을 때마다 만료 정리 → 아무도 안 찍으면 정리 안 됨

- [x] `supabase/cleanup_cron.sql` — pg_cron 매일 자정(UTC 18:00) 만료 세션+Storage 정리
- [ ] Supabase Dashboard에서 pg_cron 확장 활성화 후 SQL 실행 (1회)

---

### 3-2. 에러 모니터링

**현재**: 콘솔 로그만, 원격 수집 없음

- [x] `@sentry/react` 연동 — `VITE_SENTRY_DSN` 설정 시 활성화
- [ ] Sentry 프로젝트 생성 후 DSN을 Vercel/.env에 추가

---

### 3-3. Electron 자동 업데이트

**현재**: 업데이트 시 수동으로 현장 PC에 재설치 필요

- [x] `electron-updater` + GitHub Releases publish 설정
- [ ] GitHub Release에 `release/` 빌드 파일 업로드 시 자동 업데이트 동작

---

### 3-4. 사용 통계 (선택)

- [x] `photo_stats` 테이블 + 촬영 시 자동 기록 (`supabase/photo_stats.sql`)
- [x] `daily_photo_stats` 뷰 (Supabase SQL Editor에서 조회)
- [ ] 관리자 대시보드 UI (선택 — SQL 뷰로 충분)

---

## 🟢 4순위 — 비즈니스 확장 (선택)

### 4-1. 앱 배포 (React Native 전환 또는 PWA)

**현재**: 핸드폰 반응형 웹(PWA 미적용)  
**목표**: 앱스토어 등록 없이 홈화면에 추가

- [x] `public/manifest.json` + `public/sw.js` + 홈 화면 추가 메타태그
- [x] `icon-192.png`, `icon-512.png` 추가
- [ ] iOS/Android 실기기에서 "홈 화면에 추가" 테스트

---

### 4-2. 다른 매장 확장

- [x] `VITE_STORE_NAME`, `VITE_STORE_BRANCH`, `VITE_STORE_ADDRESS`, `VITE_STORE_PHONE`
- [x] `src/config/store.ts` — App, Home, ViewPage, 영수증, 갤러리 합성 이미지에 적용

---

### 4-3. 영문/다국어 지원

- [ ] i18n 라이브러리 추가 (외국인 관광객 대응)

---

## 📋 Electron 빌드 실행 순서

```bash
# 1. 아이콘 파일 준비 (assets/ 폴더)
#    icon.png (512x512), icon.ico, icon.icns

# 2. package.json build 섹션에 icon 추가
#    "icon": "assets/icon.png"

# 3. 빌드
npm run electron:build

# 4. 결과물 (release/ 폴더)
#    Windows: 월드킹 포토부스 Setup.exe
#    Mac: 월드킹 포토부스.dmg

# 5. 테스트 실행
npm run electron:start
```

---

## 📋 현장 설치 체크리스트 (IT 담당자용)

```
[ ] PC 해상도 1920×1080 이상 설정
[ ] 크롬 또는 Electron 앱 설치
[ ] .env 파일 복사 (VITE_FAL_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_PUBLIC_APP_URL, PRINTER_NAME)
[ ] 영수증 프린터 드라이버 설치 및 기본 프린터 설정
[ ] 웹캠 연결 및 카메라 권한 허용
[ ] 인터넷 연결 확인 (AI 변환에 외부 API 필요)
[ ] 테스트 촬영 1회 — 사진 변환, 영수증 인쇄, QR 스캔 확인
[ ] Windows 시작 시 자동 실행 등록
[ ] 키오스크 모드 탈출: Ctrl+Shift+Q / 복귀: Ctrl+Shift+K (관리자 보관)
```

---

## 🗓️ 작업 우선순위 요약

| 순위 | 항목 | 예상 시간 | 중요도 |
|------|------|----------|--------|
| 1 | Electron 관리자 탈출 단축키 | 30분 | ⚡ 현장 필수 |
| 1 | 앱 아이콘 제작 + electron-builder 설정 | 1시간 | ⚡ 필수 |
| 1 | 영수증 프린터 deviceName 설정 | 1시간 | ⚡ 필수 |
| 1 | Vercel 환경변수 VITE_PUBLIC_APP_URL 확인 | 10분 | ⚡ 필수 |
| 2 | 유휴 자동 홈 복귀 타이머 | 1시간 | 🔶 권장 |
| 2 | AI 파라미터 현장 테스트 후 미세조정 | 1~3시간 | 🔶 권장 |
| 3 | Supabase 만료 정리 자동화 | 30분 | 🟡 운영 |
| 3 | Electron 자동 업데이트 | 2시간 | 🟡 운영 |
| 4 | PWA 앱 배포 | 2시간 | 🟢 선택 |
| 4 | 다매장 확장 설정 | 3시간 | 🟢 선택 |

---

*마지막 업데이트: 2026-06-24 (2~4순위 코드 작업 완료)*
