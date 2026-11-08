"use client";

import type { PunctuationNode, WordNode } from "@common/types";
import { Hand, Move, ZoomIn } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSettingsQuery } from "@/hooks/use-settings-query";
import WordCell, { ParticleChip, PunctuationCell } from "./WordCell";

const WATASHI: WordNode = {
  id: "guide-watashi",
  type: "word",
  text: "私",
  position: 0,
  reading: "わたし",
  partOfSpeech: "pronoun",
  translation: "I",
  modifies: null,
  attachedParticle: {
    text: "は",
    reading: null,
    description: "Marks 私 as the topic.",
  },
  isTopic: true,
};
const KINOU: WordNode = {
  id: "guide-kinou",
  type: "word",
  text: "昨日",
  position: 1,
  reading: "きのう",
  partOfSpeech: "noun",
  translation: "yesterday",
  modifies: ["guide-katta"],
  attachedParticle: null,
  isTopic: null,
};
const WO_PARTICLE: NonNullable<WordNode["attachedParticle"]> = {
  text: "を",
  reading: null,
  description:
    "Marks <strong>車</strong> as the direct object: the thing that was bought.",
};
const KURUMA: WordNode = {
  id: "guide-kuruma",
  type: "word",
  text: "車",
  position: 2,
  reading: "くるま",
  partOfSpeech: "noun",
  translation: "car",
  modifies: ["guide-katta"],
  attachedParticle: WO_PARTICLE,
  isTopic: null,
};
const KATTA: WordNode = {
  id: "guide-katta",
  type: "word",
  text: "買った",
  position: 3,
  reading: "かった",
  partOfSpeech: "verb",
  translation: "bought",
  modifies: null,
  attachedParticle: null,
  isTopic: null,
};
const MARU: PunctuationNode = {
  id: "guide-maru",
  type: "punctuation",
  text: "。",
  position: 4,
  description: "Ends the sentence",
};

