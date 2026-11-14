import { OG_SIZE, shareImage } from "@/lib/og";
import { getListing } from "@/lib/data";
import { DIRECTORIES, type DirectoryKey } from "@/lib/types";

export const alt = "Listing on Grinners";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ directory: string; slug: string }> }) {
  const { directory, slug } = await params;
  const listing = await getListing(slug);
  return shareImage({
    eyebrow: DIRECTORIES[directory as DirectoryKey]?.title ?? "Grinners",
    title: listing?.name ?? "Grinners",
    subtitle: listing?.tagline,
  });
}
