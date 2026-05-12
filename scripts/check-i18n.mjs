import { readFileSync } from "node:fs";

const content = readFileSync(new URL("../packages/i18n/src/messages.ts", import.meta.url), "utf8");
const localeMatches = [...content.matchAll(/export const messages = \{([\s\S]*?)\} as const;/g)];

if (localeMatches.length !== 1) {
  throw new Error("Unable to find messages export.");
}

const locales = [...content.matchAll(/\n  ([a-z]{2}): \{/g)].map((match) => match[1]);
const required = ["zh", "en", "ja", "ko", "es"];
for (const locale of required) {
  if (!locales.includes(locale)) {
    throw new Error(`Missing locale: ${locale}`);
  }
}

console.log(`i18n check passed for ${required.length} locales.`);
