import { notFound } from "next/navigation";

/**
 * Not built yet (no purchase flow behind it). Answers "not found" so shoppers
 * and search engines never land on an empty page; restore the page when the
 * feature ships.
 */
export default function GiftBoxPage() {
  notFound();
}
