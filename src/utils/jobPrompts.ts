/**
 * 직업·나이별 AI 변환 프롬프트 빌더
 *
 * E방안 적용 설계:
 * - imagePreprocess.ts: 상단 75% 타이트 크롭 → 얼굴이 입력 이미지의 40~60% 차지
 * - receiptCanvas.ts: top-aligned 렌더링 → 영수증에서 얼굴 항상 상단 표시
 *
 * 파일 구성:
 * - ageDescriptors.ts  : 나이별 묘사 + 네거티브 프롬프트 + 성별×나이 스타일
 * - jobDetails.ts      : 직업별 의상·소품·배경 (E방안 상반신 최적화)
 * - jobPrompts.ts (이 파일): buildPulidPrompt 통합 빌더 + 외부 export
 */

export {
  AGE_DESCRIPTORS,
  getAgeDescriptor,
  parseAgeNumber,
  buildNegativePrompt,
  NEGATIVE_PROMPT,
  getGenderAgeStyle,
} from './ageDescriptors';

export { JOB_PROMPTS } from './jobDetails';

import { getAgeDescriptor, parseAgeNumber, getGenderAgeStyle } from './ageDescriptors';
import { JOB_PROMPTS } from './jobDetails';

/**
 * flux-pulid 전용 프롬프트 빌더
 *
 * 구성 순서 (앞 토큰일수록 가중치 높음):
 *  1. 직업 장면·소품 — FIRST (AI 가중치 최대 활용)
 *  2. 나이별 얼굴 묘사
 *  3. 성별×나이 헤어·스타일링 (E방안: 클로즈업에서 헤어가 매우 잘 보임)
 *  4. 동아시아 외모 앵커 (서양 얼굴 방지)
 *  5. 구도 지시어: 타이트 상반신, 얼굴 상단 위치
 *  6. 촬영 품질 지시어
 */
export const buildPulidPrompt = (
  job: string,
  ageStr: string,
  gender: string,
): string => {
  const age         = parseAgeNumber(ageStr);
  const ageDesc     = getAgeDescriptor(ageStr);
  const genderEng   = gender === '남자' ? 'man' : 'woman';
  const genderStyle = getGenderAgeStyle(gender, age);
  const jobDetail   = JOB_PROMPTS[job] ?? 'wearing professional work attire at a matching workplace';

  return [
    // 1. 직업 장면 FIRST
    `${jobDetail}.`,
    // 2. 나이 + 성별
    `${age}-year-old Korean ${genderEng}. ${ageDesc}.`,
    // 3. 성별×나이 헤어·스타일링 (E방안: 얼굴 클로즈업에서 헤어 색상이 매우 잘 보임)
    `${genderStyle}.`,
    // 4. 동아시아 외모 앵커
    `East Asian Korean facial features, warm olive undertone skin, natural Asian complexion.`,
    // 5. 구도: 가로형 상반신 — 얼굴이 프레임 중앙 상단에 위치 (landscape_4_3 출력에 최적)
    `Upper body landscape shot with subject's face clearly centered and prominently visible, looking directly at camera.`,
    `Natural soft portrait lighting, shallow depth of field, face in sharp focus.`,
    // 6. 품질
    `Photorealistic Korean portrait photography, tack-sharp face, professional studio quality.`,
  ].join(' ');
};
