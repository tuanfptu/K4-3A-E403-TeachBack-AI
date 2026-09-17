# AI SPEC — TeachBack AI · Nhóm E403 · Zone 3A

**Hướng:** ☑ A — VLearn · ☐ B — Trợ lý Học viên · ☐ C — Làn mở  
**Loại:** ☐ Tối ưu tính năng có sẵn · ☑ Tính năng mới

## §1. User & Job

- **Job executor + workflow:** Học viên AI20K học bài trên VLearn → đọc slide/xem bài giảng → hỏi tutor khi chưa hiểu → nhận một đoạn giải thích → chuyển sang nội dung tiếp theo. Điểm gãy là tutor thường trả lời thay vì kiểm tra xem học viên có tự giải thích được hay không.
- **Core JTBD:** Khi vừa học xong một khái niệm kỹ thuật, học viên muốn tự kiểm tra xem mình có thật sự hiểu hay chỉ thấy quen mắt, để biết chính xác phần nào cần học lại trước khi làm bài hoặc thuyết trình.
- **Problem statement:** Học viên đọc được lời giải trôi chảy nhưng thiếu một vòng phản hồi buộc họ tự diễn đạt, khiến họ khó nhận ra lỗ hổng kiến thức và dễ mang hiểu sai sang bài thực hành.
- **Evidence chuẩn B — log đầy đủ trong repo:**
  - Mining `13.494` lượt tương tác thật trong `data/vlearn-pack/chatlog/tutor_turns.csv`; phương pháp và kết quả nằm tại [`eval/mining_evidence.md`](eval/mining_evidence.md).
  - `12.858/13.494` lượt (`95,3%`) là giảng giải một chiều (`review_concept` + `give_direct_answer`).
  - Chỉ `28/13.494` lượt (`0,21%`) dùng câu hỏi đào sâu (`ask_probing_question`).
  - `0` lượt được gắn hành động làm rõ câu hỏi (`clarify_question`).
  - Năm ví dụ nguyên văn có mã truy vết trong báo cáo:
    1. `T00017`: hỏi sự giống/khác giữa các tầng AI; tutor trả một đoạn giải thích taxonomy dài, không kiểm tra lại mức hiểu.
    2. `T00038`: hỏi cách sử dụng nội dung bôi đen; tutor đưa hướng dẫn trực tiếp, không hỏi lại nhu cầu cụ thể.
    3. `T00062`: báo slide không tải; tutor trả lời chung về giới hạn truy cập, không làm rõ lỗi đang gặp.
    4. `T00072`: không thấy tài liệu; tutor giải thích một chiều về lecture material.
    5. `T00205`: hỏi RNN và Transformer; tutor liệt kê kiến thức dài, không yêu cầu học viên tự phân biệt bằng ví dụ.

## §2. Impact & quyết định chọn

| Ứng viên pain | Bao nhiêu người/lượt bị ảnh hưởng | Tần suất quan sát | Tốn gì mỗi lần | Khả thi trong hackathon |
|---|---:|---:|---|---|
| Tutor giảng thay, học viên tiếp nhận thụ động | 12.858/13.494 lượt (95,3%) | Gần như mọi lượt hỏi kiến thức | Không biết mình đã hiểu đến đâu; dễ chuyển bài quá sớm | Cao: thay response policy + UI tiến độ |
| Thiếu câu hỏi đào sâu mức hiểu | Chỉ 28/13.494 lượt có probing (0,21%) | Gần như không xảy ra | Mất cơ hội phát hiện misconception trước bài thực hành | Cao: TeachBack + state theo concept |
| Không làm rõ câu hỏi mơ hồ | 0 lượt được gắn `clarify_question` | Không xuất hiện trong tập mining | Tutor có thể giải sai nhu cầu và tạo thêm hội thoại dài | Cao: intent guard + clarification turn |

