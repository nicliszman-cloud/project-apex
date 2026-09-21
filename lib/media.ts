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
    quality: 0.9,
  });

  if (result.canceled) return [];
  return result.assets.map((asset) => ({
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileName: asset.fileName,
  }));
}

function cleanExtension(value?: string | null) {
  const ext = value?.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (!ext) return null;
  if (ext === 'jpeg') return 'jpg';
  return ['jpg', 'png', 'webp', 'heic', 'heif', 'gif'].includes(ext) ? ext : null;
}

function extensionFor(image: LocalImage) {
  const fromMime = cleanExtension(image.mimeType?.split('/').pop());
  const fromName = cleanExtension(image.fileName);
  const fromUri = cleanExtension(image.uri);
  return fromMime || fromName || fromUri || 'jpg';
}

function mimeFor(image: LocalImage, ext: string) {
  if (image.mimeType?.startsWith('image/')) return image.mimeType;
  if (ext === 'jpg') return 'image/jpeg';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/' + ext;
}

export function resolveMediaUrl(value?: string | null): string | null {
  if (!value) return null;
  if (/^(https?:|file:|content:|data:|blob:)/i.test(value)) return value;
  if (!supabase) return value;

  const normalized = value.replace(/^\/+/, '').replace(/^media\//, '');
  return supabase.storage.from('media').getPublicUrl(normalized).data.publicUrl;
}

export function storagePathFromPublicUrl(value?: string | null): string | null {
  if (!value) return null;
  if (!/^https?:/i.test(value)) return value.replace(/^\/+/, '').replace(/^media\//, '');
  const marker = '/storage/v1/object/public/media/';
  const index = value.indexOf(marker);
  if (index < 0) return null;
  return decodeURIComponent(value.slice(index + marker.length));
}

export async function uploadPublicImage(
  userId: string,
  image: LocalImage,
  folder: string
): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const ext = extensionFor(image);
  const objectPath = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const response = await fetch(image.uri);
  if (!response.ok && !image.uri.startsWith('file:') && !image.uri.startsWith('content:')) {
    throw new Error('Não foi possível ler a imagem selecionada.');
  }

  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer.byteLength) throw new Error('A imagem selecionada está vazia.');

  const { error } = await supabase.storage
    .from('media')
    .upload(objectPath, arrayBuffer, {
      contentType: mimeFor(image, ext),
      upsert: false,
      cacheControl: '31536000',
    });

  if (error) throw error;

  const publicUrl = supabase.storage.from('media').getPublicUrl(objectPath).data.publicUrl;
  if (!publicUrl) throw new Error('O upload terminou, mas a URL pública não foi criada.');

  return publicUrl;
}
