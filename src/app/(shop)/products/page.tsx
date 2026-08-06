import { redirect } from "next/navigation";

/** Bundles lives at `/collections/bundles` (same pattern as Minis). */
export default function ProductsPage() {
  redirect("/collections/bundles");
}
