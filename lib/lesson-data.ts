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
  referenceAnswer: string;
  requiredPoints: Array<{
    id: string;
    title: string;
    description: string;
    hint: string;
  }>;
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
        referenceAnswer:
          "LLM tạo câu bằng cách chấm xác suất cho các token có thể xuất hiện tiếp theo, chọn một token, nối nó vào ngữ cảnh rồi lặp lại. Mục tiêu của quá trình này là tạo chuỗi ngôn ngữ hợp lý và trôi chảy, không phải tự tra cứu hay kiểm chứng sự thật. Vì vậy mô hình có thể sinh một câu nghe rất thuyết phục nhưng chứa dữ kiện sai; độ trôi chảy không đồng nghĩa với độ chính xác.",
        requiredPoints: [
          {
            id: "probabilistic_next_token",
            title: "Cơ chế dự đoán token",
            description: "LLM chọn token tiếp theo theo phân bố xác suất dựa trên ngữ cảnh rồi lặp lại theo vòng predict → append → rerun.",
            hint: "Hãy nghĩ tới bàn phím điện thoại liên tục đoán mảnh chữ tiếp theo dựa trên phần câu đã có.",
          },
          {
            id: "fluency_not_truth",
            title: "Trôi chảy không phải sự thật",
            description: "Mô hình tối ưu chuỗi chữ nghe hợp lý, không tự tra cứu hoặc xác minh tính đúng sai của dữ kiện.",
            hint: "Một câu nghe tự nhiên có chắc đã được đối chiếu với nguồn đáng tin chưa?",
          },
          {
            id: "hallucination_consequence",
            title: "Hệ quả ảo giác",
            description: "Do cơ chế trên và giới hạn dữ liệu/context, LLM có thể tự tin sinh thông tin sai hoặc bịa.",
            hint: "Nối cơ chế đoán chữ với hiện tượng trả lời rất tự tin nhưng dữ kiện lại không tồn tại.",
          },
        ],
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
        referenceAnswer:
          "Context window là lượng token hữu hạn mà mô hình có thể nhìn thấy trong một lần xử lý; mọi chỉ dẫn, lịch sử và tài liệu muốn mô hình dùng đều phải nằm trong vùng này, giống đồ được bày lên một bàn làm việc. Context quá dài làm tăng chi phí và độ trễ, đồng thời thông tin ở giữa có thể bị bỏ sót do hiện tượng lost in the middle. Vì vậy cần giữ context sạch và đặt thông tin quan trọng ở vị trí dễ được chú ý.",
        requiredPoints: [
          {
            id: "finite_visible_context",
            title: "Vùng nhìn hữu hạn",
            description: "Context window là lượng token hữu hạn mô hình có thể quan sát trong một lần xử lý; nội dung cần dùng phải được đưa vào đó.",
            hint: "Muốn mô hình thấy tài liệu thì tài liệu ấy phải được đặt ở đâu trong lần gọi hiện tại?",
          },
          {
            id: "cost_and_latency",
            title: "Chi phí và độ trễ",
            description: "Context càng dài thì càng tốn token, tốn tiền và xử lý chậm hơn.",
            hint: "Bàn càng chất nhiều tài liệu thì thời gian đọc và chi phí sẽ thay đổi thế nào?",
          },
          {
            id: "lost_in_middle",
            title: "Lost in the middle",
            description: "Trong prompt rất dài, thông tin nằm giữa có thể bị mô hình bỏ sót; bàn rộng không đồng nghĩa với dùng hiệu quả.",
            hint: "Thông tin bị chôn ở giữa một prompt rất dài có luôn được chú ý như phần đầu và cuối không?",
          },
        ],
        source: {
          range: "Day 1 · Slide 14 & 16",
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
        referenceAnswer:
          "Grounding neo câu trả lời vào nguồn tham chiếu tin cậy được đưa vào context thay vì chỉ dựa vào phần kiến thức đã đóng trong trọng số. Với RAG, hệ thống truy xuất các đoạn tài liệu liên quan rồi chèn chúng vào prompt để LLM tạo câu trả lời dựa trên các đoạn đó. Cách này giảm nguy cơ bịa và giúp đối chiếu nguồn, nhưng vẫn cần kiểm chứng vì không loại bỏ sai sót tuyệt đối.",
        requiredPoints: [
          {
            id: "trusted_grounding",
            title: "Neo vào nguồn tin cậy",
            description: "Grounding cung cấp nguồn tham chiếu đáng tin trong context thay vì chỉ trông chờ trí nhớ của mô hình.",
            hint: "Thay vì bắt mô hình nhớ, ta cần đưa thứ gì lên 'bàn làm việc' của nó?",
          },
          {
            id: "rag_retrieve_then_generate",
            title: "Hai bước của RAG",
            description: "RAG truy xuất đoạn tài liệu liên quan rồi đưa đoạn đó vào prompt/context để tạo câu trả lời.",
            hint: "RAG phải tìm đúng đoạn trước; bước tiếp theo là đặt đoạn đó ở đâu để mô hình sử dụng?",
          },
          {
            id: "reduce_not_eliminate",
            title: "Giảm chứ không triệt tiêu lỗi",
            description: "Grounding/RAG giảm ảo giác và hỗ trợ đối chiếu nguồn nhưng vẫn cần kiểm chứng đầu ra.",
            hint: "Có tài liệu tham chiếu rồi thì hệ thống có chắc chắn đúng 100% hay vẫn cần kiểm tra?",
          },
        ],
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
        referenceAnswer:
          "Temperature điều chỉnh cách lấy mẫu từ phân bố xác suất của token tiếp theo. Mức thấp, đặc biệt gần 0, ưu tiên token chắc chắn nên kết quả ổn định và phù hợp với code hoặc phân tích. Mức cao làm phân bố phẳng hơn, tăng đa dạng và sáng tạo nhưng cũng dễ lệch hướng. Temperature không làm mô hình thông minh hơn và không bổ sung kiến thức mới.",
        requiredPoints: [
          {
            id: "sampling_control",
            title: "Điều khiển lấy mẫu",
            description: "Temperature thay đổi mức độ ngẫu nhiên khi lấy mẫu token từ phân bố xác suất.",
            hint: "Núm này tác động vào cách chọn token từ bảng xác suất, không phải vào dữ liệu huấn luyện.",
          },
          {
            id: "low_temperature",
            title: "Temperature thấp",
            description: "Mức thấp/gần 0 ưu tiên token chắc chắn, cho kết quả ổn định; hợp code, trích xuất và phân tích.",
            hint: "Khi cần cùng đầu vào cho kết quả nhất quán, nên vặn núm về phía nào?",
          },
          {
            id: "high_temperature_tradeoff",
            title: "Temperature cao và đánh đổi",
            description: "Mức cao tăng đa dạng/sáng tạo nhưng dễ lạc đề; nó không làm mô hình thông minh hơn hay thêm tri thức.",
            hint: "Đa dạng hơn mang lại lợi ích gì và đồng thời tăng rủi ro gì?",
          },
        ],
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
        referenceAnswer:
          "PAIR khuyên thay câu hỏi solution-first 'Có thể dùng AI để làm gì?' bằng hai câu: 'Chúng ta có thể giải quyết vấn đề này như thế nào?' và 'AI có thể giải quyết vấn đề này theo một cách độc đáo không?'. Trình tự này buộc đội ngũ hiểu đúng vấn đề trước rồi mới cân nhắc AI như một phương án, tránh xây chatbot hoặc agent cho sai vấn đề.",
        requiredPoints: [
          {
            id: "how_might_we_solve",
            title: "Hỏi cách giải quyết vấn đề",
            description: "Bắt đầu bằng câu hỏi 'How might we solve...?' để tập trung vào vấn đề thực tế.",
            hint: "Câu hỏi đầu tiên nên nói về cách giải quyết vấn đề hay nói ngay về công nghệ AI?",
          },
          {
            id: "unique_ai_value",
            title: "Kiểm tra giá trị riêng của AI",
            description: "Sau đó hỏi AI có giải quyết bài toán theo cách độc đáo hoặc tốt hơn giải pháp thường hay không.",
            hint: "Điều gì khiến AI đáng dùng hơn rule, checklist hoặc quy trình thông thường?",
          },
          {
            id: "problem_before_solution",
            title: "Problem-first",
            description: "Hiểu đúng vấn đề trước, coi AI chỉ là một phương án và tránh solution-first.",
            hint: "Một chatbot rất tốt có ích gì nếu đội ngũ đang giải nhầm vấn đề?",
          },
        ],
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
        prompt: "Khung Quick Problem Card gồm những thành phần nào để biến yêu cầu mơ hồ thành bài toán rõ ràng và đo được?",
        hint: "Nhớ lại nhóm thông tin về vấn đề và người bị ảnh hưởng, quy trình hiện tại, nút thắt/tác động, chỉ số thành công và định hướng giải pháp.",
        referenceAnswer:
          "Quick Problem Card nêu bài toán trong một câu và đối tượng chịu ảnh hưởng; mô tả quy trình hiện tại; xác định nút thắt cùng tác động hoặc hao phí; đặt chỉ số thành công có baseline và target; cuối cùng ghi định hướng giải pháp như No AI, Rule, Workflow, Agent hoặc chưa xác định. Nhờ vậy hiệu quả có thể được đo thay vì chỉ nói chung chung.",
        requiredPoints: [
          {
            id: "problem_and_actor",
            title: "Bài toán và đối tượng",
            description: "Nêu vấn đề cụ thể trong một câu và actor/bộ phận chịu tác động trực tiếp.",
            hint: "Ai đang gặp vấn đề gì là hai thông tin mở đầu cần có.",
          },
          {
            id: "current_workflow",
            title: "Quy trình hiện tại",
            description: "Mô tả các bước vận hành hiện tại, thường khoảng 3–7 bước.",
            hint: "Trước khi cải tiến, cần biết công việc đang chạy qua những bước nào.",
          },
          {
            id: "bottleneck_and_impact",
            title: "Nút thắt và tác động",
            description: "Chỉ ra khâu chậm/sai/lặp lại và lượng hóa hao phí hoặc hậu quả của nó.",
            hint: "Không chỉ nói chỗ nào đau; hãy nói nó gây mất bao nhiêu thời gian, chi phí hoặc chất lượng.",
          },
          {
            id: "metric_and_direction",
            title: "Chỉ số và hướng giải pháp",
            description: "Đặt success metric với baseline/target và ghi hướng No AI, Rule, Workflow, Agent hoặc chưa xác định.",
            hint: "Làm sao chứng minh đã tốt hơn, và hiện tại nên đi theo hướng giải pháp nào?",
          },
        ],
        source: {
          range: "Day 2 · Slide 9–12",
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
        referenceAnswer:
          "Rule/Script phù hợp khi đầu vào ổn định, logic viết được bằng if/else và cần kết quả dự đoán được. Workflow dùng LLM cho đầu vào đa dạng hoặc đầu ra linh hoạt trong một quy trình có bước/gate rõ ràng và có cách đo, kiểm tra. Agent dành cho nhiệm vụ nhiều bước, nhiều công cụ, tình huống thay đổi và cần tự quyết giữa các bước nhưng phải có kiểm soát rủi ro. Luôn chọn giải pháp đơn giản nhất đủ đạt mục tiêu; không nên dùng AI cho thông tin tĩnh, logic cố định, yêu cầu minh bạch tuyệt đối hoặc nơi một lần sai có chi phí quá lớn.",
        requiredPoints: [
          {
            id: "rule_level",
            title: "Rule / Script",
            description: "Dùng cho đầu vào ổn định, logic if/else rõ và kết quả phải dự đoán được hoặc đúng tuyệt đối.",
            hint: "Tác vụ tính thuế theo công thức cố định có cần LLM không?",
          },
          {
            id: "workflow_level",
            title: "LLM Workflow",
            description: "Dùng cho đầu vào đa dạng/đầu ra linh hoạt trong chuỗi bước có gate, cách đo và khả năng kiểm tra.",
            hint: "Một chuỗi gọi LLM tuần tự có bước kiểm tra giữa chừng thuộc cấp nào?",
          },
          {
            id: "agent_level",
            title: "Agent",
            description: "Dùng khi nhiệm vụ nhiều bước/công cụ, tình huống động và cần tự quyết giữa các bước với kiểm soát rủi ro.",
            hint: "Khi hệ thống phải tự lập kế hoạch, chọn công cụ và điều chỉnh theo kết quả, đó là cấp nào?",
          },
          {
            id: "simplest_safe_solution",
            title: "Chọn mức đơn giản và an toàn",
            description: "Ưu tiên giải pháp đơn giản nhất đủ dùng; tránh AI khi thông tin tĩnh, logic cố định, cần minh bạch tuyệt đối hoặc sai một lần quá đắt.",
            hint: "Phức tạp hơn có luôn hiệu quả hơn không, nhất là khi lỗi rất tốn kém?",
          },
        ],
        source: {
          range: "Day 2 · Slide 15 & 18–21",
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
        referenceAnswer:
          "AI có thể tạo False Positive và False Negative với chi phí không đối xứng, nên không thể chỉ nhìn accuracy chung. Cần định nghĩa reward/success metric, ngưỡng có ý nghĩa và hành động cụ thể khi vượt ngưỡng. Với tác vụ rủi ro cao nên ưu tiên augment hoặc yêu cầu con người preview, sửa và phê duyệt; hệ thống cũng cần logging, fallback, rollback và người chịu trách nhiệm. Ví dụ nếu tỷ lệ câu trả lời bị TA sửa vượt 30%, hạ mức tự động xuống chỉ gợi ý thay vì gửi thẳng.",
        requiredPoints: [
          {
            id: "asymmetric_errors",
            title: "Sai số có chi phí khác nhau",
            description: "AI có FP/FN và chi phí hai loại lỗi không đối xứng; phải cân bằng precision/recall theo người dùng.",
            hint: "Báo động giả và bỏ sót có gây cùng một loại hậu quả không?",
          },
          {
            id: "threshold_and_action",
            title: "Ngưỡng và hành động",
            description: "Success metric phải gắn chỉ số, ngưỡng có nghĩa và hành động cụ thể khi hệ thống vượt ngưỡng lỗi.",
            hint: "Nếu tỷ lệ đầu ra bị sửa vượt 30%, hệ thống sẽ làm gì tiếp theo?",
          },
          {
            id: "human_approval",
            title: "Con người kiểm duyệt",
            description: "Tác vụ rủi ro cao nên augment hoặc có bước preview/edit/approve thay vì để AI gửi hay quyết định thẳng.",
            hint: "Ở quyết định quan trọng, đầu ra AI nên được gửi thẳng hay qua một bước duyệt?",
          },
          {
            id: "operational_controls",
            title: "Kiểm soát vận hành",
            description: "Cần logging, fallback, rollback, kịch bản kiểm thử và người chịu trách nhiệm giám sát lỗi.",
            hint: "Ngoài nút duyệt, cần những cơ chế nào để phát hiện và quay lui khi hệ thống sai?",
          },
        ],
        source: {
          range: "Day 2 · Slide 17 & 22–26",
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
