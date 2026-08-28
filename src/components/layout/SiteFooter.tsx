import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container container--full">
        <Link className="footer-brand" href="/" aria-label="Swiss Arabian home">
          <img
            className="footer-brand__mark"
            src="/assets/sa-logo-footer.png"
            alt="Swiss Arabian"
          />
        </Link>

        <div className="site-footer__cols">
          <section className="footer-col" id="footer-account" aria-labelledby="fc-account">
            <h2 className="footer-col__title" id="fc-account">
              My Account
            </h2>
            <ul role="list">
              <li>
                <Link href="/login">Sign In</Link>
              </li>
              <li>
                <Link href="/register">Register</Link>
              </li>
              <li>
                <Link href="/account/orders">Order Status</Link>
              </li>
              <li>
                <Link href="/faq">Returns</Link>
              </li>
            </ul>
          </section>

          <section className="footer-col" aria-labelledby="fc-help">
            <h2 className="footer-col__title" id="fc-help">
              Help
            </h2>
            <ul role="list">
              <li>
                <Link href="/faq">Ordering</Link>
              </li>
              <li>
                <Link href="/faq">Shipping and Delivery</Link>
              </li>
              <li>
                <Link href="/faq">Returns and Refunds</Link>
              </li>
              <li>
                <Link href="/faq">Payment</Link>
              </li>
              <li>
                <Link href="/faq">Product and Sizing</Link>
              </li>
            </ul>
          </section>

          <section className="footer-col" aria-labelledby="fc-legal">
            <h2 className="footer-col__title" id="fc-legal">
              Legal
            </h2>
            <ul role="list">
              <li>
                <Link href="/faq">Accessibility Statement</Link>
              </li>
              <li>
                <Link href="/faq">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/faq">Terms of Use</Link>
              </li>
            </ul>
          </section>

          <section className="footer-col" aria-labelledby="fc-about">
            <h2 className="footer-col__title" id="fc-about">
              About Us
            </h2>
            <ul role="list">
              <li>
                <Link href="/our-story">Our Story</Link>
              </li>
              <li>
                <Link href="/stores">Stores</Link>
              </li>
              <li>
                <Link href="/our-story">Careers</Link>
              </li>
              <li>
                <Link href="/our-story">Sustainability</Link>
              </li>
            </ul>
          </section>

          <section className="footer-col" aria-labelledby="fc-contact">
            <h2 className="footer-col__title" id="fc-contact">
              Contact Us
            </h2>
            <ul role="list">
              <li>
                <Link href="/faq">Live Chat</Link>
              </li>
              <li>
                <Link href="/stores">Store Locator</Link>
              </li>
            </ul>
          </section>

          <section className="footer-col footer-col--promoted" aria-labelledby="fc-more">
            <h2 className="visually-hidden" id="fc-more">
              More from Swiss Arabian
            </h2>
            <ul role="list">
              <li>
                <Link href="/account">Email Sign Up</Link>
              </li>
              <li>
                <Link href="/gift-cards">Gift Cards</Link>
              </li>
              <li>
                <Link href="/">Download The App</Link>
              </li>
              <li>
                <Link href="/">Sitemap</Link>
              </li>
            </ul>
            <ul className="social" role="list">
              <li>
                <a className="social__link" href="https://www.instagram.com" aria-label="Instagram">
                  <span className="visually-hidden">Instagram</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="4.5" />
                    <circle cx="12" cy="12" r="3.3" />
                    <circle cx="16.7" cy="7.3" r="0.9" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              </li>
              <li>
                <a className="social__link" href="https://www.facebook.com" aria-label="Facebook">
                  <span className="visually-hidden">Facebook</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.3-1.4 1.5-1.4h1.3V5.6c-.6-.1-1.4-.2-2.3-.2-2.3 0-3.8 1.4-3.8 3.9v2H8v2.8h2.4V21h3.1z" />
                  </svg>
                </a>
              </li>
              <li>
                <a className="social__link" href="https://x.com" aria-label="X">
                  <span className="visually-hidden">X</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.5 4h2.6l-5.7 6.5L21 20h-5.2l-4.1-5.4L6.9 20H4.3l6.1-7L4 4h5.3l3.7 4.9L17.5 4zm-.9 14.4h1.4L8.5 5.5H7L16.6 18.4z" />
                  </svg>
                </a>
              </li>
              <li>
                <a className="social__link" href="https://www.youtube.com" aria-label="YouTube">
                  <span className="visually-hidden">YouTube</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M21.6 8.2c-.2-1-.9-1.7-1.9-1.9C18 6 12 6 12 6s-6 0-7.7.3c-1 .2-1.7.9-1.9 1.9C2.2 9.9 2.2 12 2.2 12s0 2.1.2 3.8c.2 1 .9 1.7 1.9 1.9C6 18 12 18 12 18s6 0 7.7-.3c1-.2 1.7-.9 1.9-1.9.2-1.7.2-3.8.2-3.8s0-2.1-.2-3.8zM10 15V9l5 3-5 3z" />
                  </svg>
                </a>
              </li>
              <li>
                <a className="social__link" href="https://www.tiktok.com" aria-label="TikTok">
                  <span className="visually-hidden">TikTok</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16 4c.3 2 1.5 3.4 3.5 3.6v2.4c-1.2 0-2.4-.4-3.5-1.1v5.4c0 2.9-2.1 5-4.9 5-2.7 0-4.8-2-4.8-4.7 0-2.8 2.3-4.9 5.3-4.6v2.5c-.4-.1-.8-.2-1.1-.2-1.2 0-2.1.9-2.1 2.1 0 1.3.9 2.2 2.2 2.2 1.3 0 2.3-1 2.3-2.6V4H16z" />
                  </svg>
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="site-footer__legal">
          <p>© Swiss Arabian Perfumes Group</p>
          <p className="site-footer__legal-links">
            <Link href="/faq">Privacy Policy</Link>
            <span aria-hidden="true">|</span>
            <Link href="/faq">Terms of Use</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
