import type { CmsSection } from "../types/cmsHome.types";
import { buildLinkContextFromSections } from "../utils/buildLinkContext";
import { renderCmsSections } from "../registry/sectionRegistry";

type CmsSectionListProps = {
  sections: CmsSection[];
  logUnknown?: boolean;
};

/** Shared renderer for published Homepage and Draft preview. */
export function CmsSectionList({ sections, logUnknown }: CmsSectionListProps) {
  const linkContext = buildLinkContextFromSections(sections);
  const nodes = renderCmsSections(sections, { linkContext, logUnknown });
  if (!nodes.length) return null;
  return <>{nodes}</>;
}
