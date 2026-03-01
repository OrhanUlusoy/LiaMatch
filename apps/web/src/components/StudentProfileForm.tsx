"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<FormData>(empty);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [pbFile, setPbFile] = useState<File | null>(null);
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
    const { error } = await supabase.storage.from("documents").upload(path, file, {
      upsert: true,
    });
    if (error) return null;
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
      updated_at: new Date().toISOString(),
    };

    if (cvUrl) payload.cv_file_url = cvUrl;
    if (pbUrl) payload.pb_file_url = pbUrl;

    const { error: dbError } = await supabase
      .from("student_profiles")
      .upsert(payload, { onConflict: "user_id" });

    setLoading(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      setSaved(true);
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
              <p className="text-xs text-neutral-500">{t("profile.availabilityHelp")}</p>
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
              <Field label={t("profile.cv")}>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} className="text-sm" />
              </Field>
              <Field label={t("profile.pb")}>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setPbFile(e.target.files?.[0] ?? null)} className="text-sm" />
              </Field>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-green-700">{t("profile.saved")}</p>}
            <Button type="submit" disabled={loading}>
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
