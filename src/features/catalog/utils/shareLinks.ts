/**
 * Share addresses for a product page (plain links: no third-party scripts).
 * `url` is the page's canonical address; `image` is used by Pinterest only
 * and only when it is an absolute http(s) address.
 */
export type ShareLinks = {
  whatsapp: string;
  facebook: string;
  x: string;
  pinterest: string | null;
};

export function shareLinks(input: { url: string; title: string; image?: string | null }): ShareLinks {
  const url = encodeURIComponent(input.url);
  const title = input.title.trim();
  const image = input.image && /^https?:\/\//i.test(input.image) ? input.image : null;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title ? `${title} ${input.url}` : input.url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://x.com/intent/tweet?url=${url}${title ? `&text=${encodeURIComponent(title)}` : ""}`,
    pinterest: image
      ? `https://www.pinterest.com/pin/create/button/?url=${url}&media=${encodeURIComponent(image)}${
          title ? `&description=${encodeURIComponent(title)}` : ""
        }`
      : null,
  };
}
