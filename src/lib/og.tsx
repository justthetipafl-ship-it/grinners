import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Share image used when a Grinners link is posted to X and elsewhere. */
export function shareImage({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#0e1012",
          backgroundImage:
            "radial-gradient(circle at 10% 0%, rgba(34,211,107,0.22), transparent 55%), radial-gradient(circle at 95% 5%, rgba(124,92,255,0.25), transparent 50%)",
          color: "#f2f4f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
            <path d="M7 7.5l5.5 5.5M12.5 7.5L7 13" stroke="#f2f4f5" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="22.5" cy="10.25" r="2.5" fill="#f2f4f5" />
            <path d="M5.5 19.5l7 7L27 15" stroke="#22d36b" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>GRINNERS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 30, color: "#22d36b" }}>{eyebrow}</div>
          <div style={{ display: "flex", fontSize: title.length > 40 ? 68 : 88, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
          {subtitle && <div style={{ display: "flex", fontSize: 32, color: "#9aa3ad", lineHeight: 1.3 }}>{subtitle.slice(0, 120)}</div>}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#9aa3ad" }}>Winners are Grinners · 18+</div>
      </div>
    ),
    OG_SIZE,
  );
}
