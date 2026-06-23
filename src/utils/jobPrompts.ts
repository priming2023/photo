/**
 * 나이대별 정밀 시각 묘사
 *
 * 심리학·의학적 노화 연구 기반:
 * - 피부 텍스처, 주름 위치, 모발 변화, 눈·입 주변 변화를 구체적으로 묘사
 * - 한국인 노화 특성을 반영 (피부톤, 얼굴 윤곽)
 */
export const AGE_DESCRIPTORS: Record<number, string> = {
  25: [
    'looks exactly 25 years old',
    'smooth youthful skin with no wrinkles',
    'bright clear eyes with tight under-eye area',
    'firm jawline and cheeks',
    'natural healthy complexion',
    'energetic and fresh appearance',
  ].join(', '),

  35: [
    'looks exactly 35 years old',
    'mature adult face with subtle early fine lines at outer eye corners',
    'slightly more defined nasolabial folds',
    'confident professional expression',
    'fuller more defined facial features',
    'natural mature skin with slight texture',
  ].join(', '),

  45: [
    'looks exactly 45 years old',
    'middle-aged face with visible crow\'s feet wrinkles around eyes',
    'moderate nasolabial folds from nose to mouth corners',
    'distinguished mature appearance',
    'a few natural gray hairs at the temples',
    'slight loosening of the jaw contour',
    'experienced wise expression',
  ].join(', '),

  55: [
    'looks exactly 55 years old',
    'prominent facial wrinkles especially around eyes and forehead',
    'deep nasolabial folds and marionette lines',
    'silver-gray streaks throughout the hair',
    'noticeable skin texture and age spots',
    'slight facial sagging at cheeks and jaw',
    'wise dignified demeanor',
  ].join(', '),

  65: [
    'looks exactly 65 years old',
    'deep facial wrinkles across forehead and around eyes and mouth',
    'mostly white or silver hair',
    'significant facial sagging at cheeks and neck',
    'visible age spots and mature skin texture',
    'kind wise elder expression',
    'distinguished elderly appearance',
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

// ─── 직업별 의상·소품·배경 ──────────────────────────────────────────────────
export const JOB_PROMPTS: Record<string, string> = {
  '운동선수':
    'wearing a professional sports team jersey and athletic gear, ' +
    'standing confidently in a large stadium with crowd in background, ' +
    'holding a sports ball, stadium floodlights visible',
  '의사':
    'wearing a crisp white doctor coat with name badge and stethoscope around neck, ' +
    'standing in a bright modern hospital room with medical equipment visible, ' +
    'holding a medical chart, professional confident posture',
  '유튜버':
    'wearing trendy casual streetwear, sitting in a professional creator studio setup, ' +
    'ring light visible, microphone nearby, colorful RGB lighting in background, ' +
    'multiple monitors visible, relaxed confident creator pose',
  '선생님':
    'wearing neat smart casual professional attire, ' +
    'standing in front of a classroom with green chalkboard covered in writing, ' +
    'holding an open textbook, warm encouraging expression',
  '요리사':
    'wearing a pristine white double-breasted chef uniform with tall chef\'s toque hat, ' +
    'standing in a professional restaurant kitchen with stainless steel countertops, ' +
    'holding cooking utensils, proud accomplished expression',
  '경찰관':
    'wearing a professional police officer uniform with badge and rank insignia, ' +
    'standing on a city street with police car visible in background, ' +
    'authoritative protective posture, serious expression',
  '프로게이머':
    'wearing a professional esports team jersey with team logo, ' +
    'sitting in a gaming setup with multiple RGB monitors, ' +
    'wearing a high-end gaming headset, focused competitive expression',
  '가수':
    'wearing a glamorous stage performance outfit, ' +
    'holding a professional microphone on a concert stage, ' +
    'dramatic concert lighting with spotlights and crowd visible behind, ' +
    'energetic performing expression',
  '과학자':
    'wearing a white lab coat with safety goggles pushed up on forehead, ' +
    'standing in a modern research laboratory with equipment visible, ' +
    'holding a glowing chemical flask, intelligent focused expression',
  '소방관':
    'wearing a full firefighter turnout gear with reflective stripes and helmet, ' +
    'standing in front of a red fire truck, ' +
    'brave protective posture, determined expression',
  '간호사':
    'wearing a professional nursing uniform with stethoscope, ' +
    'standing in a hospital corridor with medical equipment visible, ' +
    'holding a digital tablet and medical clipboard, caring expression',
  '판사':
    'wearing a formal black judicial robe with white collar, ' +
    'sitting behind a wooden bench in a courtroom, ' +
    'holding a wooden gavel, authoritative wise expression',
  '변호사':
    'wearing a sharp tailored business suit, ' +
    'standing in a prestigious modern law office with bookshelves, ' +
    'holding legal documents and a pen, confident professional expression',
  '수의사':
    'wearing medical scrubs and a white veterinary coat, ' +
    'in a bright clean animal clinic, ' +
    'gently cradling a healthy puppy, warm caring smile',
  '파일럿':
    'wearing a professional airline pilot uniform with captain\'s hat and wings badge, ' +
    'standing in an airplane cockpit with instrument panels visible, ' +
    'authoritative confident pilot stance',
  '건축가':
    'wearing professional smart casual work attire with a safety vest, ' +
    'standing on a construction site or modern office, ' +
    'holding large architectural blueprints and a measuring tool, ' +
    'creative visionary expression',
  '디자이너':
    'wearing stylish contemporary fashion clothes, ' +
    'sitting in a sleek creative design studio, ' +
    'holding a professional digital drawing tablet with design work visible on screen, ' +
    'creative inspired expression',
  '작가':
    'wearing comfortable literary-style clothing, ' +
    'sitting at an elegant wooden writing desk with vintage typewriter and books, ' +
    'surrounded by bookshelves, thoughtful creative expression',
};

// ─── 공통 네거티브 프롬프트 ───────────────────────────────────────────────────
export const NEGATIVE_PROMPT = [
  'bad quality, worst quality, blurry, out of focus',
  'deformed face, disfigured, distorted features, melting face',
  'extra limbs, extra fingers, missing fingers, wrong anatomy',
  'text, watermark, signature, logo, caption',
  'cartoon, anime, illustration, painting, drawing, art',
  'wrong age, baby face on adult, childlike features',
  'multiple people, duplicate person',
  'ugly, gross, disgusting',
].join(', ');

// ─── 프롬프트 생성 함수 ──────────────────────────────────────────────────────

/**
 * flux-pro/kontext 용 (이미지 편집 명령 형식)
 * - 이미지를 직접 편집하는 모델이므로 "이렇게 변환해줘" 형식으로 작성
 */
export const buildKontextPrompt = (
  job: string,
  ageStr: string,
  gender: string,
): string => {
  const age = parseAgeNumber(ageStr);
  const ageDesc = getAgeDescriptor(ageStr);
  const genderKo = gender === '남자' ? '남성' : '여성';
  const genderEng = gender === '남자' ? 'man' : 'woman';
  const jobDetail = JOB_PROMPTS[job] ?? 'wearing professional work attire in a matching workplace';

  return [
    `Transform this ${genderKo} person in the photo to look like a ${age}-year-old Korean ${genderEng}.`,
    `Age transformation: ${ageDesc}.`,
    `Occupation transformation: ${jobDetail}.`,
    'Keep the exact same facial identity, bone structure, eye shape, nose, and face proportions.',
    'Only change: age-related features (wrinkles, hair color, skin texture) and outfit/background.',
    'Photorealistic, professional portrait photography, sharp focus, studio-quality lighting.',
  ].join(' ');
};

/**
 * flux-pulid 용 (얼굴 보존 모델)
 * - reference_image_url의 얼굴을 유지하면서 새 장면을 생성
 */
export const buildPulidPrompt = (
  job: string,
  ageStr: string,
  gender: string,
): string => {
  const age = parseAgeNumber(ageStr);
  const ageDesc = getAgeDescriptor(ageStr);
  const genderEng = gender === '남자' ? 'man' : 'woman';
  const jobDetail = JOB_PROMPTS[job] ?? 'wearing professional work attire';

  return [
    `Professional portrait photograph of a ${age}-year-old Korean ${genderEng},`,
    `same person as the reference image — identical facial identity, eyes, nose, and face structure.`,
    `Age appearance: ${ageDesc}.`,
    `${jobDetail}.`,
    'Upper body portrait, looking directly at camera.',
    'Photorealistic, high detail, cinematic studio lighting, sharp focus on face.',
  ].join(' ');
};
