/**
 * 한국인 나이·성별별 AI 변환 — 나이 묘사·네거티브·PuLID 파라미터
 *
 * PuLID 공식 권장 (3회 검증):
 *   - start_step: 0~4 (4 = realistic). 5 이상은 닮음 붕괴 + AI 기본 얼굴 생성
 *   - id_weight: 0.85~0.95 → 닮음 유지. 낮추면 '젊은 일반인' AI 얼굴로 대체됨
 *   - 노화는 start_step이 아니라 프롬프트(머리색·주름·피부)로 표현
 *   - guidance 3.5 고정 → fake CFG, 자연스러운 실사 (높으면 플라스틱 AI 티)
 */

// ─── 나이별 시각 묘사 (성별 공통 베이스) ────────────────────────────────────
export const AGE_DESCRIPTORS: Record<number, string> = {
  25: [
    'looks 25 years old',
    'youthful skin, bright eyes',
    'dark hair, no gray, energetic appearance',
  ].join(', '),

  35: [
    'looks 35 years old',
    'healthy adult skin, faint smile lines at eye corners',
    'dark hair, confident mature professional',
  ].join(', '),

  45: [
    'looks 45 years old, clearly middle-aged adult NOT in 20s or 30s',
    'visible crow\'s feet, pronounced nasolabial folds, loss of facial fat',
    'some gray hair at temples, mature aging skin texture',
  ].join(', '),

  55: [
    'looks 55 years old, older middle-aged adult',
    'deep natural wrinkles around eyes and mouth, noticeable skin sagging, prominent age spots',
    'salt-and-pepper hair, realistic weathered aging skin, no baby fat',
  ].join(', '),

  65: [
    'looks 65 years old, elderly senior',
    'very deep wrinkles, hollow cheeks, heavily aged weathered skin, complete loss of facial fat',
    'mostly gray or silver hair, significant skin sagging, wise elder expression',
  ].join(', '),
};

// ─── 성별별 추가 노화 강조 (프롬프트로 나이 표현 — id_weight는 닮음 유지) ─────
const FEMALE_AGE_BOOST: Record<number, string> = {
  45: 'woman in her mid-forties with aging mature skin',
  55: 'Korean woman in her fifties with salt-and-pepper hair, visible wrinkles, looks about 55',
  65: 'Korean woman in her sixties with gray hair, deep facial lines, heavily aged skin, looks about 65',
};

const MALE_AGE_BOOST: Record<number, string> = {
  45: 'man in his mid-forties, mature aged skin',
  55: 'Korean man in his fifties with gray temples, deep lines, weathered skin, looks about 55',
  65: 'Korean man in his sixties with gray hair, deep wrinkles, hollow cheeks, looks about 65',
};

export interface PulidParams {
  id_weight: number;
  start_step: number;
  guidance_scale: number;
}

/**
 * PuLID 파라미터 — 노화(55, 65)를 위해 id_weight 파격 하향, guidance 상향
 *
 * id_weight: 0.95(20대) -> 0.60(60대)
 * start_step: 2(20대) -> 5(60대)
 * guidance: 3.5(20대) -> 5.0(60대)
 */
const FEMALE_PARAMS: Record<number, PulidParams> = {
  25: { id_weight: 0.95, start_step: 2, guidance_scale: 3.5 },
  35: { id_weight: 0.92, start_step: 2, guidance_scale: 3.8 },
  45: { id_weight: 0.82, start_step: 3, guidance_scale: 4.2 },
  55: { id_weight: 0.70, start_step: 4, guidance_scale: 4.6 },
  65: { id_weight: 0.58, start_step: 5, guidance_scale: 5.0 },
};

const MALE_PARAMS: Record<number, PulidParams> = {
  25: { id_weight: 0.95, start_step: 2, guidance_scale: 3.5 },
  35: { id_weight: 0.92, start_step: 2, guidance_scale: 3.8 },
  45: { id_weight: 0.82, start_step: 3, guidance_scale: 4.2 },
  55: { id_weight: 0.70, start_step: 4, guidance_scale: 4.6 },
  65: { id_weight: 0.58, start_step: 5, guidance_scale: 5.0 },
};

export const getPulidParams = (ageStr: string, gender: string): PulidParams => {
  const snapped = snapAge(parseAgeNumber(ageStr));
  const table = gender === '여자' ? FEMALE_PARAMS : MALE_PARAMS;
  return table[snapped] ?? { id_weight: 0.90, start_step: 3, guidance_scale: 3.5 };
};

