"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import {
  footerColLinks,
  footerColTitle,
  footerColTitleCaps,
  footerCols,
  footerLegal,
  footerNewsletter,
  footerNewsletterInput,
  footerNewsletterRow,
  footerNewsletterSubmit,
  footerNewsletterTitle,
  footerPayments,
  footerSocial,
  pageContainer,
  payMark,
  payMarkAmex,
  payMarkApple,
  payMarkGpay,
  payMarkMc,
  payMarkVisa,
  siteFooter,
  socialLink,
  visuallyHidden,
} from "@/styles/siteChrome";

const SHOP_LINKS = [
  { label: "Perfumes", href: "/collections/perfume" },
  { label: "Hair Mist", href: "/collections/hair-mist" },
  { label: "Perfume Oils", href: "/collections/concentrated-perfume-oils" },
  { label: "Incense", href: "/collections/incense" },
  { label: "Home Fragrance", href: "/collections/home-fragrance" },
  { label: "Traditional Items", href: "/collections/traditional-items" },
] as const;

const SERVICE_LINKS = [
  { label: "Exchange & Return", href: "/faq" },
  { label: "Shipping & Delivery", href: "/faq" },
  { label: "Refund Policy", href: "/faq" },
  { label: "Terms & Conditions", href: "/faq" },
  { label: "Privacy Policy", href: "/faq" },
  { label: "Contact Us", href: "/faq" },
] as const;

const MORE_LINKS = [
  { label: "About Us", href: "/our-story" },
  { label: "FAQ's", href: "/faq" },
  { label: "Blogs", href: "/blog" },
  { label: "Join Our Team", href: "/our-story" },
  { label: "Become a Sales Partner", href: "/our-story" },
] as const;

function onNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

