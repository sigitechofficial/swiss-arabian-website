export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
};

const assets = "/assets/blog";

/** Figma 796:6443 — 12 posts on page 1 */
export const blogPosts: BlogPost[] = [
  {
    slug: "explore-luxury-oriental-perfumes",
    category: "Fragrance Guide",
    title: "Explore Luxury Oriental Perfumes Online at the Best Prices",
    excerpt:
      "Oriental perfumes are defined by rich, warm, and long-lasting compositions blending notes like amber, oud, spice and resinous woods.",
    image: `${assets}/post-01.jpg`,
  },
  {
    slug: "best-sandalwood-perfumes",
    category: "Fragrance Guide",
    title: "Best Sandalwood Perfumes – Swiss Arabian Store & Online Guide",
    excerpt:
      "Sandalwood fragrances bring warmth, depth, and a rich woody elegance to any perfume collection.",
    image: `${assets}/post-02.jpg`,
  },
  {
    slug: "two-new-perfumes-and-launches",
    category: "New Launches",
    title: "Swiss Arabian Unveils Two New Perfumes and Launches",
    excerpt:
      "Introducing Shaghaf Nectar Blush and Patchouli 01. This Spring, Swiss Arabian presents its finest new releases.",
    image: `${assets}/post-03.jpg`,
  },
  {
    slug: "best-arabian-oud-perfumes",
    category: "Fragrance Guide",
    title: "Discover the Best Arabian Oud Perfumes – Only at Swiss Arabian",
    excerpt:
      "Oud is the ultimate symbol of luxury, power, and seduction. Discover the finest Arabian oud perfumes from Swiss Arabian.",
    image: `${assets}/post-04.jpg`,
  },
  {
    slug: "perfumes-for-every-mood",
    category: "Style & Mood",
    title: "Swiss Arabian Perfumes for Every Mood: A Luxury Fragrance Guide",
    excerpt:
      "Choosing the right fragrance can elevate your style and reflect your personality for any occasion.",
    image: `${assets}/post-05.jpg`,
  },
  {
    slug: "three-new-perfume-launches",
    category: "New Launches",
    title: "Swiss Arabian Unveils Three New Perfume Launches",
    excerpt:
      "Introducing Shaghaf Amber Infusion, Vanilla 01, and Enigma of Taif — the finest fall collection yet.",
    image: `${assets}/post-06.jpg`,
  },
  {
    slug: "soul-of-bali",
    category: "New Launches",
    title: "Swiss Arabian Unveils Soul of Bali: A Fresh Aquatic Ode to Summer",
    excerpt:
      "A scent that breathes paradise — inviting the season's vibes into a single unforgettable fragrance.",
    image: `${assets}/post-07.jpg`,
  },
  {
    slug: "maximise-perfume-longevity",
    category: "Fragrance Guide",
    title: "Swiss Arabian Experts' Tips to Maximise Perfume Longevity",
    excerpt:
      "Swiss Arabian perfumes are crafted to leave a lasting impression — here's how to make them last even longer.",
    image: `${assets}/post-08.png`,
  },
  {
    slug: "how-to-wear-perfume-ramadan",
    category: "Rituals",
    title: "How to Wear Perfume and Make It Last Longer This Ramadan!",
    excerpt:
      "Wearing perfume is more than a beauty ritual — it's a signature that lingers in the memory of those around you.",
    image: `${assets}/post-09.jpg`,
  },
  {
    slug: "winter-whispers-fragrances",
    category: "Seasonal",
    title: "Winter Whispers: Swiss Arabian's Guide to the Best Winter Fragrances",
    excerpt:
      "Serene, chilly, cosy — surrender to the sublime atmosphere of relaxation through winter scents.",
    image: `${assets}/hero.jpg`,
  },
  {
    slug: "bestsellers-hair-mist-collection",
    category: "New Launches",
    title:
      "The Legacy Continues: Bestsellers Reimagined as a Hair Mist Collection",
    excerpt:
      "Embrace the enchantment of our new hair mist launch — a fusion of timeless allure and modern elegance.",
    image: `${assets}/post-10.jpg`,
  },
  {
    slug: "exclusive-experience-set",
    category: "Collections",
    title: "Relish the Delight With Swiss Arabian's Exclusive Experience Set",
    excerpt:
      "Choosing a new perfume can be a wonderful way to associate a specific scent with life's finest experiences.",
    image: `${assets}/post-11.jpg`,
  },
];

export const blogHero = {
  image: `${assets}/hero.jpg`,
  eyebrow: "Swiss Arabian · The Perfect Mix",
  title: "The Journal",
  subtitle:
    "Fragrance guides, new launches and the rituals of scent — from the first perfume house in the UAE.",
} as const;

export const BLOG_PAGE_SIZE = 12;

export type NoteRow = { label: string; notes: string };

export type ArticleBlock =
  | { type: "lead"; text: string }
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "notes"; rows: NoteRow[] }
  | { type: "wear"; text: string }
  | { type: "quote"; text: string };

