// Builds supabase/sample_data.sql from src/data/sample.ts.  Run: node scripts/make-seed.mts
import { writeFileSync } from "node:fs";
import { listings, articles, spotlight, tips } from "../src/data/sample.ts";

const q = (v: string | null | undefined) => (v == null ? "null" : `'${v.replace(/'/g, "''")}'`);
const arr = (v: string[] | undefined, cast = "text") => `array[${(v ?? []).map(q).join(", ")}]::${cast}[]`;
const out: string[] = [
  "-- SAMPLE CONTENT. Invented names and results, for seeing the site populated.",
  "-- To apply: Supabase dashboard > SQL Editor > paste this whole file > Run.",
  "-- To remove later, run the two lines at the bottom of the README section 'Removing sample content'.",
  "",
];

for (const l of listings) {
  out.push(
    `insert into listings (slug, name, types, tagline, bio, pricing, pricing_note, sports, markets, category, features, status, is_featured, vetted_at, attributes) values (${q(l.slug)}, ${q(l.name)}, ${arr(l.types, "listing_type")}, ${q(l.tagline)}, ${q(l.bio)}, ${q(l.pricing)}, ${q(l.pricingNote)}, ${arr(l.sports)}, ${arr(l.markets)}, ${q(l.category)}, ${arr(l.features)}, 'published', ${l.isFeatured ? "true" : "false"}, now(), '{"sample": true}');`,
  );
  l.links.forEach((link, i) =>
    out.push(`insert into listing_links (listing_id, platform, url, sort_order) select id, ${q(link.platform)}, ${q(link.url)}, ${i} from listings where slug = ${q(l.slug)};`),
  );
  if (l.cta)
    out.push(
      `insert into affiliate_links (listing_id, slug, destination_url, label, is_affiliate) select id, ${q(l.slug)}, ${q(l.cta.url)}, ${q(l.cta.label)}, ${l.cta.affiliate} from listings where slug = ${q(l.slug)};`,
    );
}
out.push("");
for (const a of articles)
  out.push(
    `insert into articles (slug, title, excerpt, author_name, status, published_at, category_id, seo_description) select ${q(a.slug)}, ${q(a.title)}, ${q(a.excerpt)}, ${q(a.author)}, 'published', ${q(a.publishedAt)}, (select id from categories where kind = 'article' and name = ${q(a.category)}), 'sample';`,
  );
out.push(
  "",
  `insert into spotlights (kind, listing_id, headline, body, starts_on, ends_on) select ${q(spotlight.kind)}, id, ${q(spotlight.headline)}, ${q(spotlight.body)}, current_date, current_date + 30 from listings where slug = ${q(spotlight.listingSlug)};`,
  "",
  "-- Tips are dated a few days ahead so they can be published (a tip can't be published after its event starts).",
);
tips.forEach((t, i) =>
  out.push(
    `insert into tips (listing_id, sport_id, event_name, event_start, market_label, selection, odds, bookmaker, analysis, status, published_at) select l.id, s.id, ${q(t.event)}, now() + interval '${i + 2} days', ${q(t.market)}, ${q(t.selection)}, ${t.odds}, ${q(t.bookmaker)}, ${q(t.analysis)}, 'published', now() from listings l, sports s where l.slug = ${q(t.listingSlug)} and s.slug = ${q(t.sport)};`,
  ),
);
writeFileSync(new URL("../supabase/sample_data.sql", import.meta.url), out.join("\n") + "\n");
console.log("wrote supabase/sample_data.sql");
