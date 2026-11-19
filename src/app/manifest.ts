import type { MetadataRoute } from "next";

/** Lets phones and desktops install Grinners as an app, with the badge as its icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grinners",
    short_name: "Grinners",
    description: "The home of sports betting and fantasy content. 18+ only.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1012",
    theme_color: "#0e1012",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