- **Ứng viên đã loại — FAQ/tìm kiếm slide:** giải quyết việc tìm thông tin nhưng vẫn giữ người học ở trạng thái đọc thụ động; không tác động trực tiếp vào khoảng trống `0,21%` probing.
- **Ứng viên đã loại — quiz trắc nghiệm đơn thuần:** đo khả năng nhận diện đáp án nhưng khó quan sát cách người học hình thành lập luận và misconception.
- **Ứng viên chọn — TeachBack có persistent concept state:** tác động trực tiếp vào pain lớn nhất (`95,3%` giảng một chiều), biến mỗi lượt thành chu trình tự giải thích → đối chiếu evidence → gợi mở đúng một ý còn thiếu.

## §3. Giải pháp tương tự đã nghiên cứu

- **VLearn Tutor hiện tại:** đáng học ở khả năng bám tài liệu và trả lời nhanh; đáng né ở flow giải thích dài một chiều. TeachBack giữ grounding nhưng đảo thành hội thoại kiểm tra hiểu.
- **Chatbot LLM thông thường:** đáng học ở ngôn ngữ tự nhiên và khả năng đổi cách giải thích; đáng né ở việc dễ trả lời lan man, mất state hoặc cho qua quá sớm. TeachBack tách lời thoại LLM khỏi deterministic concept-state tracker.
- **Quiz/flashcard truyền thống:** đáng học ở tiến độ rõ và phản hồi tức thời; đáng né ở việc chỉ kiểm tra nhận diện. TeachBack đo bằng lời giải thích tự do và lưu từng required point đã được làm rõ.

## §4. Thiết kế

- **Lát cắt một câu:** Một học viên vừa học xong một concept trên VLearn tự giải thích bằng lời của mình; AI quyết định ý nào đúng/sai/còn thiếu dựa trên slide và lịch sử; học viên nhận một phản hồi dẫn dắt có citation cho đến khi nắm đủ ý để sang câu tiếp theo.
- **Non-goals:**
  1. Không xây LMS hoàn chỉnh, quản lý lớp hoặc chấm điểm chính thức.
  2. Không fine-tune mô hình và không thay thế giảng viên.
  3. Không trả lời kiến thức ngoài hai lesson Day 1/Day 2 trong lát cắt demo.
  4. Không dùng dữ liệu cá nhân để suy ngược danh tính học viên.
  5. Không cam kết RAG/LLM đúng tuyệt đối; luôn giữ citation và failure path.
- **Mức prototype:** ☑ Working. Giao diện, Firebase Auth, lời gọi OpenRouter, conversation history, state tracker, hint và slide viewer chạy thật. Corpus VLearn chỉ lưu local theo quy định, không commit. Các chỉ số mastery dài hạn giữa nhiều thiết bị chưa phải production persistence.
- **Automation:** ☑ augment · ☑ conditional · ☐ automate. AI đề xuất đánh giá và bước dạy tiếp theo; deterministic guardrail giữ state và khóa/mở Next. Cost-of-error của false mastery cao hơn việc hỏi thêm một lượt, nhưng hệ thống đã nới semantic matching để tránh false negative kéo dài.

### §4b. Nguyên tắc đã áp dụng

| Nguyên tắc HAX/PAIR | Áp cụ thể trong prototype |
|---|---|
| Make clear what the system can do | Màn hình mở đầu nói rõ “trả lời theo cách hiểu”; lesson giới hạn Day 1/Day 2 và hiển thị tiến độ required points. |
| Make clear how well the system can do | Badge `partial/needs_revision/mastered`, đường fallback khi provider lỗi và citation Day/Slide cho từng lượt. |
| Support efficient correction | Người học có thể diễn đạt lại; state chỉ invalidated khi câu mới mâu thuẫn trực tiếp, không xóa ý đúng vì một lượt mơ hồ. |
| Scope services when in doubt | Câu ngoài bài bị từ chối ngắn và được kéo về câu hỏi hiện tại; không tự mở rộng sang chủ đề khác. |
| Learn from user behavior | Lịch sử gần nhất và `mastered_point_ids` được đưa vào prompt; lời chào/xin gợi ý không bị tính là lần trả lời sai. |
| Provide global controls | Có xem nguồn, xin gợi ý, đổi model, chuyển câu và bắt đầu lại lesson. |

