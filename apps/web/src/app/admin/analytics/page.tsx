"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useT } from "@/i18n/useT";

type Analytics = {
  totals: {
    users: number;
    students: number;
    companies: number;
    internships: number;
    totalSeats: number;
    applications: number;
    messages: number;
  };
  statusBreakdown: Record<string, number>;
  registrationsPerWeek: { week: string; count: number }[];
  applicationsPerWeek: { week: string; count: number }[];
  popularTracks: { track: string; count: number }[];
  popularCities: { city: string; count: number }[];
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-4 w-full rounded-full bg-secondary">
      <div className={`h-4 rounded-full ${color}`} style={{ width: `${pct}%`, transition: "width 0.5s" }} />
    </div>
  );
}

function WeeklyChart({ data, color }: { data: { week: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 120 }}>
      {data.map((d) => {
        const h = max > 0 ? (d.count / max) * 100 : 0;
        return (
          <div key={d.week} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{d.count || ""}</span>
            <div className={`w-full rounded-t ${color}`} style={{ height: `${h}%`, minHeight: d.count > 0 ? 4 : 0, transition: "height 0.5s" }} />
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">
              {d.week.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  viewed: "bg-blue-500",
  contacted: "bg-cyan-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
};

const statusLabels: Record<string, { sv: string; en: string }> = {
  pending: { sv: "Väntar", en: "Pending" },
  viewed: { sv: "Visad", en: "Viewed" },
  contacted: { sv: "Kontaktad", en: "Contacted" },
  accepted: { sv: "Godkänd", en: "Accepted" },
  rejected: { sv: "Nekad", en: "Rejected" },
};

export default function AdminAnalyticsPage() {
  const t = useT();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg pt-20 text-center">
        <Card>
          <CardContent className="py-10">
            <p className="text-sm font-medium text-red-500">{t("admin.accessDenied")}</p>
            <p className="mt-2 text-xs text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tot = data.totals;
  const maxStatus = Math.max(...Object.values(data.statusBreakdown), 1);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("analytics.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("analytics.subtitle")}</p>
        </div>
        <Link href="/admin" className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
          ← {t("admin.title")}
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: t("analytics.users"), value: tot.users, color: "text-foreground" },
          { label: t("analytics.students"), value: tot.students, color: "text-violet-500" },
          { label: t("analytics.companies"), value: tot.companies, color: "text-cyan-500" },
          { label: t("analytics.internships"), value: tot.internships, color: "text-blue-500" },
          { label: t("analytics.seats"), value: tot.totalSeats, color: "text-emerald-500" },
          { label: t("analytics.applications"), value: tot.applications, color: "text-amber-500" },
          { label: t("analytics.messages"), value: tot.messages, color: "text-pink-500" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="py-4 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Registrations per week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("analytics.registrations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyChart data={data.registrationsPerWeek} color="bg-violet-500" />
          </CardContent>
        </Card>

        {/* Applications per week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("analytics.applicationsWeek")}</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyChart data={data.applicationsPerWeek} color="bg-amber-500" />
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Application status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("analytics.statusBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <span className="w-20 text-xs text-muted-foreground">
                  {statusLabels[status]?.sv ?? status}
                </span>
                <Bar value={count} max={maxStatus} color={statusColors[status] ?? "bg-secondary"} />
                <span className="w-6 text-right text-xs font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(data.statusBreakdown).length === 0 && (
              <p className="text-xs text-muted-foreground">{t("analytics.noData")}</p>
            )}
          </CardContent>
        </Card>

        {/* Popular tracks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("analytics.popularTracks")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.popularTracks.map((tr) => (
              <div key={tr.track} className="flex items-center justify-between">
                <span className="text-sm">{tr.track}</span>
                <span className="text-xs font-medium text-muted-foreground">{tr.count}</span>
              </div>
            ))}
            {data.popularTracks.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("analytics.noData")}</p>
            )}
          </CardContent>
        </Card>

        {/* Popular cities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("analytics.popularCities")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.popularCities.map((c) => (
              <div key={c.city} className="flex items-center justify-between">
                <span className="text-sm">{c.city}</span>
                <span className="text-xs font-medium text-muted-foreground">{c.count}</span>
              </div>
            ))}
            {data.popularCities.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("analytics.noData")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
