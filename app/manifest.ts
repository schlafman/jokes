import type { MetadataRoute } from "next";

// PWA manifest (DESIGN "PWA — שם, צבע ואייקון"). No service worker and no offline support.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "מחולל בדיחות",
    short_name: "בדיחות",
    description: "בדיחה על כל נושא שתרצו",
    start_url: "/",
    display: "standalone",
    lang: "he",
    dir: "rtl",
    theme_color: "#FFD400",
    background_color: "#FFFFFF",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
