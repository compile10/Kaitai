import type { Metadata } from "next";
import Header from "@/components/Header";
import AnalysisContent from "./AnalysisContent";

interface Props {
  params: Promise<{ sentence: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sentence } = await params;
  const decoded = decodeURIComponent(sentence);
  return {
    title: `${decoded} — Kaitai 解体`,
  };
}

export default async function AnalyzePage({ params }: Props) {
  const { sentence } = await params;
  const decoded = decodeURIComponent(sentence);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-start space-y-8">
          <AnalysisContent sentence={decoded} />
        </div>
      </main>
    </div>
  );
}
