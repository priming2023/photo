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

export const buildPulidPrompt = (
  job: string,
  ageStr: string,
  gender: string,
  eyewear: EyewearState = 'uncertain',
): string => {
  const age         = parseAgeNumber(ageStr);
  const ageDesc     = getAgeDescriptor(ageStr, gender);
  const genderEng   = gender === '남자' ? 'man' : 'woman';
  const genderStyle = getGenderAgeStyle(gender, age);
  const jobDetail   = JOB_PROMPTS[job] ?? 'wearing professional work attire at workplace';
  const eyewearDesc = getEyewearPrompt(eyewear);

  return [
    `Same person as reference photo, preserve identical face shape eyes nose lips jawline.`,
    `${eyewearDesc}.`,
    `${age}-year-old Korean ${genderEng}. ${ageDesc}. ${genderStyle}.`,
    `${jobDetail}.`,
    `Upper body portrait, looking at camera, natural soft lighting, realistic photograph.`,
  ].join(' ');
};
