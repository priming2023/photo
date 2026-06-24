# simmar.md — 미래의 내 모습 포토부스 튜닝 메모

> **목적**: 나이·성별·직업별 AI 변환 세부 조정값과 테스트 피드백을 기록합니다.  
> 나중에 이 파일을 불러와 `ageDescriptors.ts`, `jobDetails.ts`, `falApi.ts`를 미세 조정할 때 참고하세요.

**배포 URL**: https://phto-orcin.vercel.app/  
**관련 코드**: `src/utils/ageDescriptors.ts`, `jobDetails.ts`, `jobPrompts.ts`, `falApi.ts`

---

## 1. 현재 상태 요약 (2025-06)

- **지금까지 중 가장 만족도 높은 설정**이지만, **완전히 만족스럽지는 않음**
- **남자/여자 파라미터 분리**(`getPulidParams(ageStr, gender)`) — 좋은 접근으로 평가됨
- **닮음이 최우선** — 노화는 파라미터가 아니라 **프롬프트**로 표현
- **키오스크 화면(1920px) 레이아웃** — 현재 크기가 딱 좋음, 포토부스 설치 기본값으로 유지

### 남은 불만족 포인트

| 케이스 | 피드백 |
|--------|--------|
| 여자 55세 간호사 | 30대처럼 보임 (여전히 젊음) |
| 남자 65세 프로게이머 | 40대처럼 보임 (너무 젊음) |
| 공통 | AI 티(플라스틱 피부) 남음 |
| 과학자 | 플라스크가 너무 큼 → **작은 시험관(15cm)으로 수정 완료** |

---

## 2. PuLID 핵심 교훈 (공식 문서 + 실전 검증)

### 절대 규칙

| 항목 | 권장 | 하면 안 되는 것 |
|------|------|----------------|
| `start_step` | **0~4** | **5 이상** → 닮음 붕괴, AI 기본 얼굴 생성 |
| `id_weight` | **0.84~0.95** | 낮추면 "젊은 일반인" AI 얼굴로 대체 |
| `guidance_scale` | **3.5 고정** | 높이면 플라스틱·과장된 AI 티 |
| 노화 표현 | **프롬프트**(머리색·주름·네거티브) | `id_weight`/`start_step` 낮춰서 억지 노화 |

### 파이프라인

1. **전처리**: 가로 16:9 → 상단 65% 세로 3:4 크롭 (`imagePreprocess.ts`)
2. **Fal CDN 업로드** → `flux-pulid` 호출
3. **출력**: `landscape_4_3` (영수증 얼굴 잘림 방지)

---

## 3. 현재 PuLID 파라미터 (최선 설정)

### 여성 (`FEMALE_PARAMS`)

| 나이 | id_weight | start_step | guidance |
|------|-----------|------------|----------|
| 25 | 0.94 | 2 | 3.5 |
| 35 | 0.92 | 3 | 3.5 |
| 45 | 0.90 | 3 | 3.5 |
| 55 | 0.87 | 4 | 3.5 |
| 65 | 0.84 | 4 | 3.5 |

### 남성 (`MALE_PARAMS`)

| 나이 | id_weight | start_step | guidance |
|------|-----------|------------|----------|
| 25 | 0.95 | 2 | 3.5 |
| 35 | 0.93 | 3 | 3.5 |
| 45 | 0.91 | 3 | 3.5 |
| 55 | 0.89 | 4 | 3.5 |
| 65 | 0.87 | 4 | 3.5 |

> 남성이 동일 나이에서 `id_weight`가 약 0.01~0.03 높음 → 닮음 유지에 유리

---

## 4. 나이 프롬프트 구조

### 공통 베이스 (`AGE_DESCRIPTORS`)

- **25**: smooth youthful skin, dark hair, no gray
- **35**: faint smile lines only, dark hair
- **45**: middle-aged NOT 30s, gray at temples, nasolabial folds
- **55**: fifties NOT 30s/40s, salt-and-pepper, under-eye bags, age spots
- **65**: senior NOT middle-aged, silver hair, deep wrinkles, marionette lines

### 성별별 추가 강조 (45세 이상만)

**여성 `FEMALE_AGE_BOOST`**
- 45: mature skin, no youthful glow
- 55: `looks exactly 55 NOT 35`, half-gray hair
- 65: `looks exactly 65 NOT 45`, silver-gray, deep wrinkles

