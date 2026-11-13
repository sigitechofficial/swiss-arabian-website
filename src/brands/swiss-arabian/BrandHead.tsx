import type { ReactNode } from "react";

/**
 * Swiss Arabian's additions to <head>: its main font weights load first (page speed).
 * The "BentonSans Regular" option in globals.css also needs
 * https://fonts.cdnfonts.com/css/bentonsans-regular here.
 */
export function BrandHead(): ReactNode {
  return (
    <>
      {[400, 500, 700].map((weight) => (
        <link
          key={weight}
          rel="preload"
          href={`/fonts/benton-sans-wide-${weight}.woff2`}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      ))}
    </>
  );
}
