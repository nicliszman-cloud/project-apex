import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
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

function cleanMediaValue(value: string) {
  let cleaned = value.trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

function pushUnique(list: string[], value?: string | null) {
  if (!value) return;
  const clean = value.trim();
  if (clean && !list.includes(clean)) list.push(clean);
}

function googleDriveDirect(value: string) {
  const fileMatch = value.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  const idMatch = value.match(/[?&]id=([^&#]+)/i);
  const id = fileMatch?.[1] || idMatch?.[1];
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : null;
}

function dropboxDirect(value: string) {
  if (!/dropbox\.com/i.test(value)) return null;
  try {
    const url = new URL(value);
    url.hostname = 'dl.dropboxusercontent.com';
    url.searchParams.delete('dl');
    url.searchParams.delete('raw');
    return url.toString();
  } catch {
    return value
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace(/[?&](dl|raw)=\d/gi, '');
  }
}

function githubRaw(value: string) {
  const match = value.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
  if (!match) return null;
  return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}/${match[4]}`;
}

/**
 * Creates a sequence of image-source candidates.
 *
 * Supported without special handling:
 * - Any direct http/https image URL, even without a file extension.
 * - file:, content:, data: and blob: URIs.
 * - Public paths from the Supabase "media" bucket.
 *
 * Also normalizes common share links from Google Drive, Dropbox and GitHub.
 * A generic web page that returns HTML instead of image bytes still cannot be
 * rendered as an image; in that case AppImage falls through to its placeholder.
 */
export function resolveMediaCandidates(value?: string | null): string[] {
  if (!value) return [];

  const cleaned = cleanMediaValue(value);
  if (!cleaned) return [];

  const candidates: string[] = [];

  if (/^(file:|content:|data:|blob:)/i.test(cleaned)) {
    pushUnique(candidates, cleaned);
    return candidates;
  }

  let external = cleaned;

  if (external.startsWith('//')) {
    external = 'https:' + external;
  } else if (!/^[a-z][a-z0-9+.-]*:/i.test(external)) {
    const looksLikeDomain = /^(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(?:\/|$)/i.test(external);
    if (looksLikeDomain) external = 'https://' + external;
  }

  if (/^https?:\/\//i.test(external)) {
    pushUnique(candidates, googleDriveDirect(external));
    pushUnique(candidates, dropboxDirect(external));
    pushUnique(candidates, githubRaw(external));

    // Android/Expo Go commonly rejects plain HTTP. Try HTTPS first when possible.
    if (/^http:\/\//i.test(external)) {
      pushUnique(candidates, external.replace(/^http:\/\//i, 'https://'));
    }

    pushUnique(candidates, external);

    try {
      const encoded = encodeURI(external);
      pushUnique(candidates, encoded);
    } catch {
      // Keep the original candidate when encoding fails.
    }

    return candidates;
  }

  if (!supabase) {
    pushUnique(candidates, cleaned);
    return candidates;
  }

  const normalized = cleaned.replace(/^\/+/, '').replace(/^media\//, '');
  const publicUrl = supabase.storage.from('media').getPublicUrl(normalized).data.publicUrl;
  pushUnique(candidates, publicUrl);
  pushUnique(candidates, cleaned);

  return candidates;
}

export function resolveMediaUrl(value?: string | null): string | null {
  return resolveMediaCandidates(value)[0] ?? null;
}

export function storagePathFromPublicUrl(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = cleanMediaValue(value);

  if (!/^https?:/i.test(cleaned)) {
    return cleaned.replace(/^\/+/, '').replace(/^media\//, '');
  }

  const markers = [
    '/storage/v1/object/public/media/',
    '/storage/v1/object/sign/media/',
    '/storage/v1/object/authenticated/media/',
  ];

  for (const marker of markers) {
    const index = cleaned.indexOf(marker);
    if (index >= 0) {
      const raw = cleaned.slice(index + marker.length).split('?')[0];
      return decodeURIComponent(raw);
    }
  }

  return null;
}

export async function resolveSignedMediaUrl(value?: string | null): Promise<string | null> {
  if (!supabase || !value) return null;
  const path = storagePathFromPublicUrl(value);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from('media')
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function uploadPublicImage(
  userId: string,
  image: LocalImage,
  folder: string
): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const ext = extensionFor(image);
  const objectPath = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  let arrayBuffer: ArrayBuffer;
  try {
    const localFile = new File(image.uri);
    arrayBuffer = await localFile.arrayBuffer();
  } catch {
    const response = await fetch(image.uri);
    if (!response.ok && !image.uri.startsWith('file:') && !image.uri.startsWith('content:')) {
      throw new Error('Não foi possível ler a imagem selecionada.');
    }
    arrayBuffer = await response.arrayBuffer();
  }

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


function remoteImageType(buffer: ArrayBuffer, contentType?: string | null, sourceUrl?: string) {
  const bytes = new Uint8Array(buffer.slice(0, 16));
  const declared = contentType?.split(';')[0]?.trim().toLowerCase();

  if (declared?.startsWith('image/')) {
    const subtype = declared.split('/')[1];
    const ext = subtype === 'jpeg' ? 'jpg' : subtype === 'svg+xml' ? 'svg' : subtype;
    return { mime: declared, ext: ext || 'jpg' };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { mime: 'image/png', ext: 'png' };
  if (String.fromCharCode(...bytes.slice(0, 3)) === 'GIF') return { mime: 'image/gif', ext: 'gif' };
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) return { mime: 'image/webp', ext: 'webp' };

  const ext = cleanExtension(sourceUrl);
  if (ext) return { mime: ext === 'jpg' ? 'image/jpeg' : 'image/' + ext, ext };
  return null;
}

function extractImageFromHtml(html: string, pageUrl: string) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    /<img[^>]+src=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;

    const raw = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&#x2F;/gi, '/')
      .replace(/&#47;/g, '/');

    try {
      return new URL(raw, pageUrl).toString();
    } catch {
      return raw;
    }
  }

  return null;
}

export async function importRemoteImage(
  userId: string,
  remoteUrl: string,
  folder: string
): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const queue = [...resolveMediaCandidates(remoteUrl)];
  if (!queue.length) throw new Error('URL de imagem vazia ou inválida.');

  const visited = new Set<string>();
  let lastError: unknown = null;

  while (queue.length) {
    const candidate = queue.shift()!;
    if (!/^https?:\/\//i.test(candidate) || visited.has(candidate)) continue;
    visited.add(candidate);

    try {
      const response = await fetch(candidate, {
        method: 'GET',
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,text/html,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        lastError = new Error('HTTP ' + response.status);
        continue;
      }

      const contentType = response.headers.get('content-type')?.toLowerCase() || '';

      if (contentType.includes('text/html')) {
        const html = await response.text();
        const pageImage = extractImageFromHtml(html, candidate);

        if (pageImage) {
          for (const next of resolveMediaCandidates(pageImage)) {
            if (!visited.has(next) && !queue.includes(next)) queue.push(next);
          }
          continue;
        }

        lastError = new Error('A página não informou uma imagem principal.');
        continue;
      }

      const buffer = await response.arrayBuffer();
      if (!buffer.byteLength) {
        lastError = new Error('Arquivo vazio');
        continue;
      }

      const type = remoteImageType(buffer, contentType, candidate);
      if (!type) {
        lastError = new Error('A URL não retornou uma imagem reconhecida.');
        continue;
      }

      const objectPath = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${type.ext}`;
      const { error } = await supabase.storage
        .from('media')
        .upload(objectPath, buffer, {
          contentType: type.mime,
          upsert: false,
          cacheControl: '31536000',
        });

      if (error) throw error;

      const publicUrl = supabase.storage.from('media').getPublicUrl(objectPath).data.publicUrl;
      if (!publicUrl) throw new Error('A imagem foi importada, mas a URL pública não foi criada.');
      return publicUrl;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    'Não foi possível importar essa foto. O link pode exigir login, bloquear download externo ou não expor uma imagem pública.' +
    (lastError instanceof Error && lastError.message ? ' (' + lastError.message + ')' : '')
  );
}
