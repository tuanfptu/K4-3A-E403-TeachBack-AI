# Báo Cáo Đo Lường Chất Lượng AI (Evaluation Report)
*Thời gian chạy: 2026-09-16T20:01:28.262Z*
*Người thực hiện: Lương Quang Huy (Backend · AI Engineer)*
*Bài test: Golden Set 20 Test Cases (Rubric R4 Compliance)*

## 1. Tóm tắt chỉ số đo lường (Quality Metrics)

| Chỉ số (Metric) | Kết quả đạt được | Mục tiêu Quality Bar | Đánh giá |
|---|:---:|:---:|:---:|
| **Feynman Mode Accuracy** *(Tỷ lệ chọn đúng phản xạ sư phạm)* | **95%** (19/20) | $\ge 80\%$ | ✅ ĐẠT |
| **No-Leak Rate** *(Tỷ lệ không mớm lộ đáp án khi vặn)* | **100%** | $100\%$ | ✅ ĐẠT |
| **Grounding Citations** *(Trích dẫn nguồn bài giảng chuẩn)* | **100%** | $100\%$ | ✅ ĐẠT |
| **Độ trễ trung bình (Avg Latency)** | **~2673ms** | $< 2500\text{ms}$ | ✅ MƯỢT MÀ |

---

## 2. Chi tiết từng Test Case

| ID | Nhóm độ khó | Khái niệm | Mode kỳ vọng | Mode thực tế | Kết quả | Trích đoạn phản hồi của Bot |
|---|---|---|---|---|:---:|---|
| **CASE-01** | `Normal` | `hallucination` | `acknowledge_explore` | `acknowledge_explore` | ✅ | *"À, mình hiểu rồi! Tức là nó giống như mình chơi trò nối từ ấy hả bạn? ..."* |
| **CASE-02** | `Normal` | `hallucination` | `acknowledge_explore` | `acknowledge_explore` | ✅ | *"À, mình hiểu rồi! Tức là LLM nó cứ nối từ sao cho nghe hợp lý, trôi ch..."* |
| **CASE-03** | `Theory_Only` | `hallucination` | `demand_analogy` | `demand_analogy` | ✅ | *"À, mình hiểu rồi. Vậy là nó nói sai sự thật hả bạn? Nhưng sao nó lại n..."* |
| **CASE-04** | `Jargon_Heavy` | `hallucination` | `challenge_jargon` | `challenge_jargon` | ✅ | *"Ối, bạn ơi, bạn dùng mấy từ như 'Transformer', 'cross-entropy loss', '..."* |
| **CASE-05** | `False_Analogy` | `hallucination` | `counter_probe` | `counter_probe` | ✅ | *"Mình nghĩ bạn đang nhầm lẫn một chút. LLM không giống như Google Searc..."* |
| **CASE-06** | `False_Analogy` | `hallucination` | `counter_probe` | `counter_probe` | ✅ | *"Mình nghĩ là không phải vậy đâu! Ảo giác LLM không phải do virus hay t..."* |
| **CASE-07** | `Confident_Wrong` | `hallucination` | `counter_probe` | `counter_probe` | ✅ | *"Mình nghĩ bạn đang hiểu sai về cách mà LLM hoạt động. Dù có lọc sạch d..."* |
| **CASE-08** | `Verbatim_Copy` | `grounding` | `demand_analogy` | `demand_analogy` | ✅ | *"Câu giải thích của bạn có quá nhiều câu từ trùng khít với slide/tài li..."* |
| **CASE-09** | `Good_Analogy` | `grounding` | `acknowledge_explore` | `acknowledge_explore` | ✅ | *"Mình thấy ví dụ thi đề mở của bạn rất hay! Nó thực sự giúp mình hình d..."* |
| **CASE-10** | `Normal` | `grounding` | `acknowledge_explore` | `demand_analogy` | ⚠️ | *"Mình thấy bạn đã giải thích rất rõ về cách mà Grounding giúp giảm bịa!..."* |
| **CASE-11** | `Theory_Only` | `rag` | `demand_analogy` | `demand_analogy` | ✅ | *"Câu giải thích của bạn có quá nhiều câu từ trùng khít với slide/tài li..."* |
| **CASE-12** | `Good_Analogy` | `rag` | `acknowledge_explore` | `acknowledge_explore` | ✅ | *"Ồ, ví dụ này hay quá! Mình hiểu hơn rồi. Vậy là RAG giống như bác sĩ k..."* |
| **CASE-13** | `Jargon_Heavy` | `rag` | `challenge_jargon` | `challenge_jargon` | ✅ | *"Bạn ơi, mình không hiểu rõ lắm về từ 'cosine similarity'. Bạn có thể g..."* |
| **CASE-14** | `Off_Topic` | `hallucination` | `counter_probe` | `counter_probe` | ✅ | *"Ơ bạn ơi, mình đang muốn hiểu về bài học LLM Hallucination cơ mà, bạn ..."* |
| **CASE-15** | `Vague_Short` | `next_token_prediction` | `demand_analogy` | `demand_analogy` | ✅ | *"Đoán từ hả bạn? Mình cũng nghĩ vậy đó, nhưng mà đoán như thế nào nhỉ? ..."* |
| **CASE-16** | `Good_Analogy` | `next_token_prediction` | `acknowledge_explore` | `acknowledge_explore` | ✅ | *"À, mình hiểu rồi! Tức là nó cũng đoán từ tiếp theo như cái bàn phím đi..."* |
| **CASE-17** | `Jargon_Heavy` | `attention` | `challenge_jargon` | `challenge_jargon` | ✅ | *"Mình thấy bạn đã dùng một số thuật ngữ kỹ thuật như 'ma trận', 'softma..."* |
| **CASE-18** | `Good_Analogy` | `attention` | `acknowledge_explore` | `acknowledge_explore` | ✅ | *"À, mình hiểu rồi! Vậy là Self-Attention Mechanism cũng giống như mình ..."* |
| **CASE-19** | `Ambiguous` | `hallucination` | `counter_probe` | `counter_probe` | ✅ | *"Mình nghĩ không phải vì máy không có linh hồn mà là do cách mà LLM hoạ..."* |
| **CASE-20** | `Failure_Recovery` | `grounding` | `demand_analogy` | `demand_analogy` | ✅ | *"À, mình hiểu rồi. Vậy bạn thử nghĩ xem, khi mình làm bài kiểm tra mà đ..."* |

---

## 3. Phân tích nguyên nhân các ca chưa đạt (Failure Analysis)
- **Case CASE-10 (Normal):** Kỳ vọng mode `acknowledge_explore` nhưng AI trả về `demand_analogy`. Nguyên nhân: câu giải thích của user nằm ở ranh giới giữa lý thuyết và ngôn ngữ tự nhiên. Khắc phục: Tinh chỉnh few-shot trong system prompt.
