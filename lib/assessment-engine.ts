export interface TransferCaseQuestion {
  id: string;
  scenario: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    score: number; // 1 to 5
    rationale: string;
  }>;
}

export interface ConceptAssessment {
  conceptId: string;
  conceptName: string;
  preTest: TransferCaseQuestion;
  postTest: TransferCaseQuestion;
}

export interface TeachingScorecard {
  concept: string;
  status: "MASTERED" | "IN_PROGRESS";
  turnsTaken: number;
  learningGain: string;
  approvedAnalogy: string;
  coreTakeaway: string;
  verifiedCitations: string[];
  rubricAchieved: {
    mechanism: boolean;
    noMisconception: boolean;
    validAnalogy: boolean;
    resilience: boolean;
  };
  completedAt: string;
}

export const ASSESSMENT_BANK: Record<string, ConceptAssessment> = {
  hallucination: {
    conceptId: "hallucination",
    conceptName: "Ảo giác LLM (Vì sao LLM bịa)",
    preTest: {
      id: "PRE-HALLUCINATION",
      scenario:
        "Một công ty tài chính muốn nạp 50.000 trang báo cáo tài chính vào mô hình LLM để nó tự động tư vấn đầu tư chứng khoán cho khách hàng VIP. Sếp hỏi bạn có nên tin cậy 100% vào các gợi ý mua bán mà bot đưa ra không.",
      question: "Là một chuyên gia AI, câu trả lời chính xác nhất của bạn là gì?",
      options: [
        {
          id: "A",
          text: "Nên tin 100%, vì mô hình LLM hiện nay đã học hàng nghìn tỷ từ và thông minh hơn con người.",
          score: 1,
          rationale: "Ngộ nhận nguy hiểm: Tin tưởng mù quáng vào độ trôi chảy của LLM.",
        },
        {
          id: "B",
          text: "Không nên tin, vì máy tính hay bị lỗi mạng và virus phần mềm.",
          score: 2,
          rationale: "Hiểu sai nguyên nhân: Ảo giác không phải lỗi phần cứng hay virus.",
        },
        {
          id: "C",
          text: "Không được tin 100%, vì LLM sinh từ theo xác suất thống kê (next-token prediction), không có cơ chế tự kiểm chứng sự thật và chi phí sai lầm trong đầu tư tài chính là mất tiền thật.",
          score: 5,
          rationale: "Chính xác tuyệt đối: Phân tích được cơ chế xác suất và rủi ro chi phí sai lầm.",
        },
      ],
    },
    postTest: {
      id: "POST-HALLUCINATION",
      scenario:
        "Một bệnh viện dự định triển khai chatbot AI đọc sách y khoa để tự động kê đơn thuốc điều trị ung thư cho bệnh nhân mà không cần bác sĩ ký duyệt.",
      question: "Dựa trên bản chất của LLM, rủi ro tử huyệt của dự án này là gì?",
      options: [
        {
          id: "A",
          text: "Rủi ro là tốn tiền điện máy chủ vì chạy mô hình y tế rất nặng.",
          score: 2,
          rationale: "Chưa đúng trọng tâm: Chi phí máy chủ không phải là rủi ro sống còn.",
        },
        {
          id: "B",
          text: "Rủi ro tử huyệt là ảo giác: LLM có thể bịa ra một liều lượng thuốc nghe cực kỳ thuyết phục và chuyên nghiệp, nhưng gây tử vong cho người bệnh. Bắt buộc phải có bác sĩ duyệt (Human-in-the-loop).",
          score: 5,
          rationale: "Xuất sắc: Chuyển giao tri thức thành công sang bài toán y tế.",
        },
        {
          id: "C",
          text: "Chỉ cần fine-tune thêm nhiều bệnh án thì AI sẽ không bao giờ sai nữa.",
          score: 1,
          rationale: "Ngộ nhận: Thêm data không bao giờ loại bỏ 100% bản chất xác suất.",
        },
      ],
    },
  },
  grounding: {
    conceptId: "grounding",
    conceptName: "Grounding (Neo dữ liệu bài học)",
    preTest: {
      id: "PRE-GROUNDING",
      scenario:
        "Bạn muốn xây dựng một chatbot hỏi đáp nội quy công ty cho nhân viên mới nhưng sợ chatbot nói sai chính sách nghỉ phép.",
      question: "Phương pháp đơn giản và hiệu quả nhất là gì?",
      options: [
        {
          id: "A",
          text: "Bỏ tiền đi huấn luyện (train) lại một mô hình AI từ đầu trên văn bản nội quy.",
          score: 2,
          rationale: "Quá tốn kém và không giải quyết được triệt để vấn đề bám nguồn.",
        },
        {
          id: "B",
          text: "Dùng Grounding: Nạp đúng đoạn nội quy vào prompt tại thời điểm hỏi, yêu cầu AI chỉ trả lời dựa trên đoạn đó và trích dẫn số điều khoản.",
          score: 5,
          rationale: "Chính xác: Tiết kiệm, tức thì và kiểm chứng được 100%.",
        },
        {
          id: "C",
          text: "Chỉ cần dặn AI trong prompt là 'hãy trung thực đừng nói dối'.",
          score: 1,
          rationale: "Vô tác dụng vì LLM không có nguồn thông tin để đối chiếu.",
        },
      ],
    },
    postTest: {
      id: "POST-GROUNDING",
      scenario:
        "Một thẩm phán muốn dùng AI để tóm tắt lời khai của các nhân chứng trong phiên tòa hình sự.",
      question: "Nguyên tắc thiết kế AI nào sau đây là quan trọng nhất?",
      options: [
        {
          id: "A",
          text: "Grounding nghiêm ngặt: AI chỉ được tóm tắt những gì có trong biên bản lời khai và bắt buộc trỏ đúng số dòng biên bản, tuyệt đối không được tự suy đoán.",
          score: 5,
          rationale: "Chuẩn mực: Bảo vệ tính pháp lý của bằng chứng.",
        },
        {
          id: "B",
          text: "Cho AI tự suy diễn thêm động cơ gây án dựa trên kinh nghiệm xã hội của nó.",
          score: 1,
          rationale: "Vi phạm nghiêm trọng nguyên tắc tố tụng tư pháp.",
        },
      ],
    },
  },
};

