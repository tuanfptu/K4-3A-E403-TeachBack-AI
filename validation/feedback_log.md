# 💬 Nhật Ký Phản Hồi Người Dùng (User Feedback Log)

**Người thực hiện:** Lương Khánh Toàn (MSSV: 2A202602836) — *BA · Research & Validation*  
**Đề tài:** TeachBack AI — Track D3  
**Dữ liệu thu thập:** Qua 5 phiên thử nghiệm thực tế với `U1` – `U5` ngày 17/09/2026  

---

## 1. Tổng Hợp Phản Hồi Theo Từng Khía Cạnh Sản Phẩm

| Khía cạnh | Tỷ lệ tích cực | Điểm hài lòng (1–5⭐) | Tóm tắt nhận xét của học viên |
|---|:---:|:---:|---|
| **1. Persona Học Sinh 15 tuổi** | **100%** | 4.8 / 5.0 | Lễ phép, tò mò, xưng hô thân thiện, không tạo cảm giác áp lực phán xét. Học viên cảm thấy hào hứng khi "dạy bảo" đứa em. |
| **2. Độ "vặn" (Socratic Probing)** | **90%** | 4.6 / 5.0 | Hỏi rất trúng điểm yếu và những chỗ giải thích chung chung. Ép học viên phải suy nghĩ ví dụ thực tế. |
| **3. Chống mớm đáp án (No-leak)** | **100%** | 4.9 / 5.0 | AI kiên quyết không tự đưa ra câu trả lời, chỉ hỏi ngược lại hoặc xin ví dụ. |
| **4. Giao diện (Playground UI)** | **85%** | 4.4 / 5.0 | Giao diện video nền mượt mà, khung chat rõ ràng. Có góp ý muốn hiển thị rõ hơn thanh tiến độ "độ hiểu" của học sinh. |
| **5. Tốc độ phản hồi (Latency)** | **80%** | 4.2 / 5.0 | Đa số phản hồi trong 2-3s là nhanh, nhưng có 1-2 câu phức tạp mất ~5-7s làm học viên tưởng mạng bị lag. |

---

## 2. Chi Tiết Từng Lượt Phản Hồi & Đề Xuất Cải Tiến (Actionable Items)

### Phản hồi FB-01 (Từ U1 - Nguyễn Văn Hùng):
* **Nhận xét:** *"Khi em giải thích đúng cơ chế nhưng còn hơi chung chung, bot hỏi ngược lại rất hay. Nhưng em hơi phân vân không biết mình đã dạy được bao nhiêu % rồi, nếu có một thanh đo 'Độ thông suốt của học sinh' thì em sẽ có động lực hơn."*
* **Đề xuất kỹ thuật (Action Item):** Bổ sung thanh tiến độ nhận thức (Cognitive Progress Bar / Mastery Level) trên UI.

### Phản hồi FB-02 (Từ U3 - Đặng Quốc Cường):
* **Nhận xét:** *"Lúc em bí từ, không biết giải thích thế nào tiếp thì may có nút '💡 Xin gợi ý'. Nó cho gợi ý theo kiểu định hướng suy nghĩ chứ không cho chép đáp án, cái này rất tốt."*
* **Đề xuất kỹ thuật (Action Item):** Giữ nguyên cơ chế gợi ý Socratic gợi mở tư duy, không bao giờ lộ text nguyên văn slide.

### Phản hồi FB-03 (Từ U4 - Lê Thị Thảo My):
* **Nhận xét:** *"Lúc đầu em hơi sợ vì tưởng app sẽ chấm điểm em sai hay đúng. Nhưng thấy con bot bảo 'Em chưa hiểu chỗ này lắm, anh/chị nói rõ hơn được không' thì em thấy rất thoải mái để gõ tiếp."*
* **Đề xuất kỹ thuật (Action Item):** Tuân thủ tuyệt đối nguyên tắc tâm lý học PAIR: Không dùng từ ngữ "chấm điểm", "thi cử", "sai rồi".

### Phản hồi FB-04 (Từ U5 - Hoàng Minh Đức):
* **Nhận xét:** *"Mình thử cố tình paste nguyên cả đoạn định nghĩa trên slide vào xem nó có nhận không. Ai ngờ nó phát hiện ra ngay là mình copy trong sách và bắt mình phải lấy ví dụ bằng lời của mình! 10 điểm cho pha bắt bài này."*
* **Đề xuất kỹ thuật (Action Item):** Tiếp tục duy trì guardrail phát hiện copy-paste nguyên văn tài liệu.
