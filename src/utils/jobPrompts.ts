/** 18개 직업별 의상·소품·배경 영문 프롬프트 */
export const JOB_PROMPTS: Record<string, string> = {
  '운동선수': 'wearing a professional sports jersey and athletic gear, standing in a large stadium, holding a sports ball',
  '의사': 'wearing a crisp white doctor coat with stethoscope around neck, bright modern hospital background',
  '유튜버': 'sitting in a colorful gaming chair, holding a podcast microphone, neon RGB lights background, trendy casual creator outfit',
  '선생님': 'wearing neat smart casual professional clothes, standing in front of a classroom green blackboard, holding a textbook',
  '요리사': 'wearing a white chef uniform and tall chef hat, standing in a professional restaurant kitchen with stainless steel',
  '경찰관': 'wearing a professional Korean police uniform with badge, standing on a city street',
  '프로게이머': 'wearing an esports team jersey, glowing gaming headset, sitting in front of RGB computer monitors',
  '가수': 'holding a microphone, performing on a concert stage with bright spotlights, glamorous stage outfit',
  '과학자': 'wearing a white lab coat and safety goggles, holding a glowing chemical flask, modern laboratory background',
  '소방관': 'wearing a firefighter uniform and helmet, fire truck visible in the background',
  '간호사': 'wearing a professional nurse uniform, holding a medical clipboard, hospital corridor background',
  '판사': 'wearing a black judge robe, holding a wooden gavel, sitting in a wooden courtroom',
  '변호사': 'wearing a sharp tailored business suit, holding legal documents, modern law office background',
  '수의사': 'wearing medical scrubs, gently holding a cute puppy, bright animal clinic background',
  '파일럿': 'wearing a pilot uniform with captain hat and wings badge, standing in an airplane cockpit',
  '건축가': 'wearing a safety hard hat and vest, holding architectural blueprints, construction site background',
  '디자이너': 'wearing stylish artistic fashion clothes, holding a digital drawing tablet, creative design studio background',
  '작가': 'wearing comfortable cozy clothes, sitting at a wooden desk with vintage typewriter, bookshelves background',
};

export const parseAgeNumber = (ageStr: string): number => {
  const match = ageStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 30;
};

/** 나이·성별·직업에 맞는 Flux-PuLID 프롬프트 생성 */
export const buildTransformationPrompt = (
  job: string,
  ageStr: string,
  gender: string,
): string => {
  const age = parseAgeNumber(ageStr);
  const genderEng = gender === '남자' ? 'man' : 'woman';
  const jobDetail = JOB_PROMPTS[job] ?? 'wearing professional work attire in a matching workplace environment';

  return [
    `Professional portrait photograph of the same Korean ${genderEng} from the reference image,`,
    `aged to look exactly ${age} years old with natural age-appropriate facial features and skin texture,`,
    `${jobDetail},`,
    'upper body portrait, looking directly at camera,',
    'preserve identical facial identity, eye shape, nose, and bone structure from the reference photo,',
    'photorealistic, studio lighting, sharp focus on face, high detail, cinematic quality.',
  ].join(' ');
};

export const NEGATIVE_PROMPT =
  'bad quality, worst quality, blurry, deformed face, disfigured, extra limbs, extra fingers, ' +
  'text, watermark, signature, cartoon, anime, painting, duplicate face, wrong age, childish face on adult body';
