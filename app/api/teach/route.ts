import { NextResponse } from "next/server";
import { getLesson, type Question } from "@/lib/lesson-data";
import { getDynamicGroundingContext } from "@/lib/transcript-retriever";
import {
  searchWebKnowledge,
  type WebSearchResultItem,
} from "@/lib/web-search-tool";
import {
  buildAnswerEvaluationPrompt,
  type AnswerEvaluationResponse,
  type ChatMessage,
} from "@/lib/feynman-prompt";
import {
  findDeterministicMisconception,
  getValidatedModelMasteryIds,
  isLearnerAnswerRelevant,
  preventUnconfirmedFullScore,
  shouldMarkQuestionMastered,
} from "@/lib/mastery-guard";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

type ToolPlan = {
  use_learner_memory: boolean;
  use_course_rag: boolean;
  use_web_search: boolean;
  reason: string;
  planned_by: "llm" | "safe_fallback";
};

type ToolObservations = {
  learner_memory_points: number;
  course_chunks: number;
  course_evidence_source: "transcript" | "lesson_reference";
  verified_research_sources: number;
};

const toolPlanCache = new Map<string, ToolPlan>();

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

    const socialReply = !isHintRequested
      ? buildSocialConversationReply(userMessage, question.prompt)
      : null;
    if (socialReply) {
      return NextResponse.json({
        bot_response: socialReply,
        question_mastered: false,
        mastered_point_ids: alreadyMasteredPointIds,
        missing_point_ids: question.requiredPoints
          .filter((point) => !alreadyMasteredPointIds.includes(point.id))
          .map((point) => point.id),
        hint: null,
        meta: {
          latency_ms: Date.now() - startTime,
          model_used: "conversation_router",
          interaction_type: "social",
          research_sources: [],
        },
      });
    }

    const redirectReply = !isHintRequested
      ? buildOutOfScopeReply(userMessage, lesson.id, lesson.title, question)
      : null;
    if (redirectReply) {
      return NextResponse.json({
        bot_response: redirectReply,
        question_mastered: false,
        mastered_point_ids: alreadyMasteredPointIds,
        missing_point_ids: question.requiredPoints
          .filter((point) => !alreadyMasteredPointIds.includes(point.id))
          .map((point) => point.id),
        hint: null,
        meta: {
          latency_ms: Date.now() - startTime,
          model_used: "lesson_scope_router",
          interaction_type: "redirect",
          research_sources: [],
        },
      });
    }

    const citation = question.source.range;
    const apiKey = process.env.OPENROUTER_API_KEY;
    const primaryModel =
      body.custom_model ||
      process.env.OPENROUTER_MODEL ||
      "google/gemini-2.5-flash";
    const fallbackModel =
      process.env.OPENROUTER_FALLBACK_MODEL || "openai/gpt-4o-mini";

    const dynamicGrounding = getDynamicGroundingContext(question.concept);
    let supplementalGrounding = dynamicGrounding.chunks
      .slice(0, 2)
      .map((chunk) => chunk.content)
      .join("\n\n")
      .slice(0, 5000);
    const courseEvidenceAvailable =
      dynamicGrounding.chunks.length > 0 || Boolean(question.referenceAnswer.trim());
    if (!supplementalGrounding) {
      supplementalGrounding = `[COURSE EVIDENCE · ${question.source.range}]\n${question.referenceAnswer}`;
    }

    let activeCitation = citation;
    let researchSources: WebSearchResultItem[] = [];
    const explicitlyRequestsResearch = /(paper|nghiên cứu|nguồn ngoài|tài liệu thêm|tìm hiểu sâu)/i.test(userMessage);
    const toolPlan = await createToolPlan({
      apiKey,
      model: primaryModel,
      lessonId,
      questionId,
      concept: question.concept,
      courseEvidenceAvailable,
      explicitlyRequestsResearch,
    });
    if (!toolPlan.use_course_rag) supplementalGrounding = "";

    if (toolPlan.use_web_search) {
      console.log(
        `[Grounding Fallback] RAG không tìm thấy cho "${question.concept}", kích hoạt Web Search...`
      );
      const webResult = await searchWebKnowledge(
        `${question.concept} machine learning AI`,
        { maxResults: 5 }
      );
      if (webResult.found) {
        researchSources = webResult.items;
        supplementalGrounding = `[NGUỒN NGHIÊN CỨU ĐÃ KIỂM CHỨNG (${webResult.source})]:\n${webResult.summary}`;
        const venues = [...new Set(researchSources.map((source) => source.venue))];
        activeCitation = `${citation} + ${venues.join(", ")}`;
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
          .slice(-12)
      : [];

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      {
        role: "user",
        content: isHintRequested
          ? `NGƯỜI HỌC XIN GỢI Ý. Dựa vào toàn bộ lịch sử, các tiêu chí đã nắm và tiêu chí còn thiếu, hãy tạo một gợi ý mới đúng chỗ họ đang vướng. Không lặp câu gợi ý trước, không đưa đáp án hoàn chỉnh và không công nhận thêm tiêu chí. Chỉ dẫn dắt bằng một ví dụ nhỏ hoặc một câu hỏi dễ hơn.`
          : `Câu trả lời mới cần xử lý:\n${userMessage}${
          isLearnerSupportUtterance(userMessage)
            ? "\n\nLƯU Ý SƯ PHẠM: Đây là tín hiệu người học chưa hiểu hoặc chưa chắc, không phải evidence để công nhận thêm ý mới. Hãy giải thích lại bằng một ví dụ ngắn, rồi hỏi một câu kiểm tra dễ hơn."
            : ""
        }`,
      },
    ];

    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      const localResponse = isHintRequested
        ? buildHintResponse(question, alreadyMasteredPointIds, chatHistory, startTime)
        : buildLocalFallbackResponse(
            question,
            userMessage,
            alreadyMasteredPointIds,
            allowedPointIds,
            startTime
          );
      return NextResponse.json(
        withResearchSources(localResponse, activeCitation, researchSources, toolPlan, dynamicGrounding.chunks.length, alreadyMasteredPointIds.length)
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
      try {
        const fallbackResponse = await callOpenRouter({
          apiKey,
          model: fallbackModel,
          messages,
        });
        rawResultText = fallbackResponse.text;
        usageData = fallbackResponse.usage;
      } catch (fallbackError) {
        console.error(
          "[TeachBack AI] Remote models unavailable; using local lesson rubric:",
          fallbackError
        );
        const localResponse = isHintRequested
          ? buildHintResponse(question, alreadyMasteredPointIds, chatHistory, startTime)
          : buildLocalFallbackResponse(
              question,
              userMessage,
              alreadyMasteredPointIds,
              allowedPointIds,
              startTime
            );
        return NextResponse.json(
          withResearchSources(localResponse, activeCitation, researchSources, toolPlan, dynamicGrounding.chunks.length, alreadyMasteredPointIds.length)
        );
      }
    }

    const parsed = parseModelResponse(rawResultText, activeCitation);
    const normalized = isHintRequested
      ? normalizeHintEvaluation(parsed, question, alreadyMasteredPointIds)
      : normalizeEvaluation({
          parsed,
          question,
          learnerMessage: userMessage,
          alreadyMasteredPointIds,
          allowedPointIds,
        });

    const observations = buildToolObservations(
      alreadyMasteredPointIds.length,
      dynamicGrounding.chunks.length,
      researchSources.length
    );

    return NextResponse.json({
      ...normalized,
      meta: {
        latency_ms: Date.now() - startTime,
        model_used: modelUsed,
        citation: activeCitation,
        usage: usageData,
        research_sources: researchSources,
        tool_plan: toolPlan,
        tool_observations: observations,
        agent_loop: buildAgentLoop(toolPlan, observations),
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

function buildSocialConversationReply(
  learnerMessage: string,
  currentQuestion: string
): string | null {
  const clean = learnerMessage.trim().toLocaleLowerCase("vi");
  if (/^(hi|hello|hey|alo|chào|xin chào)(?:\s+(bạn|thầy|cô|em|anh|chị|mọi người|nhé|nha|ạ))*[!.?\s]*$/i.test(clean)) {
    return `Xin chào bạn 😄 Mình ở đây để học cùng bạn. Khi sẵn sàng, bạn thử trả lời câu “${currentQuestion}” theo cách hiểu của mình nhé.`;
  }
  if (/^(cảm ơn|cám ơn|thanks|thank you)(?:\s+(bạn|thầy|cô|em|anh|chị|nhé|nha|ạ))*[!.?\s]*$/i.test(clean)) {
    return "Không có gì nhé! Mình sẽ tiếp tục đồng hành và chỉ gợi mở đúng phần bạn còn thiếu. Bạn muốn thử trả lời câu hiện tại chứ?";
  }
  if (/^(tạm biệt|bye|goodbye|hẹn gặp lại)(?:\s+(bạn|thầy|cô|em|anh|chị|nhé|nha|ạ))*[!.?\s]*$/i.test(clean)) {
    return "Tạm biệt bạn nhé! Khi quay lại, mình sẽ tiếp tục từ đúng phần bạn đang học.";
  }
  return null;
}

function buildOutOfScopeReply(
  learnerMessage: string,
  lessonId: number,
  lessonTitle: string,
  question: Question
): string | null {
  const clean = learnerMessage.trim().toLocaleLowerCase("vi");
  const clearlyUnrelated = /(thời tiết|bóng đá|chứng khoán|bitcoin|tiền ảo|du lịch|nấu ăn|món ăn|phim|âm nhạc|ca sĩ|chính trị|tình yêu|game|viết code game|kể chuyện cười)/i.test(clean);
  const dayOneTerms = /(llm|token|context|ngữ cảnh|attention|transformer|hallucination|ảo giác|rag|grounding|temperature|mô hình ngôn ngữ)/i;
  const dayTwoTerms = /(google pair|problem statement|bài toán|rule|workflow|agent|human.?in.?the.?loop|hitl|precision|recall|false positive|false negative|tự động hoá)/i;
  const belongsToAnotherLesson = lessonId === 1
    ? dayTwoTerms.test(clean) && !dayOneTerms.test(clean)
    : dayOneTerms.test(clean) && !dayTwoTerms.test(clean);
  const looksLikeQuestion = /\?|^(tại sao|vì sao|cái gì|.*là gì|như thế nào|làm sao|giải thích|cho hỏi|bạn biết)/i.test(clean);
  const currentLessonTerms = lessonId === 1 ? dayOneTerms : dayTwoTerms;
  const unknownQuestion = looksLikeQuestion && clean.length > 12 && !currentLessonTerms.test(clean);

  if (!clearlyUnrelated && !belongsToAnotherLesson && !unknownQuestion) return null;

  return `Nội dung đó nằm ngoài bài “${lessonTitle}”, nên mình chưa đi sang chủ đề ấy nhé. Mình đưa bạn về phần đang học: ${question.concept}. Với câu “${question.prompt}”, bạn thử nói một ý ngắn mà bạn đang hiểu được không?`;
}

function withResearchSources<T extends { meta: Record<string, unknown> }>(
  response: T,
  citation: string,
  researchSources: WebSearchResultItem[],
  toolPlan: ToolPlan,
  courseChunkCount: number,
  learnerMemoryPoints: number
): T {
  const observations = buildToolObservations(learnerMemoryPoints, courseChunkCount, researchSources.length);
  return {
    ...response,
    meta: {
      ...response.meta,
      citation,
      research_sources: researchSources,
      tool_plan: toolPlan,
      tool_observations: observations,
      agent_loop: buildAgentLoop(toolPlan, observations),
    },
  };
}

function buildToolObservations(
  learnerMemoryPoints: number,
  courseChunkCount: number,
  researchSourceCount: number
): ToolObservations {
  return {
    learner_memory_points: learnerMemoryPoints,
    course_chunks: courseChunkCount,
    course_evidence_source: courseChunkCount > 0 ? "transcript" : "lesson_reference",
    verified_research_sources: researchSourceCount,
  };
}

function buildAgentLoop(plan: ToolPlan, observations: ToolObservations) {
  const calledTools = [
    plan.use_learner_memory ? "learner_memory" : null,
    plan.use_course_rag ? "course_rag" : null,
    plan.use_web_search ? "trusted_web_search" : null,
  ].filter((tool): tool is string => Boolean(tool));

  return [
    { stage: "plan", status: "completed", decision: plan.reason },
    { stage: "tool", status: "completed", tools: calledTools },
    { stage: "observe", status: "completed", observations },
    { stage: "continue", status: "completed", action: "evaluate_and_respond" },
  ];
}

async function createToolPlan({
  apiKey,
  model,
  lessonId,
  questionId,
  concept,
  courseEvidenceAvailable,
  explicitlyRequestsResearch,
}: {
  apiKey: string | undefined;
  model: string;
  lessonId: number;
  questionId: number;
  concept: string;
  courseEvidenceAvailable: boolean;
  explicitlyRequestsResearch: boolean;
}): Promise<ToolPlan> {
  const cacheKey = `${lessonId}:${questionId}:${courseEvidenceAvailable}:${explicitlyRequestsResearch}`;
  const cached = toolPlanCache.get(cacheKey);
  if (cached) return cached;

  const safeFallback: ToolPlan = {
    use_learner_memory: true,
    use_course_rag: courseEvidenceAvailable,
    use_web_search: !courseEvidenceAvailable || explicitlyRequestsResearch,
    reason: courseEvidenceAvailable && !explicitlyRequestsResearch
      ? "Course evidence đủ cho câu hỏi hiện tại."
      : "Cần nguồn nghiên cứu bổ sung đã kiểm chứng.",
    planned_by: "safe_fallback",
  };

  if (!apiKey || apiKey === "your_openrouter_api_key_here") {
    toolPlanCache.set(cacheKey, safeFallback);
    return safeFallback;
  }

  try {
    const result = await callOpenRouter({
      apiKey,
      model,
      messages: [
        {
          role: "system",
          content: "Bạn là planner của TeachBack AI. Chỉ chọn tool cần thiết, ưu tiên dữ liệu khóa học; chỉ dùng web khi course evidence thiếu hoặc người học xin paper. Trả đúng JSON, không markdown.",
        },
        {
          role: "user",
          content: JSON.stringify({
            concept,
            course_evidence_available: courseEvidenceAvailable,
            learner_memory_available: true,
            explicitly_requests_research: explicitlyRequestsResearch,
            available_tools: ["learner_memory", "course_rag", "trusted_web_search"],
            output_schema: {
              use_learner_memory: "boolean",
              use_course_rag: "boolean",
              use_web_search: "boolean",
              reason: "string",
            },
          }),
        },
      ],
    });
    const clean = result.text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(clean) as Partial<ToolPlan>;
    const plan: ToolPlan = {
      use_learner_memory: true,
      use_course_rag: courseEvidenceAvailable && parsed.use_course_rag !== false,
      use_web_search:
        explicitlyRequestsResearch ||
        !courseEvidenceAvailable,
      reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 240) : safeFallback.reason,
      planned_by: "llm",
    };
    toolPlanCache.set(cacheKey, plan);
    return plan;
  } catch (error) {
    console.warn("[TeachBack Planner] Dùng safe fallback:", error);
    toolPlanCache.set(cacheKey, safeFallback);
    return safeFallback;
  }
}

function buildLocalFallbackResponse(
  question: Question,
  userMessage: string,
  alreadyMasteredPointIds: string[],
  allowedPointIds: Set<string>,
  startTime: number
): AnswerEvaluationResponse & { meta: Record<string, unknown> } {
  const clean = userMessage.trim().toLocaleLowerCase("vi");
  const isGreeting = /^(hi|hello|hey|chào|xin chào|alo)[!.?\s]*$/i.test(clean);
  const isAcknowledgement = /^(đúng rồi|đúng|ok|okay|ừ|ừm|vâng|dạ)[!.?\s]*$/i.test(clean);
  const isConfused = /^(chưa|không chắc|chịu)[!.?\s]*$|không hiểu|chưa hiểu|không rõ|giải thích lại|nói dễ hơn/i.test(clean);
  const isAmbiguous = /^(?:(cái này|ý này|nó)(?:\s+(là gì|sao|thế nào))?|sao vậy|tại sao vậy|là gì|thế nào)[!.?\s]*$/i.test(clean);
  const isOffTopic = /(thời tiết|bóng đá|nấu ăn|chứng khoán|bitcoin|du lịch|phim|âm nhạc|viết code game|chính trị)/i.test(clean);
  const isRelevant = isLearnerAnswerRelevant(question, userMessage);
  const deterministicMisconception = findDeterministicMisconception(
    question,
    userMessage
  );
  const answerTokens = meaningfulTokens(clean);
  const matchedPoints = question.requiredPoints.filter((point) => {
    if (deterministicMisconception) return false;
    if (!allowedPointIds.has(point.id)) return false;
    if (point.id === "concept_and_mechanism") {
      return isRelevant && clean.length >= 45 && /(là|nghĩa là|hoạt động|cơ chế|bằng cách|dựa trên|gồm|quy trình|đầu tiên|sau đó|vì)/i.test(clean);
    }
    if (point.id === "practical_example") {
      return isRelevant && /(ví dụ|chẳng hạn|giống như|tương tự|hãy tưởng tượng|trong trường hợp|thực tế|ví von)/i.test(clean);
    }
    if (point.id === "improvement_or_application") {
      return isRelevant && /(khắc phục|cải thiện|cải tiến|giảm rủi ro|hạn chế|nên|cần|giải pháp|kiểm chứng|kiểm tra|giám sát|tối ưu|áp dụng)/i.test(clean);
    }
    if (point.id === "how_might_we_solve") {
      return /(giải quyết|giải|xử lý).{0,25}(vấn đề|bài toán)|how might we solve/i.test(clean);
    }
    if (point.id === "unique_ai_value") {
      return /ai.{0,45}(độc đáo|khác biệt|tốt hơn|giá trị riêng|lợi thế).{0,35}(rule|cách thường|giải pháp thường|quy trình)?|can ai solve.{0,30}unique/i.test(clean);
    }
    if (point.id === "probabilistic_next_token" && /(xác suất|xác xuất|dự đoán|đoán).{0,30}(token|từ)|token.{0,30}(xác suất|ngữ cảnh)/i.test(clean)) return true;
    if (point.id === "hallucination_consequence" && /(bịa|ảo giác|halluci\w*|sai sự thật|thông tin sai)/i.test(clean)) return true;
    if (point.id === "fluency_not_truth" && /(trôi chảy|hợp lý|nghe hay).{0,50}(không|chưa).{0,25}(đúng|sự thật|kiểm chứng|xác minh)/i.test(clean)) return true;
    const pointTokens = meaningfulTokens(`${point.title} ${point.description}`);
    const overlap = Array.from(pointTokens).filter((token) => answerTokens.has(token));
    return overlap.length >= 3;
  });
  const masteredPointIds = Array.from(new Set([
    ...alreadyMasteredPointIds,
    ...matchedPoints.map((point) => point.id),
  ])).filter((id) => allowedPointIds.has(id));
  const missingPoints = question.requiredPoints.filter(
    (point) => !masteredPointIds.includes(point.id)
  );
  const nextPoint = missingPoints[0];
  const questionMastered = missingPoints.length === 0;
  const explainsProblemFirst =
    question.concept === "Google PAIR Reframe" &&
    /(vấn đề trước|giải pháp sau|giải nhầm vấn đề|chatbot.{0,30}(vô dụng|vô giá trị)|vô giá trị)/i.test(clean);

  let botResponse: string;
  if (questionMastered) {
    botResponse = question.success;
  } else if (isOffTopic || !isRelevant) {
    botResponse = `Câu hỏi đó nằm ngoài bài “${question.concept}”, nên mình chưa đi sang chủ đề ấy nhé. Quay lại bài hiện tại: ${nextPoint?.hint}`;
  } else if (deterministicMisconception) {
    botResponse = `Phần này chưa đúng: ${deterministicMisconception.correction} Gợi ý để thử lại: ${nextPoint?.hint}`;
  } else if (isAmbiguous) {
    botResponse = `Mình chưa chắc “${userMessage.trim()}” đang nói tới phần nào. Bạn đang muốn hỏi về câu hỏi hiện tại, gợi ý vừa rồi hay nguồn slide?`;
  } else if (isGreeting) {
    botResponse = `Chào bạn! Mình đang cùng bạn học câu “${question.prompt}”. Bạn cứ giải thích ngắn theo cách mình hiểu nhé.`;
  } else if (isAcknowledgement) {
    botResponse = `Mình nghe bạn. Nhưng “${userMessage.trim()}” chưa cho thấy cách bạn hiểu câu hỏi này. Mình gợi mở một bước thôi: ${nextPoint?.hint}`;
  } else if (isConfused) {
    botResponse = `Không sao, mình nói lại dễ hơn nhé: ${nextPoint?.description} Bạn thử diễn đạt lại một ý nhỏ bằng lời của bạn được không?`;
  } else if (explainsProblemFirst && nextPoint?.id === "unique_ai_value") {
    botResponse = "Đúng, bạn đã giải thích được vì sao phải bắt đầu từ vấn đề. Phần này mình ghi nhận về mặt lập luận. Còn câu hỏi thứ hai của Google PAIR là: AI có giải quyết vấn đề này theo cách độc đáo hoặc tốt hơn cách thông thường không? Bạn thử nói lại câu hỏi đó bằng lời của mình nhé.";
  } else if (matchedPoints.length > 0) {
    botResponse = `Bạn đã hiểu đúng: ${matchedPoints.map((point) => point.title).join(", ")}. Bạn không cần lặp lại phần này. Gợi ý cho ý còn thiếu: ${nextPoint?.hint}`;
  } else {
    botResponse = `Mình hiểu ý bạn, nhưng chưa thấy ý nào đủ rõ để ghi nhận. Mình cùng đi từng bước nhé: ${nextPoint?.hint}`;
  }
  botResponse = `${botResponse}\n\nNguồn đối chiếu: ${question.source.range}.`;

  return {
    bot_response: botResponse,
    response_mode: questionMastered ? "mastered" : masteredPointIds.length > 0 ? "partial" : "needs_revision",
    understanding_level: questionMastered ? 3 : masteredPointIds.length > 0 ? 2 : 1,
    question_mastered: questionMastered,
    mastered_point_ids: masteredPointIds,
    missing_point_ids: missingPoints.map((point) => point.id),
    evaluation: {
      correct_points: matchedPoints.map((point) => ({
        id: point.id,
        evidence: "Đối chiếu với rubric cố định của bài học.",
        feedback: `Bạn đã đề cập đúng ý “${point.title}”.`,
      })),
      incorrect_claims: deterministicMisconception
        ? [deterministicMisconception]
        : [],
      newly_mastered_point_ids: matchedPoints.map((point) => point.id),
      invalidated_point_ids: [],
    },
    feedback_summary: {
      what_you_did_well: matchedPoints.map((point) => point.title).join(", "),
      missing_or_vague: nextPoint?.title || "",
    },
    hint: nextPoint?.hint || null,
    citation: question.source.range,
    meta: {
      latency_ms: Date.now() - startTime,
      model_used: "local_lesson_rubric",
      citation: question.source.range,
      degraded_mode: true,
    },
  };
}

function meaningfulTokens(value: string): Set<string> {
  const stopWords = new Set(["các", "cho", "của", "được", "là", "một", "này", "những", "thì", "trong", "và", "với", "theo", "như", "khi", "không"]);
  return new Set(value.split(/[^\p{L}\p{N}_-]+/u).filter((token) => token.length > 2 && !stopWords.has(token)));
}

function isLearnerSupportUtterance(value: string): boolean {
  const clean = value.trim().toLocaleLowerCase("vi");
  return /^(chưa|không chắc|chịu|không biết|không hiểu|chưa hiểu|không rõ)[!.?\s]*$|giải thích lại|nói dễ hơn|cho (mình|tôi|em) (một )?gợi ý/i.test(clean);
}

function detectSemanticPointIds(question: Question, value: string): string[] {
  const clean = value.trim().toLocaleLowerCase("vi");
  const matches: string[] = [];
  const add = (id: string, condition: boolean) => {
    if (condition && question.requiredPoints.some((point) => point.id === id)) {
      matches.push(id);
    }
  };

  add(
    "probabilistic_next_token",
    /(dự đoán|đoán|chọn|sinh).{0,35}(token|từ|chữ).{0,45}(xác suất|ngữ cảnh)|xác (suất|xuất).{0,35}(token|từ|chữ|câu trả lời)|token.{0,35}(xác suất|ngữ cảnh)/i.test(clean)
  );
  add(
    "fluency_not_truth",
    /(trôi chảy|nghe hợp lý|nghe hay|mượt).{0,80}(không|chưa|khác).{0,30}(đúng|chính xác|sự thật|kiểm chứng)|độ chính xác.{0,60}(bằng chứng|nguồn|kiểm chứng)|không.{0,35}(kiểm chứng|xác minh).{0,35}(sự thật|đúng sai|thông tin)/i.test(clean)
  );
  add(
    "hallucination_consequence",
    /(ảo giác|halluci\w*|bịa|thông tin sai|sai sự thật|tự tin.{0,30}sai|người.{0,30}hiểu sai|quyết định sai)/i.test(clean)
  );
  add(
    "finite_visible_context",
    /(context|ngữ cảnh|bàn làm việc).{0,70}(hữu hạn|giới hạn|tối đa|sức chứa|chỉ.{0,15}(nhìn|thấy|dùng))|(lượng|số).{0,30}token.{0,30}(tối đa|giới hạn|một lần)|thông tin.{0,35}(đưa vào|nằm trong).{0,25}context/i.test(clean)
  );
  add(
    "cost_and_latency",
    /(context|prompt|token|tài liệu).{0,70}(tốn|chi phí|đắt|chậm|độ trễ|thời gian|compute|bộ nhớ)|(tốn|chi phí|chậm|độ trễ|thời gian|compute|bộ nhớ).{0,70}(context|prompt|token|xử lý)/i.test(clean)
  );
  add(
    "lost_in_middle",
    /(lost in the middle|thông tin|nội dung).{0,70}(ở giữa|nằm giữa).{0,60}(bỏ sót|bị quên|không.{0,15}(chú ý|tận dụng|sử dụng)|kém hiệu quả)|(ở giữa|phần giữa).{0,60}(bỏ sót|bị quên|chú ý.{0,20}(kém|ít))/i.test(clean)
  );
  add(
    "trusted_grounding",
    /(grounding|neo|dựa|trả lời).{0,60}(nguồn|tài liệu|bằng chứng).{0,35}(tin cậy|đáng tin|tham chiếu|cụ thể|xác thực)|nguồn (tin cậy|đáng tin).{0,50}(context|câu trả lời|prompt)/i.test(clean)
  );
  add(
    "rag_retrieve_then_generate",
    /(rag|hệ thống).{0,45}(truy xuất|tìm|lấy).{0,70}(tài liệu|đoạn|thông tin).{0,70}(đưa|chèn|thêm).{0,35}(prompt|context|ngữ cảnh)|truy xuất.{0,60}(tài liệu|thông tin).{0,60}(tạo|sinh|trả lời)/i.test(clean)
  );
  add(
    "reduce_not_eliminate",
    /(giảm|hạn chế).{0,35}(ảo giác|bịa|sai|lỗi).{0,80}(không.{0,15}(hết|tuyệt đối|100%)|vẫn.{0,20}(kiểm|sai))|không.{0,20}(loại bỏ|triệt tiêu|đúng 100%).{0,35}(ảo giác|sai|lỗi)|vẫn cần.{0,25}(kiểm chứng|xác minh|kiểm tra)/i.test(clean)
  );
  add(
    "sampling_control",
    /(temperature|nhiệt độ).{0,60}(ngẫu nhiên|lấy mẫu|chọn token|phân bố xác suất|xác suất)|(ngẫu nhiên|lấy mẫu).{0,50}(token|temperature|nhiệt độ)/i.test(clean)
  );
  add(
    "low_temperature",
    /(temperature|nhiệt độ).{0,20}(thấp|gần 0|bằng 0|= 0).{0,60}(ổn định|nhất quán|chắc chắn|ít ngẫu nhiên|code|phân tích)|(thấp|gần 0).{0,40}(ưu tiên|chọn).{0,25}(token|từ).{0,20}(chắc|xác suất cao)/i.test(clean)
  );
  add(
    "high_temperature_tradeoff",
    /(temperature|nhiệt độ).{0,20}(cao|lớn).{0,75}(đa dạng|sáng tạo|ngẫu nhiên|lạc đề|rủi ro|sai)|(cao|lớn).{0,30}(sáng tạo|đa dạng).{0,50}(rủi ro|lạc|sai)|không.{0,25}(thông minh hơn|thêm kiến thức)/i.test(clean)
  );
  add(
    "how_might_we_solve",
    /(giải quyết|xử lý).{0,25}(vấn đề|bài toán)|how might we solve/i.test(clean)
  );
  add(
    "unique_ai_value",
    /ai.{0,50}(độc đáo|khác biệt|tốt hơn|giá trị riêng|lợi thế).{0,35}(rule|cách thường|giải pháp thường|quy trình)?|can ai solve.{0,30}unique/i.test(clean)
  );

  return matches;
}

function buildHintResponse(
  question: Question,
  alreadyMasteredPointIds: string[],
  chatHistory: ChatMessage[],
  startTime: number
): AnswerEvaluationResponse & { meta: Record<string, unknown> } {
  const masteredSet = new Set(alreadyMasteredPointIds);
  const missingPoints = question.requiredPoints.filter(
    (point) => !masteredSet.has(point.id)
  );
  const nextPoint = missingPoints[0];
  const questionMastered = missingPoints.length === 0;
  const lastLearnerMessage = [...chatHistory]
    .reverse()
    .find((message) => message.role === "user")
    ?.content.trim();
  const learnerContext = lastLearnerMessage
    ? `Ở lượt trước bạn đang nói “${lastLearnerMessage.slice(0, 100)}”. `
    : "";
  const hint = nextPoint
    ? `${learnerContext}Hãy thử bổ sung riêng phần “${nextPoint.title}” của ${question.concept} bằng một câu ngắn theo cách bạn hiểu.`
    : null;

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

function normalizeHintEvaluation(
  parsed: Partial<AnswerEvaluationResponse>,
  question: Question,
  alreadyMasteredPointIds: string[]
): AnswerEvaluationResponse {
  const masteredSet = new Set(alreadyMasteredPointIds);
  const missingPoints = question.requiredPoints.filter(
    (point) => !masteredSet.has(point.id)
  );
  const questionMastered = missingPoints.length === 0;
  const generatedHint =
    typeof parsed.hint === "string" && parsed.hint.trim()
      ? parsed.hint.trim()
      : null;
  const botResponse =
    typeof parsed.bot_response === "string" &&
    parsed.bot_response.trim() &&
    !parsed.bot_response.trim().startsWith("{")
      ? parsed.bot_response.trim()
      : generatedHint
        ? `Mình gợi mở một bước nhé: ${generatedHint}`
        : `Mình sẽ không bật mí đáp án. Bạn thử tập trung vào phần “${missingPoints[0]?.title || question.concept}” và nói một ý nhỏ theo cách mình hiểu nhé.`;

  return {
    bot_response: questionMastered
      ? "Bạn đã làm rõ đủ cả ba tiêu chí và có thể sang câu tiếp theo."
      : botResponse,
    response_mode: questionMastered
      ? "mastered"
      : alreadyMasteredPointIds.length > 0
        ? "partial"
        : "needs_revision",
    understanding_level: questionMastered
      ? 3
      : alreadyMasteredPointIds.length > 0
        ? 2
        : 1,
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
      missing_or_vague: missingPoints[0]?.title || "",
    },
    hint: generatedHint,
    citation: question.source.range,
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
  learnerMessage,
  alreadyMasteredPointIds,
  allowedPointIds,
}: {
  parsed: Partial<AnswerEvaluationResponse>;
  question: Question;
  learnerMessage: string;
  alreadyMasteredPointIds: string[];
  allowedPointIds: Set<string>;
}): AnswerEvaluationResponse {
  const evaluation = parsed.evaluation;
  const validatedModelPointIds = getValidatedModelMasteryIds({
    evaluation,
    question,
    learnerMessage,
    allowedPointIds,
  });
  const semanticPointIds = isLearnerSupportUtterance(learnerMessage)
    ? []
    : detectSemanticPointIds(question, learnerMessage).filter((id) =>
        allowedPointIds.has(id)
      );
  const proposedNewlyMasteredPointIds = Array.from(
    new Set([
      ...validatedModelPointIds,
      ...semanticPointIds,
    ])
  ).filter((id) => !alreadyMasteredPointIds.includes(id));
  const modelHasIncorrectClaims =
    Array.isArray(evaluation?.incorrect_claims) &&
    evaluation.incorrect_claims.some(
      (item) =>
        item &&
        typeof item.claim === "string" &&
        typeof item.correction === "string"
    );
  const newlyMasteredPointIds = preventUnconfirmedFullScore({
    proposedNewPointIds: proposedNewlyMasteredPointIds,
    alreadyMasteredPointIds,
    allPointIds: question.requiredPoints.map((point) => point.id),
    modelQuestionMastered: parsed.question_mastered,
    modelResponseMode: parsed.response_mode,
    modelHasIncorrectClaims,
  });
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

  const newlyMasteredSet = new Set(newlyMasteredPointIds);
  const modelCorrectPoints = Array.isArray(evaluation?.correct_points)
    ? evaluation.correct_points.filter(
        (point) =>
          point &&
          allowedPointIds.has(point.id) &&
          newlyMasteredSet.has(point.id)
      )
    : [];
  const correctPoints = [
    ...modelCorrectPoints,
    ...semanticPointIds
      .filter((id) => !modelCorrectPoints.some((point) => point.id === id))
      .map((id) => {
        const point = question.requiredPoints.find((item) => item.id === id)!;
        return {
          id,
          evidence: learnerMessage,
          feedback: `Bạn đã diễn đạt đúng ý “${point.title}”.`,
        };
      }),
  ];
  const incorrectClaims = Array.isArray(evaluation?.incorrect_claims)
    ? evaluation.incorrect_claims.filter(
        (item) =>
          item &&
          typeof item.claim === "string" &&
          typeof item.correction === "string"
      )
    : [];
  const deterministicMisconception = findDeterministicMisconception(
    question,
    learnerMessage
  );
  if (
    deterministicMisconception &&
    !incorrectClaims.some(
      (item) => item.claim === deterministicMisconception.claim
    )
  ) {
    incorrectClaims.push(deterministicMisconception);
  }
  const questionMastered = shouldMarkQuestionMastered({
    missingPointIds,
    incorrectClaims,
    modelQuestionMastered: parsed.question_mastered,
    modelResponseMode: parsed.response_mode,
  });
  const nextMissingPoint = question.requiredPoints.find(
    (point) => !masteredSet.has(point.id)
  );
  const responseMode: AnswerEvaluationResponse["response_mode"] = questionMastered
    ? "mastered"
    : incorrectClaims.length > 0
      ? "needs_revision"
      : masteredPointIds.length > 0
        ? "partial"
        : "needs_revision";
  const understandingLevel: 1 | 2 | 3 = questionMastered
    ? 3
    : masteredPointIds.length > 0
      ? 2
      : 1;

  const modelClaimedMastery =
    parsed.question_mastered === true || parsed.response_mode === "mastered";
  const safeModelResponse =
    !modelClaimedMastery &&
    typeof parsed.bot_response === "string" &&
    parsed.bot_response.trim() &&
    !parsed.bot_response.trim().startsWith("{")
      ? parsed.bot_response.trim()
      : null;

  return {
    bot_response: questionMastered
      ? `${question.success}\n\nNguồn đối chiếu: ${question.source.range}.`
      : safeModelResponse
        ? safeModelResponse
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
        correctPoints.length > 0
          ? parsed.feedback_summary?.what_you_did_well || ""
          : "",
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
