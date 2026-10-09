import { pageContainer } from "@/styles/siteChrome";
import {
  lead,
  sectionBlock,
  sectionHead,
  sectionTitle,
} from "@/styles/landingChrome";

export type CmsTextBlockData = {
  heading?: string | null;
  body?: string;
  alignment?: "left" | "center" | "right";
};

type Props = {
  data: CmsTextBlockData;
};

export function CmsTextBlock({ data }: Props) {
  const body = data.body?.trim();
  if (!body) return null;
  const heading = data.heading?.trim();
  const align =
    data.alignment === "center"
      ? "text-center"
      : data.alignment === "right"
        ? "text-right"
        : "text-left";

  return (
    <section className={`${sectionBlock} bg-[var(--cream,#faf6ee)]`}>
      <div className={`${pageContainer} ${align}`}>
        {heading ? (
          <header className={sectionHead}>
            <h2 className={sectionTitle}>{heading}</h2>
          </header>
        ) : null}
        <p className={`${lead} whitespace-pre-wrap`}>{body}</p>
      </div>
    </section>
  );
}
