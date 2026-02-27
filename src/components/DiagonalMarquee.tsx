import { Marquee } from "@/components/ui/marquee";

const SENTENCES = [
  "言葉は世界への扉",
  "日本語の美しさを解き明かす",
  "文法は言語の骨格",
  "一文一文が新しい発見",
  "理解は練習から生まれる",
  "漢字の世界を探検する",
  "言語を解体する",
  "文を分析する力",
];

function SentenceItem({ text }: { text: string }) {
  return (
    <span className="whitespace-nowrap font-[family-name:var(--font-rampart-one)] text-2xl text-white/40">
      {text}
    </span>
  );
}

export default function DiagonalMarquee() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      <div
        className="absolute top-0"
        style={{
          left: "35vw",
          transformOrigin: "top left",
          transform: "rotate(atan2(80vh, 65vw))",
          width: "calc(100vw + 50vw)",
        }}
      >
        <Marquee className="[--duration:110s] [--gap:4rem]">
          {SENTENCES.map((s) => (
            <SentenceItem key={s} text={s} />
          ))}
        </Marquee>
      </div>
    </div>
  );
}
