/**
 * 한국인 나이별 AI 변환 — 나이 묘사·네거티브 프롬프트·성별 스타일
 *
 * 연구 기반:
 * - LG H&H 한국 여성 1.6만명 AI 얼굴 노화 분석 (Journal of Investigative Dermatology)
 * - 한국인은 피부 관리 문화로 서양인보다 5~7세 젊어 보이는 경향
 * - 50세 이전: 눈가 잔주름 주도, 50세 이후: 입술 주변·볼 탄력 감소 추가
 *
 * E방안 적용 포인트:
 * - 타이트 상반신 크롭으로 얼굴이 화면의 40~60% 차지
 * - 머리카락 색·이마·눈가가 매우 잘 보임 → 나이별 얼굴 묘사 정밀도 핵심
 */

// ─── 나이별 시각 묘사 ────────────────────────────────────────────────────────
export const AGE_DESCRIPTORS: Record<number, string> = {
  // 25살 ─────────────────────────────────────────────────────────────────────
  25: [
    'looks exactly 25 years old',
    'perfectly smooth flawless porcelain skin with absolutely no wrinkles or lines',
    'plump full cheeks with youthful volume, bright wide eyes',
    'completely smooth forehead with no lines whatsoever',
    'firm defined jawline, smooth temples with no gray',
    'fresh radiant glass skin complexion, looks like a university student',
    'very energetic youthful vibrant appearance',
  ].join(', '),

  // 35살 ─────────────────────────────────────────────────────────────────────
  // 한국인 35세 = 서양인 28세 수준. 자연스러운 성숙함만, 주름 거의 없음
  35: [
    'looks exactly 35 years old',
    'smooth healthy skin with virtually no visible wrinkles',
    'only the faintest barely-visible smile lines at far outer eye corners',
    'completely smooth forehead, nasolabial folds NOT visible',
    'excellent skin elasticity, still looks very youthful',
    'temples fully dark with zero gray hair, dark eyebrows',
    'vibrant healthy complexion, full cheeks, confident professional look',
  ].join(', '),

  // 45살 ─────────────────────────────────────────────────────────────────────
  // 핵심: 한국 45세는 서양인 37세 수준, 주름 거의 없음
  // "noticeable wrinkles" 완전 금지 → 성숙함은 눈빛과 표정으로만 표현
  45: [
    'looks exactly 45 years old',
    'healthy mature Korean appearance, well-maintained smooth skin',
    'barely visible fine lines at outer eye corners only when smiling — NOT prominent',
    'smooth forehead with no deep lines, nasolabial folds very faint and subtle',
    'full healthy cheeks with good skin elasticity',
    'mostly dark hair with ONLY 2-3 natural gray strands at temples, crown fully dark',
    'confident distinguished mature look, active and healthy, absolutely NOT middle-aged looking',
  ].join(', '),

  // 55살 ─────────────────────────────────────────────────────────────────────
  // 자연스러운 노화, 건강하고 활기찬 모습. 서양인 45세 수준
  55: [
    'looks exactly 55 years old',
    'naturally aged but vibrant healthy Korean appearance',
    'light crow\'s feet at outer eye corners only — subtle, not deep',
    'gentle smile lines, mild nasolabial folds — not extreme',
    'healthy skin with natural mature texture, NOT sagging',
    'salt-and-pepper hair: dark base with visible gray at temples and sides, crown still mostly dark',
    'fit active 55-year-old, full of vitality, looks noticeably younger than actual age',
    'wise confident smile, absolutely NOT frail or elderly-looking',
  ].join(', '),

  // 65살 ─────────────────────────────────────────────────────────────────────
  // 한국인 특유의 품위 있는 노화. 서양인 55세 수준
  65: [
    'looks exactly 65 years old',
    'graceful dignified Korean aging, healthy and distinguished',
    'moderate natural wrinkles around eyes and smile area — NOT deep creases',
    'gentle relaxed facial contour, skin slightly softer but NOT heavily sagging',
    'distinguished silver-gray hair neatly styled, silver primarily at temples and crown',
    'warm healthy skin tone, natural mature Korean complexion',
    'kind wise expression, active and healthy elder, NOT frail or sick',
    'respected distinguished 65-year-old, looks energetic and well',
  ].join(', '),
};

/** 가장 가까운 나이 키로 매핑 (25/35/45/55/65) */
const snapAge = (age: number): number => {
  const keys = [25, 35, 45, 55, 65];
  return keys.reduce((prev, cur) =>
    Math.abs(cur - age) < Math.abs(prev - age) ? cur : prev,
  );
};

export const getAgeDescriptor = (ageStr: string): string => {
  const match = ageStr.match(/\d+/);
  const age = match ? parseInt(match[0], 10) : 35;
  return AGE_DESCRIPTORS[snapAge(age)];
};

export const parseAgeNumber = (ageStr: string): number => {
  const match = ageStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 35;
};

