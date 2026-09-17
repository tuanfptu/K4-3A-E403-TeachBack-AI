export interface ConceptKnowledge {
  id: string;
  name: string;
  vietnameseName: string;
  lecture: string;
  citations: string;
  slide: number;
  coreDefinition: string;
  keyPoints: string[];
  commonMisconceptions: string[];
  sampleGoodAnalogies: string[];
  sampleFalseAnalogies: string[];
}

export const KNOWLEDGE_BANK: Record<string, ConceptKnowledge> = {
  hallucination: {
    id: "hallucination",
    name: "LLM Hallucination",
    vietnameseName: "Ảo giác LLM (Vì sao LLM bịa)",
    lecture: "Day 1: AI & LLM Foundation",
    citations: "Slide 12 & 20 · Transcript [T01-045], [T04-047–048]",
    slide: 20,
    coreDefinition: "LLM sinh văn bản bằng cách dự đoán token tiếp theo theo phân phối xác suất thống kê dựa trên dữ liệu huấn luyện, chứ không có cơ chế kiểm chứng sự thật khách quan tại thời điểm sinh.",
    keyPoints: [
      "Next-token prediction: Mô hình chỉ ghép từ tiếp theo sao cho mượt mà và có xác suất cao nhất.",
      "Sự trôi chảy (Fluency) không đồng nghĩa với tính chính xác (Accuracy).",
      "LLM không có cơ sở dữ liệu tra cứu sự thật thời gian thực nếu không có Grounding.",
      "Ảo giác là đặc tính vốn có của mô hình sinh xác suất, không phải lỗi tạm thời có thể hết bằng cách thêm dữ liệu."
    ],
    commonMisconceptions: [
      "Nghĩ rằng LLM tra cứu database như Google Search.",
      "Nghĩ rằng nếu cho LLM học thêm nhiều dữ liệu thì sẽ 100% hết ảo giác.",
      "Tin rằng câu trả lời viết càng tự tin, chuyên nghiệp thì càng chính xác."
    ],
    sampleGoodAnalogies: [
      "Giống như trò chơi nối từ: người chơi nói từ tiếp theo nghe rất vần và hợp tai nhưng không hề quan tâm câu chuyện đó có thật ngoài đời hay không.",
      "Giống như một học sinh 'chém gió' tự tin trong giờ vấn đáp: nhớ mang máng các cụm từ ngữ của thầy cô nên ghép lại nghe rất uyên bác dù thực chất không hiểu bản chất."
    ],
    sampleFalseAnalogies: [
      "Giống như máy tính bị nhiễm virus hoặc tràn bộ nhớ nên tính toán sai (Sai: Vì ảo giác là cơ chế sinh thống kê, không phải lỗi phần cứng/virus).",
      "Giống như Google tìm kiếm ra trang web lừa đảo (Sai: Vì Google chỉ trỏ tới nội dung có sẵn, còn LLM tự tổng hợp ra câu chữ chưa từng tồn tại)."
    ]
  },
  grounding: {
    id: "grounding",
    name: "Grounding",
    vietnameseName: "Grounding (Neo dữ liệu / Gắn nguồn)",
    lecture: "Day 1: AI & LLM Foundation",
    citations: "Slide 16 · Transcript [T06-139]",
    slide: 16,
    coreDefinition: "Kỹ thuật neo câu trả lời của mô hình vào một nguồn dữ liệu tham chiếu đáng tin cậy được cung cấp trực tiếp trong ngữ cảnh (context), yêu cầu mô hình chỉ trả lời dựa trên tài liệu đó.",
    keyPoints: [
      "Cung cấp bằng chứng cụ thể tại thời điểm sinh câu trả lời (Answer-time evidence).",
      "Giảm phụ thuộc vào 'trí nhớ nội tại' (Parametric memory) của mô hình.",
      "Tạo cơ sở để trích dẫn nguồn (Citations) và kiểm tra đối chiếu (Fact-checking)."
    ],
    commonMisconceptions: [
      "Nghĩ rằng Grounding là đi train lại hoặc fine-tune lại toàn bộ mô hình.",
      "Nghĩ rằng Grounding chỉ cần đưa link web là AI tự động hiểu và không bao giờ bịa nữa."
    ],
    sampleGoodAnalogies: [
      "Giống như cho học sinh thi đề mở (Open-book exam): thay vì bắt học sinh nhớ vẹt từ trong đầu, giám thị phát cho cuốn tài liệu chuẩn và yêu cầu trả lời phải trỏ đúng số trang.",
      "Giống như thư ký tòa án: chỉ ghi lại và tổng hợp những gì các nhân chứng khai báo tại phiên tòa, không được tự suy diễn ngoài biên bản."
    ],
    sampleFalseAnalogies: [
      "Giống như cài thêm RAM cho máy tính chạy nhanh hơn (Sai: Không liên quan tới tốc độ hay phần cứng)."
    ]
  },
  rag: {
    id: "rag",
    name: "Retrieval-Augmented Generation (RAG)",
    vietnameseName: "RAG (Tạo sinh có tăng cường truy xuất)",
    lecture: "Day 1 & Day 2",
    citations: "Slide 16 · Transcript [T03-036], [T06-139]",
    slide: 16,
    coreDefinition: "Quy trình 2 bước: Bước 1 (Retrieval) tìm kiếm các đoạn thông tin liên quan từ kho dữ liệu ngoài; Bước 2 (Generation) đưa các đoạn đó vào prompt để LLM tổng hợp thành câu trả lời.",
    keyPoints: [
      "Tách biệt giữa kho tri thức ngoài (External vector database/docs) và khả năng ngôn ngữ của LLM.",
      "Giải quyết vấn đề giới hạn thời gian tri thức (Knowledge cutoff) và thông tin nội bộ bảo mật.",
      "Giúp tiết kiệm chi phí rất nhiều so với việc fine-tune lại mô hình."
    ],
    commonMisconceptions: [
      "Đồng nhất RAG với Fine-tuning.",
      "Nghĩ rằng RAG sẽ giải quyết 100% mọi câu hỏi dù dữ liệu đầu vào có bị rác/nhiễu."
    ],
    sampleGoodAnalogies: [
      "Giống như bác sĩ trước khi kê đơn thuốc cho ca bệnh hiếm: vào phòng tra cứu cẩm nang y khoa mới nhất năm 2026, đọc kỹ rồi mới quay lại phòng khám kê đơn.",
      "Giống như đầu bếp nấu món lạ: tra công thức trong sách nấu ăn trước rồi mới nấu, thay vì tự áng chừng gia vị theo trí nhớ."
    ],
    sampleFalseAnalogies: [
      "Giống như dạy thêm cho học sinh học đại học (Sai: Đó là Fine-tuning; RAG giống phát tài liệu tra cứu hơn)."
    ]
  },
  next_token_prediction: {
    id: "next_token_prediction",
    name: "Next-Token Prediction",
    vietnameseName: "Dự đoán token tiếp theo",
    lecture: "Day 1: AI & LLM Foundation",
    citations: "Slide 12 · Transcript [T01-020–025]",
    slide: 12,
    coreDefinition: "Cơ chế vận hành cơ bản của mô hình ngôn ngữ tự hồi quy (Autoregressive LLM): tại mỗi bước thời gian, mô hình tính toán xác suất của mọi token khả dĩ trong từ điển để chọn ra token tiếp theo dựa trên chuỗi token trước đó.",
    keyPoints: [
      "Không có tư duy toàn cục ngay từ đầu, mà sinh tuần tự từng từ/mảnh từ (Token by token).",
      "Phụ thuộc vào nhiệt độ (Temperature) và chiến lược lấy mẫu (Sampling) dẫn tới tính chất bất định (Stochastic).",
      "Mô hình học mối tương quan thống kê (Statistical correlations), không phải tư duy logic nhân quả (Causal reasoning)."
    ],
    commonMisconceptions: [
      "Nghĩ rằng LLM suy nghĩ xong cả câu hoàn chỉnh trong đầu rồi mới in ra.",
      "Nghĩ rằng LLM 'hiểu' ý nghĩa của các từ ngữ như con người."
    ],
    sampleGoodAnalogies: [
      "Giống tính năng bàn phím gợi ý từ tiếp theo trên điện thoại (Auto-complete) nhưng ở quy mô khổng lồ và tinh vi gấp hàng triệu lần."
    ],
    sampleFalseAnalogies: [
      "Giống như một nhà văn đang lên dàn ý chi tiết chương 1 đến chương 10 rồi mới viết từng câu."
    ]
  },
  attention: {
    id: "attention",
    name: "Self-Attention Mechanism",
    vietnameseName: "Cơ chế Self-Attention",
    lecture: "Day 1: Foundation",
    citations: "Slide 18 · Transcript [T06-050]",
    slide: 18,
    coreDefinition: "Cơ chế cho phép mô hình cân nhắc tầm quan trọng tương đối của từng từ trong câu đối với một từ cụ thể, không phụ thuộc vào khoảng cách vật lý giữa chúng.",
    keyPoints: [
      "Khắc phục hạn chế của RNN/LSTM khi xử lý câu dài bị quên ngữ cảnh xa.",
      "Sử dụng các ma trận Query (Q), Key (K), Value (V) để tính điểm trọng số chú ý.",
      "Cho phép xử lý song song toàn bộ chuỗi văn bản thay vì phải chờ tuần tự từng từ."
    ],
    commonMisconceptions: [
      "Nghĩ rằng Attention chỉ đọc từ trái qua phải như con người đọc chữ."
    ],
    sampleGoodAnalogies: [
      "Giống như đọc sách bằng bút dạ quang: khi đọc từ 'nó' trong câu, mắt tự động tô sáng danh từ được nhắc tới ở 3 câu trước đó để hiểu 'nó' là ai."
    ],
    sampleFalseAnalogies: [
      "Giống như tăng âm lượng tai nghe để nghe rõ hơn."
    ]
  },
  d1_foundation: {
    id: "d1_foundation",
    name: "Day 1: AI & LLM Foundation",
    vietnameseName: "Day 1: AI & LLM Foundation (Cơ chế sinh & Ảo giác)",
    lecture: "Day 1: AI & LLM Foundation",
    citations: "d1-slide-hackathon.pdf (Slide 10–20) · Transcript [T04-047–048], [T06-139]",
    slide: 20,
    coreDefinition: "LLM dự đoán token tiếp theo theo xác suất thống kê (predict → append → rerun) trong cửa sổ ngữ cảnh (context window) có hạn. Vì tối ưu cho câu nghe trôi chảy hợp lý chứ không tự kiểm chứng sự thật nên LLM dễ bị ảo giác (hallucination). Giải pháp cốt lõi là Grounding và RAG: cho AI tra cứu tài liệu tham chiếu (cho tra sổ) thay vì bắt nhớ.",
    keyPoints: [
      "Token & Context Window: Model không đọc từ nguyên vẹn mà đọc mảnh token. Context window là bàn làm việc có hạn (Slide 13-14).",
      "Next-token prediction: Vòng lặp đoán token có xác suất cao nhất nối vào ngữ cảnh rồi đoán tiếp, không tự đi kiểm chứng chân lý (Slide 11-12).",
      "Attention Mechanism: Cho phép mỗi từ nhìn sang các từ quan trọng khác trong câu để hiểu nghĩa theo ngữ cảnh (Slide 15).",
      "Ảo giác LLM (Hallucination): Nói chắc như đúng rồi nhưng bịa sai dữ kiện; trôi chảy (fluency) không đồng nghĩa với chính xác (accuracy) (Slide 20).",
      "Grounding & RAG: Nguyên tắc 'Cho tra sổ thay vì bắt nhớ' - trích xuất tài liệu tin cậy đưa vào prompt trước khi sinh câu trả lời (Slide 16)."
    ],
    commonMisconceptions: [
      "Nghĩ rằng LLM tra cứu cơ sở dữ liệu như Google Search.",
      "Nghĩ rằng nếu train thêm nhiều dữ liệu thì mô hình sẽ 100% hết ảo giác.",
      "Nghĩ rằng context window càng dài thì nhét bao nhiêu tài liệu vào giữa cũng đọc được hết."
    ],
    sampleGoodAnalogies: [
      "Giống như học sinh chém gió lưu loát trong giờ vấn đáp: nhớ mang máng từ ngữ nên ghép lại rất trôi chảy dù không nắm bản chất sự thật.",
      "Grounding giống như thi đề mở (Open-book exam): giám thị phát tài liệu chuẩn và yêu cầu chỉ được trả lời dựa trên cuốn sách đó."
    ],
    sampleFalseAnalogies: [
      "Giống như máy tính bị nhiễm virus hoặc tràn RAM."
    ]
  },
  d2_problem_framing: {
    id: "d2_problem_framing",
    name: "Day 2: Xác định bài toán cho AI & Mức độ tự động hoá",
    vietnameseName: "Day 2: Xác định bài toán cho AI (Google PAIR & 3 Cấp độ)",
    lecture: "Day 2: Problem Framing & Automation",
    citations: "d2-slide-hackathon.pdf (Slide 8–24) · Transcript [T01-015], [T02-024], [T03-050]",
    slide: 9,
    coreDefinition: "Xác định bài toán cho AI bắt đầu bằng việc làm rõ Problem Statement (bài toán, đối tượng, quy trình, nút thắt, chỉ số thành công) và tự vấn theo Google PAIR: 'Liệu AI có giải quyết bài toán này theo cách độc đáo mà rule-based không làm được?'. Lựa chọn cấp độ giải pháp từ đơn giản đến phức tạp (Cấp 1: Rule tĩnh, Cấp 2: Workflow/Prompt Chaining, Cấp 3: Agent) và thiết kế cơ chế giám sát con người (Human-in-the-loop / HITL) khi AI đoán sai.",
    keyPoints: [
      "Google PAIR Reframe: Đổi câu hỏi từ 'Có thể dùng AI làm gì?' sang 'Làm sao giải quyết vấn đề này?' và 'AI có giải quyết theo cách độc đáo không?' (Slide 8).",
      "Quick Problem Card: Khung 5 yếu tố định hình bài toán: Problem, Actor, Workflow, Bottleneck & Impact, Success Metric (Slide 9-10).",
      "Khi nào NÊN vs KHÔNG NÊN dùng AI: Dùng AI cho hiểu ngôn ngữ, gợi ý, cá nhân hóa; KHÔNG dùng AI cho thông tin tĩnh, logic if-else cố định, hoặc lỗi sai quá tốn kém (Slide 14-15).",
      "3 Cấp độ giải pháp (Decision Tree): Cấp 1 (Rule tĩnh / if-else 100%), Cấp 2 (Workflow / Prompt Chaining / Routing), Cấp 3 (AI Agent tự động chia bước) (Slide 17-21).",
      "Giám sát con người & Trade-off (HITL): Thiết kế ngưỡng hành động (PAIR template), cân bằng Precision vs Recall và xử lý các ca AI đoán sai (False Positive / False Negative) (Slide 22-25)."
    ],
    commonMisconceptions: [
      "Nghĩ rằng bài toán nào cũng phải dùng LLM hoặc Agent mới là xịn (Solution-first).",
      "Nghĩ rằng AI tự động hóa 100% không cần con người kiểm soát (bỏ qua Human-in-the-loop).",
      "Nhầm lẫn giữa Rule-based (logic cố định) và Workflow AI (chuỗi bước có LLM)."
    ],
    sampleGoodAnalogies: [
      "Giống như bác sĩ chẩn đoán bệnh: AI đóng vai trò trợ lý đọc phim X-quang gợi ý vùng nghi vấn (Cấp độ 2 Workflow / Copilot), nhưng bác sĩ chính vẫn là người ký tên quyết định phác đồ điều trị (Human-in-the-loop).",
      "Giống như hộp số xe: đường bằng phẳng dễ đi thì dùng số tự động (Rule tĩnh), đường gập ghềnh phức tạp mới cần tài xế can thiệp và điều chỉnh tay lái linh hoạt."
    ],
    sampleFalseAnalogies: [
      "Cứ giao hết quyền cho AI làm tự động từ A-Z như máy bán hàng tự động không bao giờ hỏng."
    ]
  },
  // Backward-compatible aliases
  intro_genai: {
    id: "intro_genai",
    name: "Day 1: AI & LLM Foundation",
    vietnameseName: "Day 1: AI & LLM Foundation (Cơ chế sinh & Ảo giác)",
    lecture: "Day 1: AI & LLM Foundation",
    citations: "d1-slide-hackathon.pdf (Slide 10–20) · Transcript [T04-047–048], [T06-139]",
    slide: 20,
    coreDefinition: "LLM dự đoán token tiếp theo theo xác suất thống kê (predict → append → rerun) trong cửa sổ ngữ cảnh (context window) có hạn. Vì tối ưu cho câu nghe trôi chảy hợp lý chứ không tự kiểm chứng sự thật nên LLM dễ bị ảo giác (hallucination). Giải pháp cốt lõi là Grounding và RAG: cho AI tra cứu tài liệu tham chiếu (cho tra sổ) thay vì bắt nhớ.",
    keyPoints: [
      "Token & Context Window: Model không đọc từ nguyên vẹn mà đọc mảnh token. Context window là bàn làm việc có hạn (Slide 13-14).",
      "Next-token prediction: Vòng lặp đoán token có xác suất cao nhất nối vào ngữ cảnh rồi đoán tiếp, không tự đi kiểm chứng chân lý (Slide 11-12).",
      "Attention Mechanism: Cho phép mỗi từ nhìn sang các từ quan trọng khác trong câu để hiểu nghĩa theo ngữ cảnh (Slide 15).",
      "Ảo giác LLM (Hallucination): Nói chắc như đúng rồi nhưng bịa sai dữ kiện; trôi chảy (fluency) không đồng nghĩa với chính xác (accuracy) (Slide 20).",
      "Grounding & RAG: Nguyên tắc 'Cho tra sổ thay vì bắt nhớ' - trích xuất tài liệu tin cậy đưa vào prompt trước khi sinh câu trả lời (Slide 16)."
    ],
    commonMisconceptions: [
      "Nghĩ rằng LLM tra cứu cơ sở dữ liệu như Google Search.",
      "Nghĩ rằng nếu train thêm nhiều dữ liệu thì mô hình sẽ 100% hết ảo giác.",
      "Nghĩ rằng context window càng dài thì nhét bao nhiêu tài liệu vào giữa cũng đọc được hết."
    ],
    sampleGoodAnalogies: [
      "Giống như học sinh chém gió lưu loát trong giờ vấn đáp: nhớ mang máng từ ngữ nên ghép lại rất trôi chảy dù không nắm bản chất sự thật.",
      "Grounding giống như thi đề mở (Open-book exam): giám thị phát tài liệu chuẩn và yêu cầu chỉ được trả lời dựa trên cuốn sách đó."
    ],
    sampleFalseAnalogies: [
      "Giống như máy tính bị nhiễm virus hoặc tràn RAM."
    ]
  },
  hallucination_grounding: {
    id: "hallucination_grounding",
    name: "Day 1: AI & LLM Foundation",
    vietnameseName: "Day 1: AI & LLM Foundation (Cơ chế sinh & Ảo giác)",
    lecture: "Day 1: AI & LLM Foundation",
    citations: "d1-slide-hackathon.pdf (Slide 10–20) · Transcript [T04-047–048], [T06-139]",
    slide: 20,
    coreDefinition: "LLM dự đoán token tiếp theo theo xác suất thống kê (predict → append → rerun) trong cửa sổ ngữ cảnh (context window) có hạn. Vì tối ưu cho câu nghe trôi chảy hợp lý chứ không tự kiểm chứng sự thật nên LLM dễ bị ảo giác (hallucination). Giải pháp cốt lõi là Grounding và RAG: cho AI tra cứu tài liệu tham chiếu (cho tra sổ) thay vì bắt nhớ.",
    keyPoints: [
      "Token & Context Window: Model không đọc từ nguyên vẹn mà đọc mảnh token. Context window là bàn làm việc có hạn (Slide 13-14).",
      "Next-token prediction: Vòng lặp đoán token có xác suất cao nhất nối vào ngữ cảnh rồi đoán tiếp, không tự đi kiểm chứng chân lý (Slide 11-12).",
      "Attention Mechanism: Cho phép mỗi từ nhìn sang các từ quan trọng khác trong câu để hiểu nghĩa theo ngữ cảnh (Slide 15).",
      "Ảo giác LLM (Hallucination): Nói chắc như đúng rồi nhưng bịa sai dữ kiện; trôi chảy (fluency) không đồng nghĩa với chính xác (accuracy) (Slide 20).",
      "Grounding & RAG: Nguyên tắc 'Cho tra sổ thay vì bắt nhớ' - trích xuất tài liệu tin cậy đưa vào prompt trước khi sinh câu trả lời (Slide 16)."
    ],
    commonMisconceptions: [
      "Nghĩ rằng LLM tra cứu cơ sở dữ liệu như Google Search.",
      "Nghĩ rằng nếu train thêm nhiều dữ liệu thì mô hình sẽ 100% hết ảo giác.",
      "Đồng nhất Grounding/RAG với Fine-tuning mô hình."
    ],
    sampleGoodAnalogies: [
      "Giống như học sinh chém gió lưu loát trong giờ vấn đáp: nhớ mang máng từ ngữ nên ghép lại rất trôi chảy dù không nắm bản chất.",
      "Grounding giống như thi đề mở (Open-book exam): giám thị phát tài liệu chuẩn và yêu cầu chỉ được trả lời dựa trên cuốn sách đó."
    ],
    sampleFalseAnalogies: [
      "Giống như máy tính bị nhiễm virus hoặc tràn RAM."
    ]
  }
};

