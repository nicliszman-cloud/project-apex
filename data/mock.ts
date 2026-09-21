import { Car, CarEvent, FeedPost } from '@/types';

export const demoCars: Car[] = [
  {
    id: 'c1', ownerId: 'u2', ownerName: 'Rafa', ownerAvatar: 'R',
    make: 'Nissan', model: 'GT-R R35', year: 2021, engine: '3.8 V6 biturbo',
    transmission: 'DCT 6 marchas', drivetrain: 'AWD', stockHp: 572, currentHp: 710,
    city: 'Curitiba', state: 'PR', category: 'JDM',
    image: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1400&q=85',
    modifications: ['Stage 2', 'Downpipes', 'Escape titanium', 'Rodas forjadas'],
    tags: ['Meets', 'Track', 'Night drive'],
  },
  {
    id: 'c2', ownerId: 'u3', ownerName: 'Marina', ownerAvatar: 'M',
    make: 'BMW', model: 'M3 Competition', year: 2024, engine: '3.0 I6 biturbo',
    transmission: 'Automático 8 marchas', drivetrain: 'AWD', stockHp: 510, currentHp: 610,
    city: 'São Paulo', state: 'SP', category: 'Euro',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=85',
    modifications: ['Stage 1', 'Downpipe', 'Suspensão coilover', 'Rodas 20”'],
    tags: ['Euro', 'Meets', 'Build'],
  },
  {
    id: 'c3', ownerId: 'u4', ownerName: 'Caio', ownerAvatar: 'C',
    make: 'Ford', model: 'Mustang GT', year: 2023, engine: '5.0 V8',
    transmission: 'Automático 10 marchas', drivetrain: 'RWD', stockHp: 483, currentHp: 525,
    city: 'Florianópolis', state: 'SC', category: 'Muscle',
    image: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1400&q=85',
    modifications: ['Cat-back', 'Intake', 'Remap'],
    tags: ['V8', 'Road trip', 'Meets'],
  },
  {
    id: 'c4', ownerId: 'u5', ownerName: 'Leo', ownerAvatar: 'L',
    make: 'Porsche', model: '911 GT3', year: 2022, engine: '4.0 Flat-6 aspirado',
    transmission: 'PDK 7 marchas', drivetrain: 'RWD', stockHp: 510, currentHp: 510,
    city: 'Brasília', state: 'DF', category: 'Track',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85',
    modifications: ['Setup de pista', 'Pastilhas endurance', 'Semi-slick'],
    tags: ['Track day', 'OEM+', 'Circuit'],
  },
];

export const demoPosts: FeedPost[] = [
  { id: 'p1', author: 'Marina', carName: 'BMW M3 Competition', image: demoCars[1].image, caption: 'Acerto novo pronto. Próxima parada: track day. 🏁', likes: 438 },
  { id: 'p2', author: 'Rafa', carName: 'Nissan GT-R R35', image: demoCars[0].image, caption: 'Finalmente terminei o escape. O projeto está ficando do jeito que eu queria.', likes: 721 },
];

export const demoEvents: CarEvent[] = [
  { id: 'e1', title: 'Cars & Coffee Paraná', date: '27 SET • 09:00', place: 'Centro de Eventos', city: 'Curitiba • PR', category: 'Meet', attendees: 184, image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=85' },
  { id: 'e2', title: 'Track Day Experience', date: '04 OUT • 08:00', place: 'Autódromo', city: 'São Paulo • SP', category: 'Track Day', attendees: 96, image: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1400&q=85' },
  { id: 'e3', title: 'JDM Night Meet', date: '10 OUT • 20:00', place: 'Local divulgado aos inscritos', city: 'Florianópolis • SC', category: 'JDM', attendees: 132, image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=85' },
];
