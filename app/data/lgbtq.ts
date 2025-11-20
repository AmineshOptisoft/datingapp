export interface LGBTQCompanion {
  id: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  isHot: boolean;
  isPro: boolean;
  category: string;
}

export const lgbtqCompanions: LGBTQCompanion[] = [
  // Lesbian AI Companions
  {
    id: 301,
    name: 'Riley',
    description: 'Lesbian AI Girlfriend',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'LGBTQ+',
  },
  {
    id: 302,
    name: 'Jordan',
    description: 'Lesbian AI Companion',
    price: '$2.99',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
    isHot: false,
    isPro: false,
    category: 'LGBTQ+',
  },
  {
    id: 303,
    name: 'Alex',
    description: 'Lesbian AI Girlfriend',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'LGBTQ+',
  },
  {
    id: 304,
    name: 'Sam',
    description: 'Lesbian AI Partner',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop',
    isHot: false,
    isPro: true,
    category: 'LGBTQ+',
  },
  
  // Gay AI Companions
  {
    id: 305,
    name: 'Kai',
    description: 'Gay AI Boyfriend',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'LGBTQ+',
  },
  {
    id: 306,
    name: 'Ethan',
    description: 'Gay AI Partner',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'LGBTQ+',
  },
  {
    id: 307,
    name: 'Leo',
    description: 'Gay AI Boyfriend',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    isHot: false,
    isPro: true,
    category: 'LGBTQ+',
  },
  {
    id: 308,
    name: 'Mason',
    description: 'Gay AI Companion',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop',
    isHot: true,
    isPro: false,
    category: 'LGBTQ+',
  },
  
  // Bisexual AI Companions
  {
    id: 309,
    name: 'Taylor',
    description: 'Bisexual AI Companion',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
    isHot: false,
    isPro: true,
    category: 'LGBTQ+',
  },
  {
    id: 310,
    name: 'Morgan',
    description: 'Bisexual AI Partner',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'LGBTQ+',
  },
  {
    id: 311,
    name: 'Casey',
    description: 'Bisexual AI Companion',
    price: '$2.99',
    imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop',
    isHot: false,
    isPro: false,
    category: 'LGBTQ+',
  },
  {
    id: 312,
    name: 'Avery',
    description: 'Bisexual AI Partner',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'LGBTQ+',
  },
  
  // Non-Binary / Genderfluid AI Companions
  {
    id: 313,
    name: 'Quinn',
    description: 'Non-Binary AI Companion',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'LGBTQ+',
  },
  {
    id: 314,
    name: 'River',
    description: 'Genderfluid AI Partner',
    price: '$3.99',
    imageUrl: 'https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?w=400&h=600&fit=crop',
    isHot: false,
    isPro: true,
    category: 'LGBTQ+',
  },
  {
    id: 315,
    name: 'Phoenix',
    description: 'Non-Binary AI Companion',
    price: '$4.99',
    imageUrl: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=600&fit=crop',
    isHot: true,
    isPro: true,
    category: 'LGBTQ+',
  },
  {
    id: 316,
    name: 'Sage',
    description: 'Genderqueer AI Partner',
    price: '$2.99',
    imageUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop',
    isHot: false,
    isPro: false,
    category: 'LGBTQ+',
  },
];

export const allLGBTQCompanions: LGBTQCompanion[] = [...lgbtqCompanions];

