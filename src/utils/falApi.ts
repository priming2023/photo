// 18개 직업에 대한 영문 프롬프트 디테일 매핑 (옷, 배경, 소품)
const JOB_PROMPTS: Record<string, string> = {
  '운동선수': 'wearing a professional sports jersey, standing in a large stadium, holding a sports ball',
  '의사': 'wearing a white doctor coat, stethoscope around neck, bright hospital background',
  '유튜버': 'sitting in a colorful gaming chair, holding a podcast microphone, neon lights background, wearing trendy casual clothes',
  '선생님': 'wearing neat smart casual clothes, standing in front of a green blackboard, holding a book',
  '요리사': 'wearing a white chef uniform and chef hat, standing in a professional restaurant kitchen',
  '경찰관': 'wearing a professional police uniform, police badge, standing on a city street',
  '프로게이머': 'wearing an esports team jersey, wearing a glowing gaming headset, sitting in front of computer monitors',
  '가수': 'holding a microphone, singing on a stage with bright concert lights, wearing glamorous stage outfit',
  '과학자': 'wearing a white lab coat, wearing safety goggles, holding a glowing chemical flask, laboratory background',
  '소방관': 'wearing a firefighter uniform and helmet, fire truck in the background',
  '간호사': 'wearing a professional nurse uniform, holding a medical clipboard, hospital corridor background',
  '판사': 'wearing a black judge robe, holding a wooden gavel, sitting in a wooden courtroom',
  '변호사': 'wearing a sharp business suit, holding legal documents, modern office background',
  '수의사': 'wearing medical scrubs, holding a cute puppy, animal clinic background',
  '파일럿': 'wearing a pilot uniform with a captain hat, standing in an airplane cockpit',
  '건축가': 'wearing a safety hard hat, holding architectural blueprints, construction site background',
  '디자이너': 'wearing stylish artistic clothes, holding a digital drawing tablet, creative art studio background',
  '작가': 'wearing comfortable cozy clothes, sitting at a wooden desk with a vintage typewriter, bookshelves background',
};

// 한글 나이를 숫자로 변환 (예: "25살" -> "25")
const getAgeNumber = (ageStr: string) => {
  const match = ageStr.match(/\d+/);
  return match ? match[0] : '30';
};

/**
 * Fal.ai API 통신을 담당하는 함수
 */
export const generateTransformedImage = async (base64Image: string, job: string, ageStr: string, gender: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_FAL_KEY;
  
  if (!apiKey) {
    console.log("Fal.ai API Key가 설정되지 않았습니다. 테스트 모드로 작동합니다.");
    // 임시 지연 효과 (5초)
    await new Promise(resolve => setTimeout(resolve, 5000));
    return ""; // 결과가 없음을 의미. UI에서 원본 + 필터로 임시 처리함.
  }

  // 실제 API 호출 로직 (Fal.ai Flux-PuLID 모델 사용)
  const age = getAgeNumber(ageStr);
  const genderEng = gender === '남자' ? 'man' : 'woman';
  const jobPrompt = JOB_PROMPTS[job] || 'wearing professional clothes';
  
  // 프롬프트에 나이와 성별 명시 (예: 25 years old Korean man)
  const prompt = `A highly realistic, cinematic portrait of a ${age} years old Korean ${genderEng}, ${jobPrompt}, high quality, detailed face, looking at the camera.`;

  try {
    const response = await fetch("https://fal.run/fal-ai/flux-pulid", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        reference_image_url: base64Image,
        num_inference_steps: 20,
        guidance_scale: 7.5,
        identity_scale: 0.8 // 얼굴 유지력 (1.0이 최대)
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.images[0].url; // 변환된 이미지의 URL 반환
  } catch (error) {
    console.error("Fal.ai 이미지 생성 실패:", error);
    throw error;
  }
};
