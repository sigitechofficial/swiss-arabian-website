/**
 * The visual design of an on-site campaign, as built in the admin playground.
 *
 * SHARED FILE: the same file lives in the admin (src/features/website-management/onsite-design/)
 * and the storefront (src/features/onsite/design/). The backend owns the checks
 * (src/modules/onsite/onsite-design.ts). Change all three together.
 *
 * A design is data, never markup: a layout plus typed blocks. Texts are per language: `en`
 * required, any other base language optional, falling back to `en`. This file imports
 * nothing, so it stays identical in both repos: each passes its own right-to-left check.
 */

/** The language every on-site text has. */
const PAGE_LANGUAGE_FALLBACK = "en";

/** "fr-CA" → "fr". */
const baseLanguage = (code: string | null | undefined) =>
  (code ?? "").trim().toLowerCase().split(/[-_]/)[0] ?? "";

/**
 * A text in English (always) and any other language: `{ en, ar?, fr?, … }`
 * keyed by base language code, as the backend stores it.
 */
export type LocalText = { en: string; [language: string]: string | undefined };

export type OnsiteLayoutType = "popup" | "bar" | "slide_in";
export type OnsiteLayoutPosition = "center" | "top" | "bottom" | "bottom_left" | "bottom_right";
export type OnsiteAlign = "left" | "center" | "right";
export type OnsiteAnimation = "none" | "fade" | "slide" | "zoom";
export type OnsiteDevice = "desktop" | "mobile";

export type OnsiteDesignMedia = {
  src: string;
  /** top: above the blocks; left/right: split layout; background: behind the blocks. */
  position: "top" | "left" | "right" | "background";
  /** top: height in px (60-480). left/right: share of the width in % (20-60). */
  size: number;
  fit: "cover" | "contain";
};

export type OnsiteDesignLayout = {
  type: OnsiteLayoutType;
  position: OnsiteLayoutPosition;
  width: number;
  background: string;
  textColor: string;
  radius: number;
  padding: number;
  gap: number;
  align: OnsiteAlign;
  overlayColor: string;
  overlayOpacity: number;
  closeOnOverlay: boolean;
  showClose: boolean;
  closeColor: string;
  animation: OnsiteAnimation;
  autoCloseSeconds: number;
  media?: OnsiteDesignMedia;
};

type BlockBase = { id: string; hideOn?: OnsiteDevice[] };

export type OnsiteTextBlock = BlockBase & {
  type: "text";
  text: LocalText;
  size: number;
  weight: 400 | 500 | 600 | 700;
  color: string;
  align?: OnsiteAlign;
  italic?: boolean;
  uppercase?: boolean;
  font?: "body" | "heading";
};

export type OnsiteImageBlock = BlockBase & {
  type: "image";
  src: string;
  alt?: LocalText;
  height: number;
  fit: "cover" | "contain";
  radius: number;
  href?: string;
};

export type OnsiteButtonBlock = BlockBase & {
  type: "button";
  label: LocalText;
  action: "link" | "close";
  href?: string;
  background: string;
  color: string;
  radius: number;
  size: "sm" | "md" | "lg";
  fullWidth: boolean;
};

export type OnsiteSpacerBlock = BlockBase & { type: "spacer"; height: number };
export type OnsiteDividerBlock = BlockBase & { type: "divider"; color: string };

export type OnsiteCountdownBlock = BlockBase & {
  type: "countdown";
  endsAt: string;
  background: string;
  color: string;
  expiredText?: LocalText;
};

export type OnsiteCouponBlock = BlockBase & {
  type: "coupon";
  /**
   * fixed: always `code`. prize: the code the visitor just won on the wheel (thank-you page only);
   * `code` is then only a sample for the playground.
   */
  source?: "fixed" | "prize";
  code: string;
  copyLabel: LocalText;
  copiedLabel: LocalText;
  background: string;
  color: string;
};

/**
 * Email (lead) form. Email is always asked; phone and interests are optional. Consent is always
 * required: the visitor must tick it before submitting. Submitting opens the thank-you page.
 */
export type OnsiteFormBlock = BlockBase & {
  type: "form";
  emailLabel: LocalText;
  emailPlaceholder: LocalText;
  phone: "off" | "optional" | "required";
  phoneLabel: LocalText;
  /** Checkbox choices such as "Exclusive offers". Up to 8. */
  interests: LocalText[];
  interestsLabel: LocalText;
  consentText: LocalText;
  submitLabel: LocalText;
  buttonBackground: string;
  buttonColor: string;
  radius: number;
};

/** Spin-to-win. The platform picks the prize (by weight) when the form is sent, never the browser. */
export type OnsiteWheelSegment = {
  label: LocalText;
  /** The coupon code this slice gives; empty means "no prize". */
  code?: string;
  /** Relative chance, 0-100. 0 = never lands here. */
  weight: number;
  color: string;
};

export type OnsiteWheelBlock = BlockBase & {
  type: "wheel";
  segments: OnsiteWheelSegment[];
  size: number;
  textColor: string;
};

export type OnsiteBlock =
  | OnsiteTextBlock
  | OnsiteImageBlock
  | OnsiteButtonBlock
  | OnsiteSpacerBlock
  | OnsiteDividerBlock
  | OnsiteCountdownBlock
  | OnsiteCouponBlock
  | OnsiteFormBlock
  | OnsiteWheelBlock;

