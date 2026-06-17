"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function GameJoinPage() {
  const router = useRouter();
  const [name, setName] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = name.trim();
    if (!t) return;
    localStorage.setItem("zeplin_display_name", t);
    router.push(`/game?u=${encodeURIComponent(t)}`);
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-[#070b14] px-3 py-8 text-zinc-100 sm:px-4 sm:py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -20%, rgba(34,211,238,0.28), transparent 50%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(129,140,248,0.22), transparent 45%)",
        }}
      />
      <div className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-8 md:p-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          <span aria-hidden>←</span>
          Oyunlara dön
        </button>
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-300/80">
          Zeplin
        </p>
        <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          Odaya gir
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Arkadaşınla aynı sanal masaya bağlanmak için bir kullanıcı adı yeterli.
          Veriler paylaşılan Firebase odasında tutulur.
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="text-xs font-medium text-zinc-400">
            Kullanıcı adı
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ör. Efe"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base outline-none ring-cyan-500/30 focus:ring-2"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.25)] transition hover:brightness-110"
          >
            Masaya katıl
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-500">
          Bu yazılım yalnızca eğlence içindir; gerçek para veya kumar içermez.
        </p>
      </div>
    </div>
  );
}
