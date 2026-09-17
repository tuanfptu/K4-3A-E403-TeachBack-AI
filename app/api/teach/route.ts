import { NextResponse } from "next/server";
import { getLesson, type Question } from "@/lib/lesson-data";
import { getDynamicGroundingContext } from "@/lib/transcript-retriever";
import { searchWebKnowledge } from "@/lib/web-search-tool";
import {
  buildAnswerEvaluationPrompt,
  type AnswerEvaluationResponse,
  type ChatMessage,
} from "@/lib/feynman-prompt";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

interface TeachRequestBody {
  user_message?: string;
  chat_history?: ChatMessage[];
  custom_model?: string;
  is_hint_requested?: boolean;
  lesson_id?: number;
  question_id?: number;
  mastered_point_ids?: string[];
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body: TeachRequestBody = await request.json();
    const userMessage = (body.user_message || "").trim();
    const isHintRequested = Boolean(body.is_hint_requested);
    const lessonId = Number(body.lesson_id);
    const questionId = Number(body.question_id);
    const lesson = [1, 2].includes(lessonId) ? getLesson(lessonId) : null;
    const question = lesson?.questions.find((item) => item.id === questionId);

    if (!lesson || !question) {
      return NextResponse.json(
        { error: "Không tìm thấy câu hỏi cố định trong Day 1/Day 2." },
        { status: 400 }
      );
    }

    if (!userMessage && !isHintRequested) {
      return NextResponse.json(
        { error: "Câu trả lời không được để trống." },
        { status: 400 }
      );
    }

    const allowedPointIds = new Set(question.requiredPoints.map((point) => point.id));
    const alreadyMasteredPointIds = uniqueAllowedIds(
      body.mastered_point_ids,
      allowedPointIds
    );
    const citation = question.source.range;

    if (isHintRequested) {
      return NextResponse.json(
        buildHintResponse(question, alreadyMasteredPointIds, startTime)
      );
    }

    const dynamicGrounding = getDynamicGroundingContext(question.concept);
    let supplementalGrounding = dynamicGrounding.chunks
      .slice(0, 2)
      .map((chunk) => chunk.content)
      .join("\n\n")
      .slice(0, 5000);

    let activeCitation = citation;

    // Fallback sang Web Search Tool nếu RAG nội bộ không có chunk tài liệu nào
    if (dynamicGrounding.chunks.length === 0) {
      console.log(
        `[Grounding Fallback] RAG không tìm thấy cho "${question.concept}", kích hoạt Web Search...`
      );
      const webResult = await searchWebKnowledge(
        `${question.concept} machine learning AI`,
        { maxResults: 2 }
      );
      if (webResult.found) {
        supplementalGrounding = `[TÀI LIỆU TRA CỨU WEB (${webResult.source})]:\n${webResult.summary}`;
        activeCitation = `${citation} + Web (${webResult.source})`;
      }
    }

    const systemPrompt = buildAnswerEvaluationPrompt({
      lessonTitle: lesson.title,
      question: question.prompt,
      referenceAnswer: question.referenceAnswer,
      requiredPoints: question.requiredPoints,
      alreadyMasteredPointIds,
      citation: activeCitation,
      supplementalGrounding,
    });

