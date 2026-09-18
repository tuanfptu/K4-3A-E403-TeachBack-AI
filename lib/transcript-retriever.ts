import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface TranscriptChunk {
  chunkId: string; // e.g. "T01-001", "T04-048"
  sourceFile: string;
  lectureTitle: string;
  sectionTitle: string;
  content: string;
}

// Bộ nhớ đệm in-memory cho chunks để tìm kiếm siêu tốc (< 5ms)
let cachedChunks: TranscriptChunk[] | null = null;

function resolveTranscriptDirectory(): string | null {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const configuredRoot = process.env.VLEARN_DATA_DIR?.trim();
  const candidates = [
    configuredRoot,
    path.join(process.cwd(), "data", "vlearn-pack"),
    process.env.INIT_CWD ? path.join(process.env.INIT_CWD, "data", "vlearn-pack") : null,
    path.resolve(moduleDir, "..", "data", "vlearn-pack"),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const root of candidates) {
    const transcriptDir = root.endsWith("transcript")
      ? root
      : path.join(root, "transcript");
    if (fs.existsSync(transcriptDir)) return transcriptDir;
  }
  console.warn("[TranscriptRetriever] Không tìm thấy transcript trong các vị trí đã cấu hình.");
  return null;
}

/**
 * Nạp và bóc tách toàn bộ ~700 chunks từ 6 file transcript trong data/vlearn-pack/transcript/
 */
export function loadAllTranscriptChunks(): TranscriptChunk[] {
  if (cachedChunks) return cachedChunks;

  const chunks: TranscriptChunk[] = [];
  const transcriptDir = resolveTranscriptDirectory();
  if (!transcriptDir) {
    return [];
  }

  const files = fs
    .readdirSync(transcriptDir)
    .filter((f) => f.startsWith("transcript-") && f.endsWith("-clean.md"));

  for (const file of files) {
    const filePath = path.join(transcriptDir, file);
    const text = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");

    // Lấy tiêu đề bài học từ dòng đầu tiên
    const titleMatch = text.match(/^#\s*(.+)$/m);
    const lectureTitle = titleMatch ? titleMatch[1].trim() : file;

    // Tách theo từng Section (## ) và từng Chunk (**[Txx-NNN]**)
    const lines = text.split("\n");
    let currentSection = "Mở đầu";
    let currentChunkId = "";
    let currentChunkContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith("## ")) {
        currentSection = line.replace(/^##\s*/, "").trim();
        continue;
      }

      const chunkStartMatch = line.match(/^\*\*\[(T\d{2}-\d{3})\]\*\*\s*(.*)$/);
      if (chunkStartMatch) {
        // Lưu chunk trước đó nếu có
        if (currentChunkId && currentChunkContent.length > 0) {
          chunks.push({
            chunkId: currentChunkId,
            sourceFile: file,
            lectureTitle,
            sectionTitle: currentSection,
            content: currentChunkContent.join("\n").trim(),
          });
        }
        currentChunkId = chunkStartMatch[1];
        currentChunkContent = [chunkStartMatch[2]];
      } else if (currentChunkId) {
        currentChunkContent.push(line);
      }
    }

    // Đẩy chunk cuối cùng của file
    if (currentChunkId && currentChunkContent.length > 0) {
      chunks.push({
        chunkId: currentChunkId,
        sourceFile: file,
        lectureTitle,
        sectionTitle: currentSection,
        content: currentChunkContent.join("\n").trim(),
      });
    }
  }

  cachedChunks = chunks;
  return chunks;
}

/**
 * Tìm kiếm các đoạn transcript liên quan nhất theo từ khóa / ngữ nghĩa nhẹ
 */
export function searchTranscript(query: string, topK = 3): TranscriptChunk[] {
  const allChunks = loadAllTranscriptChunks();
  if (allChunks.length === 0) return [];

  const cleanQuery = query.toLowerCase().trim();
  const queryTokens = cleanQuery
    .split(/[\s,.-]+/)
    .filter((t) => t.length > 2);

  const scored = allChunks.map((chunk) => {
    let score = 0;
    const lowerContent = chunk.content.toLowerCase();
    const lowerSection = chunk.sectionTitle.toLowerCase();

    // 1. Khớp nguyên cụm từ khóa (Exact phrase match)
    if (lowerContent.includes(cleanQuery)) {
      score += 20;
    }
    if (lowerSection.includes(cleanQuery)) {
      score += 15;
    }

    // 2. Khớp từng từ đơn
    for (const token of queryTokens) {
      if (lowerSection.includes(token)) score += 5;
      const occurrences = (lowerContent.match(new RegExp(token, "g")) || []).length;
      score += Math.min(occurrences * 2, 10);
    }

    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.chunk);
}

/**
 * Tạo ngữ cảnh đối chiếu động từ Transcript cho một khái niệm bất kỳ
 */
export function getDynamicGroundingContext(conceptQuery: string): {
  citations: string;
  chunks: TranscriptChunk[];
  combinedExcerpts: string;
} {
  const matchedChunks = searchTranscript(conceptQuery, 3);

  if (matchedChunks.length === 0) {
    return {
      citations: "Bài giảng VLearn K4",
      chunks: [],
      combinedExcerpts: "Khái niệm trong bài giảng AI thực chiến.",
    };
  }

  const citations = matchedChunks.map((c) => `[${c.chunkId}]`).join(", ");
  const combinedExcerpts = matchedChunks
    .map(
      (c) =>
        `--- Đoạn trích [${c.chunkId}] (${c.lectureTitle} · Mục: ${c.sectionTitle}) ---\n"${c.content}"`
    )
    .join("\n\n");

  return {
    citations: `Transcript ${citations} · ${matchedChunks[0].lectureTitle}`,
    chunks: matchedChunks,
    combinedExcerpts,
  };
}

