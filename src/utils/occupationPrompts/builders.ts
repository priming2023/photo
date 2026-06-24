import {
  CHEF_KNIFE,
  HANDHELD_MIC,
  JUDGE_GAVEL,
  LAB_TEST_TUBE,
  LEGAL_DOCS,
  MARKER_POINTER,
  PUPPY_CRADLE,
  SINGER_STAGE,
  STETHOSCOPE,
  TABLET_STYLUS,
  WAIST_UP_NOTE,
} from './shared';
import {
  type JobPromptCtx,
  isFemale,
  joinParts,
  seniority,
} from './types';

// ─── 운동선수 ───────────────────────────────────────────────────────────────
export const buildAthletePrompt = ({ gender, age }: JobPromptCtx): string => {
  const rank = seniority(age);
  const outfit = isFemale(gender)
    ? 'wearing official Korean women\'s national football team jersey in red with team crest on chest, athletic fit for female player'
    : 'wearing official Korean men\'s national football team jersey in red with team crest on chest, athletic muscular build';

  const medal =
    rank === 'senior'
      ? 'gold veteran championship medal on ribbon around neck, experienced champion aura'
      : 'gold championship medal on ribbon around neck';

  return joinParts(
    outfit,
    medal,
    rank === 'senior'
      ? 'standing proudly on stadium sideline as seasoned veteran player'
      : 'victorious pose head held high on football pitch',
    'dramatic stadium floodlights on face, blurred cheering crowd behind',
    'triumphant confident champion expression',
    WAIST_UP_NOTE,
  );
};

// ─── 의사 ───────────────────────────────────────────────────────────────────
export const buildDoctorPrompt = ({ gender, age }: JobPromptCtx): string => {
  const rank = seniority(age);
  const coat = isFemale(gender)
    ? 'wearing clean crisp white doctor coat tailored for woman with hospital name badge on chest'
    : 'wearing clean crisp white doctor coat with hospital name badge pinned on chest';

  const badge =
    rank === 'senior'
      ? 'senior attending physician gold department chief badge on coat'
      : rank === 'junior'
        ? 'junior resident doctor ID badge on chest'
        : 'hospital staff badge on chest';

  return joinParts(
    coat,
    badge,
    STETHOSCOPE,
    'holding medical chart clipboard at chest level in one hand',
    'bright clean hospital white lighting on face, blurred Korean hospital corridor',
    'professional compassionate trusted doctor expression',
    WAIST_UP_NOTE,
  );
};

// ─── 유튜버 ─────────────────────────────────────────────────────────────────
export const buildYoutuberPrompt = ({ gender, age }: JobPromptCtx): string => {
  const outfit = isFemale(gender)
    ? rankStyle(age,
        'wearing trendy feminine Korean creator outfit pastel hoodie or stylish blouse',
        'wearing polished female content creator smart casual on camera',
        'wearing mature female creator professional studio outfit',
      )
    : rankStyle(age,
        'wearing trendy masculine Korean streetwear hoodie or casual creator shirt',
        'wearing polished male YouTuber smart casual shirt',
        'wearing mature male creator professional studio outfit',
      );

  return joinParts(
    outfit,
    'LED ring light reflection visible in both eyes',
    'professional condenser microphone on desk at chest level — normal desk mic size NOT giant',
    'soft warm ring light on face, blurred creative studio with monitors behind',
    'energetic charismatic engaging creator expression gesturing toward camera',
    WAIST_UP_NOTE,
  );
};

// ─── 선생님 ─────────────────────────────────────────────────────────────────
export const buildTeacherPrompt = ({ gender, age }: JobPromptCtx): string => {
  const outfit = isFemale(gender)
    ? rankStyle(age,
        'wearing neat blouse and cardigan professional Korean female teacher attire',
        'wearing elegant blouse with slacks professional female teacher look',
        'wearing dignified mature female teacher blazer and blouse',
      )
    : rankStyle(age,
        'wearing neat shirt and tie or polo professional Korean male teacher attire',
        'wearing dress shirt with tie professional male teacher look',
        'wearing dignified mature male teacher suit jacket and tie',
      );

  const role =
    seniority(age) === 'senior'
      ? 'experienced senior homeroom teacher or vice principal presence'
      : 'warm classroom teacher presence';

  return joinParts(
    outfit,
    role,
    MARKER_POINTER,
    'whiteboard or chalkboard visible behind',
    'warm natural classroom lighting, Korean school classroom',
    'warm authoritative knowledgeable teacher expression',
    WAIST_UP_NOTE,
  );
};

