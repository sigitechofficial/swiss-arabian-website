import sanitizeHtml from "sanitize-html";

/**
 * Page and policy text (from Shopify or the admin) made safe to show:
 * normal text formatting, links, images, tables and embedded YouTube/Vimeo
 * videos are kept; scripts, styles, forms, event handlers and other sites'
 * frames are removed. Links to other sites open in a new tab.
 *
 * `demoteH1`: for a body shown under the page's own H1 (pages and policies),
 * a heading 1 in the text becomes a heading 2, so the page keeps one H1.
 */
export function sanitizePageHtml(
  html: string | null | undefined,
  options: { demoteH1?: boolean } = {},
): string {
  if (!html?.trim()) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "blockquote",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "small",
      "sub",
      "sup",
      "span",
      "div",
      "ul",
      "ol",
      "li",
      "dl",
      "dt",
      "dd",
      "a",
      "img",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "caption",
      "iframe",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "title", "width", "height", "allow", "allowfullscreen"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
      "*": ["dir", "lang"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    allowedIframeHostnames: [
      "www.youtube.com",
      "www.youtube-nocookie.com",
      "player.vimeo.com",
    ],
    transformTags: {
      ...(options.demoteH1 ? { h1: "h2" } : {}),
      a: (tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? "");
        return {
          tagName,
          attribs: external
            ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
            : { ...attribs, target: "", rel: "" },
        };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
    exclusiveFilter: (frame) =>
      frame.tag === "a" && !frame.attribs.href && !frame.text.trim(),
  });
}
