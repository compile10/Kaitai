import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";

export type AIStage = "analysis" | "image.extract";
const tracer = trace.getTracer("kaitai");

/** Track model invocations without retaining prompts, images, or model output. */
export class AIMonitoringHandler extends BaseCallbackHandler {
  name = "kaitai-monitoring";
  private readonly spans = new Map<string, Span>();

  constructor(private readonly stage: AIStage) {
    super({ _awaitHandler: true });
  }

  handleChatModelStart(_model: unknown, _messages: unknown, runId: string) {
    this.spans.set(
      runId,
      tracer.startSpan(this.stage, { attributes: { operation: this.stage } }),
    );
  }

  handleLLMEnd(_output: unknown, runId: string) {
    const span = this.spans.get(runId);
    this.spans.delete(runId);
    span?.end();
  }

  handleLLMError(error: unknown, runId: string) {
    const span = this.spans.get(runId);
    this.spans.delete(runId);
    if (!span) return;
    try {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (
        error instanceof Error &&
        (error.name === "APIConnectionTimeoutError" ||
          error.name === "TimeoutError")
      ) {
        span.addEvent("ai.timeout", { stage: this.stage });
      }
      // The route's error handler owns exception reporting.
    } finally {
      span.end();
    }
  }
}
