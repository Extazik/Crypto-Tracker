export type RewardStatus = 'potential' | 'registration' | 'claiming' | 'confirmed' | 'completed';

export type RewardType = 'tokens' | 'role' | 'points' | 'nft' | 'whitelist' | 'ambassador';

export type ActivityType = 
  | 'testnet' 
  | 'mainnet' 
  | 'staking' 
  | 'liquidity' 
  | 'trading' 
  | 'referral' 
  | 'social' 
  | 'other';

export type InvestorTier = 'Tier 1' | 'Tier 2';

export type Blockchain = 
  | 'Ethereum' 
  | 'Solana' 
  | 'Arbitrum' 
  | 'Optimism' 
  | 'Base' 
  | 'Polygon' 
  | 'BSC' 
  | 'TON' 
  | 'Sui' 
  | 'Aptos' 
  | 'Cosmos' 
  | 'Другое';

export interface Activity {
  id: string;
  projectId: string;
  name: string;
  type: ActivityType;
  description?: string;
  link?: string;
  isCompleted: boolean;
  completedAt?: string | null;
  isDailyReset?: boolean;
}

export interface Investor {
  id: string;
  name: string;
  tier: InvestorTier;
  amount?: number | null; // USD
  roundDate?: string;
}

export interface TokenDistribution {
  team: number;
  investors: number;
  community: number;
  ecosystem: number;
  reserve: number;
}

export interface Tokenomics {
  tokenName: string;
  ticker: string;
  totalSupply?: number | null;
  distribution: TokenDistribution;
  blockchain: Blockchain;
  tokenStandard: string;
}

export interface ProjectDates {
  registrationStart?: string | null;
  registrationEnd?: string | null;
  claimStart?: string | null;
  claimEnd?: string | null;
}

export interface SocialLinks {
  twitter?: string;
  telegram?: string;
  discord?: string;
  medium?: string;
  github?: string;
  youtube?: string;
  reddit?: string;
  custom?: { id: string; name: string; url: string }[];
}

export interface PotentialFactors {
  tier1Investors: boolean;
  over10mRaised: boolean;
  famousTeam: boolean;
  workingProduct: boolean;
  activeCommunity: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  logo: string;
  website: string;
  createdAt: string;
  updatedAt: string;
  
  // Reward details
  reward: {
    status: RewardStatus;
    claimLink?: string;
    statusUpdatedAt: string;
    rewardTypes: RewardType[];
    expectedAmount?: string;
  };

  // Activities
  activities: Activity[];

  // Investors
  investors: Investor[];

  // Tokenomics
  tokenomics: Tokenomics;

  // Key Dates
  dates: ProjectDates;

  // Socials
  socials: SocialLinks;

  // Flags & sorting
  isFavorite: boolean;
  priority: number; // 1-10

  // Categories & Tags
  category: 'DeFi' | 'NFT' | 'Gaming' | 'Social' | 'Infrastructure' | 'Layer 1' | 'Layer 2' | 'AI / DePIN';
  tags: string[];
  difficulty: number; // 1-5

  // Scoring
  potentialFactors?: PotentialFactors;

  // Optional live metrics
  liveStats?: {
    tokenPrice?: number;
    marketCap?: number;
    volume24h?: number;
    tvl?: number;
    twitterFollowers?: number;
  };
}

export interface ResetLog {
  id: string;
  timestamp: string;
  triggeredBy: 'cron_03_00_msk' | 'manual_admin';
  affectedProjectsCount: number;
  affectedActivitiesCount: number;
  status: 'success' | 'failed';
  note?: string;
}

