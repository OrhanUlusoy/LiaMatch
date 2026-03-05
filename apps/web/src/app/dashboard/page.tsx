"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { useViewMode } from "@/components/ViewModeProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatSkeleton, CardSkeleton } from "@/components/ui/Skeleton";

type Stats = {
  matchCount: number;
  applicationCount: number;
  topScore: number | null;
  profileComplete: boolean;
  profileCompletion: number;
};

type CompanyStats = {
  listingCount: number;
  totalApplicants: number;
  openSeats: number;
  profileComplete: boolean;
  profileCompletion: number;
  visible: boolean;
};

type SuggestedCompany = {
  user_id: string;
  company_name: string;
  city: string;
  score: number;
  bestListing: string;
};

type SuggestedStudent = {
  user_id: string;
  first_name: string;
  last_name: string;
  track: string;
  city: string;
  score: number;
  bestListing: string;
};

function StatCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <Card className={href ? "transition-colors hover:border-primary/40" : ""}>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <span className="text-3xl font-bold">{value}</span>
        <span className="mt-1 text-sm text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

type WeeklyData = { week: string; count: number };

function MiniBarChart({ data, label }: { data: WeeklyData[]; label: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5" style={{ height: 100 }}>
          {data.map((d) => (
            <div key={d.week} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/80 transition-all"
                style={{ height: `${(d.count / max) * 80}px`, minHeight: d.count > 0 ? 4 : 0 }}
              />
              <span className="text-[10px] text-muted-foreground">{d.week}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusFunnel({ data, t }: { data: Record<string, number>; t: (k: string) => string }) {
  const stages = ["pending", "viewed", "contacted", "accepted"];
  const colors: Record<string, string> = {
    pending: "bg-yellow-500",
    viewed: "bg-blue-500",
    contacted: "bg-purple-500",
    accepted: "bg-green-500",
  };
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.funnel")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className="w-24 text-xs">{t(`applications.status${s.charAt(0).toUpperCase() + s.slice(1)}`)}</span>
            <div className="flex-1 h-4 rounded bg-secondary overflow-hidden">
              <div
                className={`h-full rounded ${colors[s]}`}
                style={{ width: `${((data[s] ?? 0) / total) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs font-medium">{data[s] ?? 0}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const t = useT();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { viewMode } = useViewMode();
  const [loading, setLoading] = useState(true);

  // Suggestions
  const [suggestedCompanies, setSuggestedCompanies] = useState<SuggestedCompany[]>([]);
  const [suggestedStudents, setSuggestedStudents] = useState<SuggestedStudent[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Student state
  const [studentStats, setStudentStats] = useState<Stats>({
    matchCount: 0,
    applicationCount: 0,
    topScore: null,
    profileComplete: false,
    profileCompletion: 0,
  });

  // Company state
  const [companyStats, setCompanyStats] = useState<CompanyStats>({
    listingCount: 0,
    totalApplicants: 0,
    openSeats: 0,
    profileComplete: false,
    profileCompletion: 0,
    visible: false,
  });

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      if (viewMode === "student") {
        const [matchRes, appRes, profileRes, sugRes] = await Promise.all([
          fetch("/api/matches/student"),
          fetch("/api/applications"),
          supabase
            .from("student_profiles")
            .select("first_name, last_name, track, school, city, github_url, linkedin_url, skills, cv_file_url, project_title")
            .eq("user_id", user.id)
            .single(),
          fetch("/api/suggestions/student"),
        ]);
        const matches = await matchRes.json();
        const apps = await appRes.json();
        const suggestions = await sugRes.json();
        if (Array.isArray(suggestions)) setSuggestedCompanies(suggestions);

        const sp = profileRes.data;
        const studentFields = [sp?.first_name, sp?.last_name, sp?.track, sp?.school, sp?.city, sp?.github_url, sp?.linkedin_url, (sp?.skills as string[] | null)?.length, sp?.cv_file_url, sp?.project_title];
        const filledStudent = studentFields.filter(Boolean).length;
        const totalStudent = studentFields.length;

        setStudentStats({
          matchCount: Array.isArray(matches) ? matches.length : 0,
          applicationCount: Array.isArray(apps) ? apps.length : 0,
          topScore: Array.isArray(matches) && matches.length > 0 ? matches[0].score : null,
          profileComplete: Boolean(sp?.first_name && sp?.track && sp?.city),
          profileCompletion: Math.round((filledStudent / totalStudent) * 100),
        });
      } else if (viewMode === "company") {
        const [listingsRes, appRes, profileRes, sugRes] = await Promise.all([
          supabase
            .from("internships")
            .select("id, seats")
            .eq("company_user_id", user.id),
          fetch("/api/applications"),
          supabase
            .from("company_profiles")
            .select("company_name, city, website, description, vision, looking_for, logo_url, visible")
            .eq("user_id", user.id)
            .single(),
          fetch("/api/suggestions/company"),
        ]);
        const apps = await appRes.json();
        const suggestions = await sugRes.json();
        if (Array.isArray(suggestions)) setSuggestedStudents(suggestions);

        const listings = listingsRes.data ?? [];
        const cp = profileRes.data;
        const companyFields = [cp?.company_name, cp?.city, cp?.website, cp?.description, cp?.vision, cp?.looking_for, cp?.logo_url];
        const filledCompany = companyFields.filter(Boolean).length;
        const totalCompany = companyFields.length;

        setCompanyStats({
          listingCount: listings.length,
          totalApplicants: Array.isArray(apps) ? apps.length : 0,
          openSeats: listings.reduce((sum, l) => sum + (l.seats ?? 0), 0),
          profileComplete: Boolean(cp?.company_name),
          profileCompletion: Math.round((filledCompany / totalCompany) * 100),
          visible: cp?.visible ?? false,
        });

        // Compute weekly application data & status funnel
        if (Array.isArray(apps)) {
          const counts: Record<string, number> = {};
          const statusC: Record<string, number> = {};
          for (const a of apps as { created_at: string; status: string }[]) {
            const d = new Date(a.created_at);
            const week = `v${Math.ceil((d.getDate()) / 7)}`;
            counts[week] = (counts[week] ?? 0) + 1;
            statusC[a.status] = (statusC[a.status] ?? 0) + 1;
          }
          const weeks = ["v1", "v2", "v3", "v4", "v5"];
          setWeeklyData(weeks.map((w) => ({ week: w, count: counts[w] ?? 0 })));
          setStatusCounts(statusC);
        }
      }

      setLoading(false);
    })();
  }, [supabase, router, viewMode]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="h-7 w-40 animate-pulse rounded bg-secondary" /><div className="mt-2 h-4 w-64 animate-pulse rounded bg-secondary" /></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatSkeleton /><StatSkeleton /><StatSkeleton />
        </div>
        <div className="grid gap-4 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>
      </div>
    );
  }

  if (viewMode === "student") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{t("dashboard.studentTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.studentSubtitle")}</p>
        </div>

        {!studentStats.profileComplete && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="flex items-center gap-4 py-4">
              <svg className="h-6 w-6 shrink-0 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium">{t("dashboard.profileIncomplete")}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.profileIncompleteHint")}</p>
              </div>
              <Link href="/profile">
                <Button variant="secondary" className="shrink-0">{t("dashboard.goProfile")}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={t("dashboard.matches")} value={studentStats.matchCount} href="/match" />
          <StatCard label={t("dashboard.applications")} value={studentStats.applicationCount} href="/applications" />
          <StatCard label={t("dashboard.bestScore")} value={studentStats.topScore ?? "—"} href="/match" />
        </div>

        <ProgressBar value={studentStats.profileCompletion} label={t("dashboard.profileCompletion")} />

        {/* AI Suggestions */}
        {suggestedCompanies.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("dashboard.suggestedCompanies")}</h2>
              <Link href="/match" className="text-sm text-primary hover:underline">{t("dashboard.viewAll")}</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {suggestedCompanies.map((c) => (
                <Link key={c.user_id} href={`/companies/${c.user_id}`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{c.company_name}</p>
                          <p className="text-xs text-muted-foreground">{c.city}</p>
                          {c.bestListing && <p className="mt-1 text-xs text-muted-foreground truncate">{c.bestListing}</p>}
                        </div>
                        <span className="ml-2 shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{c.score}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/match">
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader>
                <CardTitle className="text-base">{t("dashboard.quickMatch")}</CardTitle>
                <CardDescription>{t("dashboard.quickMatchDesc")}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/explore">
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader>
                <CardTitle className="text-base">{t("dashboard.quickExplore")}</CardTitle>
                <CardDescription>{t("dashboard.quickExploreDesc")}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  // Company view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.companyTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.companySubtitle")}</p>
      </div>

      {!companyStats.profileComplete && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <svg className="h-6 w-6 shrink-0 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium">{t("dashboard.profileIncomplete")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.profileIncompleteHint")}</p>
            </div>
            <Link href="/profile">
              <Button variant="secondary" className="shrink-0">{t("dashboard.goProfile")}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!companyStats.visible && companyStats.profileComplete && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <svg className="h-6 w-6 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium">{t("dashboard.notVisible")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.notVisibleHint")}</p>
            </div>
            <Link href="/profile">
              <Button variant="secondary" className="shrink-0">{t("dashboard.goProfile")}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("dashboard.listings")} value={companyStats.listingCount} href="/my-listings" />
        <StatCard label={t("dashboard.applicants")} value={companyStats.totalApplicants} href="/applications" />
        <StatCard label={t("dashboard.seats")} value={companyStats.openSeats} />
      </div>

      <ProgressBar value={companyStats.profileCompletion} label={t("dashboard.profileCompletion")} />

      {/* Charts */}
      {weeklyData.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <MiniBarChart data={weeklyData} label={t("dashboard.weeklyApps")} />
          <StatusFunnel data={statusCounts} t={t} />
        </div>
      )}

      {/* Suggested students */}
      {suggestedStudents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("dashboard.suggestedStudents")}</h2>
            <Link href="/list" className="text-sm text-primary hover:underline">{t("dashboard.viewAll")}</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {suggestedStudents.map((s) => (
              <Link key={s.user_id} href={`/students/${s.user_id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-muted-foreground">{s.track} · {s.city}</p>
                        {s.bestListing && <p className="mt-1 text-xs text-muted-foreground truncate">Bäst: {s.bestListing}</p>}
                      </div>
                      <span className="ml-2 shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{s.score}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/my-listings">
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.quickListings")}</CardTitle>
              <CardDescription>{t("dashboard.quickListingsDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/list">
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.quickCandidates")}</CardTitle>
              <CardDescription>{t("dashboard.quickCandidatesDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
