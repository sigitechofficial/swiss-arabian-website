"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useLocaleRouter } from "@/lib/i18n/useLocaleRouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "@/components/ui/Toaster";
import { changeCustomerPassword, logoutCustomer } from "@/features/auth/api/auth.service";
import { isNewAccount } from "@/features/auth/utils/newAccountGreeting";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useApiQuery } from "@/lib/api/queryHooks";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { toastApiError } from "@/lib/api/toastApiError";
import { endSession } from "@/lib/auth/endSession";
import { localizeHref } from "@/lib/i18n/localePath";
import { customerAccountKeys } from "../api/customerAccount.keys";
import { listCustomerAddresses } from "../api/customerAccount.service";
import { listOrders } from "../api/customerOrders.service";

const noopSubscribe = () => () => {};

/**
 * The account dashboard: the signed-in customer, the "Welcome" vs "Welcome
 * back" greeting, the latest order, the address book (shared cache with the
 * addresses page) and signing out.
 */
export function useAccountDashboard(options: { onLogoutError?: (error: unknown) => void } = {}) {
  const user = useCurrentUser();
  const router = useLocaleRouter();
  const pathname = usePathname() || "/";
  const firstName = user?.firstName?.trim() || user?.fullName?.trim().split(/\s+/)[0] || "";
  // Read after hydration so the server and first client render agree.
  const isNew = useSyncExternalStore(noopSubscribe, () => isNewAccount(user?.email), () => false);

  // Latest real order — shares the "customer-orders" key prefix, so placing an
  // order or cancelling one refreshes this panel too.
  const recentQuery = useQuery({
    queryKey: ["customer-orders", "recent"],
    queryFn: () => listOrders({ limit: 1, offset: 0 }),
    staleTime: 60_000,
    // One retry: a rejected request should not hold this panel on "Loading" for long.
    retry: 1,
  });
  // Shares the address book's cache, so edits there update this panel.
  const addresses = useApiQuery(customerAccountKeys.addresses(), listCustomerAddresses);

  async function logout() {
    try {
      await logoutCustomer();
    } catch (error) {
      (options.onLogoutError ?? toastApiError)(error);
    } finally {
      endSession();
      router.push(localizeHref("/", pathname));
    }
  }

  return {
    user,
    firstName,
    isNew,
    recentQuery,
    recentOrder: recentQuery.data?.items?.[0] ?? null,
    addresses,
    logout,
  };
}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "Choose a password you haven’t used here before",
    path: ["newPassword"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

/**
 * Change password. The backend revokes existing sessions on a password
 * change, so the shopper is signed out and sent to sign in again.
 */
export function useChangePassword(
  options: { onDone?: () => void; onError?: (message: string) => void } = {},
) {
  const router = useLocaleRouter();
  const [done, setDone] = useState(false);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    try {
      await changeCustomerPassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      form.reset();
      setDone(true);
      if (options.onDone) options.onDone();
      else toast("Password updated. Please sign in again.", "success");
      endSession();
      router.push("/login?returnTo=/account/profile");
    } catch (error) {
      const message = getUserFacingErrorMessage(error);
      if (options.onError) options.onError(message);
      else toast(message, "error");
    }
  }

  return { form, done, submit: form.handleSubmit(onSubmit) };
}
