import { messages } from "./messages.js";

export { messages };

export const supportedLocales = ["zh", "en", "ja", "ko", "es"] as const;
export type Locale = (typeof supportedLocales)[number];

export function t(locale: Locale, key: keyof typeof messages.zh): string {
  return messages[locale][key] ?? messages.zh[key];
}
