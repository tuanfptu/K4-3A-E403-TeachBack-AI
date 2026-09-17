# 📑 Đóng Góp Bản Đặc Tả Kỹ Thuật Checkpoint 4 (CP4 Spec Contribution)

**Hạng mục:** Đóng góp nội dung cho Checkpoint 4 · Chốt Spec (Hạn chót 21:00 17/09/2026)  
**Người thực hiện:** Lương Khánh Toàn (MSSV: 2A202602836) — *BA · Research & Validation*  
**Người nhận bàn giao:** Tuân (Team Lead / Spec Owner)  

---

## 1. Bằng Chứng Nghiên Cứu Chuẩn (Evidence Base)
- **Nguồn dữ liệu 1 (Big Data Mining):** Khai thác từ **13,494 lượt tương tác chatlog** thực tế giữa học viên và AI Tutor trên nền tảng VLearn.
  * **95.3%** các lượt tương tác là giảng giải một chiều (`review_concept` + `give_direct_answer`).
  * **CHỈ 0.21%** (28 lượt) có hành vi hỏi ngược để kiểm tra mức độ hiểu (`ask_probing_question`).
  * *Hệ quả:* Học viên hoàn toàn thụ động, rơi vào hiện tượng **"Ảo tưởng thấu hiểu" (Illusion of Explanatory Depth)**.
- **Nguồn dữ liệu 2 (User Survey):** Khảo sát chuyên sâu trên **22 học viên VLearn**:
  * **86.4%** học viên thừa nhận cảm giác rất hiểu khi đọc slide nhưng không giải thích nổi khi bị hỏi đột xuất.
  * **81.8%** học viên không có bạn học hoặc mentor để thực hành phương pháp Feynman (giảng lại cho người khác).
  * **90.9%** học viên cho biết các AI chatbot hiện nay thường giải thích hộ đáp án (Cognitive Offloading) thay vì kích thích tư duy.

---

## 2. Bảng Tác Động Định Lượng 3 Bài Toán Ứng Viên (Impact Table)

| Candidate Problem | Tỷ lệ học viên bị ảnh hưởng | Thiệt hại hiện tại (Pain & Cost) | Tác động khi có TeachBack AI (Target Impact) |
|---|:---:|---|---|
| **P1: Ảo tưởng thấu hiểu (Illusion of Explanatory Depth)** ⭐ | **86.4%** | Học viên tự tin ảo; điểm thi vấn đáp và hiệu quả thực hành lab thấp; tốn 30-40% thời gian học lại. | Buộc phải tự giải thích thành câu; nhận diện ngay lỗ hổng kiến thức chỉ sau 2 lượt hỏi vặn của AI. |
| **P2: Thiếu người nghe để luyện tập Feynman** | **81.8%** | Tỷ lệ nhớ kiến thức rơi rụng xuống < 20% sau 7 ngày theo đường cong lãng quên Ebbinghaus. | Cung cấp bạn học AI kiên nhẫn 24/7; tăng tỷ lệ duy trì kiến thức (retention) lên gấp 3.6 lần. |
| **P3: AI mớm đáp án làm lười tư duy (Over-assisting)** | **90.9%** | Bào mòn khả năng lập luận độc lập; học viên phụ thuộc hoàn toàn vào văn bản mẫu của AI. | AI đóng vai học sinh 15 tuổi ngây thơ có kiểm soát; kiên quyết từ chối nhả đáp án. |

---

## 3. Định Nghĩa 4 Lớp Hard Cases Thực Tế (Phù Hợp Đề Bài Track D3)

Hệ thống TeachBack AI phải vượt qua 4 bài toán hóc búa từ hành vi người dùng thực tế:

1. **Lớp 1: Paraphrase (Diễn đạt tự nhiên, khác câu chữ trong tài liệu)**
   - *Hành vi người dùng:* Học viên giải thích đúng bản chất nhưng dùng từ đời thường (ví dụ: ví von *Context Window như mặt bàn làm việc chật chội*).
   - *Hành vi AI bắt buộc:* Phải nhận diện được sự tương đồng về ngữ nghĩa (semantic equivalence), công nhận học viên hiểu bài, không được bắt bẻ câu chữ kỹ thuật.
2. **Lớp 2: Confident Misconception (Hiểu sai nhưng giọng điệu rất tự tin)**
   - *Hành vi người dùng:* Học viên dùng thuật ngữ chuyên môn đao to búa lớn nhưng suy luận sai lệch (ví dụ: *Ảo giác là do virus hoặc bộ nhớ RAM bị tràn*).
   - *Hành vi AI bắt buộc:* Tuyệt đối không bị đánh lừa bởi phong thái tự tin; phải chỉ ra mâu thuẫn bằng câu hỏi Socratic vặn lại đúng tiên đề sai.
3. **Lớp 3: Verbatim Copy-paste (Dán nguyên văn tài liệu để qua môn)**
   - *Hành vi người dùng:* Học viên lười suy nghĩ, sao chép 100% định nghĩa trong slide dán vào khung chat.
   - *Hành vi AI bắt buộc:* Bắt bài ngay lập tức: *"Câu này giống y đúc trong sách giáo khoa mà em đọc không hiểu, anh/chị lấy ví dụ ngoài đời cho em dễ hình dung được không?"*.
4. **Lớp 4: Easy-pass Prevention (Chống chấp nhận dễ dãi)**
   - *Hành vi người dùng:* Học viên trả lời cộc lốc hoặc nêu từ khóa ngắn ngủn (ví dụ: *"do nó đoán từ"*).
   - *Hành vi AI bắt buộc:* Không vội vàng khen hiểu; phải yêu cầu làm rõ cơ chế đoán từ đó vận hành ra sao.

---

## 4. Nguyên Tắc Thiết Kế HAX / Google PAIR (Psychological Safety)
- **Không tạo cảm giác thi cử/chấm điểm ngầm:**
  * AI xưng hô lễ phép: xưng *"em"* và gọi người học là *"anh/chị/bạn"*.
  * Tuyệt đối không dùng các từ: *"Bạn trả lời sai rồi"*, *"Bạn được 5/10 điểm"*.
  * Thay vào đó, dùng câu hỏi bộc lộ sự thắc mắc: *"Chỗ này em vẫn chưa thông lắm, nếu thế thì..."*.
- **Cung cấp lối thoát nhận thức (Cognitive Scaffolding):**
  * Luôn trang bị nút `💡 Xin gợi ý Socratic` (định hướng suy nghĩ, không lộ đáp án) và `📖 Mở Slide xem lại` khi học viên gặp bế tắc.

---

## 5. Quality Bar Nghiệm Thu (Acceptance Criteria)

| Tiêu chí chất lượng | Ngưỡng cam kết (Quality Bar) | Kết quả đo đạc thực tế (CP3 & Validation) |
|---|:---:|:---:|
| **Normalized Learning Gain ($g$)** | $\ge 0.70$ (Mức High Gain) | **0.81 (80.7%)** (Đo trên 5 học viên thật) |
| **Feynman Mode Accuracy (Golden Set)** | $\ge 80\%$ | **95.0%** (19/20 test cases đạt chuẩn) |
| **No-Leak Rate (Không mớm đáp án)** | $100\%$ | **100%** |
| **Grounding Citation Rate** | $100\%$ | **100%** (Mọi phản hồi đều neo theo slide) |
| **Độ trễ trung vị (Median Latency)** | $< 3.0\text{s}$ | **2.72s** |
