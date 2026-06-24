/**
 * 직업별 AI 변환 프롬프트 (한국 현지화)
 *
 * E방안 최적화 원칙:
 * 1. 머리/이마 레벨 소품 최우선: 모자·고글·헤드셋 등 "항상 보이는" 아이템
 * 2. 목/가슴 레벨 소품 차선: 청진기·배지·넥타이 등 상반신 타이트 크롭에서 보임
 * 3. 직업별 특징적 조명: AI가 장면 분위기를 강하게 반영
 * 4. 특징적 자세: 상반신 중심의 포즈 명시
 * 5. 배경은 어깨 너머로 흐릿하게만 → 얼굴/소품에 집중
 */
export const JOB_PROMPTS: Record<string, string> = {
  // 운동선수 ─────────────────────────────────────────────────────────────────
  // 자료: 종목 모호성 방지 → 축구 국가대표로 구체화, 메달(목)+저지(가슴)
  '운동선수':
    'wearing an official Korean national football team jersey in red with bold team crest on chest, ' +
    'gold championship medal on a ribbon hanging prominently around neck — key neck-level identifier, ' +
    'athletic muscular build, victorious pose with head held high, ' +
    'dramatic stadium floodlights shining down onto face, packed cheering stadium crowd softly blurred behind, ' +
    'triumphant confident champion expression',

  // 의사 ────────────────────────────────────────────────────────────────────
  // E방안: 청진기 목에 걸림 → 목 레벨 핵심, 흰 가운 깃 → 어깨 레벨
  '의사':
    'wearing a clean crisp white doctor coat with hospital badge clearly pinned on chest, ' +
    'stethoscope draped around neck and hanging over chest — THE most important neck-level identifier, ' +
    'holding a medical chart raised at chest level in one hand, leaning slightly forward attentively, ' +
    'bright clean clinical hospital white lighting on face, blurred Korean hospital corridor background, ' +
    'professional compassionate trusted doctor expression',

  // 유튜버 ──────────────────────────────────────────────────────────────────
  // E방안: 링라이트 눈 반사 → 얼굴 레벨 핵심 식별자
  '유튜버':
    'wearing trendy Korean streetwear or casual creator outfit, ' +
    'large LED ring light positioned directly in front — ring light reflection clearly visible in both eyes, ' +
    'professional condenser microphone positioned close to mouth at face level, ' +
    'soft warm ring light illuminating face perfectly, blurred creative studio with monitors in background, ' +
    'energetic charismatic engaging creator expression, gesturing or pointing toward camera',

  // 선생님 ──────────────────────────────────────────────────────────────────
  // E방안: 마커/레이저 포인터 → 어깨 레벨까지 올린 손
  '선생님':
    'wearing neat professional Korean business casual attire, ' +
    'holding a dry-erase marker or laser pointer raised to shoulder level — pointing upward at content, ' +
    'whiteboard or chalkboard visible directly behind person filling background, ' +
    'warm natural classroom lighting, Korean school classroom setting, ' +
    'warm authoritative knowledgeable teacher expression',

  // 요리사 ──────────────────────────────────────────────────────────────────
  // E방안: 높은 흰 토크 모자 → 머리 레벨 핵심, 앞치마 단추 → 가슴 레벨
  '요리사':
    'wearing a pristine white double-breasted chef jacket with pearl buttons clearly visible on chest, ' +
    'tall white toque chef\'s hat prominently on head — THE key head-level identifier, ' +
    'holding a professional chef\'s knife raised at chest level in right hand, ' +
    'warm amber kitchen lighting illuminating face from above, professional stainless steel kitchen in background, ' +
    'proud accomplished master chef expression',

  // 경찰관 ──────────────────────────────────────────────────────────────────
  // E방안: 경찰 모자+배지 → 머리 레벨, 가슴 배지 → 가슴 레벨
  '경찰관':
    'wearing full formal Korean police officer uniform in navy blue, ' +
    'official Korean police cap with gold badge prominently on head — THE key head-level identifier, ' +
    'large silver national police badge clearly displayed on chest, standing upright with authority, ' +
    'harsh authoritative white fluorescent lighting, Korean police station background, ' +
    'authoritative commanding protective expression',

  // 프로게이머 ──────────────────────────────────────────────────────────────
  // E방안: 게이밍 헤드셋 → 머리/귀 레벨 핵심, 팀 저지 로고 → 가슴 레벨
  '프로게이머':
    'wearing a professional Korean esports team jersey with bold team logo clearly on chest, ' +
    'wearing a high-end gaming headset on head with mic boom pointing toward mouth — key head-level identifier, ' +
    'seated at competition gaming desk, leaning slightly forward intensely, ' +
    'cool RGB blue-purple gaming atmosphere lighting on face, multiple glowing monitors in background, ' +
    'intense focused champion expression',

  // 가수 — 성별·소품은 getJobPrompt()에서 처리 (기본값 폴백용)
  '가수':
    'wearing stage performer outfit, holding a standard handheld vocal microphone at chest height',

  // 과학자 — 고글은 이마 위에만 (눈 가리면 안경처럼 오인됨)
  '과학자':
    'wearing a white lab coat with name badge on chest, ' +
    'safety goggles pushed up on forehead above eyebrows NOT covering eyes — NOT eyeglasses, ' +
    'holding a small standard laboratory test tube at chest level in one hand, normal human-scale size about 15cm tall, NOT oversized, NOT a large flask, ' +
    'cool blue-white fluorescent laboratory lighting on face, research lab equipment softly blurred in background, ' +
    'intellectually focused analytical expression',

  // 소방관 ──────────────────────────────────────────────────────────────────
  // E방안: 소방 헬멧 → 머리 레벨 핵심, 반사 줄 → 가슴/어깨 레벨
  '소방관':
    'wearing full Korean firefighter turnout gear with bright orange-red jacket, ' +
    'yellow firefighter helmet firmly on head with visor up — THE key head-level identifier, ' +
    'silver reflective safety stripes clearly visible across chest and shoulders, ' +
    'dramatic red-orange emergency lighting on face, red Korean fire engine 소방차 in background, ' +
    'brave heroic determined courageous expression',

  // 간호사 ──────────────────────────────────────────────────────────────────
  // E방안: 청진기 목에 → 목 레벨 핵심, 스크럽 깃 → 어깨 레벨
  '간호사':
    'wearing professional Korean nurse uniform in light blue or white scrubs with name badge on chest, ' +
    'stethoscope clearly draped around neck — key neck-level identifier, ' +
    'holding a medication chart or syringe raised at chest level in one hand, ' +
    'bright clean hospital fluorescent white lighting on face, Korean hospital corridor background, ' +
    'compassionate caring warm professional expression',

  // 판사 ────────────────────────────────────────────────────────────────────
  // 판사봉: 얼굴 옆이 아닌 가슴 높이·손 크기 고정 (AI가 망치·거대 봉으로 왜곡하기 쉬움)
  '판사':
    'wearing a formal black Korean judicial robe (법복) with white official collar clearly visible, ' +
    'holding a small realistic wooden court gavel at chest height in one hand — short handle about 15cm, round wooden head about 5cm diameter, normal hand-sized judge mallet NOT a hammer NOT a toy NOT oversized, ' +
    'other hand resting naturally on the wooden judicial bench, seated behind elevated bench, Korean courtroom emblem softly blurred in background, ' +
    'formal solemn courtroom lighting, official authoritative atmosphere, ' +
    'highly authoritative wise composed commanding expression',

  // 변호사 ──────────────────────────────────────────────────────────────────
  // E방안: 넥타이·정장 깃 → 목/가슴 레벨, 서류 가슴 레벨까지 올림
  '변호사':
    'wearing a sharp well-fitted dark navy business suit, crisp white shirt and tie clearly visible at chest, ' +
    'gold cufflinks and lapel pin visible, holding thick legal documents raised at chest level in one arm, ' +
    'standing with confident commanding posture, ' +
    'warm prestigious office lighting, floor-to-ceiling legal bookshelves behind, ' +
    'confident commanding sharp razor-focused professional expression',

  // 수의사 ──────────────────────────────────────────────────────────────────
  // E방안: 강아지를 가슴에 안고 얼굴 가까이 → 얼굴 레벨 핵심 식별자
  '수의사':
    'wearing teal or green medical scrubs with white veterinary coat and name badge on chest, ' +
    'gently cradling a small fluffy puppy close to face at chest level — key visual identifier, ' +
    'stethoscope draped around neck clearly visible, face turned lovingly toward the animal, ' +
    'warm gentle clinic lighting, modern Korean veterinary clinic in background, ' +
    'warm gentle compassionate loving professional smile',

  // 파일럿 ──────────────────────────────────────────────────────────────────
  // E방안: 기장 모자+날개 배지 → 머리 레벨 핵심, 4줄 견장 → 어깨 레벨
  '파일럿':
    'wearing a formal Korean airline captain uniform in dark navy, ' +
    'captain\'s hat with gold wings badge prominently on head — THE key head-level identifier, ' +
    'four gold stripes epaulettes clearly visible on both shoulders, pilot wings badge on chest, ' +
    'clean professional airline lighting, jet bridge or cockpit background, ' +
    'authoritative calm confident professional pilot expression',

  // 스튜어디스(항공 승무원) ───────────────────────────────────────────────────
  // 자료: 대한항공 청자색+베이지 유니폼, 날개 모양 실크 스카프, 윙 배지 (지안프랑코 페레 디자인)
  // E방안: 목 스카프 → 목 레벨 핵심, 윙 배지·명찰 → 가슴 레벨
  '스튜어디스':
    'wearing an authentic Korean airline flight attendant uniform in elegant celadon blue-green and soft beige tones, ' +
    'signature wing-shaped silk scarf tied neatly at the neck — THE key neck-level identifier, ' +
    'golden airline wing pin and crew name badge clearly on chest, neat tidy airline-regulation hairstyle, ' +
    'standing gracefully in an airplane cabin aisle with overhead bins and passenger seats softly blurred behind, ' +
    'warm soft cabin lighting on face, poised elegant warm welcoming professional smile',

  // 디자이너 ────────────────────────────────────────────────────────────────
  // E방안: 태블릿 가슴/얼굴 레벨 → 가슴 레벨 핵심 식별자
  '디자이너':
    'wearing stylish trendy Korean creative professional outfit, ' +
    'holding a professional digital drawing tablet with stylus pen raised at chest-to-face level — key identifier, ' +
    'creative confident pose showing the design work on the tablet screen, ' +
    'warm moody creative studio lighting on face, colorful design work and monitor in background, ' +
    'creative inspired imaginative confident expression',

  // 작가 — 안경은 참조 사진·eyewear 프롬프트가 담당 (억지 추가 금지)
  '작가':
    'wearing comfortable sophisticated casual literary clothing, ' +
    'holding an open book or fountain pen raised to chest level, thoughtful introspective pose, ' +
    'warm amber desk lamp lighting creating a cozy soft glow on face, ' +
    'tall bookshelves with Korean and world literature books in background, ' +
    'deeply thoughtful wise creative expression',
};

