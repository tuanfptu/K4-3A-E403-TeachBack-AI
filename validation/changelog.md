# 📝 Nhật Ký Cải Tiến Sản Phẩm (Validation-Driven Changelog)

**Người thực hiện:** Lương Khánh Toàn (MSSV: 2A202602836) — *BA · Research & Validation*  
**Đề tài:** TeachBack AI — Track D3  
**Tài liệu theo dõi chu kỳ phản hồi & lặp cải tiến (Build - Measure - Learn)**  

---

## 📌 Tổng Quan Tiến Trình Lặp Sản Phẩm (Iteration Cycle)

Dựa trên kết quả đo lường và phản hồi từ 5 học viên thực tế, team đã tiến hành các đợt tinh chỉnh sản phẩm từ phiên bản CP1 đến CP4:

---

### [v1.3.0] — 17/09/2026 (Sau Thử Nghiệm Thực Tế & Phản Hồi Người Dùng)
#### 🚀 Cải tiến dựa trên User Feedback:
- **[UX/PAIR] Thêm thanh trạng thái thấu hiểu của học sinh (Cognitive Progress):**
  - *Lý do:* Học viên U1 muốn biết học sinh AI đã hiểu bài đến đâu.
  - *Thay đổi:* Hiển thị trực quan trạng thái `Đang lắng nghe 🤔` $\rightarrow$ `Còn thắc mắc ❓` $\rightarrow$ `Đã thấu suốt ⭐ (Mastered)`.
- **[Pedagogy] Tối ưu hóa phản xạ với Hard Cases (Chống lười & copy-paste):**
  - *Lý do:* Kiểm chứng thành công với phản hồi của U5 về hành vi dán nguyên văn slide.
  - *Thay đổi:* Thắt chặt guardrail so khớp câu chữ, kiên quyết từ chối công nhận các câu copy nguyên văn từ slide bài giảng.
- **[Model Flexibility] Tích hợp AI Model Selector:**
  - *Lý do:* Giảm độ trễ cho người dùng khi mạng chậm bằng cách cho phép chuyển đổi giữa Gemini Flash và GPT-4o-mini qua OpenRouter.

---

### [v1.2.0] — 17/09/2026 (Hoàn Thành Checkpoint 3 - AI Thật)
#### ⚙️ Cải tiến kỹ thuật:
- **Tích hợp API AI thật qua OpenRouter:** Thay thế toàn bộ mock logic bằng pipeline đánh giá và sinh phản hồi thời gian thực (`app/api/teach/route.ts`).
- **Xây dựng Knowledge Bank:** Nạp dữ liệu grounding chuẩn từ Slide Day 1 (AI & LLM Foundation) và Day 2 (Xác định bài toán cho AI).
- **Chạy Golden Set 20 Test Cases:** Đạt độ chính xác 95% và tỷ lệ không rò rỉ đáp án 100%.

---

### [v1.1.0] — 16/09/2026 (Hoàn Thành Checkpoint 2 - Clickable Flow)
#### 🎨 Giao diện & Luồng trải nghiệm:
- Xây dựng giao diện Playground (`app/playground/page.tsx`) với video ambient nền mượt mà (Dual Crossfade Looping).
- Xây dựng luồng hội thoại 3 bước: Chọn bài giảng $\rightarrow$ Giải thích $\rightarrow$ Nhận phản biện $\rightarrow$ Nhận chứng nhận Flashcard.

---

### [v1.0.0] — 16/09/2026 (Hoàn Thành Checkpoint 1 - Canvas & Nghiên Cứu Ban Đầu)
#### 📋 Nghiên cứu & Định hình bài toán:
- Khai phá 13,494 lượt chatlog từ VLearn, phát hiện 95.3% dạy thụ động và 0.21% hỏi ngược.
- Thực hiện khảo sát ban đầu trên 22 học viên để xác thực hiện tượng "Ảo tưởng thấu hiểu".
- Chốt đề tài Track D3: "Học bằng cách dạy — học viên dạy lại cho agent".
