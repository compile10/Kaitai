import { headers } from "next/headers";
import Link from "next/link";
import SignInDialog from "@/components/SignInDialog";
import UserMenu from "@/components/UserMenu";
import { auth } from "@/lib/auth";

export default async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <header className="border-b border-border bg-background relative z-10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-end">
        {session ? (
          <UserMenu name={session.user.name} email={session.user.email} />
        ) : (
          <nav className="flex items-center gap-2">
            <SignInDialog />
            <Link
              href="/sign-up"
              className="text-sm px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
