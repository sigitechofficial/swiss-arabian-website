// Country flag sprites (real SVGs: Windows renders no flag emoji). Imported here, not in
// globals.css, so only pages with a phone field load the ~270-flag stylesheet.
import "flag-icons/css/flag-icons.min.css";

/** A country's flag (flag-icons sprite), for every brand's phone field. */
export function CountryFlag({ country, className = "" }: { country: string; className?: string }) {
  return (
    <span
      className={`fi fi-${country.toLowerCase()} h-[14px] w-[19px] shrink-0 rounded-[2px] bg-cover ${className}`}
      aria-hidden="true"
    />
  );
}
