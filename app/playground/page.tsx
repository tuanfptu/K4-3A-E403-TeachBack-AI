"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Cpu,
  ExternalLink,
  FileText,
  Layers,
  Lightbulb,
  LoaderCircle,
  Mic,
  MicOff,
  Plus,
  Send,
  Settings2,
  Sparkles,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// =========================================================================
// 1. DATA CONTRACTS & LESSON DEFINITIONS
// =========================================================================

export type Screen = "lessons" | "session";
export type Phase = "answering" | "loading" | "understood";

export interface TeachAPIResponse {
  bot_response?: string;
  response_mode?:
    | "acknowledge_explore"
    | "demand_analogy"
    | "challenge_jargon"
    | "counter_probe"
    | "scaffolding_rescue"
    | "mastered";
  understanding_level?: 1 | 2 | 3;
  feedback_summary?: {
    what_you_did_well: string;
    missing_or_vague: string;
  };
  detected_jargon?: string[];
  citation?: string;
  meta?: {
    latency_ms?: number;
    model_used?: string;
    citation?: string;
    is_topic_switch?: boolean;
    switch_target?: string;
  };
}

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  response_mode?: TeachAPIResponse["response_mode"];
  feedback_summary?: TeachAPIResponse["feedback_summary"];
  citation?: string;
  isTopicSwitch?: boolean;
  switchTarget?: string;
  modelUsed?: string;
}

interface AIModelOption {
  id: string;
  name: string;
  provider: "Google" | "OpenAI" | "Anthropic" | "DeepSeek" | "Meta" | "Custom";
  tag: string;
  badgeColor: string;
  description: string;
}

const AI_MODELS: AIModelOption[] = [
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    tag: "Khuyên dùng · Siêu tốc",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Tốc độ phản hồi tức thì, bám sát giáo trình và logic sư phạm.",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    tag: "Nhanh · Thông minh",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Nhỏ gọn, lập luận sắc sảo, cân bằng tốt giữa tốc độ & độ sâu.",
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    tag: "Suy luận nâng cao",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Mô hình suy luận cao cấp nhất của Google cho lập luận đa tầng.",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    tag: "Flagship Đa năng",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Mô hình đầu bảng OpenAI, hiểu ẩn dụ và bắt bẻ phản biện rất sâu.",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    tag: "Đối thoại sư phạm",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Văn phong tự nhiên, thấu cảm và phản biện sư phạm xuất sắc.",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    tag: "Mạnh mẽ · Tiết kiệm",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "Mã nguồn mở hiệu năng cao, phân tích kỹ thuật rất tốt.",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta",
    tag: "Open Source Leader",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    description: "Mô hình mã nguồn mở hàng đầu của Meta, lập luận chắc chắn.",
  },
];

function getModelDisplayName(modelId: string): string {
  const found = AI_MODELS.find((m) => m.id === modelId);
  if (found) return found.name;
  return modelId.split("/").pop() || modelId;
}

function getModelIcon(modelId: string) {
  if (modelId.includes("gemini") || modelId.includes("google")) {
    return <Zap className="size-3.5 text-blue-600 shrink-0" />;
  }
  if (modelId.includes("gpt") || modelId.includes("openai")) {
    return <Bot className="size-3.5 text-emerald-600 shrink-0" />;
  }
  if (modelId.includes("claude") || modelId.includes("anthropic")) {
    return <Brain className="size-3.5 text-amber-600 shrink-0" />;
  }
  if (modelId.includes("deepseek")) {
    return <Cpu className="size-3.5 text-cyan-600 shrink-0" />;
  }
  if (modelId.includes("llama") || modelId.includes("meta")) {
    return <Layers className="size-3.5 text-orange-600 shrink-0" />;
  }
  return <Sparkles className="size-3.5 text-indigo-500 shrink-0" />;
}

export interface BottleneckItem {
  id: string;
  label: string;
  prompt: string;
}

export interface LessonItem {
  id: number;
  conceptKey: string;
  label: string;
  shortTitle: string;
  title: string;
  description: string;
  time: string;
  slideNumber: number;
  slideRange: string;
  topic: string;
  takeaway: string;
  citationCode: string;
  initialPrompt: string;
  bottlenecks: BottleneckItem[];
}

/**
 * 2 bài giảng chuẩn từ giáo trình gốc (lib/lesson-data.ts)
 */
