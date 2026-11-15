import AU from "country-flag-icons/react/3x2/AU";
import US from "country-flag-icons/react/3x2/US";
import GB from "country-flag-icons/react/3x2/GB";
import NZ from "country-flag-icons/react/3x2/NZ";
import CA from "country-flag-icons/react/3x2/CA";
import IE from "country-flag-icons/react/3x2/IE";
import { countryName } from "@/lib/countries";

const FLAGS = { AU, US, GB, NZ, CA, IE } as const;

/** Country-of-origin flag. Drawn as an image because Windows shows flag emoji as two letters. */
export function Flag({ code, className = "h-3.5" }: { code?: string; className?: string }) {
  const Svg = code ? FLAGS[code as keyof typeof FLAGS] : undefined;
  const name = countryName(code);
  if (!Svg || !name) return null;
  return <Svg title={name} aria-label={name} role="img" className={`inline-block w-auto shrink-0 rounded-[2px] ${className}`} />;
}
