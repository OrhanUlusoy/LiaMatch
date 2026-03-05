"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/i18n/useT";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isValidURL, ALLOWED_DOC_TYPES, MAX_FILE_SIZE } from "@/lib/api-helpers";

type Period = { start: string; end: string };

type FormData = {
  first_name: string;
  last_name: string;
  track: string;
  school: string;
  city: string;
  github_url: string;
  linkedin_url: string;
  project_title: string;
  project_desc: string;
  project_url: string;
  availability_periods: Period[];
};

const empty: FormData = {
  first_name: "",
  last_name: "",
  track: "",
  school: "",
  city: "",
  github_url: "",
  linkedin_url: "",
  project_title: "",
  project_desc: "",
  project_url: "",
  availability_periods: [{ start: "", end: "" }],
};

export function StudentProfileForm({ userId }: { userId: string }) {
  const t = useT();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<FormData>(empty);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [matchWeights, setMatchWeights] = useState({ track: 35, skills: 35, city: 20, period: 10 });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [pbFile, setPbFile] = useState<File | null>(null);
  const [existingCvUrl, setExistingCvUrl] = useState<string | null>(null);
  const [existingPbUrl, setExistingPbUrl] = useState<string | null>(null);
  const [openForLia, setOpenForLia] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing profile
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) {
        setForm({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          track: data.track ?? "",
          school: data.school ?? "",
          city: data.city ?? "",
          github_url: data.github_url ?? "",
          linkedin_url: data.linkedin_url ?? "",
          project_title: data.project_title ?? "",
          project_desc: data.project_desc ?? "",
          project_url: data.project_url ?? "",
          availability_periods: data.availability_periods?.length
            ? data.availability_periods
            : [{ start: "", end: "" }],
        });
        setExistingCvUrl(data.cv_file_url ?? null);
        setExistingPbUrl(data.pb_file_url ?? null);
        setOpenForLia(data.open_for_lia ?? false);
        setSkills(data.skills ?? []);
        if (data.match_weights) setMatchWeights(data.match_weights);
      }
    })();
  }, [supabase, userId]);

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function setPeriod(index: number, field: "start" | "end", value: string) {
    setForm((prev) => {
      const periods = [...prev.availability_periods];
      periods[index] = { ...periods[index], [field]: value };
      return { ...prev, availability_periods: periods };
    });
    setSaved(false);
  }

  function addPeriod() {
    setForm((prev) => ({
      ...prev,
      availability_periods: [...prev.availability_periods, { start: "", end: "" }],
    }));
  }

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const path = `${userId}/${folder}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
      upsert: true,
    });
    if (uploadError) {
      setError(uploadError.message);
      return null;
    }
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate URLs
    for (const [key, val] of [["GitHub", form.github_url], ["LinkedIn", form.linkedin_url], ["Project", form.project_url]] as const) {
      if (val && !isValidURL(val)) {
        setError(`Invalid URL for ${key}. Only http/https allowed.`);
        setLoading(false);
        return;
      }
    }

    // Validate files
    if (cvFile) {
      if (cvFile.size > MAX_FILE_SIZE) { setError("CV file too large (max 10MB)"); setLoading(false); return; }
      if (!ALLOWED_DOC_TYPES.includes(cvFile.type)) { setError("CV must be PDF or Word document"); setLoading(false); return; }
    }
    if (pbFile) {
      if (pbFile.size > MAX_FILE_SIZE) { setError("Portfolio file too large (max 10MB)"); setLoading(false); return; }
      if (!ALLOWED_DOC_TYPES.includes(pbFile.type)) { setError("Portfolio must be PDF or Word document"); setLoading(false); return; }
    }

    let cvUrl: string | undefined;
    let pbUrl: string | undefined;

    if (cvFile) {
      const url = await uploadFile(cvFile, "cv");
      if (url) cvUrl = url;
    }
    if (pbFile) {
      const url = await uploadFile(pbFile, "pb");
      if (url) pbUrl = url;
    }

    const payload: Record<string, unknown> = {
      user_id: userId,
      first_name: form.first_name,
      last_name: form.last_name,
      track: form.track,
      school: form.school,
      city: form.city,
      github_url: form.github_url || null,
      linkedin_url: form.linkedin_url || null,
      project_title: form.project_title || null,
      project_desc: form.project_desc || null,
      project_url: form.project_url || null,
      availability_periods: form.availability_periods.filter((p) => p.start && p.end),
      skills: skills,
      match_weights: matchWeights,
      open_for_lia: openForLia,
      updated_at: new Date().toISOString(),
    };

    if (cvUrl) payload.cv_file_url = cvUrl;
    else if (!existingCvUrl) payload.cv_file_url = null;
    if (pbUrl) payload.pb_file_url = pbUrl;
    else if (!existingPbUrl) payload.pb_file_url = null;

    const { error: dbError } = await supabase
      .from("student_profiles")
      .upsert(payload, { onConflict: "user_id" });

    setLoading(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      if (cvUrl) setExistingCvUrl(cvUrl);
      if (pbUrl) setExistingPbUrl(pbUrl);
      setCvFile(null);
      setPbFile(null);
      setSaved(true);
      setTimeout(() => router.push("/match"), 1500);
    }
  }

  return (
    <div className="flex justify-center pt-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t("profile.studentTitle")}</CardTitle>
          <CardDescription>{t("app.tagline")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("profile.firstName")} required>
                <Input required value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
              </Field>
              <Field label={t("profile.lastName")} required>
                <Input required value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
              </Field>
            </div>
            <Field label={t("profile.track")} required>
              <Input required value={form.track} onChange={(e) => set("track", e.target.value)} placeholder="MLOps, Webbutveckling, Data…" />
            </Field>

            {/* Skills */}
            <div className="space-y-1">
              <Label>{t("profile.skills")}</Label>
              <p className="text-xs text-muted-foreground">{t("profile.skillsHelp")}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {skills.map((s, i) => (
                  <Badge key={i} className="gap-1">
                    {s}
                    <button type="button" onClick={() => { setSkills(skills.filter((_, idx) => idx !== i)); setSaved(false); }} className="ml-0.5 hover:text-foreground">×</button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const val = skillInput.trim().replace(/,$/,"");
                      if (val && !skills.includes(val)) {
                        setSkills([...skills, val]);
                        setSaved(false);
                      }
                      setSkillInput("");
                    }
                  }}
                  placeholder="React, Python, Docker…"
                />
                <Button type="button" variant="secondary" onClick={() => {
                  const val = skillInput.trim().replace(/,$/,"");
                  if (val && !skills.includes(val)) {
                    setSkills([...skills, val]);
                    setSaved(false);
                  }
                  setSkillInput("");
                }}>{t("profile.addSkill")}</Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("profile.school")} required>
                <Input required value={form.school} onChange={(e) => set("school", e.target.value)} />
              </Field>
              <Field label={t("profile.city")} required>
                <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("profile.github")}>
                <Input value={form.github_url} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/…" />
              </Field>
              <Field label={t("profile.linkedin")}>
                <Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/…" />
              </Field>
            </div>
            <Field label={t("profile.projectTitle")}>
              <Input value={form.project_title} onChange={(e) => set("project_title", e.target.value)} />
            </Field>
            <Field label={t("profile.projectDesc")}>
              <Input value={form.project_desc} onChange={(e) => set("project_desc", e.target.value)} />
            </Field>
            <Field label={t("profile.projectUrl")}>
              <Input value={form.project_url} onChange={(e) => set("project_url", e.target.value)} placeholder="https://…" />
            </Field>

            {/* Availability */}
            <div className="space-y-2">
              <Label>{t("profile.availability")}</Label>
              <p className="text-xs text-muted-foreground">{t("profile.availabilityHelp")}</p>
              {form.availability_periods.map((p, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Input type="date" value={p.start} onChange={(e) => setPeriod(i, "start", e.target.value)} />
                  <Input type="date" value={p.end} onChange={(e) => setPeriod(i, "end", e.target.value)} />
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addPeriod}>
                {t("profile.addPeriod")}
              </Button>
            </div>

            {/* File uploads */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FileUploadField
                label={t("profile.cv")}
                existingUrl={existingCvUrl}
                newFile={cvFile}
                onFileChange={(f) => { setCvFile(f); setSaved(false); }}
                onRemove={() => { setCvFile(null); setExistingCvUrl(null); setSaved(false); }}
                t={t}
              />
              <FileUploadField
                label={t("profile.pb")}
                existingUrl={existingPbUrl}
                newFile={pbFile}
                onFileChange={(f) => { setPbFile(f); setSaved(false); }}
                onRemove={() => { setPbFile(null); setExistingPbUrl(null); setSaved(false); }}
                t={t}
              />
            </div>

            {/* Open for LIA toggle */}
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-secondary/30">
              <input
                type="checkbox"
                checked={openForLia}
                onChange={(e) => { setOpenForLia(e.target.checked); setSaved(false); }}
                className="h-4 w-4 accent-primary"
              />
              <div>
                <p className="text-sm font-medium">{t("profile.openForLia")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.openForLiaHelp")}</p>
              </div>
            </label>

            {/* Match weight preferences */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">{t("profile.matchWeights")}</p>
              <p className="text-xs text-muted-foreground">{t("profile.matchWeightsHelp")}</p>
              {(["track", "skills", "city", "period"] as const).map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-20 text-xs capitalize">{t(`profile.weight_${k}`)}</span>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={matchWeights[k]}
                    onChange={(e) => { setMatchWeights((p) => ({ ...p, [k]: Number(e.target.value) })); setSaved(false); }}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-8 text-right text-xs font-medium">{matchWeights[k]}</span>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {saved && (
              <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30 p-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  ✓ {t("profile.saved")} — {t("profile.redirecting")}
                </p>
              </div>
            )}
            <Button type="submit" disabled={loading || saved}>
              {loading ? t("common.loading") : t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </Label>
      {children}
    </div>
  );
}

function FileUploadField({
  label,
  existingUrl,
  newFile,
  onFileChange,
  onRemove,
  t,
}: {
  label: string;
  existingUrl: string | null;
  newFile: File | null;
  onFileChange: (file: File) => void;
  onRemove: () => void;
  t: (key: string) => string;
}) {
  const hasFile = existingUrl || newFile;
  const fileName = newFile
    ? newFile.name
    : existingUrl
      ? decodeURIComponent(existingUrl.split("/").pop() ?? "")
      : null;

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {hasFile ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-green-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10.5l4 4 8-9" />
          </svg>
          <span className="min-w-0 flex-1 truncate text-sm">{fileName}</span>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label={t("profile.removeFile")}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-3 transition-colors hover:border-primary hover:bg-secondary/30">
          <svg className="h-5 w-5 shrink-0 text-muted-foreground" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 4v12M4 10h12" />
          </svg>
          <span className="text-sm text-muted-foreground">{t("profile.addFile")}</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileChange(f);
            }}
          />
        </label>
      )}
    </div>
  );
}
