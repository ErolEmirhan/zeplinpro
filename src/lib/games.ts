export type GameCard = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  joinPath: string;
  badge: string;
  theme: "cyan" | "candy";
};

export const GAMES: GameCard[] = [
  {
    id: "zeplin",
    name: "Zeplin",
    tagline: "Çarpan yükselirken doğru anda çık",
    description:
      "Arkadaşlarınla aynı sanal masada oyna. Bahis koy, çarpan yükselirken nakde çevir — patlamadan önce.",
    joinPath: "/game/join",
    badge: "Canlı masa",
    theme: "cyan",
  },
  {
    id: "bonanza",
    name: "Bonanza",
    tagline: "Şekerleri patlat, çarpanları topla",
    description:
      "6×5 ızgara, düşen semboller ve bomba çarpanları. Sweet Bonanza tarzı sanal slot — tamamen eğlence amaçlı.",
    joinPath: "/game/bonanza",
    badge: "Slot",
    theme: "candy",
  },
];
