"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium",
        active ? "bg-neutral-100 text-neutral-900" : "text-neutral-600 hover:text-neutral-900",
      )}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) setIsAuthed(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session));
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const active = pathname?.startsWith("/explore")
    ? "explore"
    : pathname?.startsWith("/about")
      ? "about"
      : pathname?.startsWith("/match")
        ? "match"
        : undefined;

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            {t("app.name")}
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/match" active={active === "match"}>
              {t("nav.match")}
            </NavLink>
            <NavLink href="/explore" active={active === "explore"}>
              {t("nav.explore")}
            </NavLink>
            <NavLink href="/about" active={active === "about"}>
              {t("nav.about")}
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {isAuthed ? (
            <>
              <Link href="/profile">
                <Button variant="secondary">{t("nav.profile")}</Button>
              </Link>
              <Button
                variant="ghost"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
              >
                {t("nav.signOut")}
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button>{t("nav.login")}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
