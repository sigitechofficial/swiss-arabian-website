export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqDrawer = {
  id: string;
  index: string;
  title: string;
  summary: string;
  items: FaqItem[];
};

export const faqHero = {
  image: "/assets/faq/hero.jpg",
  eyebrow: "Swiss Arabian",
  titleLine1: "Frequently Asked",
  titleLine2: "Questions",
} as const;

export const faqContact = {
  whatsappLabel: "WhatsApp +971 800 6177",
  whatsappHref: "https://wa.me/9718006177",
  emailLabel: "Email Customer Service",
  emailHref: "mailto:customerservice@sapguae.com",
} as const;

export const faqDrawers: FaqDrawer[] = [
  {
    id: "general",
    index: "01",
    title: "General",
    summary: "The house",
    items: [
      {
        id: "general-name",
        question: "Why is the brand called Swiss Arabian?",
        answer:
          "Carrying a legacy rooted in a blend of western & oriental craftsmanship, Swiss Arabian is a brand founded on duality that proudly celebrates the space in which two seemingly opposed worlds come together. An agent for Givaudan entrusted us with the distribution of Givaudan perfumes in Yemen and soon requested us to do this for the whole GCC region. An ode to the collaboration with the Swiss perfumery giant Givaudan, we decided to keep Swiss Arabian as the name of the new company to be set up in Dubai in 1974 as the first perfume manufacturing house.",
      },
    ],
  },
  {
    id: "account",
    index: "02",
    title: "Account",
    summary: "Sign in & profile",
    items: [
      {
        id: "account-create",
        question: "How can I create an account?",
        answer:
          "You can select Create an account from the top right corner in the menu and fill in the required details. If you need any assistance, please contact our customer care team at customerservice@sapguae.com.",
      },
      {
        id: "account-guest",
        question: "Do I need to create an account to place an order?",
        answer:
          "No — you don’t have to create an account to place an order. You can shop as a guest and check out without registering.",
      },
      {
        id: "account-benefit",
        question: "What is the benefit of creating an account?",
        answer:
          "It takes a few minutes to create your account and your profile will be saved so you don’t have to enter it next time. You’ll also be among the first to hear about launches, activities, exclusive content and surprises.",
      },
      {
        id: "account-password",
        question: "What do I need to do if I forget my password?",
        answer:
          "You can reset a new password and we’ll send a link to your email. You can also email us at customerservice@sapguae.com.",
      },
    ],
  },
  {
    id: "order",
    index: "03",
    title: "Order",
    summary: "Placing & paying",
    items: [
      {
        id: "order-whatsapp",
        question: "Is it possible to place an order over WhatsApp?",
        answer:
          "Yes — you can place your order through our official WhatsApp business number +971 800 6177.",
      },
      {
        id: "order-cancel",
        question: "How can I cancel my order?",
        answer:
          "You can contact us by email at customerservice@sapguae.com or WhatsApp +971 800 6177 and our team will assist you.",
      },
      {
        id: "order-friend",
        question: "I’m not in the UAE — can I have an order delivered to a friend here?",
        answer:
          "Yes — you can place an order and pay by credit card. We’ll deliver to the address you provide. For assistance, email customerservice@sapguae.com.",
      },
      {
        id: "order-hotel",
        question: "I’m a tourist. Can my order be delivered to my hotel?",
        answer:
          "Yes — order online and we’ll deliver to your hotel. Pay by card on the website, or by cash (USD) on delivery. If you’re unavailable, the order can be left with concierge — contact us at customerservice@sapguae.com for such cases.",
      },
      {
        id: "order-pickup",
        question: "Can I pick up my online order from a Swiss Arabian branch?",
        answer:
          "Unfortunately this option isn’t available yet — we provide fast delivery to your door.",
      },
      {
        id: "order-payment",
        question: "What payment methods are available?",
        answer:
          "You can pay online via debit or credit card, pay by cash on delivery, or choose 4 interest-free payments through Tabby.",
      },
      {
        id: "order-returns",
        question: "What is your exchange and return policy?",
        answer:
          "Unused products in original packaging may be eligible for exchange or return within the period stated on our Exchange & Return page. Contact customer service for help with your case.",
      },
    ],
  },
  {
    id: "delivery",
    index: "04",
    title: "Delivery",
    summary: "Shipping & tracking",
    items: [
      {
        id: "delivery-cod-card",
        question: "Can I pay by credit card at the time of delivery?",
        answer:
          "Yes — card-on-delivery is available if you mention it in the checkout notes or inform customer care the same day you order.",
      },
      {
        id: "delivery-charges",
        question: "What are the delivery charges?",
        answer: "Delivery charges are USD 16 across the UAE for all orders below USD 150.",
      },
      {
        id: "delivery-free",
        question: "Do you offer free shipping?",
        answer: "Yes — shipping is free on purchases of USD 150 and above.",
      },
      {
        id: "delivery-time",
        question: "How long does delivery take?",
        answer: "We deliver within 3–7 working days.",
      },
      {
        id: "delivery-track",
        question: "Can I track the delivery of my order?",
        answer:
          "Yes — once your order ships you’ll receive tracking details by email so you can follow its progress.",
      },
      {
        id: "delivery-worldwide",
        question: "Do you deliver worldwide?",
        answer:
          "Browse our site for other countries from the region selector. If you don’t find your country, contact customer care at customerservice@sapguae.com or WhatsApp +971 800 6177.",
      },
    ],
  },
  {
    id: "scents",
    index: "05",
    title: "Scents",
    summary: "Ingredients & wear",
    items: [
      {
        id: "scents-cruelty",
        question: "Is Swiss Arabian cruelty free?",
        answer: "Swiss Arabian is cruelty free — we don’t test our perfumes on animals.",
      },
      {
        id: "scents-vegan",
        question: "Are Swiss Arabian perfumes vegan?",
        answer:
          "We cannot guarantee that Swiss Arabian perfumes are vegan as we use combinations of thousands of raw materials from various sources.",
      },
      {
        id: "scents-oud",
        question: "Is Swiss Arabian using real oud, amber and musk in its perfumes?",
        answer: "Yes — we use natural extracts of those materials, and we never use banned ingredients.",
      },
      {
        id: "scents-alcohol",
        question: "Are Swiss Arabian perfumes alcohol-free?",
        answer:
          "For Swiss Arabian EDPs we use standard denatured alcohol derived from natural sources. Perfume oils (CPOs) don’t contain ethanol. When packaging mentions alcohol, it refers to aromatic compounds such as Benzyl Alcohol — not beverage ethanol.",
      },
      {
        id: "scents-choose",
        question: "How do I choose the best fragrance for me?",
        answer:
          "Contact our customer care & perfume consultant team at customerservice@sapguae.com and they’ll help you find the best match for your taste.",
      },
      {
        id: "scents-lasting",
        question: "Are Swiss Arabian scents long lasting?",
        answer:
          "Swiss Arabian EDPs are highly concentrated and usually contain up to 20% perfume oil. Each fragrance is evaluated for at least 72 hours in a controlled environment before release.",
      },
      {
        id: "scents-alter",
        question: "What could alter the nature of a perfume?",
        answer:
          "Skin type, fabric, humidity, temperature, light and storage can all change how a scent wears. Layer over moisturized skin, apply to pulse points, avoid rubbing wrists, and store bottles in a cool place.",
      },
      {
        id: "scents-expiry",
        question: "What is the expiration date of Swiss Arabian scents?",
        answer:
          "There is no fixed expiration date for perfume, but Swiss Arabian fragrances are best used within 5 years with good storage.",
      },
      {
        id: "scents-made",
        question: "Where are Swiss Arabian products made?",
        answer: "All Swiss Arabian fragrances are made in the UAE.",
      },
    ],
  },
  {
    id: "samples",
    index: "06",
    title: "Samples",
    summary: "Discovery kits",
    items: [
      {
        id: "samples-free",
        question: "Does Swiss Arabian offer free samples?",
        answer: "Yes — complimentary samples are included with each online order.",
      },
      {
        id: "samples-sell",
        question: "Does Swiss Arabian sell samples?",
        answer:
          "Yes — we offer a Discovery Kit of bestsellers and The Perfect Mix customizable sample kit. Contact customer care on WhatsApp +971 800 6177 to choose your favorites.",
      },
    ],
  },
];

export function drawerMetaLabel(drawer: FaqDrawer): string {
  const n = drawer.items.length;
  const entry = n === 1 ? "1 entry" : `${n} entries`;
  return `${entry} · ${drawer.summary}`;
}