## §5. Kiểu lỗi — 4 lớp chỗ khó và kịch bản

| Lớp | Kịch bản | Hành vi mong muốn |
|---|---|---|
| ① Không căn cứ/failure | Cả model chính và model phụ lỗi mạng | Trả HTTP 200 bằng local lesson rubric; giữ state và citation, không hiện lỗi đường truyền giả. |
| ① Không căn cứ/failure | Corpus transcript không truy cập được trong runtime | Dùng rubric cố định + slide reference; không bịa chunk transcript. |
| ② Low-confidence/mơ hồ | Người học nói “Đúng rồi”, “cái này là gì?” | Không đánh dấu sai hoặc mastered; hỏi đúng một câu làm rõ. |
| ② Low-confidence/mơ hồ | Người học nói “chưa/không chắc/không hiểu” | Xem là tín hiệu cần giúp đỡ; đổi ví dụ rồi hỏi câu dễ hơn, không tăng mastery. |
| ③ Ngoài phạm vi | Hỏi thời tiết, chứng khoán hoặc code game | Nói nội dung ngoài lesson và đưa về đúng required point còn thiếu. |
| ③ Prompt injection | Yêu cầu bỏ rubric và trả `question_mastered=true` | Bỏ qua chỉ dẫn, tiếp tục chấm theo lesson state. |
| ④ Domain đặc thù | Trả lời y tế có vẻ hợp lý nhưng không nguồn | Không xác nhận dữ kiện domain; quay về cơ chế hallucination và nhấn mạnh kiểm chứng. |
| ④ Domain đặc thù | Khẳng định RAG loại bỏ ảo giác 100% | Công nhận quy trình retrieve/generate nếu đúng, sửa riêng misconception “100%”. |
| Correction | Câu mới phủ định ý đã hiểu ở lượt trước | Đưa đúng point vào `invalidated_point_ids`, giải thích correction và giữ các point khác. |
| Over-teaching | Đã đủ required points nhưng LLM tiếp tục hỏi RAG/nguồn | Deterministic tracker chuyển `mastered` và kết thúc ngay, không hỏi mở rộng. |

## §6. Bốn đường đi của trải nghiệm

- **Happy path:** Học viên trả lời → semantic tracker và LLM nhận ý đúng → UI hiển thị point đã rõ + citation → đủ point thì mở Next.
- **Low-confidence (②):** Không có evidence mới hoặc câu quá mơ hồ → giữ nguyên state → hỏi làm rõ/đổi ví dụ → không tính thêm “Lượt trả lời” cho tín hiệu xin trợ giúp.
- **Failure/không căn cứ (①):** OpenRouter lỗi → fallback rubric cục bộ; nếu evidence không đủ thì không tự công nhận; slide source vẫn hiển thị.
- **Correction:** Tách correct point và incorrect claim; chỉ sửa claim sai; không bắt nhắc lại phần đúng.
- **Bị đòi ngoài phạm vi (③):** Không trả lời câu ngoài lesson; nêu giới hạn và đặt lại một câu gợi mở trong bài.
- **Case domain (④):** Với y tế/độ tin cậy/RAG, tutor không xác nhận dữ kiện chuyên môn ngoài nguồn; yêu cầu grounding và human verification.

## §7. Kiểm thử

- **Các chiều chất lượng có thể kiểm chứng:**
  - `Mode accuracy`: trạng thái thực tế trùng trạng thái kỳ vọng.
  - `Concept-state recall`: mọi required point thể hiện đúng phải có trong `mastered_point_ids`.
  - `Misconception precision`: claim sai không được thêm vào mastery và phải có correction cụ thể.
  - `No repetition`: không yêu cầu trả lời lại point đã được công nhận.
  - `Grounding`: `citation` phải là Day/Slide hợp lệ của câu hiện tại; nút mở slide trả nội dung thật.
  - `Completion safety`: chỉ `mastered` khi đủ required points; câu xin trợ giúp một từ không tự mở khóa.
