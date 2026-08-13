export interface SteamProfile {
  steamId: string;
  personaName: string;
  avatar: string;
  profileUrl: string;
  countryCode?: string;
  createdAt?: number;
  state: "online" | "offline" | "busy" | "away";
}

export interface SteamGame {
  appId: number;
  name: string;
  playtimeMinutes: number;
  playtime2WeeksMinutes: number;
  iconUrl: string;
  headerUrl: string;
  achievementsTotal: number;
  achievementsUnlocked: number;
  lastPlayed?: number;
}

export interface SteamAchievement {
  apiName: string;
  name: string;
  description: string;
  icon: string;
  iconGray: string;
  unlocked: boolean;
  unlockTime?: number;
  globalPercent?: number;
}

export interface ProfileOverview {
  demo: boolean;
  profile: SteamProfile;
  games: SteamGame[];
}

export interface GameAchievements {
  demo: boolean;
  appId: number;
  gameName: string;
  headerUrl: string;
  playtimeMinutes: number;
  achievements: SteamAchievement[];
}

export function hoursFrom(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

export function completion(game: SteamGame): number {
  if (!game.achievementsTotal) return 0;
  return Math.round((game.achievementsUnlocked / game.achievementsTotal) * 100);
}

/** Dificuldade estimada da platina: raridade média das conquistas restantes. */
export function rarityLabel(percent: number): { label: string; tone: string } {
  if (percent < 2) return { label: "Lendária", tone: "text-legendary" };
  if (percent < 10) return { label: "Ultra rara", tone: "text-ultrarare" };
  if (percent < 30) return { label: "Rara", tone: "text-rare" };
  if (percent < 60) return { label: "Incomum", tone: "text-uncommon" };
  return { label: "Comum", tone: "text-muted-foreground" };
}
