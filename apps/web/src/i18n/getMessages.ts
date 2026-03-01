import type { Lang } from "@/i18n/lang";

export type Messages = Record<string, unknown>;

export async function getMessages(lang: Lang): Promise<Messages> {
  if (lang === "en") {
    return (await import("@/i18n/dictionaries/en.json")).default as Messages;
  }
  return (await import("@/i18n/dictionaries/sv.json")).default as Messages;
}
