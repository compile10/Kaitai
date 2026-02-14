"use client";

import {
  Background,
  Controls,
  type Edge,
  type EdgeProps,
  Handle,
  MarkerType,
  type Node,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import type { SentenceAnalysis, WordNode } from "@common/types";
import "@xyflow/react/dist/style.css";
import ParticleModal from "./ParticleModal";

interface SentenceVisualizationProps {
  analysis: SentenceAnalysis;
}

interface WordNodeData extends Record<string, unknown> {
  word: WordNode;
  onParticleClick: (particle: string, description: string) => void;
}

// Custom node component for word boxes
function WordNodeComponent({ data }: { data: WordNodeData }) {
  const { word, onParticleClick } = data;

  return (
    <div className="relative flex items-start gap-0">
      {/* Handles for connecting edges */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        style={{ opacity: 0, left: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        style={{ opacity: 0, right: 0 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        style={{ opacity: 0, top: 0 }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        style={{ opacity: 0, top: 0 }}
      />

      {/* Main word box */}
      <div
        className={`border-2 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow ${
          word.isTopic
            ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        }`}
        style={{ minWidth: "120px", maxWidth: "150px" }}
      >
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 text-center">
          {word.text}
        </div>
        {word.reading && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
            {word.reading}
          </div>
        )}
        <div className="text-xs text-tint dark:text-tintDark font-medium text-center">
          {word.partOfSpeech}
        </div>
      </div>

      {/* Attached particle (if any) */}
      {word.attachedParticle && (
        <button
          type="button"
          onClick={() =>
            onParticleClick(
              word.attachedParticle!.text,
              word.attachedParticle!.description,
            )
          }
          className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 border-2 border-orange-600 dark:border-orange-700 rounded-md px-2 py-1 shadow-md hover:shadow-lg -ml-2 mt-1 transition-all cursor-pointer transform hover:scale-110"
          style={{
            maxWidth: "60px",
            fontSize: "0.75rem",
            transform: "translateY(10px)",
          }}
          title="Click to learn about this particle"
        >
          <div className="text-sm font-bold text-white text-center">
            {word.attachedParticle.text}
          </div>
          {word.attachedParticle.reading &&
            word.attachedParticle.reading !== word.attachedParticle.text && (
              <div className="text-xs text-orange-100 text-center">
                {word.attachedParticle.reading}
              </div>
            )}
        </button>
      )}
    </div>
  );
}

// Custom edge component with intelligent routing
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const nodeCount = (data as any)?.nodesBetween || 0;

  let edgePath: string;

  // If nodes are adjacent (no intermediate nodes), use nearly straight line
  if (nodeCount === 0) {
    // Straight horizontal line for adjacent nodes
    edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  } else {
    // Nodes have intermediates - use arc from top to top
    const distance = Math.abs(targetX - sourceX);
    const arcHeight = Math.max(100, Math.min(150, distance * 0.3));

    // Control points for a smooth high arc
    const controlPoint1X = sourceX + distance * 0.3;
    const controlPoint1Y = sourceY - arcHeight;
    const controlPoint2X = targetX - distance * 0.3;
    const controlPoint2Y = sourceY - arcHeight;

    edgePath = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;
  }

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke="#3b82f6"
        fill="none"
        markerEnd={markerEnd}
      />
    </>
  );
}

const nodeTypes = {
  wordNode: WordNodeComponent,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Grammar Point expandable item component
function GrammarPointItem({
  grammarPoint,
}: {
  grammarPoint: { title: string; explanation: string };
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setIsExpanded(!isExpanded)}
      className="w-full text-left p-3 bg-gray-50 dark:bg-gray-900 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {grammarPoint.title}
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {isExpanded && (
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {grammarPoint.explanation}
        </p>
      )}
    </button>
  );
}

export default function SentenceVisualization({
  analysis,
}: SentenceVisualizationProps) {
  const [selectedParticle, setSelectedParticle] = useState<string | null>(null);
  const [particleDescription, setParticleDescription] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleParticleClick = useCallback(
    (particle: string, description: string) => {
      setSelectedParticle(particle);
      setParticleDescription(description);
      setIsModalOpen(true);
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedParticle(null);
    setParticleDescription(null);
  }, []);

  const topicWords = analysis.words.filter((word) => word.isTopic);
  const mainSentenceWords = analysis.words.filter((word) => !word.isTopic);

  // Create nodes and edges for React Flow
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node<WordNodeData>[] = [];
    const edges: Edge[] = [];

    // Create nodes for main sentence words
    const sortedWords = [...mainSentenceWords].sort(
      (a, b) => a.position - b.position,
    );
    const spacing = 220; // Horizontal spacing between nodes
    const startX = -((sortedWords.length - 1) * spacing) / 2; // Center the nodes

    for (let i = 0; i < sortedWords.length; i++) {
      const word = sortedWords[i];
      nodes.push({
        id: word.id,
        type: "wordNode",
        position: { x: startX + i * spacing, y: 100 },
        data: { word, onParticleClick: handleParticleClick },
        width: 130,
        height: 80,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }

    // Create edges for modifications
    for (const word of sortedWords) {
      if (word.modifies && word.modifies.length > 0) {
        for (const targetId of word.modifies) {
          // Calculate how many nodes are between source and target
          const sourceIndex = sortedWords.findIndex((w) => w.id === word.id);
          const targetIndex = sortedWords.findIndex((w) => w.id === targetId);
          const nodesBetween = Math.abs(targetIndex - sourceIndex) - 1;

          // Use top handles for arcing arrows, side handles for straight arrows
          const useTopHandles = nodesBetween > 0;

          edges.push({
            id: `${word.id}-${targetId}`,
            source: word.id,
            target: targetId,
            sourceHandle: useTopHandles ? "source-top" : "source-right",
            targetHandle: useTopHandles ? "target-top" : "target-left",
            type: "custom",
            animated: false,
            data: { nodesBetween },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: "#3b82f6",
              strokeWidth: 2,
            },
          });
        }
      }
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [mainSentenceWords, handleParticleClick]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const renderTopicWord = (word: WordNode) => (
    <div key={word.id} className="relative flex items-start gap-0">
      {/* Main word box */}
      <div
        className={`border-2 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow ${
          word.isTopic
            ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        }`}
        style={{ maxWidth: "150px" }}
      >
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 text-center">
          {word.text}
        </div>
        {word.reading && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
            {word.reading}
          </div>
        )}
        <div className="text-xs text-tint dark:text-tintDark font-medium text-center">
          {word.partOfSpeech}
        </div>
      </div>

      {/* Attached particle (if any) */}
      {word.attachedParticle && (
        <button
          type="button"
          onClick={() =>
            handleParticleClick(
              word.attachedParticle!.text,
              word.attachedParticle!.description,
            )
          }
          className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 border-2 border-orange-600 dark:border-orange-700 rounded-md px-2 py-1 shadow-md hover:shadow-lg -ml-2 mt-1 transition-all cursor-pointer transform hover:scale-110"
          style={{
            maxWidth: "60px",
            fontSize: "0.75rem",
            transform: "translateY(10px)",
          }}
          title="Click to learn about this particle"
        >
          <div className="text-sm font-bold text-white text-center">
            {word.attachedParticle.text}
          </div>
          {word.attachedParticle.reading &&
            word.attachedParticle.reading !== word.attachedParticle.text && (
              <div className="text-xs text-orange-100 text-center">
                {word.attachedParticle.reading}
              </div>
            )}
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Direct Translation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Direct Translation
        </h3>
        <p className="text-gray-700 dark:text-gray-300 text-lg italic">
          {analysis.directTranslation}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Sentence Structure
        </h3>

        {/* Fragment Warning */}
        {analysis.isFragment && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                Sentence Fragment
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1 ml-7">
              This appears to be an incomplete sentence or fragment. It may be
              missing key components like a verb or not express a complete
              thought.
            </p>
          </div>
        )}

        {/* Topic Section */}
        {topicWords.length > 0 && (
          <div className="mb-6 pb-4 border-b-2 border-dashed border-purple-300 dark:border-purple-700">
            <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
              Topic (Context)
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {topicWords
                .sort((a, b) => a.position - b.position)
                .map(renderTopicWord)}
            </div>
          </div>
        )}

        {/* React Flow Visualization */}
        <div className="relative h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
          >
            <Background color="#9ca3af" gap={16} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Purple boxes:</strong> Topic - provides context but doesn't
            modify the sentence
          </p>
          <p className="mt-1">
            <strong>Arrows:</strong> Show which words modify or relate to other
            words
          </p>
          <p className="mt-1">
            <strong>Orange boxes:</strong> Particles (は, を, に, etc.) -{" "}
            <span className="text-orange-600 dark:text-orange-400 font-semibold">
              Click to learn what they do!
            </span>
          </p>
          <p className="mt-1">
            <strong>Tip:</strong> You can drag nodes to rearrange them, zoom
            with the mouse wheel, and pan by dragging the background.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Explanation
        </h3>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: analysis.explanation }}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Grammar Points
        </h3>
        <div className="space-y-2">
          {analysis.grammarPoints.map((point, index) => (
            <GrammarPointItem
              key={`${point.title}-${index}`}
              grammarPoint={point}
            />
          ))}
        </div>
      </div>

      {/* Particle Description Modal */}
      <ParticleModal
        particle={selectedParticle}
        description={particleDescription}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
