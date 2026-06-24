import { parseAgeNumber } from '../ageDescriptors';

export type SnappedAge = 25 | 35 | 45 | 55 | 65;
export type Seniority = 'junior' | 'mid' | 'senior';

export interface JobPromptCtx {
  gender: string;
  age: SnappedAge;
}

const AGE_KEYS: SnappedAge[] = [25, 35, 45, 55, 65];

export const snapJobAge = (ageStr?: string): SnappedAge => {
  const age = ageStr ? parseAgeNumber(ageStr) : 35;
  return AGE_KEYS.reduce((prev, cur) =>
    Math.abs(cur - age) < Math.abs(prev - age) ? cur : prev,
  );
};

export const isFemale = (gender: string): boolean => gender === '여자';

export const seniority = (age: SnappedAge): Seniority => {
  if (age <= 25) return 'junior';
  if (age <= 45) return 'mid';
  return 'senior';
};

/** 프롬프트 파트 조합 */
export const joinParts = (...parts: (string | false | undefined | null)[]): string =>
  parts.filter(Boolean).join(', ');