    const chatHistory = Array.isArray(body.chat_history)
      ? body.chat_history
          .filter(
            (message): message is ChatMessage =>
              Boolean(message) &&
              ["user", "assistant"].includes(message.role) &&
              typeof message.content === "string"
          )
          .slice(-6)
      : [];

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      {
        role: "user",
        content: `Câu trả lời mới cần chấm:\n${userMessage}`,
      },
    ];

    const apiKey = process.env.OPENROUTER_API_KEY;
    const primaryModel =
      body.custom_model ||
      process.env.OPENROUTER_MODEL ||
      "google/gemini-2.5-flash";
    const fallbackModel =
      process.env.OPENROUTER_FALLBACK_MODEL || "openai/gpt-4o-mini";

    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      return NextResponse.json(
        buildConfigurationResponse(
          question,
          alreadyMasteredPointIds,
          startTime
        )
      );
    }

    let rawResultText = "";
    let modelUsed = primaryModel;
    let usageData: unknown = null;

    try {
      const response = await callOpenRouter({
        apiKey,
        model: primaryModel,
        messages,
      });
      rawResultText = response.text;
      usageData = response.usage;
    } catch (primaryError) {
      console.warn(`[TeachBack AI] Fallback to ${fallbackModel}:`, primaryError);
      modelUsed = fallbackModel;
      const fallbackResponse = await callOpenRouter({
        apiKey,
        model: fallbackModel,
        messages,
      });
      rawResultText = fallbackResponse.text;
      usageData = fallbackResponse.usage;
    }

    const parsed = parseModelResponse(rawResultText, citation);
    const normalized = normalizeEvaluation({
      parsed,
      question,
      alreadyMasteredPointIds,
      allowedPointIds,
    });

    return NextResponse.json({
      ...normalized,
      meta: {
        latency_ms: Date.now() - startTime,
        model_used: modelUsed,
        citation,
        usage: usageData,
        retrieved_chunks: dynamicGrounding.chunks.map((chunk) => ({
          chunk_id: chunk.chunkId,
          section: chunk.sectionTitle,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("[TeachBack AI API Error]:", error);
    const detail = error instanceof Error ? error.message : "Server Error";
    const status = /OpenRouter HTTP 402|credits/i.test(detail) ? 402 : 500;
    return NextResponse.json(
      {
        error:
          status === 402
            ? "OpenRouter đã hết credits hoặc vượt hạn mức."
            : "Không thể chấm câu trả lời lúc này.",
        detail,
      },
      { status }
    );
  }
}

function buildHintResponse(
  question: Question,
  alreadyMasteredPointIds: string[],
  startTime: number
): AnswerEvaluationResponse & { meta: Record<string, unknown> } {
  const masteredSet = new Set(alreadyMasteredPointIds);
  const missingPoints = question.requiredPoints.filter(
    (point) => !masteredSet.has(point.id)
  );
  const nextPoint = missingPoints[0];
  const questionMastered = missingPoints.length === 0;
  const hint = nextPoint?.hint || null;

  return {
    bot_response: questionMastered
      ? "Bạn đã làm rõ đầy đủ các ý của câu hỏi này."
      : `Gợi ý cho phần còn thiếu: ${hint}`,
    response_mode: questionMastered ? "mastered" : "partial",
    understanding_level: questionMastered ? 3 : alreadyMasteredPointIds.length > 0 ? 2 : 1,
    question_mastered: questionMastered,
    mastered_point_ids: alreadyMasteredPointIds,
    missing_point_ids: missingPoints.map((point) => point.id),
    evaluation: {
      correct_points: [],
      incorrect_claims: [],
      newly_mastered_point_ids: [],
      invalidated_point_ids: [],
    },
    feedback_summary: {
      what_you_did_well: "",
      missing_or_vague: nextPoint ? nextPoint.title : "",
    },
    hint,
    citation: question.source.range,
    meta: {
      latency_ms: Date.now() - startTime,
      model_used: "targeted_hint",
      citation: question.source.range,
    },
  };
}

function buildConfigurationResponse(
  question: Question,
  masteredPointIds: string[],
  startTime: number
): AnswerEvaluationResponse & { is_mock: true; meta: Record<string, unknown> } {
  return {
    bot_response:
      "Chưa thể chấm câu trả lời vì OPENROUTER_API_KEY chưa được cấu hình trong .env.local.",
    response_mode: "needs_revision",
    understanding_level: masteredPointIds.length > 0 ? 2 : 1,
    question_mastered: false,
    mastered_point_ids: masteredPointIds,
    missing_point_ids: question.requiredPoints
      .filter((point) => !masteredPointIds.includes(point.id))
      .map((point) => point.id),
    evaluation: {
      correct_points: [],
      incorrect_claims: [],
      newly_mastered_point_ids: [],
      invalidated_point_ids: [],
    },
    feedback_summary: {
      what_you_did_well: "",
      missing_or_vague: "Cần cấu hình API key để bật chấm ngữ nghĩa.",
    },
    hint: null,
    citation: question.source.range,
    is_mock: true,
    meta: {
      latency_ms: Date.now() - startTime,
      model_used: "configuration_guard",
      citation: question.source.range,
    },
  };
}

function parseModelResponse(
  rawResultText: string,
  citation: string
): Partial<AnswerEvaluationResponse> {
  const cleaned = rawResultText
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as Partial<AnswerEvaluationResponse>;
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Partial<AnswerEvaluationResponse>;
    }

    return {
      bot_response:
        "Mình chưa đọc được kết quả chấm. Bạn hãy gửi lại câu trả lời ngắn gọn hơn.",
      response_mode: "needs_revision",
      understanding_level: 1,
      question_mastered: false,
      citation,
    };
  }
}

function normalizeEvaluation({
  parsed,
  question,
  alreadyMasteredPointIds,
  allowedPointIds,
}: {
  parsed: Partial<AnswerEvaluationResponse>;
  question: Question;
  alreadyMasteredPointIds: string[];
  allowedPointIds: Set<string>;
}): AnswerEvaluationResponse {
  const evaluation = parsed.evaluation;
  const newlyMasteredPointIds = uniqueAllowedIds(
    evaluation?.newly_mastered_point_ids,
    allowedPointIds
  );
  const invalidatedPointIds = uniqueAllowedIds(
    evaluation?.invalidated_point_ids,
    allowedPointIds
  );
  const invalidatedSet = new Set(invalidatedPointIds);
  const masteredPointIds = Array.from(
    new Set([...alreadyMasteredPointIds, ...newlyMasteredPointIds])
  ).filter((id) => !invalidatedSet.has(id));
  const masteredSet = new Set(masteredPointIds);
  const missingPointIds = question.requiredPoints
    .filter((point) => !masteredSet.has(point.id))
    .map((point) => point.id);

  const correctPoints = Array.isArray(evaluation?.correct_points)
    ? evaluation.correct_points.filter(
        (point) => point && allowedPointIds.has(point.id)
      )
    : [];
  const incorrectClaims = Array.isArray(evaluation?.incorrect_claims)
    ? evaluation.incorrect_claims.filter(
        (item) =>
          item &&
          typeof item.claim === "string" &&
          typeof item.correction === "string"
      )
    : [];
  const questionMastered =
    missingPointIds.length === 0 && incorrectClaims.length === 0;
  const nextMissingPoint = question.requiredPoints.find(
    (point) => !masteredSet.has(point.id)
  );
  const responseMode: AnswerEvaluationResponse["response_mode"] = questionMastered
    ? "mastered"
    : incorrectClaims.length > 0 || newlyMasteredPointIds.length === 0
      ? "needs_revision"
      : "partial";
  const understandingLevel: 1 | 2 | 3 = questionMastered
    ? 3
    : masteredPointIds.length > 0
      ? 2
      : 1;

  return {
    bot_response: questionMastered
      ? question.success
      : buildLearnerFeedback({
          correctPoints,
          incorrectClaims,
          nextHint: parsed.hint || nextMissingPoint?.hint || null,
          fallback: cleanBotResponse(parsed.bot_response),
        }),
    response_mode: responseMode,
    understanding_level: understandingLevel,
    question_mastered: questionMastered,
    mastered_point_ids: masteredPointIds,
    missing_point_ids: missingPointIds,
    evaluation: {
      correct_points: correctPoints,
      incorrect_claims: incorrectClaims,
      newly_mastered_point_ids: newlyMasteredPointIds,
      invalidated_point_ids: invalidatedPointIds,
    },
    feedback_summary: {
      what_you_did_well:
        parsed.feedback_summary?.what_you_did_well || "",
      missing_or_vague:
        parsed.feedback_summary?.missing_or_vague ||
        nextMissingPoint?.title ||
        "",
    },
    hint: questionMastered
      ? null
      : parsed.hint || nextMissingPoint?.hint || null,
    citation: question.source.range,
  };
}

function buildLearnerFeedback({
  correctPoints,
  incorrectClaims,
  nextHint,
  fallback,
}: {
  correctPoints: AnswerEvaluationResponse["evaluation"]["correct_points"];
  incorrectClaims: AnswerEvaluationResponse["evaluation"]["incorrect_claims"];
  nextHint: string | null;
  fallback: string;
}): string {
  const parts: string[] = [];

  if (correctPoints.length > 0) {
    parts.push(
      `Phần bạn đã hiểu đúng: ${correctPoints
        .map((point) => point.feedback.replace(/[.!?]+$/, ""))
        .join("; ")}.`
    );
  }

  if (incorrectClaims.length > 0) {
    parts.push(
      `Phần chưa đúng: ${incorrectClaims
        .map(
          (item) =>
            `“${item.claim.replace(/[.!?]+$/, "")}” — ${item.correction}`
        )
        .join(" ")}`
    );
  }

  if (nextHint) {
    parts.push(
      `Bạn không cần trả lời lại ý đã đúng. Gợi ý cho phần còn thiếu: ${nextHint}`
    );
  }

  return parts.join("\n\n") || fallback;
}

function uniqueAllowedIds(
  values: unknown,
  allowedPointIds: Set<string>
): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          typeof value === "string" && allowedPointIds.has(value)
      )
    )
  );
}

function cleanBotResponse(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "Câu trả lời chưa làm rõ đủ ý. Hãy thử bổ sung theo gợi ý bên dưới.";
  }

  if (value.trim().startsWith("{")) {
    return "Câu trả lời chưa làm rõ đủ ý. Hãy thử bổ sung theo gợi ý bên dưới.";
  }

  return value.trim();
}

async function callOpenRouter({
  apiKey,
  model,
  messages,
}: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
}): Promise<{ text: string; usage: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "TeachBack AI",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: unknown;
    };
    return {
      text: data.choices?.[0]?.message?.content || "",
      usage: data.usage,
    };
  } finally {
    clearTimeout(timeout);
  }
}
