import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { demoGame, demoOverview } from "./steam-demo";
import type {
  GameAchievements,
  ProfileOverview,
  SteamAchievement,
  SteamGame,
} from "./steam.types";

const API = "https://api.steampowered.com";

const headerUrl = (appId: number) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

const inputSchema = z.object({ query: z.string().trim().min(1).max(120) });
const gameSchema = z.object({
  steamId: z.string().trim().regex(/^\d{17}$/),
  appId: z.number().int().positive(),
});

async function j<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Decodifica múltiplas vezes (a URL pode chegar duplamente codificada). */
function decodeDeep(value: string): string {
  let out = value;
  for (let i = 0; i < 3 && /%[0-9A-Fa-f]{2}/.test(out); i++) {
    try {
      const next = decodeURIComponent(out);
      if (next === out) break;
      out = next;
    } catch {
      break;
    }
  }
  return out;
}

/** Aceita SteamID64, URL de perfil ou vanity name. */
async function resolveSteamId(raw: string, key: string): Promise<string | null> {
  let q = decodeDeep(raw).trim().replace(/\/+$/, "");
  const urlMatch = q.match(/steamcommunity\.com\/(profiles|id)\/([^/?#]+)/i);
  if (urlMatch) q = urlMatch[2]!;
  if (/^\d{17}$/.test(q)) return q;

  const data = await j<{ response?: { steamid?: string; success?: number } }>(
    `${API}/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(q)}`,
  );
  if (data?.response?.success === 1 && data.response.steamid) return data.response.steamid;
  return null;
}

const stateMap = ["offline", "online", "busy", "away", "away", "online", "online"] as const;

export const getProfileOverview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ProfileOverview> => {
    const key = process.env["STEAM_API_KEY"];
    const fallbackId = /^\d{17}$/.test(data.query) ? data.query : "76561197960287930";
    if (!key) return demoOverview(fallbackId);

    const steamId = await resolveSteamId(data.query, key);
    if (!steamId) throw new Error("Perfil não encontrado. Confira o SteamID ou a URL.");

    const [summary, owned] = await Promise.all([
      j<{ response?: { players?: Array<Record<string, unknown>> } }>(
        `${API}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`,
      ),
      j<{
        response?: {
          games?: Array<{
            appid: number;
            name?: string;
            playtime_forever?: number;
            playtime_2weeks?: number;
            rtime_last_played?: number;
            has_community_visible_stats?: boolean;
          }>;
        };
      }>(
        `${API}/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`,
      ),
    ]);

    const player = summary?.response?.players?.[0];
    if (!player) throw new Error("Perfil privado ou inexistente.");

    const rawGames = owned?.response?.games ?? [];
    if (rawGames.length === 0) {
      throw new Error(
        "Não foi possível ler a biblioteca. O perfil precisa estar público (Detalhes do jogo: Público).",
      );
    }

    const games: SteamGame[] = rawGames
      .map((g) => ({
        appId: g.appid,
        name: g.name ?? `App ${g.appid}`,
        playtimeMinutes: g.playtime_forever ?? 0,
        playtime2WeeksMinutes: g.playtime_2weeks ?? 0,
        iconUrl: headerUrl(g.appid),
        headerUrl: headerUrl(g.appid),
        achievementsTotal: 0,
        achievementsUnlocked: 0,
        ...(g.rtime_last_played ? { lastPlayed: g.rtime_last_played } : {}),
      }))
      .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);

    // Conquistas só dos 24 jogos mais jogados (limite de chamadas da API da Steam).
    const top = games.filter((g) => g.playtimeMinutes > 0).slice(0, 24);
    await Promise.all(
      top.map(async (g) => {
        const res = await j<{
          playerstats?: { achievements?: Array<{ achieved: number }>; success?: boolean };
        }>(
          `${API}/ISteamUserStats/GetPlayerAchievements/v1/?key=${key}&steamid=${steamId}&appid=${g.appId}&l=portuguese`,
        );
        const list = res?.playerstats?.achievements;
        if (!list) return;
        g.achievementsTotal = list.length;
        g.achievementsUnlocked = list.filter((a) => a.achieved === 1).length;
      }),
    );

    return {
      demo: false,
      profile: {
        steamId,
        personaName: String(player["personaname"] ?? "Jogador"),
        avatar: String(player["avatarfull"] ?? ""),
        profileUrl: String(player["profileurl"] ?? `https://steamcommunity.com/profiles/${steamId}`),
        state: stateMap[Number(player["personastate"] ?? 0)] ?? "offline",
        ...(player["loccountrycode"] ? { countryCode: String(player["loccountrycode"]) } : {}),
        ...(player["timecreated"] ? { createdAt: Number(player["timecreated"]) } : {}),
      },
      games,
    };
  });

export const getGameAchievements = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => gameSchema.parse(data))
  .handler(async ({ data }): Promise<GameAchievements> => {
    const key = process.env["STEAM_API_KEY"];
    if (!key) return demoGame(data.appId);

    const [player, schema, global] = await Promise.all([
      j<{
        playerstats?: {
          gameName?: string;
          achievements?: Array<{ apiname: string; achieved: number; unlocktime: number }>;
        };
      }>(
        `${API}/ISteamUserStats/GetPlayerAchievements/v1/?key=${key}&steamid=${data.steamId}&appid=${data.appId}&l=portuguese`,
      ),
      j<{
        game?: {
          gameName?: string;
          availableGameStats?: {
            achievements?: Array<{
              name: string;
              displayName: string;
              description?: string;
              icon: string;
              icongray: string;
            }>;
          };
        };
      }>(
        `${API}/ISteamUserStats/GetSchemaForGame/v2/?key=${key}&appid=${data.appId}&l=portuguese`,
      ),
      j<{ achievementpercentages?: { achievements?: Array<{ name: string; percent: number }> } }>(
        `${API}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${data.appId}`,
      ),
    ]);

    const schemaList = schema?.game?.availableGameStats?.achievements ?? [];
    const playerList = player?.playerstats?.achievements ?? [];
    if (schemaList.length === 0) throw new Error("Este jogo não possui conquistas na Steam.");

    const playerMap = new Map(playerList.map((a) => [a.apiname, a]));
    const globalMap = new Map(
      (global?.achievementpercentages?.achievements ?? []).map((a) => [a.name, a.percent]),
    );

    const achievements: SteamAchievement[] = schemaList.map((s) => {
      const p = playerMap.get(s.name);
      const percent = globalMap.get(s.name);
      return {
        apiName: s.name,
        name: s.displayName,
        description: s.description ?? "Conquista oculta — a descrição só aparece após desbloquear.",
        icon: s.icon,
        iconGray: s.icongray,
        unlocked: p?.achieved === 1,
        ...(p?.achieved === 1 && p.unlocktime ? { unlockTime: p.unlocktime } : {}),
        ...(percent !== undefined ? { globalPercent: Math.round(percent * 10) / 10 } : {}),
      };
    });

    return {
      demo: false,
      appId: data.appId,
      gameName: schema?.game?.gameName ?? player?.playerstats?.gameName ?? `App ${data.appId}`,
      headerUrl: headerUrl(data.appId),
      playtimeMinutes: 0,
      achievements,
    };
  });
