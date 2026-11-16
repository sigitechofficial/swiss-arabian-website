"use client";

import { usePublishedHome, type CmsHomeInitial } from "@/features/cms/hooks/usePublishedHome";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, Wrap } from "../../ui";
import { SapilHomeSections } from "../../components/home/SapilHomeSections";
import { SapilLink } from "../../components/shared/SapilLink";
import { SapilStatePanel } from "../../components/states/SapilStatePanel";

function HomeSkeleton() {
  const t = useSapilCopy();
  return (
    <div aria-busy="true" aria-label={t("common.loading")}>
      <div className="min-h-[clamp(620px,calc(100svh-112px),880px)] bg-sapil-p-sand animate-pulse max-900:min-h-[60vh]" />
      <Wrap className="py-[64px] grid grid-cols-4 gap-[24px] max-900:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="aspect-[1/1.5] rounded-[18px] bg-sapil-p-peach animate-pulse" />
        ))}
      </Wrap>
    </div>
  );
}

/** Sapil's `HomePageView`: the market's published CMS homepage, drawn in v9. */
export function SapilHomePage({ initial }: { initial?: CmsHomeInitial | null }) {
  const t = useSapilCopy();
  const home = usePublishedHome(initial);

  if (home.status === "loading") return <HomeSkeleton />;
  if (home.status === "error") {
    return (
      <SapilStatePanel
        as="h2"
        eyebrow={t("home.errorEyebrow")}
        title={t("home.errorTitle")}
        accent={t("home.errorAccent")}
        lead={t("common.loadFailed")}
        actions={
          <Button onClick={() => window.location.reload()}>{t("common.tryAgain")}</Button>
        }
      />
    );
  }
  if (home.status === "empty") {
    return (
      <SapilStatePanel
        as="h2"
        eyebrow={t("home.emptyEyebrow")}
        title={t("home.emptyTitle")}
        accent={t("home.emptyAccent")}
        lead={t("home.emptyLead")}
        actions={
          <Button href="/products" LinkComponent={SapilLink}>
            {t("home.emptyCta")}
          </Button>
        }
      />
    );
  }
  return (
    <div data-cms-home="published" data-zone={home.data.page?.zoneCode} data-locale={home.data.page?.locale}>
      <SapilHomeSections sections={home.data.sections} />
    </div>
  );
}
