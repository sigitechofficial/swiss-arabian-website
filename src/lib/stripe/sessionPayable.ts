import type { StripeCheckoutSession } from "@stripe/stripe-js";
import { fromMinorUnits } from "@/lib/format/money";

/**
 * What the shopper pays in a Stripe Checkout session, in major units.
 *
 * Stripe sends the total as an integer in the currency's minor units (10120 fils for
 * KWD 10.120) together with the divisor; without a divisor the currency's own minor
 * units are used, never an assumed 100.
 */
export function stripeSessionPayable(session: StripeCheckoutSession): { amount: number; currency: string } {
  const currency = session.currency.toUpperCase();
  const minor = session.total.total.minorUnitsAmount;
  const divisor = session.minorUnitsAmountDivisor;
  return {
    amount: divisor ? minor / divisor : fromMinorUnits(minor, currency),
    currency,
  };
}
