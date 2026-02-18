import logo from "@common/assets/branding/logo.svg";
import Image from "next/image";
import Header from "@/components/Header";
import HomeContent from "@/components/HomeContent";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Decorative triangle image — top-right corner */}
      <div
        className="absolute top-0 right-0 w-[65vw] h-[80vh] z-0 pointer-events-none"
        style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%)" }}
      >
        <Image
          src="/harold-wainwright-4JHvZQSMkD4-unsplash.jpg"
          alt=""
          fill
          sizes="50vw"
          quality={80}
          className="object-cover"
          style={{ objectPosition: "8mak0px center" }}
          priority={false}
        />
      </div>

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
