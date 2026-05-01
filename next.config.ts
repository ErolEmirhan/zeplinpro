import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  extendDefaultRuntimeCaching: true,
  /** Firestore / RTDB / auth token — önbellekten dönmesin */
  workboxOptions: {
    skipWaiting: true,
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
  turbopack: {
    root: process.cwd(),
  },
};

export default withPWA(nextConfig);
