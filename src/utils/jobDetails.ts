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
  // E방안: 목걸이 메달 → 목 레벨, 팀 저지 → 가슴 레벨
  '운동선수':
    'wearing a professional Korean national sports team competition uniform with bold team logo on chest, ' +
    'gold championship medal hanging prominently around neck — key neck-level identifier, ' +
    'victorious pose with head held high, athletic confident expression, ' +
    'dramatic stadium floodlights shining down onto face, packed stadium cheering in background, ' +
    'triumphant champion expression',

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
    'wearing trendy Korean streetwear or casual creator outfit with distinctive accessories, ' +
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

  // 가수 ────────────────────────────────────────────────────────────────────
  // E방안: 마이크 입 레벨 → 얼굴 바로 옆 핵심 식별자, 무대 조명 얼굴에 직접 조사
  '가수':
    'wearing a glamorous Korean idol performer stage outfit with bold styling and accessories, ' +
    'holding a professional wireless microphone directly at mouth level — face-level key identifier, ' +
    'dramatic colorful stage spotlights creating rim lighting directly on face, ' +
    'stage smoke and blurred audience in background, confetti in air, ' +
    'charismatic passionate performing expression',

  // 과학자 ──────────────────────────────────────────────────────────────────
  // E방안: 보안경 이마에 걸침 → 머리 레벨 핵심, 시험관 얼굴 레벨까지 올림
  '과학자':
    'wearing a white lab coat with name badge on chest, ' +
    'safety goggles clearly resting on forehead — key head-level identifier, ' +
    'holding a glowing test tube or glass flask raised to face level in one hand, ' +
    'cool blue-white fluorescent laboratory lighting on face, sophisticated research lab equipment in background, ' +
    'intellectually focused analytical concentrated expression',

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
  // E방안: 판사봉 얼굴 레벨까지 올림 → 얼굴 바로 옆 핵심, 법복 깃 → 어깨 레벨
  '판사':
    'wearing a formal black Korean judicial robe (법복) with white official collar clearly visible, ' +
    'holding a wooden gavel raised prominently to face level in right hand — THE most important identifier, ' +
    'seated behind elevated judicial bench, Korean national emblem visible in background behind shoulders, ' +
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

  // 건축가 ──────────────────────────────────────────────────────────────────
  // E방안: 흰 안전모 → 머리 레벨 핵심, 안전조끼 → 어깨/가슴 레벨
  '건축가':
    'wearing a white construction hard hat on head — THE key head-level identifier, ' +
    'bright orange safety vest with reflective stripes over professional shirt, clearly visible on chest, ' +
    'holding large rolled architectural blueprints raised at chest level in both hands, ' +
    'natural bright outdoor construction site lighting, modern Korean building construction background, ' +
    'visionary creative professional confident expression',

  // 디자이너 ────────────────────────────────────────────────────────────────
  // E방안: 태블릿 가슴/얼굴 레벨 → 가슴 레벨 핵심 식별자
  '디자이너':
    'wearing stylish trendy Korean creative professional outfit with distinctive accessories and fashion, ' +
    'holding a professional digital drawing tablet with stylus pen raised at chest-to-face level — key identifier, ' +
    'creative confident pose showing the design work on the tablet screen, ' +
    'warm moody creative studio lighting on face, colorful design work and monitor in background, ' +
    'creative inspired imaginative confident expression',

  // 작가 ────────────────────────────────────────────────────────────────────
  // E방안: 안경 얼굴에 → 얼굴 레벨 핵심, 책/만년필 가슴까지 올림
  '작가':
    'wearing comfortable sophisticated casual literary clothing, ' +
    'elegant reading glasses on face — key face-level identifier, ' +
    'holding an open book or fountain pen raised to chest level, thoughtful introspective pose, ' +
    'warm amber desk lamp lighting creating a cozy soft glow on face, ' +
    'tall bookshelves with Korean and world literature books in background, ' +
    'deeply thoughtful wise creative expression',
};
