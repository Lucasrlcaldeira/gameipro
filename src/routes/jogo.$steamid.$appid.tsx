import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getGameAchievements } from "@/lib/steam.functions";
import { rarityLabel } from "@/lib/steam.types";

const gameQuery = (steamId: string, appId: number) =>
  queryOptions({
    queryKey: ["steam-game", steamId, appId],
    queryFn: () => getGameAchievements({ data: { steamId, appId } }),
    staleTime: 5 * 60 * 1000,
  });

export const Route = createFileRoute("/jogo/$steamid/$appid")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(gameQuery(params.steamid, Number(params.appid))),
  head: () => ({
    meta: [
      { title: "Conquistas do jogo — SteamVault" },
      {
        name: "description",
        content:
          "Lista completa de conquistas do jogo: o que falta desbloquear, descrição de cada troféu e raridade global.",
      },
      { property: "og:title", content: "Conquistas do jogo — SteamVault" },
      {
        property: "og:description",
        content: "Veja o que falta para platinar e a descrição de cada conquista.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }: { error: Error }) => (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Não deu para carregar as conquistas</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
      <Link to="/" className="mt-6 text-sm text-primary underline-offset-4 hover:underline">
        Voltar para o início
      </Link>
    </main>
  ),
  component: GamePage,
});

type Filter = "all" | "locked" | "unlocked";

function GamePage() {
  const { steamid, appid } = Route.useParams();
  const { data } = useSuspenseQuery(gameQuery(steamid, Number(appid)));
  const [filter, setFilter] = useState<Filter>("locked");
  const [search, setSearch] = useState("");
  const [byRarity, setByRarity] = useState(true);

  const unlocked = data.achievements.filter((a) => a.unlocked).length;
  const total = data.achievements.length;
  const pct = total ? Math.round((unlocked / total) * 100) : 0;
  const remaining = total - unlocked;

  const hardest = useMemo(() => {
    const locked = data.achievements.filter((a) => !a.unlocked && a.globalPercent !== undefined);
    if (locked.length === 0) return null;
    return locked.reduce((min, a) => (a.globalPercent! < min.globalPercent! ? a : min));
  }, [data.achievements]);

  const list = useMemo(() => {
    let l = data.achievements.filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase()),
    );
    if (filter === "locked") l = l.filter((a) => !a.unlocked);
    if (filter === "unlocked") l = l.filter((a) => a.unlocked);
    return [...l].sort((a, b) =>
      byRarity ? (a.globalPercent ?? 101) - (b.globalPercent ?? 101) : a.name.localeCompare(b.name),
    );
  }, [data.achievements, filter, search, byRarity]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        to="/perfil/$query"
        params={{ query: steamid }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Voltar ao perfil
      </Link>

      <header className="panel mt-6 overflow-hidden">
        <img
          src={data.headerUrl}
          alt={`Capa de ${data.gameName}`}
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = `https://cdn.cloudflare.steamstatic.com/steam/apps/${data.appId}/capsule_616x353.jpg`;
            if (img.src !== fallback) img.src = fallback;
            else img.style.display = "none";
          }}
          className="h-44 w-full object-cover sm:h-60"
        />
        <div className="p-6">
          <h1 className="text-2xl font-bold">{data.gameName}</h1>
          <div className="mt-4 flex items-center gap-4">
            <Progress value={pct} className="h-2 bg-surface-2" />
            <span className="whitespace-nowrap font-display text-lg font-bold text-primary">
              {pct}%
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {unlocked} de {total} conquistas desbloqueadas.{" "}
            {remaining === 0 ? (
              <span className="font-semibold text-platinum">Platinado! 🏆</span>
            ) : (
              <>
                Faltam <span className="font-semibold text-foreground">{remaining}</span> para o
                100%.
              </>
            )}
          </p>
          {hardest && (
            <p className="mt-2 text-sm text-muted-foreground">
              Maior desafio pendente:{" "}
              <span className="font-medium text-foreground">{hardest.name}</span> — só{" "}
              {hardest.globalPercent}% dos jogadores conseguiram.
            </p>
          )}
        </div>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["locked", `Faltando (${remaining})`],
            ["unlocked", `Conquistadas (${unlocked})`],
            ["all", `Todas (${total})`],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "default" : "outline"}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => setByRarity((v) => !v)}>
          {byRarity ? "Ordem: raridade" : "Ordem: A-Z"}
        </Button>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar conquista"
          maxLength={60}
          className="h-9 w-48 bg-surface"
        />
      </div>

      <ul className="mt-5 space-y-3">
        {list.map((a) => {
          const rarity = rarityLabel(a.globalPercent ?? 100);
          return (
            <li key={a.apiName} className="panel flex gap-4 p-4">
              <div className="relative shrink-0">
                <img
                  src={a.unlocked ? a.icon : a.iconGray}
                  alt=""
                  loading="lazy"
                  className={`size-14 rounded-lg object-cover ${a.unlocked ? "" : "opacity-50 grayscale"}`}
                />
                {!a.unlocked && (
                  <Lock className="absolute -bottom-1 -right-1 size-5 rounded-full bg-background p-1 text-muted-foreground" />
                )}
                {a.unlocked && (
                  <Trophy className="absolute -bottom-1 -right-1 size-5 rounded-full bg-background p-1 text-platinum" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{a.name}</h2>
                  {a.globalPercent !== undefined && (
                    <Badge variant="secondary" className={rarity.tone}>
                      {rarity.label} · {a.globalPercent}%
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                {a.unlocked && a.unlockTime && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Desbloqueada em {new Date(a.unlockTime * 1000).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">Nenhuma conquista com esse filtro.</p>
      )}
    </main>
  );
}
