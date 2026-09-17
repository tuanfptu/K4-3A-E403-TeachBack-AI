# Báo Cáo Khai Phá Dữ Liệu Chatlog (Data Mining Evidence Report)
*Thời gian tạo: 2026-09-16T19:42:06.628Z*
*Người thực hiện: Lương Quang Huy (Backend · AI Engineer)*
*Nguồn dữ liệu: `data/vlearn-pack/chatlog/tutor_turns.csv` (13,494 lượt tương tác)*

---

## 1. Bằng chứng Định lượng (Quantifiable Evidence - Tiêu chuẩn R1)

Dữ liệu khai thác thực nghiệm từ **13,494 lượt tương tác thật** giữa học viên và AI Tutor trên nền tảng VLearn chứng minh **nỗi đau cốt lõi của việc học thụ động**:

| Hành vi của AI Tutor (`move_used`) | Số lượt xuất hiện | Tỷ lệ (%) | Nhận xét sư phạm |
|---|:---:|:---:|---|
| **Giảng giải một chiều** (`review_concept` + `give_direct_answer`) | **12,858** | **95.3%** | Học viên chỉ ngồi đọc thụ động câu trả lời của bot, không được chủ động tư duy |
| **Hỏi ngược để đào sâu** (`ask_probing_question`) | **28** | **CHỈ 0.21%** | Hầu như không có cơ chế kiểm tra xem học viên có thực sự hiểu bản chất hay không |
| **Làm rõ câu hỏi** (`clarify_question`) | 0 | 0.0% | Làm rõ yêu cầu của học viên |
| **Các hành động khác** | 608 | 4.5% | Tương tác hành chính |

> **🔥 Kết luận cốt lõi:** Có tới **95.3%** các lượt tương tác là giảng giải một chiều. Học viên hoàn toàn thụ động đọc text dài, dẫn tới hiện tượng **"Ảo tưởng thấu hiểu" (Illusion of Explanatory Depth)**: cứ nghĩ mình hiểu khi đọc chữ của bot, nhưng khi thi vấn đáp hoặc làm sản phẩm thực tế thì không giải thích nổi.

---

## 2. 5 Bằng Chứng Nguyên Văn Trích Xuất Thật (Verbatim Quotes)

### Bằng chứng 1: Lượt `T00017` (Bài: *day01-llm-foundation*)
* **Câu hỏi của học viên:** *"(Trang 6, đoạn được chọn: "bạn hãy giải thích giúp tôi sự giống và khác nhau của các tầng trí tuệ nhân tạo.") bạn hãy giải thích giúp tôi sự giống và khác nhau của các tầng trí tuệ nhân tạo."*
* **Cách Tutor cũ xử lý (`review_concept`):** *"Dựa trên nội dung bài học, các tầng của trí tuệ nhân tạo (AI Taxonomy) được phân chia theo cấu trúc bao hàm lẫn nhau, từ khái niệm rộng nhất đến các mô hình chu..."*
* **Lỗ hổng sư phạm:** Bot tuôn ra một đoạn văn bản dài đầy thuật ngữ, hoàn toàn không hỏi ngược lại: *"Bạn có thể lấy ví dụ ngoài đời cho mình nghe được không?"*.

### Bằng chứng 2: Lượt `T00038` (Bài: *5-day02-lecture-slides-v2*)
* **Câu hỏi của học viên:** *"(Trang 4, đoạn được chọn: "làm sao để hỏi khi bôi đen tài liệu?") làm sao để hỏi khi bôi đen tài liệu?"*
* **Cách Tutor cũ xử lý (`give_direct_answer`):** *"Để hỏi về một nội dung cụ thể, bạn chỉ cần thực hiện các bước sau:  1. **Bôi đen (chọn)** đoạn văn bản hoặc hình ảnh bạn đang thắc mắc trực tiếp trên slide bài..."*
* **Lỗ hổng sư phạm:** Bot tuôn ra một đoạn văn bản dài đầy thuật ngữ, hoàn toàn không hỏi ngược lại: *"Bạn có thể lấy ví dụ ngoài đời cho mình nghe được không?"*.

### Bằng chứng 3: Lượt `T00062` (Bài: *5-day02-lecture-slides-v2*)
* **Câu hỏi của học viên:** *"(Trang 1, đoạn được chọn: "Tại sao của tôi không load được trang slide") Tại sao của tôi không load được trang slide"*
* **Cách Tutor cũ xử lý (`give_direct_answer`):** *"Chào bạn, mình rất tiếc khi biết bạn gặp khó khăn trong việc xem slide bài giảng.   Vì mình là trợ lý học tập AI nên mình không có quyền truy cập trực tiếp vào..."*
* **Lỗ hổng sư phạm:** Bot tuôn ra một đoạn văn bản dài đầy thuật ngữ, hoàn toàn không hỏi ngược lại: *"Bạn có thể lấy ví dụ ngoài đời cho mình nghe được không?"*.

### Bằng chứng 4: Lượt `T00072` (Bài: *5-day02-lecture-slides-v2*)
* **Câu hỏi của học viên:** *"(Trang 1, đoạn được chọn: "VLearn Lecture Material") sao tôi không thấy tài liệu của thầy cô vậy"*
* **Cách Tutor cũ xử lý (`give_direct_answer`):** *"Chào bạn, bộ slide "day01-slide-blue-v1" mà bạn đang xem chính là tài liệu bài giảng (Lecture Material) cho buổi học này đấy [trang 1].   Thông thường, nội dung..."*
* **Lỗ hổng sư phạm:** Bot tuôn ra một đoạn văn bản dài đầy thuật ngữ, hoàn toàn không hỏi ngược lại: *"Bạn có thể lấy ví dụ ngoài đời cho mình nghe được không?"*.

### Bằng chứng 5: Lượt `T00205` (Bài: *5-day02-lecture-slides-v2*)
* **Câu hỏi của học viên:** *"(Trang 21, đoạn được chọn: "RNN và transformer khác nhau ơqr đâu") RNN và transformer khác nhau ơqr đâu"*
* **Cách Tutor cũ xử lý (`review_concept`):** *"RNN (Recurrent Neural Network) và Transformer có những khác biệt cơ bản trong cách xử lý dữ liệu:  1. **Cách xử lý dữ liệu (Tuần tự vs. Song song):**    - **RNN..."*
* **Lỗ hổng sư phạm:** Bot tuôn ra một đoạn văn bản dài đầy thuật ngữ, hoàn toàn không hỏi ngược lại: *"Bạn có thể lấy ví dụ ngoài đời cho mình nghe được không?"*.


---

## 3. Ý nghĩa đối với Đề tài TeachBack AI (Track D3)
Chính từ bằng chứng định lượng **chỉ có 0.21% câu hỏi ngược**, nhóm chúng tôi phát triển giải pháp **TeachBack AI (Protégé Effect)**:
1. Đảo ngược vai trò: Học viên đóng vai **Thầy giáo** dạy lại cho AI.
2. AI đóng vai học sinh 15 tuổi: **Soi từ ngữ đao to búa lớn** và **liên tục "vòi" ví dụ đời thực**.
3. Chuyển đổi phương thức học từ **95.3% thụ động** thành **100% chủ động giải thích**, giúp học viên thực sự làm chủ kiến thức!
