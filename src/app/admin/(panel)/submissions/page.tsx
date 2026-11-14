import { reviewSubmission } from "../../actions";
import { Notices } from "@/components/AdminForm";
import { requireAdmin } from "@/lib/supabase";

const day = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Brisbane", day: "numeric", month: "short" });

export default async function AdminSubmissions({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return null;
  const { data: submissions, error: loadError } = await supabase
    .from("submissions")
    .select("id, payload, contact_email, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-3xl uppercase">Suggestions</h1>
      <Notices error={error ?? loadError?.message} />
      <p className="text-sm text-muted">
        Approving starts a draft listing from the suggestion and opens it, so you can fill in the rest and vet it before publishing.
        Treat every link here as unchecked.
      </p>
      {submissions?.length ? (
        <ul className="flex flex-col gap-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {submissions.map((s: any) => (
            <li key={s.id} className="rounded-card border border-line bg-surface p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {String(s.payload?.name ?? "Unnamed")} <span className="font-normal text-muted">· {String(s.payload?.type ?? "")}</span>
                  </p>
                  <p className="break-all font-mono text-xs text-muted">{String(s.payload?.url ?? "")}</p>
                </div>
                <span className="text-xs text-muted">
                  {day.format(new Date(s.created_at))} · {s.status}
                </span>
              </div>
              {s.payload?.sports && <p className="mt-2 text-muted">Sports: {String(s.payload.sports)}</p>}
              {s.payload?.why && <p className="mt-2">{String(s.payload.why)}</p>}
              <p className="mt-2 text-xs text-muted">
                {s.payload?.is_owner ? "Says they run it. " : ""}
                {s.contact_email ? `Contact: ${s.contact_email}` : "No contact email."}
              </p>
              {s.status === "new" && (
                <form action={reviewSubmission} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={s.id} />
                  <button name="decision" value="approve" className="h-9 rounded-control bg-grin px-4 text-xs font-semibold text-ink hover:brightness-110">
                    Approve and start draft
                  </button>
                  <button name="decision" value="reject" className="h-9 rounded-control border border-line px-4 text-xs text-muted hover:text-fg">
                    Reject
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !loadError && <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">No suggestions yet.</p>
      )}
    </div>
  );
}
