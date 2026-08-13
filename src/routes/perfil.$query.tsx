import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Gamepad2, Trophy, Target, Flame } from "lucide-react";
import { useMemo, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { SteamSearch } from "@/components/SteamSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getProfileOverview } from "@/lib/steam.functions";
import { completion, hoursFrom, type ProfileOverview } from "@/lib/steam.types";

const overviewQuery = (query: string) =>
  queryOptions({
    queryKey: ["steam-overview", query],
    queryFn: () => getProfileOverview({ data: { query } }),
    staleTime: 5 * 60 * 1000,
  });

export const Route = createFileRoute("/perfil/$query")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(overviewQuery(decodeURIComponent(params.query))),
  head: ({ params }) => {
    const q = decodeURIComponent(params.query);
    return {
      meta: [
        { title: `Estatísticas Steam de ${q} — SteamVault` },
        {
          name: "description",
          content: `Horas jogadas, progresso de conquistas e platinas próximas da biblioteca Steam de ${q}.`,
        },
        { property: "og:title", content: `Estatísticas Steam de ${q}` },
        {
          property: "og:description",
          content: "Veja o progresso de conquistas e o que falta para platinar cada jogo.",
        },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: ProfileError,
  component: ProfilePage,
});

function ProfileError({ error }: { error: Error }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Não deu para carregar esse perfil</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
      <div className="mt-6">
        <SteamSearch />
      </div>
      <Link to="/" className="mt-6 text-sm text-primary underline-offset-4 hover:underline">
        Voltar para o início
      </Link>
    </main>
  );
}

type SortKey = "playtime" | "closest" | "completion" | "name";

function ProfilePage() {
  const { query } = Route.useParams();
  const { data } = useSuspenseQuery(overviewQuery(decodeURIComponent(query)));
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("playtime");
  const [onlyPending, setOnlyPending] = useState(false);

  const stats = useStats(data);

  const games = useMemo(() => {
    let list = data.games.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
    if (onlyPending)
      list = list.filter(
        (g) => g.achievementsTotal > 0 && g.achievementsUnlocked < g.achievementsTotal,
      );
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "completion") return completion(b) - completion(a);
      if (sort === "closest") {
        const ra = a.achievementsTotal ? a.achievementsTotal - a.achievementsUnlocked : Infinity;
        const rb = b.achievementsTotal ? b.achievementsTotal - b.achievementsUnlocked : Infinity;
        if (ra === 0 && rb !== 0) return 1;
        if (rb === 0 && ra !== 0) return -1;
        return ra - rb;
      }
      return b.playtimeMinutes - a.playtimeMinutes;
    });
    return sorted;
  }, [data.games, search, sort, onlyPending]);

  const nextPlatinum = useMemo(
    () =>
      data.games
        .filter((g) => g.achievementsTotal > 0 && g.achievementsUnlocked < g.achievementsTotal)
        .sort(
          (a, b) =>
            a.achievementsTotal -
            a.achievementsUnlocked -
            (b.achievementsTotal - b.achievementsUnlocked),
        )
        .slice(0, 5),
    [data.games],
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Início
      </Link>

      {data.demo && (
        <div className="panel mt-5 border-primary/40 p-4 text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Modo demonstração.</span> Estes são dados de
          exemplo. Adicione uma Steam Web API Key ao projeto para carregar bibliotecas reais.
        </div>
      )}

      <header className="panel mt-6 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <img
          src={data.profile.avatar}
          alt={`Avatar de ${data.profile.personaName}`}
          className="size-20 rounded-xl border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{data.profile.personaName}</h1>
          <p className="mt-1 text-xs text-muted-foreground">SteamID {data.profile.steamId}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{data.profile.state}</Badge>
            {data.profile.countryCode && (
              <Badge variant="secondary">{data.profile.countryCode}</Badge>
            )}
            <Badge variant="secondary">{stats.platinums} platinas</Badge>
          </div>
        </div>
        <Button asChild variant="outline">
          <a href={data.profile.profileUrl} target="_blank" rel="noreferrer noopener">
            Abrir na Steam
          </a>
        </Button>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Gamepad2} label="Jogos na conta" value={String(stats.total)} />
        <Stat icon={Clock} label="Horas jogadas" value={`${stats.hours.toLocaleString("pt-BR")} h`} />
        <Stat
          icon={Trophy}
          label="Conquistas"
          value={`${stats.unlocked}/${stats.totalAch}`}
          hint={`${stats.rate}% de conclusão média`}
        />
        <Stat
          icon={Target}
          label="Faltam para 100%"
          value={String(stats.remaining)}
          hint="somando todos os jogos"
        />
      </section>

      {nextPlatinum.length > 0 && (
        <section className="panel mt-8 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Flame className="size-5 text-ultrarare" /> Platinas mais próximas
          </h2>
          <ul className="mt-4 space-y-3">
            {nextPlatinum.map((g) => {
              const remaining = g.achievementsTotal - g.achievementsUnlocked;
              return (
                <li key={g.appId}>
                  <Link
                    to="/jogo/$steamid/$appid"
                    params={{ steamid: data.profile.steamId, appid: String(g.appId) }}
                    className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-surface-2"
                  >
                    <img
                      src={g.iconUrl}
                      alt=""
                      className="h-10 w-[92px] rounded object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{g.name}</p>
                      <Progress value={completion(g)} className="mt-2 h-1.5 bg-surface-2" />
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold text-primary">
                      {remaining} restante{remaining > 1 ? "s" : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Biblioteca ({games.length})</h2>
          <div className="flex flex-wrap gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jogo"
              maxLength={60}
              className="h-9 w-44 bg-surface"
            />
            <Button
              variant={onlyPending ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setOnlyPending((v) => !v)}
            >
              Só pendentes
            </Button>
            {(
              [
                ["playtime", "Mais jogados"],
                ["closest", "Perto da platina"],
                ["completion", "% conclusão"],
                ["name", "A-Z"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                className="h-9"
                variant={sort === key ? "default" : "outline"}
                onClick={() => setSort(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <GameCard key={g.appId} game={g} steamId={data.profile.steamId} />
          ))}
        </div>
        {games.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">Nenhum jogo com esse filtro.</p>
        )}
      </section>
    </main>
  );
}

function useStats(data: ProfileOverview) {
  return useMemo(() => {
    const withAch = data.games.filter((g) => g.achievementsTotal > 0);
    const unlocked = withAch.reduce((s, g) => s + g.achievementsUnlocked, 0);
    const totalAch = withAch.reduce((s, g) => s + g.achievementsTotal, 0);
    return {
      total: data.games.length,
      hours: Math.round(hoursFrom(data.games.reduce((s, g) => s + g.playtimeMinutes, 0))),
      unlocked,
      totalAch,
      remaining: totalAch - unlocked,
      rate: totalAch ? Math.round((unlocked / totalAch) * 100) : 0,
      platinums: withAch.filter((g) => g.achievementsUnlocked === g.achievementsTotal).length,
    };
  }, [data]);
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
