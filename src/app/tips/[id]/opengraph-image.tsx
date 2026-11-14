import { OG_SIZE, shareImage } from "@/lib/og";
import { getListing, getTip } from "@/lib/data";

export const alt = "Free tip on Grinners";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tip = await getTip(id);
  if (!tip) return shareImage({ eyebrow: "Free Tips", title: "Grinners" });
  const author = await getListing(tip.listingSlug);
  return shareImage({
    eyebrow: `${tip.event} · ${tip.market}`,
    title: `${tip.selection} @ ${tip.odds.toFixed(2)}`,
    subtitle: author ? `Free tip from ${author.name}` : "Free tip",
  });
}
