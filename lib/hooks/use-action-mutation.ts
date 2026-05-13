"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

type Options<TInput, TOutput> = Omit<
  UseMutationOptions<TOutput, Error, TInput>,
  "mutationFn"
> & {
  successMessage?: string | ((data: TOutput, variables: TInput) => string | null | undefined);
  errorMessage?: string | ((error: Error, variables: TInput) => string);
  showErrorToast?: boolean;
};

export function useActionMutation<TInput, TOutput = unknown>(
  action: (input: TInput) => Promise<TOutput>,
  options?: Options<TInput, TOutput>
) {
  const { successMessage, errorMessage, showErrorToast = true, ...rest } = options ?? {};

  return useMutation<TOutput, Error, TInput>({
    mutationFn: (input) => action(input),
    ...rest,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (successMessage) {
        const message =
          typeof successMessage === "function" ? successMessage(data, variables) : successMessage;
        if (message) toast.success(message);
      }
      rest.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      if (showErrorToast) {
        const message =
          typeof errorMessage === "function"
            ? errorMessage(error, variables)
            : errorMessage ?? error.message ?? "Something went wrong.";
        toast.error(message);
      }
      rest.onError?.(error, variables, onMutateResult, context);
    }
  });
}
