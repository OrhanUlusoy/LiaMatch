"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

import { useViewMode } from "@/components/ViewModeProvider";
import { CardSkeleton } from "@/components/ui/Skeleton";

type StudentApplication = {
  id: string;
  status: string;
  created_at: string;
  internships: {
    title: string;
    city: string;
    company_profiles: { company_name: string } | null;
  } | null;
};

type CompanyApplication = {
  id: string;
  status: string;
  created_at: string;
  student_profiles: {
    first_name: string;
    last_name: string;
    track: string;
    city: string;
  } | null;
  internships: { title: string } | null;
};

type VisibleCompany = {
  user_id: string;
  company_name: string;
  city: string;
  website: string | null;
  open_seats: number;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  viewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  contacted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

type HistoryEntry = {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
};

function StatusTimeline({ applicationId, t }: { applicationId: string; t: (k: string) => string }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (loaded) { setOpen((o) => !o); return; }
    const res = await fetch(`/api/applications/history?application_id=${encodeURIComponent(applicationId)}`);
    const data = await res.json();
    if (Array.isArray(data)) setHistory(data);
    setLoaded(true);
    setOpen(true);
  }, [applicationId, loaded]);

  const statusLabel = (s: string) =>
    t(`applications.status${s.charAt(0).toUpperCase() + s.slice(1)}`);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={load}
        className="text-xs text-primary hover:underline"
      >
        {open ? t("applications.hideTimeline") : t("applications.showTimeline")}
      </button>
      {open && history.length > 0 && (
        <div className="mt-2 border-l-2 border-primary/20 pl-4 space-y-2">
          {history.map((h) => (
            <div key={h.id} className="relative">
              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="text-xs">
                <span className="font-medium">{statusLabel(h.new_status)}</span>
                {h.old_status && (
                  <span className="text-muted-foreground"> ← {statusLabel(h.old_status)}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(h.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
      {open && history.length === 0 && (
        <p className="mt-1 text-xs text-muted-foreground">{t("applications.noHistory")}</p>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  const t = useT();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { viewMode } = useViewMode();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Student state
  const [myApplications, setMyApplications] = useState<StudentApplication[]>([]);
  const [visibleCompanies, setVisibleCompanies] = useState<VisibleCompany[]>([]);

  // Company state
  const [companyApplications, setCompanyApplications] = useState<CompanyApplication[]>([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setAuthorized(true);

      // Load data based on viewMode
      if (viewMode === "student") {
        const [appRes, compRes] = await Promise.all([
          fetch("/api/applications"),
          fetch("/api/companies/visible"),
        ]);
        const appData = await appRes.json();
        const compData = await compRes.json();
        if (Array.isArray(appData)) setMyApplications(appData);
        if (Array.isArray(compData)) setVisibleCompanies(compData);
      } else if (viewMode === "company") {
        const appRes = await fetch("/api/applications");
        const appData = await appRes.json();
        if (Array.isArray(appData)) setCompanyApplications(appData);
      }

      setLoading(false);
    })();
  }, [supabase, router, viewMode]);

  async function updateStatus(applicationId: string, status: string) {
    const res = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_id: applicationId, status }),
    });
    if (res.ok) {
      setCompanyApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a)),
      );
    }
  }

  if (loading || !authorized) {
    return (
      <div className="space-y-6 pt-4">
        <div><div className="h-7 w-48 animate-pulse rounded bg-secondary" /></div>
        <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      </div>
    );
  }

  // Student view
  if (viewMode === "student") {
    return (
      <div className="space-y-8">
        {/* My applications */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">{t("applications.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("applications.studentSubtitle")}</p>
          </div>

          {myApplications.length === 0 ? (
            <div className="rounded-md bg-secondary border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">{t("applications.noApplications")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="flex items-start justify-between py-4">
                    <div>
                      <p className="font-medium">{app.internships?.title ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">
                        {app.internships?.company_profiles?.company_name ?? "—"} · {app.internships?.city ?? ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                      <StatusTimeline applicationId={app.id} t={t} />
                    </div>
                    <StatusBadge status={app.status} t={t} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Visible companies */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{t("applications.companiesTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("applications.companiesSubtitle")}</p>
          </div>

          {visibleCompanies.length === 0 ? (
            <div className="rounded-md bg-secondary border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">{t("applications.noCompanies")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleCompanies.map((c) => (
                <Link key={c.user_id} href={`/companies/${c.user_id}`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardHeader>
                      <CardTitle className="text-base">{c.company_name}</CardTitle>
                      <CardDescription>{c.city}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {c.open_seats} {t("applications.openSeats")}
                      </span>
                      {c.website && (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline hover:text-foreground text-muted-foreground"
                        >
                          {t("applications.visitWebsite")}
                        </a>
                      )}
                    </div>
                  </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Company view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("applications.companyTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("applications.companySubtitle")}</p>
      </div>

      {companyApplications.length === 0 ? (
        <div className="rounded-md bg-secondary border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("applications.noIncoming")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companyApplications.map((app) => (
            <Card key={app.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {app.student_profiles?.first_name} {app.student_profiles?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {app.student_profiles?.track} · {app.student_profiles?.city}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("applications.forListing")}: {app.internships?.title ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={app.status} t={t} />
                    <div className="flex gap-1">
                      {app.status === "pending" && (
                        <>
                          <Button
                            variant="secondary"
                            className="h-7 px-2 text-xs"
                            onClick={() => updateStatus(app.id, "contacted")}
                          >
                            {t("applications.statusContacted")}
                          </Button>
                          <Button
                            variant="secondary"
                            className="h-7 px-2 text-xs"
                            onClick={() => updateStatus(app.id, "accepted")}
                          >
                            {t("applications.statusAccepted")}
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-7 px-2 text-xs text-red-500"
                            onClick={() => updateStatus(app.id, "rejected")}
                          >
                            {t("applications.statusRejected")}
                          </Button>
                        </>
                      )}
                      {app.status === "contacted" && (
                        <Button
                          variant="secondary"
                          className="h-7 px-2 text-xs"
                          onClick={() => updateStatus(app.id, "accepted")}
                        >
                          {t("applications.statusAccepted")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-secondary text-foreground"}`}>
      {t(`applications.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
    </span>
  );
}
