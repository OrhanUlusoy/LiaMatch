"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useT } from "@/i18n/useT";

type Choice = "interested" | "needs_more" | "not_for_me";
type Role = "employer" | "student";
type RoleCounts = { interested: number; needs_more: number; not_for_me: number; total: number };
type AllCounts = { student: RoleCounts; employer: RoleCounts; total: number; visitors: number };

/* ── SVG icon components ── */
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}
function IconLightbulb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 16h5M8 18h4M10 2a5.5 5.5 0 0 0-2 10.65V14h4v-1.35A5.5 5.5 0 0 0 10 2z" />
    </svg>
  );
}
function IconMinus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M5 10h10" />
    </svg>
  );
}
function IconGrad({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2 1 7l9 5 9-5-9-5z" /><path d="M3 9v5c0 2 3.5 4 7 4s7-2 7-4V9" /><path d="M17 7v7" />
    </svg>
  );
}
function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="14" height="15" rx="1" /><path d="M7 7h2M11 7h2M7 11h2M11 11h2M8 15h4v3H8z" />
    </svg>
  );
}

const OPTION_ICONS: Record<Choice, (cls: string) => ReactNode> = {
  interested: (cls) => <IconCheck className={cls} />,
  needs_more: (cls) => <IconLightbulb className={cls} />,
  not_for_me: (cls) => <IconMinus className={cls} />,
};

const OPTIONS: { key: Choice; labelKey: string; color: string; dotColor: string }[] = [
  { key: "interested", labelKey: "feedback.interested", color: "from-violet-500 to-cyan-500", dotColor: "bg-violet-500" },
  { key: "needs_more", labelKey: "feedback.needsMore", color: "from-amber-400 to-orange-500", dotColor: "bg-amber-500" },
  { key: "not_for_me", labelKey: "feedback.notForMe", color: "from-slate-400 to-slate-500", dotColor: "bg-slate-400" },
];

function getFingerprint(): string {
  const key = "liaMatch_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    // Combine multiple signals for a more stable fingerprint
    const signals = [
      navigator.language,
      screen.width + "x" + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency ?? "",
    ].join("|");
    // Simple hash from signals + random component
    let hash = 0;
    for (let i = 0; i < signals.length; i++) {
      hash = ((hash << 5) - hash + signals.charCodeAt(i)) | 0;
    }
    fp = Math.abs(hash).toString(36) + "-" + crypto.randomUUID();
    localStorage.setItem(key, fp);
  }
  return fp;
}

