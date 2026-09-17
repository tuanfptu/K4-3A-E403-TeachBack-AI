import { NextResponse } from "next/server";
import { getGroundingContext, isCurriculumConcept } from "@/lib/knowledge-bank";
import { getDynamicGroundingContext } from "@/lib/transcript-retriever";
import { detectPlagiarism, detectOutOfScopeMessage, sanitizeNoLeak } from "@/lib/guardrails";
import { generateTeachingScorecard } from "@/lib/assessment-engine";
import {
  buildFeynmanSystemPrompt,
  ChatMessage,
  FeynmanStructuredResponse,
} from "@/lib/feynman-prompt";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

interface TeachRequestBody {
  concept?: string;
  user_message?: string;
  chat_history?: ChatMessage[];
  custom_model?: string;
  is_hint_requested?: boolean;
  lesson_name?: string;
  lesson_id?: number;
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body: TeachRequestBody = await request.json();
    const concept = (body.concept || "hallucination").trim();
    const userMessage = (body.user_message || "").trim();
    const chatHistory = Array.isArray(body.chat_history) ? body.chat_history : [];
    const isHintRequested = Boolean(body.is_hint_requested);
    const lessonName =
      body.lesson_name ||
      (body.lesson_id === 1
        ? "Day 1: AI & LLM Foundation"
        : body.lesson_id === 2
        ? "Day 2: Xác định bài toán cho AI & Độ tự động hoá"
        : undefined);

    if (!userMessage && !isHintRequested) {
      return NextResponse.json(
        { error: "user_message không được để trống" },
        { status: 400 }
      );
    }

    // 0. SCOPE GUARD: Kiểm tra rào chắn giáo trình bài giảng AI (Day 1 - Day 6)
    if (!isCurriculumConcept(concept)) {
      const scopeRefusalResponse: FeynmanStructuredResponse = {
        bot_response: `Ơ bạn ơi, khái niệm "${concept}" không nằm trong giáo trình bài giảng AI của chúng mình! Thầy chỉ dạy các bài về AI & LLM Foundation (như Ảo giác LLM, Grounding, RAG, Next-token prediction, Attention, Transformer, Prompt Engineering, Vector DB...). Bạn hãy chọn một bài học trong giáo trình nhé!`,
        response_mode: "counter_probe",
        understanding_level: 1,
        feedback_summary: {
          what_you_did_well: "Bạn đã thử nghiệm nhập một thuật ngữ.",
          missing_or_vague: `Khái niệm "${concept}" nằm ngoài phạm vi giáo trình bài giảng AI (Day 1 - Day 6).`,
        },
        rubric_checklist: {
          mechanism: false,
          no_misconception: false,
          valid_analogy: false,
          resilience: false,
        },
        detected_jargon: ["Thuật ngữ ngoài giáo trình"],
        citation: "Phạm vi giáo trình AI & LLM (Day 1 - Day 6)",
      };
      return NextResponse.json({
        ...scopeRefusalResponse,
        meta: {
          latency_ms: Date.now() - startTime,
          model_used: "curriculum_scope_guard",
          citation: "Phạm vi giáo trình AI & LLM (Day 1 - Day 6)",
        },
      });
    }

    // 1. Quét Tri thức bám nguồn động từ Transcript thật (FR-1 & NFR-3)
    const dynamicGrounding = getDynamicGroundingContext(concept);
    const staticGrounding = getGroundingContext(concept);

