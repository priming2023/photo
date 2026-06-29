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
export { JOB_PROMPTS, getJobPrompt, JOB_NEGATIVES } from './occupationPrompts';

import { getAgeDescriptor, parseAgeNumber, getGenderAgeStyle } from './ageDescriptors';
import { getJobPrompt } from './occupationPrompts';
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
  const jobDetail   = getJobPrompt(job, gender, ageStr);
  const eyewearDesc = getEyewearPrompt(eyewear);
  const childGrowth = subjectAge === 'child' ? getChildGrowthPrompt(ageStr) : '';

  const parts = [
    eyewearDesc ? `${eyewearDesc}.` : '',
    subjectAge !== 'child' ? `Same person as reference photo, preserve identical face shape eyes nose lips jawline skin texture.` : '',
    `single person only, one face only, solo portrait, no duplicate faces, no split image.`,
    childGrowth ? `${childGrowth}.` : '',
    `${age}-year-old Korean ${genderEng}. ${ageDesc}. ${genderStyle}.`,
    `${jobDetail}.`,
    `Waist-up three-quarter shot at consistent natural distance for all occupations, same head-to-frame ratio, full upper body with arms and hands at sides fully visible not cropped at frame edges, occupational props clearly shown, not close-up not extreme close-up, candid natural photograph, soft daylight, subtle real skin texture, documentary portrait style.`,
  ];

  return parts.filter(Boolean).join(' ');
};
