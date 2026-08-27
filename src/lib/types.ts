export type ProjectStatus = "potential" | "registration" | "claiming" | "confirmed" | "completed";
export type RewardType = "airdrop" | "discord" | "points" | "nft" | "wl" | "ambassador";
export type ActivityType =
  | "testnet"
  | "mainnet"
  | "staking"
  | "liquidity"
  | "trading"
  | "referral"
  | "social"
  | "daily"
  | "other";
export type InvestorTier = 1 | 2;
export type Difficulty = "easy" | "medium" | "hard";
export type Priority = "high" | "medium" | "low";
export type DeadlineKind = "registration" | "claim" | "snapshot" | "other";

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  url?: string;
  dailyReset: boolean;
  done: boolean;
}

export interface Investor {
  id: string;
  name: string;
  tier: InvestorTier;
  amountUsd?: number;
  roundDate?: string;
}

export interface TokenSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface Deadline {
  id: string;
  date: string; // ISO yyyy-mm-dd
  kind: DeadlineKind;
  title: string;
}

export interface Project {
  id: string;
  name: string;
  ticker: string;
  website?: string;
  logoUrl?: string;
  description: string;
  categories: string[];
  tags: string[];
  status: ProjectStatus;
  rewardTypes: RewardType[];
  blockchain: string;
  priority: Priority;
  difficulty: Difficulty;
  claimUrl?: string;
  deadlines: Deadline[];
  activities: Activity[];
  investors: Investor[];
  tokenStandard?: string;
  totalSupply?: string;
  tokenomics: TokenSlice[];
  createdAt: number;
}

export interface ResetLogEntry {
  id: string;
  at: number;
  kind: "auto" | "manual";
  affected: number;
}

export interface AdminAccount {
  email: string;
  name: string;
  passwordHash: string;
}

export interface StatusMeta {
  id: ProjectStatus;
  label: string;
  color: string;
  hint: string;
  order: number;
}

export const STATUS_LIST: StatusMeta[] = [
  { id: "potential", label: "Потенциально", color: "#D29922", hint: "Проект на ранней стадии, аирдроп вероятен", order: 4 },
  { id: "registration", label: "Регистрация", color: "#DB6D28", hint: "Открыта регистрация / вайтлист", order: 2 },
  { id: "claiming", label: "Получение", color: "#3FB950", hint: "Раздача наград активна", order: 1 },
  { id: "confirmed", label: "Подтверждена", color: "#58A6FF", hint: "Аирдроп официально анонсирован", order: 3 },
  { id: "completed", label: "Завершена", color: "#8B949E", hint: "Раздача завершена", order: 5 },
];

export const STATUS_META: Record<ProjectStatus, StatusMeta> = Object.fromEntries(
  STATUS_LIST.map((s) => [s.id, s])
) as Record<ProjectStatus, StatusMeta>;

export const REWARD_LIST: { id: RewardType; label: string }[] = [
  { id: "airdrop", label: "Токены" },
  { id: "discord", label: "Discord-роли" },
  { id: "points", label: "Поинты" },
  { id: "nft", label: "NFT" },
  { id: "wl", label: "Вайтлист" },
  { id: "ambassador", label: "Амбассадорка" },
];

export const REWARD_LABEL: Record<RewardType, string> = Object.fromEntries(
  REWARD_LIST.map((r) => [r.id, r.label])
) as Record<RewardType, string>;

export const ACTIVITY_TYPES: { id: ActivityType; label: string }[] = [
  { id: "testnet", label: "Тестнет" },
  { id: "mainnet", label: "Мейннет" },
  { id: "staking", label: "Стейкинг" },
  { id: "liquidity", label: "Ликвидность" },
  { id: "trading", label: "Торговля" },
  { id: "referral", label: "Рефералы" },
  { id: "social", label: "Соцсети" },
  { id: "daily", label: "Дейлики" },
  { id: "other", label: "Другое" },
];

export const ACTIVITY_LABEL: Record<ActivityType, string> = Object.fromEntries(
  ACTIVITY_TYPES.map((a) => [a.id, a.label])
) as Record<ActivityType, string>;

export const DEADLINE_KINDS: { id: DeadlineKind; label: string; color: string }[] = [
  { id: "registration", label: "Регистрация", color: "#DB6D28" },
  { id: "claim", label: "Клейм", color: "#3FB950" },
  { id: "snapshot", label: "Снапшот", color: "#58A6FF" },
  { id: "other", label: "Другое", color: "#D29922" },
];

export const CATEGORIES = ["L1", "L2", "DeFi", "DEX", "GameFi", "RWA", "Инфраструктура", "Социалки", "Мосты", "Игры"];

export const BLOCKCHAINS = ["Своя L1", "Ethereum", "Solana", "Cosmos", "Bitcoin", "TON", "zkEVM", "Move"];

export const SLICE_PALETTE = ["#3FB950", "#58A6FF", "#D29922", "#DB6D28", "#A371F7", "#F85149", "#39C5CF", "#8B949E"];

export const PRIORITY_META: Record<Priority, { label: string; color: string; order: number }> = {
  high: { label: "Высокий", color: "#F85149", order: 0 },
  medium: { label: "Средний", color: "#D29922", order: 1 },
  low: { label: "Низкий", color: "#8B949E", order: 2 },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; order: number }> = {
  easy: { label: "Лёгкая", color: "#3FB950", order: 0 },
  medium: { label: "Средняя", color: "#D29922", order: 1 },
  hard: { label: "Сложная", color: "#F85149", order: 2 },
};
