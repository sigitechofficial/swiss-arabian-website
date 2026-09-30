import Image from "next/image";

import { accountAssets } from "../constants/accountAssets";
import { accountContainer } from "../constants/accountLayout";

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
          <p className="text-[13.5px] font-bold text-sa-primary">
            Questions about an order?
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sa-secondary">
            Open Order History and contact customer care with your order number.
            Return requests are not available in your account yet.
          </p>
        </div>
      </div>
    </section>
  );
}
