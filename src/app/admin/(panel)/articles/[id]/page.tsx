import Link from "next/link";
import { notFound } from "next/navigation";
import { saveArticle } from "../../../actions";
import { Check, Field, Group, Notices, SaveBar, area, input } from "@/components/AdminForm";
import { requireAdmin } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function EditArticle({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const isNew = id === "new";
  const [{ data: article }, { data: categories }] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : supabase.from("articles").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").eq("kind", "article").order("name"),
  ]);
  if (!isNew && !article) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = (article ?? {}) as any;

  return (
    <form action={saveArticle} className="flex max-w-3xl flex-col gap-5">
      <input type="hidden" name="id" value={isNew ? "" : id} />
      <input type="hidden" name="published_at" value={a.published_at ?? ""} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-3xl uppercase">{isNew ? "New article" : "Edit article"}</h1>
        <Link href="/admin/articles" className="text-sm text-muted hover:text-fg">
          ← All articles
        </Link>
      </div>
      <Notices error={error} saved={saved} />
      {!isNew && a.status === "published" && (
        <Link href={`/articles/${a.slug}`} className="text-sm text-spotlight hover:underline" target="_blank">
          View on site ↗
        </Link>
      )}

      <Group title="Article">
        <Field label="Title">
          <input name="title" required defaultValue={a.title ?? ""} className={input} />
        </Field>
        <Field label="Web address (slug)" hint="Leave blank to build it from the title.">
          <input name="slug" defaultValue={a.slug ?? ""} className={input} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select name="category_id" defaultValue={a.category_id ?? ""} className={input}>
              <option value="">None</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Author">
            <input name="author_name" defaultValue={a.author_name ?? "Grinners"} className={input} />
          </Field>
        </div>
        <Field label="Summary" hint="One or two sentences. Shown on cards and in search results.">
          <textarea name="excerpt" rows={2} defaultValue={a.excerpt ?? ""} className={area} />
        </Field>
        <Field
          label="Body"
          hint="Leave a blank line between paragraphs. Start a line with ## for a heading, or with - for a bullet. Write links as [text](https://address)."
        >
          <textarea name="body" rows={18} defaultValue={a.body ?? ""} className={area} />
        </Field>
      </Group>

      <Group title="Disclosure">
        <Check name="is_sponsored" label="Sponsored article (shows the “Sponsored” label)" checked={a.is_sponsored} />
        <Field label="Sponsor name" hint="Required when the article is sponsored. Shown to readers.">
          <input name="sponsor_name" defaultValue={a.sponsor_name ?? ""} className={input} />
        </Field>
      </Group>

      <SaveBar
        status={a.status ?? "draft"}
        options={[
          ["draft", "Draft (hidden)"],
          ["published", "Published (live)"],
          ["archived", "Archived (hidden)"],
        ]}
      />
    </form>
  );
}
