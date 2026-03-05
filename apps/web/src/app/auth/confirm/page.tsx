"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Handles Supabase email confirmation / magic link verification.
 * Supabase default email templates redirect here with:
 *   ?token_hash=xxx&type=magiclink   (or type=email)
 * or with hash fragments:
 *   #access_token=xxx&type=magiclink
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      // 1) Try token_hash from query params
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as "magiclink" | "email" | "signup" | undefined;

      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (!verifyError) {
          return redirectAfterAuth();
        }
        setError(verifyError.message);
        return;
      }

      // 2) Try hash fragment (implicit flow)
      const hash = window.location.hash;
      if (hash) {
        // Supabase client auto-detects hash tokens on init
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          return redirectAfterAuth();
        }
      }

      // 3) Try code from query params (PKCE flow)
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          return redirectAfterAuth();
        }
        setError(exchangeError.message);
        return;
      }

      setError("No authentication token found.");
    }

    async function redirectAfterAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role) {
          router.push("/match");
          return;
        }
        router.push("/onboarding");
        return;
      }
      router.push("/login");
    }

    verify();
  }, [supabase, searchParams, router]);

  return (
    <div className="flex items-center justify-center pt-20">
      <div className="text-center">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Verifierar inloggning…</p>
        )}
      </div>
    </div>
  );
}
