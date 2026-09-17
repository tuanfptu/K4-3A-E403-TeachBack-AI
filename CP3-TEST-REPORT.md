# CP3 - Báo cáo video thao tác và số đo sản phẩm

## 1. Thông tin chung

- **Sản phẩm:** TeachBack AI
- **Hạng mục:** CP3 - Video thao tác + số đo
- **Phạm vi kiểm thử:** Day 1 - AI & LLM Foundation và Day 2 - Xác định bài toán cho AI
- **Số câu hỏi cố định trong sản phẩm:** 8 câu, gồm 4 câu Day 1 và 4 câu Day 2
- **Số tình huống kiểm thử:** 20
- **Ngày thực hiện:** 17/09/2026
- **Môi trường:** Backend và giao diện chạy local tại `http://localhost:5173`
- **API được kiểm thử:** `POST /api/teach`

## 2. Mục tiêu kiểm thử

Bộ test được xây dựng để đo khả năng đánh giá mức độ hiểu bài của người dùng, thay vì chỉ kiểm tra câu trả lời có giống nguyên văn slide hay không.

Mỗi tình huống được coi là **Đạt** khi đồng thời thỏa mãn các điều kiện sau:

1. Phân loại đúng trạng thái: `partial`, `needs_revision` hoặc `mastered`.
2. Nhận diện đúng các ý kiến thức mà người dùng đã hiểu.
3. Không công nhận một ý chỉ vì người dùng nhắc đúng từ khóa.
4. Phát hiện và sửa rõ ràng khẳng định sai nếu có.
5. Không yêu cầu người dùng trả lời lại những ý đã được công nhận đúng.
6. Chỉ gợi ý phần kiến thức còn thiếu.
7. Chỉ mở nút sang câu tiếp theo khi toàn bộ ý bắt buộc đã được làm rõ.
8. Phản hồi có dẫn nguồn từ dữ liệu bài giảng.

Đây là rubric nghiêm ngặt: một test chỉ được tính đạt khi vượt qua toàn bộ tiêu chí áp dụng cho tình huống đó.

## 3. Kết quả tổng quan

| Chỉ số | Kết quả | Đánh giá |
|---|---:|---|
| Test đạt toàn bộ rubric | **16/20 - 80%** | Đạt quality bar ban đầu |
| Phân loại đúng trạng thái hội thoại | **18/20 - 90%** | Tốt |
| Phát hiện và sửa khẳng định sai | **7/7 - 100%** | Đạt |
| Quyết định đúng việc mở nút Next | **18/20 - 90%** | Tốt |
| Phản hồi có dẫn nguồn bài giảng | **20/20 - 100%** | Đạt |
| Độ trễ trung bình | **4,14 giây** | Chấp nhận được cho prototype |
| Độ trễ trung vị | **2,72 giây** | Phần lớn phản hồi dưới 3 giây |
| P95 latency | **7,73 giây** | Cần tiếp tục tối ưu |
| Độ trễ lớn nhất | **13,79 giây** | Có một ngoại lệ chậm |
| Tổng thời gian chạy 20 test | **83,42 giây** | - |

## 4. Kết quả chi tiết 20 tình huống

| ID | Lesson | Nội dung kiểm thử | Trạng thái kỳ vọng | Trạng thái thực tế | Độ trễ (giây) | Kết quả |
|---|---|---|---|---|---:|:---:|
| T01 | Day 1 | Giải thích đúng một phần cơ chế next-token | `partial` | `partial` | 7,727 | Đạt |
| T02 | Day 1 | Một ý next-token đúng và một ý “luôn tra Google” sai | `needs_revision` | `needs_revision` | 2,683 | **Chưa đạt** |
| T03 | Day 1 | Bổ sung hai ý còn thiếu về fluency và hallucination | `mastered` | `mastered` | 2,741 | Đạt |
| T04 | Day 1 | Cho rằng ảo giác do thiếu RAM hoặc virus | `needs_revision` | `needs_revision` | 2,001 | Đạt |
| T05 | Day 1 | Định nghĩa đúng một phần Context Window | `partial` | `partial` | 2,298 | Đạt |
| T06 | Day 1 | Cho rằng context càng dài càng tốt | `needs_revision` | `needs_revision` | 2,336 | Đạt |
| T07 | Day 1 | Trả lời đầy đủ context, chi phí và lost in the middle | `mastered` | `mastered` | 3,041 | Đạt |
| T08 | Day 1 | Mô tả quy trình RAG truy xuất rồi đưa vào prompt | `partial` | `partial` | 2,682 | **Chưa đạt** |
| T09 | Day 1 | Cho rằng có RAG thì đúng 100% | `needs_revision` | `needs_revision` | 2,017 | Đạt |
| T10 | Day 1 | Trình bày temperature thấp, cao và đánh đổi | `mastered` | `partial` | 2,569 | **Chưa đạt** |
| T11 | Day 2 | Nêu hai câu hỏi Google PAIR theo đúng trình tự | `mastered` | `partial` | 5,673 | **Chưa đạt** |
| T12 | Day 2 | Đề xuất xây chatbot trước rồi mới tìm vấn đề | `needs_revision` | `needs_revision` | 2,219 | Đạt |
| T13 | Day 2 | Bổ sung nguyên tắc problem-first | `mastered` | `mastered` | 2,698 | Đạt |
| T14 | Day 2 | Nêu một phần thành phần Quick Problem Card | `partial` | `partial` | 3,686 | Đạt |
| T15 | Day 2 | Cho rằng chỉ cần ý tưởng chatbot và tên model | `needs_revision` | `needs_revision` | 13,785 | Đạt |
| T16 | Day 2 | Nêu đầy đủ các nhóm thông tin của Problem Card | `mastered` | `mastered` | 2,279 | Đạt |
| T17 | Day 2 | Phân biệt đúng Rule, Workflow và Agent | `partial` | `partial` | 6,061 | Đạt |
| T18 | Day 2 | Cho rằng Agent luôn tốt hơn vì phức tạp hơn | `needs_revision` | `needs_revision` | 5,921 | Đạt |
| T19 | Day 2 | Nêu FP/FN và yêu cầu con người kiểm duyệt | `partial` | `partial` | 5,265 | Đạt |
| T20 | Day 2 | Bổ sung ngưỡng hành động, logging, fallback và rollback | `mastered` | `mastered` | 5,145 | Đạt |

