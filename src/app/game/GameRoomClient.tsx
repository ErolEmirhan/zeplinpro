"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameRoom } from "@/components/game/GameRoom";

const STORAGE_KEY = "zeplin_display_name";

export function GameRoomClient() {
  const router = useRouter();
  const search = useSearchParams();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const q = search.get("u")?.trim();
    if (q) {
      localStorage.setItem(STORAGE_KEY, q);
      setName(q);
      return;
    }
    const s = localStorage.getItem(STORAGE_KEY)?.trim();
    if (s) setName(s);
    else router.replace("/game/join");
  }, [router, search]);

  if (!name) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#070b14] px-4 text-center text-sm text-zinc-400">
        Yönlendiriliyorsunuz…
      </div>
    );
  }

  return <GameRoom displayName={name} />;
}
