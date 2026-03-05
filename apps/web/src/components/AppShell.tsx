"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ViewModeProvider } from "@/components/ViewModeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";

export function AppShell({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser(userId: string) {
      const { data: u } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();
      if (!isMounted) return;
      setRole(u?.role ?? null);

      // Fetch display name based on role
      if (u?.role === "student") {
        const { data: sp } = await supabase
          .from("student_profiles")
          .select("first_name")
          .eq("user_id", userId)
          .single();
        if (isMounted) setDisplayName(sp?.first_name ?? null);
      } else if (u?.role === "company") {
        const { data: cp } = await supabase
          .from("company_profiles")
          .select("company_name")
          .eq("user_id", userId)
          .single();
        if (isMounted) setDisplayName(cp?.company_name ?? null);
      } else if (u?.role === "admin") {
        if (isMounted) setDisplayName("Admin");
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loadUser(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id);
      } else {
        if (isMounted) { setRole(null); setDisplayName(null); }
      }
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <ViewModeProvider role={role} displayName={displayName}>
      <Header />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-10">
        <Suspense>{children}</Suspense>
      </main>
      <Footer />
      <CookieConsent />
    </ViewModeProvider>
  );
}
