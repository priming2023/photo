import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** data URL 또는 http(s) URL 이미지를 Supabase photos 버킷에 업로드 */
export const uploadImageToSupabase = async (imageSrc: string): Promise<string> => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase 키가 설정되지 않았습니다.");
    return "";
  }

  try {
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const fileName = `photo_${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    return publicData.publicUrl;
  } catch (err) {
    console.error("Supabase 업로드 에러:", err);
    return ""; 
  }
}