**남성 `MALE_AGE_BOOST`**
- 45: mature masculine features
- 55: gray temples, crow's feet, `looks exactly 55`
- 65: mostly gray, weathered skin, `looks exactly 65 NOT 45`

### 헤어·스타일 (`getGenderAgeStyle`)

- **머리색 = 나이 인식 핵심** (회색·은발 비율을 프롬프트에 명시)
- 여성 55/65: `no makeup hiding wrinkles` 명시
- 남성 65: gray beard stubble optional

### 네거티브 (`buildNegativePrompt`)

- 고령일수록 `too young for age`, `looks 20s or 30s` 등 **젊어 보이는 것** 강하게 배제
- 여성 55+: `beautiful young woman`, `youthful glowing skin` 추가 배제

---

## 5. 직업 프롬프트 원칙 (`jobDetails.ts`)

### 공통 원칙

1. **얼굴 레벨 식별자** 우선 — 이마·머리 주변 소품 (보안경, 헬멧, 모자 등)
2. **손에 든 물건**은 가슴 높이, **인간 스케일** 명시 (`normal human-scale`, `NOT oversized`)
3. 배경은 softly blurred — 얼굴에 집중
4. `no earrings` 등 액세서리 추가 방지 (네거티브와 연동)

### 직업 목록 (18개)

간호사, 의사, 교사, 경찰, 소방관, 요리사, 변호사, 회계사, 운동선수, 가수, **과학자**, 스튜어디스, 프로게이머, 유튜버, CEO, 디자이너, 프로그래머, 사진작가

> 건축가 → **스튜어디스**로 교체됨

### 과학자 수정 이력

| 이전 | 이후 |
|------|------|
| `glass flask raised to face level` | `small test tube at chest level, ~15cm, NOT oversized, NOT large flask` |
| AI가 플라스크를 거대하게 그림 | 시험관 + 스케일 명시로 완화 |

### 직업별 튜닝 시 체크리스트

- [ ] 소품이 얼굴보다 크지 않은가?
- [ ] 소품이 얼굴을 가리지 않는가?
- [ ] 직업 식별이 1초 안에 되는가?
- [ ] 나이·성별과 충돌하는 표현은 없는가? (예: "youthful chef" at 65)

---

## 6. 테스트 피드백 로그

| 날짜 | 조건 | 결과 | 조치 |
|------|------|------|------|
| — | 여 55 간호사 | 30대처럼 보임 | FEMALE_AGE_BOOST 55 강화, id 0.87 유지 |
| — | 남 65 프로게이머 | 40대처럼 보임 | MALE_AGE_BOOST 65, id 0.87 (닮음 유지) |
| — | 공통 | AI 티 | guidance 3.5 고정, plastic skin 네거티브 |
| — | 과학자 | 플라스크 과대 | 시험관 15cm 프롬프트로 변경 |

### 다음 미세조정 후보 (허가 후 진행)

1. **여성 55/65**: `FEMALE_AGE_BOOST` 문구 더 강화 vs `id_weight` 0.01 하향 (닮음 테스트 필수)
2. **남성 65**: `looks exactly 65 NOT 40` 네거티브 추가 검토
3. **AI 티**: `guidance_scale`은 건드리지 말고, `plastic skin` 네거티브·`dignified` 톤 유지

---

## 7. QR 코드 / 사진 보관

### 동작 흐름

1. 변환 완료 → Supabase Storage 업로드 (720px JPEG, ~150KB)
2. `photo_sessions` 테이블에 세션 저장
3. QR = `https://phto-orcin.vercel.app/view?id={sessionId}`

### 환경 변수

```env
VITE_PUBLIC_APP_URL=https://phto-orcin.vercel.app
```

> 키오스크 로컬 IP와 배포 URL이 다를 때 QR이 깨지는 문제 방지

### 알려진 실패 원인

| 원인 | 해결 |
|------|------|
| `original_url` 컬럼 없음 | `migrate_original_url.sql` 실행 |
| 파일명 충돌 | `photo_${Date.now()}_${random}` |
| Fal CDN CORS | canvas `crossOrigin` 폴백 (`supabase.ts`) |
| 세션 INSERT 실패 | 스토리지 URL 폴백 QR (`Result.tsx`) |
| QR 없을 때 인쇄 불가 | 인쇄는 미리보기만 있으면 가능 |

