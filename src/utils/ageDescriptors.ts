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
const FEMALE_AGE_DESCRIPTORS: Record<number, string> = {
  30: 'looks exactly 35 years old, mature Korean woman in her mid-thirties, well-defined facial structure, complete loss of teenage baby fat, elegant mature face, sophisticated professional look NOT in 20s',
  40: 'looks exactly 45 years old, middle-aged Korean woman in her mid-forties, visible fine lines around eyes, natural nasolabial folds, slight loss of skin elasticity, mature skin',
  50: 'looks exactly 55 years old, older middle-aged Korean woman, prominent crow\'s feet and smile lines, visible skin aging, salt-and-pepper hair, realistic mature skin texture, no baby fat',
  60: 'looks exactly 65 years old, dignified elderly Korean woman, natural deep wrinkles, pronounced nasolabial folds, realistic aged skin texture, mostly silver or gray hair, wise calm expression'
};

const MALE_AGE_DESCRIPTORS: Record<number, string> = {
  30: 'looks exactly 35 years old, Korean man in his mid-thirties, healthy clear adult skin, very faint smile lines, well-defined jawline, clean-shaven, confident young professional', // 구 35세 남자
  40: 'looks exactly 45 years old, middle-aged Korean man in his early forties, subtle crow\'s feet, natural nasolabial folds, masculine mature face, experienced look', // 구 45세 (40대로 텍스트 약간 수정)
  50: 'looks exactly 55 years old, older middle-aged Korean man, visible natural wrinkles on forehead and around mouth, graying hair at temples, weathered skin', // 구 55세
  60: 'looks exactly 65 years old, elderly Korean man, deep natural wrinkles, realistic aged skin texture, mostly silver or gray hair, distinguished senior' // 구 65세
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
  30: { id_weight: 0.92, start_step: 2, guidance_scale: 3.8 }, // 구 35세
  40: { id_weight: 0.82, start_step: 3, guidance_scale: 4.2 }, // 구 45세
  50: { id_weight: 0.70, start_step: 4, guidance_scale: 4.6 }, // 구 55세
  60: { id_weight: 0.58, start_step: 5, guidance_scale: 5.0 }, // 구 65세
};

const MALE_PARAMS: Record<number, PulidParams> = {
  30: { id_weight: 0.92, start_step: 2, guidance_scale: 3.8 }, // 구 35세 남자
  40: { id_weight: 0.82, start_step: 3, guidance_scale: 4.2 }, // 구 45세
  50: { id_weight: 0.70, start_step: 4, guidance_scale: 4.6 }, // 구 55세
  60: { id_weight: 0.58, start_step: 5, guidance_scale: 5.0 }, // 구 65세
};

export const getPulidParams = (ageStr: string, gender: string): PulidParams => {
  const snapped = snapAge(parseAgeNumber(ageStr));
  const table = gender === '여자' ? FEMALE_PARAMS : MALE_PARAMS;
  return table[snapped] ?? { id_weight: 0.90, start_step: 3, guidance_scale: 3.5 };
};

const snapAge = (age: number): number => {
  if (age < 35) return 30;
  if (age < 45) return 40;
  if (age < 55) return 50;
  return 60;
};

export const getAgeDescriptor = (ageStr: string, gender?: string): string => {
  const age = parseAgeNumber(ageStr);
  const snapped = snapAge(age);
  
  return gender === '여자' 
    ? FEMALE_AGE_DESCRIPTORS[snapped] 
    : MALE_AGE_DESCRIPTORS[snapped];
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
  let tooYoung = '';
  let tooOld = '';

  if (gender === '여자') {
    // 여자: 구 1fef41e 시절 네거티브
    if (age >= 30) tooYoung = 'looks 20s, college student, teenage, baby face, chubby cheeks, overly youthful';
    if (age >= 40) tooYoung += ', looks 30s, flawless skin, no wrinkles';
  } else {
    // 남자: 구 1fef41e 시절 네거티브 (구 25세 로직 삭제, 구 35세 로직을 30에 적용)
    if (age <= 30) tooOld = 'looks 50s, deep wrinkles, old man, tired look'; // 구 35세 남자
    else if (age <= 40) tooOld = 'looks 60s, deep wrinkles, completely white hair'; // 구 45세 남자
    // 50세 이상은 tooOld 없음
  }

  let result = NEGATIVE_BASE;

  if (age <= 30) {
    result += ', heavy wrinkles, gray hair, elderly appearance, child, baby face'; // 구 35세 (너무 늙어보이거나 너무 어려보이는 것 방어)
  } else if (age <= 40) {
    result += ', elderly, deep wrinkles, mostly white hair, child, kid'; // 구 45세: 흰머리 방지
  } else if (age <= 50) {
    result += ', extremely old 80 years, frail, child, kid'; // 구 55세
  } else {
    result += ', extremely old 90 years, decrepit, child, kid'; // 구 65세
  }

  if (tooYoung) result += ', ' + tooYoung;
  if (tooOld) result += ', ' + tooOld;
  if (eyewearNegative) result += ', ' + eyewearNegative;

  result += ', two people, duplicate face, split face, half-half portrait, mirrored duplicate, double head, diptych, twins';

  return result;
};

export const NEGATIVE_PROMPT = buildNegativePrompt('40살');

// ─── 성별×나이 헤어·스타일 (머리색 = 나이 인식 핵심) ─────────────────────────
export const getGenderAgeStyle = (gender: string, age: number): string => {
  const snapped = snapAge(age);

  if (gender === '여자') {
    switch (snapped) {
      case 30: return 'elegant mature hairstyle, sophisticated professional makeup, mature woman look, no earrings';
      case 40: return 'mature hairstyle, mostly dark hair, elegant light makeup, no earrings';
      case 50: return 'mature hairstyle with prominent gray and silver streaks, visible aging on face, no earrings, no makeup hiding wrinkles';
      case 60: return 'silver-gray elderly hairstyle, mostly gray hair, aged face with wrinkles clearly visible, no earrings';
      default: return 'neat hairstyle, no earrings';
    }
  }

  switch (snapped) {
    case 30: return 'neat dark hair, completely clean-shaven, mature professional look'; // 구 35세 남자 헤어스타일
    case 40: return 'neat dark hair, mature look, clean-shaven'; // 구 45세 (흰머리 방지)
    case 50: return 'salt-and-pepper hair, gray temples, visible forehead lines, mature masculine'; // 구 55세
    case 60: return 'mostly gray or silver hair, gray beard stubble optional, weathered mature face, distinguished elder'; // 구 65세
    default: return 'neat groomed hair';
  }
};
