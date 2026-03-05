"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { StudentProfileForm } from "@/components/StudentProfileForm";
import { CompanyProfileForm } from "@/components/CompanyProfileForm";
import { SetPasswordSection } from "@/components/SetPasswordSection";
import { GdprSection } from "@/components/GdprSection";
import { useViewMode } from "@/components/ViewModeProvider";

export default function ProfilePage() {
  const t = useT();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { viewMode, isAdmin } = useViewMode();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!data?.role) {
        router.push("/onboarding");
        return;
      }
      setUserId(user.id);
      setLoading(false);
    })();
  }, [supabase, router]);

  if (loading) {
    return <p className="pt-20 text-center text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  // Admin uses viewMode to choose which profile form to show
  const profileRole = isAdmin
    ? viewMode === "company" ? "company" : "student"
    : viewMode;

  return (
    <div className="space-y-8">
      {profileRole === "student" && userId && <StudentProfileForm userId={userId} />}
      {profileRole === "company" && userId && <CompanyProfileForm userId={userId} />}
      <SetPasswordSection />
      <GdprSection />
    </div>
  );
}
