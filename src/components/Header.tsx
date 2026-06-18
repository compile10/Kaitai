import { headers } from "next/headers";
import Link from "next/link";
import SignInDialog from "@/components/SignInDialog";
import UserMenu from "@/components/UserMenu";
import { auth } from "@/lib/auth";

export default async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Gate the admin UI on the server so it honors both role-based admins and
  // adminUserIds, which only the server-side permission engine can resolve.
  let canAccessAdmin = false;
  if (session) {
    const { success } = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          adminPanel: ["access"],
        },
      },
    });
    canAccessAdmin = success;
  }

  return (
    <header className="border-b border-border bg-background relative z-10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-end gap-2">
        {session ? (
          <UserMenu user={session.user} canAccessAdmin={canAccessAdmin} />
        ) : (
          <nav className="flex items-center gap-2">
            <SignInDialog />
            <Link
              href="/sign-up"
              className="text-sm px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-colors"
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