/**
 * Danh mục các chủ đề và từ khóa hợp lệ thuộc giáo trình bài giảng AI (Day 1 - Day 6)
 */
export const VALID_CURRICULUM_TOPICS = [
  {
    id: "intro_genai",
    name: "Giới thiệu Generative AI (Mô hình sinh vs Luật)",
    keywords: [
      "generative", "generative ai", "tạo sinh", "mô hình sinh", "rule-based",
      "luật cố định", "quy tắc", "training data", "dữ liệu huấn luyện", "dữ liệu mẫu",
      "prompt", "prompting", "câu lệnh", "variation", "biến thiên", "biến thiên ngẫu nhiên",
      "xác suất", "responsible", "trách nhiệm", "kiểm chứng", "kiểm chứng con người",
      "kiểm chứng thông tin", "thông tin từ ai", "human verification"
    ],
  },
  {
    id: "hallucination",
    name: "Ảo giác LLM (Hallucination)",
    keywords: ["hallucination", "hallucinations", "ảo giác", "bịa", "bịa chuyện", "bịa thông tin", "chém gió", "fluency", "accuracy", "độ trôi chảy"],
  },
  {
    id: "grounding",
    name: "Grounding (Neo dữ liệu & Kiểm chứng nguồn)",
    keywords: [
      "grounding", "neo dữ liệu", "gắn nguồn", "bám nguồn", "trích dẫn nguồn",
      "fact-checking", "đối chiếu nguồn", "kiểm chứng", "kiểm chứng nguồn",
      "kiểm chứng thông tin", "kiểm tra thông tin", "xác thực", "context",
      "ngữ cảnh", "tài liệu tham chiếu", "nguồn"
    ],
  },
  {
    id: "rag",
    name: "RAG (Retrieval-Augmented Generation)",
    keywords: ["rag", "retrieval", "retrieval augmented generation", "truy xuất", "trích xuất", "truy xuất tăng cường", "trích xuất context", "doc", "document", "kho tài liệu", "tài liệu", "vector search", "top-k chunks"],
  },
  {
    id: "next_token_prediction",
    name: "Dự đoán token tiếp theo",
    keywords: ["next token prediction", "next token", "đoán từ tiếp theo", "dự đoán token", "token", "tokenization", "autoregressive", "tự hồi quy", "phân phối xác suất"],
  },
  {
    id: "attention",
    name: "Self-Attention Mechanism",
    keywords: ["attention", "self attention", "tự chú ý", "query", "key", "value", "qkv", "cross attention", "multi head attention"],
  },
  {
    id: "transformer",
    name: "Kiến trúc Transformer",
    keywords: ["transformer", "kiến trúc transformer", "encoder", "decoder", "feed forward", "layer norm", "positional encoding"],
  },
  {
    id: "prompt_engineering",
    name: "Kỹ thuật Prompt Engineering",
    keywords: ["prompt", "prompt engineering", "kỹ thuật prompt", "few shot", "zero shot", "system prompt", "chain of thought", "cot", "in context learning"],
  },
  {
    id: "vector_embedding",
    name: "Vector Database & Embedding",
    keywords: ["vector", "embedding", "vector embedding", "vector database", "vectordb", "cosine similarity", "khoảng cách cosine", "không gian vector", "latent space", "cross entropy"],
  },
  {
    id: "sampling_hyperparameters",
    name: "Nhiệt độ & Lấy mẫu (Temperature)",
    keywords: ["temperature", "nhiệt độ", "sampling", "top p", "top k", "nucleus sampling"],
  },
  {
    id: "context_window",
    name: "Cửa sổ ngữ cảnh (Context Window)",
    keywords: ["context window", "cửa sổ ngữ cảnh", "ngữ cảnh", "chiều dài context", "context length", "context rot"],
  },
  {
    id: "fine_tuning",
    name: "Fine-tuning & RLHF",
    keywords: ["fine tuning", "huấn luyện tinh chỉnh", "rlhf", "supervised learning", "pre training", "tiền huấn luyện", "turing test", "phép thử turing"],
  },
  {
    id: "problem_framing_automation",
    name: "Xác định bài toán & Độ tự động hóa",
    keywords: ["xác định bài toán", "bài toán kinh doanh", "độ tự động hóa", "automation level", "chỉ số thành công", "success metrics", "ràng buộc ai", "ai constraints", "human in the loop", "hitl", "latency", "throughput", "độ trễ"],
  },
  {
    id: "guardrails_evaluation",
    name: "Hàng rào an toàn & Đánh giá (Guardrails & Eval)",
    keywords: ["guardrails", "hàng rào an toàn", "đánh giá mô hình", "model evaluation", "golden set", "benchmark", "rubric"],
  }
];

