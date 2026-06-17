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
  {
    id: "iddia",
    name: "İddia",
    tagline: "Sanal futbol simülatörü ve canlı bahis",
    description:
      "5 büyük ligden takımların maçlarını canlı izle. Canlı bahis yap, maç gidişatına göre bahsini bozdur — tıpkı Zeplin gibi.",
    joinPath: "/game/iddia",
    badge: "Canlı Bahis",
    theme: "cyan",
  },
  {
    id: "patladin",
    name: "Patladın Kanka",
    tagline: "Bomba patlamadan yeşilleri bul, çarpanı kap",
    description:
      "5×5 karelerde 24 yeşil ve 1 kırmızı bomba. Her yeşil kartta çarpanı katla, patlamadan parayı çek!",
    joinPath: "/game/patladin",
    badge: "Mayınlar",
    theme: "candy",
  },
];
