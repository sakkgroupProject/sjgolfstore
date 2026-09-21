import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: { href?: string; label: string }[];
}) {
  return (
    <div className="mb-6">
      {breadcrumb?.length ? (
        <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft">
          {breadcrumb.map((b, i) => (
            <span key={b.label} className="flex items-center gap-1.5">
              {b.href ? <Link href={b.href} className="hover:text-ink">{b.label}</Link> : <span className="text-ink">{b.label}</span>}
              {i < breadcrumb.length - 1 ? <span className="text-[#c9cec9]">/</span> : null}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[1.6rem]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

const TONES: Record<string, string> = {
  paid: "bg-forest/10 text-forest",
  success: "bg-forest/10 text-forest",
  active: "bg-forest/10 text-forest",
  approved: "bg-forest/10 text-forest",
  healthy: "bg-forest/10 text-forest",
  completed: "bg-forest/10 text-forest",
  delivered: "bg-forest/10 text-forest",
  complete: "bg-forest/10 text-forest",
  shipped: "bg-[#1d4ed8]/10 text-[#1d4ed8]",
  processing: "bg-[#1d4ed8]/10 text-[#1d4ed8]",
  scheduled: "bg-[#1d4ed8]/10 text-[#1d4ed8]",
  pending: "bg-[#b45309]/10 text-[#b45309]",
  unfulfilled: "bg-[#b45309]/10 text-[#b45309]",
  partially_refunded: "bg-[#b45309]/10 text-[#b45309]",
  failing: "bg-red-500/10 text-red-600",
  failed: "bg-red-500/10 text-red-600",
  refunded: "bg-red-500/10 text-red-600",
  cancelled: "bg-red-500/10 text-red-600",
  rejected: "bg-red-500/10 text-red-600",
  expired: "bg-ink/10 text-ink-soft",
  disabled: "bg-ink/10 text-ink-soft",
};

export function Badge({ children }: { children: string }) {
  const tone = TONES[children] ?? "bg-ink/[0.07] text-ink-soft";
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-[0.68rem] font-semibold capitalize ${tone}`}>
      {children.replace(/_/g, " ")}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-sm border bg-white p-5 ${accent ? "border-forest/30" : "border-[#e2e6e2]"}`}>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export function Panel({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-[#e2e6e2] bg-white">
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1ee] px-5 py-3.5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#eef1ee] text-left">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap py-2.5 pr-4 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f3f1]">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-[#d8ddd8] bg-white px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {body ? <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[0.7rem] text-ink-soft">{hint}</span> : null}
    </label>
  );
}

export function MiniBarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-40 items-end gap-1.5">
      {data.map((v, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-full w-full items-end">
            <div
              className="w-full rounded-t-sm bg-forest/80 transition-all group-hover:bg-forest"
              style={{ height: `${Math.max((v / max) * 100, 3)}%` }}
              title={`$${(v / 100).toFixed(0)}`}
            />
          </div>
          <span className="text-[0.6rem] text-ink-soft">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
