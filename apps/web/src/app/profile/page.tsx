"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { StudentProfileForm } from "@/components/StudentProfileForm";
import { CompanyProfileForm } from "@/components/CompanyProfileForm";

type Role = "student" | "company" | null;

export default function ProfilePage() {
  const t = useT();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [role, setRole] = useState<Role>(null);
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
      setRole(data.role);
      setLoading(false);
    })();
  }, [supabase, router]);

  if (loading) {
    return <p className="pt-20 text-center text-sm text-neutral-500">{t("common.loading")}</p>;
  }

  if (role === "student" && userId) {
    return <StudentProfileForm userId={userId} />;
  }

  if (role === "company" && userId) {
    return <CompanyProfileForm userId={userId} />;
  }

  return null;
}