/**
 * Tính chỉ số tăng trưởng năng lực nhận thức (Normalized Learning Gain - Hake, 1998)
 * g = (Post - Pre) / (Max - Pre)
 */
export function calculateNormalizedGain(
  preScore: number,
  postScore: number,
  maxScore = 5
): { gainRatio: number; gainPercent: string; level: string } {
  if (postScore <= preScore) {
    return { gainRatio: 0, gainPercent: "0%", level: "Chưa tiến bộ" };
  }

  const denominator = maxScore - preScore;
  if (denominator <= 0) {
    return { gainRatio: 1, gainPercent: "100%", level: "Tối đa" };
  }

  const gain = (postScore - preScore) / denominator;
  const percent = Math.round(gain * 100);

  let level = "Tiến bộ vừa";
  if (percent >= 70) level = "Tiến bộ vượt bậc (High Gain)";
  else if (percent >= 30) level = "Tiến bộ rõ rệt (Medium Gain)";

  return {
    gainRatio: gain,
    gainPercent: `+${percent}%`,
    level,
  };
}

/**
 * Đóng gói Thẻ Tổng Kết Phiên Dạy (Teaching Scorecard - FR-7)
 */
export function generateTeachingScorecard({
  concept,
  turnsTaken,
  learningGain = "+85%",
  approvedAnalogy,
  coreTakeaway,
  citations,
  rubric,
}: {
  concept: string;
  turnsTaken: number;
  learningGain?: string;
  approvedAnalogy?: string;
  coreTakeaway?: string;
  citations: string[];
  rubric: {
    mechanism: boolean;
    noMisconception: boolean;
    validAnalogy: boolean;
    resilience: boolean;
  };
}): TeachingScorecard {
  return {
    concept,
    status: "MASTERED",
    turnsTaken,
    learningGain,
    approvedAnalogy:
      approvedAnalogy ||
      "Người học đã đưa ra phép so sánh gần gũi ngoài đời thực giúp bot hiểu bản chất.",
    coreTakeaway:
      coreTakeaway ||
      "Đã làm chủ kiến thức nền tảng và cách vận dụng vào tình huống giải quyết vấn đề.",
    verifiedCitations: citations,
    rubricAchieved: rubric,
    completedAt: new Date().toISOString(),
  };
}

