import "@/brands/sapil/theme.css";
import { SapilRoot } from "../../ui/SapilRoot";
import { SapilServerCopy } from "../shell/SapilStorefrontShell";
import { SapilShopUnavailableContent } from "./SapilErrorViews";

/** Sapil's `ShopUnavailableView` (rendered without the shell). */
export function SapilShopUnavailableView() {
  return (
    <SapilRoot className="flex-1">
      <SapilServerCopy>
        <SapilShopUnavailableContent />
      </SapilServerCopy>
    </SapilRoot>
  );
}
