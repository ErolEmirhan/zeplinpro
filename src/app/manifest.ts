import type { MetadataRoute } from "next";

const theme = "#09090b";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Zeplin — Sanal çarpan odası",
    short_name: "Zeplin",
    description:
      "Arkadaşınla sanal bakiye ile zeplin / crash tarzı eğlence oyunu.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "portrait-primary",
    background_color: theme,
    theme_color: theme,
    categories: ["games", "entertainment"],
    lang: "tr",
    dir: "ltr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
