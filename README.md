# Grinners

Winners are Grinners. A discovery directory for sports betting and fantasy tipsters, tools, podcasts, YouTube channels and creators.

## Where things stand

**Built**

- Public site: homepage, five directories with filters, profile pages, free tips feed, articles index, search
- Site shell: header, footer, 18+ gate, responsible-gambling strip
- Database schema: `supabase/migrations/0001_init.sql`
- Admin dashboard at `/admin`: sign in, overview with click counts, add and edit listings, logo upload, publish, feature and sponsor toggles, vetting checklist
- Click tracking: a listing's main button goes through `/go/<slug>`, which counts the click and forwards the visitor

**Not built yet**

- Admin screens for tips, articles, spotlights and sports/categories (these can be edited in Supabase's Table Editor meanwhile)
- Individual article pages, spotlights archive, suggest-a-listing form, newsletter sign-up
- Terms, privacy and editorial policy pages

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
