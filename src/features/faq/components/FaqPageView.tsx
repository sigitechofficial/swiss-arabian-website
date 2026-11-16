import { Suspense } from "react";
import { FaqCabinet } from "./FaqCabinet";
import { FaqCabinetFromUrl } from "./FaqCabinetFromUrl";
import { FaqHelp } from "./FaqHelp";
import { FaqHero } from "./FaqHero";

export function FaqPageView() {
  return (
    <div className="bg-page">
      <FaqHero />
      {/* The cached page shows the first drawer; the browser opens `?topic=`. */}
      <Suspense fallback={<FaqCabinet />}>
        <FaqCabinetFromUrl />
      </Suspense>
      <FaqHelp />
    </div>
  );
}