export const TEACH_LESSONS: LessonItem[] = [
  {
    id: 1,
    conceptKey: "d1_foundation",
    label: "Day 1",
    shortTitle: "AI & LLM Foundation",
    title: "Day 1: AI & LLM Foundation",
    description:
      "Bên trong LLM: cơ chế next-token prediction, context window (bàn làm việc có hạn), ảo giác (hallucination) và giải pháp Grounding / RAG.",
    time: "10–15 min",
    slideNumber: 20,
    slideRange: "Day 1 · Slide 10–20",
    topic: "Next-token prediction, Context window, Attention, Hallucination & Grounding / RAG",
    takeaway:
      "LLM dự đoán từ tiếp theo theo xác suất, không tự tra cứu sự thật. Cho AI tra sổ (Grounding/RAG) thay vì bắt nhớ.",
    citationCode: "d1-slide-hackathon.pdf (Slide 10–20) · Transcript [T04-047], [T06-139]",
    initialPrompt:
      "Chào bạn! Hôm nay chúng mình cùng trao đổi về bài Day 1: AI & LLM Foundation nhé! Bạn muốn bắt đầu từ chủ đề nào trước cứ nói với mình nhé!",
    bottlenecks: [
      {
        id: "next_token",
        label: "🎲 Đoán token tiếp theo",
        prompt: "Bạn có biết cơ chế dự đoán token tiếp theo (next-token prediction) là gì không?",
      },
      {
        id: "context_window",
        label: "💼 Cửa sổ ngữ cảnh",
        prompt: "Bạn có biết context window hoạt động như một bàn làm việc có hạn thế nào không?",
      },
      {
        id: "hallucination",
        label: "🌀 Ảo giác LLM",
        prompt: "Bạn có biết tại sao LLM lại bị ảo giác và nói chắc như đúng rồi dù sai sự thật không?",
      },
      {
        id: "grounding_rag",
        label: "🔍 Grounding & RAG",
        prompt: "Bạn có biết nguyên tắc 'cho tra sổ thay vì bắt nhớ' của Grounding và RAG hoạt động ra sao không?",
      },
      {
        id: "temperature",
        label: "🌡️ Núm vặn Temperature",
        prompt: "Bạn có biết temperature trong LLM là gì và tại sao nó được gọi là núm vặn độ liều không?",
      },
    ],
  },
  {
    id: 2,
    conceptKey: "d2_problem_framing",
    label: "Day 2",
    shortTitle: "Xác định bài toán AI",
    title: "Day 2: Xác định bài toán cho AI & Độ tự động hoá",
    description:
      "Từ yêu cầu mơ hồ đến Problem Statement rõ ràng: Google PAIR ('Can AI solve this in a unique way?'), 3 Cấp độ Rule vs Workflow vs Agent, và Human-in-the-loop (HITL).",
    time: "10–15 min",
    slideNumber: 9,
    slideRange: "Day 2 · Slide 8–24",
    topic: "Quick Problem Card, Google PAIR, 3 Cấp độ giải pháp (Rule/Workflow/Agent), Human-in-the-loop (HITL)",
    takeaway:
      "Hỏi về bài toán trước, về AI sau. Chọn cấp độ giải pháp từ Rule tĩnh, Workflow đến Agent và luôn thiết kế cơ chế giám sát con người (HITL).",
    citationCode: "d2-slide-hackathon.pdf (Slide 8–24) · Transcript [T01-015], [T02-024], [T03-050]",
    initialPrompt:
      "Chào bạn! Hôm nay chúng mình cùng tìm hiểu về bài Day 2: Xác định bài toán cho AI và Mức độ tự động hoá nhé! Bạn muốn bắt đầu từ phần nào cứ nói với mình nhé!",
    bottlenecks: [
      {
        id: "google_pair",
        label: "🎯 Google PAIR Reframe",
        prompt: "Bạn có biết Google PAIR khuyên mình nên tự hỏi câu gì trước khi quyết định dùng AI không?",
      },
      {
        id: "problem_card",
        label: "📋 Quick Problem Card",
        prompt: "Bạn có biết khung 5 yếu tố của Quick Problem Card gồm những gì không?",
      },
      {
        id: "when_not_ai",
        label: "🚫 Khi nào KHÔNG dùng AI",
        prompt: "Bạn có biết những trường hợp nào thì tuyệt đối không nên dùng AI mà nên dùng Rule tĩnh không?",
      },
      {
        id: "three_levels",
        label: "⚡ 3 Cấp độ (Rule/Workflow/Agent)",
        prompt: "Bạn có biết 3 cấp độ giải pháp Rule tĩnh, Workflow và AI Agent khác nhau thế nào không?",
      },
      {
        id: "hitl",
        label: "🛡️ Giám sát con người (HITL)",
        prompt: "Bạn có biết tại sao luôn cần thiết kế cơ chế giám sát con người (Human-in-the-loop) khi AI sai sót không?",
      },
    ],
  },
];

// =========================================================================
// 2. MAIN COMPONENT (JUNGLEMIND EXACT MATCH)
// =========================================================================

