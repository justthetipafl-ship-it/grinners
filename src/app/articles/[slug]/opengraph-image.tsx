import { OG_SIZE, shareImage } from "@/lib/og";
import { getArticle } from "@/lib/data";

export const alt = "Article on Grinners";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  return shareImage({ eyebrow: article?.category ?? "Article", title: article?.title ?? "Grinners" });
}
