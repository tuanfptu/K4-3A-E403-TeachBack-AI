/**
 * Guardrails Sư phạm: Chống chép phạt (Anti-Plagiarism) và Chống lộ đáp án (No-Leak)
 */

export interface PlagiarismCheckResult {
  isPlagiarized: boolean;
  similarityScore: number;
  message?: string;
}

/**
 * Phát hiện học viên dán nguyên văn từ slide hoặc transcript (FR-3)
 * Sử dụng giải thuật Containment & N-gram Overlap
 */
export function detectPlagiarism(
  userText: string,
  referenceTexts: string[]
): PlagiarismCheckResult {
  const cleanUser = userText.toLowerCase().trim();
  // Học viên phải nhập một đoạn dài (> 75 ký tự) mới xét dán nguyên văn từ slide
  if (cleanUser.length < 75) {
    return { isPlagiarized: false, similarityScore: 0 };
  }

  const stopWords = new Set([
    "là", "của", "và", "trong", "cho", "với", "từ", "các", "những",
    "được", "để", "nó", "ra", "vào", "khi", "thì", "có", "không", "một"
  ]);

  // Tách từ loại bỏ dấu câu và stop words
  const userWords = cleanUser
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'–—]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  if (userWords.length < 12) {
    return { isPlagiarized: false, similarityScore: 0 };
  }

  const userWordSet = new Set(userWords);

  let maxSimilarity = 0;

  for (const ref of referenceTexts) {
    const cleanRef = ref.toLowerCase();

    // 1. Kiểm tra dán trực tiếp một chuỗi dài liên tục (Substring match >= 50 ký tự)
    const words = userWords.slice(0, 15).join(" ");
    if (words.length > 50 && cleanRef.includes(words)) {
      return {
        isPlagiarized: true,
        similarityScore: 0.95,
        message:
          "Bạn đang dán nguyên văn một đoạn trong tài liệu bài giảng rồi! Hãy tự diễn giải lại bằng lời của riêng bạn hoặc ví nó với một việc ngoài đời đi!",
      };
    }

    // 2. Tính mức độ bao hàm (Word Containment)
    let matchCount = 0;
    for (const w of userWordSet) {
      if (cleanRef.includes(w)) {
        matchCount++;
      }
    }

    const similarity = matchCount / userWordSet.size;
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
    }
  }

  // Nếu trên 75% số từ nội dung trùng với tài liệu tham chiếu
  if (maxSimilarity >= 0.75) {
    return {
      isPlagiarized: true,
      similarityScore: Math.round(maxSimilarity * 100) / 100,
      message:
        "Câu giải thích của bạn có quá nhiều câu từ trùng khít với slide/tài liệu. Bạn hãy nói theo cách bình dân nhất có thể hoặc lấy một ví dụ đời thực xem nào!",
    };
  }

  return {
    isPlagiarized: false,
    similarityScore: Math.round(maxSimilarity * 100) / 100,
  };
}

/**
 * Bộ lọc kiểm tra sau khi sinh (No-Leak Guardrail - NFR-2)
 * Đảm bảo ở các mode hỏi vặn, bot không bao giờ lỡ mồm mớm lộ đáp án
 */
export function sanitizeNoLeak(
  botResponse: string,
  responseMode: string
): string {
  // Chỉ áp dụng khi bot đang trong vai hỏi vặn hoặc vòi ví dụ
  if (
    responseMode === "mastered" ||
    responseMode === "acknowledge_explore"
  ) {
    return botResponse;
  }

  let sanitized = botResponse;
  const forbiddenPatterns = [
    /đáp án (đúng )?là[:\s].*?([.!?\n]|$)/gi,
    /thực ra đáp án là[:\s].*?([.!?\n]|$)/gi,
    /câu trả lời chuẩn xác là[:\s].*?([.!?\n]|$)/gi,
    /để mình giải thích luôn cho bạn nhé[:\s].*?([.!?\n]|$)/gi,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(
        pattern,
        "Nhưng mình muốn tự bạn tìm ra câu trả lời cơ, bạn thử đoán xem? "
      );
    }
  }

  return sanitized;
}

import { VALID_CURRICULUM_TOPICS } from "./knowledge-bank";

export interface ScopeCheckResult {
  isOutOfScope: boolean;
  isTopicSwitch?: boolean;
  switchTarget?: string;
  reason?: string;
  message?: string;
}

/**
 * Phát hiện học viên hỏi hoặc nói chuyện hoàn toàn ngoài phạm vi giáo trình bài giảng AI,
 * hoặc yêu cầu chuyển sang một chủ đề bài giảng khác.
 * Lưu ý: KHÔNG chặn nếu người dùng dùng từ đời thường trong ngữ cảnh ẩn dụ so sánh (ví dụ: "giống như nấu phở...").
 */