    // 1b. SCOPE GUARD TIN NHẮN: Kiểm tra câu hỏi lạc đề / ngoài phạm vi trong phiên chat hoặc chuyển chủ đề
    if (!isHintRequested && userMessage.length > 2) {
      const scopeCheck = detectOutOfScopeMessage(
        userMessage,
        staticGrounding.vietnameseName || concept,
        lessonName
      );
      if (scopeCheck.isOutOfScope || scopeCheck.isTopicSwitch) {
        const outOfScopeResponse: FeynmanStructuredResponse = {
          bot_response:
            scopeCheck.message ||
            `Ơ bạn ơi, câu hỏi này không nằm trong bài học ${lessonName || staticGrounding.vietnameseName} của chúng mình! Bạn hãy tập trung giảng giải nội dung bài này cho mình nghe với nhé!`,
          response_mode: "counter_probe",
          understanding_level: 1,
          feedback_summary: {
            what_you_did_well: scopeCheck.isTopicSwitch
              ? `Bạn vừa nhắc tới chủ đề ${scopeCheck.switchTarget || "mới"}.`
              : "Bạn đang tương tác với AI Student.",
            missing_or_vague: scopeCheck.isTopicSwitch
              ? `Cần hoàn thành bài học hiện tại trước khi chuyển sang ${scopeCheck.switchTarget}.`
              : "Nội dung câu hỏi bị lệch ra ngoài phạm vi bài học trong giáo trình.",
          },
          rubric_checklist: {
            mechanism: false,
            no_misconception: false,
            valid_analogy: false,
            resilience: false,
          },
          detected_jargon: scopeCheck.isTopicSwitch && scopeCheck.switchTarget ? [scopeCheck.switchTarget] : [],
          citation: staticGrounding.citations,
        };
        return NextResponse.json({
          ...outOfScopeResponse,
          meta: {
            latency_ms: Date.now() - startTime,
            model_used: scopeCheck.isTopicSwitch ? "topic_switch_guard" : "in_turn_scope_guard",
            citation: staticGrounding.citations,
            is_topic_switch: Boolean(scopeCheck.isTopicSwitch),
            switch_target: scopeCheck.switchTarget,
          },
        });
      }
    }

    // Kết hợp nguồn cố định và các đoạn trích dẫn động từ 6 file transcript
    const combinedCitations = dynamicGrounding.chunks.length > 0
      ? dynamicGrounding.citations
      : staticGrounding.citations;

    const referenceTexts = [
      staticGrounding.coreDefinition,
      ...staticGrounding.keyPoints,
      ...dynamicGrounding.chunks.map((c) => c.content),
    ];

    // 2. Chống dán nguyên văn tài liệu / Anti-Plagiarism (FR-3)
    if (!isHintRequested && userMessage.length > 75) {
      const plagiarismCheck = detectPlagiarism(userMessage, referenceTexts);
      if (plagiarismCheck.isPlagiarized) {
        const plagiarizedResponse: FeynmanStructuredResponse = {
          bot_response:
            plagiarismCheck.message ||
            "Bạn ơi, câu này giống y nguyên trong slide/tài liệu rồi! Mình muốn nghe bạn giải thích bằng từ ngữ bình dân hoặc một ví dụ đời thực của chính bạn cơ!",
          response_mode: "demand_analogy",
          understanding_level: 1,
          feedback_summary: {
            what_you_did_well: "Bạn đã tìm đúng tài liệu liên quan đến khái niệm.",
            missing_or_vague: "Cần tự diễn đạt lại bằng ngôn ngữ đời thường, không copy nguyên văn.",
          },
          rubric_checklist: {
            mechanism: false,
            no_misconception: false,
            valid_analogy: false,
            resilience: false,
          },
          detected_jargon: ["Đoạn văn copy từ tài liệu"],
          citation: combinedCitations,
        };
        return NextResponse.json({
          ...plagiarizedResponse,
          meta: {
            latency_ms: Date.now() - startTime,
            model_used: "guardrail_anti_plagiarism",
            citation: combinedCitations,
          },
        });
      }
    }

    // 3. Cơ chế Phản biện sư phạm & Gỡ rối có chiều sâu (FR-4)
    const assistantMessages = chatHistory.filter((m) => m.role === "assistant");
    const userTurnsCount = chatHistory.filter((m) => m.role === "user").length;

