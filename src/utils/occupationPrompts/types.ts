import { parseAgeNumber } from '../ageDescriptors';

export type SnappedAge = 30 | 40 | 50 | 60;
export type Seniority = 'junior' | 'mid' | 'senior';

export interface JobPromptCtx {
  gender: string;
  age: SnappedAge;
}

const AGE_KEYS: SnappedAge[] = [30, 40, 50, 60];

export const snapJobAge = (ageStr?: string): SnappedAge => {
  const age = ageStr ? parseAgeNumber(ageStr) : 40;
  return AGE_KEYS.reduce((prev, cur) =>
    Math.abs(cur - age) < Math.abs(prev - age) ? cur : prev,
  );
};

export const isFemale = (gender: string): boolean => gender === '여자';

export const seniority = (age: SnappedAge): Seniority => {
  if (age <= 30) return 'junior';
  if (age <= 40) return 'mid';
  return 'senior';
};

/** 프롬프트 파트 조합 */
export const joinParts = (...parts: (string | false | undefined | null)[]): string =>
  parts.filter(Boolean).join(', ');