export function detectOutOfScopeMessage(
  userText: string,
  conceptName: string,
  lessonName?: string
): ScopeCheckResult {
  const clean = userText.toLowerCase().trim();
  if (clean.length < 3) {
    return { isOutOfScope: false };
  }

  // Nếu người dùng đang dùng hình ảnh so sánh ẩn dụ, tuyệt đối không chặn
  const analogyMarkers = [
    "giống như", "ví dụ như", "tương tự như", "như là", "như một",
    "ví như", "thí dụ", "hãy tưởng tượng", "so sánh với", "tựa như",
    "coi như", "nghĩ như", "tưởng như"
  ];
  const isAnalogy = analogyMarkers.some((m) => clean.includes(m));
  if (isAnalogy) {
    return { isOutOfScope: false };
  }

  // Xác định tên bài học chuẩn
  let activeLesson = lessonName || conceptName;
  if (!lessonName) {
    if (
      conceptName.toLowerCase().includes("d1") ||
      conceptName.toLowerCase().includes("foundation") ||
      conceptName.toLowerCase().includes("generative") ||
      conceptName.toLowerCase().includes("hallucination")
    ) {
      activeLesson = "Day 1: AI & LLM Foundation";
    } else if (
      conceptName.toLowerCase().includes("d2") ||
      conceptName.toLowerCase().includes("problem") ||
      conceptName.toLowerCase().includes("framing") ||
      conceptName.toLowerCase().includes("automation")
    ) {
      activeLesson = "Day 2: Xác định bài toán cho AI & Độ tự động hoá";
    }
  }

  const isLesson1 = activeLesson.toLowerCase().includes("day 1") || activeLesson.toLowerCase().includes("lesson 1") || activeLesson.toLowerCase().includes("foundation");
  const isLesson2 = activeLesson.toLowerCase().includes("day 2") || activeLesson.toLowerCase().includes("lesson 2") || activeLesson.toLowerCase().includes("bài toán") || activeLesson.toLowerCase().includes("problem");

  const lessonFocusMsg = isLesson1
    ? "Bài này chúng mình tập trung vào cơ chế bên trong LLM: next-token prediction, context window, ảo giác hallucination và Grounding/RAG."
    : isLesson2
    ? "Bài này chúng mình tập trung vào Quick Problem Card, Google PAIR ('Can AI solve this in a unique way?'), 3 cấp độ Rule vs Workflow vs Agent, và Human-in-the-loop (HITL)."
    : "Bài này chúng mình chỉ tập trung vào kiến thức trong bài thôi.";

  // 1. Danh sách các mẫu câu hỏi lạc đề kinh điển (ăn uống, thời tiết, giải toán phổ thông, tin tức, làm thơ...)
  const outOfScopePatterns: { pattern: RegExp; topic: string }[] = [
    { pattern: /(cách|hướng dẫn|công thức|nấu|làm|pha)\s+(nấu|làm|pha|ăn|uống)?\s*(phở|lẩu|bún|bánh|cơm|món)/i, topic: "ẩm thực" },
    { pattern: /(thời tiết|nhiệt độ|dự báo thời tiết)\s*(hôm nay|ngày mai|hà nội|sài gòn|tp hcm)?/i, topic: "thời tiết" },
    { pattern: /(tỷ số|kết quả|lịch thi đấu|trận đấu|đá banh|bóng đá)\s*(hôm nay|ngoại hạng|world cup|c1)?/i, topic: "thể thao" },
    { pattern: /(làm|viết|sáng tác)\s+(cho tôi\s+)?(bài thơ|thơ|bài hát|bài ca)/i, topic: "sáng tác thơ văn" },
    { pattern: /(giải|tính)\s+(phương trình|tích phân|đạo hàm|tam giác|hình thang)/i, topic: "toán học phổ thông" },
    { pattern: /(giá vàng|chứng khoán|bitcoin|crypto|tiền ảo)\s*(hôm nay|thế nào|bao nhiêu)?/i, topic: "tài chính / crypto" },
    { pattern: /(ai là|tiểu sử|tổng thống|chủ tịch|thủ tướng)\s+(nước mỹ|việt nam|pháp|nga)/i, topic: "chính trị / lịch sử" },
    { pattern: /(lái xe|mua xe|xe máy|ô tô|sửa xe|đi phượt|du lịch)\s*(honda|toyota|đà nẵng|sapa|ở đâu|thế nào)?/i, topic: "đời sống / du lịch" },
  ];

  for (const item of outOfScopePatterns) {
    if (item.pattern.test(clean)) {
      return {
        isOutOfScope: true,
        reason: item.topic,
        message: `Ơ bạn ơi, thuật ngữ này không thuộc phạm vi bài học '${activeLesson}' của chúng mình đâu! ${lessonFocusMsg} Bạn hãy tập trung giảng giải nội dung bài này cho mình nhé!`,
      };
    }
  }

  // 2. TỪ KHÓA BÀI HỌC VÀ FAST-TRACK
  const lesson1Keywords = [
    "token", "mảnh chữ", "context", "context window", "bàn làm việc", "next-token", "next token",
    "đoán từ", "xác suất", "predict", "attention", "transformer", "ảo giác", "hallucination",
    "bịa", "bịa chuyện", "bịa thông tin", "grounding", "rag", "tra sổ", "retrieval", "truy xuất",
    "trích xuất", "tài liệu", "doc", "document", "kho dữ liệu", "prompt", "temperature",
    "núm vặn", "kiểm chứng", "fact-checking", "llm", "ai", "thông tin từ ai", "generative"
  ];
  const lesson2Keywords = [
    "bài toán", "problem card", "problem statement", "quick card", "double diamond", "google pair",
    "pair", "reframe", "actor", "workflow", "quy trình", "nút thắt", "bottleneck", "hao phí",
    "baseline", "target", "metric", "chỉ số", "tự động hoá", "automation", "automate", "augment",
    "rule", "luật tĩnh", "script", "prompt chaining", "routing", "agent", "ai agent", "hitl",
    "human in the loop", "giám sát con người", "giám sát", "precision", "recall", "độ chính xác",
    "độ bao phủ", "false positive", "false negative", "báo động giả", "ai"
  ];

  // FAST-TRACK: Nếu câu nói chứa bất kỳ thuật ngữ nào thuộc bài học hiện tại -> 100% IN-SCOPE
  const currentKeywords = isLesson1 ? lesson1Keywords : isLesson2 ? lesson2Keywords : [...lesson1Keywords, ...lesson2Keywords];
  const isDirectlyInCurrentLesson = currentKeywords.some((kw) => {
    if (kw.length <= 2) return false;
    return clean.includes(kw);
  });
  if (isDirectlyInCurrentLesson) {
    return { isOutOfScope: false };
  }

  // 3. Kiểm tra nếu người dùng muốn hỏi chuyển sang một thuật ngữ bài học khác (Topic Switch)
  for (const topic of VALID_CURRICULUM_TOPICS) {
    const isTopicInLesson1 = topic.keywords.some((kw) => lesson1Keywords.some((l1) => kw.includes(l1)));
    const isTopicInLesson2 = topic.keywords.some((kw) => lesson2Keywords.some((l2) => kw.includes(l2)));

    // Nếu đang ở Lesson 1 và người dùng nhắc tới thuật ngữ thuộc Lesson 2 hoặc chủ đề khác
    const isOtherTopic = isLesson1 ? !isTopicInLesson1 : isLesson2 ? !isTopicInLesson2 : true;

    if (isOtherTopic) {
      for (const kw of topic.keywords) {
        if (kw.length < 3) continue;
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|[^a-z0-9à-ỹ])${escaped}([^a-z0-9à-ỹ]|$)`, "i");
        if (regex.test(clean)) {
          // Chỉ coi là hỏi chuyển chủ đề khi người dùng chủ động hỏi định nghĩa/chuyển bài bằng câu hỏi rõ ràng
          const questionTrigger = /(là gì|thế nào|như thế nào|ra sao|cho mình hỏi|bạn biết gì về|nói về|chuyển sang|dạy về|giải thích về)\b/i.test(clean);
          if (questionTrigger) {
            return {
              isOutOfScope: false,
              isTopicSwitch: true,
              switchTarget: topic.name,
              message: `Khoan đã bạn ơi, mình vẫn chưa hiểu hoàn toàn về '${activeLesson}' đâu! Bạn có thực sự muốn nói về "${topic.name}" không?`,
            };
          }
        }
      }
    }
  }

  // 4. Nếu người dùng hỏi chung chung về một từ hoàn toàn không thuộc bài học và không phải AI
  const genericQuestionPattern = /^(bạn có biết|cho tôi hỏi|hướng dẫn|cách|giải thích|nói về|cho hỏi)\s+([a-z0-9à-ỹ\s]+)(\?|\.|$)/i;
  const matchGeneric = clean.match(genericQuestionPattern);
  if (matchGeneric) {
    const queryTerm = matchGeneric[2].trim();
    const isGeneralAi = ["ai", "mô hình", "dữ liệu", "thông tin", "kiểm chứng", "công nghệ", "máy tính"].some((w) => queryTerm.includes(w));
    if (!isGeneralAi) {
      const isCurriculum = VALID_CURRICULUM_TOPICS.some((t) =>
        t.keywords.some((kw) => queryTerm.includes(kw))
      );
      if (!isCurriculum && queryTerm.length > 2) {
        return {
          isOutOfScope: true,
          reason: queryTerm,
          message: `Ơ bạn ơi, thuật ngữ này không thuộc phạm vi bài học '${activeLesson}' của chúng mình đâu! ${lessonFocusMsg} Bạn hãy tập trung giảng giải nội dung bài này cho mình nhé!`,
        };
      }
    }
  }

  return { isOutOfScope: false };
}
