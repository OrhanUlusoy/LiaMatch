"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { createT } from "@/i18n/t";

export function useT() {
  const { messages } = useI18n();
  return useMemo(() => createT(messages), [messages]);
}
