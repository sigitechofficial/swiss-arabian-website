import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServerInlineScript } from "@/components/layout/ServerInlineScript";
import { InsiderScripts } from "@/components/layout/InsiderScripts";
import { AnalyticsScripts } from "@/components/layout/AnalyticsScripts";
import { getBrand } from "@/lib/brand";
import { loadRequestBrandIdentity } from "@/lib/seo/catalogPage";
import { resolveCatalogMarketFor } from "@/lib/seo/serverMarket";
import { requestOrigin } from "@/lib/seo/requestOrigin";
import { currentSiteHost } from "@/lib/site/currentSite";
import { hostFromSiteKey } from "@/lib/site/siteKey";
import { staticSiteKeys } from "@/lib/site/staticSites";
import { DEFAULT_LOCALE, dir, isLocale, LOCALES } from "@/lib/i18n/locales";
import { loadMessages } from "@/lib/i18n/messages";
import { BrandHead } from "@brand-ui";
import { AppProviders } from "@/app/providers";
import "@/lib/site/siteParam";
import "@/app/globals.css";

/**
 * The website address this page tree is for (`[site]`), e.g. for local brand
 * aliases (sp.localhost → Sapil). A root param: reading it keeps pages static.
 */
async function siteHost(): Promise<string | null> {
  return currentSiteHost();
}

/**
 * Prerendered pages refresh at least hourly (brand identity, page SEO);
 * catalog pages set a shorter time themselves.
 */
export const revalidate = 3600;

/**
 * One prerendered tree per website address and language: the deployment's own
 * address and every market website of the brand. Other known addresses render
 * on first visit (ISR).
 */
export async function generateStaticParams() {
  const sites = await staticSiteKeys();
  return sites.flatMap((site) => LOCALES.map((locale) => ({ site, locale })));
}

/**
 * metadataBase = the storefront's domain, so canonical, hreflang and og:url are
 * absolute addresses (Google ignores relative hreflang).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const origin = await requestOrigin();
  // Site name in the page's language and the storefront's market (SEO Management → Brand identity).
  const brand = await loadRequestBrandIdentity(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const site = getBrand(await siteHost());
  return {
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    // "ZAHRA – Swiss Arabian UAE": same pattern as the Shopify stores (market's site name).
    title: { default: brand.name, template: `%s – ${brand.name}` },
    ...(brand.description ? { description: brand.description } : {}),
    // The market's icon (SEO Management), else the brand's own (src/lib/brand).
    icons: {
      icon: brand.favicon || site.icons.favicon,
      apple: brand.favicon || site.icons.appleTouchIcon,
    },
    robots: site.integrations.seoIndexingEnabled
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('sa-color-mode');if(t!=='dark'&&t!=='light')t='light';if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`;

/**
 * Partner Web SDK: user → currency → language, then the real page type, then one init.
 * type:cart is the cart page type, so it is pushed only on /cart — once.
 */
