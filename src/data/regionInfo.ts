// Detailed information about Nepal's three regions

export interface RegionInfo {
  id: string;
  name: string;
  nameNepali: string;
  description: string;
  stats: {
    area: string;
    elevation: string;
    population: string;
  };
  highlights: string[];
  color: string;
  icon: string;
}

export const REGION_DETAILS: RegionInfo[] = [
  {
    id: 'terai',
    name: 'Terai Region',
    nameNepali: 'तराई क्षेत्र',
    description: 'The southern lowland plains of Nepal, stretching along the Indian border. This fertile region is the agricultural heartland of the country, producing rice, wheat, and sugarcane.',
    stats: {
      area: '17% of total land',
      elevation: '60m - 305m',
      population: '~50% of Nepal\'s population',
    },
    highlights: [
      'Fertile alluvial plains',
      'Agricultural hub',
      'Chitwan National Park',
      'Lumbini (Birthplace of Buddha)',
    ],
    color: '#C5E1A5',
    icon: '🌾',
  },
  {
    id: 'hilly',
    name: 'Hilly Region',
    nameNepali: 'पहाडी क्षेत्र',
    description: 'The central midlands featuring rolling hills, valleys, and terraced farmlands. Home to Kathmandu Valley and Pokhara, this region is the cultural and political center of Nepal.',
    stats: {
      area: '68% of total land',
      elevation: '600m - 3,500m',
      population: '~40% of Nepal\'s population',
    },
    highlights: [
      'Kathmandu Valley',
      'Pokhara Valley',
      'Terraced farmlands',
      'Hill stations and trekking routes',
    ],
    color: '#81C784',
    icon: '⛰️',
  },
  {
    id: 'himalayan',
    name: 'Himalayan Region',
    nameNepali: 'हिमाली क्षेत्र',
    description: 'The majestic northern mountain range featuring 8 of the world\'s 14 peaks above 8,000m, including Mount Everest. This region is home to diverse ethnic communities and ancient Buddhist monasteries.',
    stats: {
      area: '15% of total land',
      elevation: '3,000m - 8,848m',
      population: '~10% of Nepal\'s population',
    },
    highlights: [
      'Mount Everest (8,848m)',
      'Annapurna Range',
      'Mustang and Dolpo',
      'High-altitude monasteries',
    ],
    color: '#E3F2FD',
    icon: '🏔️',
  },
];

// Core values for the about page
export const CORE_VALUES = [
  {
    title: 'Gyan',
    titleEnglish: 'Knowledge',
    description: 'Knowledge First. We prioritize real market understanding over surface-level finance tips.',
    icon: '📚',
  },
  {
    title: 'Parivartan',
    titleEnglish: 'Change',
    description: 'Change Starts Here. Youth who think economically transform nations.',
    icon: '🔄',
  },
  {
    title: 'Samriddhi',
    titleEnglish: 'Prosperity',
    description: 'Prosperity for All. Financial freedom is not a privilege — it is a skill.',
    icon: '📈',
  },
  {
    title: 'Unnati',
    titleEnglish: 'Progress',
    description: 'Upward Always. Continuous learning, compounding improvement.',
    icon: '⬆️',
  },
  {
    title: 'Sahabhagita',
    titleEnglish: 'Community',
    description: 'Community-Driven. We grow as a collective. Strong networks build stronger futures.',
    icon: '🤝',
  },
  {
    title: 'Satya',
    titleEnglish: 'Truth',
    description: 'Grounded in Truth. No noise, no hype. Only evidence-based thinking.',
    icon: '✅',
  },
];

// What we teach sections
export const TEACHINGS = [
  {
    id: 'financial-literacy',
    title: 'Financial Literacy',
    description: 'Building the fundamental understanding of money, personal finance, and smart saving to secure a stable future.',
    details: [
      'Budgeting with the 50/30/20 rule',
      'Building emergency funds',
      'Understanding credit and debt',
      'Smart saving strategies',
    ],
    icon: '💰',
  },
  {
    id: 'stock-market',
    title: 'Stock Market',
    description: 'Navigating NEPSE and global markets, analyzing trends, and making informed investment decisions.',
    details: [
      'Reading stock charts',
      'Fundamental analysis',
      'Technical analysis',
      'Portfolio management',
    ],
    icon: '📊',
  },
  {
    id: 'economic-research',
    title: 'Economic Research',
    description: 'Deep-diving into macroeconomic indicators, policies, and real-world impacts to think critically about growth.',
    details: [
      'GDP and inflation analysis',
      'Monetary policy understanding',
      'Global economic trends',
      'Nepal-specific economics',
    ],
    icon: '🔬',
  },
];

// Board members
export const BOARD_MEMBERS = [
  {
    name: 'Akshat Karki',
    role: 'President',
    bio: 'Leading ArthNeeti\'s vision for financial literacy across Nepal.',
  },
  {
    name: 'Manash Koirala',
    role: 'Vice President',
    bio: 'Supporting club operations and co-leading educational strategy.',
  },
  {
    name: 'Pranjal Khatiwada',
    role: 'Secretary',
    bio: 'Managing communications and community engagement.',
  },
  {
    name: 'Ujjwal Dhungana',
    role: 'Head of Research',
    bio: 'Developing curriculum and research content for sessions.',
  },
];

// Mission and Vision
export const MISSION_VISION = {
  mission: {
    title: 'Our Mission',
    subtitle: 'Empowering Nepal\'s next generation with real financial intelligence.',
    description: 'We travel across Nepal, bringing interactive workshops to every high school student. Our goal is to make financial literacy accessible, engaging, and practical for all.',
  },
  vision: {
    title: 'Our Vision',
    subtitle: 'A Nepal where youth lead economic change, not follow it.',
    description: 'We envision a future where every young Nepali understands money, investments, and economic principles — empowering them to build prosperous lives and communities.',
  },
};
