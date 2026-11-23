import { countries as flagCodes } from "country-flag-icons";

/**
 * Countries a listing can be marked as coming from: every country that has a flag, named in English.
 * The ones Grinners lists most come first; the rest follow in alphabetical order.
 */
const FIRST = ["AU", "US", "GB", "NZ", "CA", "IE"];
const HOME_NATIONS: Record<string, string> = { "GB-ENG": "England", "GB-SCT": "Scotland", "GB-WLS": "Wales", "GB-NIR": "Northern Ireland" };
const names = new Intl.DisplayNames(["en"], { type: "region" });

function nameOf(code: string): string | undefined {
  if (HOME_NATIONS[code]) return HOME_NATIONS[code];
  if (!/^[A-Z]{2}$/.test(code)) return undefined;
  try {
    const name = names.of(code);
    return name && name !== code ? name : undefined;
  } catch {
    return undefined;
  }
}

const all = flagCodes
  .map((code) => ({ code, name: nameOf(code) }))
  .filter((c): c is { code: string; name: string } => Boolean(c.name));

export const COUNTRIES: { code: string; name: string }[] = [
  ...FIRST.map((code) => all.find((c) => c.code === code)).filter((c): c is { code: string; name: string } => Boolean(c)),
  ...all.filter((c) => !FIRST.includes(c.code)).sort((a, b) => a.name.localeCompare(b.name)),
];

export const countryName = (code?: string) => COUNTRIES.find((c) => c.code === code)?.name;