### Supabase 필수 SQL

1. `photo_sessions.sql`
2. `photos_bucket.sql`
3. `migrate_original_url.sql` (1회)

---

## 8. 화면 / 반응형

### 키오스크 (기본값, 1024px 이상 `lg:`)

- **1920px 레이아웃 그대로 유지** — `lg:` breakpoint 이상에서 기존 스타일 적용
- `max-w-[1920px]`, 고정 그리드·폰트·패딩 변경 없음

### 모바일 (1024px 미만)

- 세로 스크롤 허용 (`overflow-y-auto`)
- 직업 선택: 3열 그리드 → 태블릿 4열 → 키오스크 6열
- 결과 화면: 사진·영수증 세로 스택
- 카메라: 세로 비율(`aspect-[4/5]`)로 셀카에 맞춤
- 상단 로고·처음으로 버튼 크기 축소

### breakpoint

| 구간 | Tailwind | 용도 |
|------|----------|------|
| ~1023px | (base) | 핸드폰·태블릿 |
| 1024px+ | `lg:` | 포토부스 키오스크 (기본값) |

---

## 9. 미세조정 작업 가이드

### 나이가 안 맞을 때

1. **먼저** `AGE_DESCRIPTORS` / `FEMALE_AGE_BOOST` / `MALE_AGE_BOOST` 문구 수정
2. **그다음** `getGenderAgeStyle` 머리색 강화
3. **마지막** `id_weight` 0.01~0.02 조정 (닮음 테스트 필수)
4. **`start_step` 5 이상 절대 금지**

### 직업이 이상할 때

1. `jobDetails.ts` 해당 직업 블록만 수정
2. 소품 스케일·위치 명시 (`chest level`, `NOT oversized`)
3. 3~5회 생성 후 패턴 확인

### QR이 안 될 때

1. 브라우저 콘솔 `[Supabase]`, `[QR]` 로그 확인
2. Vercel에 `VITE_PUBLIC_APP_URL` 설정 확인
3. Supabase `photo_sessions` INSERT 권한·`original_url` 컬럼 확인

### 안경(eyewear) 보존

- `eyewearDetection.ts` — 촬영 사진에서 안경 착용 여부 자동 감지
- **`uncertain` 상태 제거** — 확실히 착용 아니면 무조건 미착용 처리 (네거티브 빈값 버그 수정)
- 착용 판정 임계값 상향: 양쪽 눈 score > 35, 브릿지 > 15, total > 120 (눈썹·그림자 오탐 방지)
- **착용**: 동일한 안경테 유지 프롬프트 + 안경 제거 네거티브
- **미착용**: 안경 추가 금지 프롬프트 + 안경류 전체 네거티브 (항상 적용)

### 어린이 감지 및 성장 변환

- `subjectAgeDetection.ts` — 피부 매끄러움(인접 픽셀 분산) 분석으로 어린이/성인 구분
- 임계값 8: JPEG 노이즈(+3) 포함, 5~12세 감지 (보수적 — 오탐 최소화)
- 어린이 감지 시:
  - id_weight 소폭 하향 (25살: -0.05, 35살: -0.03, 45살+: -0.01) — 성장 변환 허용
  - 성장 변환 프롬프트 추가: "Transform this child into a fully grown Korean adult"
  - start_step 변경 없음 — 닮음 붕괴 방지
- 안경 + 피사체 연령 감지 **병렬 실행** — 속도 유지

| 조건 | id_weight 변화 | 프롬프트 |
|------|----------------|---------|
| 성인 + 25살 | 0.94/0.95 (기존) | 기존 나이 묘사 |
| 어린이 + 25살 | 0.89/0.90 (-0.05) | 성장 변환 프롬프트 추가 |
| 어린이 + 65살 | 변화 없음 | 기존 노화 묘사로 충분 |

---

## 10. 참고 링크

- [배포 앱](https://phto-orcin.vercel.app/)
- [Fal.ai flux-pulid](https://fal.ai/models/fal-ai/flux-pulid)
- PuLID: `start_step` 0~4, `id_weight` 0.85~0.95 권장

---

*마지막 업데이트: 2025-06-23*