export type OnsiteBlockType = OnsiteBlock["type"];

export type OnsiteDesign = {
  version: 1;
  layout: OnsiteDesignLayout;
  blocks: OnsiteBlock[];
  /** Thank-you page, shown after the form is sent. Only used when there is a form. */
  success?: { blocks: OnsiteBlock[] };
};

/** The same design with every text in one language, ready to draw. */
export type ResolvedBlock =
  | (Omit<OnsiteTextBlock, "text"> & { text: string })
  | (Omit<OnsiteImageBlock, "alt"> & { alt: string })
  | (Omit<OnsiteButtonBlock, "label"> & { label: string })
  | OnsiteSpacerBlock
  | OnsiteDividerBlock
  | (Omit<OnsiteCountdownBlock, "expiredText"> & { expiredText: string })
  | (Omit<OnsiteCouponBlock, "copyLabel" | "copiedLabel"> & { copyLabel: string; copiedLabel: string })
  | (Omit<
      OnsiteFormBlock,
      "emailLabel" | "emailPlaceholder" | "phoneLabel" | "interests" | "interestsLabel" | "consentText" | "submitLabel"
    > & {
      emailLabel: string;
      emailPlaceholder: string;
      phoneLabel: string;
      interests: string[];
      interestsLabel: string;
      consentText: string;
      submitLabel: string;
    })
  | (Omit<OnsiteWheelBlock, "segments"> & {
      /** Codes are left out: the visitor only learns the code they win. */
      segments: Array<{ label: string; color: string }>;
    });

export type ResolvedDesign = {
  version: 1;
  layout: OnsiteDesignLayout;
  blocks: ResolvedBlock[];
  successBlocks: ResolvedBlock[];
  /** The language shown (the shopper's when the design has it, else English). */
  language: string;
  /** Right-to-left: the language shown is written right to left. */
  rtl: boolean;
};

/** A text in a language: its own wording when written, else English. */
export function textIn(text: LocalText | undefined, language: string): string {
  if (!text) return "";
  const own = text[baseLanguage(language)];
  return own && own.trim() ? own : text.en;
}

/** Languages a design is written in: those its main texts (text, buttons, submit) have. */
export function designLanguages(design: OnsiteDesign): Set<string> {
  const out = new Set<string>([PAGE_LANGUAGE_FALLBACK]);
  for (const block of design.blocks) {
    const text =
      block.type === "text"
        ? block.text
        : block.type === "button"
          ? block.label
          : block.type === "form"
            ? block.submitLabel
            : undefined;
    for (const [language, value] of Object.entries(text ?? {})) {
      if (typeof value === "string" && value.trim()) out.add(language);
    }
  }
  return out;
}

/**
 * The design in the shopper's language when it is written in it, else in
 * English (never half and half), as the website shows it. `fill` replaces
 * words like {{first_name}}.
 */
export function resolveDesign(
  design: OnsiteDesign,
  locale: string,
  fill: (text: string) => string = (text) => text,
  /** The repo's right-to-left check (src/lib/i18n). */
  isRtl: (language: string) => boolean = () => false,
): ResolvedDesign {
  const wanted = baseLanguage(locale) || PAGE_LANGUAGE_FALLBACK;
  const language = designLanguages(design).has(wanted) ? wanted : PAGE_LANGUAGE_FALLBACK;
  const pick = (text: LocalText | undefined) => textIn(text, language);
  const resolveBlock = (block: OnsiteBlock): ResolvedBlock => {
    switch (block.type) {
      case "text":
        return { ...block, text: fill(pick(block.text)) };
      case "image":
        return { ...block, alt: pick(block.alt) };
      case "button":
        return { ...block, label: fill(pick(block.label)) };
      case "countdown":
        return { ...block, expiredText: pick(block.expiredText) };
      case "coupon":
        return {
          ...block,
          copyLabel: pick(block.copyLabel),
          copiedLabel: pick(block.copiedLabel),
        };
      case "form":
        return {
          ...block,
          emailLabel: pick(block.emailLabel),
          emailPlaceholder: pick(block.emailPlaceholder),
          phoneLabel: pick(block.phoneLabel),
          interests: block.interests.map((choice) => pick(choice)),
          interestsLabel: pick(block.interestsLabel),
          consentText: pick(block.consentText),
          submitLabel: fill(pick(block.submitLabel)),
        };
      case "wheel":
        return {
          ...block,
          segments: block.segments.map((segment) => ({ label: pick(segment.label), color: segment.color })),
        };
      default:
        return block;
    }
  };
  return {
    version: 1,
    layout: design.layout,
    blocks: design.blocks.map(resolveBlock),
    successBlocks: (design.success?.blocks ?? []).map(resolveBlock),
    language,
    rtl: isRtl(language),
  };
}

/** Time left until `endsAt`, split for display. Null once it has passed. */
export function countdownParts(
  endsAt: string,
  now: number,
): { days: number; hours: number; minutes: number; seconds: number } | null {
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end) || end <= now) return null;
  let left = Math.floor((end - now) / 1000);
  const days = Math.floor(left / 86_400);
  left -= days * 86_400;
  const hours = Math.floor(left / 3600);
  left -= hours * 3600;
  const minutes = Math.floor(left / 60);
  return { days, hours, minutes, seconds: left - minutes * 60 };
}