// ─── 요리사 ─────────────────────────────────────────────────────────────────
export const buildChefPrompt = ({ gender, age }: JobPromptCtx): string => {
  const rank = seniority(age);
  const jacket = isFemale(gender)
    ? 'wearing pristine white double-breasted chef jacket fitted for woman with pearl buttons on chest'
    : 'wearing pristine white double-breasted chef jacket with pearl buttons on chest';

  return joinParts(
    jacket,
    'tall white toque chef hat prominently on head — key head-level identifier',
    rank === 'senior' && 'executive head chef black-and-gold neckerchief or chef rank insignia',
    CHEF_KNIFE,
    'warm amber kitchen lighting on face, professional stainless steel kitchen behind',
    rank === 'senior' ? 'master chef accomplished dignified expression' : 'proud accomplished chef expression',
    WAIST_UP_NOTE,
  );
};

// ─── 경찰관 ─────────────────────────────────────────────────────────────────
export const buildPolicePrompt = ({ gender, age }: JobPromptCtx): string => {
  const rank = seniority(age);
  const uniform = isFemale(gender)
    ? 'wearing formal Korean women\'s police uniform navy blue with fitted jacket'
    : 'wearing formal Korean men\'s police uniform navy blue';

  const insignia =
    rank === 'senior'
      ? 'gold senior inspector rank insignia on shoulders'
      : rank === 'mid'
        ? 'silver sergeant rank insignia on shoulders'
        : 'patrol officer insignia on shoulders';

  return joinParts(
    uniform,
    'official Korean police cap with gold badge on head — key head-level identifier',
    'large silver national police badge on chest',
    insignia,
    'standing upright with authority, harsh fluorescent lighting, Korean police station background',
    'authoritative commanding protective expression',
    WAIST_UP_NOTE,
  );
};

// ─── 프로게이머 ─────────────────────────────────────────────────────────────
export const buildProGamerPrompt = ({ gender, age }: JobPromptCtx): string => {
  const jersey = isFemale(gender)
    ? 'wearing professional Korean women\'s esports team jersey with bold team logo on chest'
    : 'wearing professional Korean men\'s esports team jersey with bold team logo on chest';

  return joinParts(
    jersey,
    'high-end gaming headset on head with mic boom toward mouth — key head-level identifier',
    seniority(age) === 'senior' && 'veteran pro player calm confidence',
    'seated at competition desk leaning forward, cool RGB blue-purple gaming light on face',
    'glowing monitors blurred behind',
    'intense focused champion expression',
    WAIST_UP_NOTE,
  );
};

// ─── 가수 ───────────────────────────────────────────────────────────────────
export const buildSingerPrompt = ({ gender, age }: JobPromptCtx): string => {
  const outfit = isFemale(gender)
    ? rankStyle(age,
        'wearing glamorous Korean female K-pop idol stage outfit sequined dress or sparkly performance top',
        'wearing elegant female performer stage outfit refined concert styling',
        'wearing mature female vocalist sophisticated stage gown or elegant performance blazer',
      )
    : rankStyle(age,
        'wearing stylish Korean male vocalist stage outfit fitted blazer or leather performance jacket NOT dress NOT skirt',
        'wearing refined male singer concert outfit dress shirt or stage jacket masculine styling',
        'wearing mature male vocalist distinguished stage suit or classic performer jacket',
      );

  return joinParts(outfit, HANDHELD_MIC, SINGER_STAGE, WAIST_UP_NOTE);
};

// ─── 과학자 ─────────────────────────────────────────────────────────────────
export const buildScientistPrompt = ({ gender, age }: JobPromptCtx): string => {
  const coat = isFemale(gender)
    ? 'wearing white lab coat fitted for woman with name badge on chest'
    : 'wearing white lab coat with name badge on chest';

  return joinParts(
    coat,
    'safety goggles pushed up on forehead above eyebrows NOT covering eyes — NOT eyeglasses',
    LAB_TEST_TUBE,
    seniority(age) === 'senior' && 'senior principal researcher experienced demeanor',
    'cool blue-white fluorescent lab lighting on face, research equipment blurred behind',
    'intellectually focused analytical expression',
    WAIST_UP_NOTE,
  );
};