export type BlogArticleDetail = {
  slug: string;
  heroImage: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  body: ArticleBlock[];
  tags: string[];
  related: { slug: string; title: string; excerpt: string; image: string }[];
};

/** Figma 915:7094 — featured article body */
export const FEATURED_ARTICLE_SLUG = "two-new-perfumes-and-launches";

export const featuredArticleDetail: BlogArticleDetail = {
  slug: FEATURED_ARTICLE_SLUG,
  heroImage: `${assets}/article-hero.jpg`,
  heroEyebrow: "Swiss Arabian",
  heroTitle: "New In: Shaghaf Nectar Blush & Patchouli 01",
  heroSubtitle: "The Art of Gifting",
  body: [
    {
      type: "lead",
      text: "This spring, Swiss Arabian expands one of its most-loved families and adds a bold new soliflore. Say hello to Shaghaf Nectar Blush — a nectar-sweet rose in full bloom — and Patchouli 01, an earthy, grounding study in a single, unmistakable note.",
    },
    {
      type: "p",
      text: "For fifty years the house has lived by one idea: the perfect mix of Eastern warmth and Western craft. These two releases sit at either end of that spectrum — one radiant and romantic, the other deep and quietly confident — yet both are unmistakably Swiss Arabian.",
    },
    { type: "h2", text: "Shaghaf Nectar Blush" },
    {
      type: "p",
      text: "A rose you can almost taste. Nectar Blush opens with a sparkle of pink pepper and blood orange, softens into a heart of Damask rose and peony, then settles on a warm base of patchouli, amber and white musk. It's sweet without being heavy — the kind of scent that turns heads across a room and lingers on a scarf for days.",
    },
    {
      type: "notes",
      rows: [
        { label: "Top", notes: "Pink pepper · Blood orange · Bergamot" },
        { label: "Heart", notes: "Damask rose · Peony · Nectar accord" },
        { label: "Base", notes: "Patchouli · Amber · White musk" },
      ],
    },
    {
      type: "wear",
      text: "You want to feel your most radiant — daytime celebrations, spring evenings, or any moment that calls for a little romance.",
    },
    {
      type: "quote",
      text: "Two new signatures, one at either end of the house's range — proof that opposites can share a soul.",
    },
    { type: "h2", text: "Patchouli 01" },
    {
      type: "p",
      text: "Patchouli 01 does the opposite, and does it beautifully. Built around a single hero note, it's earthy, woody and grounding, with a whisper of smoke and a resinous warmth that deepens as the hours pass. This is a scent for people who like their fragrance with a backbone.",
    },
    {
      type: "notes",
      rows: [
        { label: "Top", notes: "Bergamot · Black pepper" },
        { label: "Heart", notes: "Patchouli · Cedar" },
        { label: "Base", notes: "Amber · Vetiver · Musk" },
      ],
    },
    {
      type: "wear",
      text: "The evening turns cool and you want something with presence — dinners, gatherings, the quiet hours after.",
    },
    { type: "h2", text: "How to wear them" },
    {
      type: "p",
      text: "Spray onto pulse points — wrists, the base of the neck, behind the ears — and don't rub. For extra staying power, mist a little onto clothing or hair. Feeling adventurous? A single spritz of Patchouli 01 beneath Nectar Blush gives the rose a darker, more mysterious edge.",
    },
  ],
  tags: ["Shaghaf", "Rose", "Patchouli", "New Launch"],
  related: [
    {
      slug: "best-arabian-oud-perfumes",
      title: "Discover the Best Arabian Oud Perfumes",
      excerpt:
        "Oud is the soul of Arabian perfumery — resinous, smoky and unmistakably luxurious. Where to start.",
      image: `${assets}/related-01.png`,
    },
    {
      slug: "perfumes-for-every-mood",
      title: "A Perfume for Every Mood: The Luxury Guide",
      excerpt:
        "Match your fragrance to the moment — cozy, romantic, bold or sophisticated.",
      image: `${assets}/related-02.png`,
    },
    {
      slug: "best-sandalwood-perfumes",
      title: "The Best Sandalwood Perfumes",
      excerpt:
        "Soft, creamy and endlessly wearable — the scents that wear sandalwood best.",
      image: `${assets}/related-03.png`,
    },
  ],
};

export function getBlogArticleDetail(
  slug: string,
): BlogArticleDetail | null {
  if (slug === FEATURED_ARTICLE_SLUG) return featuredArticleDetail;

  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return null;

  const related = blogPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 3)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      image: p.image,
    }));

  return {
    slug: post.slug,
    heroImage: post.image,
    heroEyebrow: "Swiss Arabian",
    heroTitle: post.title,
    heroSubtitle: post.category,
    body: [
      { type: "lead", text: post.excerpt },
      {
        type: "p",
        text: "From the first perfume house in the UAE, Swiss Arabian continues to craft compositions that honour tradition while speaking to today — warm woods, luminous florals, and the enduring depth of oud.",
      },
      {
        type: "p",
        text: "Explore the full house edit in store and online, and discover the fragrance that becomes your signature.",
      },
    ],
    tags: [post.category],
    related,
  };
}

