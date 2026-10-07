import type { Metadata } from "next";
import { headers } from "next/headers";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@/providers/query-client-provider";
import { SettingsStoreProvider } from "@/providers/settings-store-provider";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource/rampart-one/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaitai (解体)",
  description:
    "Visualize Japanese sentence structure with AI-powered analysis. Analyze grammar, particles, and word relationships.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          nonce={nonce}
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <QueryClientProvider>
            <SettingsStoreProvider>{children}</SettingsStoreProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
