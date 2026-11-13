"use client";

import type { CSSProperties } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import type { CatalogCollection } from "@/features/catalog/api/catalog.service";
import { stripHtml } from "@/features/catalog/utils/catalogHtml";
import { useCollectionsList } from "@/features/collections/hooks/useCollectionsList";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, EYEBROW, Serif, Wrap, tintValue } from "../../ui";
import { SapilContentCrumbs } from "../../components/content/SapilContentCrumbs";
import { SapilLink } from "../../components/shared/SapilLink";
import { SapilStatePanel } from "../../components/states/SapilStatePanel";
import { pastelAt } from "../../components/shell/shellData";

const GRID = "grid grid-cols-3 gap-[24px] max-1100:grid-cols-2 max-760:grid-cols-1 max-900:gap-[16px]";

/** Sapil's `CollectionsPageView`: every collection of the market as v9 pastel collection cards. */
export function SapilCollectionsPage({
  initial,
  title,
}: {
  initial?: { zoneCode: string; collections: CatalogCollection[] } | null;
  title?: string;
}) {
  const t = useSapilCopy();
  const { collections, loading, loadFailed, retry } = useCollectionsList(initial);

  return (
    <Wrap as="div" className="w-full pb-[88px]">
      <SapilContentCrumbs current={title ?? t("content.collections")} />
      <header className="mt-[24px] mb-[36px]">
        <p className={EYEBROW}>{t("content.collectionsEyebrow")}</p>
        <h1 className="font-sapil-display !font-[400] text-[clamp(48px,6vw,84px)] !leading-[1] mt-[14px]">
          {title ?? (
            <>
              {t("content.collectionsTitle")} <Serif>{t("content.collectionsAccent")}</Serif>
            </>
          )}
        </h1>
      </header>
      {loading ? (
        <div className={GRID} aria-busy="true" aria-label={t("common.loading")}>
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="h-[320px] rounded-[32px] bg-sapil-p-sand animate-pulse" />
          ))}
        </div>
      ) : loadFailed ? (
        <SapilStatePanel
          as="h2"
          className="!px-0"
          title={t("content.collectionsErrorTitle")}
          lead={t("common.loadFailed")}
          actions={<Button onClick={retry}>{t("common.tryAgain")}</Button>}
        />
      ) : !collections?.length ? (
        <div className="border border-dashed border-sapil-line-2 rounded-sapil p-[48px] text-center text-sapil-ink-2">
          <b className="block font-sapil-serif font-[400] text-[24px] text-sapil-ink mb-[6px]">{t("content.collectionsEmptyTitle")}</b>
          {t("content.collectionsEmptyText")}
        </div>
      ) : (
        <div className={GRID}>
          {collections.map((c, i) => {
            const text = stripHtml(c.description);
            return (
              <SapilLink
                key={c.slug}
                href={`/collections/${c.slug}`}
                style={{ "--c": tintValue(pastelAt(i)) } as CSSProperties}
                className="group/col relative flex flex-col justify-between min-h-[320px] rounded-[32px] bg-[var(--c)] p-[26px] overflow-hidden [transition:transform_.5s_var(--sapil-ease)] hover:[transform:translateY(-6px)] max-900:rounded-[24px] max-900:p-[22px]"
              >
                {c.image ? (
                  <span aria-hidden="true" className="absolute inset-0 opacity-[.9]">
                    <MediaImage src={c.image} alt="" fill sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" className="object-cover" />
                    <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,253,250,0)_30%,rgba(255,253,250,.92)_75%)]" />
                  </span>
                ) : null}
                <span className="relative text-[13px] text-sapil-muted">
                  {c.productCount != null ? t("content.collectionCount", { count: c.productCount }) : null}
                </span>
                <span className="relative">
                  <span className="block font-sapil-display text-[clamp(30px,2.6vw,40px)] leading-[1] tracking-[-.01em]">{c.heading || c.name}</span>
                  {text ? <span className="block text-sapil-ink-2 text-[15px] mt-[8px] pe-[56px] line-clamp-2">{text}</span> : null}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute end-[22px] bottom-[22px] w-[48px] h-[48px] rounded-full bg-sapil-white grid place-items-center text-[18px] [transition:transform_.4s_var(--sapil-ease)] group-hover/col:[transform:rotate(-45deg)] rtl:[transform:scaleX(-1)]"
                >
                  →
                </span>
              </SapilLink>
            );
          })}
        </div>
      )}
    </Wrap>
  );
}
