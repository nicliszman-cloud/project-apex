export type CarCategory = 'JDM' | 'Euro' | 'Muscle' | 'Supercar' | 'Hot Hatch' | 'Track' | 'Outros';

export type Profile = {
  id: string;
  username?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
};

export type Car = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  make: string;
  model: string;
  version?: string | null;
  year: number;
  engine: string;
  transmission: string;
  drivetrain: string;
  fuel?: string | null;
  description?: string | null;
  stockHp: number;
  currentHp: number;
  city: string;
  state: string;
  category: CarCategory;
  image: string;
  images?: string[];
  modifications: string[];
  tags: string[];
};

export type FeedPost = {
  id: string;
  authorId?: string;
  author: string;
  authorUsername?: string | null;
  authorAvatar?: string | null;
  authorCity?: string | null;
  authorState?: string | null;
  carName: string;
  carId?: string | null;
  image: string;
  caption: string;
  likes: number;
  comments?: number;
  liked?: boolean;
  createdAt?: string;
};

export type CarEvent = {
  id: string;
  organizerId?: string;
  title: string;
  date: string;
  place: string;
  city: string;
  category: string;
  attendees: number;
  image: string;
  joined?: boolean;
  description?: string | null;
  startsAt?: string;
};

export type MatchSummary = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string | null;
  partnerCarName: string;
  partnerCarImage?: string | null;
  createdAt: string;
};
