import { Suspense } from "react";
import { GameRoomClient } from "./GameRoomClient";

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#070b14] px-4 text-center text-sm text-zinc-400">
          Oda yükleniyor…
        </div>
      }
    >
      <GameRoomClient />
    </Suspense>
  );
}
