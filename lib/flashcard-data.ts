export interface FlashcardItem {
  id: string;
  lessonId: number;
  lessonLabel: string;
  concept: string;
  icon: string;
  badgeColor: string;
  slideRange: string;
  // Mặt trước
  frontPrompt: string;
  frontHint: string;
  // Mặt sau
  mechanism: string;
  analogy: string;
  takeaway: string;
}

export const FLASHCARD_DECKS: Record<number, FlashcardItem[]> = {
  1: [
    {
      id: "d1-next-token",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Next-token prediction",
      icon: "🎲",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      slideRange: "Day 1 · Slide 11–12 & 20",
      frontPrompt: "Tại sao LLM có thể nói rất trôi chảy nhưng lại có thể bịa sai sự thật (ảo giác)?",
      frontHint: "Nghĩ về cơ chế vòng lặp dự đoán từ tiếp theo dựa trên xác suất thống kê.",
      mechanism:
        "LLM hoạt động theo vòng lặp (predict → append → rerun). Nó chỉ tính toán phân bố xác suất cho mảnh chữ (token) tiếp theo để câu nghe tự nhiên và hợp lý nhất, hoàn toàn không tự đi tra cứu hay kiểm chứng chân lý khách quan.",
      analogy:
        "Giống như tính năng gợi ý từ trên bàn phím điện thoại: nó đoán từ tiếp theo bạn hay gõ để câu trôi chảy, chứ nó không biết câu đó đúng hay sai sự thật ngoài đời.",
      takeaway:
        "Sự trôi chảy (fluency) và tính chính xác (accuracy) là hai khái niệm hoàn toàn tách biệt. Đừng tin thông tin chỉ vì nó được viết mượt mà!",
    },
    {
      id: "d1-context-window",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Context Window",
      icon: "💼",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      slideRange: "Day 1 · Slide 15–18",
      frontPrompt: "Tại sao không thể nhét toàn bộ tài liệu thư viện vào prompt một lần cho AI đọc hết?",
      frontHint: "Nghĩ về giới hạn bàn làm việc, chi phí/độ trễ và hiện tượng 'Lost in the middle'.",
      mechanism:
        "Context Window là không gian làm việc tức thời hữu hạn của mô hình. Nhồi tài liệu quá lớn sẽ làm tăng vọt chi phí tính toán (bình phương theo độ dài do cơ chế Attention), tăng độ trễ và khiến mô hình dễ bị bỏ sót thông tin nằm ở đoạn giữa.",
      analogy:
        "Context Window giống như mặt bàn làm việc có hạn của một chuyên viên: bày lên vài cuốn sổ quan trọng thì đọc rất nhanh và kỹ, nhưng nếu đổ cả kho thư viện lên bàn thì vừa chật chội, vừa tốn thời gian bới tìm và dễ bỏ quên tài liệu nằm ở đáy.",
      takeaway:
        "Chỉ đưa vào Context những mảnh thông tin chắt lọc và liên quan trực tiếp nhất đến câu hỏi thay vì nhồi toàn bộ văn bản thô.",
    },
    {
      id: "d1-grounding-rag",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Grounding & RAG",
      icon: "🔍",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      slideRange: "Day 1 · Slide 20–25",
      frontPrompt: "Tại sao nguyên tắc 'Cho tra sổ thay vì bắt nhớ' (Grounding & RAG) lại giúp giảm ảo giác?",
      frontHint: "Nghĩ về sự khác nhau giữa thi mở tài liệu và thi bắt học thuộc lòng.",
      mechanism:
        "RAG (Retrieval-Augmented Generation) truy xuất đúng đoạn văn bản uy tín từ kho dữ liệu bên ngoài rồi chèn vào prompt làm bằng chứng (Grounding). Mô hình sẽ dựa vào bằng chứng này để tổng hợp câu trả lời thay vì chỉ dựa vào trí nhớ trọng số.",
      analogy:
        "Giống như kỳ thi đề mở: thay vì bắt bác sĩ phải nhớ thuộc lòng từng liều lượng thuốc của hàng nghìn bệnh nhân, ta phát cho bác sĩ cuốn phác đồ điều trị chuẩn để tra cứu ngay trước khi kê đơn.",
      takeaway:
        "RAG giúp giảm mạnh ảo giác nhưng không triệt tiêu 100%. Nếu tài liệu đưa vào bị sai hoặc mô hình đọc nhầm, nó vẫn có thể đưa ra kết luận sai lệch.",
    },
    {
      id: "d1-temperature",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Núm vặn Temperature",
      icon: "🌡️",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      slideRange: "Day 1 · Slide 26–28",
      frontPrompt: "Tại sao Temperature được gọi là 'núm vặn độ liều' và ảnh hưởng thế nào đến câu trả lời?",
      frontHint: "Nghĩ về cách san phẳng hoặc kéo dốc phân bố xác suất chọn token.",
      mechanism:
        "Temperature điều chỉnh độ phẳng của phân bố xác suất chọn token. T=0 mô hình luôn chọn token có xác suất cao nhất (ổn định, lặp lại). T càng cao, các từ xác suất thấp càng có cơ hội được chọn (sáng tạo, đa dạng nhưng dễ lạc đề/bịa).",
      analogy:
        "T=0 giống như người kế toán cẩn thận: luôn chọn đáp án an toàn và chắc chắn nhất. T=0.8 giống như nhà thơ ngẫu hứng: sẵn sàng chọn từ ngữ bất ngờ, độc lạ nhưng thỉnh thoảng nói những câu phi lý.",
      takeaway:
        "Dùng T=0 đến 0.2 cho lập trình, tính toán và trích xuất dữ kiện. Dùng T=0.7 đến 1.0 cho viết truyện, brainstorming ý tưởng.",
    },
  ],
  2: [
    {
      id: "d2-pair-reframe",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Google PAIR Reframe",
      icon: "🎯",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      slideRange: "Day 2 · Slide 8–10",
      frontPrompt: "Google PAIR khuyên chúng ta nên thay đổi tư duy đặt câu hỏi về AI như thế nào?",
      frontHint: "Đổi từ 'Có thể dùng AI làm gì?' sang cách tiếp cận bài toán.",
      mechanism:
        "Tránh bẫy 'Có búa đi tìm đinh' (solution-first). Thay vì hỏi 'AI làm được gì ở đây?', Google PAIR khuyên hỏi 2 câu: (1) 'Người dùng đang gặp khó khăn gì và giải quyết thế nào?' và (2) 'AI có mang lại giá trị độc đáo mà cách giải truyền thống không làm được không?'.",
      analogy:
        "Giống như việc xây nhà: đừng mua trước một chiếc cần cẩu khổng lồ rồi loay hoay tìm việc cho nó làm, mà hãy xem bản thiết kế nhà cần gì rồi mới quyết định dùng xẻng, xe đẩy hay cần cẩu.",
      takeaway:
        "Hỏi về bài toán và con người trước, hỏi về công nghệ AI sau. Nếu không có giá trị độc đáo, đừng dùng AI chỉ để cho có phong trào.",
    },
    {
      id: "d2-problem-card",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Quick Problem Card",
      icon: "📋",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      slideRange: "Day 2 · Slide 11–14",
      frontPrompt: "Khung 5 thành tố của Quick Problem Card gồm những gì để định hình một bài toán AI rõ ràng?",
      frontHint: "1 câu vấn đề, đối tượng, quy trình, nút thắt và thước đo.",
      mechanism:
        "Quick Problem Card gồm 5 phần: (1) Bài toán tóm tắt 1 câu; (2) Đối tượng thụ hưởng (Actor); (3) Quy trình hiện tại 3–7 bước; (4) Nút thắt & hao phí chính (Bottleneck & Cost); (5) Chỉ số thành công đo lường được (Baseline vs Target).",
      analogy:
        "Giống như phiếu khám bệnh của bác sĩ: phải ghi rõ bệnh nhân là ai, triệu chứng xảy ra ở bước nào, biến chứng nguy hiểm nhất là gì và chỉ số xét nghiệm cần đạt sau điều trị là bao nhiêu.",
      takeaway:
        "Một bài toán AI tốt phải có Baseline (hiện trạng tốn bao nhiêu thời gian/chi phí) và Target (mục tiêu cải thiện rõ ràng), không viết chung chung kiểu 'giúp làm việc nhanh hơn'.",
    },
    {
      id: "d2-rule-workflow-agent",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Rule vs Workflow vs Agent",
      icon: "⚙️",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      slideRange: "Day 2 · Slide 15–20",
      frontPrompt: "Khi nào nên dùng Rule tĩnh, khi nào dùng Workflow/Chaining, và khi nào mới cần tới AI Agent?",
      frontHint: "Nghĩ về độ cố định của logic và mức độ rủi ro khi có sai sót.",
      mechanism:
        "Cấp 1 (Rule tĩnh): Cho logic if/else cố định 100%, dữ liệu tĩnh, sai sót gây hậu quả tốn kém. Cấp 2 (Workflow / Prompt Chaining): Quy trình tuần tự, dùng AI cho từng bước hiểu ngôn ngữ. Cấp 3 (AI Agent): Khi cần tự lập kế hoạch động (Goal → Reason → Tools → Action) trong môi trường mở.",
      analogy:
        "Rule tĩnh giống máy ép khuôn tự động (rập khuôn, không sai lệch). Workflow giống dây chuyền lắp ráp ô tô có công nhân kiểm tra từng trạm. AI Agent giống nhân viên thám tử tự quyết định đi đâu, gặp ai, dùng công cụ gì để phá án.",
      takeaway:
        "Nguyên tắc Occam's Razor cho AI: Hãy bắt đầu bằng giải pháp đơn giản nhất (Rule hoặc Workflow). Đừng vội vàng làm Agent phức tạp khi chưa cần thiết!",
    },
    {
      id: "d2-hitl",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Human-in-the-loop (HITL)",
      icon: "🛡️",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
      slideRange: "Day 2 · Slide 21–24",
      frontPrompt: "Tại sao trong các hệ thống tự động hoá AI luôn cần cơ chế Human-in-the-loop (HITL)?",
      frontHint: "Nghĩ về trường hợp ngoại lệ, rủi ro pháp lý/tính mạng và cơ chế bàn giao con người.",
      mechanism:
        "AI là hệ thống xác suất, luôn có tỷ lệ lỗi (ảo giác, hiểu nhầm ngữ cảnh). HITL thiết kế các điểm chặn phê duyệt (Human Approval), cơ chế phát hiện độ tự tin thấp để chuyển giao cho chuyên viên xử lý (Escalation / Fallback) nhằm triệt tiêu rủi ro nghiêm trọng.",
      analogy:
        "Giống chế độ lái tự động trên máy bay: máy tính có thể bay trên đường băng thẳng rất tốt, nhưng khi gặp thời tiết xấu bất thường hoặc hạ cánh, phi công con người bắt buộc phải cầm lái trực tiếp.",
      takeaway:
        "Tự động hoá không đồng nghĩa với buông bỏ trách nhiệm. Luôn thiết kế nút 'dừng khẩn cấp' và đường lui cho con người kiểm soát.",
    },
  ],
};
