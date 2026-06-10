import type { NextConfig } from "next";
import { resolve } from "path";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "xlsx"],
  outputFileTracingRoot: resolve(__dirname),
};

export default withSerwist(nextConfig);
