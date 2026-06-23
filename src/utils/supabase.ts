import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const uploadImageToSupabase = async (base64Image: string): Promise<string> => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase 키가 설정되지 않았습니다.");
    return "";
  }

  try {
    // Base64 문자열을 Blob 객체로 변환
    const res = await fetch(base64Image);
    const blob = await res.blob();
    const fileName = `photo_${Date.now()}.jpg`;

    // photos 버킷에 업로드
    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    // 업로드된 파일의 Public URL 가져오기
    const { data: publicData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    return publicData.publicUrl;
  } catch (err) {
    console.error("Supabase 업로드 에러:", err);
    return ""; 
  }
}
