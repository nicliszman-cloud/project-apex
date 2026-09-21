import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { demoCars, demoEvents, demoPosts } from '@/data/mock';
import { importRemoteImage, LocalImage, normalizeStoredMediaUrl, resolveMediaUrl, storagePathFromPublicUrl, uploadPublicImage } from '@/lib/media';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { Car, CarCategory, CarEvent, FeedPost, MatchSummary, Profile } from '@/types';

type NewCar = Omit<Car, 'id' | 'ownerId' | 'ownerName' | 'ownerAvatar' | 'images'>;
type ProfileUpdate = Partial<Pick<Profile, 'username' | 'displayName' | 'avatarUrl' | 'coverUrl' | 'city' | 'state' | 'bio'>>;

type NewPost = {
  caption: string;
  carId?: string | null;
  image?: LocalImage | null;
  imageUrl?: string | null;
};

type NewEvent = {
  title: string;
  description?: string;
  category: string;
  venueName: string;
  city: string;
  state: string;
  startsAt: string;
  image?: LocalImage | null;
  latitude?: number | null;
  longitude?: number | null;
};

type AppContextValue = {
  cars: Car[];
  posts: FeedPost[];
  events: CarEvent[];
  matches: MatchSummary[];
  likedCarIds: string[];
  profile: Profile | null;
  myUserId: string | null;
  isDemo: boolean;
  loading: boolean;
  enterDemoMode: () => void;
  enterRealMode: () => Promise<void>;
  refreshRemoteData: () => Promise<void>;
  swipeCar: (id: string, action: 'like' | 'pass' | 'save') => Promise<boolean>;
  likeCar: (id: string) => Promise<boolean>;
  togglePostLike: (id: string) => Promise<void>;
  toggleEvent: (id: string) => Promise<void>;
  addCar: (car: NewCar, images?: LocalImage[], remoteUrls?: string[]) => Promise<void>;
  createPost: (post: NewPost) => Promise<void>;
  createEvent: (event: NewEvent) => Promise<void>;
  updateProfile: (values: ProfileUpdate) => Promise<void>;
  updateAvatar: (image: LocalImage) => Promise<void>;
  updateCover: (image: LocalImage) => Promise<void>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);
const FALLBACK_CAR_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=85';
const FALLBACK_EVENT_IMAGE = 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=85';

function normalizeCategory(value: string | null): CarCategory {
  const allowed: CarCategory[] = ['JDM', 'Euro', 'Muscle', 'Supercar', 'Hot Hatch', 'Track', 'Outros'];
  return allowed.includes(value as CarCategory) ? (value as CarCategory) : 'Euro';
}

function eventDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).toUpperCase();
}

function isMissingColumnError(error: any, columns: string[] = []) {
  if (!error) return false;
  if (error.code === '42703' || error.code === 'PGRST204') return true;

  const message = String(error.message || error.details || '').toLowerCase();
  return columns.some((column) => message.includes(column.toLowerCase()))
    && (message.includes('column') || message.includes('schema cache'));
}

async function persistRemoteImage(userId: string, value: string, folder: string) {
  const raw = value.trim();
  if (!raw) return null;

  try {
    return await importRemoteImage(userId, raw, folder);
  } catch {
    return resolveMediaUrl(raw) || raw;
  }
}

