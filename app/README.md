# 🎓 TeachAI Frontend — Hướng Dẫn Cài Đặt & Khởi Chạy

Tài liệu này hướng dẫn chi tiết cách cấu hình môi trường, cài đặt thư viện và khởi chạy giao diện người dùng (Frontend) của TeachAI, đặc biệt là cách truy cập và trải nghiệm chính xác file **Playground (`app/playground/page.tsx`)**.

---

## 📋 1. Yêu Cầu Tiên Quyết (Prerequisites)

- **Node.js**: Phiên bản `>= 22.13.0` (khuyến nghị Node 22.x LTS)
- **NPM**: Đi kèm với Node.js
- Trình duyệt hiện đại hỗ trợ HTML5 Video và Backdrop Filter (Chrome, Edge, Brave, Safari, Firefox).

---

## ⚙️ 2. Thiết Lập Môi Trường (Environment Variables)

Dự án sử dụng OpenRouter API để cấp quyền cho mô hình AI đóng vai học sinh 15 tuổi (Socratic AI Student).

1. Tạo file `.env.local` ở thư mục gốc của dự án (nếu chưa có) bằng cách sao chép từ `.env.example`:
   ```bash
   cp .env.example .env.local
   # Trên Windows PowerShell:
   Copy-Item .env.example .env.local
   ```

2. Mở `.env.local` và điền khóa API của bạn:
   ```env
   # API Key từ https://openrouter.ai/keys
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here

   # Mô hình mặc định (có thể đổi sang google/gemini-2.5-flash hoặc openai/gpt-4o-mini)
   OPENROUTER_MODEL=google/gemini-2.5-flash
   ```

---

## 📦 3. Cài Đặt Thư Viện (Dependencies)

Mở terminal tại thư mục gốc của dự án và chạy:

```bash
npm install
```

---

## 🚀 4. Khởi Chạy Frontend (Dev Server)

Để khởi động server phát triển Vite / Vinext:

```bash
npm run dev
```

Sau khi chạy lệnh, màn hình console sẽ hiển thị:
```text
  vinext dev  (Vite 8.0.13)
  ➜  Local:   http://localhost:5173/
```

---

## 🎯 5. Hướng Dẫn Chạy Đúng File Trong Playground

Toàn bộ giao diện tương tác TeachAI (gồm AI Chatbot 15 tuổi, chọn bài giảng Day 1 & Day 2, modal slide, cấp chứng chỉ Flashcard) được đặt tại:
📁 **`app/playground/page.tsx`**

> ⚠️ **LƯU Ý QUAN TRỌNG:**
> - Đường dẫn gốc `http://localhost:5173/` mặc định có thể phục vụ trang tĩnh (`index.html`).
> - Để trải nghiệm **đầy đủ tính năng tương tác TeachBack AI**, bạn **PHẢI** mở đúng URL Playground:
>
> 👉 **[http://localhost:5173/playground](http://localhost:5173/playground)**

### Các bước thao tác trên giao diện Playground:
1. Mở trình duyệt tại: `http://localhost:5173/playground`
2. Tại màn hình danh sách bài học:
   - Chọn **Day 1: AI & LLM Foundation** (Slide 10–20) hoặc **Day 2: Xác định bài toán cho AI & Độ tự động hoá** (Slide 8–24).
   - Nhấn **"Dạy bài này →"** để vào phòng học.
3. Trong phòng học:
   - Đọc câu hỏi ban đầu của học sinh AI 15 tuổi.
   - Nhập lời giảng giải của bạn vào khung input cố định ở dưới cùng (hoặc bấm vào các chip gợi ý nút thắt nhận thức).
   - Bấm nút **`+`** để xem Slide tham chiếu (`📖 Xem Slide`) hoặc xin gợi ý Socratic (`💡 Xin gợi ý`).
   - Khi học sinh đạt mức thấu suốt (`Mastered ⭐`), bấm **"Xem Thẻ Flashcard"** để lấy chứng chỉ thấu suốt bài giảng.

---

## ✨ 6. Các Tính Năng Nổi Bật Trong `app/playground/page.tsx`

1. **Ambient Video Background (Dual Crossfade Looping)**:
   - Cơ chế 2 thẻ `<video>` chạy đan xen (crossfade) giúp video phông nền lặp vô tận mượt mà, không hề bị giật đen hay đứng hình.
2. **Dữ liệu bài giảng thực tế từ Slide Hackathon**:
   - **Day 1 (`Day 1: AI & LLM Foundation`)**: Slide 10–20, Next-token prediction, Context Window (bàn làm việc có hạn), Attention Mechanism, Ảo giác LLM (Hallucination), Grounding & RAG ("Cho tra sổ thay vì bắt nhớ"), Núm vặn Temperature.
   - **Day 2 (`Day 2: Xác định bài toán cho AI & Độ tự động hoá`)**: Slide 8–24, Google PAIR Reframe ("Can AI solve this in a unique way?"), Quick Problem Card (5 yếu tố), Khi nào NÊN và KHÔNG NÊN dùng AI, 3 Cấp độ giải pháp (Rule tĩnh vs Workflow vs AI Agent), Human-in-the-loop (HITL).
3. **Trải nghiệm Hội thoại TeachBack 3.0**:
   - Khung nhập bài giảng cố định ở chân trang (Fixed Bottom Prompt Card) theo phong cách tối giản.
   - Hộp thoại tin nhắn hiển thị cuộn mượt (Scrollable message area) với chiều rộng tối ưu 60% (`.chat-bubble-ai` & `.chat-bubble-user`).
   - Các nút chip gợi ý nhanh (FAQ Chips) giúp người dạy đi sâu vào các nút thắt nhận thức cốt tử.
4. **Hệ thống Modal trợ giảng**:
   - **Nút `+`**: Mở gợi ý Socratic (`💡 Xin gợi ý`) hoặc xem lại slide gốc (`📖 Xem Slide`).
   - **Modal Slide**: Tóm tắt các định nghĩa và trích dẫn chuẩn từ giáo trình.
   - **Thẻ Flashcard chứng nhận (`Mastered ✓`)**: Cấp chứng chỉ thấu suốt khi hoàn thành bài giảng với mức tăng trưởng độ hiểu (+85% High Gain) và sao chép được vào clipboard.

---

## 🛠️ 7. Kiểm Tra Lỗi & Build (Typecheck & Build)

- **Kiểm tra cú pháp TypeScript**:
  ```bash
  npx tsc --noEmit
  ```
  *(Kết quả trả về không có lỗi nào là đạt yêu cầu)*

- **Build dự án cho production**:
  ```bash
  npm run build
  ```
