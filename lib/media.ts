import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

export type LocalImage = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export async function pickImages(multiple = false): Promise<LocalImage[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Permita acesso às fotos para continuar.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    selectionLimit: multiple ? 6 : 1,
    quality: 0.85,
  });

  if (result.canceled) return [];
  return result.assets.map((asset) => ({
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
  }));
}

function extensionFor(image: LocalImage) {
  const fromName = image.fileName?.split('.').pop()?.toLowerCase();
  const fromUri = image.uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  const fromMime = image.mimeType?.split('/').pop()?.toLowerCase();
  return fromName || fromUri || fromMime || 'jpg';
}

export async function uploadPublicImage(
  userId: string,
  image: LocalImage,
  folder: string
): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const ext = extensionFor(image);
  const objectPath = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const arrayBuffer = await fetch(image.uri).then((response) => response.arrayBuffer());

  const { error } = await supabase.storage
    .from('media')
    .upload(objectPath, arrayBuffer, {
      contentType: image.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: false,
      cacheControl: '3600',
    });

  if (error) throw error;

  const { data } = supabase.storage.from('media').getPublicUrl(objectPath);
  return data.publicUrl;
}
