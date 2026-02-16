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
    <div className="min-h-screen bg-background relative z-10">
      {/* Decorative triangle image — bottom-right corner */}
      <div
        className="fixed bottom-0 right-0 w-[50vw] h-[60vh] z-0 pointer-events-none"
        style={{ clipPath: "polygon(100% 0%, 100% 100%, 0% 100%)" }}
      >
        <Image
          src="/harold-wainwright-4JHvZQSMkD4-unsplash.jpg"
          alt=""
          fill
          sizes="50vw"
          quality={80}
          className="object-cover"
          priority={false}
        />
      </div>

      {/* Top navigation bar */}
      <header className="border-b border-border bg-background">
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

      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center space-y-8">
          {/* Server-rendered header */}
          <div className="text-center space-y-2 w-full max-w-2xl">
            <Image
              src={logo}
              alt="Kaitai 解体"
              width={360}
              height={92}
              className="mx-auto"
              priority
            />
            <p className="text-lg text-muted-foreground">
              Breaking the language barrier.
            </p>
          </div>

          {/* Client-rendered interactive content */}
          <HomeContent />
        </div>
      </main>

      {/* Server-rendered footer */}
      <footer className="text-center py-8 text-muted-foreground text-sm">
        <p>Powered by AI and Next.js</p>
      </footer>
    </div>
  );
}
