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

/** landscape 생성 시 PuLID가 좌우 2얼굴(split face)을 만드는 경우 방지 — 프롬프트 최우선 */
export const ANTI_SPLIT_PROMPT =
  'ONE single photograph with ONE person and ONE unified face centered in the frame, ' +
  'NOT split screen NOT diptych NOT side by side NOT before-and-after NOT two panels NOT comparison image';

export const ANTI_SPLIT_NEGATIVE =
  'split face, two faces side by side, diptych, dual portrait, before and after comparison, ' +
  'left half right half different face, half old half young, two people in one image, ' +
  'duplicate face, double head, mirrored duplicate, twin faces, collage of two photos';

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

  const identityLine = subjectAge === 'child'
    ? 'Same person as reference photo but fully grown up as an adult — preserve general likeness, allow mature adult facial structure'
    : 'Same person as reference photo, preserve identical face shape eyes nose lips jawline skin texture';

  const parts = [
    ANTI_SPLIT_PROMPT + '.',
    subjectAge === 'child' && childGrowth ? `${childGrowth}.` : '',
    eyewearDesc ? `${eyewearDesc}.` : '',
    identityLine + '.',
    `single person only, one face only, solo portrait, no duplicate faces.`,
    `${age}-year-old Korean ${genderEng}. ${ageDesc}. ${genderStyle}.`,
    `${jobDetail}.`,
    `Waist-up three-quarter shot, one centered subject, head shoulders chest and hands visible, occupational props clearly shown, not extreme close-up, candid natural photograph, soft daylight, documentary portrait.`,
  ];

  return parts.filter(Boolean).join(' ');
};
