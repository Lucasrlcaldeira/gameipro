import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, BarChart3, ListChecks, Sparkles, ShieldCheck } from "lucide-react";
import { SteamSearch } from "@/components/SteamSearch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SteamVault — Estatísticas e conquistas dos seus jogos Steam" },
      {
        name: "description",
        content:
          "Cole seu SteamID e veja horas jogadas, progresso de conquistas, quanto falta para platinar cada jogo e a descrição de cada troféu.",
      },
      { property: "og:title", content: "SteamVault — Seu cofre de conquistas Steam" },
      {
        property: "og:description",
        content:
          "Estatísticas da sua biblioteca Steam, ranking de platinas próximas e descrição de cada conquista que falta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: BarChart3,
    title: "Panorama da biblioteca",
    text: "Horas totais, jogos jogados, média de conclusão e seus títulos mais viciantes em um só painel.",
  },
  {
    icon: Trophy,
    title: "Radar de platinas",
    text: "Ranking dos jogos mais perto dos 100% — saiba exatamente quantas conquistas faltam em cada um.",
  },
  {
    icon: ListChecks,
    title: "Descrição de cada troféu",
    text: "Lista completa com o que fazer para desbloquear, data de conquista e raridade global.",
  },
  {
    icon: Sparkles,
    title: "Raridade e dificuldade",
    text: "Cada conquista recebe um selo (comum a lendária) com base no percentual global de jogadores.",
  },
];

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-scan opacity-40" aria-hidden />

      <section className="relative mx-auto max-w-5xl px-6 pb-16 pt-20 sm:pt-28">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
          <Trophy className="size-4" />
          SteamVault
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.05] sm:text-6xl">
          Seu cofre de <span className="neon-text">conquistas</span> da Steam
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Cole seu SteamID ou a URL do perfil e descubra suas estatísticas, quantas conquistas
          faltam para platinar cada jogo e o que precisa ser feito em cada uma delas.
        </p>

        <div className="mt-9 max-w-2xl">
          <SteamSearch />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-uncommon" /> Sem login, sem senha
            </span>
            <Link
              to="/perfil/$query"
              params={{ query: "76561197960287930" }}
              className="text-primary underline-offset-4 hover:underline"
            >
              Ver um perfil de exemplo
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <article key={f.title} className="panel p-6">
              <f.icon className="size-5 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>

        <p className="mt-14 text-xs text-muted-foreground">
          Para ver sua biblioteca, o perfil Steam precisa estar público em Privacidade → Detalhes do
          jogo.
        </p>
      </section>
    </main>
  );
}
