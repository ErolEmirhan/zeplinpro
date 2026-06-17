"use client";

import { useRouter } from "next/navigation";

const GAMES = [
  {
    id: "zeplin",
    name: "Zeplin",
    tagline: "Çarpan yükselirken doğru anda çık",
    description:
      "Arkadaşlarınla aynı sanal masada oyna. Bahis koy, çarpan yükselirken nakde çevir — patlamadan önce.",
    joinPath: "/game/join",
  },
] as const;

export default function GamesPage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#070b14] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -20%, rgba(34,211,238,0.28), transparent 50%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(129,140,248,0.22), transparent 45%)",
        }}
      />

      <header className="relative z-10 border-b border-white/[0.06] bg-black/20 px-4 py-5 backdrop-blur-xl sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-300/80">
              Zeplinpro
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Oyunlar
            </h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <p className="mb-6 text-sm text-zinc-400">
          Bir oyun seç ve masaya katıl. Şimdilik tek oyun mevcut — daha fazlası
          yakında.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => (
            <article
              key={game.id}
              className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.05] shadow-2xl backdrop-blur-xl transition hover:border-cyan-500/25 hover:bg-white/[0.07]"
            >
              <div
                className="relative flex h-36 items-end overflow-hidden p-5 sm:h-40"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(34,211,238,0.18) 0%, rgba(99,102,241,0.12) 45%, rgba(7,11,20,0.9) 100%)",
                }}
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-40 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(34,211,238,0.55), transparent 70%)",
                  }}
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/70">
                    Canlı masa
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {game.name}
                  </h2>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
                <p className="text-sm font-medium text-zinc-300">
                  {game.tagline}
                </p>
                <p className="flex-1 text-xs leading-relaxed text-zinc-500">
                  {game.description}
                </p>
                <button
                  type="button"
                  onClick={() => router.push(game.joinPath)}
                  className="mt-1 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.2)] transition hover:brightness-110 active:scale-[0.98]"
                >
                  Oyna
                </button>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] leading-relaxed text-zinc-500">
          Bu yazılım yalnızca eğlence içindir; gerçek para veya kumar içermez.
        </p>
      </main>
    </div>
  );
}
