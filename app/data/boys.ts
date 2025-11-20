export interface Boy {
  id: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  isHot: boolean;
  isPro: boolean;
  category: string;
}

export const differentPersonalitiesBoys: Boy[] = [
  {
    id: 201,
    name: 'Alex',
    description: 'The Charming AI Boyfriend',
    price: '$2.99',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
    isHot: true,
    isPro: false,
    category: 'Different Personalities',
  },
  {
    id: 202,
    name: 'Marcus',
    description: 'The Confident AI Boyfriend',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    isHot: false,
    isPro: true,
    category: 'Different Personalities',
  },
  {
    id: 203,
    name: 'Ryan',
    description: 'The Sweet AI Boyfriend',
    price: '$2.99',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    isHot: true,
    isPro: false,
    category: 'Different Personalities',
  },
  {
    id: 204,
    name: 'Jake',
    description: 'The Funny AI Boyfriend',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop',
    isHot: false,
    isPro: true,
    category: 'Different Personalities',
  },
  {
    id: 205,
    name: 'David',
    description: 'The Mysterious AI Boyfriend',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'Different Personalities',
  },
  {
    id: 206,
    name: 'Chris',
    description: 'The Adventurous AI Boyfriend',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=600&fit=crop',
    isHot: false,
    isPro: true,
    category: 'Different Personalities',
  },
  {
    id: 207,
    name: 'Tyler',
    description: 'The Romantic AI Boyfriend',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'Different Personalities',
  },
  {
    id: 208,
    name: 'Nathan',
    description: 'The Intellectual AI Boyfriend',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=600&fit=crop',
    isHot: false,
    isPro: false,
    category: 'Different Personalities',
  },
];

export const fantasyKinksBoys: Boy[] = [
  {
    id: 209,
    name: 'Dante',
    description: 'The Dominant AI Boyfriend',
    price: '$5.99',
    imageUrl: 'https://img.freepik.com/premium-photo/portrait-handsome-man_776674-782365.jpg',
    isHot: true,
    isPro: true,
    category: 'Fantasy & Kinks',
  },
  {
    id: 210,
    name: 'Sebastian',
    description: 'The Seductive AI Boyfriend',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'Fantasy & Kinks',
  },
  {
    id: 211,
    name: 'Hunter',
    description: 'The Bad Boy AI Boyfriend',
    price: '$5.99',
    imageUrl: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'Fantasy & Kinks',
  },
  {
    id: 212,
    name: 'Xavier',
    description: 'The Possessive AI Boyfriend',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=400&h=600&fit=crop',
    isHot: false,
    isPro: true,
    category: 'Fantasy & Kinks',
  },
  {
    id: 213,
    name: 'Liam',
    description: 'The Passionate AI Boyfriend',
    price: '$5.99',
    imageUrl: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'Fantasy & Kinks',
  },
  {
    id: 214,
    name: 'Blake',
    description: 'The Intense AI Boyfriend',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'Fantasy & Kinks',
  },
  {
    id: 215,
    name: 'Zane',
    description: 'The Wild AI Boyfriend',
    price: '$5.99',
    imageUrl: 'https://img.freepik.com/premium-photo/handsome-man-with-strong-gaze-exuding-elegance-confidence-warm-natural-light_1283588-3863.jpg?w=360',
    isHot: true,
    isPro: true,
    category: 'Fantasy & Kinks',
  },
  {
    id: 216,
    name: 'Phoenix',
    description: 'The Daring AI Boyfriend',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=600&fit=crop',
    isHot: false,
    isPro: true,
    category: 'Fantasy & Kinks',
  },
];

export const allBoys: Boy[] = [
  ...differentPersonalitiesBoys,
  ...fantasyKinksBoys,
];