// ─── 소방관 ─────────────────────────────────────────────────────────────────
export const buildFirefighterPrompt = ({ gender, age }: JobPromptCtx): string => {
  const gear = isFemale(gender)
    ? 'wearing Korean firefighter turnout gear orange-red jacket fitted for woman'
    : 'wearing Korean firefighter turnout gear bright orange-red jacket';

  return joinParts(
    gear,
    'yellow firefighter helmet on head with visor up — key head-level identifier',
    'silver reflective safety stripes across chest and shoulders',
    seniority(age) === 'senior' && 'veteran fire captain rank patch on sleeve',
    'dramatic red-orange emergency lighting on face, red Korean fire engine blurred behind',
    'brave heroic determined expression',
    WAIST_UP_NOTE,
  );
};

// ─── 간호사 ─────────────────────────────────────────────────────────────────
export const buildNursePrompt = ({ gender, age }: JobPromptCtx): string => {
  const uniform = isFemale(gender)
    ? rankStyle(age,
        'wearing light blue or white Korean female nurse scrubs with name badge on chest',
        'wearing professional female nurse scrubs with cardigan optional',
        'wearing senior female head nurse scrubs with charge nurse badge',
      )
    : rankStyle(age,
        'wearing navy or teal male nurse scrubs masculine cut with name badge on chest NOT dress NOT skirt',
        'wearing professional male nurse scrubs with ID badge',
        'wearing senior male nurse supervisor scrubs with charge nurse badge',
      );

  return joinParts(
    uniform,
    STETHOSCOPE,
    'holding medication chart or clipboard at chest level in one hand',
    'bright clean hospital lighting, Korean hospital corridor behind',
    'compassionate caring warm professional expression',
    WAIST_UP_NOTE,
  );
};

// ─── 판사 ───────────────────────────────────────────────────────────────────
export const buildJudgePrompt = ({ gender, age }: JobPromptCtx): string => {
  const robe = isFemale(gender)
    ? 'wearing formal black Korean judicial robe 법복 with white collar for woman judge'
    : 'wearing formal black Korean judicial robe 법복 with white official collar';

  return joinParts(
    robe,
    seniority(age) === 'senior' && 'chief justice senior rank dignified presence',
    JUDGE_GAVEL,
    'other hand resting on wooden judicial bench, seated behind elevated bench',
    'Korean courtroom emblem softly blurred behind',
    'formal solemn courtroom lighting, authoritative wise composed expression',
    WAIST_UP_NOTE,
  );
};

// ─── 변호사 ─────────────────────────────────────────────────────────────────
export const buildLawyerPrompt = ({ gender, age }: JobPromptCtx): string => {
  const suit = isFemale(gender)
    ? rankStyle(age,
        'wearing sharp tailored navy women\'s pantsuit or professional skirt suit with white blouse',
        'wearing elegant female attorney navy suit with silk blouse',
        'wearing distinguished senior female lawyer dark suit with subtle lapel pin',
      )
    : rankStyle(age,
        'wearing sharp fitted dark navy men\'s business suit white shirt and tie',
        'wearing professional male attorney navy suit with tie and cufflinks',
        'wearing distinguished senior male lawyer charcoal suit with gold cufflinks',
      );

  return joinParts(
    suit,
    seniority(age) === 'senior' && 'senior partner attorney prestigious presence',
    LEGAL_DOCS,
    'confident commanding posture, warm prestigious office lighting, legal bookshelves behind',
    'confident sharp professional expression',
    WAIST_UP_NOTE,
  );
};

// ─── 수의사 ─────────────────────────────────────────────────────────────────
export const buildVetPrompt = ({ gender, age }: JobPromptCtx): string => {
  const scrubs = isFemale(gender)
    ? 'wearing teal or green female veterinary scrubs with white vet coat and name badge'
    : 'wearing teal or green male veterinary scrubs with white vet coat and name badge';

  return joinParts(
    scrubs,
    STETHOSCOPE,
    PUPPY_CRADLE,
    seniority(age) === 'senior' && 'senior veterinarian experienced gentle authority',
    'warm gentle clinic lighting, modern Korean veterinary clinic behind',
    'warm compassionate loving professional smile',
    WAIST_UP_NOTE,
  );
};