function LiveBar({ label, icon, count, total, gradient, selected }: {
  label: string; icon: ReactNode; count: number; total: number; gradient: string; selected: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className={`flex items-center gap-1.5 ${selected ? "font-semibold" : ""}`}>
          {icon} {label}
        </span>
        <span className="tabular-nums font-medium">{count} ({pct}%)</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(pct, total > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function RoleResultCard({ title, icon, roleCounts, voted, t }: {
  title: string; icon: ReactNode; roleCounts: RoleCounts; voted: Choice | null; t: (k: string) => string;
}) {
  if (roleCounts.total === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">{icon} {title} ({roleCounts.total})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {OPTIONS.map((opt) => (
          <LiveBar
            key={opt.key}
            label={t(opt.labelKey)}
            icon={OPTION_ICONS[opt.key]("h-4 w-4")}
            count={roleCounts[opt.key]}
            total={roleCounts.total}
            gradient={opt.color}
            selected={voted === opt.key}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default function FeedbackPage() {
  const t = useT();
  const [role, setRole] = useState<Role | null>(null);
  const [voted, setVoted] = useState<Choice | null>(null);
  const [counts, setCounts] = useState<AllCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [commentSent, setCommentSent] = useState(false);

  const loadCounts = useCallback(async () => {
    const res = await fetch("/api/votes");
    if (res.ok) setCounts(await res.json());
  }, []);

  useEffect(() => {
    const storedRole = localStorage.getItem("liaMatch_role");
    if (storedRole === "employer" || storedRole === "student") setRole(storedRole);
    const storedVote = localStorage.getItem("liaMatch_vote");
    if (storedVote) setVoted(storedVote as Choice);
    loadCounts();

    // Register visit
    const fp = getFingerprint();
    fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "visit", fingerprint: fp }),
    }).then(() => loadCounts());
  }, [loadCounts]);

  function handleRoleSelect(r: Role) {
    setRole(r);
    localStorage.setItem("liaMatch_role", r);
    // If already voted with a different role, clear the vote so they re-vote
    if (voted) {
      setVoted(null);
      localStorage.removeItem("liaMatch_vote");
    }
  }

  async function handleVote(choice: Choice) {
    if (loading || !role) return;
    setLoading(true);
    const fingerprint = getFingerprint();

    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        choice,
        role,
        fingerprint,
        user_agent: navigator.userAgent,
        page_url: window.location.pathname,
      }),
    });

    if (res.ok) {
      setVoted(choice);
      localStorage.setItem("liaMatch_vote", choice);
      await loadCounts();
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-12">
      {/* Stats bar */}
      {counts && (
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>{counts.visitors} {t("feedback.visitors")}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="font-medium text-foreground">{counts.total}</span> {t("feedback.votesOf")} {counts.visitors}
          </div>
        </div>
      )}

      {/* Live results per role */}
      {counts && counts.total > 0 && (
        <div className="space-y-4">
          <h3 className="text-center text-sm font-medium text-muted-foreground">{t("feedback.liveResults")}</h3>
          <RoleResultCard
            title={t("feedback.students")}
            icon={<IconGrad className="h-5 w-5 text-violet-500" />}
            roleCounts={counts.student}
            voted={role === "student" ? voted : null}
            t={t}
          />
          <RoleResultCard
            title={t("feedback.employers")}
            icon={<IconBuilding className="h-5 w-5 text-cyan-500" />}
            roleCounts={counts.employer}
            voted={role === "employer" ? voted : null}
            t={t}
          />
        </div>
      )}

      {/* Role selection */}
      {!role && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("feedback.title")}</CardTitle>
            <CardDescription>{t("feedback.pickRole")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              type="button"
              onClick={() => handleRoleSelect("student")}
              className="flex w-full items-center gap-3 rounded-lg border-2 border-border p-4 text-left transition-colors hover:border-primary hover:bg-secondary"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                <IconGrad className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <span className="text-sm font-medium">{t("feedback.iAmStudent")}</span>
                <p className="text-xs text-muted-foreground">{t("feedback.studentDesc")}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("employer")}
              className="flex w-full items-center gap-3 rounded-lg border-2 border-border p-4 text-left transition-colors hover:border-primary hover:bg-secondary"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
                <IconBuilding className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <span className="text-sm font-medium">{t("feedback.iAmEmployer")}</span>
                <p className="text-xs text-muted-foreground">{t("feedback.employerDesc")}</p>
              </div>
            </button>
            <p className="text-center text-xs text-muted-foreground">{t("feedback.anonymous")}</p>
          </CardContent>
        </Card>
      )}

      {/* Vote card — shown after role is picked */}
      {role && (
        <Card>
          <CardHeader className="text-center">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium self-center mx-auto">
              {role === "student"
                ? <IconGrad className="h-3.5 w-3.5 text-violet-500" />
                : <IconBuilding className="h-3.5 w-3.5 text-cyan-500" />}
              <span>{role === "student" ? t("feedback.iAmStudent") : t("feedback.iAmEmployer")}</span>
              <button
                type="button"
                onClick={() => { setRole(null); localStorage.removeItem("liaMatch_role"); }}
                className="ml-1 text-muted-foreground hover:text-foreground"
                aria-label="Change role"
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
              </button>
            </div>
            <CardTitle className="text-2xl">{t("feedback.title")}</CardTitle>
            <CardDescription>
              {voted ? t("feedback.thanks") : t("feedback.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!voted ? (
              <div className="space-y-3">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={loading}
                    onClick={() => handleVote(opt.key)}
                    className="flex w-full items-center gap-3 rounded-lg border-2 border-border p-4 text-left transition-colors hover:border-primary hover:bg-secondary disabled:opacity-50"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${opt.dotColor}/15`}>
                      {OPTION_ICONS[opt.key](`h-4 w-4 ${opt.dotColor.replace("bg-", "text-")}`)}
                    </div>
                    <span className="text-sm font-medium">{t(opt.labelKey)}</span>
                  </button>
                ))}
                <p className="text-center text-xs text-muted-foreground">{t("feedback.anonymous")}</p>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">{t("feedback.yourVote")}</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
                  {OPTION_ICONS[voted](`h-5 w-5 ${OPTIONS.find((o) => o.key === voted)?.dotColor.replace("bg-", "text-")}`)}
                  <span className="text-sm font-semibold">{t(OPTIONS.find((o) => o.key === voted)?.labelKey ?? "")}</span>
                </div>

                {/* Comment box — shown for all vote types */}
                {!commentSent && (
                  <div className="mx-auto mt-3 max-w-sm space-y-2 text-left">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t("feedback.commentPlaceholder")}
                      rows={3}
                      maxLength={500}
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      disabled={!comment.trim()}
                      onClick={async () => {
                        const fingerprint = getFingerprint();
                        await fetch("/api/votes", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "comment", fingerprint, comment: comment.trim() }),
                        });
                        setCommentSent(true);
                      }}
                      className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {t("common.save")}
                    </button>
                  </div>
                )}
                {commentSent && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">{t("feedback.commentSent")}</p>
                )}

                <p className="text-xs text-muted-foreground">{t("feedback.changeVote")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
