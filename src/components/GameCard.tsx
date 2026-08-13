import { Link } from "@tanstack/react-router";
import { Trophy, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { completion, hoursFrom, type SteamGame } from "@/lib/steam.types";

export function GameCard({ game, steamId }: { game: SteamGame; steamId: string }) {
  const pct = completion(game);
  const remaining = game.achievementsTotal - game.achievementsUnlocked;
  const platinum = game.achievementsTotal > 0 && remaining === 0;

  return (
    <Link
      to="/jogo/$steamid/$appid"
      params={{ steamid: steamId, appid: String(game.appId) }}
      className="panel group block overflow-hidden transition-transform hover:-translate-y-1 hover:neon-ring"
    >
      <div className="relative aspect-[92/43] overflow-hidden bg-surface-2">
        <span className="absolute inset-0 flex items-center justify-center px-3 text-center font-display text-sm font-semibold text-muted-foreground">
          {game.name}
        </span>
        <img
          src={game.headerUrl}
          alt={`Capa de ${game.name}`}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/capsule_616x353.jpg`;
            if (img.src !== fallback) {
              img.src = fallback;
            } else {
              img.style.display = "none";
            }
          }}
          className="relative size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {platinum && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-platinum backdrop-blur">
            <Trophy className="size-3.5" /> Platinado
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="truncate font-display text-base font-semibold">{game.name}</h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {hoursFrom(game.playtimeMinutes)} h
          </span>
          {game.achievementsTotal > 0 && (
            <span>
              {game.achievementsUnlocked}/{game.achievementsTotal} conquistas
            </span>
          )}
        </div>

        {game.achievementsTotal > 0 ? (
          <div className="mt-3">
            <Progress value={pct} className="h-1.5 bg-surface-2" />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-medium text-primary">{pct}%</span>
              <span className="text-muted-foreground">
                {platinum ? "100% concluído" : `faltam ${remaining}`}
              </span>
            </div>
          </div>
        ) : game.hasStats !== false ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Conquistas não carregadas — abra o jogo para ver
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Sem conquistas registradas</p>
        )}
      </div>
    </Link>
  );
}
