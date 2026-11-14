# Grinners

Winners are Grinners. A discovery directory for sports betting and fantasy tipsters, tools, podcasts, YouTube channels and creators.

## Where things stand

**Built**

- Public site: homepage, five directories with filters, profile pages with preview images, sport hubs (`/sports/afl`), free tips feed with a shareable page per tip, articles, spotlights archive (`/spotlight`), search
- Suggest-a-listing form (`/submit`) and newsletter sign-up
- Trust pages: about, how we make money, editorial policy, responsible gambling, terms, privacy (all draft wording for legal review)
- Site shell: header, footer, 18+ gate, responsible-gambling strip
- Search-engine and sharing groundwork: sitemap, robots file, a generated share image for every listing and article, Share to X buttons
- Admin dashboard at `/admin`: overview with click, sign-up and suggestion counts; listings; tips with grading; articles; spotlight scheduling; suggestion review; sports, markets and categories
- Latest videos and episodes: set a feed on a YouTube or podcast listing, then press **Refresh feeds** on the admin overview
- Click tracking: a listing's main button goes through `/go/<slug>`, which counts the click and forwards the visitor

**Not built yet**

- Sending the newsletter (sign-ups are collected; sending needs an email service)
- Creator logins

Until the database is connected the site shows the invented sample content in `src/data/sample.ts`.

## Connecting the database (one-off, all in the browser)

1. **Create the tables.** In Supabase open **SQL Editor**, paste the whole of `supabase/migrations/0001_init.sql`, press **Run**.
2. **Optional sample content.** Paste and run `supabase/sample_data.sql` the same way to see the site populated.
3. **Create your login.** In Supabase open **Authentication > Users > Add user**. Enter your email and a strong password, and tick **Auto Confirm User**.
4. **Give Vercel the two settings.** In Supabase open **Project Settings > API Keys** (the project URL is under **Data API**). In Vercel open the project, then **Settings > Environment Variables**, and add:
   - `NEXT_PUBLIC_SUPABASE_URL`: the project URL, like `https://abcd1234.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the **publishable** key (older projects call it the `anon` key). Never the secret or `service_role` key.
5. **Redeploy.** In Vercel open **Deployments**, press the three dots on the latest one, choose **Redeploy**.
6. **Make yourself an admin.** Go to `/admin` on the live site and sign in. The page shows one line of SQL with your user ID. Paste it into Supabase's SQL Editor, run it, reload.

### Database updates after the first setup

Run these in Supabase's SQL Editor, once each, in order:

- `supabase/migrations/0002_spotlight_archive.sql`: lets the `/spotlight` page show past spotlights. Until it's run, that page shows only the current one.
- `supabase/migrations/0003_popular_listings.sql`: lets the homepage rank tools by real clicks. Until it's run, and until three tools each have at least three clicks in 30 days, that section is headed "Featured tools" and shows featured tools first.

### Optional: refresh feeds automatically every day

Without this, feeds update whenever you press **Refresh feeds** in admin. To have them update on their own at about 5am Brisbane time, add two more settings in Vercel (**Settings > Environment Variables**), both as type **Secret**, then redeploy:

- `SUPABASE_SECRET_KEY`: in Supabase, **Project Settings > API Keys**, the **secret** key (older projects: `service_role`). This key can change anything in the database, so it only ever goes here.
- `CRON_SECRET`: any long random string you make up, 20 characters or more.

### Starter listings (real sites and shows, as drafts)

`supabase/starter_listings.sql` loads about 30 real tools, podcasts and services as hidden drafts. Run it in the SQL Editor, then open each one under Admin > Listings: it shows a note on what to check, and nothing goes live until you tick the vetting box and publish.

### Platform icons

Profiles show a small icon beside each link (X, YouTube, Spotify and so on). The brand marks come from the open-source Simple Icons package and are shown unaltered, in white, at 24 pixels, each linking only to that platform. The trade marks belong to the platforms and their brand guidelines apply. YouTube asks that uses of its icon be approved through the request form on its brand resources page, and both YouTube and Spotify prefer artwork downloaded from their own sites.

### Removing sample content

Run these two lines in the SQL Editor:

```sql
delete from listings where attributes->>'sample' = 'true';
delete from articles where seo_description = 'sample';
```

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