// ─── 파일럿 ─────────────────────────────────────────────────────────────────
export const buildPilotPrompt = ({ gender, age }: JobPromptCtx): string => {
  const uniform = isFemale(gender)
    ? 'wearing formal Korean airline female captain uniform dark navy with tailored jacket'
    : 'wearing formal Korean airline male captain uniform dark navy';

  const stripes =
    age <= 25
      ? 'two gold stripes epaulettes first officer rank'
      : age <= 35
        ? 'three gold stripes epaulettes senior first officer'
        : 'four gold stripes epaulettes captain rank on both shoulders';

  return joinParts(
    uniform,
    'captain hat with gold wings badge on head — key head-level identifier',
    stripes,
    'pilot wings badge on chest',
    'clean airline lighting, jet bridge or cockpit blurred behind',
    'authoritative calm confident professional pilot expression',
    WAIST_UP_NOTE,
  );
};

// ─── 스튜어디스 / 승무원 ─────────────────────────────────────────────────────
export const buildFlightAttendantPrompt = ({ gender, age }: JobPromptCtx): string => {
  if (isFemale(gender)) {
    return joinParts(
      rankStyle(age,
        'wearing authentic Korean airline female flight attendant uniform celadon blue-green and beige tones',
        'wearing elegant Korean airline senior female cabin crew uniform celadon and beige',
        'wearing distinguished senior female purser uniform refined celadon styling',
      ),
      'signature wing-shaped silk scarf tied at neck — key neck-level identifier',
      'golden airline wing pin and crew name badge on chest',
      'standing in airplane cabin aisle, overhead bins blurred behind',
      'warm soft cabin lighting, poised elegant welcoming smile',
      WAIST_UP_NOTE,
    );
  }

  return joinParts(
    rankStyle(age,
      'wearing Korean airline male flight attendant uniform dark navy suit vest white shirt and tie',
      'wearing professional male cabin crew navy uniform with vest and wing pin',
      'wearing senior male purser dark navy suit with gold wing badge',
    ),
    'golden airline wing pin on chest lapel — key chest-level identifier',
    'crew name badge on chest, neat masculine airline-regulation grooming',
    'standing in airplane cabin aisle, warm cabin lighting',
    'professional warm welcoming expression',
    WAIST_UP_NOTE,
  );
};

// ─── 디자이너 ───────────────────────────────────────────────────────────────
export const buildDesignerPrompt = ({ gender, age }: JobPromptCtx): string => {
  const outfit = isFemale(gender)
    ? rankStyle(age,
        'wearing stylish trendy Korean female creative outfit bold colors or minimalist chic blouse',
        'wearing polished female graphic designer smart creative attire',
        'wearing mature female creative director elegant artistic blazer',
      )
    : rankStyle(age,
        'wearing stylish Korean male creative casual fitted black t-shirt or minimalist designer jacket',
        'wearing polished male designer smart casual with creative edge',
        'wearing mature male creative director tailored blazer with artistic flair',
      );

  return joinParts(
    outfit,
    TABLET_STYLUS,
    'colorful design work on tablet screen visible',
    'warm moody creative studio lighting, monitor with designs blurred behind',
    'creative inspired confident expression',
    WAIST_UP_NOTE,
  );
};

// ─── 작가 ───────────────────────────────────────────────────────────────────
export const buildWriterPrompt = ({ gender, age }: JobPromptCtx): string => {
  const outfit = isFemale(gender)
    ? rankStyle(age,
        'wearing cozy sophisticated female literary sweater or elegant casual blouse',
        'wearing refined female author cardigan and blouse intellectual style',
        'wearing distinguished senior female writer elegant literary blazer',
      )
    : rankStyle(age,
        'wearing comfortable masculine literary casual shirt or knit sweater',
        'wearing refined male author button-down shirt or tweed casual jacket',
        'wearing distinguished senior male writer classic literary blazer',
      );

  const prop =
    seniority(age) === 'senior'
      ? 'holding fountain pen and open hardcover book at chest level'
      : 'holding open book or notebook at chest level';

  return joinParts(
    outfit,
    prop,
    'warm amber desk lamp glow on face, tall bookshelves with literature behind',
    'thoughtful wise creative expression',
    WAIST_UP_NOTE,
  );
};

/** 나이대별 의상 톤: junior(25) / mid(35·45) / senior(55·65) */
function rankStyle(age: JobPromptCtx['age'], junior: string, mid: string, senior: string): string {
  const s = seniority(age);
  if (s === 'junior') return junior;
  if (s === 'mid') return mid;
  return senior;
}
