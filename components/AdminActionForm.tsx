"use client";

import { type FormHTMLAttributes, type ReactNode } from "react";
import { useActionMutation } from "@/lib/hooks/use-action-mutation";

type Props = {
  action: (formData: FormData) => Promise<unknown>;
  successMessage?: string;
  children: ReactNode;
} & Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit">;

export function AdminActionForm({ action, successMessage, children, ...rest }: Props) {
  const mutation = useActionMutation(action, { successMessage });

  return (
    <form
      {...rest}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        mutation.mutate(formData);
      }}
    >
      <fieldset disabled={mutation.isPending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