export const CURRICULUM_SUGGESTIONS = [
  "Next-token prediction",
  "Prompt Engineering",
  "Vector Database",
  "Context Window",
  "Temperature",
  "Cross-Entropy Loss",
  "Human-in-the-loop",
];

function normalizeQuery(str: string): string {
  return str.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Kiểm tra xem một thuật ngữ có nằm trong phạm vi giáo trình bài giảng AI hay không.
 * Ngăn chặn tuyệt đối các thuật ngữ ngoài lề (nấu ăn, thể thao, code chung chung, tiền ảo...).
 */
export function isCurriculumConcept(conceptQuery: string): boolean {
  if (!conceptQuery || typeof conceptQuery !== "string") return false;
  const clean = normalizeQuery(conceptQuery);
  if (clean.length < 2) return false;

  // 1. Khớp trong KNOWLEDGE_BANK
  const cleanKey = clean.replace(/\s+/g, "_");
  if (KNOWLEDGE_BANK[cleanKey]) return true;
  for (const item of Object.values(KNOWLEDGE_BANK)) {
    if (
      normalizeQuery(item.id) === clean ||
      normalizeQuery(item.name) === clean ||
      normalizeQuery(item.vietnameseName) === clean
    ) {
      return true;
    }
  }

  // 2. Khớp trong danh mục chủ đề bài giảng (với word-boundary matching)
  for (const topic of VALID_CURRICULUM_TOPICS) {
    for (const kw of topic.keywords) {
      const cleanKw = normalizeQuery(kw);
      if (clean === cleanKw) return true;

      // So khớp nguyên từ/cụm từ độc lập (Word boundary)
      const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^a-z0-9à-ỹ])${escaped}([^a-z0-9à-ỹ]|$)`, "i");
      if (regex.test(clean)) return true;
    }
  }

  return false;
}

/**
 * Lấy tri thức bám nguồn theo concept ID hoặc tên.
 */
export function getGroundingContext(conceptQuery: string): ConceptKnowledge {
  const cleanKey = conceptQuery.toLowerCase().trim().replace(/[\s-]+/g, "_");

  // Tìm trực tiếp
  if (KNOWLEDGE_BANK[cleanKey]) {
    return KNOWLEDGE_BANK[cleanKey];
  }

  // Tìm mờ theo tên
  for (const item of Object.values(KNOWLEDGE_BANK)) {
    if (
      item.id.includes(cleanKey) ||
      cleanKey.includes(item.id) ||
      item.name.toLowerCase().includes(conceptQuery.toLowerCase()) ||
      item.vietnameseName.toLowerCase().includes(conceptQuery.toLowerCase())
    ) {
      return item;
    }
  }

  // Khái niệm tùy chọn người dùng gõ thêm nếu nằm trong curriculum
  return {
    id: cleanKey,
    name: conceptQuery,
    vietnameseName: conceptQuery,
    lecture: "Day 1: AI & LLM Foundation",
    citations: "Bài giảng VLearn K4",
    slide: 1,
    coreDefinition: `Khái niệm '${conceptQuery}' trong chương trình AI Thực Chiến.`,
    keyPoints: [
      `Cần giải thích bản chất kỹ thuật của ${conceptQuery}`,
      "Cần liên hệ với nguyên lý vận hành của mô hình AI",
      "Cần có ví dụ minh họa hoặc sự so sánh ẩn dụ thực tế"
    ],
    commonMisconceptions: [
      "Nói chung chung trừu tượng mà không đi vào bản chất",
      "Dùng từ ngữ kỹ thuật phức tạp mà không cắt nghĩa được cho người mới"
    ],
    sampleGoodAnalogies: [
      "Một hiện tượng hoặc vật thể gần gũi trong đời sống minh họa cho cơ chế này."
    ],
    sampleFalseAnalogies: []
  };
}

