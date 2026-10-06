"use client";

import { usePromotionDiscovery } from "../hooks/usePromotionDiscovery";

export function OfferLanding({ code }: { code: string }) {
  const query = usePromotionDiscovery([]);
  const offer = query.data?.offers.find((item) => item.campaignCode.toUpperCase() === code.toUpperCase())
    ?? query.data?.tiles.find((item) => item.campaignCode.toUpperCase() === code.toUpperCase());
  const chrome = query.data?.chrome;
  if (query.isLoading) return <p>{chrome?.loading ?? "Loading the offer."}</p>;
  if (!offer || !chrome) return <p>{chrome?.unavailable ?? "This offer is not available in your market."}</p>;
  return (
    <article>
      <p>{offer.badge}</p>
      <h1>{offer.publicTitle}</h1>
      <p>{offer.shortMessage}</p>
      <h2>{chrome.whatYouGet}</h2>
      <p>{offer.details.whatYouGet}</p>
      <h2>{chrome.howToQualify}</h2>
      <p>{offer.details.howToQualify}</p>
      {offer.groups.length ? (
        <ul>
          {offer.groups.map((group) => (
            <li key={group.name}>
              {group.name}
              {group.quantity > 1 ? ` · ${group.quantity}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      {offer.details.restrictions.length ? (
        <>
          <h2>{chrome.restrictions}</h2>
          <ul>
            {offer.details.restrictions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}
