import logo from "@common/assets/branding/logo.svg";
import Image from "next/image";
import Header from "@/components/Header";
import HomeContent from "@/components/HomeContent";
import HomeHeroBackground from "@/components/HomeHeroBackground";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      <HomeHeroBackground />

      <Header />

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="flex flex-col items-start space-y-8">
          {/* Server-rendered header */}
          <div className="space-y-2 w-full max-w-2xl">
            <Image
              src={logo}
              alt="Kaitai 解体"
              width={360}
              height={92}
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
    </div>
  );
}
