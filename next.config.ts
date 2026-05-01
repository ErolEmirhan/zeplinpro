import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import withPWAInit from "@ducanh2912/next-pwa";

/** PWA / Workbox: sürüm değişince precache manifest değişir, yeni SW kurulur. */
function readAppVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const v = JSON.parse(raw).version;
    return typeof v === "string" && v.length > 0 ? v : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const appVersion = readAppVersion();

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  extendDefaultRuntimeCaching: true,
  /** Firestore / RTDB / auth token — önbellekten dönmesin */
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    additionalManifestEntries: [
      { url: "/pwa-version.txt", revision: appVersion },
    ],
    runtimeCaching: [
      {
        urlPattern:
          /firestore\.googleapis\.com|firebaseio\.com|securetoken\.googleapis|identitytoolkit\.googleapis/i,
        handler: "NetworkOnly",
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /** Aynı kod farklı sürümle build edilince _next önbelleği ayrışır. */
  generateBuildId: async () => appVersion,
  turbopack: {
    root: process.cwd(),
  },
};

export default withPWA(nextConfig);
