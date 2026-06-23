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
  // 임상: 40대 눈가 주름 면적 60, 팔자 29 — 눈에 띄기 시작하나 깊지 않음
  // 한국 45세는 서양인 40세 수준 (약간 젊어 보임)
  45: [
    'clearly looks 45 years old, a middle-aged adult (NOT young, NOT in 30s)',
    'mature Korean adult face with visible signs of being in mid-forties',
    'visible fine crow\'s feet at outer eye corners, noticeable when neutral',
    'light but clearly present nasolabial folds (smile lines from nose to mouth)',
    'a few faint horizontal forehead lines, mild under-eye area',
    'slightly less plump cheeks than youth, healthy skin elasticity',
    'dark hair with a noticeable scattering of gray strands at temples and sideburns',
    'confident settled middle-aged look, mature and established',
  ].join(', '),

  // 55살 ─────────────────────────────────────────────────────────────────────
  // 임상: 50대 눈가 주름 73, 팔자 38, 미간 26 — 뚜렷한 주름 단계
  // 60% 이상이 "눈꼬리 부채형 옅은 주름" 보유. 서양인 50세 수준
  55: [
    'clearly looks 55 years old, an older middle-aged Korean adult (NOT young)',
    'evident facial aging appropriate for mid-fifties',
    'distinct fan-shaped crow\'s feet wrinkles spreading from outer eye corners',
    'clearly visible nasolabial folds and developing marionette lines around mouth',
    'visible horizontal forehead lines and glabellar (frown) lines between brows',
    'mild under-eye bags and slight cheek volume loss, softening jawline',
    'a few small age spots / pigmentation on cheeks, skin texture less smooth',
    'prominent salt-and-pepper hair: roughly half gray, gray heavy at temples and sides',
    'dignified healthy older adult, wise and experienced, NOT frail',
  ].join(', '),

  // 65살 ─────────────────────────────────────────────────────────────────────
  // 임상: 60대 눈가 85, 팔자 43, 미간 32 — 90%가 "부채형 깊은 주름"
  // 색소침착·처짐(이중턱, 둥근 턱선) 두드러짐. 흰머리 우세. 서양인 60세 수준
  65: [
    'unmistakably looks 65 years old, a Korean senior / elderly person (clearly NOT middle-aged)',
    'clear elderly facial aging appropriate for mid-sixties',
    'deep fan-shaped crow\'s feet wrinkles, pronounced wrinkles around eyes',
    'deep prominent nasolabial folds and marionette lines, wrinkles around lips and mouth corners',
    'visible forehead wrinkles, glabellar frown lines, under-eye wrinkles and eye bags',
    'noticeable age spots and pigmentation on cheeks and forehead, weathered mature skin texture',
    'sagging cheeks with descended fat pads, softer rounded jawline, slight double chin and jowls',
    'predominantly gray and silver hair (mostly gray, sparse dark strands), thinner hairline',
    'slightly lower skin brightness with warmer yellow undertone, natural elderly Korean complexion',
    'kind wise dignified senior expression, healthy and active elder, NOT sick or frail',
  ].join(', '),
};

// ─── 나이별 PuLID 파라미터 ───────────────────────────────────────────────────
// PuLID 공식: start_step↑ / id_weight↓ → 편집(노화) 자유도↑, 얼굴 고정↓
//
// 핵심 전략: 젊은 나이 = 얼굴 강하게 고정(노화 불필요)
//           나이 많을수록 = 노화가 표현되도록 편집 여지 확대
//   (이전엔 전 연령 id_weight 0.92/start_step 3 → 65세도 젊은 얼굴 고정되어 노화 안 됨)
export interface PulidParams {
  id_weight: number;
  start_step: number;
  guidance_scale: number;
}

// 핵심: guidance_scale은 자연스러움을 위해 낮게 유지 (높으면 AI 티/플라스틱 느낌)
//   노화는 start_step↑(편집 자유도) + 강한 노화 묘사 프롬프트로 표현
//
// 여성: 동안·미화 편향이 강함 → start_step을 높여 노화 충분히 적용
//   단 id_weight를 바닥까지 낮추면 본인이 아닌 '젊은 일반 여성'이 되므로 적정선 유지
const FEMALE_PARAMS: Record<number, PulidParams> = {
  25: { id_weight: 0.92, start_step: 2, guidance_scale: 3.5 },
  35: { id_weight: 0.82, start_step: 4, guidance_scale: 3.6 },
  45: { id_weight: 0.72, start_step: 5, guidance_scale: 3.8 },
  55: { id_weight: 0.64, start_step: 6, guidance_scale: 4.0 },
  65: { id_weight: 0.58, start_step: 7, guidance_scale: 4.2 }, // 강한 노화 + 자연스러움
};

