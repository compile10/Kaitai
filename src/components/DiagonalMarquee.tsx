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

const ANIMATION_DURATION = 85;

export default function DiagonalMarquee() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      <div
        className="absolute top-0"
        style={{
          left: "35vw",
          transformOrigin: "top left",
          transform: "rotate(atan2(80vh, 65vw))",
        }}
      >
        {SENTENCES.map((sentence, i) => (
          <div
            key={sentence}
            className="absolute top-0 left-0 whitespace-nowrap font-[family-name:var(--font-rampart-one)] text-2xl text-white/40 opacity-0"
            style={{
              animation: `scroll-hypotenuse ${ANIMATION_DURATION}s linear ${i * (ANIMATION_DURATION / SENTENCES.length)}s infinite`,
            }}
          >
            {sentence}
          </div>
        ))}
      </div>
    </div>
  );
}
