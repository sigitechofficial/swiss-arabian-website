const assets = "/assets/story";

export const storyHero = {
  image: `${assets}/hero.jpg`,
  ellipseOuter: `${assets}/ellipse-outer.svg`,
  ellipseInner: `${assets}/ellipse-inner.svg`,
  eyebrow: "Since 1974 · Dubai",
  titleLine1: "Two Worlds,",
  titleLine2: "One Signature",
  subtitle:
    "The first perfume house in the UAE — founded on the meeting point of Arabian creativity and Swiss technique.",
  eastLabel: "East · Oud, Rose, Amber",
  westLabel: "West · Precision, Method, Craft",
} as const;

export const storyThesis = {
  label: "§ The Premise",
  text: "A brand founded on duality — one that celebrates the space where two opposed worlds meet, and refuses to choose between them.",
} as const;

export type StoryChapter = {
  index: string;
  era: string;
  title: string;
  body: string;
  image: string;
  caption: string;
};

export const storyChapters: StoryChapter[] = [
  {
    index: "01",
    era: "1974 · The Beginning",
    title: "An Enchanting Beginning",
    body: "In 1974, Mr. Hussein Adam Ali’s passion for perfumery blossomed into establishing Swiss Arabian as the first perfume house in the UAE — a vision built on the belief that the finest fragrances emerge at the crossroads of Eastern soul and Western craft.",
    image: `${assets}/chapter-01.jpg`,
    caption: "Founder · Hussein Adam Ali",
  },
  {
    index: "02",
    era: "The Legacy",
    title: "Delightful Perfume Fragrances",
    body: "Carrying a legacy rooted in a blend of Western and Oriental craftsmanship, Swiss Arabian is a brand founded on duality. Born from precious beginnings and built on achievements aplenty, our chapters are drawn from the drama and grandeur of the East, and inspired by the power and dynamism of the West.",
    image: `${assets}/chapter-02.jpg`,
    caption: "Shaghaf Oud Ahmar",
  },
  {
    index: "03",
    era: "The Invitation",
    title: "Smell Like Wild Desires",
    body: "Come experience this perfect mix of cultures and perfumes. Allow our exquisite creations to lead you on an aromatic journey of the senses that culminates in an impeccable moment that enchants forever.",
    image: `${assets}/chapter-03.jpg`,
    caption: "Cities Collection · Venice",
  },
];

export const storyPromise = {
  eyebrow: "Who We Are",
  quoteLine1: "“Our name is",
  quoteLine2: "our promise.”",
  body: "We merge our creative, Arabian notes with Swiss technique and innovation. This fusion allows us to transform local knowledge into a universal quality brand — building fragrances with extraordinary signatures, developed with expertise and skill.",
} as const;

export const storyStats = [
  {
    value: "50",
    label: "Years of Heritage",
    detail:
      "Five decades of perfumery since 1974 — the first fragrance house founded in the UAE.",
  },
  {
    value: "01",
    label: "First in the UAE",
    detail:
      "A pioneer that opened the door for an entire regional industry, and still sets its standard.",
  },
  {
    value: "+",
    label: "Two Worlds",
    detail:
      "Arabian creativity and Swiss method, composed into a single, unmistakable signature.",
  },
] as const;