// 남성: 노화가 과하게 표현되던 문제 → id_weight↑(얼굴 보존), start_step·guidance↓
const MALE_PARAMS: Record<number, PulidParams> = {
  25: { id_weight: 0.95, start_step: 2, guidance_scale: 3.5 },
  35: { id_weight: 0.90, start_step: 3, guidance_scale: 3.5 },
  45: { id_weight: 0.84, start_step: 3, guidance_scale: 3.6 },
  55: { id_weight: 0.80, start_step: 4, guidance_scale: 3.7 },
  65: { id_weight: 0.74, start_step: 5, guidance_scale: 3.9 }, // 적당한 노화 (과노화 방지)
};

export const getPulidParams = (ageStr: string, gender: string): PulidParams => {
  const snapped = snapAge(parseAgeNumber(ageStr));
  const table = gender === '여자' ? FEMALE_PARAMS : MALE_PARAMS;
  return table[snapped] ?? { id_weight: 0.78, start_step: 4, guidance_scale: 4.0 };
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
  // 인공적/AI 느낌 방지 — 자연스러운 실사 사진처럼
  'plastic skin, waxy skin, airbrushed skin, overly smooth skin, doll-like skin',
  '3D render, CGI, video game character, digital painting, render, artificial',
  'oversaturated, over-sharpened, excessive contrast, HDR look, glossy plastic',
  'fake looking, computer generated, uncanny valley, mannequin',
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
    // 45세: 중년 변화는 허용, 노인급만 차단
    return NEGATIVE_BASE + ', ' + [
      'heavily wrinkled elderly face, deep furrowed wrinkles all over',
      'mostly gray or white hair, sagging jowls',
      'elderly senior appearance, frail or weak-looking, 60 or 70 years old appearance',
      'youthful 20s or 30s flawless skin with no aging signs',
    ].join(', ');
  }
  if (age <= 60) {
    // 55세: 뚜렷한 노화 허용, 80세급 극단만 차단
    return NEGATIVE_BASE + ', ' + [
      'extremely aged 70 or 80 years old appearance, deeply furrowed deep canyon wrinkles',
      'fully white hair all over, severe heavy facial sagging, large drooping jowls',
      'frail weak or sick looking, decrepit very old appearance',
      'youthful smooth wrinkle-free 30s skin, looks too young for age',
    ].join(', ');
  }
  // 65세: 60대 노화 충분히 허용, 80~100세 초고령·병약만 차단
  return NEGATIVE_BASE + ', ' + [
    'extremely old 80 or 90 or 100 years old appearance',
    'severe canyon-deep furrowed wrinkles, extreme facial collapse, severe sagging',
    'frail decrepit, senile or very sick appearance, extremely frail, bedridden appearance',
    'youthful middle-aged 40s look, too young for age, smooth wrinkle-free skin',
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
    if (age <= 50) return 'sophisticated Korean hairstyle, light natural makeup, mostly dark hair, visible age-appropriate fine wrinkles, clearly a woman in her mid-forties, no earrings';
    // 55·65: 동안 편향을 이기도록 노화를 명시적으로 강조
    if (age <= 60) return 'mature Korean woman in her mid-fifties, salt-and-pepper hair with prominent gray, clearly visible crow\'s feet and nasolabial folds, mature aged skin texture, looks her full age, dignified, no earrings, no heavy makeup hiding age';
    return 'elderly Korean woman in her mid-sixties, predominantly gray and silver hair, clearly visible deep wrinkles around eyes mouth and forehead, age spots, sagging mature skin, unmistakably a senior woman, looks her full age, NOT youthful, no earrings, no makeup hiding wrinkles';
  }
  // 남자
  if (age <= 30) return 'neat modern Korean male hairstyle, clean-shaven, youthful masculine appearance, dark thick hair';
  if (age <= 40) return 'neat professional Korean male hairstyle, clean-shaven or light stubble, fully dark hair';
  if (age <= 50) return 'neat professional mature Korean male hairstyle, barely noticeable silver only at temples, mostly dark';
  if (age <= 60) return 'well-groomed mature Korean male hairstyle with natural salt-and-pepper, distinguished masculine appearance';
  return 'neatly combed silver or gray Korean elder hairstyle, dignified distinguished masculine appearance';
};
