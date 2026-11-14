# Grinners

Winners are Grinners. A discovery directory for sports betting and fantasy tipsters, tools, podcasts, YouTube channels and creators.

## Where things stand

**Built (phases 1 to 3, public site on sample content)**

- Site shell: header, footer, 18+ gate, responsible-gambling strip
- Homepage
- Five directories with sport and price filters: `/tipsters`, `/tools`, `/podcasts`, `/youtube`, `/creators`
- Listing profile pages, with affiliate and sponsored labels
- Free tips feed, articles index, search
- Database schema, ready to paste into Supabase: `supabase/migrations/0001_init.sql`

**Not built yet**

- Supabase connection (the site currently reads `src/data/sample.ts`)
- Admin dashboard
- `/go/[slug]` click tracking
- Individual article pages, spotlights archive, suggest-a-listing form, newsletter sign-up
- Terms, privacy and editorial policy pages

All names and results in `src/data/sample.ts` are invented.

## Putting it live with Vercel (no terminal needed)

1. Go to vercel.com and sign in with GitHub.
2. Choose **Add New > Project** and import this repository.
3. Leave every setting as detected and press **Deploy**.
4. Each later commit to `main` redeploys automatically.

Optional: under **Settings > Environment Variables** add `NEXT_PUBLIC_SITE_URL` with the live address, for example `https://grinners.com.au`.

## Where to change things

| To change | Edit |
| --- | --- |
| Colours, fonts, corner radius | `src/app/globals.css` |
| Sample listings, tips, articles | `src/data/sample.ts` |
| Navigation | `src/components/Header.tsx` |
| Footer and responsible-gambling wording | `src/components/Footer.tsx` |
| Logo mark | `src/components/Logo.tsx` and `src/app/icon.svg` |
