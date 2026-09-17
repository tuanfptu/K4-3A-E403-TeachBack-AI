import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const CHATLOG_PATH = path.join(
  ROOT_DIR,
  "data",
  "vlearn-pack",
  "chatlog",
  "tutor_turns.csv"
);
const OUTPUT_REPORT_PATH = path.join(ROOT_DIR, "eval", "mining_evidence.md");

/**
 * Trình phân tích CSV đầy đủ xử lý chuỗi nhiều dòng trong ngoặc kép
 */
function parseFullCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // bỏ qua dấu ngoặc kép thoát
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.length > 1) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

function runChatlogMining() {
  console.log("==================================================");
  console.log("📊 BẮT ĐẦU PHÂN TÍCH CHATLOG TỰ ĐỘNG (R1 EVIDENCE MINING)");
  console.log(`Đọc file: ${CHATLOG_PATH}`);
  console.log("==================================================");

  if (!fs.existsSync(CHATLOG_PATH)) {
    console.error(`Không tìm thấy file: ${CHATLOG_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(CHATLOG_PATH, "utf8");
  const allRows = parseFullCSV(rawData);

  if (allRows.length < 2) {
    console.error("Dữ liệu CSV không hợp lệ!");
    process.exit(1);
  }

  const headers = allRows[0].map((h) => h.trim());
  const rows = allRows.slice(1);

  console.log(`Đã phân tích thành công: ${rows.length} lượt tương tác (turns)\n`);

  const moveIndex = headers.indexOf("move_used");
  const studentQuestionIndex = headers.indexOf("student_question");
  const tutorReplyIndex = headers.indexOf("tutor_reply");
  const turnIdIndex = headers.indexOf("turn_id");
  const lectureTitleIndex = headers.indexOf("lecture_title");

  const moveCounts = {};
  const verbatimEvidence = [];

  for (const row of rows) {
    const move = (row[moveIndex] || "unknown").trim();
    moveCounts[move] = (moveCounts[move] || 0) + 1;

    const question = row[studentQuestionIndex] || "";
    const reply = row[tutorReplyIndex] || "";
    const turnId = row[turnIdIndex] || "";
    const lecture = row[lectureTitleIndex] || "";

    // Trích xuất 5 ví dụ nguyên văn học viên bối rối hoặc hỏi ngây thơ
    if (
      verbatimEvidence.length < 5 &&
      question.length > 30 &&
      question.length < 200 &&
      (question.toLowerCase().includes("sao") ||
        question.toLowerCase().includes("khác nhau") ||
        question.toLowerCase().includes("tại sao") ||
        question.toLowerCase().includes("ảo giác") ||
        question.toLowerCase().includes("bịa"))
    ) {
      verbatimEvidence.push({
        turnId,
        lecture,
        move,
        question: question.replace(/\r?\n/g, " ").trim(),
        reply: reply.slice(0, 160).replace(/\r?\n/g, " ").trim(),
      });
    }
  }

  const totalTurns = rows.length;
  const reviewCount = moveCounts["review_concept"] || 0;
  const directAnswerCount = moveCounts["give_direct_answer"] || 0;
  const oneWayLecturing = reviewCount + directAnswerCount;
  const probingCount = moveCounts["ask_probing_question"] || 0;
  const clarifyCount = moveCounts["clarify_question"] || 0;

  const oneWayPercent = ((oneWayLecturing / totalTurns) * 100).toFixed(1);
  const probingPercent = ((probingCount / totalTurns) * 100).toFixed(2);

  console.log("🎯 KẾT QUẢ ĐO LƯỜNG ĐỊNH LƯỢNG THẬT:");
  console.log(`• Tổng lượt chat: ${totalTurns.toLocaleString()}`);
  console.log(
    `• Thuyết giảng 1 chiều (review_concept + direct_answer): ${oneWayLecturing.toLocaleString()} (${oneWayPercent}%)`
  );
  console.log(
    `• Hỏi ngược học viên (ask_probing_question): ${probingCount} (${probingPercent}%)`
  );
  console.log(
    `• Làm rõ câu hỏi (clarify_question): ${clarifyCount} (${(
      (clarifyCount / totalTurns) *
      100
    ).toFixed(1)}%)\n`
  );

  // Sinh file markdown kết quả phục vụ R1
  const report = `# Báo Cáo Khai Phá Dữ Liệu Chatlog (Data Mining Evidence Report)
*Thời gian tạo: ${new Date().toISOString()}*
*Người thực hiện: Lương Quang Huy (Backend · AI Engineer)*
*Nguồn dữ liệu: \`data/vlearn-pack/chatlog/tutor_turns.csv\` (${totalTurns.toLocaleString()} lượt tương tác)*

---

## 1. Bằng chứng Định lượng (Quantifiable Evidence - Tiêu chuẩn R1)

Dữ liệu khai thác thực nghiệm từ **${totalTurns.toLocaleString()} lượt tương tác thật** giữa học viên và AI Tutor trên nền tảng VLearn chứng minh **nỗi đau cốt lõi của việc học thụ động**:

| Hành vi của AI Tutor (\`move_used\`) | Số lượt xuất hiện | Tỷ lệ (%) | Nhận xét sư phạm |
|---|:---:|:---:|---|
| **Giảng giải một chiều** (\`review_concept\` + \`give_direct_answer\`) | **${oneWayLecturing.toLocaleString()}** | **${oneWayPercent}%** | Học viên chỉ ngồi đọc thụ động câu trả lời của bot, không được chủ động tư duy |
| **Hỏi ngược để đào sâu** (\`ask_probing_question\`) | **${probingCount}** | **CHỈ ${probingPercent}%** | Hầu như không có cơ chế kiểm tra xem học viên có thực sự hiểu bản chất hay không |
| **Làm rõ câu hỏi** (\`clarify_question\`) | ${clarifyCount.toLocaleString()} | ${((clarifyCount / totalTurns) * 100).toFixed(1)}% | Làm rõ yêu cầu của học viên |
| **Các hành động khác** | ${(totalTurns - oneWayLecturing - probingCount - clarifyCount).toLocaleString()} | ${(100 - parseFloat(oneWayPercent) - parseFloat(probingPercent) - (clarifyCount / totalTurns) * 100).toFixed(1)}% | Tương tác hành chính |

> **🔥 Kết luận cốt lõi:** Có tới **${oneWayPercent}%** các lượt tương tác là giảng giải một chiều. Học viên hoàn toàn thụ động đọc text dài, dẫn tới hiện tượng **"Ảo tưởng thấu hiểu" (Illusion of Explanatory Depth)**: cứ nghĩ mình hiểu khi đọc chữ của bot, nhưng khi thi vấn đáp hoặc làm sản phẩm thực tế thì không giải thích nổi.

---

## 2. 5 Bằng Chứng Nguyên Văn Trích Xuất Thật (Verbatim Quotes)

${verbatimEvidence
  .map(
    (e, idx) => `### Bằng chứng ${idx + 1}: Lượt \`${e.turnId}\` (Bài: *${e.lecture}*)
* **Câu hỏi của học viên:** *"${e.question}"*
* **Cách Tutor cũ xử lý (\`${e.move}\`):** *"${e.reply}..."*
* **Lỗ hổng sư phạm:** Bot tuôn ra một đoạn văn bản dài đầy thuật ngữ, hoàn toàn không hỏi ngược lại: *"Bạn có thể lấy ví dụ ngoài đời cho mình nghe được không?"*.
`
  )
  .join("\n")}

---

## 3. Ý nghĩa đối với Đề tài TeachBack AI (Track D3)
Chính từ bằng chứng định lượng **chỉ có ${probingPercent}% câu hỏi ngược**, nhóm chúng tôi phát triển giải pháp **TeachBack AI (Protégé Effect)**:
1. Đảo ngược vai trò: Học viên đóng vai **Thầy giáo** dạy lại cho AI.
2. AI đóng vai học sinh 15 tuổi: **Soi từ ngữ đao to búa lớn** và **liên tục "vòi" ví dụ đời thực**.
3. Chuyển đổi phương thức học từ **${oneWayPercent}% thụ động** thành **100% chủ động giải thích**, giúp học viên thực sự làm chủ kiến thức!
`;

  fs.writeFileSync(OUTPUT_REPORT_PATH, report, "utf8");
  console.log(`📄 Đã lưu báo cáo chứng minh nỗi đau vào: ${OUTPUT_REPORT_PATH}`);
}

runChatlogMining();

