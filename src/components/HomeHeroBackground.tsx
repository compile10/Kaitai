import Image from "next/image";
import type { CSSProperties } from "react";
import DiagonalMarquee from "@/components/DiagonalMarquee";

export default function HomeHeroBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={
        {
          "--home-triangle-width": "clamp(10rem, 62vw, 58rem)",
          "--home-triangle-height":
            "min(80vh, calc(var(--home-triangle-width) * 0.78))",
        } as CSSProperties
      }
    >
      {/* Decorative triangle image — top-right corner */}
      <div
        className="absolute top-0 right-0 w-(--home-triangle-width) h-(--home-triangle-height) z-0"
        style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%)" }}
      >
        <Image
          src="/harold-wainwright-4JHvZQSMkD4-unsplash.jpg"
          alt=""
          fill
          sizes="(max-width: 768px) 62vw, 58rem"
          quality={80}
          className="object-cover"
          style={{ objectPosition: "center" }}
          priority={false}
        />
      </div>

      <DiagonalMarquee />
    </div>
  );
}
