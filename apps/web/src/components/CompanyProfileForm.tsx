"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type FormData = {
  company_name: string;
  city: string;
  website: string;
};

const empty: FormData = { company_name: "", city: "", website: "" };

export function CompanyProfileForm({ userId }: { userId: string }) {
  const t = useT();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<FormData>(empty);
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
        });
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

    const { error: dbError } = await supabase.from("company_profiles").upsert(
      {
        user_id: userId,
        company_name: form.company_name,
        city: form.city,
        website: form.website || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

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
          <CardTitle>{t("profile.companyTitle")}</CardTitle>
          <CardDescription>{t("app.tagline")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>
                {t("profile.companyName")} <span className="ml-0.5 text-red-600">*</span>
              </Label>
              <Input required value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>
                {t("profile.city")} <span className="ml-0.5 text-red-600">*</span>
              </Label>
              <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("profile.website")}</Label>
              <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
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
