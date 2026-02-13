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
          className="text-sm px-4 py-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Sign in
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
      >
        <DialogTitle className="sr-only">Sign In</DialogTitle>

        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogInIcon className="w-6 h-6 text-white" />
            <div className="text-xl font-semibold text-white">Sign In</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors text-2xl font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Welcome back
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your credentials to access Kaitai (解体).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field>
              <FieldLabel
                htmlFor="signin-email"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100"
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
                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:border-blue-600 focus:ring-0 focus:outline-none transition-colors"
              />
            </Field>

            <Field>
              <FieldLabel
                htmlFor="signin-password"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100"
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
                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:border-blue-600 focus:ring-0 focus:outline-none transition-colors"
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-900 -mx-6 -mb-6 px-6 py-4 mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
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
