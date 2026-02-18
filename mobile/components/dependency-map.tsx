import React, { useState, useCallback, useMemo, useRef } from "react";
import { View, TouchableOpacity, LayoutChangeEvent } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { WordNode } from "@common/types";

// Arc colors — visually distinct, accessible palette
const ARC_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
];

// Width reserved on the right for SVG arcs
const ARC_AREA_WIDTH = 56;
const ARC_BASE_OFFSET = 18;
const ARC_SCALE_FACTOR = 10;
const CARD_GAP = 10;

interface DependencyMapProps {
  words: WordNode[];
}

interface CardLayout {
  y: number;
  height: number;
}

export function DependencyMap({ words }: DependencyMapProps) {
  const sortedWords = useMemo(
    () => [...words].sort((a, b) => a.position - b.position),
    [words],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cardLayouts, setCardLayouts] = useState<Record<string, CardLayout>>(
    {},
  );
  const layoutsRef = useRef<Record<string, CardLayout>>({});

  const isDark = useColorScheme() === "dark";

  // Collect layouts in a ref and flush to state once all cards have measured
  const handleCardLayout = useCallback(
    (wordId: string, event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      layoutsRef.current[wordId] = { y, height };

      if (Object.keys(layoutsRef.current).length >= sortedWords.length) {
        setCardLayouts({ ...layoutsRef.current });
      }
    },
    [sortedWords.length],
  );

  const containerHeight = useMemo(() => {
    const lastWord = sortedWords[sortedWords.length - 1];
    const last = lastWord && cardLayouts[lastWord.id];
    if (!last) return 0;
    return last.y + last.height;
  }, [cardLayouts, sortedWords]);

  const handleCardPress = useCallback((wordId: string) => {
    setSelectedId((prev) => (prev === wordId ? null : wordId));
  }, []);

  // Build arc data from modifier relationships
  const arcs = useMemo(() => {
    const result: {
      sourceId: string;
      targetId: string;
      color: string;
      rowSpan: number;
    }[] = [];
    let colorIndex = 0;

    const wordIndexMap = new Map(sortedWords.map((w, i) => [w.id, i]));

    for (const word of sortedWords) {
      if (!word.modifies || word.modifies.length === 0) continue;

      for (const targetId of word.modifies) {
        const sourceIdx = wordIndexMap.get(word.id);
        const targetIdx = wordIndexMap.get(targetId);
        if (sourceIdx === undefined || targetIdx === undefined) continue;

        const rowSpan = Math.abs(targetIdx - sourceIdx);
        result.push({
          sourceId: word.id,
          targetId,
          color: ARC_COLORS[colorIndex % ARC_COLORS.length],
          rowSpan,
        });
        colorIndex++;
      }
    }

    return result;
  }, [sortedWords]);

  // Which word IDs are connected to the selected word
  const connectedIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selectedId);
    for (const arc of arcs) {
      if (arc.sourceId === selectedId || arc.targetId === selectedId) {
        ids.add(arc.sourceId);
        ids.add(arc.targetId);
      }
    }
    return ids;
  }, [selectedId, arcs]);

  // Precompute arc geometry so we can render in separate z-order layers
  const renderedArcs = useMemo(() => {
    if (Object.keys(cardLayouts).length !== sortedWords.length) return [];

    return arcs
      .map((arc) => {
        const sourceLayout = cardLayouts[arc.sourceId];
        const targetLayout = cardLayouts[arc.targetId];
        if (!sourceLayout || !targetLayout) return null;

        const sourceY = sourceLayout.y + sourceLayout.height / 2;
        const targetY = targetLayout.y + targetLayout.height / 2;

        const bulge = ARC_BASE_OFFSET + arc.rowSpan * ARC_SCALE_FACTOR;
        const midY = (sourceY + targetY) / 2;

        // Determine opacity based on selection
        let opacity = 1;
        if (selectedId) {
          const isRelated =
            arc.sourceId === selectedId || arc.targetId === selectedId;
          opacity = isRelated ? 1 : 0.12;
        }

        const startX = 0;
        const pathD = `M ${startX},${sourceY} Q ${bulge},${midY} ${startX},${targetY}`;

        // get the direction from the control point to the endpoint
        const tanX = startX - bulge; // negative (arrives from right)
        const tanY = targetY - midY;
        // get an angle from that direction
        const angle = Math.atan2(tanY, tanX);

        const arrowLen = 10;
        const arrowHalfW = 5;

        // Get the point behind the tip of the arrow.
        // We multiply by the cos/sin of the angle since we need to keep the same
        // direction as the line.
        const baseX = startX - arrowLen * Math.cos(angle);
        const baseY = targetY - arrowLen * Math.sin(angle);
        // These get the offset to build left and right bottom points of the wing.
        // We move 90 Deg from the original angle to get the correct direction.
        const perpX = arrowHalfW * Math.cos(angle + Math.PI / 2);
        const perpY = arrowHalfW * Math.sin(angle + Math.PI / 2);

        const arrowD = `M ${startX},${targetY} L ${baseX + perpX},${baseY + perpY} L ${baseX - perpX},${baseY - perpY} Z`;
        const key = `${arc.sourceId}-${arc.targetId}`;

        return {
          key,
          sourceY,
          targetY,
          startX,
          pathD,
          arrowD,
          color: arc.color,
          opacity,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);
  }, [arcs, cardLayouts, sortedWords.length, selectedId]);

  const hasLayouts = Object.keys(cardLayouts).length === sortedWords.length;

  return (
    <View>
      <View>
        {/* Cards + arc overlay share the same coordinate space */}
        <View className="flex-row">
          {/* Left: word cards */}
          <View className="flex-1" style={{ marginRight: ARC_AREA_WIDTH }}>
            {sortedWords.map((word) => (
              <View
                key={word.id}
                onLayout={(e) => handleCardLayout(word.id, e)}
                style={{ marginBottom: CARD_GAP }}
              >
                <WordMapCard
                  word={word}
                  allWords={words}
                  isSelected={selectedId === word.id}
                  isConnected={connectedIds.has(word.id)}
                  isAnySelected={selectedId !== null}
                  onPress={handleCardPress}
                  isDark={isDark}
                />
              </View>
            ))}
          </View>

          {/* Right: SVG arc overlay */}
          {hasLayouts && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: ARC_AREA_WIDTH,
                height: containerHeight,
              }}
            >
              <Svg width={ARC_AREA_WIDTH} height={containerHeight}>
                {/* Layer 1 (bottom): source dots */}
                {renderedArcs.map((a) => (
                  <Circle
                    key={`dot-${a.key}`}
                    cx={a.startX}
                    cy={a.sourceY}
                    r={3}
                    fill={a.color}
                    opacity={a.opacity}
                  />
                ))}
                {/* Layer 2 (middle): arc curves */}
                {renderedArcs.map((a) => (
                  <Path
                    key={`arc-${a.key}`}
                    d={a.pathD}
                    stroke={a.color}
                    strokeWidth={2}
                    fill="none"
                    opacity={a.opacity}
                  />
                ))}
                {/* Layer 3 (top): arrowheads */}
                {renderedArcs.map((a) => (
                  <Path
                    key={`arrow-${a.key}`}
                    d={a.arrowD}
                    fill={a.color}
                    opacity={a.opacity}
                  />
                ))}
              </Svg>
            </View>
          )}
        </View>
      </View>

      {/* Legend */}
      <View
        className="mt-3 px-3 py-2 rounded-lg flex-row flex-wrap gap-x-4 gap-y-1 items-center"
        style={{ backgroundColor: isDark ? "#1a1d1e" : "#f3f4f6" }}
      >
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-sm bg-violet-600" />
          <ThemedText className="text-xs opacity-60">Topic</ThemedText>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-3 h-3 rounded-sm bg-orange-500" />
          <ThemedText className="text-xs opacity-60">Particle</ThemedText>
        </View>
        <View className="flex-row items-center gap-1">
          <View
            className="w-4 h-0.5 rounded"
            style={{ backgroundColor: ARC_COLORS[0] }}
          />
          <ThemedText className="text-xs opacity-60">Modifies</ThemedText>
        </View>
      </View>
    </View>
  );
}

