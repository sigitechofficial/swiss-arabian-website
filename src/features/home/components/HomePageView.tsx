import { CmsHomePageView, type CmsHomeInitial } from "@/features/cms";

/** Homepage — CMS-driven when a published variant exists (Phase 2C). */
export function HomePageView({ initial }: { initial?: CmsHomeInitial | null }) {
  return <CmsHomePageView initial={initial} />;
}
