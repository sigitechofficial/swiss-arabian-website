import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { InsiderScripts } from "@/components/layout/InsiderScripts";
import { env } from "@/lib/config/env";
import { AppProviders } from "./providers";
import "./globals.css";

/** Figma: Nunito Medium / SemiBold / Bold across header + UI */
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Swiss Arabian",
    template: "%s · Swiss Arabian",
  },
  description:
    "Swiss Arabian fragrances — oud, musk, and contemporary scents for every journey.",
};

/** Avoid flash: apply saved theme before paint (matches ThemeProvider key). */
const themeInitScript = `(function(){try{var t=localStorage.getItem('sa-color-mode');if(t!=='dark'&&t!=='light')t='light';if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`;

/**
 * Partner Web SDK: user → currency → cart, then page type, then one init.
 * Listing skips type:cart (user → currency → category → init). Cart page
 * does not push type:cart a second time.
 */
const insiderQueueBootScript = `(function(){try{window.InsiderQueue=window.InsiderQueue||[];function uuid(){var id=null;try{id=localStorage.getItem("sa_insider_uuid");}catch(e){}if(id)return id;id=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():("anon-"+Date.now());try{localStorage.setItem("sa_insider_uuid",id);}catch(e){}return id;}function cart(){var items=[],total=0,currency="AED";try{var raw=localStorage.getItem("sa-cart-v2");if(raw){var parsed=JSON.parse(raw);var lines=(parsed&&parsed.state&&parsed.state.lines)||[];for(var i=0;i<lines.length;i++){var L=lines[i]||{};var q=Number(L.quantity);if(!isFinite(q)||q<1)q=1;var price=Number(L.unitPrice);if(!isFinite(price))price=0;total+=price*q;if(L.currency)currency=String(L.currency);var item={id:L.variantId||L.sku||String(i),name:L.title||"",taxonomy:L.category?[L.category]:["Shop"],unit_price:price,unit_sale_price:price,quantity:q,url:(location.origin||"")+"/products/"+encodeURIComponent(L.slug||""),product_image_url:L.imageUrl||""};if(L.isSellable===false)item.stock=0;if(L.sizeLabel)item.size=L.sizeLabel;if(L.productId||L.variantId)item.groupcode=L.productId||L.variantId;items.push(item);}}}catch(e){}return{total:total,items:items,currency:currency};}function ctx(skipCart){var c=cart();var items=c.items;var qty=items.reduce(function(s,it){return s+(Number(it.quantity)||0);},0);var tot=c.total;var u={uuid:uuid(),language:"en_US",gdpr_optin:true};try{var ur=localStorage.getItem("sa_insider_user");if(ur){var parsed=JSON.parse(ur);if(parsed&&typeof parsed==="object"&&parsed.uuid){if(!parsed.language)parsed.language="en_US";if(typeof parsed.gdpr_optin!=="boolean")parsed.gdpr_optin=true;u=parsed;}}}catch(e){}window.InsiderQueue.push({type:"user",value:u});window.InsiderQueue.push({type:"currency",value:c.currency||"AED"});if(!skipCart)window.InsiderQueue.push({type:"cart",value:{total:tot,subtotal:tot,shipping_cost:0,quantity:qty,items:items}});window.__SA_INSIDER_HEAD_CONTEXT__=true;}var p=location.pathname||"/";var s=p.split("/").filter(Boolean);function hasTok(){try{return !!(localStorage.getItem("sa_store_access_token")||localStorage.getItem("sa_store_refresh_token"));}catch(e){return false;}}function endPage(){if(hasTok()){window.__SA_INSIDER_WAIT_AUTH__=true;return;}window.InsiderQueue.push({type:"init"});window.__SA_INSIDER_HEAD_PATH__=p;}var pdp=s.length===2&&s[0]==="products";var listing=s[0]==="search"||s[0]==="collections"||(s[0]==="products"&&s.length===1);ctx(listing);if(pdp){if(hasTok())window.__SA_INSIDER_WAIT_AUTH__=true;return;}if(p.indexOf("/order-confirmation")===0){var oid=s[1]||"";var val={order_id:oid,total:0,quantity:0,items:[]};try{var raw=localStorage.getItem("sa_insider_purchase");if(raw){var parsed=JSON.parse(raw);if(parsed&&typeof parsed==="object"){var match=String(parsed.matchId||"");var same=!match||match===oid||String(parsed.order_id)===oid;if(same){val.order_id=String(parsed.order_id||oid);val.total=Number(parsed.total);if(!isFinite(val.total))val.total=0;val.quantity=Number(parsed.quantity);if(!isFinite(val.quantity))val.quantity=0;val.items=Array.isArray(parsed.items)?parsed.items:[];if(typeof parsed.shipping_cost==="number")val.shipping_cost=parsed.shipping_cost;}}}}catch(e){}if(!Array.isArray(val.items))val.items=[];if(!val.order_id)val.order_id=oid;window.InsiderQueue.push({type:"purchase",value:val});window.InsiderQueue.push({type:"init"});window.__SA_INSIDER_HEAD_PATH__=p;return;}if(s.length===1&&s[0]==="cart"){endPage();return;}var t="other";if(p==="/"||p==="")t="home";else if(s[0]==="products"||s[0]==="search"||s[0]==="collections")t="category";if(t==="home")window.InsiderQueue.push({type:"home"});else if(t==="category"){var crumb=["Shop"];if(s[0]==="search")crumb=["Search"];else if(s[0]==="collections")crumb=s[1]?["Collections",decodeURIComponent(s[1])]:["Collections"];window.InsiderQueue.push({type:"category",value:{breadcrumb:crumb}});}else{var n=s[0]||"Page";if(n==="checkout")n="Checkout";window.InsiderQueue.push({type:"other",value:{name:n}});}endPage();}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {env.insider.enabled && env.insider.accountId ? (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: insiderQueueBootScript,
              }}
            />
            <script
              async
              src={`https://${env.insider.scriptHost}/ins.js?id=${encodeURIComponent(env.insider.accountId)}`}
            />
          </>
        ) : null}
      </head>
      <body className="flex min-h-dvh flex-col bg-page font-sans text-sa-primary" suppressHydrationWarning>
        <InsiderScripts />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
