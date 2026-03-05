"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "magic" | "password";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      // Check if user has role set
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
        } else {
          router.push("/onboarding");
        }
      }
    }
  }

  return (
    <div className="flex items-center justify-center pt-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.title")}</CardTitle>
          <CardDescription>
            {mode === "password" ? t("auth.subtitlePassword") : t("auth.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mode toggle */}
          <div className="mb-4 flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => { setMode("password"); setError(null); setSent(false); }}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "password" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.passwordTab")}
            </button>
            <button
              type="button"
              onClick={() => { setMode("magic"); setError(null); setSent(false); }}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "magic" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.magicTab")}
            </button>
          </div>

          {mode === "magic" && sent ? (
            <p className="text-sm text-green-700 dark:text-green-400">{t("auth.sent")}</p>
          ) : mode === "magic" ? (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email-magic">{t("auth.emailLabel")}</Label>
                <Input
                  id="email-magic"
                  type="email"
                  required
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? t("common.loading") : t("auth.sendLink")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("auth.magicHint")}</p>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email-pw">{t("auth.emailLabel")}</Label>
                <Input
                  id="email-pw"
                  type="email"
                  required
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? t("common.loading") : t("auth.signIn")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