const insiderQueueBootScriptTemplate = `(function(){try{window.InsiderQueue=window.InsiderQueue||[];if(!window.InsiderQueue.__saLogged){var rawPush=window.InsiderQueue.push.bind(window.InsiderQueue);window.InsiderQueue.push=function(){for(var i=0;i<arguments.length;i++){var row=arguments[i]||{};console.log("[Insider]",row.type,row.value!==undefined?row.value:"");}return rawPush.apply(window.InsiderQueue,arguments);};window.InsiderQueue.__saLogged=true;}function uuid(){var id=null;try{id=localStorage.getItem("sa_insider_uuid");}catch(e){}if(id)return id;id=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():("anon-"+Date.now());try{localStorage.setItem("sa_insider_uuid",id);}catch(e){}return id;}function cart(){var items=[],total=0,currency="AED";try{var raw=localStorage.getItem("sa-cart-v2");if(raw){var parsed=JSON.parse(raw);var lines=(parsed&&parsed.state&&parsed.state.lines)||[];for(var i=0;i<lines.length;i++){var L=lines[i]||{};var q=Number(L.quantity);if(!isFinite(q)||q<1)q=1;var price=Number(L.unitPrice);if(!isFinite(price))price=0;total+=price*q;if(L.currency)currency=String(L.currency);var item={id:L.variantId||L.sku||String(i),name:L.title||"",taxonomy:L.category?[L.category]:["Shop"],unit_price:price,unit_sale_price:price,quantity:q,url:(location.origin||"")+"/products/"+encodeURIComponent(L.slug||""),product_image_url:L.imageUrl||"",stock:L.isSellable===false?0:1,color:""};if(L.sizeLabel)item.size=L.sizeLabel;if(L.productId||L.variantId)item.groupcode=L.productId||L.variantId;items.push(item);}}}catch(e){}return{total:total,items:items,currency:currency};}function ctx(skipCart){var c=cart();var items=c.items;var tot=c.total;var ship=items.length?25:0;var u={uuid:uuid(),language:"en_US",gdpr_optin:true};try{var ur=localStorage.getItem("sa_insider_user");if(ur){var parsed=JSON.parse(ur);if(parsed&&typeof parsed==="object"&&parsed.uuid){if(!parsed.language)parsed.language="en_US";if(typeof parsed.gdpr_optin!=="boolean")parsed.gdpr_optin=true;u=parsed;}}}catch(e){}window.InsiderQueue.push({type:"user",value:u});window.InsiderQueue.push({type:"currency",value:c.currency||"AED"});window.InsiderQueue.push({type:"language",value:(u&&u.language)||"en_US"});if(!skipCart)window.InsiderQueue.push({type:"cart",value:{total:tot+ship,shipping_cost:ship,items:items}});window.__SA_INSIDER_HEAD_CONTEXT__=true;}var p=location.pathname||"/";var s=p.split("/").filter(Boolean);if(__SA_LOCALE_PREFIXES__.indexOf(s[0])>=0)s.shift();function hasTok(){try{return !!(localStorage.getItem("sa_store_access_token")||localStorage.getItem("sa_store_refresh_token"));}catch(e){return false;}}function identified(){try{var ur=localStorage.getItem("sa_insider_user");if(!ur)return false;var parsed=JSON.parse(ur);return !!(parsed&&parsed.uuid&&(parsed.email||parsed.phone_number));}catch(e){return false;}}function endPage(){if(hasTok()&&!identified()){window.__SA_INSIDER_WAIT_AUTH__=true;return;}window.InsiderQueue.push({type:"init"});window.__SA_INSIDER_HEAD_PATH__=p;}var pdp=s.length===2&&s[0]==="products";var listing=s[0]==="search"||s[0]==="collections"||(s[0]==="products"&&s.length===1);ctx(!(s.length===1&&s[0]==="cart"));if(pdp){if(hasTok())window.__SA_INSIDER_WAIT_AUTH__=true;window.InsiderQueue.push({type:"init"});window.__SA_INSIDER_HEAD_PATH__=p;return;}if(p.indexOf("/order-confirmation")>=0||p.indexOf("/checkout/payment/success")>=0){window.InsiderQueue.push({type:"other",value:{name:"Order confirmation"}});endPage();return;}if(s.length===1&&s[0]==="cart"){endPage();return;}var t="other";if(p==="/"||p==="")t="home";else if(s[0]==="products"||s[0]==="search"||s[0]==="collections")t="category";if(t==="home")window.InsiderQueue.push({type:"home"});else if(t==="category"){var crumb=["Shop"];if(s[0]==="search")crumb=["Search"];else if(s[0]==="collections")crumb=s[1]?["Collections",decodeURIComponent(s[1])]:["Collections"];window.InsiderQueue.push({type:"category",value:{breadcrumb:crumb}});}else{var n=s[0]||"Page";if(n==="checkout")n="Checkout";window.InsiderQueue.push({type:"other",value:{name:n}});}endPage();}catch(e){}})();`;

/** Language prefixes in addresses (`/ar/...`), stripped before reading the page type. */
const insiderQueueBootScript = insiderQueueBootScriptTemplate.replace(
  "__SA_LOCALE_PREFIXES__",
  JSON.stringify(LOCALES.filter((code) => code !== DEFAULT_LOCALE)),
);

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ site: string; locale: string }>;
}>) {
  const { site, locale } = await params;
  // The proxy only sends known addresses and configured languages here;
  // anything else (a hand-made internal path) is a 404.
  if (!hostFromSiteKey(site) || !isLocale(locale)) notFound();
  const [messages, storefrontHost, catalogMarket] = await Promise.all([
    loadMessages(locale),
    siteHost(),
    resolveCatalogMarketFor(locale),
  ]);
  // Which website / market this page is, for the brand's one tag setup.
  const marketContext = catalogMarket.market;
  const analyticsContext = {
    siteHost: storefrontHost,
    market: catalogMarket.zoneCode || null,
    country: "countryCode" in marketContext ? (marketContext.countryCode ?? null) : null,
    currency: "currencyCode" in marketContext ? (marketContext.currencyCode ?? null) : null,
    language: locale,
  };
  const { insider } = getBrand(storefrontHost).integrations;
  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        {/* Brand-specific head tags (Swiss Arabian: font preloads). */}
        <BrandHead />
        <ServerInlineScript html={themeInitScript} />
        {insider.enabled && insider.accountId ? (
          <>
            <ServerInlineScript html={insiderQueueBootScript} />
            <script
              async
              src={`https://${insider.scriptHost}/ins.js?id=${encodeURIComponent(insider.accountId)}`}
            />
          </>
        ) : null}
      </head>
      <body className="flex min-h-dvh flex-col">
        <AnalyticsScripts context={analyticsContext} />
        <InsiderScripts />
        <AppProviders
          storefrontHost={storefrontHost}
          locale={locale}
          messages={messages}
        >{children}</AppProviders>
      </body>
    </html>
  );
}
