import { LogIn } from "lucide-react";
import { signInWithGoogle } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  className?: string;
  label?: string;
};

export function SignInWithGoogleButton({ variant = "primary", className, label = "Sign in with Google" }: Props) {
  return (
    <form action={signInWithGoogle} className={cn("inline-flex", className)}>
      <Button type="submit" variant={variant}>
        <LogIn className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}
