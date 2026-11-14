import { OG_SIZE, shareImage } from "@/lib/og";

export const alt = "Grinners: Winners are Grinners";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return shareImage({
    eyebrow: "Tipsters · Tools · Podcasts · YouTube · Creators",
    title: "Winners are Grinners.",
    subtitle: "The home of sports betting and fantasy content.",
  });
}