export function SiteFooter() {
  return (
    <footer className={siteFooter}>
      <div className={pageContainer}>
        <form className={footerNewsletter} onSubmit={onNewsletterSubmit}>
          <h2 className={footerNewsletterTitle}>Subscribe to our newsletter</h2>
          <div className={footerNewsletterRow}>
            <label className={visuallyHidden} htmlFor="footer-email">
              Email address
            </label>
            <input
              className={footerNewsletterInput}
              id="footer-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              required
            />
            <button className={footerNewsletterSubmit} type="submit">
              Sign up
            </button>
          </div>
        </form>

        <div className={footerCols}>
          <section aria-labelledby="fc-shop">
            <h2 className={`${footerColTitle} ${footerColTitleCaps}`} id="fc-shop">
              Shop
            </h2>
            <ul className={footerColLinks} role="list">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="fc-services">
            <h2 className={footerColTitle} id="fc-services">
              Services
            </h2>
            <ul className={footerColLinks} role="list">
              {SERVICE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="fc-more">
            <h2 className={footerColTitle} id="fc-more">
              More Links
            </h2>
            <ul className={footerColLinks} role="list">
              {MORE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="fc-follow">
            <h2 className={`${footerColTitle} ${footerColTitleCaps}`} id="fc-follow">
              Follow us
            </h2>
            <ul className={footerSocial} role="list">
              <li>
                <a className={socialLink} href="https://www.facebook.com" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.3-1.4 1.5-1.4h1.3V5.6c-.6-.1-1.4-.2-2.3-.2-2.3 0-3.8 1.4-3.8 3.9v2H8v2.8h2.4V21h3.1z" />
                  </svg>
                </a>
              </li>
              <li>
                <a className={socialLink} href="https://www.youtube.com" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M21.6 8.2c-.2-1-.9-1.7-1.9-1.9C18 6 12 6 12 6s-6 0-7.7.3c-1 .2-1.7.9-1.9 1.9C2.2 9.9 2.2 12 2.2 12s0 2.1.2 3.8c.2 1 .9 1.7 1.9 1.9C6 18 12 18 12 18s6 0 7.7-.3c1-.2 1.7-.9 1.9-1.9.2-1.7.2-3.8.2-3.8s0-2.1-.2-3.8zM10 15V9l5 3-5 3z" />
                  </svg>
                </a>
              </li>
              <li>
                <a className={socialLink} href="https://www.instagram.com" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9A3.1 3.1 0 1 1 12 8.9a3.1 3.1 0 0 1 0 6.2zM17.4 6.8a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0z" />
                    <path d="M12 3.4c2.2 0 2.5 0 3.4.1 1.7.1 2.6.4 3.2 1 .6.6.9 1.5 1 3.2.1.9.1 1.2.1 3.4s0 2.5-.1 3.4c-.1 1.7-.4 2.6-1 3.2-.6.6-1.5.9-3.2 1-.9.1-1.2.1-3.4.1s-2.5 0-3.4-.1c-1.7-.1-2.6-.4-3.2-1-.6-.6-.9-1.5-1-3.2-.1-.9-.1-1.2-.1-3.4s0-2.5.1-3.4c.1-1.7.4-2.6 1-3.2.6-.6 1.5-.9 3.2-1 .9-.1 1.2-.1 3.4-.1zm0-1.6c-2.3 0-2.6 0-3.5.1-1.9.1-3.2.4-4.3 1.5-1.1 1.1-1.4 2.4-1.5 4.3-.1.9-.1 1.2-.1 3.5s0 2.6.1 3.5c.1 1.9.4 3.2 1.5 4.3 1.1 1.1 2.4 1.4 4.3 1.5.9.1 1.2.1 3.5.1s2.6 0 3.5-.1c1.9-.1 3.2-.4 4.3-1.5 1.1-1.1 1.4-2.4 1.5-4.3.1-.9.1-1.2.1-3.5s0-2.6-.1-3.5c-.1-1.9-.4-3.2-1.5-4.3-1.1-1.1-2.4-1.4-4.3-1.5-.9-.1-1.2-.1-3.5-.1z" />
                  </svg>
                </a>
              </li>
              <li>
                <a className={socialLink} href="https://wa.me" aria-label="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.1 4.9A9.9 9.9 0 0 0 3.3 17.2L2 22l4.9-1.3A9.9 9.9 0 0 0 19.1 4.9zm-7.1 15.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.1zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.2-.4 0-.1 0-.3 0-.4 0-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.4 1.5.6 2 .7 2.7.6.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1 0-.3-.1-.5-.2z" />
                  </svg>
                </a>
              </li>
              <li>
                <a className={socialLink} href="https://www.tiktok.com" aria-label="TikTok">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16 4c.3 2 1.5 3.4 3.5 3.6v2.4c-1.2 0-2.4-.4-3.5-1.1v5.4c0 2.9-2.1 5-4.9 5-2.7 0-4.8-2-4.8-4.7 0-2.8 2.3-4.9 5.3-4.6v2.5c-.4-.1-.8-.2-1.1-.2-1.2 0-2.1.9-2.1 2.1 0 1.3.9 2.2 2.2 2.2 1.3 0 2.3-1 2.3-2.6V4H16z" />
                  </svg>
                </a>
              </li>
              <li>
                <a className={socialLink} href="https://www.snapchat.com" aria-label="Snapchat">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 3.2c2.4 0 4.4 1.7 4.4 4.6v.3c1.1.2 1.8 1 1.8 2.1 0 .5-.2.9-.6 1.2.1.5.5 1.4 1.5 1.9.3.2.4.6.2.9-.2.3-.6.4-1 .3-.8-.2-1.5-.1-2.1.2-.3.9-.9 1.6-2.1 2 .4.3 1.2.7 1.2 1.3 0 .5-.5.8-1.2.8-.3 0-.6 0-.8-.1-.1 1.1-.6 2.1-2.3 2.1s-2.2-1-2.3-2.1c-.2.1-.5.1-.8.1-.7 0-1.2-.3-1.2-.8 0-.6.8-1 1.2-1.3-1.2-.4-.9-1.1-2.1-2-.6-.3-1.3-.4-2.1-.2-.4.1-1 0-1-.3-.2-.3-.1-.7.2-.9 1-.5.9-1.4 1.5-1.9-.4-.3-.6-.7-.6-1.2 0-1.1.7-1.9 1.8-2.1v-.3c0-2.9 2-4.6 4.4-4.6z" />
                  </svg>
                </a>
              </li>
              <li>
                <a className={socialLink} href="https://www.linkedin.com" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6.5 9.2H4V20h2.5V9.2zM5.2 4A1.5 1.5 0 1 0 5.2 7a1.5 1.5 0 0 0 0-3zM20 20h-2.5v-5.6c0-1.5-.5-2.5-1.8-2.5-1 0-1.5.7-1.8 1.3-.1.2-.1.6-.1.9V20H11V9.2h2.4v1.5c.4-.7 1.3-1.8 3.2-1.8 2.3 0 4 1.5 4 4.8V20z" />
                  </svg>
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className={footerLegal}>
          <p>Copyright © 2026 Swiss Arabian Global</p>
          <ul className={footerPayments} aria-label="Accepted payment methods">
            <li>
              <span className={`${payMark} ${payMarkAmex}`} aria-label="American Express">
                AMEX
              </span>
            </li>
            <li>
              <span className={`${payMark} ${payMarkApple}`} aria-label="Apple Pay">
                <svg viewBox="0 0 40 16" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M8.1 3.5c.5-.6.9-1.5.8-2.4-.8 0-1.7.5-2.2 1.2-.5.6-.9 1.5-.8 2.3.9.1 1.7-.4 2.2-1.1zM10.4 4.7c-1.2 0-2.1.7-2.7.7s-1.4-.7-2.4-.7c-1.2 0-2.4.7-3 1.8-1.3 2.2-.3 5.5.9 7.3.6.9 1.3 1.8 2.2 1.8s1.2-.6 2.3-.6 1.4.6 2.3.6 1.5-.9 2.1-1.8c.7-1 1-1.9 1-2 0 0-1.9-.7-1.9-2.8 0-1.8 1.4-2.5 1.5-2.6-.9-1.3-2.2-1.3-2.6-1.3z"
                  />
                  <text x="16" y="12.2" fill="currentColor" fontSize="8.5" fontWeight="600" fontFamily="Arial, sans-serif">
                    Pay
                  </text>
                </svg>
              </span>
            </li>
            <li>
              <span className={`${payMark} ${payMarkGpay}`} aria-label="Google Pay">
                <svg viewBox="0 0 48 16" aria-hidden="true">
                  <text x="0" y="12.4" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif">
                    <tspan fill="#4285F4">G</tspan>
                    <tspan fill="#EA4335">o</tspan>
                    <tspan fill="#FBBC05">o</tspan>
                    <tspan fill="#4285F4">g</tspan>
                    <tspan fill="#34A853">l</tspan>
                    <tspan fill="#EA4335">e</tspan>
                    <tspan fill="#5F6368"> Pay</tspan>
                  </text>
                </svg>
              </span>
            </li>
            <li>
              <span className={`${payMark} ${payMarkMc}`} aria-label="Mastercard">
                <svg viewBox="0 0 32 20" aria-hidden="true">
                  <circle cx="12.5" cy="10" r="7.2" fill="#eb001b" />
                  <circle cx="19.5" cy="10" r="7.2" fill="#f79e1b" />
                  <path
                    fill="#ff5f00"
                    d="M16 4.8a7.2 7.2 0 0 1 0 10.4 7.2 7.2 0 0 1 0-10.4z"
                  />
                </svg>
              </span>
            </li>
            <li>
              <span className={`${payMark} ${payMarkVisa}`} aria-label="Visa">
                VISA
              </span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
