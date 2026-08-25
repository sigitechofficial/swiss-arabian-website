"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { MEGA_PRODUCTS } from "@/features/home/constants/megaProducts";
import type { ChromeMega } from "@/features/home/constants/chromeNav";

/** Right-hand side of a mega panel: a fixed set of real products (curated
 *  by hand, no live API call) — falls back to the static promo card for
 *  menus without a featured product lineup (e.g. Collections). */
export function MegaShowcase({
  item,
  itemVariants,
}: {
  item: ChromeMega;
  itemVariants: Variants;
}) {
  const products = MEGA_PRODUCTS[item.id];

  if (products?.length) {
    return (
      <motion.div className="mega__products" variants={itemVariants} role="list">
        {products.map((product) => (
          <Link className="mega__prod" key={product.id} href={`/products/${product.slug}`}>
            <span className="mega__prod-media">
              <img src={product.image} alt={product.name} loading="lazy" />
            </span>
            <span className="mega__prod-name">{product.name}</span>
            {product.notes ? (
              <span className="mega__prod-meta">{product.notes}</span>
            ) : null}
            <span className="mega__prod-price">
              {formatMoney(product.price, product.currency)}
            </span>
          </Link>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div className="mega__promo" variants={itemVariants}>
      <div
        className={
          item.promo.cover ? "mega__promo-media mega__promo-media--cover" : "mega__promo-media"
        }
      >
        <img src={item.promo.image} alt="" loading="lazy" />
      </div>
      <p className="mega__promo-copy">{item.promo.copy}</p>
      <Link className="pill pill--solid mega__promo-cta" href={item.promo.href}>
        {item.promo.cta}
      </Link>
    </motion.div>
  );
}