// --- Word card used inside the dependency map ---

interface WordMapCardProps {
  word: WordNode;
  allWords: WordNode[];
  isSelected: boolean;
  isConnected: boolean;
  isAnySelected: boolean;
  onPress: (id: string) => void;
  isDark: boolean;
}

function WordMapCard({
  word,
  allWords,
  isSelected,
  isConnected,
  isAnySelected,
  onPress,
  isDark,
}: WordMapCardProps) {
  const isTopic = word.isTopic === true;

  // Determine border and background
  let borderClass = "border-border";
  let bgClass = "bg-card";

  if (isTopic) {
    borderClass = "border-topic-border";
    bgClass = "bg-topic-bg";
  }

  const dimmed = isAnySelected && !isConnected;
  const highlighted = isSelected || (isAnySelected && isConnected);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(word.id)}
      style={{ opacity: dimmed ? 0.4 : 1 }}
    >
      <View
        className={`px-4 py-3 rounded-xl border-2 ${bgClass} ${borderClass}`}
        style={
          highlighted
            ? {
                borderColor: isSelected
                  ? "#3b82f6"
                  : isDark
                    ? "#60a5fa"
                    : "#93c5fd",
              }
            : undefined
        }
      >
        <View className="flex-row items-center flex-wrap gap-x-2 gap-y-1">
          {/* Topic badge */}
          {isTopic && (
            <View className="bg-violet-600 px-1.5 py-0.5 rounded">
              <ThemedText className="text-white text-[10px] font-bold">
                TOPIC
              </ThemedText>
            </View>
          )}

          {/* Word text */}
          <ThemedText className="text-lg font-bold">{word.text}</ThemedText>

          {/* Attached particle */}
          {word.attachedParticle && (
            <View className="bg-orange-500 px-1.5 py-0.5 rounded">
              <ThemedText className="text-white text-sm font-bold">
                {word.attachedParticle.text}
              </ThemedText>
            </View>
          )}

          {/* Reading */}
          {word.reading && (
            <ThemedText className="text-sm opacity-50">
              {word.reading}
            </ThemedText>
          )}

          {/* Part of speech */}
          <ThemedText className="text-xs font-semibold text-blue-500">
            {word.partOfSpeech}
          </ThemedText>
        </View>

        {/* Modifies label */}
        {word.modifies && word.modifies.length > 0 && (
          <ThemedText className="text-xs opacity-50 mt-1">
            modifies{" "}
            {word.modifies
              .map((id) => allWords.find((w) => w.id === id)?.text || id)
              .join(", ")}
          </ThemedText>
        )}

        {/* Expanded particle description when selected */}
        {isSelected && word.attachedParticle && (
          <View
            className="mt-2 pt-2 border-t"
            style={{ borderTopColor: isDark ? "#374151" : "#e5e7eb" }}
          >
            <ThemedText className="font-semibold text-sm mb-1">
              Particle 「{word.attachedParticle.text}」
            </ThemedText>
            <ThemedText className="text-sm opacity-80 leading-5">
              {word.attachedParticle.description}
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
