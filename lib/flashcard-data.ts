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
      slideRange: "Day 1 · Slide 11–12",
      frontPrompt: "LLM tạo ra câu trả lời bằng cơ chế hoạt động cơ bản nào?",
      frontHint: "Nghĩ về vòng lặp xác suất: dự đoán từ → nối vào câu → chạy lại.",
      mechanism:
        "LLM hoạt động theo vòng lặp (predict → append → rerun). Nó chấm điểm xác suất để chọn mảnh chữ (token) tiếp theo rồi nối vào chuỗi và lặp lại liên tục.",
      analogy:
        "Giống bàn phím điện thoại gợi ý từ tiếp theo bạn hay gõ để câu trôi chảy.",
      takeaway:
        "LLM không viết cả bài văn cùng lúc mà sinh từng mảnh chữ theo xác suất thống kê.",
    },
    {
      id: "d1-fluency-accuracy",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Trôi chảy vs Chính xác",
      icon: "🎭",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      slideRange: "Day 1 · Slide 12 & 20",
      frontPrompt: "Tại sao LLM có thể nói rất trôi chảy nhưng lại có thể bịa sai sự thật?",
      frontHint: "Tối ưu hóa câu nghe tự nhiên khác hoàn toàn với việc kiểm chứng chân lý.",
      mechanism:
        "Mô hình chỉ được tối ưu để sinh chuỗi từ nghe tự nhiên và hợp lý nhất theo ngữ pháp, hoàn toàn không có khả năng tự tra cứu chân lý khách quan.",
      analogy:
        "Một người ăn nói lưu loát, tự tin chém gió nhưng nội dung bên trong có thể sai hoàn toàn.",
      takeaway:
        "Sự trôi chảy (Fluency) và tính chính xác (Accuracy) là hai việc tách biệt. Đừng tin chỉ vì văn phong mượt mà!",
    },
    {
      id: "d1-token-concept",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Token & Chi phí",
      icon: "🧩",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      slideRange: "Day 1 · Slide 13",
      frontPrompt: "Token là gì và tại sao tiếng Việt hay code lại tốn nhiều token hơn tiếng Anh?",
      frontHint: "Mảnh chữ nhỏ mà AI dùng để đọc và tính toán chi phí.",
      mechanism:
        "Token là mảnh ký tự (khoảng 3–4 ký tự tiếng Anh). Tiếng Việt có dấu và thụt lề code thường bị băm thành nhiều mảnh nhỏ hơn từ tiếng Anh tương đương.",
      analogy:
        "Như mảnh ghép Lego: từ tiếng Anh dùng 1 khối to, từ tiếng Việt phải ghép từ 2–3 khối nhỏ.",
      takeaway:
        "Tiếng Việt và code tốn nhiều token hơn, khiến context nhanh đầy và tốn phí API hơn.",
    },
    {
      id: "d1-context-window",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Context Window",
      icon: "💼",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      slideRange: "Day 1 · Slide 14",
      frontPrompt: "Context Window là gì và vì sao không nên nhồi quá nhiều tài liệu vào prompt?",
      frontHint: "Mặt bàn làm việc hữu hạn và chi phí tăng theo độ dài.",
      mechanism:
        "Là giới hạn lượng token tối đa LLM có thể thấy trong một lần gọi. Nhồi quá nhiều làm tăng vọt chi phí, tăng độ trễ và làm AI giảm tập trung.",
      analogy:
        "Mặt bàn làm việc có hạn: bày vài cuốn sổ thì tra rất nhanh, đổ cả thư viện lên thì chật chội và bới tìm rất lâu.",
      takeaway:
        "Bàn rộng không có nghĩa là dùng tốt. Hãy chắt lọc tài liệu tinh gọn trước khi đưa vào context.",
    },
    {
      id: "d1-attention-mechanism",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Cơ chế Attention",
      icon: "👀",
      badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
      slideRange: "Day 1 · Slide 8 & 15",
      frontPrompt: "Cơ chế Attention trong kiến trúc Transformer giúp giải quyết bài toán gì?",
      frontHint: "Cách các từ liên kết ý nghĩa với nhau dù đứng xa nhau trong câu.",
      mechanism:
        "Cho phép mỗi token khi được xử lý sẽ quay đầu tính điểm trọng số với tất cả các token khác trong câu để hiểu đúng ngữ cảnh ngữ nghĩa.",
      analogy:
        "Khi đọc chữ 'nó' trong câu 'Con mèo thấy con chuột vì nó đói', mắt bạn lập tức liếc nhìn từ 'con mèo'.",
      takeaway:
        "Attention giúp hiểu sâu mối liên hệ giữa các từ, nhưng chi phí tính toán tăng theo bình phương độ dài prompt.",
    },
    {
      id: "d1-lost-in-middle",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Lost in the Middle",
      icon: "📍",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
      slideRange: "Day 1 · Slide 16",
      frontPrompt: "Hiện tượng 'Lost in the middle' là gì và cách phòng tránh ra sao?",
      frontHint: "Vị trí đặt tài liệu quan trọng trong một prompt rất dài.",
      mechanism:
        "Khi prompt quá dài, LLM chú ý tốt nhất ở phần đầu (primacy) và phần cuối (recency), rất dễ bỏ sót hoặc xem nhẹ dữ kiện nằm ở đoạn giữa.",
      analogy:
        "Đọc một cuốn sách dày cộp: bạn nhớ rất rõ chương mở đầu và kết luận, còn chi tiết giữa sách dễ bị trôi tuột.",
      takeaway:
        "Luôn đặt chỉ dẫn quan trọng và tài liệu then chốt ở đầu hoặc cuối prompt, tránh chôn ở giữa.",
    },
    {
      id: "d1-hallucination",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Ảo giác LLM",
      icon: "🌫️",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
      slideRange: "Day 1 · Slide 20",
      frontPrompt: "Ảo giác (Hallucination) bắt nguồn từ đâu và có triệt tiêu 100% được không?",
      frontHint: "Bản chất xác suất thống kê khi thiếu dữ kiện hoặc câu hỏi bẫy.",
      mechanism:
        "Bắt nguồn từ việc mô hình suy đoán từ tiếp theo theo xác suất khi thiếu dữ kiện hoặc bị ép trả lời. Kỹ thuật prompt chỉ giảm thiểu chứ không triệt tiêu 100%.",
      analogy:
        "Học sinh đi thi không thuộc bài nhưng sợ giấy trắng nên cố bịa ra câu trả lời nghe có vẻ chuyên nghiệp.",
      takeaway:
        "Luôn có bước đối chiếu và kiểm chứng cho các quyết định quan trọng, không tin tưởng tuyệt đối vào AI.",
    },
    {
      id: "d1-grounding-rag",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Grounding & RAG",
      icon: "🔍",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      slideRange: "Day 1 · Slide 16 & 20",
      frontPrompt: "Nguyên tắc 'Cho tra sổ thay vì bắt nhớ' (RAG) giúp giảm ảo giác như thế nào?",
      frontHint: "Thi đề mở có tài liệu tra cứu vs thi bắt học thuộc lòng.",
      mechanism:
        "RAG truy xuất đúng đoạn văn bản uy tín từ kho tài liệu bên ngoài rồi đưa vào context làm bằng chứng (Grounding) để LLM đọc và tổng hợp câu trả lời.",
      analogy:
        "Thay vì bắt bác sĩ nhớ thuộc lòng hàng nghìn phác đồ, phát cho cuốn sổ cẩm nang để mở ra tra cứu đúng trang cần thiết.",
      takeaway:
        "RAG neo câu trả lời vào dữ kiện thực tế, giảm mạnh ảo giác và giúp người dùng truy vết nguồn gốc câu trả lời.",
    },
    {
      id: "d1-temperature",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Núm vặn Temperature",
      icon: "🌡️",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
      slideRange: "Day 1 · Slide 29",
      frontPrompt: "Temperature điều chỉnh điều gì và khi nào nên thiết lập Temperature = 0?",
      frontHint: "Độ ngẫu nhiên khi lấy mẫu token tiếp theo.",
      mechanism:
        "T=0 ép mô hình luôn chọn token có xác suất cao nhất (ổn định, lặp lại). T cao san phẳng xác suất, cho phép chọn từ lạ hơn (sáng tạo, ngẫu hứng).",
      analogy:
        "T=0 là kế toán cẩn trọng, luôn chọn số liệu chắc chắn. T=1 là nhà thơ ngẫu hứng, sẵn sàng dùng từ phá cách.",
      takeaway:
        "Dùng T=0 cho lập trình, trích xuất dữ liệu, tính toán. Dùng T cao (0.7–1.0) cho viết truyện, sáng tạo nội dung.",
    },
    {
      id: "d1-chain-of-thought",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "Chain-of-Thought",
      icon: "🧠",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
      slideRange: "Day 1 · Slide 22",
      frontPrompt: "Tại sao bảo AI 'Hãy suy nghĩ từng bước' (Chain of Thought) lại giúp tăng độ chính xác?",
      frontHint: "Nháp ra giấy trước khi chốt đáp án cuối cùng.",
      mechanism:
        "Ép mô hình sinh ra các token suy luận trung gian. Các token này trở thành ngữ cảnh mới để mô hình suy luận chính xác hơn cho đáp án cuối cùng.",
      analogy:
        "Làm toán phức tạp: vừa nhẩm vừa đặt từng phép tính ra giấy nháp bao giờ cũng chuẩn hơn là nhìn đề rồi đoán mò đáp số.",
      takeaway:
        "Cho AI không gian suy nghĩ bằng cách yêu cầu phân tích từng bước trước khi đưa ra kết luận.",
    },
    {
      id: "d1-training-pipeline",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "4 Bước tạo LLM",
      icon: "🏭",
      badgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
      slideRange: "Day 1 · Slide 18",
      frontPrompt: "Một mô hình LLM hiện đại trải qua những giai đoạn huấn luyện cốt lõi nào?",
      frontHint: "Học đọc dữ liệu thô → Dạy đối thoại mẫu → Uốn nắn an toàn → Luyện suy luận.",
      mechanism:
        "(1) Pre-training (học đoán từ trên internet); (2) SFT (tập trả lời theo cặp hỏi-đáp); (3) RLHF (con người chấm điểm an toàn); (4) Reasoning (luyện tự sửa sai).",
      analogy:
        "Đào tạo bác sĩ: đọc hết thư viện y khoa → đi thực tập hỏi bệnh → được giáo sư chấm điểm uốn nắn → luyện chẩn đoán ca khó.",
      takeaway:
        "Pre-training quyết định kiến thức nền tảng; SFT và RLHF quyết định thái độ phục vụ và độ an toàn của mô hình.",
    },
    {
      id: "d1-system-user-prompt",
      lessonId: 1,
      lessonLabel: "Day 1",
      concept: "System vs User Prompt",
      icon: "📜",
      badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
      slideRange: "Day 1 · Slide 27",
      frontPrompt: "System Prompt khác gì User Prompt trong việc định hình hành vi của AI?",
      frontHint: "Quy chế vai diễn cố định của hệ thống vs câu hỏi tức thời của người dùng.",
      mechanism:
        "System Prompt quy định vai trò, ranh giới an toàn và định dạng đầu ra cố định cho bot. User Prompt là yêu cầu cụ thể của người dùng trong từng lượt chat.",
      analogy:
        "System Prompt là kịch bản và luật lệ của nhà hát; User Prompt là lời đối thoại ngẫu hứng của khán giả.",
      takeaway:
        "Thiết kế System Prompt chặt chẽ giúp chống hành vi bẻ khoá (jailbreak) và đảm bảo AI phản hồi nhất quán.",
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
      slideRange: "Day 2 · Slide 8",
      frontPrompt: "Google PAIR khuyên thay đổi câu hỏi 'Có thể dùng AI làm gì?' như thế nào?",
      frontHint: "Tránh bẫy có búa trong tay thì nhìn đâu cũng thấy đinh.",
      mechanism:
        "Thay bằng 2 câu hỏi: (1) 'Chúng ta giải quyết vấn đề này như thế nào?' và (2) 'AI có giải quyết được theo cách độc đáo mà giải pháp thường không làm được?'.",
      analogy:
        "Đừng mua cần cẩu khổng lồ về rồi mới đi tìm đồ để nâng; hãy xem bản thiết kế nhà cần gì rồi mới chọn xẻng, xe rùa hay cần cẩu.",
      takeaway:
        "Hỏi về bài toán và con người trước, hỏi về công nghệ AI sau. Giải pháp xuất sắc cho sai vấn đề còn tệ hơn không làm.",
    },
    {
      id: "d2-problem-card",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Quick Problem Card",
      icon: "📋",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      slideRange: "Day 2 · Slide 9–10",
      frontPrompt: "Khung 5 thành tố của Quick Problem Card gồm những gì để định hình một bài toán?",
      frontHint: "Bài toán 1 câu, ai chịu tác động, các bước, điểm nghẽn, và thước đo.",
      mechanism:
        "(1) Tóm tắt bài toán 1 câu; (2) Đối tượng thụ hưởng (Actor); (3) Quy trình hiện tại (3–7 bước); (4) Nút thắt & hao phí; (5) Chỉ số thành công (Baseline vs Target).",
      analogy:
        "Phiếu khám bệnh của bác sĩ: ghi rõ bệnh nhân là ai, triệu chứng ở đâu, biến chứng nguy hiểm nhất là gì và chỉ số máu cần đạt sau chữa trị.",
      takeaway:
        "Một yêu cầu mơ hồ không thể lập trình được. Hãy bóc tách thành 5 thành tố cụ thể trước khi viết code.",
    },
    {
      id: "d2-baseline-target",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Baseline vs Target",
      icon: "📊",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      slideRange: "Day 2 · Slide 11–12",
      frontPrompt: "Tại sao bài toán AI bắt buộc phải có con số Baseline và Target cụ thể?",
      frontHint: "Làm sao chứng minh AI thực sự tiết kiệm thời gian hoặc tiền bạc?",
      mechanism:
        "Baseline là mức hao phí hiện trạng (ví dụ: mất 90 phút/báo cáo). Target là mục tiêu kỳ vọng sau khi áp dụng AI (còn 15 phút). Giúp đo lường ROI rõ ràng.",
      analogy:
        "Đi tập gym giảm cân: phải bước lên cân đo hiện trạng (Baseline 80kg) và đặt mục tiêu (Target 70kg), không thể nói chung chung 'muốn người đẹp hơn'.",
      takeaway:
        "Không có Baseline cụ thể thì không thể chứng minh giải pháp AI có thực sự mang lại hiệu quả hay chỉ là quảng cáo.",
    },
    {
      id: "d2-when-no-ai",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Khi nào KHÔNG dùng AI",
      icon: "🚫",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
      slideRange: "Day 2 · Slide 13–14",
      frontPrompt: "Những trường hợp nào thì tuyệt đối KHÔNG NÊN dùng AI mà nên dùng giải pháp khác?",
      frontHint: "Dữ liệu tĩnh, logic cố định, hoặc lỗi sai gây hậu quả quá đắt.",
      mechanism:
        "Dữ liệu tĩnh, logic nghiệp vụ cố định viết được bằng if/else, yêu cầu minh bạch 100% từng phép tính, hoặc chi phí một lần sai sót quá lớn (y tế hiểm nghèo, pháp lý).",
      analogy:
        "Tính thuế thu nhập cá nhân: cứ dùng bảng biểu và công thức toán chuẩn 100%, gọi AI sinh chữ xác suất có thể bị cơ quan thuế phạt.",
      takeaway:
        "Nguyên tắc Occam's Razor: Nếu bài toán giải quyết được bằng Rule tĩnh hoặc bảng tính, tuyệt đối đừng gọi LLM!",
    },
    {
      id: "d2-rule-based",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Cấp 1: Rule-based",
      icon: "⚙️",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      slideRange: "Day 2 · Slide 16",
      frontPrompt: "Cấp độ 1 (Rule-based / Script) hoạt động thế nào và có ưu thế gì so với AI?",
      frontHint: "30–40 câu lệnh if-else nối nhau.",
      mechanism:
        "Chạy theo logic cứng cố định (if/else), regex hoặc bộ lọc từ khóa. Kết quả dự đoán được 100%, tốc độ tính bằng mili-giây và chi phí vận hành bằng 0.",
      analogy:
        "Máy dập khuôn nắp chai tự động: hàng triệu nắp giống hệt nhau, không bao giờ nhầm kích thước và vận hành cực kỳ rẻ.",
      takeaway:
        "Rule-based là giải pháp nhanh nhất, rẻ nhất và an toàn nhất cho các tác vụ có quy luật cố định.",
    },
    {
      id: "d2-workflow-chaining",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Cấp 2: Workflow Chaining",
      icon: "⛓️",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      slideRange: "Day 2 · Slide 17",
      frontPrompt: "Cấp độ 2 (Workflow / Prompt Chaining) là gì và thích hợp cho bài toán nào?",
      frontHint: "Quy trình có các bước tuần tự rõ ràng kết hợp LLM ở các nút ngôn ngữ.",
      mechanism:
        "Quy trình được chia thành các bước xác định (tuần tự, song song, phân nhánh). Dùng LLM ở các bước cần hiểu ngôn ngữ và đặt cổng kiểm soát (gate) giữa các bước.",
      analogy:
        "Dây chuyền lắp ráp có trạm kiểm soát chất lượng: Trạm 1 tóm tắt tài liệu → Cổng duyệt → Trạm 2 dịch thuật → Cổng nghiệm thu.",
      takeaway:
        "Đổi chút thời gian lấy độ chính xác cao. Dễ debug, dễ kiểm soát và giải quyết tốt 80% bài toán thực tế.",
    },
    {
      id: "d2-agent-system",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Cấp 3: AI Agent",
      icon: "🤖",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      slideRange: "Day 2 · Slide 18",
      frontPrompt: "Cấp độ 3 (AI Agent) khác gì so với Workflow và tiềm ẩn rủi ro gì?",
      frontHint: "Tự lập kế hoạch và chọn công cụ vs quy trình được vạch sẵn.",
      mechanism:
        "Agent được trao mục tiêu (Goal), tự suy luận (Reasoning), tự chọn công cụ (Tools) và tự hành động điều chỉnh trong môi trường mở. Rủi ro: tốn token và khó đoán trước hành vi.",
      analogy:
        "Workflow là công nhân làm theo danh sách việc cần làm; Agent là thám tử tự quyết định đi gặp ai, xem hồ sơ nào để phá án.",
      takeaway:
        "Chỉ dùng Agent khi môi trường quá động và không thể viết trước các nhánh rẽ. Luôn đặt giới hạn số bước lặp và chi phí.",
    },
    {
      id: "d2-automate-augment",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Automate vs Augment",
      icon: "🤝",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
      slideRange: "Day 2 · Slide 19–20",
      frontPrompt: "Khác biệt giữa Tự động hóa (Automate) và Tăng cường (Augment) là gì?",
      frontHint: "Quyền quyết định cuối cùng thuộc về máy hay con người?",
      mechanism:
        "Automate là AI tự quyết định và trả thẳng kết quả tới người dùng. Augment là AI đóng vai trò trợ lý đề xuất bản nháp, con người là người duyệt cuối cùng.",
      analogy:
        "Automate là tàu hỏa không người lái tự chạy trên ray. Augment là cảnh báo điểm mù trên gương chiếu hậu, tài xế vẫn là người đánh lái.",
      takeaway:
        "Luôn bắt đầu từ Augment để đo lường tỷ lệ lỗi thực tế trước khi nâng dần mức độ Automate.",
    },
    {
      id: "d2-hitl-controls",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Human-in-the-loop (HITL)",
      icon: "🛡️",
      badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
      slideRange: "Day 2 · Slide 21–24",
      frontPrompt: "Cơ chế Human-in-the-loop (HITL) đóng vai trò gì trong sản phẩm AI?",
      frontHint: "Điểm chốt chặn phê duyệt và cơ chế dừng khẩn cấp khi AI làm sai.",
      mechanism:
        "Thiết lập điểm chặn phê duyệt (Preview/Edit/Approve) và cơ chế chuyển giao cho chuyên viên (Escalation/Fallback) khi AI có độ tự tin thấp hoặc lỗi vượt ngưỡng.",
      analogy:
        "Chế độ lái tự động trên máy bay: bay thẳng rất tốt nhưng khi gặp thời tiết xấu hoặc hạ cánh, phi công bắt buộc phải cầm lái.",
      takeaway:
        "AI luôn có xác suất sai. HITL là chốt chặn an toàn sống còn bảo vệ doanh nghiệp khỏi các sự cố nghiêm trọng.",
    },
    {
      id: "d2-asymmetric-errors",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Bất đối xứng FP / FN",
      icon: "⚖️",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
      slideRange: "Day 2 · Slide 23–24",
      frontPrompt: "Tại sao khi đánh giá sản phẩm AI, chi phí giữa Báo động giả (FP) và Bỏ sót (FN) lại không đều nhau?",
      frontHint: "Gửi nhầm email rác vs bỏ sót khối u ác tính trên phim chụp.",
      mechanism:
        "Chi phí hai loại lỗi rất khác nhau: Trong lọc spam, bỏ sót thư rác (FN) chỉ hơi phiền, nhưng đánh dấu nhầm thư hợp đồng làm spam (FP) gây mất khách; Trong y tế, bỏ sót bệnh (FN) gây nguy hiểm tính mạng.",
      analogy:
        "Chuông báo cháy kêu nhầm (FP) gây ồn 5 phút; nhưng cháy nhà mà chuông im lặng (FN) thì gây hậu quả chết người.",
      takeaway:
        "Đừng chỉ nhìn Accuracy chung! Hãy tối ưu Precision hay Recall tùy theo loại lỗi nào gây thiệt hại đau đớn hơn cho người dùng.",
    },
    {
      id: "d2-dogfooding",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "Chiến lược Dogfooding",
      icon: "🥣",
      badgeColor: "bg-lime-50 text-lime-800 border-lime-200",
      slideRange: "Day 2 · Slide 6 & Transcript",
      frontPrompt: "Thuật ngữ 'Dogfooding' trong phát triển sản phẩm nghĩa là gì và mang lại lợi ích gì?",
      frontHint: "Đội ngũ tự ăn món ăn mà chính mình làm ra mỗi ngày.",
      mechanism:
        "Tự làm người dùng đầu tiên trải nghiệm sản phẩm của mình mỗi ngày để trực tiếp cảm nhận điểm đau, phát hiện lỗi sai xác suất và cải tiến liên tục trước khi mở bán.",
      analogy:
        "Đầu bếp trước khi bưng món ăn ra bàn tiệc luôn tự nêm nếm kỹ lưỡng từng thìa nước dùng để biết thiếu mặn nhạt ra sao.",
      takeaway:
        "Xây dựng công cụ giải quyết chính nỗi đau của bản thân là xuất phát điểm thực tế và bền vững nhất cho sản phẩm AI.",
    },
    {
      id: "d2-north-star-metric",
      lessonId: 2,
      lessonLabel: "Day 2",
      concept: "North Star Metric",
      icon: "⭐",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      slideRange: "Day 2 · Slide 12 & Transcript",
      frontPrompt: "North Star Metric của sản phẩm AI là gì và tại sao không nên chỉ đếm số lượt ghé thăm (visitors)?",
      frontHint: "Thước đo giá trị cốt lõi thực sự vs con số bề nổi để làm marketing.",
      mechanism:
        "North Star Metric đo lường giá trị cốt lõi sản phẩm mang lại (ví dụ: điểm thi tăng, thời gian hoàn thành task giảm). Visitor chỉ là chỉ số bề nổi, không phản ánh thành công.",
      analogy:
        "Đếm số người đứng ngó tiệm bánh không chứng minh bánh ngon; chỉ có số khách ăn xong no bụng và quay lại mua mới là thước đo thực sự.",
      takeaway:
        "Thiết kế chỉ số đo lường giá trị thực tế của giải pháp thay vì rơi vào bẫy làm đẹp số liệu hào nhoáng.",
    },
  ],
};
