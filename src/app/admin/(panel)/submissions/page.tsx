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
    .select("id, kind, payload, contact_email, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-3xl uppercase">Suggestions</h1>
      <Notices error={error ?? loadError?.message} />
      <p className="text-sm text-muted">
        Approving a listing request starts a draft listing and opens it, so you can fill in the rest and vet it before publishing. Accepting a
        spotlight request only marks it accepted: reply to them by email, then write the spotlight under Spotlights.
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
                    {s.kind === "feature_request" && (
                      <span className="mr-2 rounded-full border border-spotlight/50 bg-spotlight/15 px-2 py-0.5 text-xs font-semibold text-spotlight">
                        Spotlight request
                      </span>
                    )}
                    {String(s.payload?.name ?? "Unnamed")}
                    {s.kind !== "feature_request" && <span className="font-normal text-muted"> · {String(s.payload?.type ?? "")}</span>}
                  </p>
                  <p className="break-all font-mono text-xs text-muted">{String(s.payload?.url ?? "")}</p>
                </div>
                <span className="text-xs text-muted">
                  {day.format(new Date(s.created_at))} · {s.status}
                </span>
              </div>
              {s.payload?.sports && <p className="mt-2 text-muted">Sports: {String(s.payload.sports)}</p>}
              {s.payload?.why && <p className="mt-2">{String(s.payload.why)}</p>}
              {s.payload?.pitch && <p className="mt-2 whitespace-pre-line">{String(s.payload.pitch)}</p>}
              <p className="mt-2 text-xs text-muted">
                {s.payload?.is_owner ? "Says they run it. " : ""}
                {s.payload?.sponsored_interest ? "Open to a paid, labelled spotlight. " : ""}
                {s.contact_email ? `Contact: ${s.contact_email}` : "No contact email."}
              </p>
              {s.status === "new" && (
                <form action={reviewSubmission} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={s.id} />
                  <button name="decision" value="approve" className="h-9 rounded-control bg-grin px-4 text-xs font-semibold text-ink hover:brightness-110">
                    {s.kind === "feature_request" ? "Accept" : "Approve and start draft"}
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
