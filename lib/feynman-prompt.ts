export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface EvaluationPoint {
  id: string;
  title: string;
  description: string;
  hint: string;
}

export interface AnswerEvaluationResponse {
  bot_response: string;
  response_mode: "partial" | "needs_revision" | "mastered";
  understanding_level: 1 | 2 | 3;
  question_mastered: boolean;
  mastered_point_ids: string[];
  missing_point_ids: string[];
  evaluation: {
    correct_points: Array<{
      id: string;
      evidence: string;
      feedback: string;
    }>;
    incorrect_claims: Array<{
      claim: string;
      correction: string;
    }>;
    newly_mastered_point_ids: string[];
    invalidated_point_ids: string[];
  };
  feedback_summary: {
    what_you_did_well: string;
    missing_or_vague: string;
  };
  hint: string | null;
  citation: string;
}

interface BuildEvaluationPromptInput {
  lessonTitle: string;
  question: string;
  referenceAnswer: string;
  requiredPoints: EvaluationPoint[];
  alreadyMasteredPointIds: string[];
  citation: string;
  supplementalGrounding?: string;
}

/**
 * Prompt chấm Teach-Back theo từng ý. Không gán nhân vật/tuổi/vai cho mô hình.
 */
export function buildAnswerEvaluationPrompt({
  lessonTitle,
  question,
  referenceAnswer,
  requiredPoints,
  alreadyMasteredPointIds,
  citation,
  supplementalGrounding,
}: BuildEvaluationPromptInput): string {
  const pointList = requiredPoints
    .map(
      (point) =>
        `- ${point.id} — ${point.title}: ${point.description}\n  Gợi ý nhỏ nếu còn thiếu: ${point.hint}`
    )
    .join("\n");

  return `## NHIỆM VỤ
Đánh giá câu trả lời của người học cho một câu hỏi Teach-Back. Không nhập vai học sinh, giáo viên hay bất kỳ nhân vật nào. Không yêu cầu người học đóng vai dạy lại cho bạn. Chỉ đánh giá mức độ hiểu, phản hồi ngắn gọn và đặt câu hỏi/gợi ý tiếp theo khi còn thiếu.

## BÀI HỌC VÀ CÂU HỎI CỐ ĐỊNH
- Bài học: ${lessonTitle}
- Câu hỏi: ${question}
- Nguồn: ${citation}

## ĐÁP ÁN THAM CHIẾU
${referenceAnswer}

## CÁC Ý BẮT BUỘC
${pointList}

## TRẠNG THÁI ĐÃ ĐƯỢC CÔNG NHẬN Ở CÁC LƯỢT TRƯỚC
${alreadyMasteredPointIds.length > 0 ? alreadyMasteredPointIds.join(", ") : "Chưa có ý nào."}

${supplementalGrounding ? `## NGỮ CẢNH BỔ SUNG TỪ DATA\n${supplementalGrounding}\n` : ""}
## NGUYÊN TẮC CHẤM
1. Chấm theo NGHĨA, không chấm khớp từ. Cách nói đời thường, ví dụ đúng hoặc diễn đạt khác slide vẫn được công nhận.
2. Một câu trả lời có thể vừa đúng một phần vừa sai một phần. Phải tách riêng:
   - Ý đúng: công nhận rõ ràng, trích ngắn phần thể hiện sự hiểu.
   - Ý sai: nêu chính xác điều sai và phủ định/sửa lại trực tiếp, lịch sự.
   - Ý thiếu: chỉ gợi mở phần còn thiếu; không lặp lại hay bắt người học trả lời lại ý đã đúng.
3. Không tự động công nhận cả một ý chỉ vì xuất hiện một từ khóa. Chỉ đánh dấu khi câu trả lời cho thấy người học hiểu quan hệ hoặc cơ chế của ý đó.
4. Nếu câu trả lời mới mâu thuẫn trực tiếp với một ý đã được công nhận, đưa id đó vào invalidated_point_ids.
5. Không bắt buộc ẩn dụ, jargon hay câu chữ sách giáo khoa. Không dùng các tiêu chí ngoài required points.
6. Chỉ dùng response_mode = "mastered" khi sau lượt này TẤT CẢ required point đều đã được làm rõ và không còn khẳng định sai chưa được sửa trong lượt hiện tại.
7. Khi chưa hoàn tất, trường hint và phần cuối bot_response chỉ gợi ý 1 ý còn thiếu quan trọng nhất. Tuyệt đối không chép toàn bộ đáp án mẫu.
8. Viết tiếng Việt tự nhiên, súc tích. Tránh tâng bốc. Không nhắc rằng bạn đang nhập vai hoặc gọi người dùng là giáo viên.

## CÁCH CHỌN TRẠNG THÁI
- partial: có ít nhất một ý đúng mới, nhưng vẫn còn ý thiếu và không có lỗi nghiêm trọng chi phối câu trả lời.
- needs_revision: có khẳng định sai cần sửa, hoặc chưa chứng minh được ý bắt buộc nào.
- mastered: toàn bộ ý bắt buộc đã được hiểu đúng qua các lượt.

## JSON BẮT BUỘC
Chỉ trả về đúng một object JSON hợp lệ, không markdown, theo schema:
{
  "bot_response": "Phản hồi gồm: công nhận ý đúng; sửa ý sai nếu có; gợi mở đúng một ý còn thiếu. Nếu đã đủ thì thông báo hoàn thành câu hỏi.",
  "response_mode": "partial" | "needs_revision" | "mastered",
  "understanding_level": 1 | 2 | 3,
  "question_mastered": true | false,
  "evaluation": {
    "correct_points": [
      { "id": "id thuộc required points", "evidence": "đoạn ý ngắn từ câu trả lời", "feedback": "vì sao ý này đúng" }
    ],
    "incorrect_claims": [
      { "claim": "khẳng định sai của người học", "correction": "phủ định và sửa lại ngắn gọn theo nguồn" }
    ],
    "newly_mastered_point_ids": ["chỉ các id mới được chứng minh trong lượt này"],
    "invalidated_point_ids": ["id đã được công nhận trước nhưng bị câu mới phủ định/mâu thuẫn"]
  },
  "feedback_summary": {
    "what_you_did_well": "chỉ nêu các ý đúng trong lượt này; để trống nếu chưa có",
    "missing_or_vague": "chỉ nêu phần còn thiếu hoặc sai; để trống nếu đã đủ"
  },
  "hint": "một gợi ý nhỏ cho đúng một ý còn thiếu, hoặc null khi đã đủ",
  "citation": "${citation}"
}`;
}
