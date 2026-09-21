import React, { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { demoCars, demoEvents, demoPosts } from '@/data/mock';
import { Car, CarEvent, FeedPost } from '@/types';

type AppContextValue = {
  cars: Car[];
  posts: FeedPost[];
  events: CarEvent[];
  likedCarIds: string[];
  likeCar: (id: string) => boolean;
  togglePostLike: (id: string) => void;
  toggleEvent: (id: string) => void;
  addCar: (car: Omit<Car, 'id' | 'ownerId' | 'ownerName' | 'ownerAvatar'>) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [cars, setCars] = useState(demoCars);
  const [posts, setPosts] = useState(demoPosts);
  const [events, setEvents] = useState(demoEvents);
  const [likedCarIds, setLikedCarIds] = useState<string[]>([]);

  function likeCar(id: string) {
    setLikedCarIds((current) => current.includes(id) ? current : [...current, id]);
    return id === 'c2';
  }

  function togglePostLike(id: string) {
    setPosts((current) => current.map((post) => post.id === id
      ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
      : post));
  }

  function toggleEvent(id: string) {
    setEvents((current) => current.map((event) => event.id === id
      ? { ...event, joined: !event.joined, attendees: event.attendees + (event.joined ? -1 : 1) }
      : event));
  }

  function addCar(car: Omit<Car, 'id' | 'ownerId' | 'ownerName' | 'ownerAvatar'>) {
    setCars((current) => [{
      ...car,
      id: `mine-${Date.now()}`,
      ownerId: 'me',
      ownerName: 'Você',
      ownerAvatar: 'V',
    }, ...current]);
  }

  const value = useMemo(() => ({ cars, posts, events, likedCarIds, likeCar, togglePostLike, toggleEvent, addCar }), [cars, posts, events, likedCarIds]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp precisa estar dentro de AppProvider');
  return context;
}
