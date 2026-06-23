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
  // 25살 ─────────────────────────────────────────────────────────────────────
  // 완벽히 매끈한 피부, 통통한 볼, 주름 없음
  25: [
    'looks exactly 25 years old',
    'perfectly smooth flawless skin with absolutely no wrinkles',
    'plump full cheeks with youthful volume',
    'bright wide eyes with smooth firm under-eye skin',
    'sharp defined jawline',
    'fresh radiant glass skin complexion',
    'very energetic youthful appearance, looks like a university student',
  ].join(', '),

  // 35살 ─────────────────────────────────────────────────────────────────────
  // 한국인 35세 = 25세처럼 보이는 경우 많음. 자연스러운 성숙함만
  35: [
    'looks exactly 35 years old',
    'smooth healthy skin, barely any visible lines',
    'only the faintest hint of smile lines at far outer eye corners, almost invisible',
    'nasolabial folds NOT visible',
    'excellent skin elasticity, well-maintained appearance',
    'confident professional look, still looks very youthful',
    'vibrant healthy complexion, full cheeks',
    'dark hair, naturally neat and groomed',
  ].join(', '),

  // 45살 ─────────────────────────────────────────────────────────────────────
  // 핵심 수정: 주름 거의 없음. 한국 45세는 서양인 35세 수준으로 보임
  // "noticeable wrinkles" 완전 삭제 → 성숙함은 눈빛과 표정으로만 표현
  45: [
    'looks exactly 45 years old',
    'healthy mature Korean appearance, looks younger than actual age',
    'smooth well-maintained skin with very minimal lines',
    'only barely visible fine lines at outer eye corners when smiling, NOT prominent',
    'nasolabial folds very subtle and faint',
    'full healthy cheeks, good skin elasticity',
    'mostly dark hair with just a couple natural gray strands at temples',
    'confident distinguished mature look, very active and healthy, NOT middle-aged looking',
  ].join(', '),

  // 55살 ─────────────────────────────────────────────────────────────────────
  // 자연스러운 노화, 건강하고 활기찬 모습. 서양인 45세 수준으로 보임
  55: [
    'looks exactly 55 years old',
    'naturally aged but vibrant healthy Korean appearance',
    'light crow\'s feet lines at outer eye corners only, subtle not deep',
    'gentle smile lines from nose corners, mild not extreme',
    'healthy skin with natural mature texture, NOT sagging',
    'salt-and-pepper hair (dark base with some visible gray), well-styled',
    'fit active 55-year-old, full of vitality, looks 10 years younger than age',
    'wise confident smile, absolutely NOT frail or elderly-looking',
  ].join(', '),

  // 65살 ─────────────────────────────────────────────────────────────────────
  // 한국인 특유의 품위 있는 노화. 서양인 55세 수준으로 보임
  65: [
    'looks exactly 65 years old',
    'graceful dignified Korean aging, healthy and distinguished',
    'moderate natural wrinkles around eyes and smile area only, NOT deep creases',
    'gentle relaxed facial contour, skin slightly softer but NOT heavily sagging',
    'silver-gray well-groomed hair, neatly styled with dignity',
    'warm healthy skin tone, natural mature Korean complexion',
    'kind wise expression, active and healthy elder',
    'distinguished respected 65-year-old, looks energetic and well, NOT frail',
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
  // 운동선수: 트로피·메달이 가장 상징적
  '운동선수':
    'wearing a professional Korean national sports team competition uniform with bold team colors and logo, ' +
    'holding a gold trophy or championship medal proudly in both hands, ' +
    'standing in a large packed stadium with floodlights and crowd in background, ' +
    'victorious champion pose, athletic confident expression',

  // 의사: 청진기 목에 걸고 + 흰 가운이 핵심 식별자
  '의사':
    'wearing a clean crisp white doctor coat with hospital name badge pinned on chest, ' +
    'stethoscope clearly hanging around neck — the most important visual identifier, ' +
    'holding a patient medical chart or clipboard in one hand, ' +
    'standing in a bright modern Korean hospital room with medical equipment visible, ' +
    'professional trusted doctor expression',

  // 유튜버: 카메라 앞에서 촬영 중인 모습
  '유튜버':
    'wearing trendy Korean streetwear or casual creator outfit, ' +
    'sitting in front of a professional camera on tripod, large LED ring light illuminating face, ' +
    'professional condenser microphone on desk stand beside them, ' +
    'multiple monitors with video editing software visible in background, ' +
    'energetic engaging creator expression, pointing or gesturing to camera',

  // 선생님: 칠판 앞에서 분필/마커 들고 수업하는 모습
  '선생님':
    'wearing neat professional Korean business casual attire, ' +
    'standing at the front of a Korean classroom, pointing at a chalkboard or whiteboard behind them, ' +
    'holding a piece of chalk or dry-erase marker in raised hand, ' +
    'open textbook on teacher\'s desk visible, students\' desks in background, ' +
    'warm authoritative teacher expression',

  // 요리사: 높은 요리사 모자 + 주방칼이 핵심
  '요리사':
    'wearing a pristine white double-breasted chef jacket with tall white toque chef\'s hat on head, ' +
    'holding a professional chef\'s knife firmly in right hand — key visual identifier, ' +
    'standing at a professional stainless steel kitchen counter with mise en place ingredients, ' +
    'restaurant kitchen with flames and equipment visible in background, ' +
    'proud accomplished master chef expression',

  // 경찰관: 경찰 모자 + 배지가 핵심
  '경찰관':
    'wearing full formal Korean police officer uniform in navy blue, ' +
    'official police cap with gold badge prominently on head — key identifier, ' +
    'large silver police badge clearly displayed on chest, handcuffs on belt, ' +
    'standing upright with hands clasped behind back or on duty belt, ' +
    'Korean police station or urban street background, authoritative protective expression',

  // 프로게이머: 팀 유니폼 + 헤드셋이 핵심
  '프로게이머':
    'wearing a professional Korean esports team jersey with bold team logo and sponsor patches, ' +
    'wearing a high-end gaming headset with mic boom clearly visible — key identifier, ' +
    'seated at a competition gaming desk with mechanical keyboard and gaming mouse, ' +
    'multiple large gaming monitors glowing in background, esports arena stage lighting, ' +
    'intense focused champion expression',

  // 가수: 마이크 들고 + 무대 조명이 핵심
  '가수':
    'wearing a glamorous Korean idol or performer stage outfit with bold styling, ' +
    'holding a professional wireless microphone raised up near mouth — key identifier, ' +
    'performing on a large concert stage with dramatic colorful spotlights shining down, ' +
    'large audience visible in background, confetti or smoke effects, ' +
    'charismatic passionate performing expression',

  // 과학자: 시험관 + 고글이 핵심
  '과학자':
    'wearing a white lab coat with name badge, safety goggles pushed up on forehead, ' +
    'holding a glowing test tube or laboratory flask in one hand — key identifier, ' +
    'standing in a modern research laboratory with sophisticated equipment: centrifuges, microscopes, computers, ' +
    'shelves of chemical bottles and scientific instruments in background, ' +
    'intellectually focused analytical expression',

  // 소방관: 소방 헬멧 + 소방복 반사 줄이 핵심
  '소방관':
    'wearing full official Korean firefighter turnout gear with bright orange-red jacket and reflective silver stripes, ' +
    'wearing a yellow or white firefighter helmet on head — key identifier, ' +
    'holding a fire axe in one hand or gripping a large fire hose, ' +
    'standing in front of a red Korean fire engine with 소방차 text visible, ' +
    'brave heroic determined expression',

  // 간호사: 청진기 + 주사기 or 약통이 핵심
  '간호사':
    'wearing a professional Korean nurse uniform in white or light blue scrubs with name badge, ' +
    'stethoscope around neck and holding a syringe or medication tray in hand — key identifiers, ' +
    'standing in a modern Korean hospital corridor with patient rooms visible, ' +
    'medical monitoring equipment and IV stand in background, ' +
    'compassionate caring professional expression',

  // 판사: 판사봉(gavel)을 손에 들고 법복 착용 — 사용자가 특별 요청
  '판사':
    'wearing a formal black Korean judicial robe (법복) with official court emblem, ' +
    'holding a wooden gavel raised in right hand — THE most important visual identifier, ' +
    'seated behind an elevated wooden judicial bench in a Korean courtroom, ' +
    'Korean national emblem on wall, legal books and nameplate on bench visible, ' +
    'highly authoritative wise composed expression',

  // 변호사: 법률 서류 + 서류가방이 핵심
  '변호사':
    'wearing a sharp well-fitted dark navy or charcoal business suit with tie, ' +
    'holding a thick stack of legal documents or case files in one arm — key identifier, ' +
    'carrying a professional leather briefcase in other hand, ' +
    'standing in a prestigious Korean law office with floor-to-ceiling legal bookshelves, ' +
    'confident commanding sharp professional expression',

  // 수의사: 동물 안고 + 청진기가 핵심
  '수의사':
    'wearing teal or green medical scrubs with a white veterinary coat and name badge, ' +
    'gently cradling a small fluffy puppy against chest — key visual identifier, ' +
    'stethoscope around neck, exam table with medical tools visible, ' +
    'bright modern Korean veterinary clinic with animal cages in background, ' +
    'warm gentle caring professional smile',

  // 파일럿: 4줄 견장 + 파일럿 모자가 핵심
  '파일럿':
    'wearing a formal Korean airline captain uniform in dark navy, ' +
    'captain\'s hat with gold wings badge prominently on head — key identifier, ' +
    'four gold stripes epaulettes clearly visible on shoulders, ' +
    'pilot wings badge pinned on chest, standing in front of airplane cockpit or jet bridge, ' +
    'authoritative calm professional pilot expression',

  // 건축가: 건축 도면 + 안전모가 핵심
  '건축가':
    'wearing a white hard hat on head and bright orange safety vest — key identifiers, ' +
    'holding large rolled-up architectural blueprints in both hands, ' +
    'standing at a modern Korean construction site or architectural firm office, ' +
    'scale models and CAD drawings visible on desk in background, ' +
    'visionary creative professional expression',

  // 디자이너: 태블릿 + 스타일리시한 옷이 핵심
  '디자이너':
    'wearing stylish trendy Korean fashion or creative professional outfit with distinctive accessories, ' +
    'holding a professional digital drawing tablet with stylus pen in hand — key identifier, ' +
    'large monitor showing colorful graphic design or UI work in background, ' +
    'sitting in a sleek modern creative studio with mood board and design samples on wall, ' +
    'creative inspired imaginative expression',

  // 작가: 만년필 + 원고지/책이 핵심
  '작가':
    'wearing comfortable sophisticated casual literary clothing, ' +
    'holding a fountain pen poised over an open manuscript on a wooden writing desk — key identifier, ' +
    'surrounded by tall bookshelves packed with Korean and world literature books, ' +
    'reading glasses resting on desk, coffee mug and papers visible, warm lamp lighting, ' +
    'deeply thoughtful introspective creative expression',
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