export function AppProvider({ children }: PropsWithChildren) {
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(Boolean(hasSupabaseConfig));
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [events, setEvents] = useState<CarEvent[]>([]);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [likedCarIds, setLikedCarIds] = useState<string[]>([]);

  const loadRemoteData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id ?? null;
      setMyUserId(userId);

      if (!userId) {
        setProfile(null);
        setCars([]);
        setPosts([]);
        setEvents([]);
        setMatches([]);
        return;
      }

      const [
        profileResult,
        carResult,
        carPhotoResult,
        postResult,
        postLikeResult,
        commentResult,
        eventResult,
        attendeeResult,
        matchResult,
        swipeResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name, avatar_url, cover_url, city, state, bio'),
        supabase.from('cars').select('id, owner_id, make, model, version, model_year, engine, transmission, drivetrain, fuel, description, stock_hp, current_hp, category, city, state, cover_url, modifications, created_at').order('created_at', { ascending: false }),
        supabase.from('car_photos').select('car_id, url, position').order('position', { ascending: true }),
        supabase.from('posts').select('id, author_id, car_id, caption, media_url, created_at').order('created_at', { ascending: false }),
        supabase.from('post_likes').select('post_id, user_id'),
        supabase.from('comments').select('post_id'),
        supabase.from('events').select('id, organizer_id, title, description, category, city, state, venue_name, starts_at, cover_url, created_at').order('starts_at', { ascending: true }),
        supabase.from('event_attendees').select('event_id, user_id'),
        supabase.from('matches').select('id, user_a, user_b, car_a, car_b, created_at').order('created_at', { ascending: false }),
        supabase.from('swipes').select('target_car_id, action').eq('user_id', userId),
      ]);

      const queryErrors = [
        ['profiles', profileResult.error],
        ['cars', carResult.error],
        ['car_photos', carPhotoResult.error],
        ['posts', postResult.error],
        ['post_likes', postLikeResult.error],
        ['comments', commentResult.error],
        ['events', eventResult.error],
        ['event_attendees', attendeeResult.error],
        ['matches', matchResult.error],
        ['swipes', swipeResult.error],
      ].filter(([, error]) => Boolean(error));

      for (const [table, error] of queryErrors) {
        console.warn('StreetClub data load:', table, (error as any)?.message ?? error);
      }

      let carRows: any[] = carResult.data ?? [];
      if (isMissingColumnError(carResult.error, ['version', 'fuel', 'description'])) {
        const fallbackCars = await supabase
          .from('cars')
          .select('id, owner_id, make, model, model_year, engine, transmission, drivetrain, stock_hp, current_hp, category, city, state, cover_url, modifications, created_at')
          .order('created_at', { ascending: false });
        if (!fallbackCars.error) carRows = fallbackCars.data ?? [];
      }

      let profileRows: any[] = profileResult.data ?? [];
      if (isMissingColumnError(profileResult.error, ['cover_url'])) {
        const fallbackProfiles = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, city, state, bio');
        if (!fallbackProfiles.error) profileRows = fallbackProfiles.data ?? [];
      }
      const profiles = new Map(profileRows.map((row: any) => [row.id, row]));
      const me: any = profiles.get(userId);

      setProfile(me ? {
        id: me.id,
        username: me.username,
        displayName: me.display_name || 'Driver',
        avatarUrl: normalizeStoredMediaUrl(me.avatar_url),
        coverUrl: normalizeStoredMediaUrl(me.cover_url),
        city: me.city,
        state: me.state,
        bio: me.bio,
      } : null);

      const photosByCar = new Map<string, string[]>();
      for (const row of carPhotoResult.data ?? []) {
        const normalized = normalizeStoredMediaUrl(row.url);
        if (!normalized) continue;
        const list = photosByCar.get(row.car_id) ?? [];
        list.push(normalized);
        photosByCar.set(row.car_id, list);
      }

      const mappedCars: Car[] = carRows.map((row: any) => {
        const owner: any = profiles.get(row.owner_id);
        const displayName = owner?.display_name || owner?.username || 'Driver';
        const storedPhotos = photosByCar.get(row.id) ?? [];
        const storedCover = normalizeStoredMediaUrl(row.cover_url);
        const images = [...new Set([storedCover, ...storedPhotos].filter(Boolean))] as string[];
        const cover = images[0] || FALLBACK_CAR_IMAGE;
        return {
          id: row.id,
          ownerId: row.owner_id,
          ownerName: displayName,
          ownerAvatar: normalizeStoredMediaUrl(owner?.avatar_url) || displayName.slice(0, 1).toUpperCase(),
          make: row.make,
          model: row.model,
          version: row.version ?? null,
          year: row.model_year ?? 0,
          engine: row.engine ?? 'Não informado',
          transmission: row.transmission ?? 'Não informado',
          drivetrain: row.drivetrain ?? 'Não informado',
          fuel: row.fuel ?? null,
          description: row.description ?? null,
          stockHp: row.stock_hp ?? 0,
          currentHp: row.current_hp ?? row.stock_hp ?? 0,
          city: row.city ?? owner?.city ?? 'Não informado',
          state: row.state ?? owner?.state ?? 'BR',
          category: normalizeCategory(row.category),
          image: cover,
          images: images.length ? images : [cover],
          modifications: Array.isArray(row.modifications) ? row.modifications : [],
          tags: [normalizeCategory(row.category), 'Build'],
        };
      });
      // Migrate legacy external covers owned by this account into StreetClub Storage.
      // This removes hotlink/CORS/provider differences between screens on mobile.
      for (const car of mappedCars.filter((item) => item.ownerId === userId)) {
        if (!/^https?:\/\//i.test(car.image) || storagePathFromPublicUrl(car.image)) continue;
        try {
          const mirrored = await importRemoteImage(userId, car.image, `cars/${car.id}/legacy`);
          if (mirrored) {
            const previous = car.image;
            car.image = mirrored;
            car.images = [mirrored, ...(car.images || []).filter((uri) => uri !== previous && uri !== mirrored)];
            await supabase.from('cars').update({ cover_url: mirrored }).eq('id', car.id);
          }
        } catch {
          // Keep the original external URL and AppImage fallbacks.
        }
      }

      setCars(mappedCars);

      const carsById = new Map(mappedCars.map((car) => [car.id, car]));
      const likes = postLikeResult.data ?? [];
      const commentRows = commentResult.data ?? [];
      const mappedPosts: FeedPost[] = (postResult.data ?? []).map((row: any) => {
        const author: any = profiles.get(row.author_id);
        const car = row.car_id ? carsById.get(row.car_id) : undefined;
        const postLikes = likes.filter((like: any) => like.post_id === row.id);
        return {
          id: row.id,
          authorId: row.author_id,
          author: author?.display_name || author?.username || 'Driver',
          authorUsername: author?.username || null,
          authorAvatar: normalizeStoredMediaUrl(author?.avatar_url),
          authorCity: author?.city || null,
          authorState: author?.state || null,
          carName: car ? `${car.make} ${car.model}` : 'Projeto',
          carId: row.car_id,
          image: normalizeStoredMediaUrl(row.media_url) || car?.image || FALLBACK_CAR_IMAGE,
          caption: row.caption ?? '',
          likes: postLikes.length,
          comments: commentRows.filter((comment: any) => comment.post_id === row.id).length,
          liked: postLikes.some((like: any) => like.user_id === userId),
          createdAt: row.created_at,
        };
      });

      for (const post of mappedPosts.filter((item) => item.authorId === userId)) {
        const originalRow: any = (postResult.data ?? []).find((row: any) => row.id === post.id);
        const normalizedOriginal = normalizeStoredMediaUrl(originalRow?.media_url);

        // Old file:// values cannot survive an app restart. If the post is linked
        // to a car, permanently repair it using the car cover.
        if (!normalizedOriginal && post.carId) {
          const car = carsById.get(post.carId);
          if (car?.image) {
            post.image = car.image;
            await supabase.from('posts').update({ media_url: car.image }).eq('id', post.id);
          }
          continue;
        }

        if (!/^https?:\/\//i.test(post.image) || storagePathFromPublicUrl(post.image)) continue;
        try {
          const mirrored = await importRemoteImage(userId, post.image, 'posts/legacy');
          if (mirrored) {
            post.image = mirrored;
            await supabase.from('posts').update({ media_url: mirrored }).eq('id', post.id);
          }
        } catch {
          // Keep the remote URL; AppImage can still resolve common share links.
        }
      }

      setPosts(mappedPosts);

      const attendance = attendeeResult.data ?? [];
      setEvents((eventResult.data ?? []).map((row: any) => {
        const eventAttendance = attendance.filter((item: any) => item.event_id === row.id);
        return {
          id: row.id,
          organizerId: row.organizer_id,
          title: row.title,
          date: eventDate(row.starts_at),
          place: row.venue_name || 'Local a confirmar',
          city: [row.city, row.state].filter(Boolean).join(' • '),
          category: row.category || 'Meet',
          attendees: eventAttendance.length,
          image: normalizeStoredMediaUrl(row.cover_url) || FALLBACK_EVENT_IMAGE,
          joined: eventAttendance.some((item: any) => item.user_id === userId),
          description: row.description,
          startsAt: row.starts_at,
        };
      }));

      setMatches((matchResult.data ?? []).map((row: any) => {
        const userIsA = row.user_a === userId;
        const partnerId = userIsA ? row.user_b : row.user_a;
        const partner: any = profiles.get(partnerId);
        const partnerCar = carsById.get(userIsA ? row.car_b : row.car_a);
        return {
          id: row.id,
          partnerId,
          partnerName: partner?.display_name || partner?.username || 'Driver',
          partnerAvatar: normalizeStoredMediaUrl(partner?.avatar_url),
          partnerCarName: partnerCar ? `${partnerCar.make} ${partnerCar.model}` : 'Carro',
          partnerCarImage: partnerCar?.image,
          createdAt: row.created_at,
        };
      }));

      setLikedCarIds((swipeResult.data ?? []).filter((row: any) => row.action === 'like').map((row: any) => row.target_car_id));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    loadRemoteData().catch((error) => {
      console.warn('StreetClub initial load:', error);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id) {
        setIsDemo(false);
        loadRemoteData().catch(() => setLoading(false));
      } else if (!isDemo) {
        setMyUserId(null);
        setProfile(null);
        setCars([]);
        setPosts([]);
        setEvents([]);
        setMatches([]);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [loadRemoteData, isDemo]);

  function enterDemoMode() {
    setIsDemo(true);
    setMyUserId('me');
    setProfile({ id: 'me', username: 'driver', displayName: 'Sua garagem', city: 'Brasil', state: 'BR' });
    setCars(demoCars);
    setPosts(demoPosts);
    setEvents(demoEvents);
    setMatches([]);
    setLoading(false);
  }

  async function enterRealMode() {
    setIsDemo(false);
    await loadRemoteData();
  }

  async function swipeCar(id: string, action: 'like' | 'pass' | 'save') {
    if (isDemo) {
      if (action === 'like') setLikedCarIds((current) => current.includes(id) ? current : [...current, id]);
      return action === 'like' && id === 'c2';
    }
    if (!supabase || !myUserId) return false;

    const { data, error } = await supabase.rpc('swipe_car', {
      p_target_car: id,
      p_action: action,
    });
    if (error) throw error;

    if (action === 'like') {
      setLikedCarIds((current) => current.includes(id) ? current : [...current, id]);
    }
    if (data) await loadRemoteData();
    return Boolean(data);
  }

  const likeCar = (id: string) => swipeCar(id, 'like');

  async function togglePostLike(id: string) {
    if (isDemo) {
      setPosts((current) => current.map((post) => post.id === id
        ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
        : post));
      return;
    }
    if (!supabase || !myUserId) return;

    const post = posts.find((item) => item.id === id);
    if (!post) return;

    const result = post.liked
      ? await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', myUserId)
      : await supabase.from('post_likes').insert({ post_id: id, user_id: myUserId });

    if (result.error) throw result.error;
    setPosts((current) => current.map((item) => item.id === id
      ? { ...item, liked: !item.liked, likes: item.likes + (item.liked ? -1 : 1) }
      : item));
  }

  async function toggleEvent(id: string) {
    if (isDemo) {
      setEvents((current) => current.map((event) => event.id === id
        ? { ...event, joined: !event.joined, attendees: event.attendees + (event.joined ? -1 : 1) }
        : event));
      return;
    }
    if (!supabase || !myUserId) return;

    const event = events.find((item) => item.id === id);
    if (!event) return;

    const result = event.joined
      ? await supabase.from('event_attendees').delete().eq('event_id', id).eq('user_id', myUserId)
      : await supabase.from('event_attendees').insert({ event_id: id, user_id: myUserId });

    if (result.error) throw result.error;
    setEvents((current) => current.map((item) => item.id === id
      ? { ...item, joined: !item.joined, attendees: item.attendees + (item.joined ? -1 : 1) }
      : item));
  }

  async function addCar(car: NewCar, images: LocalImage[] = [], remoteUrls: string[] = []) {
    if (isDemo) {
      const demoImages = [...images.map((item) => item.uri), ...remoteUrls].filter(Boolean).slice(0, 6);
      const cover = demoImages[0] || car.image;
      setCars((current) => [{
        ...car,
        image: cover,
        images: demoImages.length ? demoImages : [cover],
        id: `mine-${Date.now()}`,
        ownerId: 'me',
        ownerName: profile?.displayName || 'Você',
        ownerAvatar: 'V',
      }, ...current]);
      return;
    }
    if (!supabase || !myUserId) throw new Error('Faça login antes de adicionar um carro.');

    const { data: inserted, error } = await supabase.from('cars').insert({
      owner_id: myUserId,
      make: car.make,
      model: car.model,
      version: car.version || null,
      model_year: car.year,
      engine: car.engine,
      transmission: car.transmission,
      drivetrain: car.drivetrain,
      fuel: car.fuel || null,
      description: car.description || null,
      stock_hp: car.stockHp,
      current_hp: car.currentHp,
      category: car.category,
      city: car.city,
      state: car.state,
      cover_url: null,
      modifications: car.modifications,
    }).select('id').single();

    if (error) throw error;

    if (images.length || remoteUrls.length) {
      const urls: string[] = [];
      for (const image of images.slice(0, 6)) {
        urls.push(await uploadPublicImage(myUserId, image, `cars/${inserted.id}`));
      }

      const remaining = Math.max(0, 6 - urls.length);
      for (const remoteUrl of remoteUrls.slice(0, remaining)) {
        const resolved = await persistRemoteImage(myUserId, remoteUrl, `cars/${inserted.id}/remote`);
        if (resolved) urls.push(resolved);
      }

      if (urls.length) {
        const { error: photoError } = await supabase.from('car_photos').insert(
          urls.map((url, position) => ({ car_id: inserted.id, url, position }))
        );
        if (photoError) throw photoError;

        const { error: coverError } = await supabase.from('cars').update({ cover_url: urls[0] }).eq('id', inserted.id);
        if (coverError) throw coverError;
      }
    }

    await loadRemoteData();
  }

  async function createPost(post: NewPost) {
    const externalUrl = post.imageUrl?.trim() || null;
    if (!post.image && !externalUrl) throw new Error('Adicione uma foto ou URL para publicar.');

    if (isDemo) {
      const image = post.image?.uri || resolveMediaUrl(externalUrl) || externalUrl || '';
      setPosts((current) => [{
        id: `demo-post-${Date.now()}`,
        authorId: 'me',
        author: profile?.displayName || 'Você',
        authorUsername: profile?.username || null,
        authorAvatar: profile?.avatarUrl || null,
        authorCity: profile?.city || null,
        authorState: profile?.state || null,
        carName: cars.find((car) => car.id === post.carId)?.model || 'Projeto',
        carId: post.carId || null,
        image,
        caption: post.caption,
        likes: 0,
        comments: 0,
        liked: false,
        createdAt: new Date().toISOString(),
      }, ...current]);
      return;
    }
    if (!supabase || !myUserId) throw new Error('Faça login para publicar.');

    const mediaUrl = post.image
      ? await uploadPublicImage(myUserId, post.image, 'posts')
      : externalUrl
        ? await persistRemoteImage(myUserId, externalUrl, 'posts/remote')
        : null;

    if (!mediaUrl) throw new Error('A imagem da publicação não é válida.');

    const { error } = await supabase.from('posts').insert({
      author_id: myUserId,
      car_id: post.carId || null,
      caption: post.caption,
      media_url: mediaUrl,
    });
    if (error) throw error;
    await loadRemoteData();
  }

  async function createEvent(event: NewEvent) {
    if (isDemo) {
      setEvents((current) => [{
        id: `demo-event-${Date.now()}`,
        title: event.title,
        date: eventDate(event.startsAt),
        place: event.venueName,
        city: [event.city, event.state].filter(Boolean).join(' • '),
        category: event.category,
        attendees: 1,
        image: event.image?.uri || FALLBACK_EVENT_IMAGE,
        joined: true,
      }, ...current]);
      return;
    }
    if (!supabase || !myUserId) throw new Error('Faça login para criar um evento.');

    const coverUrl = event.image ? await uploadPublicImage(myUserId, event.image, 'events') : null;
    const basePayload = {
      organizer_id: myUserId,
      title: event.title,
      description: event.description || null,
      category: event.category,
      city: event.city,
      state: event.state,
      venue_name: event.venueName,
      starts_at: event.startsAt,
      cover_url: coverUrl,
    };

    let result = await supabase.from('events').insert({
      ...basePayload,
      latitude: event.latitude ?? null,
      longitude: event.longitude ?? null,
    }).select('id').single();

    if (isMissingColumnError(result.error, ['latitude', 'longitude'])) {
      result = await supabase.from('events').insert(basePayload).select('id').single();
    }

    const { data: inserted, error } = result;
    if (error) throw error;
    if (!inserted) throw new Error('Não foi possível criar o evento.');

    const { error: attendeeError } = await supabase.from('event_attendees').insert({
      event_id: inserted.id,
      user_id: myUserId,
    });
    if (attendeeError) throw attendeeError;
    await loadRemoteData();
  }

  async function updateProfile(values: ProfileUpdate) {
    if (isDemo) {
      setProfile((current) => current ? { ...current, ...values } : current);
      return;
    }
    if (!supabase || !myUserId) throw new Error('Sessão não encontrada.');

    const payload: Record<string, string | null | undefined> = {};
    if ('username' in values) payload.username = values.username || null;
    if ('displayName' in values) payload.display_name = values.displayName;
    if ('avatarUrl' in values) payload.avatar_url = values.avatarUrl || null;
    if ('city' in values) payload.city = values.city || null;
    if ('state' in values) payload.state = values.state || null;
    if ('bio' in values) payload.bio = values.bio || null;

    if (Object.keys(payload).length) {
      const { error } = await supabase.from('profiles').update(payload).eq('id', myUserId);
      if (error) throw error;
    }

    if ('coverUrl' in values) {
      const { error: coverError } = await supabase
        .from('profiles')
        .update({ cover_url: values.coverUrl || null })
        .eq('id', myUserId);

      if (coverError) {
        if (isMissingColumnError(coverError, ['cover_url'])) {
          throw new Error('A coluna de capa ainda não foi ativada no Supabase. Execute a migration streetclub_profile_cover_hotfix.sql no SQL Editor e tente novamente.');
        }
        throw coverError;
      }
    }

    await loadRemoteData();
  }

  async function updateAvatar(image: LocalImage) {
    if (isDemo) {
      setProfile((current) => current ? { ...current, avatarUrl: image.uri } : current);
      return;
    }
    if (!myUserId) throw new Error('Sessão não encontrada.');
    const avatarUrl = await uploadPublicImage(myUserId, image, 'avatar');
    await updateProfile({ avatarUrl });
  }

  async function updateCover(image: LocalImage) {
    if (isDemo) {
      setProfile((current) => current ? { ...current, coverUrl: image.uri } : current);
      return;
    }
    if (!myUserId) throw new Error('Sessão não encontrada.');
    const coverUrl = await uploadPublicImage(myUserId, image, 'profile-cover');
    await updateProfile({ coverUrl });
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setIsDemo(false);
    setMyUserId(null);
    setProfile(null);
    setCars([]);
    setPosts([]);
    setEvents([]);
    setMatches([]);
  }

  const value = useMemo(() => ({
    cars, posts, events, matches, likedCarIds, profile, myUserId, isDemo, loading,
    enterDemoMode, enterRealMode, refreshRemoteData: loadRemoteData, swipeCar, likeCar,
    togglePostLike, toggleEvent, addCar, createPost, createEvent, updateProfile, updateAvatar, updateCover, signOut,
  }), [cars, posts, events, matches, likedCarIds, profile, myUserId, isDemo, loading, loadRemoteData]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp precisa estar dentro de AppProvider');
  return context;
}
