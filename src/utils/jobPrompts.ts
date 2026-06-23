/**
 * 한국인 나이·직업별 AI 변환 프롬프트
 *
 * 연구 기반:
 * - LG H&H 한국 여성 1.6만명 AI 얼굴 노화 분석 (Journal of Investigative Dermatology)
 * - 한국인은 피부 관리 문화로 서양인보다 5~7세 젊어 보이는 경향
 * - 50세 이전: 눈가 처짐·잔주름 주도적, 50세 이후: 입술 주변·볼 탄력 감소 추가
 * - 직업별 한국 현지화: 한국 병원/경찰/항공사 등 실제 한국 환경 반영
 */

// ─── 나이별 시각 묘사 ────────────────────────────────────────────────────────
// 핵심 원칙:
//   1. 한국인 노화 실제 속도에 맞춤 (과노화 금지)
//   2. "healthy", "vibrant", "well-maintained" 키워드로 한국인 특유의 젊은 외모 보존
//   3. 연령대별 주요 변화 부위(눈가 → 입술·볼) 순서 반영
export const AGE_DESCRIPTORS: Record<number, string> = {
  // 25살 ──────────────────────────────────────────────────────────────────────
  // 탄력 피부, 볼 볼륨, 주름 전혀 없음, 활기찬 표정
  25: [
    'looks 25 years old',
    'perfectly smooth clear skin with zero wrinkles or lines',
    'plump youthful cheeks with natural volume',
    'bright alert eyes with firm under-eye area',
    'firm defined jawline',
    'fresh glowing healthy complexion',
    'energetic youthful appearance',
  ].join(', '),

  // 35살 ──────────────────────────────────────────────────────────────────────
  // LG H&H 연구: 30대 후반부터 눈가 잔주름 시작
  // 한국인: 피부 관리로 아직 매우 젊어 보임, 자연스러운 성숙함
  35: [
    'looks 35 years old',
    'healthy mature skin with minimal fine lines',
    'very subtle smile lines at outer eye corners only',
    'slightly refined nasolabial folds just barely visible',
    'well-maintained skin with good elasticity',
    'confident natural professional look',
    'vibrant healthy complexion, still very youthful',
    'mostly dark hair, naturally well-groomed',
  ].join(', '),

  // 45살 ──────────────────────────────────────────────────────────────────────
  // 눈가 주름 뚜렷, 팔자주름 시작, 관자놀이 흰머리 조금
  // 한국 45세: 여전히 활기차고 건강해 보이는 중년
  45: [
    'looks 45 years old',
    'natural middle-aged Korean appearance',
    'noticeable crow\'s feet wrinkles at outer eye corners',
    'gentle smile lines from nose to mouth corners (moderate only)',
    'slight puffiness or relaxation under the eyes',
    'healthy mature skin with natural texture',
    'mostly dark hair with a few natural gray hairs at temples',
    'confident distinguished middle-aged look, active and healthy',
  ].join(', '),

  // 55살 ──────────────────────────────────────────────────────────────────────
  // LG H&H: 50세 이후 입술 주변 변화 + 볼 탄력 감소
  // 중요: 한국인 55세는 건강하고 활기차 보임 - 80세처럼 보이면 안됨
  55: [
    'looks 55 years old',
    'naturally aged but healthy vibrant Korean appearance',
    'visible crow\'s feet and forehead lines, natural not extreme',
    'moderate nasolabial folds and slight lip corner lines',
    'mild skin laxity at cheeks, NOT heavily sagging',
    'salt-and-pepper hair (mostly dark with visible gray strands), well-groomed',
    'dignified healthy active 55-year-old, looks fit and well',
    'wise confident expression, NOT elderly or frail looking',
  ].join(', '),

  // 65살 ──────────────────────────────────────────────────────────────────────
  // 뚜렷하나 한국인답게 품위 있는 노화, 과도한 노화 묘사 절대 금지
  65: [
    'looks 65 years old',
    'graceful natural aging, healthy dignified Korean elder',
    'clear but moderate wrinkles around eyes and mouth (not deep crevices)',
    'relaxed facial contour with gentle skin laxity, NOT heavily sagging',
    'silver-gray or mostly gray well-kept hair, neatly styled',
    'warm healthy skin tone maintained, natural mature complexion',
    'kind wise elder expression, active healthy appearance',
    'distinguished 65-year-old, looks healthy and well, NOT frail or very elderly',
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

// ─── 직업별 의상·소품·배경 (한국 현지화) ───────────────────────────────────
// 핵심 원칙:
//   1. 한국 실제 환경 반영 (한국 병원·경찰복·항공사 스타일)
//   2. 단정함(danjeongham) - 한국 직장 문화의 핵심 가치
//   3. 배경을 구체적으로 묘사해 장면의 현실감 높임
export const JOB_PROMPTS: Record<string, string> = {
  '운동선수':
    'wearing a professional Korean sports team uniform with national colors, ' +
    'athletic training gear or competition jersey with team logo, ' +
    'standing in a modern indoor sports facility or stadium, ' +
    'confident athletic posture, holding sport-specific equipment',

  '의사':
    'wearing a clean pressed white doctor coat with hospital name badge and stethoscope, ' +
    'standing in a bright modern Korean hospital room or medical office, ' +
    'clinical background with medical equipment visible, ' +
    'professional confident posture, holding a medical chart or digital tablet',

  '유튜버':
    'wearing trendy contemporary Korean casual streetwear, ' +
    'sitting in a well-lit Korean creator studio with professional LED ring lights, ' +
    'microphone and camera equipment visible, ' +
    'modern desktop setup in background, relaxed confident creator expression',

  '선생님':
    'wearing neat smart professional Korean business casual attire, ' +
    'standing at the front of a Korean classroom with a chalkboard or whiteboard, ' +
    'Korean school setting visible in background, ' +
    'holding a textbook or lesson materials, warm encouraging expression',

  '요리사':
    'wearing a pristine white Korean chef uniform with double-breasted jacket and chef\'s toque hat, ' +
    'standing in a professional restaurant kitchen with stainless steel countertops and equipment, ' +
    'holding cooking utensils or a prepared dish, ' +
    'proud accomplished chef expression',

  '경찰관':
    'wearing a formal Korean police officer uniform in navy blue with official badge and rank insignia, ' +
    'standing in an urban Korean city setting or police station background, ' +
    'authoritative composed posture, ' +
    'professional Korean law enforcement appearance',

  '프로게이머':
    'wearing a professional Korean esports team jersey with team logo and sponsor patches, ' +
    'sitting at a top-tier Korean esports gaming setup with multiple monitors, ' +
    'wearing a gaming headset, ' +
    'intense focused competitive expression, esports arena atmosphere',

  '가수':
    'wearing a stylish Korean stage performance outfit or idol-style fashion, ' +
    'holding a professional microphone on a concert stage, ' +
    'dramatic Korean concert lighting with colorful spotlights and audience visible, ' +
    'charismatic energetic performing expression',

  '과학자':
    'wearing a white lab coat with safety goggles on forehead and ID badge, ' +
    'standing in a modern Korean research laboratory, ' +
    'scientific equipment and computers visible in background, ' +
    'holding a clipboard or scientific equipment, focused intelligent expression',

  '소방관':
    'wearing official Korean firefighter protective gear with reflective stripes and Korean 소방청 insignia, ' +
    'standing in front of a Korean red fire engine, ' +
    'full safety equipment including helmet, ' +
    'brave determined protective expression',

  '간호사':
    'wearing a professional Korean nurse uniform with nursing cap or neat scrubs, ' +
    'stethoscope visible, standing in a modern Korean hospital corridor, ' +
    'medical equipment and patient rooms visible in background, ' +
    'caring professional expression, holding medical tablet or clipboard',

  '판사':
    'wearing a formal black Korean judicial robe with official court insignia, ' +
    'seated behind a traditional wooden judicial bench in a Korean courtroom, ' +
    'Korean court setting visible, holding a wooden gavel, ' +
    'authoritative wise composed expression',

  '변호사':
    'wearing a sharp tailored dark business suit, ' +
    'standing in a prestigious modern Korean law office with legal books and documents, ' +
    'professional briefcase or legal documents visible, ' +
    'confident commanding professional expression',

  '수의사':
    'wearing medical scrubs and a white veterinary coat with name badge, ' +
    'in a bright modern Korean animal clinic or hospital, ' +
    'gently examining or cradling a healthy animal (puppy or kitten), ' +
    'warm caring professional smile',

  '파일럿':
    'wearing a formal Korean airline pilot captain uniform with four-stripe epaulettes and captain\'s hat, ' +
    'Korean Air or Asiana style navy uniform with wings badge, ' +
    'standing confidently in or near a cockpit, ' +
    'authoritative professional pilot stance',

  '건축가':
    'wearing smart professional attire with optional safety vest, ' +
    'standing at a modern Korean architectural office or construction site, ' +
    'holding large architectural blueprints or using design software on a laptop, ' +
    'creative visionary professional expression',

  '디자이너':
    'wearing stylish contemporary Korean fashion or creative professional attire, ' +
    'sitting in a sleek modern Korean creative design studio, ' +
    'professional design work visible on large monitor screens, ' +
    'holding a digital drawing tablet, creative inspired expression',

  '작가':
    'wearing comfortable sophisticated casual clothing, ' +
    'seated at an elegant writing desk in a cozy Korean literary setting, ' +
    'surrounded by bookshelves with Korean and international books, ' +
    'holding a pen or looking thoughtfully at manuscript, focused creative expression',
};

// ─── 공통 네거티브 프롬프트 ───────────────────────────────────────────────────
export const NEGATIVE_PROMPT = [
  'bad quality, worst quality, low resolution, blurry, out of focus, grainy',
  'deformed face, disfigured, distorted features, melting face, asymmetrical face',
  'extra limbs, extra fingers, missing fingers, wrong anatomy, malformed hands',
  'text, watermark, signature, logo, caption, subtitles',
  'cartoon, anime, illustration, painting, drawing, 2D art, comic style',
  'wrong age, baby face on adult body, childlike features on mature person',
  'multiple people, duplicate faces, cloned appearance',
  'western caucasian facial features (must look Korean)',
  'overly processed plastic surgery appearance',
  'overly aged, excessively wrinkled, frail elderly, 80 years old appearance',
  'poorly lit, harsh shadows, overexposed, underexposed',
].join(', ');

// ─── 프롬프트 생성 함수 ──────────────────────────────────────────────────────

/**
 * flux-pulid 전용 프롬프트 빌더
 *
 * 구성:
 *  1. 기본 정체성 (한국인, 성별, 얼굴 보존)
 *  2. 나이별 정밀 묘사
 *  3. 직업별 복장·배경
 *  4. 사진 품질 지시어
 */
export const buildPulidPrompt = (
  job: string,
  ageStr: string,
  gender: string,
): string => {
  const age = parseAgeNumber(ageStr);
  const ageDesc = getAgeDescriptor(ageStr);
  const genderEng = gender === '남자' ? 'man' : 'woman';
  const jobDetail = JOB_PROMPTS[job] ?? 'wearing professional work attire in a matching workplace environment';

  return [
    // 1. 정체성: 한국인, 성별, 얼굴 보존 명시
    `Professional portrait of a ${age}-year-old Korean ${genderEng},`,
    `same person as the reference image with identical facial identity, eyes, nose, face shape preserved.`,
    // 2. 동아시아 외모 명시 (서양 얼굴 생성 방지)
    `East Asian Korean facial features, warm olive skin tone, natural Asian appearance.`,
    // 3. 나이별 정밀 묘사
    `Age: ${ageDesc}.`,
    // 4. 직업 복장·배경
    `${jobDetail}.`,
    // 5. 촬영 스타일 (인물 사진 전문 품질)
    `Upper body portrait, looking directly at camera, natural soft portrait lighting,`,
    `photorealistic Korean portrait photography, sharp focus on face, high detail, professional studio quality.`,
  ].join(' ');
};
