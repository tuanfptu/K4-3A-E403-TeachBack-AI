# 📊 Báo Cáo Nghiên Cứu Người Dùng & Bằng Chứng Khảo Sát (User Research & Evidence Table)

**Người thực hiện:** Lương Khánh Toàn (MSSV: 2A202602836) — *BA · Research & Validation*  
**Đề tài:** TeachBack AI — Học bằng cách dạy (Track D3)  
**Ngày hoàn thành:** 17/09/2026  

---

## 1. Phương Pháp Thu Thập Dữ Liệu (Methodology)

Nghiên cứu được tiến hành dựa trên 2 nguồn dữ liệu kết hợp:
1. **Dữ liệu định lượng lớn (Data Mining):** Khai thác từ **13,494 lượt tương tác chatlog** thực tế giữa học viên và AI Tutor trên nền tảng VLearn (`data/vlearn-pack/chatlog/tutor_turns.csv`).
2. **Khảo sát chuyên sâu (Survey & Interviews):** Thực hiện trên **22 học viên** đang tham gia khóa học AI/LLM về thói quen học tập, khó khăn khi tiếp thu kiến thức trừu tượng và nhu cầu thực hành phương pháp Feynman.

---

## 2. Bảng Bằng Chứng Nghiên Cứu Định Lượng (Quantitative Evidence Table)

| STT | Luận điểm / Giả thuyết nghiên cứu | Số liệu thực chứng | Nguồn bằng chứng | Kết luận BA |
|:---:|---|:---:|:---:|---|
| **E1** | **Học tập bị động chiếm ưu thế tuyệt đối:** AI Tutor hiện tại chỉ đóng vai trò "cỗ máy tuôn chữ" thay vì người kích thích tư duy. | **95.3%** (12,858 / 13,494 lượt tương tác) là giảng giải một chiều (`review_concept` + `give_direct_answer`). | Chatlog Mining VLearn | Người học rơi vào thế thụ động 100%, đọc lướt và không có động lực cấu trúc lại kiến thức trong đầu. |
| **E2** | **Thiếu vắng câu hỏi gợi mở đào sâu:** Rất hiếm khi hệ thống kiểm tra xem người học có thực sự hiểu bản chất hay chỉ nhớ vẹt từ khóa. | **CHỈ 0.21%** (28 / 13,494 lượt) có hành vi hỏi ngược (`ask_probing_question`). | Chatlog Mining VLearn | Hệ sinh thái học tập thiếu hoàn toàn cơ chế phản xạ Socratic. |
| **E3** | **Hiện tượng "Ảo tưởng thấu hiểu" (Illusion of Explanatory Depth):** Học viên cảm thấy rất hiểu khi đọc slide, nhưng khi phải tự giải thích hoặc trả lời phỏng vấn thì lúng túng. | **86.4%** (19 / 22 học viên khảo sát) thừa nhận từng rơi vào trạng thái này. | Khảo sát 22 học viên | Cần một cơ chế buộc học viên phải "Output" (nói/viết ra thành câu hoàn chỉnh) thay vì chỉ "Input" (đọc/nghe). |
| **E4** | **Thiếu người đồng hành để luyện tập Feynman:** Muốn áp dụng kỹ thuật "học bằng cách dạy" nhưng không tìm được người có thời gian và đủ kiên nhẫn để nghe mình giải thích. | **81.8%** (18 / 22 học viên) không có bạn học hoặc mentor để thực hành giảng lại hàng ngày. | Khảo sát 22 học viên | Nhu cầu có một "bạn học ảo" (Protégé Agent) kiên nhẫn 24/7 là cực kỳ cấp thiết. |
| **E5** | **AI hiện nay hay "mớm đáp án" (Over-assisting):** Khi hỏi ChatGPT/Claude, chatbot thường giải thích luôn tất cả khiến học viên lười tư duy (Cognitive Offloading). | **90.9%** (20 / 22 học viên) cho biết thường bị AI giải hộ đáp án thay vì hướng dẫn tự giải. | Khảo sát 22 học viên | Persona học sinh ngây thơ có kiểm soát (Controlled Naivety) là chìa khóa để chặn việc AI mớm lời. |

---

## 3. Dữ Liệu Khảo Sát Chi Tiết 22 Học Viên (Survey Raw Breakdown)

### Câu hỏi 1: "Khi đọc xong slide lý thuyết (ví dụ cơ chế Attention, RAG), bạn tự tin mình hiểu bao nhiêu %?"
- Rất tự tin (80 - 100%): 4 học viên (18.2%)
- Khá tự tin (50 - 79%): 14 học viên (63.6%)
- Mơ hồ (< 50%): 4 học viên (18.2%)

### Câu hỏi 2: "Khi bị người khác hỏi bất chợt: 'Hãy giải thích cơ chế đó bằng ví dụ đời thường', bạn cảm thấy thế nào?"
- Giải thích trôi chảy ngay lập tức: 3 học viên (13.6%)
- Bị ngắc ngứ, nhớ lõm bõm từ khóa nhưng không xâu chuỗi được: **15 học viên (68.2%)**
- Hoàn toàn bế tắc: 4 học viên (18.2%)

### Câu hỏi 3: "Rào cản lớn nhất khi bạn muốn tự luyện tập giảng lại bài (Feynman Technique) là gì?"
- Không có ai ngồi nghe mình giảng: **18 học viên (81.8%)**
- Người nghe không có chuyên môn nên không biết mình nói đúng hay sai: **16 học viên (72.7%)**
- Ngại bị phán xét hoặc sợ nói sai: **12 học viên (54.5%)**

---

## 4. 5 Trích Dẫn Thực Tế Từ Người Học (Learner Quotes)

> *"Nhiều khi em đọc slide thấy từ 'Next-token prediction' tưởng dễ ợt, nhưng đến lúc đi phỏng vấn bị hỏi 'Ủa thế nó khác gì bàn phím điện thoại gợi ý từ?' thì em câm nín luôn, vì chưa bao giờ tự đặt câu hỏi so sánh như vậy."*  
> — **Bạn N.V.H (Học viên khóa AI Foundation)**

> *"Mỗi lần hỏi ChatGPT, nó tuôn ra cả sớ dài 500 chữ. Em đọc thấy xuôi tai bấm like, 5 phút sau tắt tab đi là đầu óc rỗng tuếch. Nó thông minh hộ em chứ em không thông minh lên."*  
> — **Bạn T.M.K (Học viên Data/AI)**

> *"Nếu có một con AI đóng vai đứa em lớp 9 tò mò, ngồi nghe mình giải thích rồi ngây ngô hỏi 'Ủa anh ơi sao lại thế?', em nghĩ em sẽ nhớ bài giảng đó cả năm."*  
> — **Bạn Đ.Q.C (Học viên tham gia thử nghiệm)**

> *"Cái hay nhất là nó đừng chấm điểm em 5/10 hay 6/10. Em muốn cảm giác như đang chỉ bài cho bạn học, sai thì nó hỏi vặn để em tìm cách nói lại cho dễ hiểu hơn."*  
> — **Bạn L.Q.H (Willing User)**

> *"Lúc em copy nguyên định nghĩa từ slide dán vào, con bot bảo: 'Em đọc sách cũng thấy câu này mà em chả hiểu, anh ví dụ ngoài đời đi'. Câu đó làm em giật mình và buộc phải tự nghĩ ví dụ."*  
> — **Bạn N.T.T (Người tham gia test prototype)**
