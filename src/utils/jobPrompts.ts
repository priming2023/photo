/**
 * flux-pulid 프롬프트 빌더
 */

export {
  AGE_DESCRIPTORS,
  getAgeDescriptor,
  parseAgeNumber,
  buildNegativePrompt,
  NEGATIVE_PROMPT,
  getGenderAgeStyle,
  getPulidParams,
} from './ageDescriptors';
export type { PulidParams } from './ageDescriptors';
export { JOB_PROMPTS } from './jobDetails';

import { getAgeDescriptor, parseAgeNumber, getGenderAgeStyle } from './ageDescriptors';
import { JOB_PROMPTS } from './jobDetails';
import type { EyewearState } from './eyewearDetection';
import { getEyewearPrompt } from './eyewearDetection';
import type { SubjectAgeCategory } from './subjectAgeDetection';
import { getChildGrowthPrompt } from './subjectAgeDetection';

export const buildPulidPrompt = (
  job: string,
  ageStr: string,
  gender: string,
  eyewear: EyewearState = 'not_wearing',
  subjectAge: SubjectAgeCategory = 'adult',
): string => {
  const age         = parseAgeNumber(ageStr);
  const ageDesc     = getAgeDescriptor(ageStr, gender);
  const genderEng   = gender === '남자' ? 'man' : 'woman';
  const genderStyle = getGenderAgeStyle(gender, age);
  const jobDetail   = JOB_PROMPTS[job] ?? 'wearing professional work attire at workplace';
  const eyewearDesc = getEyewearPrompt(eyewear);
  const childGrowth = subjectAge === 'child' ? getChildGrowthPrompt(ageStr) : '';

  return [
    `Same person as reference photo, preserve identical face shape eyes nose lips jawline skin texture.`,
    `single person only, one face only, solo portrait, no duplicate faces, no split image.`,
    eyewearDesc ? `${eyewearDesc}.` : '',
    childGrowth ? `${childGrowth}.` : '',
    `${age}-year-old Korean ${genderEng}. ${ageDesc}. ${genderStyle}.`,
    `${jobDetail}.`,
    `Medium shot upper body from chest up, head shoulders and upper chest visible, natural arm's length distance, not close-up, soft natural lighting, authentic Korean photograph, subtle real skin texture.`,
  ].filter(Boolean).join(' ');
};
