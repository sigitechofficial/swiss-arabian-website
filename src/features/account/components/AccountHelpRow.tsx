import Image from "next/image";

import { accountAssets } from "../constants/accountAssets";
import { accountContainer } from "../constants/accountLayout";

/** Figma · help-row (1098:9678) */
export function AccountHelpRow() {
  return (
    <section className="border-y border-sa-border bg-section-soft">
      <div className={`${accountContainer} flex items-start gap-5 py-7`}>
        <Image
          src={accountAssets.icons.returnsFaq}
          alt=""
          width={26}
          height={26}
          className="mt-0.5 h-[26px] w-[26px] shrink-0"
        />
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-sa-primary">
            Need to return your fragrance?
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-sa-secondary">
            Go to Order History, select the order and choose &ldquo;Start a
            return&rdquo;.
          </p>
        </div>
      </div>
    </section>
  );
}
