/** Shared building blocks for admin forms. */
export const input = "h-11 w-full rounded-control border border-line bg-raised px-3";
export const area = "w-full rounded-control border border-line bg-raised px-3 py-2";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Check({ name, value, label, checked }: { name: string; value?: string; label: string; checked?: boolean }) {
  return (
    <label className="flex min-h-10 items-center gap-2 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="h-4 w-4 accent-[var(--color-grin)]" />
      {label}
    </label>
  );
}

export function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

export function Notices({ error, saved }: { error?: string; saved?: string }) {
  return (
    <>
      {error && (
        <p role="alert" className="rounded-control border border-loss/50 bg-loss/10 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded-control border border-grin/50 bg-grin/10 px-3 py-2 text-sm">
          Saved. Changes appear on the site straight away.
        </p>
      )}
    </>
  );
}

export function SaveBar({ status, options }: { status: string; options: [string, string][] }) {
  return (
    <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-ink/95 px-4 py-3 backdrop-blur">
      <select name="status" defaultValue={status} aria-label="Status" className="h-11 rounded-control border border-line bg-raised px-3 text-sm">
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button className="h-11 rounded-control bg-grin px-6 font-semibold text-ink hover:brightness-110">Save</button>
    </div>
  );
}