    // Đếm số lượt phản biện thực sự
    const consecutiveFailures = assistantMessages
      .slice(1)
      .slice(-3)
      .filter(
        (m) =>
          m.content.toLowerCase().includes("chưa chính xác") ||
          m.content.toLowerCase().includes("chưa đúng lắm") ||
          m.content.toLowerCase().includes("khập khiễng") ||
          m.content.toLowerCase().includes("khoan bạn ơi") ||
          m.content.toLowerCase().includes("ngược")
      ).length;

    // Nhận diện người học bày tỏ khó khăn
    const userUnsureRegex = /(không biết|chưa biết|chịu rồi|\bchịu\b|chưa hiểu|khó quá|giải thích hộ|nói luôn đi|không rõ|bó tay|quên rồi|chưa rõ|giải thích giùm|không trả lời được|mình không biết|em không biết|chưa nắm|cứu với)/i;
    const isUserUnsure = userUnsureRegex.test(userMessage);
    const isDirectDemand = /(giải thích luôn đi|nói luôn đi|nói đáp án đi|bạn giải thích đi|chịu hẳn rồi)/i.test(userMessage);

    // Xác định chủ đề con cụ thể đang thảo luận (RAG, Grounding, Next-token, Attention...)
    let activeConceptKey = concept;
    const allRecentText = [
      userMessage,
      ...chatHistory.slice(-2).map((m) => m.content),
    ].join(" ").toLowerCase();

    if (
      allRecentText.includes("rag") ||
      allRecentText.includes("tra sổ") ||
      allRecentText.includes("retrieval")
    ) {
      activeConceptKey = "rag";
    } else if (
      allRecentText.includes("grounding") ||
      allRecentText.includes("neo dữ liệu") ||
      allRecentText.includes("gắn nguồn")
    ) {
      activeConceptKey = "grounding";
    } else if (
      allRecentText.includes("next-token") ||
      allRecentText.includes("next token") ||
      allRecentText.includes("đoán từ")
    ) {
      activeConceptKey = "next_token_prediction";
    } else if (
      allRecentText.includes("attention") ||
      allRecentText.includes("chú ý")
    ) {
      activeConceptKey = "attention";
    } else if (
      allRecentText.includes("ảo giác") ||
      allRecentText.includes("hallucination") ||
      allRecentText.includes("bịa")
    ) {
      activeConceptKey = "hallucination";
    }

    const specificGrounding = getGroundingContext(activeConceptKey);
    const cleanAnalogy = (specificGrounding.sampleGoodAnalogies[0] || "")
      .replace(/^giống như\s+/i, "")
      .trim();

    let systemPrompt = buildFeynmanSystemPrompt({
      ...specificGrounding,
      citations: combinedCitations,
    }, lessonName);

    // ĐIỀU KIỆN KÍCH HOẠT GỠ RỐI: Phải vặn/đối thoại qua ít nhất 2-3 lượt, HOẶC người học bấm nút/yêu cầu trực tiếp
    const shouldRescue = isHintRequested || isDirectDemand || ((userTurnsCount >= 2 || consecutiveFailures >= 2) && isUserUnsure);

    if (shouldRescue) {
      systemPrompt += `\n\n## 🚨 LỆNH GỠ RỐI SƯ PHẠM (SCAFFOLDING RESCUE):
Hai bên đã đối thoại/phản biện qua lại và người học đang gặp bế tắc về "${specificGrounding.vietnameseName}".
BẮT BUỘC BẠN PHẢI CHỌN: "response_mode": "scaffolding_rescue"!
TUYỆT ĐỐI KHÔNG BẮT BẺ NỮA!
QUY TẮC PHÁT NGÔN TỰ NHIÊN (RẤT QUAN TRỌNG):
TUYỆT ĐỐI KHÔNG NÓI: "Dạ em vừa đọc từ Slide...", "Theo tài liệu bài giảng..."!
HÃY PHÁT BIỂU TỰ NHIÊN NHƯ SUY NGHĨ CỦA CHÍNH BẠN:
"Tôi nghĩ là cái này hoạt động theo kiểu: ${specificGrounding.coreDefinition}... Nó giống như là ví dụ ${cleanAnalogy || "học sinh tra tài liệu trong cẩm nang"}... Bạn thấy tôi nghĩ như vậy có hợp lý không?"
Feedback tóm tắt hãy động viên người học và tóm tắt ngắn gọn cơ chế chuẩn.`;
    } else if (isUserUnsure && userTurnsCount < 2) {
      // Nếu mới lượt 1 mà người học chưa tự tin: Hãy vặn nhẹ / khích lệ đoán thử 1-2 câu, chưa vội mớm đáp án
      systemPrompt += `\n\n## HƯỚNG DẪN KHÍCH LỆ PHẢN BIỆN:
Người học mới chỉ hơi ngập ngừng ở lượt đầu. ĐỪNG vội mớm toàn bộ đáp án ngay!
Hãy vặn nhẹ hoặc đưa ra một gợi mở ngắn để khích lệ bạn học thử suy luận hoặc đoán xem!
Xưng hô tự nhiên "mình - bạn" hoặc "tôi - bạn", tuyệt đối không xưng "15 tuổi".`;
    }

