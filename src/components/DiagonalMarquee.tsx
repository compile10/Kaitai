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
    <span className="whitespace-nowrap font-(family-name:--font-rampart-one) text-[clamp(1rem,3vw,1.5rem)] text-white/40">
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
          left: "calc(100vw - var(--home-triangle-width))",
          transformOrigin: "top left",
          transform:
            "rotate(atan2(var(--home-triangle-height), var(--home-triangle-width)))",
          width:
            "calc(100vw + var(--home-triangle-width) + var(--home-triangle-height))",
        }}
      >
        <Marquee className="[--duration:110s] [--gap:clamp(1.5rem,5vw,4rem)]">
          {SENTENCES.map((s) => (
            <SentenceItem key={s} text={s} />
          ))}
        </Marquee>
      </div>
    </div>
  );
}
