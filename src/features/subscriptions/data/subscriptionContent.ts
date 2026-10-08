import { homeAssets } from "@/features/home/constants/homeAssets";
import { subscriptionAssets } from "../constants/subscriptionAssets";

export type FeatureItem = {
  title: string;
  body: string;
  icon: string;
};

export type QueueProduct = {
  id: string;
  name: string;
  reviews: number;
  image: string;
};

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export const QUEUE_CAPACITY = 12;

export const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

export const whyFeatures: FeatureItem[] = [
  {
    title: "New month, new you.",
    body: "Test-drive new scents each month to discover what truly fits you best in every season.",
    icon: subscriptionAssets.icons.why1,
  },
  {
    title: "Not heavy on the pocket.",
    body: "Just 55 AED per month — one 10ml refillable atomizer with free shipping across the GCC.",
    icon: subscriptionAssets.icons.why2,
  },
  {
    title: "Why wear the same scent every day?",
    body: "Science shows we go nose-blind to familiar scents. Keep your fragrance wardrobe always fresh.",
    icon: subscriptionAssets.icons.why3,
  },
];

export const howSteps: FeatureItem[] = [
  {
    title: "Choose or let us choose.",
    body: "Pick your fragrances each month, or let our perfumers surprise you with the best-seller.",
    icon: subscriptionAssets.icons.how1,
  },
  {
    title: "Activate your subscription.",
    body: "Fill in your delivery details accurately — correct info means faster shipping to your door.",
    icon: subscriptionAssets.icons.how2,
  },
  {
    title: "Pay, and wait.",
    body: "Click pay and we handle the rest. Our courier calls once your package is out for delivery.",
    icon: subscriptionAssets.icons.how3,
  },
];

export const planFeatures = [
  "One curated fragrance every month",
  "Free shipping across UAE & GCC",
  "Refillable atomizer included",
  "Cancel anytime, no fees",
] as const;

const p = homeAssets.products;

export const queueCatalog: QueueProduct[] = [
  {
    id: "q-aventus",
    name: "Creed's Aventus",
    reviews: 163,
    image: p.patchouli01,
  },
  {
    id: "q-oud-wood",
    name: "TF's Oud Wood",
    reviews: 128,
    image: p.incense01,
  },
  {
    id: "q-sauvage",
    name: "Dior's Sauvage",
    reviews: 214,
    image: p.tobacco01,
  },
  {
    id: "q-bleu",
    name: "Bleu de Chanel",
    reviews: 97,
    image: p.casablanca,
  },
  {
    id: "q-oud-tonka",
    name: "Shaghaf Oud Tonka",
    reviews: 186,
    image: p.shaghafOudTonka,
  },
  {
    id: "q-vanilla",
    name: "Vanilla 01",
    reviews: 142,
    image: p.vanilla01,
  },
  {
    id: "q-rose",
    name: "Rose 01",
    reviews: 119,
    image: p.rose01,
  },
  {
    id: "q-vanilla-toffee",
    name: "Shaghaf Vanilla Toffee",
    reviews: 175,
    image: p.shaghafVanillaToffee,
  },
];

export const filterGroups = [
  {
    id: "brands",
    label: "Brands",
    options: ["Swiss Arabian", "Shaghaf", "Heritage", "Cities"],
  },
  {
    id: "types",
    label: "Fragrance Types",
    options: ["Woody", "Floral", "Oriental", "Fresh", "Spicy"],
  },
  {
    id: "top",
    label: "Top Fragrances",
    options: [],
  },
  {
    id: "size",
    label: "Size",
    options: [],
  },
  {
    id: "price",
    label: "Price",
    options: [],
  },
] as const;

export const faqItems: FaqEntry[] = [
  {
    id: "what",
    question: "What is a subscription?",
    answer:
      "Subscription allows you to get new scents automatically delivered to your doorstep each month — one 10ml refillable atomizer per delivery.",
  },
  {
    id: "scents",
    question: "Which scents will I get each month?",
    answer:
      "You can fill your 12-month queue yourself, or leave slots empty — empty months receive our curated bestseller pick.",
  },
  {
    id: "when",
    question: "When will I receive my monthly subscription?",
    answer:
      "Orders ship at the start of each billing cycle. Couriers typically deliver within 2–4 business days across the UAE & GCC.",
  },
  {
    id: "cancel",
    question: "Can I cancel my subscription?",
    answer:
      "Yes. Update choices or cancel anytime with no penalties — your plan stays fully flexible.",
  },
  {
    id: "shipping",
    question: "How much should I pay for shipping?",
    answer:
      "Shipping is free across the UAE and GCC with every monthly delivery.",
  },
];

export const subscriptionDisclaimer =
  "These creations of perfumes and oils are impressions and versions of well-known brand fragrances, and are not associated in any way with the designer brands or manufacturers named. All trademarks and copyrights remain the property of their respective owners and designers.";