    // 4. Chuẩn bị Messages
    const formattedMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-6),
      {
        role: "user",
        content: isHintRequested
          ? "Mình chưa rõ chỗ này lắm, bạn có thể gợi ý cho mình một chút được không?"
          : userMessage,
      },
    ];

    // 5. Đọc cấu hình OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    const primaryModel =
      body.custom_model ||
      process.env.OPENROUTER_MODEL ||
      "google/gemini-2.5-flash";
    const fallbackModel =
      process.env.OPENROUTER_FALLBACK_MODEL || "openai/gpt-4o-mini";

    if (!apiKey || apiKey === "your_openrouter_api_key_here") {
      return NextResponse.json({
        bot_response:
          "Vui lòng đặt OPENROUTER_API_KEY trong file .env.local để kích hoạt AI Student thật!",
        response_mode: "demand_analogy",
        understanding_level: 1,
        citation: combinedCitations,
        is_mock: true,
      });
    }

    // 6. Gọi OpenRouter API với Timeout & Fallback
    let rawResultText = "";
    let modelUsed = primaryModel;
    let usageData = null;

    try {
      const response = await callOpenRouter({
        apiKey,
        model: primaryModel,
        messages: formattedMessages,
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
          messages: formattedMessages,
        });
        rawResultText = fallbackResponse.text;
        usageData = fallbackResponse.usage;
      } catch (fallbackError: unknown) {
        console.error(`[TeachBack AI] Both models failed:`, fallbackError);
        const errStr = `${String(primaryError)} ${String(fallbackError)}`;
        if (errStr.includes("402") || errStr.includes("credits")) {
          return NextResponse.json({
            bot_response:
              "Ối bạn ơi, tài khoản OpenRouter của bạn đang tạm hết credits hoặc vượt hạn mức token (HTTP 402)! Bạn vui lòng nạp thêm credit tại openrouter.ai/settings/credits để tiếp tục trò chuyện nhé!",
            response_mode: "counter_probe",
            understanding_level: 1,
            feedback_summary: {
              what_you_did_well: "Bạn đã gửi lời giảng giải cho học sinh.",
              missing_or_vague: "Cần bổ sung credits trên OpenRouter để AI Student phản hồi mượt mà.",
            },
            detected_jargon: [],
            citation: combinedCitations,
          });
        }
        throw fallbackError;
      }
    }

    const latencyMs = Date.now() - startTime;

    // 7. Parse JSON kết quả an toàn
    let structuredResponse: FeynmanStructuredResponse;
    try {
      const cleanedJson = rawResultText
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      structuredResponse = JSON.parse(cleanedJson);
    } catch {
      // Regex extraction fallback nếu JSON bị cắt cụt hoặc không hợp lệ
      let extractedBotResponse = "";
      const botMatch = rawResultText.match(/"bot_response"\s*:\s*"((?:\\.|[^"\\])*)/);
      if (botMatch && botMatch[1]) {
        extractedBotResponse = botMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, " ")
          .trim();
      }

      const modeMatch = rawResultText.match(/"response_mode"\s*:\s*"([^"]+)"/);
      const extractedMode = (modeMatch?.[1] as FeynmanStructuredResponse["response_mode"]) || "demand_analogy";

      const levelMatch = rawResultText.match(/"understanding_level"\s*:\s*([123])/);
      const extractedLevel = levelMatch ? (parseInt(levelMatch[1], 10) as 1 | 2 | 3) : 1;

      const didWellMatch = rawResultText.match(/"what_you_did_well"\s*:\s*"((?:\\.|[^"\\])*)/);
      const missingMatch = rawResultText.match(/"missing_or_vague"\s*:\s*"((?:\\.|[^"\\])*)/);

      structuredResponse = {
        bot_response:
          extractedBotResponse ||
          (rawResultText.trim().startsWith("{")
            ? "Mình đang lắng nghe bạn nè, bạn giảng giải tiếp cho mình nhé!"
            : rawResultText),
        response_mode: extractedMode,
        understanding_level: extractedLevel,
        feedback_summary: {
          what_you_did_well: didWellMatch ? didWellMatch[1].replace(/\\"/g, '"') : "Bạn đang tích cực hướng dẫn học sinh.",
          missing_or_vague: missingMatch ? missingMatch[1].replace(/\\"/g, '"') : "Hãy làm rõ bằng các ví dụ đời thực.",
        },
        detected_jargon: [],
        citation: combinedCitations,
      };
    }

    // Đảm bảo bot_response tuyệt đối không chứa chuỗi JSON thô
    if (typeof structuredResponse.bot_response === "string" && structuredResponse.bot_response.trim().startsWith("{")) {
      const match = structuredResponse.bot_response.match(/"bot_response"\s*:\s*"((?:\\.|[^"\\])*)/);
      if (match && match[1]) {
        structuredResponse.bot_response = match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").trim();
      } else {
        structuredResponse.bot_response = "Mình đang rất tò mò muốn nghe bạn giảng thêm về phần này nè!";
      }
    }

    // 8. Chống lộ đáp án / No-Leak Post-Filter (NFR-2)
    structuredResponse.bot_response = sanitizeNoLeak(
      structuredResponse.bot_response,
      structuredResponse.response_mode
    );

    // 9. Sinh Thẻ Tổng Kết Phiên Dạy khi Đạt Mastered (FR-7)
    let scorecard = null;
    if (structuredResponse.response_mode === "mastered") {
      const turnsCount = chatHistory.filter((m) => m.role === "user").length + 1;
      scorecard = generateTeachingScorecard({
        concept: staticGrounding.vietnameseName || concept,
        turnsTaken: turnsCount,
        learningGain: "+85%",
        approvedAnalogy:
          userMessage || "Học viên đã đưa ra ví dụ đời thực chính xác.",
        coreTakeaway: staticGrounding.coreDefinition,
        citations: [combinedCitations],
        rubric: {
          mechanism: true,
          noMisconception: true,
          validAnalogy: true,
          resilience: true,
        },
      });
    }

    return NextResponse.json({
      ...structuredResponse,
      scorecard,
      meta: {
        latency_ms: latencyMs,
        model_used: modelUsed,
        citation: combinedCitations,
        retrieved_chunks: dynamicGrounding.chunks.map((c) => ({
          chunk_id: c.chunkId,
          section: c.sectionTitle,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("[TeachBack AI API Error]:", error);
    const msg = error instanceof Error ? error.message : "Server Error";
    return NextResponse.json({ error: "Lỗi xử lý", detail: msg }, { status: 500 });
  }
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
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "TeachBack AI - Feynman Protégé",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 800, // Đủ token cho schema JSON đầy đủ của Tiếng Việt
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: unknown;
    };
    const text = data?.choices?.[0]?.message?.content || "";
    return { text, usage: data?.usage };
  } finally {
    clearTimeout(timeout);
  }
}
