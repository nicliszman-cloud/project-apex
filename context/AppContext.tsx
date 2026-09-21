import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { demoCars, demoEvents, demoPosts } from '@/data/mock';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { Car, CarCategory, CarEvent, FeedPost, Profile } from '@/types';

type NewCar = Omit<Car, 'id' | 'ownerId' | 'ownerName' | 'ownerAvatar'>;
type ProfileUpdate = Partial<Pick<Profile, 'username' | 'displayName' | 'avatarUrl' | 'city' | 'state' | 'bio'>>;

type AppContextValue = {
  cars: Car[];
  posts: FeedPost[];
  events: CarEvent[];
  likedCarIds: string[];
  profile: Profile | null;
  myUserId: string | null;
  isDemo: boolean;
  loading: boolean;
  enterDemoMode: () => void;
  enterRealMode: () => Promise<void>;
  refreshRemoteData: () => Promise<void>;
  likeCar: (id: string) => Promise<boolean>;
  togglePostLike: (id: string) => void;
  toggleEvent: (id: string) => void;
  addCar: (car: NewCar) => Promise<void>;
  updateProfile: (values: ProfileUpdate) => Promise<void>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);
const FALLBACK_CAR_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=85';

function normalizeCategory(value: string | null): CarCategory {
  const allowed: CarCategory[] = ['JDM', 'Euro', 'Muscle', 'Supercar', 'Hot Hatch', 'Track'];
  return allowed.includes(value as CarCategory) ? (value as CarCategory) : 'Euro';
}

export function AppProvider({ children }: PropsWithChildren) {
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(Boolean(hasSupabaseConfig));
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [events, setEvents] = useState<CarEvent[]>([]);
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
        return;
      }

      const [{ data: profileRows, error: profileError }, { data: carRows, error: carError }] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name, avatar_url, city, state, bio'),
        supabase.from('cars').select('id, owner_id, make, model, model_year, engine, transmission, drivetrain, stock_hp, current_hp, category, city, state, cover_url, modifications').order('created_at', { ascending: false }),
      ]);

      if (profileError) throw profileError;
      if (carError) throw carError;

      const profiles = new Map((profileRows ?? []).map((row: any) => [row.id, row]));
      const me: any = profiles.get(userId);
      setProfile(me ? {
        id: me.id,
        username: me.username,
        displayName: me.display_name || 'Driver',
        avatarUrl: me.avatar_url,
        city: me.city,
        state: me.state,
        bio: me.bio,
      } : null);

      setCars((carRows ?? []).map((row: any) => {
        const owner: any = profiles.get(row.owner_id);
        const displayName = owner?.display_name || owner?.username || 'Driver';
        return {
          id: row.id,
          ownerId: row.owner_id,
          ownerName: displayName,
          ownerAvatar: displayName.slice(0, 1).toUpperCase(),
          make: row.make,
          model: row.model,
          year: row.model_year ?? 0,
          engine: row.engine ?? 'Não informado',
          transmission: row.transmission ?? 'Não informado',
          drivetrain: row.drivetrain ?? 'Não informado',
          stockHp: row.stock_hp ?? 0,
          currentHp: row.current_hp ?? row.stock_hp ?? 0,
          city: row.city ?? owner?.city ?? 'Não informado',
          state: row.state ?? owner?.state ?? 'BR',
          category: normalizeCategory(row.category),
          image: row.cover_url || FALLBACK_CAR_IMAGE,
          modifications: Array.isArray(row.modifications) ? row.modifications : [],
          tags: [normalizeCategory(row.category), 'Build'],
        } satisfies Car;
      }));

      setPosts([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    loadRemoteData().catch(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id) {
        setIsDemo(false);
        loadRemoteData().catch(() => setLoading(false));
      } else if (!isDemo) {
        setMyUserId(null);
        setProfile(null);
        setCars([]);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [loadRemoteData, isDemo]);

  function enterDemoMode() {
    setIsDemo(true);
    setMyUserId('me');
    setProfile({ id: 'me', username: 'driver', displayName: 'Sua garagem', city: 'Brasil', state: 'BR' });
    setCars(demoCars);
    setPosts(demoPosts);
    setEvents(demoEvents);
    setLoading(false);
  }

  async function enterRealMode() {
    setIsDemo(false);
    await loadRemoteData();
  }

  async function likeCar(id: string) {
    setLikedCarIds((current) => current.includes(id) ? current : [...current, id]);
    if (isDemo) return id === 'c2';
    if (!supabase || !myUserId) return false;

    const { error } = await supabase.from('swipes').upsert({
      user_id: myUserId,
      target_car_id: id,
      action: 'like',
    }, { onConflict: 'user_id,target_car_id' });
    if (error) throw error;
    return false;
  }

  function togglePostLike(id: string) {
    if (!isDemo) return;
    setPosts((current) => current.map((post) => post.id === id
      ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
      : post));
  }

  function toggleEvent(id: string) {
    if (!isDemo) return;
    setEvents((current) => current.map((event) => event.id === id
      ? { ...event, joined: !event.joined, attendees: event.attendees + (event.joined ? -1 : 1) }
      : event));
  }

  async function addCar(car: NewCar) {
    if (isDemo) {
      setCars((current) => [{ ...car, id: `mine-${Date.now()}`, ownerId: 'me', ownerName: profile?.displayName || 'Você', ownerAvatar: 'V' }, ...current]);
      return;
    }
    if (!supabase || !myUserId) throw new Error('Faça login antes de adicionar um carro.');

    const { error } = await supabase.from('cars').insert({
      owner_id: myUserId,
      make: car.make,
      model: car.model,
      model_year: car.year,
      engine: car.engine,
      transmission: car.transmission,
      drivetrain: car.drivetrain,
      stock_hp: car.stockHp,
      current_hp: car.currentHp,
      category: car.category,
      city: car.city,
      state: car.state,
      cover_url: car.image,
      modifications: car.modifications,
    });
    if (error) throw error;
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

    const { error } = await supabase.from('profiles').update(payload).eq('id', myUserId);
    if (error) throw error;
    await loadRemoteData();
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setIsDemo(false);
    setMyUserId(null);
    setProfile(null);
    setCars([]);
    setPosts([]);
    setEvents([]);
  }

  const value = useMemo(() => ({
    cars, posts, events, likedCarIds, profile, myUserId, isDemo, loading,
    enterDemoMode, enterRealMode, refreshRemoteData: loadRemoteData, likeCar,
    togglePostLike, toggleEvent, addCar, updateProfile, signOut,
  }), [cars, posts, events, likedCarIds, profile, myUserId, isDemo, loading, loadRemoteData]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp precisa estar dentro de AppProvider');
  return context;
}
