import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import { FaqCabinet } from "./FaqCabinet";
import { FaqHelp } from "./FaqHelp";
import { FaqHero } from "./FaqHero";

/** Figma 997:8472 — FAQ · Desktop · Light */
export function FaqPageView() {
  return (
    <div className="bg-page">
      <FaqHero />
      <FaqCabinet />
      <FaqHelp />
      <NewsletterSection />
    </div>
  );
}
