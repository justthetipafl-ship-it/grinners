import { ImageResponse } from "next/og";
import { getListing } from "@/lib/data";
import { OgMark, headingFont } from "@/lib/og";

export const revalidate = 3600;

/**
 * The badge a listed creator can put on their own site: "Listed on Grinners", or "Certified Grinner"
 * for listings that hold the badge. Add ?theme=light for a version that suits a white page.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return new Response("Not found", { status: 404 });

  const light = new URL(request.url).searchParams.get("theme") === "light";
  const small = listing.certified ? "CERTIFIED" : "LISTED ON";
  const big = listing.certified ? "GRINNER" : "GRINNERS";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 28,
          padding: "0 40px",
          borderRadius: 36,
          border: `3px solid ${light ? "#d5dade" : "#2a2f36"}`,
          backgroundColor: light ? "#ffffff" : "#0e1012",
          color: light ? "#0e1012" : "#f2f4f5",
        }}
      >
        <OgMark size={104} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 7, color: listing.certified ? "#17b95c" : light ? "#5b6570" : "#9aa3ad" }}>{small}</div>
          <div style={{ display: "flex", fontFamily: "Archivo", fontSize: 62, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>{big}</div>
        </div>
      </div>
    ),
    { width: 560, height: 176, fonts: [{ name: "Archivo", data: await headingFont, weight: 800, style: "normal" }] },
  );
}
