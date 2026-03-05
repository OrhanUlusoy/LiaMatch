"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isValidURL, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/api-helpers";

type FormData = {
  company_name: string;
  city: string;
  website: string;
  description: string;
  vision: string;
  looking_for: string;
};

const empty: FormData = { company_name: "", city: "", website: "", description: "", vision: "", looking_for: "" };

export function CompanyProfileForm({ userId }: { userId: string }) {
  const t = useT();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<FormData>(empty);
  const [visible, setVisible] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) {
        setForm({
          company_name: data.company_name ?? "",
          city: data.city ?? "",
          website: data.website ?? "",
          description: data.description ?? "",
          vision: data.vision ?? "",
          looking_for: data.looking_for ?? "",
        });
        setVisible(data.visible ?? false);
        setExistingLogoUrl(data.logo_url ?? null);
      }
    })();
  }, [supabase, userId]);

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate website URL
    if (form.website && !isValidURL(form.website)) {
      setError("Invalid website URL. Only http/https allowed.");
      setLoading(false);
      return;
    }

    // Validate logo file
    if (logoFile) {
      if (logoFile.size > MAX_FILE_SIZE) { setError("Logo file too large (max 10MB)"); setLoading(false); return; }
      if (!ALLOWED_IMAGE_TYPES.includes(logoFile.type)) { setError("Logo must be JPEG, PNG, WebP, or GIF"); setLoading(false); return; }
    }

    let logoUrl: string | undefined;
    if (logoFile) {
      const path = `${userId}/logo/${logoFile.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(path, logoFile, { upsert: true });
      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      logoUrl = urlData.publicUrl;
    }

    const payload: Record<string, unknown> = {
      user_id: userId,
      company_name: form.company_name,
      city: form.city,
      website: form.website || null,
      description: form.description || null,
      vision: form.vision || null,
      looking_for: form.looking_for || null,
      visible,
      updated_at: new Date().toISOString(),
    };
    if (logoUrl) payload.logo_url = logoUrl;
    else if (!existingLogoUrl) payload.logo_url = null;

    const { error: dbError } = await supabase.from("company_profiles").upsert(
      payload,
      { onConflict: "user_id" },
    );

    setLoading(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      if (logoUrl) { setExistingLogoUrl(logoUrl); setLogoFile(null); }
      setSaved(true);
    }
  }

  return (
    <div className="flex justify-center pt-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t("profile.companyTitle")}</CardTitle>
          <CardDescription>{t("app.tagline")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="company_name">
                {t("profile.companyName")} <span className="ml-0.5 text-red-600">*</span>
              </Label>
              <Input id="company_name" required value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city">
                {t("profile.city")} <span className="ml-0.5 text-red-600">*</span>
              </Label>
              <Input id="city" required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="website">{t("profile.website")}</Label>
              <Input id="website" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
            </div>

            {/* Logo upload */}
            <div className="space-y-1">
              <Label>{t("profile.logo")}</Label>
              <p className="text-xs text-muted-foreground">{t("profile.logoHelp")}</p>
              {(existingLogoUrl || logoFile) ? (
                <div className="flex items-center gap-3">
                  <Image
                    src={logoFile ? URL.createObjectURL(logoFile) : existingLogoUrl!}
                    alt="Logo"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-lg border border-border object-cover"
                    unoptimized={!!logoFile}
                  />
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setExistingLogoUrl(null); setSaved(false); }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("profile.removeFile")}
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
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setSaved(false); } }}
                  />
                </label>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">{t("profile.description")}</Label>
              <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vision">{t("profile.vision")}</Label>
              <Textarea id="vision" value={form.vision} onChange={(e) => set("vision", e.target.value)} rows={3} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="looking_for">{t("profile.lookingFor")}</Label>
              <Textarea id="looking_for" value={form.looking_for} onChange={(e) => set("looking_for", e.target.value)} rows={3} />
            </div>

            {/* Visible toggle */}
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-secondary/30">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => { setVisible(e.target.checked); setSaved(false); }}
                className="h-4 w-4 accent-primary"
              />
              <div>
                <p className="text-sm font-medium">{t("profile.visible")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.visibleHelp")}</p>
              </div>
            </label>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {saved && <p className="text-sm text-green-700 dark:text-green-400">{t("profile.saved")}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