export interface NotificationItem {
  id: string;
  projectId: string;
  type: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export interface FilterState {
  search: string;
  statuses: RewardStatus[];
  rewardTypes: RewardType[];
  progressRanges: string[]; // '0-25', '25-50', '50-75', '75-100', '100'
  dateFilter: 'all' | 'active_now' | 'ends_in_7d' | 'ends_in_30d' | 'future';
  investorTier: 'all' | 'tier1' | 'tier2';
  blockchains: Blockchain[];
  favoritesOnly: boolean;
  categories: string[];
  sortBy: 'date_desc' | 'date_asc' | 'status_priority' | 'progress_desc' | 'progress_asc' | 'priority_desc' | 'name_asc';
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  statuses: [],
  rewardTypes: [],
  progressRanges: [],
  dateFilter: 'all',
  investorTier: 'all',
  blockchains: [],
  favoritesOnly: false,
  categories: [],
  sortBy: 'status_priority',
};

export const REWARD_STATUS_LABELS: Record<RewardStatus, { label: string; color: string; bg: string; border: string; dotColor: string; priorityRank: number }> = {
  confirmed: {
    label: 'Подтверждена',
    color: '#3FB950',
    bg: 'rgba(63, 185, 80, 0.15)',
    border: 'rgba(63, 185, 80, 0.3)',
    dotColor: '#3FB950',
    priorityRank: 5,
  },
  claiming: {
    label: 'Получение',
    color: '#58A6FF',
    bg: 'rgba(88, 166, 255, 0.15)',
    border: 'rgba(88, 166, 255, 0.3)',
    dotColor: '#58A6FF',
    priorityRank: 4,
  },
  registration: {
    label: 'Регистрация',
    color: '#F0883E',
    bg: 'rgba(240, 136, 62, 0.15)',
    border: 'rgba(240, 136, 62, 0.3)',
    dotColor: '#F0883E',
    priorityRank: 3,
  },
  potential: {
    label: 'Потенциально',
    color: '#D29922',
    bg: 'rgba(210, 153, 34, 0.15)',
    border: 'rgba(210, 153, 34, 0.3)',
    dotColor: '#D29922',
    priorityRank: 2,
  },
  completed: {
    label: 'Завершена',
    color: '#8B949E',
    bg: 'rgba(139, 148, 158, 0.15)',
    border: 'rgba(139, 148, 158, 0.3)',
    dotColor: '#8B949E',
    priorityRank: 1,
  },
};

export const REWARD_TYPE_LABELS: Record<RewardType, { label: string; icon: string }> = {
  tokens: { label: 'Аирдроп (Tokens)', icon: '🪙' },
  role: { label: 'Роль (NFT Badge)', icon: '🎖️' },
  points: { label: 'Поинты (Points)', icon: '📊' },
  nft: { label: 'NFT', icon: '🖼️' },
  whitelist: { label: 'Вайтлист', icon: '📋' },
  ambassador: { label: 'Амбассадор', icon: '🤝' },
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  testnet: 'Тестнет',
  mainnet: 'Мейннет',
  staking: 'Стейкинг',
  liquidity: 'Ликвидность',
  trading: 'Торговля',
  referral: 'Реферальная программа',
  social: 'Социальные задания',
  other: 'Другое',
};

export const BLOCKCHAINS: Blockchain[] = [
  'Ethereum',
  'Solana',
  'Arbitrum',
  'Optimism',
  'Base',
  'Polygon',
  'BSC',
  'TON',
  'Sui',
  'Aptos',
  'Cosmos',
  'Другое',
];

export const CATEGORIES = [
  'Layer 1',
  'Layer 2',
  'DeFi',
  'AI / DePIN',
  'Infrastructure',
  'Gaming',
  'NFT',
  'Social',
] as const;

export const AVAILABLE_TAGS = [
  'Высокий приоритет',
  'Гарантированный',
  'Требует газ',
  'Бесплатный',
  'Рефералка',
  'Tier-1 Лид',
  'Скоро листинг',
  'Ежедневный чек-ин',
];

export interface AdminUser {
  username: string;
  email: string;
  role: 'admin';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AdminUser | null;
  token: string | null;
}

