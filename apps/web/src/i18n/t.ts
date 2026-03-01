import type { Messages } from "@/i18n/getMessages";

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function createT(messages: Messages) {
  return function t(key: string): string {
    const value = getByPath(messages, key);
    return typeof value === "string" ? value : key;
  };
}
