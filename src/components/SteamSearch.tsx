import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SteamSearch({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim().slice(0, 120);
    if (!q) return;
    void navigate({ to: "/perfil/$query", params: { query: encodeURIComponent(q) } });
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={120}
          placeholder="SteamID64, /id/seunome ou URL do perfil"
          aria-label="SteamID ou URL do perfil"
          className="h-12 border-border bg-surface pl-10 text-base placeholder:text-muted-foreground/70"
        />
      </div>
      <Button type="submit" size="lg" className="h-12 px-8 font-display font-semibold neon-ring">
        Analisar biblioteca
      </Button>
    </form>
  );
}
