import { NextResponse } from "next/server";
import { getLesson } from "@/lib/lesson-data";
import { searchWebKnowledge } from "@/lib/web-search-tool";

interface ResearchRequestBody {
  lesson_id?: number;
  question_id?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResearchRequestBody;
    const lesson = [1, 2].includes(Number(body.lesson_id))
      ? getLesson(Number(body.lesson_id))
      : null;
    const question = lesson?.questions.find(
      (item) => item.id === Number(body.question_id)
    );

    if (!lesson || !question) {
      return NextResponse.json(
        { error: "Không tìm thấy câu hỏi cần tra cứu." },
        { status: 400 }
      );
    }

    const result = await searchWebKnowledge(
      `${question.concept} machine learning AI`,
      { maxResults: 5 }
    );

    return NextResponse.json({
      sources: result.items,
      cached: Boolean(result.cached),
      provider: result.source,
      message: result.found ? null : result.summary,
    });
  } catch (error) {
    console.error("[Research API Error]:", error);
    return NextResponse.json(
      { error: "Chưa thể tải paper kiểm chứng lúc này." },
      { status: 500 }
    );
  }
}
