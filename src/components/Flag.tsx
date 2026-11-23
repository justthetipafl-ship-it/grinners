import * as Flags from "country-flag-icons/react/3x2";
import { countryName } from "@/lib/countries";

type FlagComponent = (props: { title?: string; className?: string; role?: string; "aria-label"?: string }) => React.ReactElement;

/** Country-of-origin flag. Drawn as an image because Windows shows flag emoji as two letters. */
export function Flag({ code, className = "h-3.5" }: { code?: string; className?: string }) {
  const name = countryName(code);
  // The home nations are exported with an underscore (GB_ENG) because a dash isn't valid in a name.
  const Svg = code ? (Flags as unknown as Record<string, FlagComponent>)[code.replace("-", "_")] : undefined;
  if (!Svg || !name) return null;
  return <Svg title={name} aria-label={name} role="img" className={`inline-block w-auto shrink-0 rounded-[2px] ${className}`} />;
}
