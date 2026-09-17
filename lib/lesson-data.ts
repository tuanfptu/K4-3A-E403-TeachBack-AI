export type SlideReference = {
  range: string;
  slide: number;
  topic: string;
  note: string;
  takeaway: string;
};

export type Question = {
  id: number;
  concept: string;
  prompt: string;
  hint: string;
  source: SlideReference;
  hasChallenge?: boolean;
  followUp: string;
  understood: string;
  stillUnsure: string;
  success: string;
  covered: string[];
};

export type Lesson = {
  id: number;
  label: string;
  shortTitle: string;
  title: string;
  description: string;
  time: string;
  accent: string;
  completionTopics: string[];
  questions: Question[];
};

export const lessons: Lesson[] = [
  {
    id: 1,
    label: "Day 1",
    shortTitle: "AI & LLM Foundation",
    title: "Day 1: AI & LLM Foundation",
    description:
      "Bên trong LLM: cơ chế next-token prediction, context window (bàn làm việc có hạn), ảo giác (hallucination) và giải pháp Grounding / RAG.",
    time: "10–15 min",
    accent: "from-[#5b5ce2] to-[#7778f3]",
    completionTopics: [
      "Next-token prediction (predict → append → rerun)",
      "Token và Context Window (bàn làm việc có hạn)",
      "Attention Mechanism trong Transformer",
      "Ảo giác LLM (Hallucination)",
      "Grounding & RAG ('Cho tra sổ thay vì bắt nhớ')",
    ],
    questions: [
      {
        id: 1,
        concept: "Next-token prediction",
        prompt: "Tại sao LLM có thể nói rất trôi chảy nhưng lại có thể bịa sai sự thật?",
        hint: "Nghĩ về cơ chế dự đoán token tiếp theo theo phân phối xác suất thống kê thay vì tra cứu sự thật khách quan.",
        source: {
          range: "Day 1 · Slide 11–12 & 20",
          slide: 20,
          topic: "Predict → append → rerun & Ảo giác",
          note: "Xem lại slide 11-12 về phân bố xác suất token và slide 20 về giới hạn 'nói chắc như đúng rồi'.",
          takeaway: "Sự trôi chảy (fluency) và tính chính xác (accuracy) là hai việc hoàn toàn khác nhau.",
        },
        hasChallenge: true,
        followUp: "Nếu mô hình không biết đáp án đúng, làm sao nó vẫn sinh ra được câu trả lời tự tin đến vậy?",
        understood: "LLM ghép từ tiếp theo theo xác suất thống kê dựa trên dữ liệu đã học.",
        stillUnsure: "Tại sao điều đó lại dẫn đến câu trả lời tự tin nhưng sai lệch.",
        success: "Chính xác! Mô hình chỉ tối ưu cho câu nghe hợp lý nhất theo xác suất chứ không kiểm tra chân lý.",
        covered: ["Next-token prediction", "Fluency vs Accuracy"],
      },
      {
        id: 2,
        concept: "Context Window",
        prompt: "Context window trong LLM hoạt động như thế nào và tại sao lại ví nó như một bàn làm việc có hạn?",
        hint: "Nghĩ về việc mọi tài liệu muốn AI thấy đều phải bày lên bàn, và hiện tượng để đồ ở giữa bàn dễ bị quên.",
        source: {
          range: "Day 1 · Slide 13–14",
          slide: 14,
          topic: "Context: bàn làm việc có hạn",
          note: "Xem slide 14 về quy đổi token và hiện tượng đồ ở giữa bàn dễ bị bỏ sót (lost in the middle).",
          takeaway: "Bàn rộng không có nghĩa là dùng tốt; context càng dài càng chậm và tốn chi phí.",
        },
        followUp: "Nếu đưa một tài liệu rất dài vào prompt thì rủi ro gì sẽ xảy ra?",
        understood: "Context là lượng chữ tối đa mô hình có thể quan sát cùng lúc.",
        stillUnsure: "Hiện tượng lost in the middle và chi phí token.",
        success: "Rất chuẩn! Bàn làm việc có hạn, thông tin quan trọng cần đặt ở đầu hoặc cuối prompt.",
        covered: ["Context window", "Lost in the middle"],
      },
      {
        id: 3,
        concept: "Grounding & RAG",
        prompt: "Nguyên tắc 'Cho tra sổ thay vì bắt nhớ' (Grounding & RAG) giúp giảm thiểu ảo giác như thế nào?",
        hint: "Nghĩ về sự khác nhau giữa việc bắt học sinh nhớ toàn bộ sách giáo khoa và việc cho mở sách tra cứu đúng trang cần thiết.",
        source: {
          range: "Day 1 · Slide 16",
          slide: 16,
          topic: "Cho tra sổ thay vì bắt nhớ",
          note: "Xem slide 16: giữ bàn làm việc sạch và cho AI tra cứu tài liệu nghiệp vụ thay vì bắt nhớ bằng trọng số.",
          takeaway: "Grounding kết nối câu trả lời với tài liệu tham chiếu tin cậy trực tiếp trong context.",
        },
        followUp: "Quy trình 2 bước của RAG gồm những khâu nào?",
        understood: "RAG gồm bước 1 Truy xuất tài liệu và bước 2 Đưa vào prompt để tạo sinh câu trả lời.",
        stillUnsure: "Tại sao không để AI tự trả lời bằng trí nhớ sẵn có.",
        success: "Đúng rồi! Thay vì bắt mô hình nhớ, RAG trích xuất đúng đoạn tài liệu tin cậy đưa vào context tại thời điểm sinh.",
        covered: ["Grounding", "RAG 2 bước"],
      },
      {
        id: 4,
        concept: "Temperature",
        prompt: "Temperature trong mô hình LLM là gì và tại sao người ta gọi nó là núm vặn độ liều?",
        hint: "Nghĩ về cách thay đổi phân phối xác suất khi chọn từ: chọn từ chắc nhất hay thử các từ ngẫu nhiên.",
        source: {
          range: "Day 1 · Slide 29",
          slide: 29,
          topic: "Hai núm vặn: temperature & top_p",
          note: "Xem slide 29: T=0 luôn chọn từ chắc nhất, T=1 phân phối dãn ra tạo độ biến thiên sáng tạo.",
          takeaway: "T=0 hợp code và phân tích; T cao hợp viết sáng tạo nhưng dễ lệch hướng.",
        },
        followUp: "Khi nào ta nên đặt Temperature = 0?",
        understood: "Temperature điều chỉnh mức độ ngẫu nhiên khi chọn token tiếp theo.",
        stillUnsure: "Khi nào cần ổn định và khi nào cần sáng tạo.",
        success: "Chuẩn xác! T=0 giúp câu trả lời lặp lại ổn định, rất quan trọng cho trích xuất dữ liệu và viết code.",
        covered: ["Temperature", "Xác suất lấy mẫu"],
      },
    ],
  },
  {
    id: 2,
    label: "Day 2",
    shortTitle: "Xác định bài toán AI",
    title: "Day 2: Xác định bài toán cho AI & Độ tự động hoá",
    description:
      "Từ yêu cầu mơ hồ đến Problem Statement rõ ràng: Google PAIR ('Can AI solve this in a unique way?'), 3 Cấp độ Rule vs Workflow vs Agent, và Human-in-the-loop (HITL).",
    time: "10–15 min",
    accent: "from-[#0f8f82] to-[#32a99b]",
    completionTopics: [
      "Google PAIR Reframe (Hỏi về bài toán trước, về AI sau)",
      "Quick Problem Card (5 thành tố định hình bài toán)",
      "Khi nào NÊN vs KHÔNG NÊN dùng AI",
      "3 Cấp độ giải pháp (Rule tĩnh vs Workflow vs Agent)",
      "Thiết kế khi AI sai & Giám sát con người (HITL)",
    ],
    questions: [
      {
        id: 1,
        concept: "Google PAIR Reframe",
        prompt: "Google PAIR khuyên chúng ta nên thay đổi câu hỏi 'Có thể dùng AI làm gì?' thành những câu hỏi nào?",
        hint: "Nghĩ về việc tập trung vào vấn đề thực tế trước, và tự hỏi liệu AI có giải quyết được theo cách độc đáo mà rule-based không làm được hay không.",
        source: {
          range: "Day 2 · Slide 8",
          slide: 8,
          topic: "Reframe câu hỏi theo Google PAIR",
          note: "Xem slide 8: 'How might we solve...?' và 'Can AI solve this in a unique way?'.",
          takeaway: "Hỏi về bài toán trước, về AI sau — AI chỉ là một phương án trong nhiều phương án khả dĩ.",
        },
        hasChallenge: true,
        followUp: "Tại sao nhảy ngay vào xây dựng chatbot/agent (Solution-first) lại là một sai lầm phổ biến?",
        understood: "Cần tìm đúng vấn đề trước khi chọn giải pháp AI.",
        stillUnsure: "Cách đánh giá xem bài toán có thực sự cần AI độc đáo hay không.",
        success: "Chính xác! Giải pháp xuất sắc cho sai vấn đề có thể còn tệ hơn là không có giải pháp nào.",
        covered: ["Google PAIR", "Problem-first vs Solution-first"],
      },
      {
        id: 2,
        concept: "Quick Problem Card",
        prompt: "Khung Quick Problem Card gồm 5 yếu tố nào để biến yêu cầu mơ hồ thành bài toán rõ ràng?",
        hint: "Nhớ lại: Bài toán 1 câu, Đối tượng ảnh hưởng (Actor), Quy trình (Workflow), Nút thắt & Hao phí (Bottleneck & Impact), Chỉ số thành công (Success Metric).",
        source: {
          range: "Day 2 · Slide 9–10",
          slide: 9,
          topic: "Quick Problem Card",
          note: "Xem slide 9-10 về khung định hình bài toán và định lượng hóa hao phí (Baseline vs Target).",
          takeaway: "Lượng hóa hao phí và nút thắt quy trình trước khi bắt tay viết code.",
        },
        followUp: "Nếu không có Baseline (mức hao phí hiện tại) thì việc đánh giá AI sẽ gặp khó khăn gì?",
        understood: "Quick Problem Card định hình rõ ràng bài toán, đối tượng, quy trình, nút thắt và metric.",
        stillUnsure: "Tầm quan trọng của việc đo lường Baseline con số cụ thể.",
        success: "Tuyệt vời! Không có baseline cụ thể thì không thể chứng minh được giải pháp AI có thực sự mang lại hiệu quả hay không.",
        covered: ["Problem Card", "Baseline & Target"],
      },
      {
        id: 3,
        concept: "3 Cấp độ giải pháp",
        prompt: "Ba cấp độ giải pháp Rule tĩnh, Workflow và AI Agent khác nhau như thế nào, và khi nào thì KHÔNG nên dùng AI?",
        hint: "Nghĩ về cây quyết định (Decision Tree): khi logic là if/else cố định 100% hoặc lỗi quá tốn kém thì nên dùng Cấp độ 1 (Rule); cần chuỗi bước kết hợp LLM thì dùng Cấp độ 2 (Workflow); cần tự động chia bước phức tạp mới dùng Cấp độ 3 (Agent).",
        source: {
          range: "Day 2 · Slide 17–21",
          slide: 21,
          topic: "Decision Tree: Rule vs Workflow vs Agent",
          note: "Xem slide 17-21: mỗi nhánh 'KHÔNG' là một lần tránh được độ phức tạp không cần thiết.",
          takeaway: "Đi từ đơn giản đến phức tạp: Rule tĩnh → Workflow (Prompt Chaining) → AI Agent.",
        },
        followUp: "Ví dụ nào trong thực tế chỉ nên dùng Rule tĩnh mà tuyệt đối không nên gọi LLM?",
        understood: "Phân biệt rõ 3 cấp độ giải pháp và biết khi nào nên tránh dùng AI.",
        stillUnsure: "Ranh giới giữa Workflow và Agent.",
        success: "Rất chuẩn xác! Tính thuế, lọc spam từ khóa, logic nghiệp vụ cố định thì cứ dùng Rule tĩnh cho rẻ, nhanh và chính xác 100%.",
        covered: ["Rule vs Workflow vs Agent", "Decision Tree"],
      },
      {
        id: 4,
        concept: "Human-in-the-loop (HITL)",
        prompt: "Tại sao trong thiết kế sản phẩm AI luôn cần có cơ chế giám sát con người (Human-in-the-loop) và xử lý khi AI đoán sai?",
        hint: "Nghĩ về ma trận nhầm lẫn (False Positive / False Negative) và mẫu thiết kế PAIR template: nếu AI đoán sai vượt ngưỡng thì hạ cấp về trợ lý gợi ý (Copilot) thay vì gửi thẳng.",
        source: {
          range: "Day 2 · Slide 22–24",
          slide: 24,
          topic: "Reward function & HITL",
          note: "Xem slide 22-24 về trade-off Precision/Recall và template hành động khi tỷ lệ sửa vượt ngưỡng.",
          takeaway: "Thiết kế cơ chế an toàn và giám sát con người trước khi cho AI tự động hóa hoàn toàn.",
        },
        followUp: "Khác biệt giữa chế độ Automate (AI làm thay) và Augment (AI trợ giúp con người) là gì?",
        understood: "Cần cơ chế giám sát con người (HITL) để kiểm soát rủi ro khi AI sinh kết quả sai.",
        stillUnsure: "Cách cân bằng giữa Precision và Recall trong trải nghiệm người dùng.",
        success: "Chính xác! Con người luôn là lớp chốt chặn cuối cùng (Human-in-the-loop) đối với các quyết định quan trọng.",
        covered: ["HITL", "Automate vs Augment"],
      },
    ],
  },
];

export const getLesson = (id: number) => lessons.find((lesson) => lesson.id === id) ?? lessons[0];
