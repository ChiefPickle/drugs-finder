import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Drug Finder — Physician Drug Search",
    short_name: "Drug Finder",
    description: "Israeli prescription drug search, prices, AI summaries, and prescriptions",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f5",
    theme_color: "#c96442",
    lang: "he",
    dir: "rtl",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
