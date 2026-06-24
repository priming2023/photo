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
    'smooth youthful skin, full cheeks, bright eyes',
    'dark hair, no gray, energetic fresh appearance',
  ].join(', '),

  35: [
    'looks 35 years old',
    'healthy smooth skin, very faint smile lines only at eye corners',
    'dark hair, confident mature professional look',
  ].join(', '),

  45: [
    'looks 45 years old, clearly middle-aged NOT in 30s',
    'visible fine crow\'s feet, light nasolabial folds',
    'some gray strands at temples, mature settled appearance',
  ].join(', '),

  55: [
    'looks 55 years old, clearly in fifties NOT in thirties or forties',
    'distinct crow\'s feet wrinkles, visible nasolabial folds and smile lines',
    'forehead lines, under-eye bags, salt-and-pepper hair with prominent gray at temples',
    'mild age spots, mature skin texture, dignified older adult',
    'mandatory visible aging signs, NOT youthful appearance',
  ].join(', '),

  65: [
    'looks 65 years old, clearly a senior NOT middle-aged NOT in forties',
    'pronounced wrinkles around eyes mouth and forehead',
    'deep nasolabial folds, marionette lines, under-eye wrinkles',
    'mostly gray or silver hair, age spots on cheeks, softer jawline',
    'natural elderly Korean complexion, wise dignified senior',
    'unmistakably elderly face, NOT 40s or 50s',
  ].join(', '),
};

// ─── 성별별 추가 노화 강조 (프롬프트로 나이 표현 — id_weight는 닮음 유지) ─────
const FEMALE_AGE_BOOST: Record<number, string> = {
  45: 'woman in her mid-forties with mature skin, no youthful glow',
  55: 'Korean woman clearly in her mid-fifties, half-gray salt-and-pepper hair, deep crow\'s feet and nasolabial folds, looks exactly 55 NOT 30 NOT 40, no youthful skin',
  65: 'Korean woman clearly in her mid-sixties, predominantly silver-gray hair, deep facial wrinkles and age spots, sagging skin, unmistakably elderly, looks exactly 65 NOT 45 NOT 50',
};

const MALE_AGE_BOOST: Record<number, string> = {
  45: 'man in his mid-forties, mature masculine features',
  55: 'Korean man in his mid-fifties, gray temples and sideburns, visible crow\'s feet and forehead lines, looks exactly 55 NOT 40',
  65: 'Korean man in his mid-sixties, mostly gray hair, pronounced wrinkles, weathered mature skin, looks exactly 65 NOT 45 NOT 50, dignified elder NOT middle-aged',
};

export interface PulidParams {
  id_weight: number;
  start_step: number;
  guidance_scale: number;
}

/**
 * PuLID 파라미터 — 닮음 우선, 노화는 프롬프트가 담당
 *
 * id_weight: 0.84~0.95 (닮음 핵심. 여성 고령만 0.84까지)
 * start_step: 2~4 (공식 권장 범위 준수. 절대 5 이상 금지)
 * guidance: 3.5 고정 (자연스러운 fake CFG)
 */
const FEMALE_PARAMS: Record<number, PulidParams> = {
  25: { id_weight: 0.94, start_step: 2, guidance_scale: 3.5 },
  35: { id_weight: 0.92, start_step: 3, guidance_scale: 3.5 },
  45: { id_weight: 0.90, start_step: 3, guidance_scale: 3.5 },
  55: { id_weight: 0.87, start_step: 4, guidance_scale: 3.5 },
  65: { id_weight: 0.84, start_step: 4, guidance_scale: 3.5 },
};

const MALE_PARAMS: Record<number, PulidParams> = {
  25: { id_weight: 0.95, start_step: 2, guidance_scale: 3.5 },
  35: { id_weight: 0.93, start_step: 3, guidance_scale: 3.5 },
  45: { id_weight: 0.91, start_step: 3, guidance_scale: 3.5 },
  55: { id_weight: 0.89, start_step: 4, guidance_scale: 3.5 },
  65: { id_weight: 0.87, start_step: 4, guidance_scale: 3.5 },
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
  'multiple people, duplicate faces',
  'western caucasian features, non-Korean',
  'different person, wrong face, identity mismatch, stranger, celebrity',
  'earrings, jewelry, piercings, added earrings, added jewelry',
  'plastic skin, waxy skin, airbrushed, doll-like, oversaturated, over-sharpened',
  'fake, artificial, uncanny valley, mannequin',
].join(', ');

export const buildNegativePrompt = (
  ageStr: string,
  gender?: string,
  eyewearNegative?: string,
): string => {
  const age = parseAgeNumber(ageStr);
  const tooYoung = gender === '여자'
    ? 'looks 20s or 30s or 40s, youthful glowing skin, no wrinkles, dark hair only, too young for age, beautiful young woman, smooth flawless skin'
    : 'looks 30s or 40s, too young for age, youthful smooth face, no gray hair, middle-aged appearance';

  let result: string;

  if (age <= 30) {
    result = NEGATIVE_BASE + ', wrinkles, gray hair, aged skin, middle-aged';
  } else if (age <= 40) {
    result = NEGATIVE_BASE + ', heavy wrinkles, gray hair, elderly appearance';
  } else if (age <= 50) {
    result = NEGATIVE_BASE + ', elderly, deep wrinkles, mostly white hair, ' + tooYoung;
  } else if (age <= 60) {
    result = NEGATIVE_BASE + ', extremely old 80 years, frail, ' + tooYoung;
  } else {
    result = NEGATIVE_BASE + ', extremely old 90 years, decrepit, ' + tooYoung;
  }

  if (eyewearNegative) {
    result += ', ' + eyewearNegative;
  }

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
