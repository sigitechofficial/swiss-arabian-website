"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toaster";
import { useApiMutation, useApiQuery } from "@/lib/api/queryHooks";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { customerAccountKeys } from "../api/customerAccount.keys";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  listCustomerAddresses,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from "../api/customerAccount.service";
import type {
  AddressDefaultTarget,
  UpdateCustomerAddressDto,
} from "../types/customerAccount";

export function useCustomerAddresses() {
  const queryClient = useQueryClient();
  const list = useApiQuery(customerAccountKeys.addresses(), listCustomerAddresses);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: customerAccountKeys.addresses() });

  const create = useApiMutation(createCustomerAddress, {
    onSuccess: async () => {
      await invalidate();
      toast("Address saved", "success");
    },
    onError: (error) => toast(getUserFacingErrorMessage(error), "error"),
  });

  const update = useApiMutation(
    (vars: { addressId: string; dto: UpdateCustomerAddressDto }) =>
      updateCustomerAddress(vars.addressId, vars.dto),
    {
      onSuccess: async () => {
        await invalidate();
        toast("Address updated", "success");
      },
      onError: (error) => toast(getUserFacingErrorMessage(error), "error"),
    },
  );

  const remove = useApiMutation(deleteCustomerAddress, {
    onSuccess: async () => {
      await invalidate();
      toast("Address removed", "success");
    },
    onError: (error) => toast(getUserFacingErrorMessage(error), "error"),
  });

  const setDefault = useApiMutation(
    (vars: { addressId: string; target: AddressDefaultTarget }) =>
      setDefaultCustomerAddress(vars.addressId, vars.target),
    {
      onSuccess: async () => {
        await invalidate();
        toast("Default address updated", "success");
      },
      onError: (error) => toast(getUserFacingErrorMessage(error), "error"),
    },
  );

  return { list, create, update, remove, setDefault };
}
