import type { Metadata } from "next";
import {
  ProductsListing,
  productsMetadata,
  routePage,
} from "@/features/catalog/routes/listingRoutes";

/** /products?page=N (the proxy serves page 2+ here; the address keeps ?page=N). */
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return productsMetadata(routePage((await params).page));
}

export default async function ProductsPageN({ params }: Props) {
  return <ProductsListing page={routePage((await params).page)} />;
}
