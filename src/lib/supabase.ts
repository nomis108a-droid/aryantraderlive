import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vdouloijirgrpzbkgvdm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkb3Vsb2lqaXJncnB6YmtndmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODA5MDYsImV4cCI6MjA5NTU1NjkwNn0.MrIivhzV3zXZqY6rmLyrjq8Wd0VrafoG0TOYEW8ffkQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Standardized upload helper for Supabase Storage.
 * @param file The file or blob to upload
 * @param folder The target folder within the 'Aryan-gold-hub' bucket
 * @returns The public URL of the uploaded file
 */
export const uploadToSupabase = async (file: File | Blob, folder: string) => {
  const name = file instanceof File ? file.name : 'compressed_image.jpg';
  const fileName = `${folder}/${Date.now()}_${name}`;
  
  const { data, error } = await supabase.storage
    .from('Aryan-gold-hub')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Upload error:', error.message);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('Aryan-gold-hub')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};
