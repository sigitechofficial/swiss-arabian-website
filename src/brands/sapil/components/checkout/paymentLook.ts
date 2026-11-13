import type { StripeElementsLook } from "@/features/checkout/utils/stripeCheckoutAppearance";

/** v9 tokens for the providers' card fields (their iframes can't read our CSS variables). */
export const SAPIL_FIELD = {
  ink: "#1e1b18",
  ink2: "#4a443d",
  muted: "#6f665b",
  line: "#d6cdc0",
  accent: "#16305c",
  sale: "#9a3b2a",
  card: "#fffdfa",
};

/** Stripe Payment Element in v9 style (Poppins, v9 field borders and radius). */
export const SAPIL_STRIPE_LOOK: StripeElementsLook = {
  fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" }],
  appearance: {
    theme: "stripe",
    variables: {
      fontFamily: "Poppins, system-ui, sans-serif",
      fontSizeBase: "15px",
      colorPrimary: SAPIL_FIELD.accent,
      colorBackground: SAPIL_FIELD.card,
      colorText: SAPIL_FIELD.ink,
      colorTextSecondary: SAPIL_FIELD.ink2,
      colorTextPlaceholder: SAPIL_FIELD.muted,
      colorDanger: SAPIL_FIELD.sale,
      borderRadius: "10px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": { border: `1px solid ${SAPIL_FIELD.line}`, boxShadow: "none" },
      ".Input:focus": { border: `1px solid ${SAPIL_FIELD.ink}`, boxShadow: "none" },
      ".AccordionItem": { border: `1px solid ${SAPIL_FIELD.line}`, boxShadow: "none" },
    },
  },
};

/** Paymob Pixel card fields in v9 style. */
export const SAPIL_PAYMOB_STYLE = {
  Font_Family: "Poppins, system-ui, sans-serif",
  Font_Size_Label: "14",
  Font_Size_Input_Fields: "15",
  Font_Size_Payment_Button: "15",
  Font_Weight_Label: 600,
  Font_Weight_Input_Fields: 400,
  Font_Weight_Payment_Button: 600,
  Color_Container: SAPIL_FIELD.card,
  Color_Border_Input_Fields: SAPIL_FIELD.line,
  Color_Border_Payment_Button: SAPIL_FIELD.ink,
  Radius_Border: "10",
  Color_Disabled: SAPIL_FIELD.muted,
  Color_Error: SAPIL_FIELD.sale,
  Color_Primary: SAPIL_FIELD.accent,
  Color_Input_Fields: "#ffffff",
  Text_Color_For_Label: SAPIL_FIELD.ink,
  Text_Color_For_Payment_Button: "#ffffff",
  Text_Color_For_Input_Fields: SAPIL_FIELD.ink,
  Color_For_Text_Placeholder: SAPIL_FIELD.muted,
  Width_of_Container: "100%",
  // Pixel treats this as the input height in pixels (v9 fields are 48px).
  Vertical_Padding: "48",
  Vertical_Spacing_between_components: "14",
  Container_Padding: "0",
};
