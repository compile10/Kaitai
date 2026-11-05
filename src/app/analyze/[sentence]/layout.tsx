import type { ReactNode } from "react";
import Header from "@/components/Header";

export default function AnalysisLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header showHomeLink />
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-start space-y-8">{children}</div>
      </main>
    </div>
  );
}
