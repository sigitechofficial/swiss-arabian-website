import { headers } from "next/headers";
import {
  setServerStorefrontHostResolver,
  storefrontHostFromHeaderValues,
} from "./storefrontHost";

setServerStorefrontHostResolver(async () => {
  const incoming = await headers();
  return storefrontHostFromHeaderValues(
    incoming.get("x-forwarded-host"),
    incoming.get("host"),
  );
});
