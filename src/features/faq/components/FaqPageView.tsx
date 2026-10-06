import { FaqCabinet } from "./FaqCabinet";
import { FaqHelp } from "./FaqHelp";
import { FaqHero } from "./FaqHero";

export function FaqPageView({ initialDrawer }: { initialDrawer?: string }) {
  return (
    <div className="bg-page">
      <FaqHero />
      <FaqCabinet initialDrawer={initialDrawer} />
      <FaqHelp />
    </div>
  );
}
