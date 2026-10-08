import type { AccountStatusTone } from "@/features/account/components/AccountStatus";

export type CardBrand = "Mastercard" | "Visa";

export type SavedCardView = {
  id: string;
  brand: CardBrand;
  last4: string;
  holder: string;
  expiryLabel: string;
  isDefault: boolean;
};

export type TransactionKind = "PAYMENT" | "REFUND" | "UPCOMING";

export type TransactionView = {
  id: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  cardLabel: string;
  amountLabel: string;
  statusLabel: string;
  statusTone: AccountStatusTone;
  kind: TransactionKind;
};
