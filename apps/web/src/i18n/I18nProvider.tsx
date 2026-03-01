"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { Lang } from "@/i18n/lang";
import type { Messages } from "@/i18n/getMessages";

type I18nContextValue = {
  lang: Lang;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  lang,
  messages,
  children,
}: React.PropsWithChildren<I18nContextValue>) {
  const value = useMemo(() => ({ lang, messages }), [lang, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
