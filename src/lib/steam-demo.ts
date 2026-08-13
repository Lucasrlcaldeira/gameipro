import type { GameAchievements, ProfileOverview, SteamAchievement } from "./steam.types";

const header = (appId: number) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
const icon = (appId: number) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`;

interface DemoGame {
  appId: number;
  name: string;
  playtimeMinutes: number;
  playtime2WeeksMinutes: number;
  total: number;
  unlocked: number;
  lastPlayed: number;
}

const DEMO_GAMES: DemoGame[] = [
  { appId: 1245620, name: "ELDEN RING", playtimeMinutes: 12420, playtime2WeeksMinutes: 640, total: 42, unlocked: 38, lastPlayed: 1770000000 },
  { appId: 1086940, name: "Baldur's Gate 3", playtimeMinutes: 9860, playtime2WeeksMinutes: 320, total: 54, unlocked: 31, lastPlayed: 1769000000 },
  { appId: 292030, name: "The Witcher 3: Wild Hunt", playtimeMinutes: 8100, playtime2WeeksMinutes: 0, total: 78, unlocked: 76, lastPlayed: 1755000000 },
  { appId: 1091500, name: "Cyberpunk 2077", playtimeMinutes: 6240, playtime2WeeksMinutes: 90, total: 57, unlocked: 40, lastPlayed: 1768200000 },
  { appId: 620, name: "Portal 2", playtimeMinutes: 1180, playtime2WeeksMinutes: 0, total: 51, unlocked: 51, lastPlayed: 1712000000 },
  { appId: 367520, name: "Hollow Knight", playtimeMinutes: 3400, playtime2WeeksMinutes: 45, total: 63, unlocked: 44, lastPlayed: 1767000000 },
  { appId: 1145360, name: "Hades", playtimeMinutes: 2760, playtime2WeeksMinutes: 0, total: 49, unlocked: 49, lastPlayed: 1742000000 },
  { appId: 105600, name: "Terraria", playtimeMinutes: 5320, playtime2WeeksMinutes: 0, total: 115, unlocked: 61, lastPlayed: 1733000000 },
  { appId: 413150, name: "Stardew Valley", playtimeMinutes: 4180, playtime2WeeksMinutes: 210, total: 40, unlocked: 25, lastPlayed: 1769800000 },
  { appId: 570, name: "Dota 2", playtimeMinutes: 15600, playtime2WeeksMinutes: 0, total: 0, unlocked: 0, lastPlayed: 1700000000 },
  { appId: 1174180, name: "Red Dead Redemption 2", playtimeMinutes: 7020, playtime2WeeksMinutes: 0, total: 51, unlocked: 34, lastPlayed: 1748000000 },
  { appId: 275850, name: "No Man's Sky", playtimeMinutes: 2210, playtime2WeeksMinutes: 60, total: 34, unlocked: 12, lastPlayed: 1766000000 },
];

const ADJ = [
  "Mestre das Sombras",
  "Sem Dano",
  "Colecionador Compulsivo",
  "Velocista",
  "Explorador Silencioso",
  "Fim da Linha",
  "Coração de Aço",
  "Perfeccionista",
  "Caçador de Segredos",
  "Último Suspiro",
  "Lenda Viva",
  "Nada Resta",
];

const DESC = [
  "Derrote o chefe final sem receber dano em nenhuma fase.",
  "Colete todos os itens colecionáveis espalhados pelo mundo.",
  "Complete o jogo na dificuldade máxima em menos de 8 horas.",
  "Descubra todas as áreas secretas do mapa.",
  "Termine a campanha sem usar itens de cura.",
  "Alcance o nível máximo com um único personagem.",
  "Complete todas as missões secundárias de uma região.",
  "Vença 10 combates seguidos sem morrer.",
  "Desbloqueie todos os finais alternativos.",
  "Melhore uma arma até o nível máximo.",
  "Encontre o easter egg escondido pelos desenvolvedores.",
  "Termine o jogo com 100% de conclusão.",
];

function seeded(appId: number, i: number) {
  const x = Math.sin(appId * 97.13 + i * 41.7) * 10000;
  return x - Math.floor(x);
}

export function demoAchievements(appId: number): SteamAchievement[] {
  const game = DEMO_GAMES.find((g) => g.appId === appId) ?? DEMO_GAMES[0]!;
  const list: SteamAchievement[] = [];
  for (let i = 0; i < game.total; i++) {
    const unlocked = i < game.unlocked;
    const r = seeded(game.appId, i);
    list.push({
      apiName: `ACH_${game.appId}_${i}`,
      name: `${ADJ[i % ADJ.length]}${i >= ADJ.length ? ` ${Math.floor(i / ADJ.length) + 1}` : ""}`,
      description: DESC[(i * 5 + 3) % DESC.length]!,
      icon: icon(game.appId),
      iconGray: icon(game.appId),
      unlocked,
      unlockTime: unlocked ? game.lastPlayed - i * 86400 : undefined,
      globalPercent: Math.round((unlocked ? 12 + r * 70 : 0.8 + r * 35) * 10) / 10,
    });
  }
  return list;
}

export function demoOverview(steamId: string): ProfileOverview {
  return {
    demo: true,
    profile: {
      steamId,
      personaName: "Jogador Demo",
      avatar: "https://avatars.cloudflare.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
      profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
      countryCode: "BR",
      createdAt: 1300000000,
      state: "online",
    },
    games: DEMO_GAMES.map((g) => ({
      appId: g.appId,
      name: g.name,
      playtimeMinutes: g.playtimeMinutes,
      playtime2WeeksMinutes: g.playtime2WeeksMinutes,
      iconUrl: icon(g.appId),
      headerUrl: header(g.appId),
      achievementsTotal: g.total,
      achievementsUnlocked: g.unlocked,
      lastPlayed: g.lastPlayed,
    })),
  };
}

export function demoGame(appId: number): GameAchievements {
  const g = DEMO_GAMES.find((x) => x.appId === appId) ?? DEMO_GAMES[0]!;
  return {
    demo: true,
    appId: g.appId,
    gameName: g.name,
    headerUrl: header(g.appId),
    playtimeMinutes: g.playtimeMinutes,
    achievements: demoAchievements(g.appId),
  };
}

export const demoHeaderUrl = header;
export const demoIconUrl = icon;