// ─── 공통 네거티브 프롬프트 베이스 ───────────────────────────────────────────
const NEGATIVE_BASE = [
  'bad quality, worst quality, blurry, grainy, low resolution, out of focus',
  'deformed face, disfigured, distorted features, melting face, asymmetrical face',
  'extra limbs, extra fingers, missing fingers, wrong anatomy, malformed hands',
  'text, watermark, signature, logo, caption, subtitles',
  'cartoon, anime, illustration, painting, 2D art, comic style',
  'multiple people, duplicate faces, cloned appearance',
  'western caucasian facial features, non-Korean appearance',
  'overly processed plastic surgery appearance, uncanny valley',
  'poorly lit, harsh shadows, overexposed, underexposed',
  'wrong gender, different person, identity mismatch',
  'different face, changed facial features, altered eye shape, altered nose shape, altered lip shape',
  'lookalike, twin, stranger, celebrity face, generic AI face',
  'earrings, earring, ear jewelry, pierced ears, facial piercings, nose ring',
  'necklace, bracelet, added jewelry, added accessories, unrequested jewelry',
  'heavy makeup change, dramatic makeup transformation, face paint',
].join(', ');

/**
 * 나이별 동적 네거티브 프롬프트
 *
 * E방안 강화: 얼굴이 화면에 크게 보이므로
 * 나이별 "절대 금지 노화 징후"를 더 명확히 명시
 */
export const buildNegativePrompt = (ageStr: string): string => {
  const age = parseAgeNumber(ageStr);

  if (age <= 30) {
    return NEGATIVE_BASE + ', ' + [
      'any wrinkles, crow\'s feet, nasolabial folds, forehead lines, expression lines',
      'aging spots, mature skin texture, skin sagging, under-eye bags',
      'gray hair, white hair, salt-and-pepper hair, thinning hair',
      'middle-aged appearance, tired or aged expression',
    ].join(', ');
  }
  if (age <= 40) {
    return NEGATIVE_BASE + ', ' + [
      'heavy wrinkles, deep facial lines, prominent nasolabial folds, deep forehead lines',
      'visible gray hair, mostly gray hair, thinning hairline',
      'elderly or old-looking appearance, skin sagging, jowls',
    ].join(', ');
  }
  if (age <= 50) {
    return NEGATIVE_BASE + ', ' + [
      'excessive deep wrinkles, heavily wrinkled face, prominent forehead creases',
      'mostly gray or white hair, heavily aged skin, deep nasolabial folds',
      'elderly appearance, frail or weak-looking, 60 or 70 years old appearance',
    ].join(', ');
  }
  if (age <= 60) {
    return NEGATIVE_BASE + ', ' + [
      'extremely aged, deeply furrowed wrinkles, 70 or 80 years old appearance',
      'fully white hair all over, heavy facial sagging, prominent jowls',
      'frail elderly, weak or sick looking, very old appearance',
    ].join(', ');
  }
  return NEGATIVE_BASE + ', ' + [
    'extremely old, 80 or 90 years old appearance, 100 year old',
    'deeply furrowed wrinkles, severe facial sagging, frail or decrepit',
    'senile or very sick appearance, extremely frail, bedridden appearance',
  ].join(', ');
};

// 하위 호환성용 정적 버전 (기본 35살 기준)
export const NEGATIVE_PROMPT = buildNegativePrompt('35살');

// ─── 성별×나이 외모 스타일링 ─────────────────────────────────────────────────
// E방안: 얼굴이 클로즈업으로 보이므로 헤어 색상·스타일이 매우 중요
export const getGenderAgeStyle = (gender: string, age: number): string => {
  if (gender === '여자') {
    if (age <= 30) return 'trendy neat Korean hairstyle, minimal natural makeup, bare natural face, dark lustrous hair, no earrings';
    if (age <= 40) return 'professional stylish Korean hairstyle, very subtle natural makeup, fully dark hair with healthy shine, no earrings';
    if (age <= 50) return 'sophisticated Korean professional hairstyle (neat updo or shoulder-length), light natural makeup, mostly dark hair, no earrings';
    if (age <= 60) return 'gracefully styled Korean mature hairstyle with natural silver streaks at temples, dignified natural appearance, no earrings';
    return 'beautifully styled silver or salt-and-pepper Korean elder hairstyle, naturally aged graceful feminine appearance, no earrings';
  }
  // 남자
  if (age <= 30) return 'neat modern Korean male hairstyle, clean-shaven, youthful masculine appearance, dark thick hair';
  if (age <= 40) return 'neat professional Korean male hairstyle, clean-shaven or light stubble, fully dark hair';
  if (age <= 50) return 'neat professional mature Korean male hairstyle, barely noticeable silver only at temples, mostly dark';
  if (age <= 60) return 'well-groomed mature Korean male hairstyle with natural salt-and-pepper, distinguished masculine appearance';
  return 'neatly combed silver or gray Korean elder hairstyle, dignified distinguished masculine appearance';
};
