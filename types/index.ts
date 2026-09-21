export type CarCategory = 'JDM' | 'Euro' | 'Muscle' | 'Supercar' | 'Hot Hatch' | 'Track';

export type Car = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  transmission: string;
  drivetrain: string;
  stockHp: number;
  currentHp: number;
  city: string;
  state: string;
  category: CarCategory;
  image: string;
  modifications: string[];
  tags: string[];
};

export type FeedPost = {
  id: string;
  author: string;
  carName: string;
  image: string;
  caption: string;
  likes: number;
  liked?: boolean;
};

export type CarEvent = {
  id: string;
  title: string;
  date: string;
  place: string;
  city: string;
  category: string;
  attendees: number;
  image: string;
  joined?: boolean;
};