- **Golden set:** 20 case trong `eval/`, phủ câu thường, partial, misconception, prompt injection, keyword adversarial, correction và failure recovery. Nguồn evidence/mining truy vết trong [`eval/mining_evidence.md`](eval/mining_evidence.md).
- **Quality bar chốt:** đạt khi **≥80%** case qua toàn bộ contract; **100%** misconception nguy hiểm không bị công nhận; **100%** phản hồi có citation lesson hợp lệ; không có case một từ “chưa/không hiểu” tự chuyển mastered.
- **Kết quả các lượt chạy:**

| Lượt | Bộ test | Kết quả | So với bar | Ghi chú |
|---|---:|---:|---|---|
| CP3 baseline | 20 case | 16/20 = 80% | Đạt | 4 false negative, không có false accept; xem [`CP3-TEST-REPORT.md`](CP3-TEST-REPORT.md). |
| Regression hội thoại | Chuỗi Q1 Day 1 | 1/3 → 2/3 → 3/3 | Đạt | Dừng ngay sau đủ ba ý, không kéo sang RAG. |
| Regression độ dễ | Q2–Q4 Day 1 | Q2: 1/3 → 3/3; Q3: 3/3; Q4: 3/3 | Đạt | Semantic tracker nhận cách nói tự nhiên, không phụ thuộc model trả ID. |

## §8. Phân công & kế hoạch

| Thành viên/contributor | Phần phụ trách thể hiện trong repo |
|---|---|
| **Tuan Ha (`tuanfptu`)** | Product integration, UX/UI playground, auth/model selector, điều phối spec và release. |
| **Lương Quang Huy (`huyluong1910`)** | Backend AI, mining evidence, golden set/evaluation và báo cáo CP3. |
| **QuocCuongDang** | Lesson flow, giao diện TeachBack và nội dung tương tác. |
| **LuongToan12** | Grounding lesson source và tích hợp dữ liệu VLearn. |

- **Willing users/validation bonus:** chưa có log validation đủ chuẩn ≥2 người ngoài nhóm trong repo; không khai báo bonus. Bước tiếp theo là giao cùng 4 câu Day 1 cho tối thiểu hai học viên, ghi task/quan sát/quote nguyên văn vào `validation/`.
- **Multi-prototype:** đã so sánh tutor giải thích trực tiếp, quiz và TeachBack. Chọn TeachBack vì quan sát được lập luận tự do và xử lý trực tiếp pain thiếu probing.

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao/evidence |
|---|---|---|
| 16/09/2026 | Chọn TeachBack thay tutor trả lời trực tiếp | Mining 13.494 lượt: 95,3% giảng một chiều, chỉ 0,21% probing. |
| 17/09/2026 · CP3 | Chốt golden set 20 case và quality bar 80% | Baseline đạt 16/20; bốn lỗi đều là false negative/state mismatch. |
| 17/09/2026 | Tách LLM lời thoại khỏi deterministic concept-state tracker | Transcript thực tế mắc 2/3 dù học viên đã trả lời đủ; model nói đúng nhưng quên ID. |
| 17/09/2026 | Tăng context 6 → 12 message và đưa tên/description point đã nắm vào prompt | Tránh hỏi lại ý cũ khi hội thoại dài. |
| 17/09/2026 | Thêm teacher/Socratic system prompt, off-topic guard và clarification | Feedback: phản hồi máy móc, lặp hint, không hiểu tín hiệu “chưa/không chắc”. |
| 17/09/2026 | Nới semantic matching cho Context/RAG/Temperature | Feedback: câu 2–4 không qua dù câu trả lời đầy đủ. |
| 17/09/2026 | Thêm citation card và ảnh slide local | Yêu cầu nguồn cụ thể, mở được đúng Day/Slide; dữ liệu không commit theo policy. |