const snapAge = (age: number): number => {
  const keys = [25, 35, 45, 55, 65];
  return keys.reduce((prev, cur) =>
    Math.abs(cur - age) < Math.abs(prev - age) ? cur : prev,
  );
};

export const getAgeDescriptor = (ageStr: string, gender?: string): string => {
  const age = parseAgeNumber(ageStr);
  const snapped = snapAge(age);
  const base = AGE_DESCRIPTORS[snapped];

  if (!gender || snapped < 45) return base;

  const boost = gender === '여자'
    ? FEMALE_AGE_BOOST[snapped]
    : MALE_AGE_BOOST[snapped];

  return boost ? `${base}, ${boost}` : base;
};

export const parseAgeNumber = (ageStr: string): number => {
  const match = ageStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 35;
};

// ─── 네거티브 프롬프트 ───────────────────────────────────────────────────────
const NEGATIVE_BASE = [
  'bad quality, blurry, low resolution',
  'deformed face, disfigured, distorted features, asymmetrical face',
  'extra limbs, extra fingers, malformed hands',
  'cartoon, anime, illustration, 3D render, CGI, painting',
  'multiple people, duplicate faces, two faces, split face, diptych, twin, clone',
  'western caucasian features, non-Korean',
  'different person, wrong face, identity mismatch, stranger, celebrity',
  'earrings, jewelry, piercings, added earrings, added jewelry',
  'plastic skin, waxy skin, airbrushed, doll-like, oversaturated, over-sharpened',
  'fake, artificial, uncanny valley, mannequin',
  'extreme close-up, face filling entire frame, macro portrait, cropped forehead, chin cut off',
  'beauty filter, glamour retouching, porcelain skin, CGI face, AI generated look, stock photo',
  'overly dramatic aging, exaggerated wrinkles, horror elderly, wax figure',
].join(', ');

export const buildNegativePrompt = (
  ageStr: string,
  gender?: string,
  eyewearNegative?: string,
): string => {
  const age = parseAgeNumber(ageStr);
  const tooYoung = gender === '여자'
    ? 'looks 20s or 30s, youthful glowing skin, no wrinkles, smooth flawless skin, baby fat, chubby cheeks'
    : 'looks 20s or 30s, youthful smooth face, no gray hair, baby fat, chubby cheeks';

  let result: string;

  if (age <= 30) {
    result = NEGATIVE_BASE + ', wrinkles, gray hair, aged skin, middle-aged';
  } else if (age <= 40) {
    result = NEGATIVE_BASE + ', heavy wrinkles, gray hair, elderly appearance, child, baby face';
  } else if (age <= 50) {
    result = NEGATIVE_BASE + ', elderly, deep wrinkles, mostly white hair, child, kid, ' + tooYoung;
  } else if (age <= 60) {
    result = NEGATIVE_BASE + ', extremely old 80 years, frail, child, kid, ' + tooYoung;
  } else {
    result = NEGATIVE_BASE + ', extremely old 90 years, decrepit, child, kid, ' + tooYoung;
  }

  if (eyewearNegative) {
    result += ', ' + eyewearNegative;
  }

  result += ', two people, duplicate face, split face, half-half portrait, mirrored duplicate, double head, diptych, twins';

  return result;
};

export const NEGATIVE_PROMPT = buildNegativePrompt('35살');

// ─── 성별×나이 헤어·스타일 (머리색 = 나이 인식 핵심) ─────────────────────────
export const getGenderAgeStyle = (gender: string, age: number): string => {
  const snapped = snapAge(age);

  if (gender === '여자') {
    switch (snapped) {
      case 25: return 'neat dark hairstyle, minimal makeup, no earrings';
      case 35: return 'professional dark hairstyle, subtle makeup, no earrings';
      case 45: return 'mature hairstyle, mostly dark hair with gray at temples, light makeup, no earrings';
      case 55: return 'mature hairstyle with prominent gray and silver streaks, visible aging on face, no earrings, no makeup hiding wrinkles';
      case 65: return 'silver-gray elderly hairstyle, mostly gray hair, aged face with wrinkles clearly visible, no earrings';
      default: return 'neat hairstyle, no earrings';
    }
  }

  switch (snapped) {
    case 25: return 'neat dark hair, clean-shaven, youthful';
    case 35: return 'neat dark hair, clean-shaven or light stubble';
    case 45: return 'mostly dark hair, gray strands at temples, mature look';
    case 55: return 'salt-and-pepper hair, gray temples, visible forehead lines, mature masculine';
    case 65: return 'mostly gray or silver hair, gray beard stubble optional, weathered mature face, distinguished elder';
    default: return 'neat groomed hair';
  }
};
