"use client";

import Link from "next/link";
import { LogIn as LogInIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function SignInDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError(null);
    setIsLoading(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      setError(error.message ?? "Failed to sign in");
      setIsLoading(false);
    } else {
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-sm px-4 py-1.5 text-muted-foreground hover:text-foreground font-medium rounded-lg hover:bg-accent transition-colors"
        >
          Sign in
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-md bg-card text-card-foreground border-border"
      >
        <DialogTitle className="sr-only">Sign In</DialogTitle>

        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogInIcon className="w-6 h-6 text-primary-foreground" />
            <div className="text-xl font-semibold text-primary-foreground">Sign In</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-primary-foreground hover:bg-white/20 transition-colors text-2xl font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Welcome back
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access Kaitai (解体).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field>
              <FieldLabel
                htmlFor="signin-email"
                className="text-sm font-semibold text-foreground"
              >
                Email
              </FieldLabel>
              <Input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="px-4 py-3 border-2 border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-0 focus:outline-none transition-colors"
              />
            </Field>

            <Field>
              <FieldLabel
                htmlFor="signin-password"
                className="text-sm font-semibold text-foreground"
              >
                Password
              </FieldLabel>
              <Input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="px-4 py-3 border-2 border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-0 focus:outline-none transition-colors"
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}

            {/* Footer */}
            <div className="bg-muted -mx-6 -mb-6 px-6 py-4 mt-6 flex items-center justify-between border-t border-border">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors font-medium"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
