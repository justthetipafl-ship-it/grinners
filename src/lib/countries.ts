/** Countries a listing can be marked as coming from. Add a line here and a flag in components/Flag.tsx to offer another. */
export const COUNTRIES = [
  { code: "AU", name: "Australia" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "NZ", name: "New Zealand" },
  { code: "CA", name: "Canada" },
  { code: "IE", name: "Ireland" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export const countryName = (code?: string) => COUNTRIES.find((c) => c.code === code)?.name;
