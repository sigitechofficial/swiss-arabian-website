/**
 * Compile-time check that every brand implements the same UI contract:
 * the same component names, with props a route can pass to any brand.
 * Swiss Arabian's `brand-ui.ts` is the reference. Add a line per new brand.
 */
import type * as SwissArabianUi from "./swiss-arabian/brand-ui";
import type * as SapilUi from "./sapil/brand-ui";
import type * as SwissArabianClientUi from "./swiss-arabian/brand-ui.client";
import type * as SapilClientUi from "./sapil/brand-ui.client";

type Contract = typeof SwissArabianUi;
type Implements<T extends Contract> = T;

type ClientContract = typeof SwissArabianClientUi;
type ImplementsClient<T extends ClientContract> = T;

export type BrandUiContracts = [Implements<typeof SapilUi>, ImplementsClient<typeof SapilClientUi>];