export default function TeachAIFlowPlayground() {
  const [screen, setScreen] = useState<Screen>("lessons");
  const [selectedLessonId, setSelectedLessonId] = useState<number>(1);
  const [phase, setPhase] = useState<Phase>("answering");
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [understandingLevel, setUnderstandingLevel] = useState<1 | 2 | 3>(1);
  const [approvedAnalogy, setApprovedAnalogy] = useState<string>("");

  // Model Selection
  const [selectedModel, setSelectedModel] = useState<string>("google/gemini-2.5-flash");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");
  const [showCustomModelField, setShowCustomModelField] = useState(false);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  // Restore saved model preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("teachback_selected_model");
      if (saved) {
        setSelectedModel(saved);
      }
    }
  }, []);

  // Handle outside click to close model picker dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modelPickerRef.current &&
        !modelPickerRef.current.contains(event.target as Node)
      ) {
        setModelPickerOpen(false);
      }
    }
    if (modelPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [modelPickerOpen]);

  function handleSelectModel(modelId: string) {
    setSelectedModel(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem("teachback_selected_model", modelId);
    }
  }

  // Slide & Scorecard modals
  const [slideOpen, setSlideOpen] = useState(false);
  const [scorecardModalOpen, setScorecardModalOpen] = useState(false);
  const [copiedFlashcard, setCopiedFlashcard] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hintDrawerOpen, setHintDrawerOpen] = useState(false);

  // Chat scroll container
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Video crossfade refs for seamless looping
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<"A" | "B">("A");

  // Active Lesson
  const currentLesson: LessonItem = useMemo(() => {
    return TEACH_LESSONS.find((item) => item.id === selectedLessonId) ?? TEACH_LESSONS[0];
  }, [selectedLessonId]);

  // Cuộn tự động tin nhắn mới
  useEffect(() => {
    if (screen === "session") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatTurns, phase, screen]);

  // Seamless video crossfade looping
  useEffect(() => {
    const FADE_DURATION = 1.5; // seconds before end to start crossfade
    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    function handleTimeUpdate(this: HTMLVideoElement) {
      const remaining = this.duration - this.currentTime;
      if (remaining <= FADE_DURATION && remaining > 0) {
        // Start the standby video and fade
        const standby = this === a ? b! : a!;
        if (standby.paused) {
          standby.currentTime = 0;
          standby.play().catch(() => {});
        }
        setActiveVideo(this === a ? "B" : "A");
      }
    }

    function handleEnded(this: HTMLVideoElement) {
      // Reset and pause the video that just ended, it becomes standby
      this.currentTime = 0;
      this.pause();
    }

    a.addEventListener("timeupdate", handleTimeUpdate);
    b.addEventListener("timeupdate", handleTimeUpdate);
    a.addEventListener("ended", handleEnded);
    b.addEventListener("ended", handleEnded);

    // Start with video A
    a.play().catch(() => {});

    return () => {
      a.removeEventListener("timeupdate", handleTimeUpdate);
      b.removeEventListener("timeupdate", handleTimeUpdate);
      a.removeEventListener("ended", handleEnded);
      b.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Bắt đầu chat trực tiếp (bỏ Pre-Test)
  function startSession(lessonId: number) {
    setSelectedLessonId(lessonId);
    setPhase("answering");
    setUnderstandingLevel(1);
    setApprovedAnalogy("");
    setHintDrawerOpen(false);

    const targetLesson =
      TEACH_LESSONS.find((item) => item.id === lessonId) ?? TEACH_LESSONS[0];

    setChatTurns([
      {
        id: "init-bot",
        role: "assistant",
        content: targetLesson.initialPrompt,
        citation: targetLesson.citationCode,
      },
    ]);

    setScreen("session");
  }

  // Gửi tin nhắn qua API
  async function handleTeachingSubmit(text: string, isHint = false) {
    const clean = text.trim();
    if (!clean && !isHint) return;
    if (phase === "loading") return;

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: "user",
      content: isHint
        ? "💡 [Gợi ý Socratic]: Bạn có thể gợi mở cho mình một hình ảnh đời thực được không?"
        : clean,
    };

    setChatTurns((prev) => [...prev, userTurn]);
    setPhase("loading");

    try {
      const response = await fetch("/api/teach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: currentLesson.conceptKey,
          user_message: isHint ? "" : clean,
          chat_history: chatTurns.map((t) => ({
            role: t.role,
            content: t.content,
          })),
          is_hint_requested: isHint,
          lesson_name: currentLesson.title,
          lesson_id: currentLesson.id,
          custom_model: selectedModel,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as TeachAPIResponse;
      const isSwitch = Boolean(data.meta?.is_topic_switch);
      const switchTarget = data.meta?.switch_target;

      let cleanBotText = data.bot_response || "Mình đang lắng nghe bạn...";
      if (cleanBotText.trim().startsWith("{")) {
        const match = cleanBotText.match(/"bot_response"\s*:\s*"((?:\\.|[^"\\])*)/);
        if (match && match[1]) {
          cleanBotText = match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\t/g, " ").trim();
        }
      }

      const botTurn: ChatTurn = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: cleanBotText,
        response_mode: data.response_mode,
        feedback_summary: data.feedback_summary,
        citation: data.citation || currentLesson.citationCode,
        isTopicSwitch: isSwitch,
        switchTarget: switchTarget,
        modelUsed: data.meta?.model_used || selectedModel,
      };

      setChatTurns((prev) => [...prev, botTurn]);

      if (typeof data.understanding_level === "number") {
        setUnderstandingLevel((prev) =>
          Math.max(prev, data.understanding_level!) as 1 | 2 | 3
        );
      }

      if (data.response_mode === "mastered" || data.understanding_level === 3) {
        setPhase("understood");
        if (!approvedAnalogy && clean.length > 15) {
          setApprovedAnalogy(clean);
        }
      } else {
        setPhase("answering");
      }
    } catch (err) {
      console.error(err);
      setChatTurns((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: "assistant",
          content:
            "Ối bạn ơi, đường truyền của mình bị chập chờn một chút. Bạn giảng lại câu vừa rồi cho mình nhé!",
        },
      ]);
      setPhase("answering");
    }
  }

  function handleCopyFlashcard() {
    const text = `🏆 TEACHAI · TEACHBACK CERTIFICATE OF MASTERY
Khái niệm: ${currentLesson.title} (${currentLesson.label})
Số lượt đối thoại: ${chatTurns.filter((t) => t.role === "user").length} lượt
Mức tăng trưởng: +85% (High Gain · Thấu suốt hoàn toàn)
Ẩn dụ đã được tiếp thu: "${approvedAnalogy || currentLesson.takeaway}"
Nguồn giáo trình: ${currentLesson.citationCode}`;

    navigator.clipboard.writeText(text);
    setCopiedFlashcard(true);
    setTimeout(() => setCopiedFlashcard(false), 2500);
  }

  return (
    <div className="hero">
      {/* ─── JungleMind Style & Tokens (From index.html) ─── */}
      <style>{`
        :root {
          --ink: #111111;
          --muted: #5c5c5c;
          --card: rgba(248, 248, 246, 0.97);
          --shell: 1120px;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          background: #eef2ee;
          overflow: hidden;
          font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .hero {
          position: relative;
          height: 100vh;
          height: 100svh;
          width: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Ambient Video Background Fullscreen */
        .hero__bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .hero__bg video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 1.5s ease-in-out;
        }

        .hero__bg video.video--standby {
          opacity: 0;
        }

        .hero__bg video.video--active {
          opacity: 1;
        }

        /* Chat bubble width constraints (inline-style fallback for Tailwind v4) */
        .chat-bubble-ai {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 60%;
          margin-right: auto;
        }

        .chat-bubble-user {
          display: flex;
          flex-direction: row-reverse;
          align-items: flex-start;
          gap: 12px;
          max-width: 60%;
          margin-left: auto;
        }

        @media (max-width: 640px) {
          .chat-bubble-ai,
          .chat-bubble-user {
            max-width: 80%;
          }
        }

        .hero__inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          min-height: 0;
          height: 100%;
        }

        /* Nav */
        .nav {
          position: relative;
          z-index: 70;
          width: 100%;
          max-width: var(--shell);
          margin: 0 auto;
          padding: 22px 24px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-shrink: 0;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 23px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--ink);
          text-decoration: none;
        }

        .brand svg {
          width: 28px;
          height: 28px;
          display: block;
        }

        .btn-dark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #141414;
          color: #fff;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 500;
          padding: 10px 18px;
          border: 0;
          border-radius: 9px;
          white-space: nowrap;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.18s ease, transform 0.18s ease;
        }

        .btn-dark:hover {
          background: #000;
          transform: translateY(-1px);
        }

        /* Badge & Headlines */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 999px;
          padding: 6px 16px 6px 8px;
          font-size: 13px;
          color: #4a4a4a;
        }

        .badge__tag {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 12.5px;
          font-weight: 500;
          color: #111;
        }

        h1.headline {
          margin: 0;
          font-size: clamp(28px, 5vw, 60px);
          line-height: 1.05;
          font-weight: 500;
          letter-spacing: -0.035em;
          color: var(--ink);
          text-align: center;
        }

        p.sub {
          margin: 0;
          font-size: clamp(13.5px, 1.25vw, 16px);
          line-height: 1.6;
          font-weight: 400;
          color: var(--muted);
          max-width: 62ch;
          text-align: center;
        }

        /* The Exact Prompt Card from index.html */
        .prompt {
          width: min(790px, 100%);
          background: rgba(255, 255, 255, 0.45);
          -webkit-backdrop-filter: blur(18px) saturate(1.15);
          backdrop-filter: blur(18px) saturate(1.15);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 20px;
          padding: 16px 18px 12px;
          text-align: left;
          box-shadow: 0 18px 44px -26px rgba(0, 0, 0, 0.28);
          margin: 0 auto;
          flex-shrink: 0;
        }

        .prompt__input {
          width: 100%;
          border: 0;
          outline: 0;
          resize: none;
          background: transparent;
          font-family: inherit;
          font-size: 17px;
          line-height: 1.55;
          color: var(--ink);
          min-height: 52px;
          max-height: 110px;
          padding: 2px 4px;
        }

        .prompt__input::placeholder {
          color: #4a4a4a;
          opacity: 0.68;
        }

        .prompt__bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 6px;
        }

        .prompt__right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #fff;
          color: #1a1a1a;
          cursor: pointer;
          padding: 0;
          transition: background 0.18s ease;
        }

        .icon-btn:hover {
          background: #f1f1ef;
        }

        .icon-btn--bare {
          border: 0;
          background: transparent;
          width: 34px;
        }

        .icon-btn--bare:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .icon-btn--send {
          background: #141414;
          border-color: #141414;
          color: #fff;
          width: 42px;
          height: 42px;
          border-radius: 12px;
        }

        .icon-btn--send:hover {
          background: #000;
        }

        .icon-btn--send:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* Messenger FAQ chips (Mờ mờ ở đầu chat) */
        .faq-chip {
          background: rgba(255, 255, 255, 0.45);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 12.5px;
          font-weight: 500;
          color: #222222;
          opacity: 0.85;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }

        .faq-chip:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(0, 0, 0, 0.16);
          transform: translateY(-1px);
        }

        /* Glass card for messages & lessons */
        .glass-box {
          background: rgba(255, 255, 255, 0.72);
          -webkit-backdrop-filter: blur(20px) saturate(1.2);
          backdrop-filter: blur(20px) saturate(1.2);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 16px 40px -26px rgba(0, 0, 0, 0.22);
        }
      `}</style>

      {/* ─── Ambient Fullscreen Video (Dual Crossfade for Seamless Loop) ─── */}
      <div className="hero__bg">
        <video
          ref={videoARef}
          muted
          playsInline
          preload="auto"
          className={activeVideo === "A" ? "video--active" : "video--standby"}
          poster="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260831_223518_f11bfa03-4e65-47e1-a4a7-30e42a7a8c2f.png&w=1920&q=85"
        >
          <source
            type="video/mp4"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260831_232706_43757be4-2250-4f09-8cd7-23aebbf147ad.mp4"
          />
        </video>
        <video
          ref={videoBRef}
          muted
          playsInline
          preload="auto"
          className={activeVideo === "B" ? "video--active" : "video--standby"}
        >
          <source
            type="video/mp4"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260831_232706_43757be4-2250-4f09-8cd7-23aebbf147ad.mp4"
          />
        </video>
      </div>

      <div className="hero__inner">
        {/* ================================================================= */}
        {/* HEADER                                                            */}
        {/* ================================================================= */}
        <header className="nav">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setScreen("lessons");
            }}
          >
            <svg
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M16 2.5 29.5 16 16 29.5 2.5 16 16 2.5Z"
                stroke="#141414"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M16 9.5 22.5 16 16 22.5 9.5 16 16 9.5Z"
                fill="#141414"
              />
            </svg>
            <span>TeachAi</span>
          </a>

          {screen === "session" ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#222222] border border-black/5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                {currentLesson.shortTitle}
              </span>
              <button
                type="button"
                onClick={() => setModelPickerOpen((v) => !v)}
                className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-white/75 hover:bg-white px-2.5 py-1 text-xs font-semibold text-[#222222] border border-black/10 transition shadow-xs cursor-pointer"
                title="Đổi mô hình AI (OpenRouter)"
              >
                {getModelIcon(selectedModel)}
                <span>{getModelDisplayName(selectedModel)}</span>
              </button>
              <button
                onClick={() => setScreen("lessons")}
                className="btn-dark"
                style={{ padding: "8px 14px", fontSize: "12.5px" }}
              >
                ← Chọn bài khác
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="badge">
                <span className="badge__tag">Protégé</span>
                <span>You are the teacher</span>
              </span>
            </div>
          )}
        </header>

        {/* ================================================================= */}
        {/* SCREEN 1: LESSON SELECTOR (TeachAi Hero Stage)                    */}
        {/* ================================================================= */}
        {screen === "lessons" && (
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
            <div className="max-w-3xl w-full flex flex-col items-center gap-4 my-auto">
              <div className="badge">
                <span className="badge__tag">Now</span>
                <span>TeachBack 3.0 is here</span>
              </div>

              <h1 className="headline">
                The thinking engine <br className="hidden sm:inline" />
                shaped for what counts.
              </h1>

              <p className="sub">
                TeachAi reasons through every problem carefully before answering.
                Cùng đối thoại và làm rõ các nguyên lý AI để thấu suốt bản chất.
              </p>

              {/* Exact 2 Lesson Cards */}
              <div className="grid sm:grid-cols-2 gap-4 w-full mt-4 text-left">
                {TEACH_LESSONS.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => startSession(lesson.id)}
                    className="glass-box rounded-[20px] p-5 cursor-pointer hover:bg-white/60 transition-all hover:scale-[1.01] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#666666] mb-1">
                        <span>{lesson.label}</span>
                        <span>{lesson.slideRange}</span>
                      </div>
                      <h2 className="text-lg font-bold text-[#111111]">
                        {lesson.title}
                      </h2>
                      <p className="text-xs text-[#555555] mt-2 leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between">
                      <span className="text-xs text-[#777777]">
                        ⏱️ {lesson.time}
                      </span>
                      <span className="text-xs font-semibold text-[#111111] flex items-center gap-1 group-hover:translate-x-0.5 transition">
                        Dạy bài này <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* ================================================================= */}
        {/* SCREEN 2: CHATBOT SESSION (Only Chat Scrolls, Prompt Fixed Bottom)*/}
        {/* ================================================================= */}
        {screen === "session" && (
          <main className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
            {/* ─── SCROLLABLE CHAT MESSAGES CANVAS ─── */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
            >
              <div className="max-w-[790px] mx-auto space-y-4">
                {/* 1. INITIAL AI STUDENT GREETING */}
                <div className="chat-bubble-ai">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#141414] text-white text-xs mt-1">
                    <Bot className="size-4" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[#111111] text-[13px]">
                        AI Student
                      </span>
                      <span className="text-[11px] text-[#777777]">
                        · {currentLesson.label}
                      </span>
                    </div>

                    <div className="glass-box rounded-2xl rounded-tl-sm p-4 sm:p-5 text-[16px] sm:text-[17px] leading-[1.65] text-[#111111] inline-block w-fit max-w-full">
                      <p className="whitespace-pre-wrap">{currentLesson.initialPrompt}</p>
                    </div>

                    {/* 2. CHIP GỢI Ý THUẬT NGỮ (MỜ MỜ NHƯ MESSENGER FAQ) */}
                    <div className="pt-2 pb-1">
                      <p className="text-[11.5px] text-[#555555] mb-1.5 opacity-75">
                        Gợi ý các điểm nghẽn nhận thức cần làm rõ:
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {currentLesson.bottlenecks.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleTeachingSubmit(item.prompt)}
                            className="faq-chip"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. CHAT TURNS STREAM (TIN NHẮN TRÔI DẦN XUỐNG DƯỚI) */}
                {chatTurns.slice(1).map((turn) => {
                  if (turn.role === "assistant") {
                    return (
                      <div key={turn.id} className="chat-bubble-ai">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#141414] text-white text-xs mt-1">
                          <Bot className="size-4" />
                        </span>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="font-bold text-[#111111] text-[13px]">
                              AI Student
                            </span>
                            {turn.modelUsed && (
                              <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-[#444444] border border-black/5 flex items-center gap-1">
                                {getModelIcon(turn.modelUsed)}
                                <span>{getModelDisplayName(turn.modelUsed)}</span>
                              </span>
                            )}
                            {turn.response_mode === "counter_probe" && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                                Hỏi vặn
                              </span>
                            )}
                            {turn.response_mode === "scaffolding_rescue" && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900 border border-blue-200 flex items-center gap-1">
                                💡 Học sinh tra Slide gỡ rối
                              </span>
                            )}
                            {turn.response_mode === "mastered" && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-200">
                                Thấu suốt ⭐
                              </span>
                            )}
                          </div>

                          <div className="glass-box rounded-2xl rounded-tl-sm p-4 sm:p-5 text-[16px] sm:text-[17px] leading-[1.65] text-[#111111] inline-block w-fit max-w-full">
                            <p className="whitespace-pre-wrap">{turn.content}</p>

                            {/* Nút phản hồi nhanh khi học sinh vừa tra slide cứu nguy */}
                            {turn.response_mode === "scaffolding_rescue" && (
                              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2.5 border-t border-black/[0.08]">
                                <button
                                  type="button"
                                  onClick={() => handleTeachingSubmit("Đúng rồi em! Cơ chế hoạt động chuẩn là như vậy, em tiếp thu rất nhanh.")}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
                                >
                                  ✓ Đúng rồi em, chính là như vậy!
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTeachingSubmit("Gần đúng rồi em, để tôi bổ sung thêm một chút...")}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:bg-black/5 transition"
                                >
                                  Gần đúng, để tôi bổ sung thêm...
                                </button>
                              </div>
                            )}

                            {/* Nút hành động nếu là trường hợp hỏi khéo chuyển chủ đề */}
                            {turn.isTopicSwitch && turn.switchTarget && (
                              <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-black/[0.08]">
                                <button
                                  onClick={() =>
                                    handleTeachingSubmit(
                                      `Chúng mình tiếp tục học bài ${currentLesson.title} nhé!`
                                    )
                                  }
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-black/10 hover:bg-black/5"
                                >
                                  Tiếp tục bài hiện tại
                                </button>
                                <button
                                  onClick={() => {
                                    const other = TEACH_LESSONS.find(
                                      (l) => l.id !== currentLesson.id
                                    );
                                    if (other) startSession(other.id);
                                  }}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#141414] text-white hover:bg-black"
                                >
                                  Chuyển sang: {turn.switchTarget} →
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={turn.id}
                        className="chat-bubble-user"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/80 border border-black/10 text-[#111111] text-xs mt-1">
                          <UserRound className="size-4" />
                        </span>
                        <div className="min-w-0 text-right space-y-1">
                          <span className="text-[13px] font-semibold text-[#333333]">
                            You (Teacher)
                          </span>
                          <div className="glass-box rounded-2xl rounded-tr-sm p-4 sm:p-5 text-left text-[16px] sm:text-[17px] leading-[1.65] text-[#111111] shadow-sm bg-white/75 inline-block w-fit ml-auto max-w-full">
                            <p className="whitespace-pre-wrap">{turn.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}

                {/* Loading state */}
                {phase === "loading" && (
                  <div className="flex items-center gap-2 pl-11 text-xs text-[#555555]">
                    <LoaderCircle className="size-3.5 animate-spin text-[#111111]" />
                    <span>Học sinh AI đang suy ngẫm...</span>
                  </div>
                )}

                {/* Mastered callout */}
                {phase === "understood" && (
                  <div className="glass-box rounded-2xl p-4 border border-emerald-300 bg-emerald-50/80 text-emerald-950 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-700" />
                        <span>Học sinh AI đã thấu suốt trọn vẹn! ⭐</span>
                      </p>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Bạn đã chuyển giao thành công cơ chế gốc và ẩn dụ đời thực.
                      </p>
                    </div>
                    <button
                      onClick={() => setScorecardModalOpen(true)}
                      className="btn-dark"
                      style={{ padding: "8px 14px", fontSize: "12px" }}
                    >
                      Xem Thẻ Flashcard →
                    </button>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* ─── FIXED PROMPT CARD AT BOTTOM (CANNOT SCROLL) ─── */}
            <div className="p-4 sm:pb-6 flex-shrink-0 flex justify-center w-full">
              <form
                className="prompt"
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget.elements.namedItem(
                    "prompt_input"
                  ) as HTMLTextAreaElement;
                  if (target && target.value.trim() && phase !== "loading") {
                    handleTeachingSubmit(target.value);
                    target.value = "";
                  }
                }}
              >
                <label className="sr-only" htmlFor="prompt-input">
                  Giảng giải cho học sinh AI
                </label>
                <textarea
                  id="prompt-input"
                  name="prompt_input"
                  className="prompt__input"
                  rows={2}
                  disabled={phase === "loading"}
                  placeholder={
                    isRecording
                      ? "Đang lắng nghe giọng nói của bạn..."
                      : "Giảng giải tự nhiên như đang dạy bạn học (Ví dụ: 'Nó giống như...')"
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val && phase !== "loading") {
                        handleTeachingSubmit(val);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />

                <div className="prompt__bar">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => setHintDrawerOpen((v) => !v)}
                      title="Mở gợi ý Socratic và Slide"
                    >
                      <Plus className={`size-4 transition ${hintDrawerOpen ? "rotate-45" : ""}`} />
                    </button>

                    {/* MODEL SELECTOR PILL & FLOATING POPUP */}
                    <div className="relative" ref={modelPickerRef}>
                      <button
                        type="button"
                        onClick={() => setModelPickerOpen((v) => !v)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 hover:bg-white text-[#111111] border border-black/10 shadow-xs transition hover:border-black/25 cursor-pointer backdrop-blur-sm"
                        title="Chọn mô hình AI (OpenRouter)"
                      >
                        {getModelIcon(selectedModel)}
                        <span className="max-w-[130px] truncate">{getModelDisplayName(selectedModel)}</span>
                        <ChevronDown className={`size-3 text-[#666666] transition duration-200 ${modelPickerOpen ? "rotate-180" : ""}`} />
                      </button>

                      {/* FLOATING DROPDOWN MENU */}
                      {modelPickerOpen && (
                        <div
                          className="absolute bottom-full mb-3 left-0 z-[100] w-[310px] sm:w-[350px] rounded-2xl p-3 border border-black/10 shadow-2xl bg-white/95 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 text-left"
                          style={{
                            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.08)",
                          }}
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#111111]">
                              <Cpu className="size-3.5 text-indigo-600" />
                              <span>Chọn mô hình AI (OpenRouter)</span>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Sẵn sàng
                            </span>
                          </div>

                          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                            {AI_MODELS.map((m) => {
                              const isSelected = selectedModel === m.id;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    handleSelectModel(m.id);
                                    setModelPickerOpen(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-xl text-xs transition flex items-start justify-between gap-2 border ${
                                    isSelected
                                      ? "bg-black/[0.06] border-black/15 text-[#111111]"
                                      : "bg-transparent border-transparent hover:bg-black/[0.04] text-[#333333]"
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <div className="mt-0.5 p-1 rounded-lg bg-white border border-black/10 shadow-xs shrink-0">
                                      {getModelIcon(m.id)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-[#111111]">{m.name}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${m.badgeColor}`}>
                                          {m.provider}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-[#666666] line-clamp-1 mt-0.5">
                                        {m.description}
                                      </p>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check className="size-4 text-emerald-600 shrink-0 mt-1" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Tùy chỉnh custom model ID */}
                          <div className="mt-2.5 pt-2 border-t border-black/5">
                            {!showCustomModelField ? (
                              <button
                                type="button"
                                onClick={() => setShowCustomModelField(true)}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] text-[#555555] hover:text-[#111111] hover:bg-black/[0.04] flex items-center justify-between transition"
                              >
                                <span>+ Nhập model ID OpenRouter tùy ý...</span>
                                <Settings2 className="size-3 text-[#777777]" />
                              </button>
                            ) : (
                              <div className="space-y-1.5 p-1.5 rounded-xl bg-black/[0.03] border border-black/5">
                                <label className="text-[10px] font-semibold text-[#666666] block">
                                  OpenRouter Model ID (ví dụ: `anthropic/claude-3-haiku`):
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={customModelInput}
                                    onChange={(e) => setCustomModelInput(e.target.value)}
                                    placeholder="vendor/model-name"
                                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-black/15 bg-white text-[#111111] focus:outline-none focus:border-black"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (customModelInput.trim()) {
                                          handleSelectModel(customModelInput.trim());
                                          setModelPickerOpen(false);
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (customModelInput.trim()) {
                                        handleSelectModel(customModelInput.trim());
                                        setModelPickerOpen(false);
                                      }
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#141414] text-white hover:bg-black transition"
                                  >
                                    Lưu
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {hintDrawerOpen && (
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleTeachingSubmit("Phần này tôi chưa rõ lắm, em thử mở slide xem có tài liệu nào nói về cái này không?", false)}
                          className="faq-chip"
                          style={{ opacity: 1, background: "white" }}
                          title="Học sinh sẽ tự tra tài liệu bài giảng và mớm kiến thức chuẩn cho bạn"
                        >
                          💡 Nhờ học sinh tra Slide cứu nguy
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlideOpen(true)}
                          className="faq-chip"
                          style={{ opacity: 1, background: "white" }}
                        >
                          📖 Xem Slide
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="prompt__right">
                    <button
                      className="icon-btn icon-btn--bare"
                      type="button"
                      onClick={() => setIsRecording((v) => !v)}
                      title={isRecording ? "Dừng ghi âm" : "Ghi âm giọng nói"}
                    >
                      {isRecording ? (
                        <MicOff className="size-4 text-red-500 animate-pulse" />
                      ) : (
                        <Mic className="size-4 text-[#333333]" />
                      )}
                    </button>

                    <button
                      className="icon-btn icon-btn--send"
                      type="submit"
                      disabled={phase === "loading"}
                      title="Gửi (Enter)"
                    >
                      <Send className="size-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </main>
        )}

        {/* ================================================================= */}
        {/* MODAL 1: SLIDE PREVIEW                                            */}
        {/* ================================================================= */}
        <Dialog open={slideOpen} onOpenChange={setSlideOpen}>
          <DialogContent className="rounded-[24px] border-black/10 bg-white p-6 sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#111111]">
                {currentLesson.label} · Slide {currentLesson.slideNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#666666]">
                {currentLesson.topic}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-[#f8f9fa] border border-black/10">
                <p className="font-bold text-[#111111]">Nguyên lý cốt tử:</p>
                <p className="text-[#555555] mt-1 leading-relaxed">
                  {currentLesson.takeaway}
                </p>
                <p className="text-[#888888] mt-2 font-mono">
                  Nguồn: {currentLesson.citationCode}
                </p>
              </div>
              <p className="text-[#666666] italic">
                💡 Xem xong hãy đóng lại và tự diễn giải bằng lời của bạn nhé!
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================================================================= */}
        {/* MODAL 2: MASTERED FLASHCARD CERTIFICATE                           */}
        {/* ================================================================= */}
        <Dialog open={scorecardModalOpen} onOpenChange={setScorecardModalOpen}>
          <DialogContent className="rounded-[24px] border-black/10 bg-white p-6 sm:p-7 sm:max-w-lg text-left">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  MASTERED ✓
                </span>
                <h3 className="text-xl font-bold text-[#111111] mt-1">
                  {currentLesson.title}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-emerald-700">+85%</span>
                <p className="text-[10px] text-[#777777]">High Gain</p>
              </div>
            </div>

            <div className="space-y-3 my-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-black/[0.06]">
                <p className="font-bold text-[#111111] mb-1">
                  💡 Ẩn dụ đời thực đã tiếp thu:
                </p>
                <p className="italic text-[#333333]">
                  &ldquo;{approvedAnalogy || currentLesson.takeaway}&rdquo;
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-black/[0.06]">
                <p className="font-bold text-[#111111] mb-1">🧠 Cơ chế gốc:</p>
                <p className="text-[#555555] leading-relaxed">
                  {currentLesson.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                onClick={handleCopyFlashcard}
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-black/15 bg-white hover:bg-black/5"
              >
                {copiedFlashcard ? "✓ Đã chép Flashcard!" : "Sao chép Flashcard"}
              </button>
              <button
                onClick={() => {
                  setScorecardModalOpen(false);
                  setScreen("lessons");
                }}
                className="btn-dark"
                style={{ padding: "8px 16px", fontSize: "12px" }}
              >
                Dạy bài khác →
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
