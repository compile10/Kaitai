import logo from "@common/assets/branding/logo.svg";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import HomeContent from "@/components/HomeContent";
import SignInDialog from "@/components/SignInDialog";
import UserMenu from "@/components/UserMenu";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Top navigation bar */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-end">
          {session ? (
            <UserMenu name={session.user.name} email={session.user.email} />
          ) : (
            <nav className="flex items-center gap-2">
              <SignInDialog />
              <Link
                href="/sign-up"
                className="text-sm px-4 py-1.5 bg-tint hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Sign up
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center space-y-8">
          {/* Server-rendered header */}
          <div className="text-center space-y-2 w-full max-w-2xl">
            <Image
              src={logo}
              alt="Kaitai 解体"
              width={260}
              height={66}
              className="mx-auto"
              priority
            />
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Visualize Japanese sentence structure with AI-powered analysis
            </p>
          </div>

          {/* Client-rendered interactive content */}
          <HomeContent />
        </div>
      </main>

      {/* Server-rendered footer */}
      <footer className="text-center py-8 text-gray-600 dark:text-gray-400 text-sm">
        <p>Powered by AI and Next.js</p>
      </footer>
    </div>
  );
}