/** 가수 등 성별·나이에 따라 달라지는 소품·의상 묘사 */
const SINGER_MIC =
  'holding a standard handheld vocal microphone at chest height in one hand — ' +
  'silver metal mesh grille head about 8cm diameter on straight black handle about 20cm long, ' +
  'normal human-scale stage microphone NOT wireless earpiece NOT boom arm NOT studio condenser NOT merged with face NOT oversized';

const SINGER_STAGE =
  'dramatic colorful stage spotlights creating rim lighting on face, ' +
  'blurred concert stage and audience in background, confetti in air, ' +
  'charismatic passionate performing expression';

/**
 * 직업별 프롬프트 — 성별·나이 반영
 * (가수: 남/여 무대 의상 분리, 마이크는 가슴 높이·실제 크기 고정)
 */
export const getJobPrompt = (job: string, gender: string, _ageStr?: string): string => {
  if (job === '가수') {
    if (gender === '여자') {
      return [
        'wearing glamorous Korean female K-pop idol stage outfit',
        'sequined performance dress or elegant sparkly stage top with feminine styling',
        SINGER_MIC,
        SINGER_STAGE,
      ].join(', ');
    }
    return [
      'wearing stylish Korean male vocalist stage outfit',
      'fitted performance blazer leather jacket or masculine stage shirt NOT feminine NOT dress NOT skirt',
      SINGER_MIC,
      SINGER_STAGE,
    ].join(', ');
  }

  return JOB_PROMPTS[job] ?? 'wearing professional work attire at workplace';
};

/** 직업별 추가 네거티브 (소품 왜곡 방지) */
export const JOB_NEGATIVES: Partial<Record<string, string>> = {
  '판사':
    'giant gavel, oversized hammer, war hammer, mallet merged with hand, deformed gavel, multiple gavels, melted wooden object, sledgehammer, toy hammer',
  '가수':
    'deformed microphone, giant mic, mic merged with mouth or face, multiple microphones, melted mic, wireless earbud, headset mic boom, studio condenser microphone, microphone stand only',
};
