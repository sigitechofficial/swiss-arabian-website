"use client";

import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

type QueryFn<T> = () => Promise<T>;

/** RTK-compatible query helper used across feature modules. */
export function useApiQuery<T>(
  key: QueryKey,
  queryFn: QueryFn<T>,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: key,
    queryFn,
    ...options,
  });
}

export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables>,
) {
  const mutation = useMutation({
    mutationFn,
    ...options,
  });

  return {
    ...mutation,
    unwrap: async (variables: TVariables) => {
      return mutation.mutateAsync(variables);
    },
  };
}
