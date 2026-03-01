export type Lang = "sv" | "en";

export const LANG_COOKIE = "liamatch_lang";

export function normalizeLang(value: string | undefined | null): Lang {
  return value === "en" ? "en" : "sv";
}
