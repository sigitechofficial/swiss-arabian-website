export const FEATURE_CARDS = [
  {
    className: "feature-card--1",
    image: "https://dossier.eu/cdn/shop/files/dossier-lime-4.png",
    title: ["Crafted", "in France"],
    text: "with love and care.",
  },
  {
    className: "feature-card--2",
    image: "https://dossier.eu/cdn/shop/files/dossier-fressia-4.png",
    title: ["Free", "Returns"],
    text: "no questions asked.",
  },
  {
    className: "feature-card--3",
    image: "https://dossier.eu/cdn/shop/files/dossier-fougere-4.png",
    title: ["6,000,000+", "Bottles"],
    text: "over 6M bottles sold worldwide.",
  },
  {
    className: "feature-card--4",
    image: "https://dossier.eu/cdn/shop/files/dossier-rose-4.png",
    title: ["100,000+", "Reviews"],
    text: "over 100,000 5-star reviews.",
  },
] as const;

export const SIGNATURE_COLLECTIONS = [
  {
    href: "/collections/best-sellers",
    image: "/assets/collection-1.jpg",
    alt: "Swiss Arabian best-selling fragrances",
    eyebrow: "Most loved",
    title: "Best Sellers",
  },
  {
    href: "/collections/new-launches",
    image: "/assets/collection-2.jpg",
    alt: "Newly launched Swiss Arabian fragrances",
    eyebrow: "Latest",
    title: "New In",
  },
  {
    href: "/collections/for-her",
    image: "/assets/collection-3.jpg",
    alt: "Swiss Arabian fragrances for her",
    eyebrow: "The feminine",
    title: "For Her",
  },
  {
    href: "/collections/for-him",
    image: "/assets/collection-4.jpg",
    alt: "Swiss Arabian fragrances for him",
    eyebrow: "The masculine",
    title: "For Him",
  },
] as const;

export const REVIEWS = [
  {
    body: "Six hours in and Shaghaf Oud still turns heads. Rich and warm, never sharp — the compliment magnet I didn’t know I was missing.",
    name: "Amira K.",
    product: "Shaghaf Oud · Verified buyer",
  },
  {
    body: "On at 7am, still there at midnight. I’ve stopped reaching for houses that cost three times as much.",
    name: "Daniyal R.",
    product: "Oud 07 · Verified buyer",
  },
  {
    body: "Elegant and a little smoky — finally a rose that isn’t sugary. It’s become my everyday signature.",
    name: "Sara M.",
    product: "Rose 01 · Verified buyer",
  },
] as const;

export const PLANS = [
  {
    name: "Discovery",
    featured: false,
    amount: "AED 99.00",
    desc: "1 × 30 ml eau de parfum, every month",
  },
  {
    name: "Signature",
    featured: true,
    amount: "AED 149.00",
    desc: "1 × 50 ml extrait de parfum, every month",
  },
  {
    name: "Collector",
    featured: false,
    amount: "AED 269.00",
    desc: "2 × 50 ml extrait de parfum, every month",
  },
] as const;

export const PLAN_FEATURES = [
  "Free shipping on every delivery",
  "Skip, pause or cancel anytime",
  "Members-only launches & samples",
] as const;

export const REEL_STILLS = [
  {
    className: "reel-tile--1",
    poster: "/assets/collection-2.jpg",
    video: "/assets/video/reel-tile-1.mp4",
  },
  {
    className: "reel-tile--featured",
    poster: "/assets/collection-3.jpg",
    video: "/assets/video/hero-bg.mp4",
  },
  {
    className: "reel-tile--3",
    poster: "/assets/collection-1.jpg",
    video: "/assets/video/reel-tile-3.mp4",
  },
] as const;
