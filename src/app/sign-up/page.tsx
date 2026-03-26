"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/", // server side fallback since we already redirect to "/" in the handler
    });

    if (error) {
      setError(error.message ?? "Failed to create account");
      setIsLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-card border-border shadow-xl rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground">
            Create an account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Get started with Kaitai (解体)
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field>
              <FieldLabel
                htmlFor="name"
                className="text-sm font-semibold text-foreground"
              >
                Name
              </FieldLabel>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Your name"
                className="px-4 py-3 border-2 border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-0 focus:outline-none transition-colors"
              />
            </Field>

            <Field>
              <FieldLabel
                htmlFor="email"
                className="text-sm font-semibold text-foreground"
              >
                Email
              </FieldLabel>
              <Input
                id="email"
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
                htmlFor="password"
                className="text-sm font-semibold text-foreground"
              >
                Password
              </FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                className="px-4 py-3 border-2 border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-0 focus:outline-none transition-colors"
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>

            {error && <FieldError>{error}</FieldError>}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium rounded-lg transition-colors"
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t border-border">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