export default function StructureGuideDialog() {
  const { data: settings } = useSettingsQuery();
  const translationsShown = settings?.showWordTranslations ?? false;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="How to read the sentence structure"
          title="How to read this graph"
          className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-border text-sm font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          ?
        </button>
      </DialogTrigger>
      <DialogContent className="grid-cols-[minmax(0,1fr)] max-h-[calc(100dvh-2rem)] overflow-y-auto bg-card text-card-foreground border-border sm:max-w-2xl">
        <div className="space-y-1 pr-6">
          <DialogTitle className="text-xl">
            Reading the sentence structure
          </DialogTitle>
          <DialogDescription>
            Examples from 私は昨日車を買った。 (&ldquo;I bought a car
            yesterday.&rdquo;) Everything here works like the real graph.
          </DialogDescription>
        </div>

        <div className="space-y-6">
          <GuideSection
            title="Words"
            caption={
              translationsShown
                ? "Each box is one word: how it's written, how it's read, what kind of word it is, and its English meaning."
                : "Each box is one word: how it's written, how it's read, what kind of word it is, and its English meaning. Meanings stay blurred so you can guess first. Click one to reveal it."
            }
          >
            <div className="flex items-start gap-3">
              <WordCell word={KURUMA} />
              <WordAnatomy translationsShown={translationsShown} />
            </div>
          </GuideSection>

          <ParticleSection />

          <GuideSection
            title="Arrows"
            caption="An arrow points from a word to the word it describes. Here 昨日 (yesterday) and 車を (car) both tell you about 買った (bought). Neighbors get a straight arrow; when words sit in between, the arrow arcs over them."
          >
            <ArrowExample />
          </GuideSection>

          <GuideSection
            title="Topic"
            caption="The dashed rose box marked TOPIC is what the sentence is about. It sets the context without describing any one word, so no arrows come from it."
          >
            <div className="flex items-start pt-2">
              <WordCell word={WATASHI} />
              <ParticleChip particle={WATASHI.attachedParticle!} />
            </div>
          </GuideSection>

          <GuideSection
            title="Punctuation"
            caption="Dashed teal boxes are punctuation, with what each mark does in this sentence."
          >
            <PunctuationCell punctuation={MARU} />
          </GuideSection>

          <section>
            <h4 className="font-semibold text-foreground">Moving around</h4>
            <ul className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <NavigationTip icon={<Move className="size-4" />}>
                Drag a box to rearrange
              </NavigationTip>
              <NavigationTip icon={<ZoomIn className="size-4" />}>
                Scroll or use + / − to zoom
              </NavigationTip>
              <NavigationTip icon={<Hand className="size-4" />}>
                Drag the background to pan
              </NavigationTip>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GuideSection({
  title,
  caption,
  children,
}: {
  title: string;
  caption: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <h4 className="font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{caption}</p>
      <ExampleCanvas>{children}</ExampleCanvas>
    </section>
  );
}

/** Dotted panel matching the graph background, scrolling sideways on narrow screens. */
function ExampleCanvas({ children }: { children: ReactNode }) {
  return (
    <div
      className="mt-3 overflow-x-auto rounded-lg bg-muted"
      style={{
        backgroundImage: "radial-gradient(#9ca3af 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    >
      <div className="flex w-max min-w-full justify-center px-6 py-5">
        {children}
      </div>
    </div>
  );
}

/**
 * Labels for each line of a word box. Heights mirror WordCell's line boxes
 * (border + padding, then each text line) so every label sits beside its line.
 */
function WordAnatomy({ translationsShown }: { translationsShown: boolean }) {
  const rows = [
    { label: "Word", className: "h-[27.5px] mb-0.5" },
    { label: "Reading", className: "h-[19.25px] mb-1" },
    { label: "Part of speech", className: "h-[16.5px]" },
    {
      label: translationsShown ? "English meaning" : "Meaning (click it)",
      className: "h-[27.25px] mt-1",
    },
  ];
  return (
    <ul className="pt-[10px] text-xs font-medium text-muted-foreground">
      {rows.map(({ label, className }) => (
        <li key={label} className={`flex items-center gap-1.5 ${className}`}>
          <span aria-hidden className="h-px w-4 bg-muted-foreground/60" />
          {label}
        </li>
      ))}
    </ul>
  );
}

function ParticleSection() {
  const [open, setOpen] = useState(false);

  return (
    <GuideSection
      title="Particles"
      caption="Orange tags are particles: small words that mark the role of the word they follow. Click one to see what it does in the sentence. Try this one."
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="flex items-start">
          <WordCell word={KURUMA} />
          <ParticleChip
            particle={WO_PARTICLE}
            onClick={() => setOpen((value) => !value)}
          />
        </div>
        {open && (
          <div
            className="max-w-60 overflow-hidden rounded-lg bg-card shadow-lg"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 bg-orange-500 px-3 py-1.5 text-white dark:bg-orange-600">
              <span className="text-lg font-bold">{WO_PARTICLE.text}</span>
              <span className="text-xs text-orange-100">Particle</span>
            </div>
            <p
              className="px-3 py-2 text-sm text-foreground"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: static example text
              dangerouslySetInnerHTML={{ __html: WO_PARTICLE.description }}
            />
          </div>
        )}
      </div>
    </GuideSection>
  );
}

// Fixed column widths so the arc can land on the center of each word box
const WORD_COLUMN = 150;
const PARTICLE_COLUMN = 190;
const GAP = 40;
const ARC_HEIGHT = 56;
const ROW_WIDTH = WORD_COLUMN * 2 + PARTICLE_COLUMN + GAP * 2;

function ArrowExample() {
  // useId output can contain characters that break url(#...) references
  const markerId = `guide-arrow-${useId().replace(/[^\w-]/g, "")}`;
  const arcStart = WORD_COLUMN / 2;
  const arcEnd = ROW_WIDTH - WORD_COLUMN / 2;

  return (
    <div className="relative" style={{ width: ROW_WIDTH }}>
      <svg
        aria-hidden
        className="absolute top-0 left-0 overflow-visible"
        width={ROW_WIDTH}
        height={ARC_HEIGHT}
      >
        <defs>
          <ArrowMarker id={markerId} />
        </defs>
        <path
          d={`M ${arcStart} ${ARC_HEIGHT - 2} C ${arcStart + 60} -8, ${arcEnd - 60} -8, ${arcEnd} ${ARC_HEIGHT - 2}`}
          className="stroke-rf-edge"
          strokeWidth={2}
          fill="none"
          markerEnd={`url(#${markerId})`}
        />
      </svg>
      <div className="flex items-start" style={{ paddingTop: ARC_HEIGHT }}>
        <div className="flex justify-center" style={{ width: WORD_COLUMN }}>
          <WordCell word={KINOU} />
        </div>
        <div style={{ width: GAP }} />
        <div
          className="flex items-start justify-center"
          style={{ width: PARTICLE_COLUMN }}
        >
          <WordCell word={KURUMA} />
          <ParticleChip particle={WO_PARTICLE} />
        </div>
        <div className="flex items-center self-stretch" style={{ width: GAP }}>
          <svg aria-hidden width={GAP} height={16} className="overflow-visible">
            <defs>
              <ArrowMarker id={`${markerId}-straight`} />
            </defs>
            <path
              d={`M 4 8 L ${GAP - 6} 8`}
              className="stroke-rf-edge"
              strokeWidth={2}
              fill="none"
              markerEnd={`url(#${markerId}-straight)`}
            />
          </svg>
        </div>
        <div className="flex justify-center" style={{ width: WORD_COLUMN }}>
          <WordCell word={KATTA} />
        </div>
      </div>
    </div>
  );
}

function ArrowMarker({ id }: { id: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="7"
      markerHeight="7"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" className="fill-rf-edge" />
    </marker>
  );
}

function NavigationTip({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
      <span className="text-primary">{icon}</span>
      {children}
    </li>
  );
}
