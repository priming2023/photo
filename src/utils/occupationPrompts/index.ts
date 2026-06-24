import {
  buildAthletePrompt,
  buildChefPrompt,
  buildDesignerPrompt,
  buildDoctorPrompt,
  buildFirefighterPrompt,
  buildFlightAttendantPrompt,
  buildJudgePrompt,
  buildLawyerPrompt,
  buildNursePrompt,
  buildPilotPrompt,
  buildPolicePrompt,
  buildProGamerPrompt,
  buildScientistPrompt,
  buildSingerPrompt,
  buildTeacherPrompt,
  buildVetPrompt,
  buildWriterPrompt,
  buildYoutuberPrompt,
} from './builders';
import { type JobPromptCtx, snapJobAge } from './types';

type JobBuilder = (ctx: JobPromptCtx) => string;

const JOB_BUILDERS: Record<string, JobBuilder> = {
  '운동선수': buildAthletePrompt,
  '의사': buildDoctorPrompt,
  '유튜버': buildYoutuberPrompt,
  '선생님': buildTeacherPrompt,
  '요리사': buildChefPrompt,
  '경찰관': buildPolicePrompt,
  '프로게이머': buildProGamerPrompt,
  '가수': buildSingerPrompt,
  '과학자': buildScientistPrompt,
  '소방관': buildFirefighterPrompt,
  '간호사': buildNursePrompt,
  '판사': buildJudgePrompt,
  '변호사': buildLawyerPrompt,
  '수의사': buildVetPrompt,
  '파일럿': buildPilotPrompt,
  '스튜어디스': buildFlightAttendantPrompt,
  '디자이너': buildDesignerPrompt,
  '작가': buildWriterPrompt,
};

/**
 * 직업 × 성별 × 나이(25·35·45·55·65) 세분화 프롬프트
 */
export const getJobPrompt = (job: string, gender: string, ageStr?: string): string => {
  const builder = JOB_BUILDERS[job];
  if (!builder) {
    return 'wearing professional work attire appropriate for the occupation at workplace';
  }
  const ctx: JobPromptCtx = { gender, age: snapJobAge(ageStr) };
  return builder(ctx);
};

/** 직업별 소품 왜곡 방지 네거티브 */
export const JOB_NEGATIVES: Partial<Record<string, string>> = {
  '판사':
    'giant gavel, oversized hammer, war hammer, mallet merged with hand, deformed gavel, multiple gavels, melted wooden object, sledgehammer, toy hammer',
  '가수':
    'deformed microphone, giant mic, mic merged with mouth or face, multiple microphones, melted mic, wireless earbud, headset mic boom, studio condenser microphone',
  '의사':
    'oversized stethoscope, stethoscope merged with neck, giant medical chart',
  '간호사':
    'female dress uniform on man, wrong gender uniform, oversized syringe',
  '요리사':
    'giant knife, sword-sized chef knife, knife merged with hand, deformed toque',
  '경찰관':
    'wrong police insignia, military uniform instead of police, giant badge',
  '파일럿':
    'wrong number of stripes, military pilot jumpsuit, oversized wings badge',
  '스튜어디스':
    'female scarf uniform on man, wrong airline uniform, oversized wing pin',
  '과학자':
    'goggles covering eyes like glasses, giant flask, oversized test tube, beaker bigger than head',
  '수의사':
    'giant dog, deformed puppy, puppy merged with face',
  '디자이너':
    'giant tablet, oversized stylus, tablet merged with hands',
  '소방관':
    'firefighter helmet, helmet on head, hard hat, deformed helmet, wrong helmet shape, cowboy helmet, oversized helmet',
  '운동선수':
    'wrong sport uniform, baseball jersey, basketball jersey instead of football',
  '프로게이머':
    'VR headset instead of gaming headset, giant headphones',
  '변호사':
    'casual clothes, giant legal folder, papers covering face',
  '선생님':
    'giant marker, deformed pointer, wrong classroom props',
  '유튜버':
    'giant microphone, mic covering entire face, oversized ring light',
};

/** 하위 호환 — 폴백용 짧은 설명 */
export const JOB_PROMPTS: Record<string, string> = Object.fromEntries(
  Object.keys(JOB_BUILDERS).map((job) => [job, getJobPrompt(job, '남자', '35살')]),
);
