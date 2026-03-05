"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/i18n/useT";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/* ── Types ── */
type RoleBreakdown = { interested: number; needs_more: number; not_for_me: number; total: number };
type Analytics = {
  totals: { all: RoleBreakdown; student: RoleBreakdown; employer: RoleBreakdown };
  comments: { comment: string; role: string; choice: string; created_at: string }[];
  votesPerWeek: { week: string; count: number }[];
  visitorsPerWeek: { week: string; count: number }[];
  conversionRate: number;
  satisfactionScore: number;
  devices: { mobile: number; desktop: number; unknown: number };
  commentCount: number;
  commentRate: number;
  totalVotes: number;
  totalVisitors: number;
};

type Vote = {
  choice: string;
  role: string;
  comment: string | null;
  created_at: string;
};

/* ── Constants ── */
const CHOICE_COLORS: Record<string, string> = {
  interested: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  needs_more: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  not_for_me: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400",
};

const CHOICE_LABELS: Record<string, string> = {
  interested: "Intresserad",
  needs_more: "Behöver mer",
  not_for_me: "Inte för mig",
};

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  employer: "Arbetsgivare",
};

/* ── Simple bar chart component ── */
function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 80 }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[9px] tabular-nums text-muted-foreground">{d.value || ""}</span>
          <div
            className={`w-full rounded-t ${color} transition-all duration-500`}
            style={{ height: `${Math.max((d.value / max) * 60, d.value > 0 ? 4 : 0)}px` }}
          />
          <span className="text-[8px] text-muted-foreground truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Horizontal progress bar ── */
function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums font-medium">{value} ({pct}%)</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-secondary">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── CSV export helper ── */
function downloadCSV(votes: Vote[]) {
  const header = "Datum,Roll,Val,Kommentar\n";
  const rows = votes.map((v) => {
    const date = new Date(v.created_at).toISOString().slice(0, 10);
    const role = ROLE_LABELS[v.role] ?? v.role;
    const choice = CHOICE_LABELS[v.choice] ?? v.choice;
    // Escape commas and quotes in comments
    const comment = v.comment ? `"${v.comment.replace(/"/g, '""')}"` : "";
    return `${date},${role},${choice},${comment}`;
  });
  const csv = header + rows.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `liamatch-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Main Page ── */
export default function AdminFeedbackPage() {
  const t = useT();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<"all" | "withComment">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "employer">("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    const [analyticsRes, votesRes] = await Promise.all([
      fetch("/api/admin/feedback/analytics"),
      fetch("/api/admin/feedback"),
    ]);
    if (!analyticsRes.ok || !votesRes.ok) {
      setError(true);
      setLoading(false);
      return;
    }
    setAnalytics(await analyticsRes.json());
    setVotes(await votesRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <p className="pt-20 text-center text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  if (error || !analytics) {
    return <p className="pt-20 text-center text-sm text-muted-foreground">{t("admin.accessDenied")}</p>;
  }

  // Apply filters
  let filtered = votes;
  if (filter === "withComment") filtered = filtered.filter((v) => v.comment);
  if (roleFilter !== "all") filtered = filtered.filter((v) => v.role === roleFilter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (v) => v.comment?.toLowerCase().includes(q) || v.choice.includes(q) || v.role.includes(q),
    );
  }

  const { totals } = analytics;

  return (
    <div className="space-y-6">
      {/* Header with export */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("adminFeedback.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("adminFeedback.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => downloadCSV(votes)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3v10m0 0l-3-3m3 3l3-3M4 15h12" />
          </svg>
          Exportera CSV
        </button>
      </div>

      {/* KPI cards row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-3xl font-bold">{analytics.totalVotes}</span>
            <span className="text-xs text-muted-foreground">Röster</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-3xl font-bold">{analytics.totalVisitors}</span>
            <span className="text-xs text-muted-foreground">Besökare</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-3xl font-bold">{analytics.conversionRate}%</span>
            <span className="text-xs text-muted-foreground">Svarsfrekvens</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className={`text-3xl font-bold ${analytics.satisfactionScore >= 70 ? "text-green-500" : analytics.satisfactionScore >= 40 ? "text-amber-500" : "text-red-500"}`}>
              {analytics.satisfactionScore}
            </span>
            <span className="text-xs text-muted-foreground">Nöjdhet (0–100)</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-3xl font-bold">{analytics.commentCount}</span>
            <span className="text-xs text-muted-foreground">Kommentarer ({analytics.commentRate}%)</span>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Votes per week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Röster per vecka</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              data={analytics.votesPerWeek.map((w) => ({ label: w.week.slice(5), value: w.count }))}
              color="bg-violet-500"
            />
          </CardContent>
        </Card>

        {/* Visitors per week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Besökare per vecka</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              data={analytics.visitorsPerWeek.map((w) => ({ label: w.week.slice(5), value: w.count }))}
              color="bg-cyan-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Breakdown row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Overall breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ProgressBar label="Intresserad" value={totals.all.interested} total={totals.all.total} color="bg-violet-500" />
            <ProgressBar label="Behöver mer" value={totals.all.needs_more} total={totals.all.total} color="bg-amber-500" />
            <ProgressBar label="Inte för mig" value={totals.all.not_for_me} total={totals.all.total} color="bg-slate-400" />
          </CardContent>
        </Card>

        {/* Student breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Studenter ({totals.student.total})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ProgressBar label="Intresserad" value={totals.student.interested} total={totals.student.total} color="bg-violet-500" />
            <ProgressBar label="Behöver mer" value={totals.student.needs_more} total={totals.student.total} color="bg-amber-500" />
            <ProgressBar label="Inte för mig" value={totals.student.not_for_me} total={totals.student.total} color="bg-slate-400" />
          </CardContent>
        </Card>

        {/* Employer breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Arbetsgivare ({totals.employer.total})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ProgressBar label="Intresserad" value={totals.employer.interested} total={totals.employer.total} color="bg-violet-500" />
            <ProgressBar label="Behöver mer" value={totals.employer.needs_more} total={totals.employer.total} color="bg-amber-500" />
            <ProgressBar label="Inte för mig" value={totals.employer.not_for_me} total={totals.employer.total} color="bg-slate-400" />
          </CardContent>
        </Card>
      </div>

      {/* Device breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Enheter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
              Dator: <span className="font-medium">{analytics.devices.desktop}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
              Mobil: <span className="font-medium">{analytics.devices.mobile}</span>
            </div>
            {analytics.devices.unknown > 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-slate-400" />
                Okänd: <span className="font-medium">{analytics.devices.unknown}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Alla röster &amp; kommentarer</h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            Alla ({votes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("withComment")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filter === "withComment" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            Med kommentar ({votes.filter((v) => v.comment).length})
          </button>

          <div className="h-5 w-px bg-border" />

          {(["all", "student", "employer"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${roleFilter === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {r === "all" ? "Alla roller" : ROLE_LABELS[r]}
            </button>
          ))}

          <div className="ml-auto">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök i kommentarer…"
              className="rounded-md border border-border bg-input px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Filtered list */}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("adminFeedback.noVotes")}</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((v, i) => (
              <Card key={i}>
                <CardContent className="flex items-start gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CHOICE_COLORS[v.choice] ?? "bg-secondary"}`}>
                        {CHOICE_LABELS[v.choice] ?? v.choice}
                      </span>
                      <Badge>{ROLE_LABELS[v.role] ?? v.role}</Badge>
                    </div>
                    {v.comment && (
                      <p className="mt-1.5 text-sm">{v.comment}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString("sv-SE")}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
