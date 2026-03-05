"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "student" | "company";

export default function OnboardingPage() {
  const t = useT();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selected) return;
    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError(t("common.error"));
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase
      .from("users")
      .update({ role: selected })
      .eq("id", user.id);

    setLoading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }

    router.push("/profile");
  }

  return (
    <div className="flex items-center justify-center pt-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("onboarding.roleTitle")}</CardTitle>
          <CardDescription>{t("onboarding.roleSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelected("student")}
              className={`rounded-lg border-2 p-6 text-center transition-colors ${
                selected === "student"
                  ? "border-primary bg-secondary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="text-2xl mb-2">🎓</div>
              <div className="text-sm font-medium">{t("onboarding.student")}</div>
            </button>
            <button
              type="button"
              onClick={() => setSelected("company")}
              className={`rounded-lg border-2 p-6 text-center transition-colors ${
                selected === "company"
                  ? "border-primary bg-secondary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="text-2xl mb-2">🏢</div>
              <div className="text-sm font-medium">{t("onboarding.company")}</div>
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-6">
            <Button onClick={handleContinue} disabled={!selected || loading}>
              {loading ? t("common.loading") : t("onboarding.continue")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