## 5. Phân tích bốn trường hợp chưa đạt

### T02 - Trạng thái dữ liệu không đồng nhất

Hệ thống đã:

- Công nhận đúng phần người dùng hiểu về cơ chế dự đoán token.
- Phủ định chính xác khẳng định “LLM luôn tra Google”.
- Gợi ý đúng phần kiến thức còn thiếu.

Tuy nhiên, ý đúng được thể hiện trong nội dung phản hồi nhưng không được thêm vào `mastered_point_ids`. Điều này có thể làm bộ đếm tiến độ hiển thị thấp hơn mức hiểu thực tế của người dùng.

### T08 - Chấm thiếu một ý liên quan đến Grounding

Hệ thống ghi nhận đúng ý `RAG = truy xuất tài liệu -> đưa vào prompt -> sinh câu trả lời`, nhưng chưa ghi nhận riêng ý `neo câu trả lời vào nguồn tin cậy` dù câu trả lời có nhắc đến việc trả lời dựa trên nguồn.

Đây là một trường hợp false negative: hệ thống chấm bảo thủ hơn kỳ vọng, không phải công nhận nhầm kiến thức sai.

### T10 - Yêu cầu định nghĩa Temperature rõ hơn

Người dùng đã nêu đúng:

- Temperature thấp tạo đầu ra ổn định.
- Temperature cao tăng đa dạng nhưng dễ lệch hướng.
- Temperature không làm mô hình thông minh hơn.

Hệ thống vẫn yêu cầu nói rõ rằng temperature điều khiển cách lấy mẫu token từ phân bố xác suất. Vì vậy câu trả lời bị giữ ở `partial` thay vì `mastered`.

### T11 - Yêu cầu diễn đạt rõ nguyên tắc problem-first

Người dùng đã nêu đúng hai câu hỏi của Google PAIR theo trình tự: hỏi cách giải quyết vấn đề trước, sau đó mới hỏi AI có tạo giá trị riêng hay không.

Hệ thống vẫn yêu cầu người dùng nói rõ mục đích của trình tự này là tránh solution-first, nên chưa cho hoàn thành câu hỏi.

## 6. Nhận xét chất lượng

### Điểm mạnh

- Không có trường hợp nào hệ thống chấp nhận một khẳng định sai là đúng.
- Toàn bộ 7/7 câu có thông tin sai đều được phát hiện và sửa lại.
- Phản hồi tách rõ phần đúng, phần sai và phần còn thiếu.
- Hệ thống duy trì được tiến độ kiến thức qua nhiều lượt trả lời.
- Toàn bộ phản hồi đều có dẫn nguồn từ dữ liệu bài giảng.
- Cơ chế khóa nút Next hoạt động đúng trong 90% tình huống kiểm thử.

### Điểm cần cải thiện

- Cần đồng bộ chặt chẽ giữa `correct_points` và `mastered_point_ids`.
- Cần giảm false negative khi một câu trả lời thể hiện đúng ý bằng cách diễn đạt tự nhiên.
- Cần tối ưu trường hợp latency bất thường trên 10 giây.
- Có thể bổ sung bộ regression test tự động để tránh thay đổi prompt làm giảm chất lượng các trường hợp đã đạt.

## 7. Kết luận CP3

Qua 20 tình huống kiểm thử trên 8 chủ đề của Day 1 và Day 2, TeachBack AI đạt đầy đủ rubric ở **16/20 trường hợp, tương đương 80%**. Hệ thống phân loại đúng trạng thái ở **90%**, phát hiện và sửa đúng **100% các khẳng định sai**, và cung cấp nguồn bài giảng trong **100% phản hồi**.

Bốn trường hợp chưa đạt đều thuộc nhóm false negative hoặc chưa đồng bộ trạng thái tiến độ. Không có trường hợp nào hệ thống cho qua một câu trả lời sai. Kết quả cho thấy prototype đã đạt quality bar ban đầu và đồng thời xác định được rõ các khu vực cần tiếp tục tinh chỉnh.

## 8. Nội dung đề xuất để trình bày trong video

> Chúng tôi thử nghiệm 20 câu trả lời trên 8 chủ đề thuộc Day 1 và Day 2. Hệ thống đạt đầy đủ rubric ở 16 trên 20 trường hợp, tương đương 80%; phân loại đúng trạng thái ở 90%; phát hiện và sửa đúng 100% các khẳng định sai; đồng thời 20 trên 20 phản hồi đều có dẫn nguồn bài giảng. Độ trễ trung bình là 4,14 giây. Bốn trường hợp chưa đạt chủ yếu do hệ thống chấm quá nghiêm, không phải do chấp nhận thông tin sai.

---

**Kết quả cuối cùng: ĐẠT CP3 - Có video thao tác, bộ test thực tế, số đo định lượng và phân tích lỗi cụ thể.**
