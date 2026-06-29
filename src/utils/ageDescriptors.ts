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
  25: 'looks exactly 25 years old, young adult Korean woman, smooth firm skin, sharp clean jawline, vibrant bright eyes, flawless complexion, youthful professional',
  35: 'looks exactly 35 years old, mature Korean woman in her mid-thirties, well-defined facial structure, complete loss of teenage baby fat, elegant mature face, sophisticated professional look NOT in 20s',
  45: 'looks exactly 45 years old, middle-aged Korean woman in her mid-forties, visible fine lines around eyes, natural nasolabial folds, slight loss of skin elasticity, mature skin',
  55: 'looks exactly 55 years old, older middle-aged Korean woman, prominent crow\'s feet and smile lines, visible skin aging, salt-and-pepper hair, realistic mature skin texture, no baby fat',
  65: 'looks exactly 65 years old, dignified elderly Korean woman, natural deep wrinkles, pronounced nasolabial folds, realistic aged skin texture, mostly silver or gray hair, wise calm expression'
};

const MALE_AGE_DESCRIPTORS: Record<number, string> = {
  25: 'looks exactly 25 to 29 years old, fully grown adult Korean man NOT a child, complete loss of baby fat, strong masculine sharp jawline, handsome energetic professional, adult facial proportions',
  35: 'looks exactly 35 to 39 years old, mature Korean man, well-defined masculine facial structure, rugged handsome adult, subtle signs of mature age, confident professional',
  45: 'looks exactly 45 to 49 years old, middle-aged Korean man, visible crow\'s feet, prominent nasolabial folds, slight loss of skin elasticity, masculine mature face, experienced look',
  55: 'looks exactly 50 to 54 years old, early fifties Korean man, natural expression lines on forehead, slight graying at temples, mature and dignified',
  65: 'looks exactly 60 to 64 years old, early sixties Korean man, visible natural wrinkles, realistic mature skin texture, salt-and-pepper hair, distinguished senior'
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
  25: { id_weight: 0.85, start_step: 3, guidance_scale: 4.5 },
  35: { id_weight: 0.90, start_step: 2, guidance_scale: 4.0 },
  45: { id_weight: 0.80, start_step: 3, guidance_scale: 4.4 },
  55: { id_weight: 0.78, start_step: 3, guidance_scale: 4.2 }, // 55세 덜 늙게 (id_weight 약간 상향, guidance 하향)
  65: { id_weight: 0.68, start_step: 4, guidance_scale: 4.4 }, // 65세 덜 늙게 (id_weight 약간 상향, guidance 하향)
};

export const getPulidParams = (ageStr: string, gender: string): PulidParams => {
  const snapped = snapAge(parseAgeNumber(ageStr));
  const table = gender === '여자' ? FEMALE_PARAMS : MALE_PARAMS;
  return table[snapped] ?? { id_weight: 0.90, start_step: 3, guidance_scale: 3.5 };
};

const snapAge = (age: number): number => {
  if (age < 30) return 25;
  if (age < 40) return 35;
  if (age < 50) return 45;
  if (age < 60) return 55;
  return 65;
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
    // 여자는 너무 어려보이는 경향 방어
    if (age >= 35) tooYoung = 'looks 20s, college student, teenage, baby face, chubby cheeks, overly youthful';
    if (age >= 45) tooYoung += ', looks 30s, flawless skin, no wrinkles';
  } else {
    // 남자는 너무 어려보이는 경향을 아주 강력하게 방어
    if (age >= 25) tooYoung = 'looks like a teenager, boy, child, kid, baby face, high school student, chubby cheeks, youthful';
    if (age >= 35) tooYoung += ', looks 20s, college student, young boy, youth';
    if (age >= 45) tooYoung += ', looks 30s, youthful skin, no wrinkles, smooth face';
    if (age >= 55) tooYoung += ', looks 40s, dark hair only';
    
    // 남자는 너무 늙어보이는 경향 방어 완화 (제 나이 찾기)
    if (age <= 25) tooOld = 'looks 50s, deep wrinkles, white hair, elderly'; // 25세 남자는 40대라는 부정프롬프트를 없애서 실수로 아이가 되는 현상 방어
    else if (age <= 35) tooOld = 'looks 60s, completely white hair, elderly';
    else if (age <= 45) tooOld = 'looks 70s, very deep wrinkles, completely white hair';
    else if (age <= 55) tooOld = 'looks 80s, extremely old, frail, decrepit';
  }

  let result = NEGATIVE_BASE;

  if (age <= 30) {
    result += ', wrinkles, gray hair, aged skin, middle-aged';
  } else if (age <= 40) {
    result += ', heavy wrinkles, gray hair, elderly appearance, child, baby face';
  } else if (age <= 50) {
    result += ', elderly, deep wrinkles, mostly white hair, child, kid';
  } else if (age <= 60) {
    result += ', extremely old 80 years, frail, child, kid';
  } else {
    result += ', extremely old 90 years, decrepit, child, kid';
  }

  if (tooYoung) result += ', ' + tooYoung;
  if (tooOld) result += ', ' + tooOld;
  if (eyewearNegative) result += ', ' + eyewearNegative;

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
      case 35: return 'elegant mature hairstyle, sophisticated professional makeup, mature woman look, no earrings';
      case 45: return 'mature hairstyle, mostly dark hair, elegant light makeup, no earrings';
      case 55: return 'mature hairstyle with prominent gray and silver streaks, visible aging on face, no earrings, no makeup hiding wrinkles';
      case 65: return 'silver-gray elderly hairstyle, mostly gray hair, aged face with wrinkles clearly visible, no earrings';
      default: return 'neat hairstyle, no earrings';
    }
  }

  switch (snapped) {
    case 25: return 'neat dark hair, clean-shaven, no baby fat, mature adult face'; // clean-shaven 추가, 과도한 masculine 제거
    case 35: return 'neat dark hair, mature professional look, light stubble allowed, masculine features'; 
    case 45: return 'mostly dark hair, gray strands at temples, mature look, masculine facial hair allowed'; 
    case 55: return 'salt-and-pepper hair, gray temples, visible forehead lines, mature masculine, skin aging';
    case 65: return 'mostly gray or silver hair, weathered mature face, distinguished elder, facial wrinkles';
    default: return 'neat groomed hair';
  }
};
