"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useViewMode } from "@/components/ViewModeProvider";
import { CardSkeleton } from "@/components/ui/Skeleton";

type Reason = { key: string; label: string; points: number };

type StudentMatch = {
  internship: {
    id: string;
    title: string;
    city: string;
    track_focus: string;
    skills: string[];
    period_start: string | null;
    period_end: string | null;
    company_profiles: { company_name: string } | null;
  };
  score: number;
  reasons: Reason[];
};

function reasonLabel(r: Reason): string {
  const labels: Record<string, string> = {
    track_exact: "Inriktning matchar exakt",
    track_related: "Relaterad inriktning",
    track_none: "Inriktning matchar ej",
    city_exact: "Stad matchar exakt",
    city_remote: "Remote möjligt",
    city_region: "Samma region",
    city_none: "Stad matchar ej",
    period_full: "Period matchar helt",
    period_partial: "Period matchar delvis",
    period_none: "Period matchar ej",
    period_unknown: "Period okänd",
  };
  if (r.key === "skills") return `Skills: ${r.label}`;
  return labels[r.label] ?? r.label;
}

export default function MatchPage() {
  const t = useT();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { viewMode } = useViewMode();
  const [matches, setMatches] = useState<StudentMatch[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setIsAuthed(true);

      if (viewMode === "student") {
        const res = await fetch("/api/matches/student");
        const data = await res.json();
        if (Array.isArray(data)) setMatches(data);

        // Load existing applications
        const appRes = await fetch("/api/applications");
        const appData = await appRes.json();
        if (Array.isArray(appData)) {
          setApplied(new Set(appData.map((a: { internship_id: string }) => a.internship_id)));
        }
      }

      setLoading(false);
    })();
  }, [supabase, viewMode]);

  const handleApply = useCallback(
    async (internshipId: string) => {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internship_id: internshipId }),
      });
      if (res.ok) {
        setApplied((prev) => new Set(prev).add(internshipId));
      }
    },
    [],
  );

  if (loading) {
    return (
      <div className="space-y-6 pt-4">
        <div><div className="h-7 w-48 animate-pulse rounded bg-secondary" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{t("match.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("match.loginRequired")}</p>
        </div>
      </div>
    );
  }

  if (viewMode === "student") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{t("match.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("match.studentSubtitle")}</p>
        </div>
        {matches.length === 0 && (
          <div className="rounded-md bg-secondary border border-border p-8 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            <p className="text-sm font-medium text-muted-foreground">{t("match.noCompanies")}</p>
            <p className="mt-1 text-xs text-muted-foreground/70">{t("match.noCompaniesHint")}</p>
            <a href="/explore" className="mt-3 inline-block text-sm font-medium text-primary underline hover:text-foreground">
              {t("match.goExplore")}
            </a>
          </div>
        )}
        {matches.map((m) => (
          <Card key={m.internship.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{m.internship.title}</CardTitle>
                  <CardDescription>
                    {m.internship.company_profiles?.company_name ?? "—"} · {m.internship.city}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                    {m.score}
                  </span>
                  <span className="text-xs text-muted-foreground">{t("match.score")}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge>{m.internship.track_focus}</Badge>
                {m.internship.skills?.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>

              <details className="mb-3">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                  {t("match.whyTitle")}
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {m.reasons.map((r, i) => (
                    <li key={i}>
                      <span className="font-medium">{r.points}p</span> — {reasonLabel(r)}
                    </li>
                  ))}
                </ul>
              </details>

              {applied.has(m.internship.id) ? (
                <Button variant="secondary" disabled>
                  {t("match.applied")}
                </Button>
              ) : (
                <Button onClick={() => handleApply(m.internship.id)}>
                  {t("match.apply")}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Company / admin view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("match.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("match.companySubtitle")}</p>
      </div>
      <CompanyMatchView />
    </div>
  );
}

function CompanyMatchView() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const t = useT();
  const [internships, setInternships] = useState<{ id: string; title: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [candidates, setCandidates] = useState<
    Array<{
      student: { first_name: string; last_name: string; track: string; city: string };
      score: number;
      reasons: Reason[];
    }>
  >([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("internships")
        .select("id, title")
        .eq("company_user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setInternships(data);
    })();
  }, [supabase]);

  async function loadCandidates(id: string) {
    setSelectedId(id);
    setSelectedTitle(internships.find((i) => i.id === id)?.title ?? "");
    const res = await fetch(`/api/matches/company?internship_id=${id}`);
    const data = await res.json();
    if (Array.isArray(data)) setCandidates(data);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(16);
    doc.text("LiaMatch — Matchrapport", pageW / 2, y, { align: "center" });
    y += 10;
    doc.setFontSize(12);
    doc.text(selectedTitle, pageW / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString("sv-SE"), pageW / 2, y, { align: "center" });
    y += 12;

    for (const c of candidates) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.text(`${c.student.first_name} ${c.student.last_name}  —  ${c.score} p`, 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`${c.student.track} · ${c.student.city}`, 14, y);
      y += 5;
      for (const r of c.reasons) {
        doc.text(`  ${r.points}p — ${reasonLabel(r)}`, 18, y);
        y += 4;
      }
      doc.setTextColor(0);
      y += 4;
    }

    doc.save(`matchrapport-${selectedTitle.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }

  return (
    <div className="space-y-4">
      {internships.length === 0 && (
        <p className="text-sm text-muted-foreground">Du har inga annonser ännu. Skapa en annons under Utforska.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {internships.map((i) => (
          <Button
            key={i.id}
            variant={selectedId === i.id ? "primary" : "secondary"}
            onClick={() => loadCandidates(i.id)}
          >
            {i.title}
          </Button>
        ))}
      </div>
      {candidates.length > 0 && (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={exportPdf}>
            {t("match.exportPdf")}
          </Button>
        </div>
      )}
      {candidates.map((c, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>
                  {c.student.first_name} {c.student.last_name}
                </CardTitle>
                <CardDescription>
                  {c.student.track} · {c.student.city}
                </CardDescription>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                {c.score}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {c.reasons.map((r, i) => (
                <li key={i}>
                  <span className="font-medium">{r.points}p</span> — {reasonLabel(r)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
