import logo from "@common/assets/branding/logo.svg";
import Image from "next/image";
import HomeContent from "@/components/HomeContent";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
