"use client";

import { useState, type FormEvent } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isNewsletterEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

/**
 * Newsletter form state. The consent / CRM provider (Insider or the brand's own
 * CRM account) is not connected yet: a valid address is accepted on the page
 * only, exactly as before. Connect the provider here, once, for every brand.
 */
export function useNewsletterSignup({ onSuccess }: { onSuccess?: (email: string) => void } = {}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [invalid, setInvalid] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    if (!isNewsletterEmail(email)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setSubmitted(true);
    onSuccess?.(email.trim());
  }

  return {
    email,
    setEmail: (value: string) => {
      setEmail(value);
      if (invalid) setInvalid(false);
    },
    submitted,
    invalid,
    onSubmit,
    reset: () => {
      setEmail("");
      setSubmitted(false);
    },
  };
}
