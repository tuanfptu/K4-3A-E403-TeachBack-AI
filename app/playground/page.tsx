"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ExternalLink,
  FileText,
  Layers,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mic,
  MicOff,
  Plus,
  Send,
  Settings2,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLesson } from "@/lib/lesson-data";
import { AuthModal } from "@/components/auth-modal";
import { FlashcardDeckModal } from "@/components/flashcard-deck-modal";
import { auth, signOut, type User } from "@/lib/firebase";
import { saveLearnerQuestionMemory } from "@/lib/learner-memory";

// =========================================================================
// 1. DATA CONTRACTS & LESSON DEFINITIONS
// =========================================================================

export type Screen = "lessons" | "session";
export type Phase = "answering" | "loading" | "understood";

export interface TrustedResearchSource {
  title: string;
  url: string;
  snippet: string;
  venue: "NeurIPS" | "ICML" | "ICLR" | "ACL" | "IEEE";
  rank: "A*" | "A";
  credibilityScore: number;
  credibilityReasons: string[];
  isReachable: boolean;
  statusCode: number | null;
  checkedAt: string;
}

export interface TeachAPIResponse {
  bot_response?: string;
  response_mode?: "partial" | "needs_revision" | "mastered";
  understanding_level?: 1 | 2 | 3;
  question_mastered?: boolean;
  mastered_point_ids?: string[];
  missing_point_ids?: string[];
  hint?: string | null;
  evaluation?: {
    correct_points: Array<{
      id: string;
      evidence: string;
      feedback: string;
    }>;
    incorrect_claims: Array<{
      claim: string;
      correction: string;
    }>;
    newly_mastered_point_ids: string[];
    invalidated_point_ids: string[];
  };
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
    research_sources?: TrustedResearchSource[];
    is_topic_switch?: boolean;
    switch_target?: string;
    interaction_type?: "assessment" | "social" | "redirect";
  };
}

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  response_mode?: TeachAPIResponse["response_mode"];
  feedback_summary?: TeachAPIResponse["feedback_summary"];
  evaluation?: TeachAPIResponse["evaluation"];
  citation?: string;
  researchSources?: TrustedResearchSource[];
  isTopicSwitch?: boolean;
  switchTarget?: string;
  modelUsed?: string;
  lessonId?: number;
  questionId?: number;
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "Nguồn học thuật";
  }
}

function ResearchSourcesDisclosure({
  initialSources = [],
  lessonId,
  questionId,
}: {
  initialSources?: TrustedResearchSource[];
  lessonId?: number;
  questionId?: number;
}) {
  const [sources, setSources] = useState(initialSources);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(initialSources.length > 0);
  const [error, setError] = useState("");

  async function loadResearch(open: boolean) {
    if (!open || loaded || loading || !lessonId || !questionId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId, question_id: questionId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setSources(Array.isArray(data.sources) ? data.sources : []);
      setError(data.message || "");
      setLoaded(true);
    } catch (researchError) {
      setError(
        researchError instanceof Error
          ? researchError.message
          : "Chưa thể tải paper kiểm chứng lúc này."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <details
      className="group mt-2 rounded-xl border border-violet-200 bg-violet-50/80"
      onToggle={(event) => void loadResearch(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-left">
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-violet-800">
            Paper kiểm chứng thêm
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-violet-950">
            {loading
              ? "Đang tìm và kiểm tra link…"
              : sources.length > 0
                ? `${sources.length} nguồn A/A* · link đã kiểm tra`
                : "Chỉ tìm khi bạn mở mục này"}
          </span>
        </span>
        {loading ? (
          <LoaderCircle className="size-4 shrink-0 animate-spin text-violet-700" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-violet-700 transition group-open:rotate-180" />
        )}
      </summary>
      <div className="space-y-2 border-t border-violet-200/80 p-3">
        {error && <p className="text-xs leading-5 text-violet-900">{error}</p>}
        {!loading && loaded && sources.length === 0 && !error && (
          <p className="text-xs leading-5 text-violet-900">
            Chưa tìm thấy nguồn phù hợp từ NeurIPS, ICML, ICLR, ACL hoặc IEEE.
          </p>
        )}
        {sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start justify-between gap-3 rounded-lg border border-violet-200/80 bg-white/80 px-3 py-2.5 transition hover:border-violet-300 hover:bg-white"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
                  {source.venue}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700">
                  Hạng {source.rank} · {source.credibilityScore}/100
                </span>
              </span>
              <span className="mt-1 block line-clamp-2 text-xs font-semibold leading-5 text-violet-950">
                {source.title}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-violet-700/75">
                {safeHostname(source.url)}
              </span>
            </span>
            <ExternalLink className="mt-1 size-3.5 shrink-0 text-violet-700 transition group-hover:-translate-y-0.5" />
          </a>
        ))}
      </div>
    </details>
  );
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
  if (modelId === "local_lesson_rubric") return "TeachBack dự phòng";
  if (modelId === "targeted_hint") return "Gợi ý sư phạm";
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
    slideRange: "Day 1 · Slide 11–20 & 29",
    topic: "Next-token prediction, Context window, Attention, Hallucination & Grounding / RAG",
    takeaway:
      "LLM dự đoán từ tiếp theo theo xác suất, không tự tra cứu sự thật. Cho AI tra sổ (Grounding/RAG) thay vì bắt nhớ.",
    citationCode: "d1-slide-hackathon.pdf (Slide 11–20 & 29) · Transcript V Learn",
    initialPrompt:
      "Trả lời câu hỏi bằng cách hiểu của bạn. Không cần dùng đúng từng chữ trong slide: hệ thống sẽ ghi nhận riêng phần đúng, sửa phần sai và chỉ gợi ý những ý còn thiếu.",
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
    slideRange: "Day 2 · Slide 8–26",
    topic: "Quick Problem Card, Google PAIR, 3 Cấp độ giải pháp (Rule/Workflow/Agent), Human-in-the-loop (HITL)",
    takeaway:
      "Hỏi về bài toán trước, về AI sau. Chọn cấp độ giải pháp từ Rule tĩnh, Workflow đến Agent và luôn thiết kế cơ chế giám sát con người (HITL).",
    citationCode: "d2-slide-hackathon.pdf (Slide 8–26) · Transcript V Learn",
    initialPrompt:
      "Trả lời câu hỏi bằng cách hiểu của bạn. Không cần thuộc lòng: hệ thống sẽ đối chiếu với slide, công nhận phần đã hiểu và gợi mở đúng phần còn thiếu.",
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [masteredPointIds, setMasteredPointIds] = useState<string[]>([]);
  const [targetedHint, setTargetedHint] = useState<string>("");
  const [sessionHasAssessment, setSessionHasAssessment] = useState(false);

  // Model Selection
  const [selectedModel, setSelectedModel] = useState<string>("google/gemini-2.5-flash");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");
  const [showCustomModelField, setShowCustomModelField] = useState(false);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("teachback_selected_model");
      if (saved) setSelectedModel(saved);
    }
  }, []);

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

  // Firebase Auth State & Gatekeeper
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingLessonId, setPendingLessonId] = useState<number | null>(null);
  const [authModalReason, setAuthModalReason] = useState<string>("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Chỉ coi người dùng là đã đăng nhập nếu email đã được xác nhận (hoặc tài khoản Google)
      if (user && user.emailVerified) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  async function handleSignOut() {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error("[Sign Out Error]:", err);
    }
  }

  function handleLessonSelect(lessonId: number) {
    if (!currentUser || !currentUser.emailVerified) {
      setPendingLessonId(lessonId);
      setAuthModalReason("Vui lòng đăng nhập để bắt đầu phiên học TeachBack.");
      setAuthModalOpen(true);
      return;
    }
    startSession(lessonId);
  }

  // Slide & Scorecard modals
  const [slideOpen, setSlideOpen] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [scorecardModalOpen, setScorecardModalOpen] = useState(false);
  const [copiedFlashcard, setCopiedFlashcard] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hintDrawerOpen, setHintDrawerOpen] = useState(false);

  // Flashcard Deck 3D modal
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
  const [flashcardDeckLessonId, setFlashcardDeckLessonId] = useState(1);

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
  const curriculumLesson = useMemo(() => getLesson(selectedLessonId), [selectedLessonId]);
  const currentQuestion = curriculumLesson.questions[currentQuestionIndex];
  const questionTotal = curriculumLesson.questions.length;
  const questionSlides = currentQuestion.source.slides;
  const activeSlideNumber =
    questionSlides[Math.min(activeSlideIndex, questionSlides.length - 1)] ??
    currentQuestion.source.slide;
  const activeSlideImage = `/slides/day-${currentLesson.id}/slide-${activeSlideNumber}.jpg`;

  useEffect(() => {
    if (!currentUser || screen !== "session" || !sessionHasAssessment) return;
    const timer = window.setTimeout(() => {
      void saveLearnerQuestionMemory(
        currentUser.uid,
        selectedLessonId,
        currentQuestion.id,
        { masteredPointIds, attempts }
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [attempts, currentQuestion.id, currentUser, masteredPointIds, screen, selectedLessonId, sessionHasAssessment]);

  // Cuộn tự động tin nhắn mới
  useEffect(() => {
    if (screen === "session") {
      if (chatTurns.length <= 1) {
        chatScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
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
  function openSlideViewer() {
    setActiveSlideIndex(0);
    setSlideOpen(true);
  }

  function startSession(lessonId: number) {
    setSelectedLessonId(lessonId);
    setCurrentQuestionIndex(0);
    setAttempts(0);
    setPhase("answering");
    setHintDrawerOpen(false);
    setHintOpen(false);
    setSourceOpen(false);
    setActiveSlideIndex(0);
    setMasteredPointIds([]);
    setTargetedHint("");
    setSessionHasAssessment(false);

    const targetLesson =
      TEACH_LESSONS.find((item) => item.id === lessonId) ?? TEACH_LESSONS[0];
    const targetQuestion = getLesson(lessonId).questions[0];

    setChatTurns([
      {
        id: "init-bot",
        role: "assistant",
        content: targetQuestion.prompt,
        citation: targetLesson.citationCode,
      },
    ]);

    setScreen("session");
  }

  // Gửi tin nhắn qua API
  async function handleTeachingSubmit(text: string, isHint = false) {
    const clean = text.trim();
    if (!clean && !isHint) return;
    if (phase === "loading" || phase === "understood") return;

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: "user",
      content: isHint
        ? "💡 Mình cần một gợi ý nhỏ cho ý còn thiếu."
        : clean,
    };

    setChatTurns((prev) => [...prev, userTurn]);
    const isConversationOnly = /^(?:(?:hi|hello|hey|alo|chào|xin chào|cảm ơn|cám ơn|thanks|thank you|tạm biệt|bye|goodbye|hẹn gặp lại)(?:\s+(?:bạn|thầy|cô|em|anh|chị|mọi người|nhé|nha|ạ))*|ok|okay|ừ|ừm|vâng|dạ|đúng rồi)[!.?\s]*$/i.test(clean);
    const isHelpSignal = /^(chưa|không chắc|chịu|không biết|không hiểu|chưa hiểu|không rõ)[!.?\s]*$/i.test(clean);
    const countedAttempt = !isHint && !isConversationOnly && !isHelpSignal;
    if (countedAttempt) {
      setAttempts((value) => value + 1);
    }
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
          lesson_id: currentLesson.id,
          question_id: currentQuestion.id,
          mastered_point_ids: masteredPointIds,
          custom_model: selectedModel,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as TeachAPIResponse;
      const isNonAssessment = ["social", "redirect"].includes(
        data.meta?.interaction_type || "assessment"
      );
      if (countedAttempt && isNonAssessment) {
        setAttempts((value) => Math.max(0, value - 1));
      } else if (countedAttempt) {
        setSessionHasAssessment(true);
      }
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
        evaluation: data.evaluation,
        citation: isNonAssessment ? undefined : data.citation || currentLesson.citationCode,
        researchSources: data.meta?.research_sources,
        isTopicSwitch: isSwitch,
        switchTarget: switchTarget,
        modelUsed: isNonAssessment ? undefined : data.meta?.model_used || selectedModel,
        lessonId: isNonAssessment ? undefined : currentLesson.id,
        questionId: isNonAssessment ? undefined : currentQuestion.id,
      };

      setChatTurns((prev) => [...prev, botTurn]);

      if (Array.isArray(data.mastered_point_ids)) {
        setMasteredPointIds(data.mastered_point_ids);
      }
      if (typeof data.hint === "string" && data.hint.trim()) {
        setTargetedHint(data.hint.trim());
        if (isHint) setHintOpen(true);
      }

      if (data.question_mastered === true) {
        setPhase("understood");
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
            "Đường truyền đang bị gián đoạn. Bạn hãy gửi lại câu trả lời vừa rồi nhé!",
        },
      ]);
      setPhase("answering");
    }
  }

  function advanceQuestion() {
    if (currentQuestionIndex >= questionTotal - 1) {
      setScorecardModalOpen(true);
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    const nextQuestion = curriculumLesson.questions[nextIndex];
    setCurrentQuestionIndex(nextIndex);
    setAttempts(0);
    setPhase("answering");
    setHintDrawerOpen(false);
    setHintOpen(false);
    setSourceOpen(false);
    setMasteredPointIds([]);
    setTargetedHint("");
    setSessionHasAssessment(false);
    setSlideOpen(false);
    setActiveSlideIndex(0);
    setChatTurns([
      {
        id: `question-${nextQuestion.id}`,
        role: "assistant",
        content: nextQuestion.prompt,
        citation: currentLesson.citationCode,
      },
    ]);
    chatScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCopyFlashcard() {
    const text = `🏆 TEACHAI · TEACHBACK CERTIFICATE OF MASTERY
Khái niệm: ${currentLesson.title} (${currentLesson.label})
Số lượt đối thoại: ${chatTurns.filter((t) => t.role === "user").length} lượt
Kết quả: Hoàn thành ${questionTotal}/${questionTotal} câu hỏi cố định
Nội dung đã hoàn thành: ${curriculumLesson.completionTopics.join("; ")}
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
              {currentUser && (
                <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-[#333333] border border-black/5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="max-w-[140px] truncate">{currentUser.displayName || currentUser.email?.split("@")[0]}</span>
                </div>
              )}
              <button
                onClick={() => setScreen("lessons")}
                className="btn-dark"
                style={{ padding: "8px 14px", fontSize: "12.5px" }}
              >
                ← Chọn bài khác
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="badge hidden md:inline-flex">
                <span className="badge__tag">TeachBack</span>
                <span>Learn by explaining</span>
              </span>

              {/* Header Auth: Profile đã xác thực hoặc Nút Đăng nhập */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-white/90 border border-black/10 px-2.5 py-1 text-xs font-semibold shadow-xs">
                    {currentUser.photoURL ? (
                      <Image
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || "Avatar"}
                        width={20}
                        height={20}
                        unoptimized
                        className="size-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-white uppercase">
                        {(currentUser.displayName || currentUser.email || "U")[0]}
                      </div>
                    )}
                    <span className="max-w-[120px] truncate text-zinc-800 font-medium">
                      {currentUser.displayName || currentUser.email?.split("@")[0]}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 rounded-full bg-black/5 hover:bg-black/10 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition cursor-pointer"
                    title="Đăng xuất khỏi tài khoản"
                  >
                    <LogOut className="size-3" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalReason("");
                    setAuthModalOpen(true);
                  }}
                  className="btn-dark cursor-pointer"
                  style={{ padding: "8px 18px", fontSize: "12.5px" }}
                >
                  Đăng nhập
                </button>
              )}
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
                Trả lời các câu hỏi cố định và nhận phản hồi theo từng ý từ dữ liệu bài giảng.
              </p>

              {/* Exact 2 Lesson Cards */}
              <div className="grid sm:grid-cols-2 gap-4 w-full mt-4 text-left">
                {TEACH_LESSONS.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonSelect(lesson.id)}
                    className="glass-box rounded-[20px] p-5 cursor-pointer hover:bg-white/60 transition-all hover:scale-[1.01] flex flex-col justify-between group"
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

                    <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#777777]">
                          ⏱️ {lesson.time}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFlashcardDeckLessonId(lesson.id);
                            setFlashcardModalOpen(true);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-black bg-black/[0.04] hover:bg-black/[0.08] px-2.5 py-1 rounded-lg border border-black/5 transition cursor-pointer"
                          title={`Xem Flashcards của ${lesson.label}`}
                        >
                          <span>🃏 Flashcards</span>
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-[#111111] flex items-center gap-1 group-hover:translate-x-0.5 transition">
                        {!currentUser ? (
                          <span className="flex items-center gap-1.5 text-zinc-500 bg-black/[0.04] px-2.5 py-1 rounded-lg border border-black/5 text-[11px] font-medium">
                            <LockKeyhole className="size-3 text-zinc-400" /> Bắt đầu học
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-700">
                            Bắt đầu <ArrowRight className="size-3.5" />
                          </span>
                        )}
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
          <main className="flex-1 min-h-0 overflow-hidden px-3 pb-3 sm:px-5 sm:pb-5">
            <div className="mx-auto grid h-full min-h-0 max-w-[1180px] gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
              <section className="flex min-h-0 flex-col overflow-hidden">
            {/* ─── SCROLLABLE CHAT MESSAGES CANVAS ─── */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
            >
              <div className="max-w-[790px] mx-auto space-y-4">
                <div className="glass-box rounded-2xl px-4 py-3 sm:px-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#141414] text-xs font-bold text-white">
                        {currentQuestionIndex + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#222222]">
                          Câu {currentQuestionIndex + 1} / {questionTotal}
                        </p>
                        <p className="truncate text-[11px] text-[#666666]">
                          {currentQuestion.concept}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-800">
                      {Math.round(((currentQuestionIndex + 1) / questionTotal) * 100)}%
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.08]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${((currentQuestionIndex + 1) / questionTotal) * 100}%` }}
                    />
                  </div>
                </div>

                    {/* 1. QUESTION INTRODUCTION */}
                <div className="chat-bubble-ai">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#141414] text-white text-xs mt-1">
                    <Bot className="size-4" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[#111111] text-[13px]">
                        TeachBack AI
                      </span>
                      <span className="text-[11px] text-[#777777]">
                        · {currentLesson.label}
                      </span>
                    </div>

                    <div className="glass-box rounded-2xl rounded-tl-sm p-4 sm:p-5 text-[16px] sm:text-[17px] leading-[1.65] text-[#111111] inline-block w-fit max-w-full">
                      <p className="whitespace-pre-wrap">{currentLesson.initialPrompt}</p>
                    </div>

                    <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/80 p-4 shadow-sm backdrop-blur-md">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800">
                        Câu hỏi hiện tại
                      </p>
                      <p className="mt-1.5 text-[15px] font-semibold leading-6 text-[#17342b]">
                        {currentQuestion.prompt}
                      </p>
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
                              Phản hồi đánh giá
                            </span>
                            {turn.modelUsed && (
                              <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-[#444444] border border-black/5 flex items-center gap-1">
                                {getModelIcon(turn.modelUsed)}
                                <span>{getModelDisplayName(turn.modelUsed)}</span>
                              </span>
                            )}
                            {turn.response_mode === "needs_revision" && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                                Cần chỉnh lại
                              </span>
                            )}
                            {turn.response_mode === "partial" && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-900 border border-sky-200">
                                Đúng một phần
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

                            {turn.evaluation &&
                              (turn.evaluation.correct_points.length > 0 ||
                                turn.evaluation.incorrect_claims.length > 0) && (
                                <div className="mt-3 grid gap-2 border-t border-black/[0.08] pt-3 text-sm">
                                  {turn.evaluation.correct_points.length > 0 && (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-950">
                                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-emerald-800">
                                        <CheckCircle2 className="size-3.5" /> Ý đã hiểu đúng
                                      </p>
                                      <ul className="mt-1.5 space-y-1.5">
                                        {turn.evaluation.correct_points.map((point) => (
                                          <li key={point.id} className="leading-5">
                                            {point.feedback}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {turn.evaluation.incorrect_claims.length > 0 && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50/85 p-3 text-rose-950">
                                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-rose-800">
                                        Phần cần sửa
                                      </p>
                                      <ul className="mt-1.5 space-y-2">
                                        {turn.evaluation.incorrect_claims.map((item, index) => (
                                          <li key={`${item.claim}-${index}`} className="leading-5">
                                            <span className="font-semibold line-through decoration-rose-400/70">
                                              {item.claim}
                                            </span>{" "}
                                            <span>— {item.correction}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                            {turn.citation && (
                              <button
                                type="button"
                                onClick={openSlideViewer}
                                className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50/90 px-3 py-2.5 text-left transition hover:bg-sky-100"
                              >
                                <span className="min-w-0">
                                  <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-sky-700">
                                    Nguồn đối chiếu
                                  </span>
                                  <span className="mt-0.5 block truncate text-xs font-semibold text-sky-950">
                                    {turn.citation}
                                  </span>
                                </span>
                                <span className="shrink-0 text-xs font-bold text-sky-800">
                                  Mở slide <ExternalLink className="ml-1 inline size-3" />
                                </span>
                              </button>
                            )}

                            {turn.role === "assistant" && turn.lessonId && turn.questionId && (
                              <ResearchSourcesDisclosure
                                initialSources={turn.researchSources}
                                lessonId={turn.lessonId}
                                questionId={turn.questionId}
                              />
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
                            Câu trả lời của bạn
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
                    <span>Đang đối chiếu câu trả lời với dữ liệu bài học...</span>
                  </div>
                )}

                {/* Mastered callout */}
                {phase === "understood" && (
                  <div className="glass-box rounded-2xl p-4 border border-emerald-300 bg-emerald-50/80 text-emerald-950 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-700" />
                        <span>Bạn đã làm rõ đầy đủ câu hỏi này! ⭐</span>
                      </p>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Tất cả ý bắt buộc đã được hiểu đúng. Bạn có thể sang câu tiếp theo.
                      </p>
                    </div>
                    <button
                      onClick={advanceQuestion}
                      className="btn-dark"
                      style={{ padding: "8px 14px", fontSize: "12px" }}
                    >
                      {currentQuestionIndex === questionTotal - 1
                        ? "Hoàn thành bài →"
                        : "Câu tiếp theo →"}
                    </button>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* ─── FIXED PROMPT CARD AT BOTTOM (CANNOT SCROLL) ─── */}
            <div className="flex w-full flex-shrink-0 flex-col items-center gap-2 p-4 sm:pb-6">
              <div className="flex w-full max-w-[790px] flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const shouldOpen = !hintOpen;
                    setHintOpen(shouldOpen);
                    setSourceOpen(false);
                    if (shouldOpen && phase === "answering") {
                      handleTeachingSubmit("", true);
                    }
                  }}
                  className="faq-chip inline-flex items-center gap-1.5"
                  style={{ opacity: 1, background: "rgba(255,255,255,.82)" }}
                >
                  <Lightbulb className="size-3.5 text-amber-600" />
                  Gợi ý theo ngữ cảnh
                  <ChevronDown className={`size-3 transition ${hintOpen ? "rotate-180" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceOpen((value) => !value);
                    setHintOpen(false);
                  }}
                  className="faq-chip inline-flex items-center gap-1.5"
                  style={{ opacity: 1, background: "rgba(255,255,255,.82)" }}
                >
                  <BookOpen className="size-3.5 text-sky-700" />
                  View learning source
                  <ChevronDown className={`size-3 transition ${sourceOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {hintOpen && (
                <div className="glass-box w-full max-w-[790px] rounded-2xl border border-amber-300/70 bg-amber-50/90 p-3.5 text-sm text-amber-950">
                  <p className="flex items-center gap-2 font-bold">
                    <Lightbulb className="size-4 text-amber-600" /> Gợi ý
                  </p>
                  <p className="mt-1 leading-5 text-amber-900/80">
                    {targetedHint || "Đang tìm gợi ý phù hợp với phần bạn còn thiếu..."}
                  </p>
                </div>
              )}

              {sourceOpen && (
                <div className="glass-box w-full max-w-[790px] rounded-2xl border border-sky-300/60 bg-sky-50/90 p-3.5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-bold text-sky-950">
                        <FileText className="size-4 text-sky-700" /> Learning source
                      </p>
                      <p className="mt-1 text-xs font-semibold text-sky-900">{currentQuestion.source.range}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-sky-900/70">{currentQuestion.source.note}</p>
                    </div>
                    <button
                      type="button"
                      onClick={openSlideViewer}
                      className="shrink-0 rounded-xl border border-sky-900/10 bg-white/90 px-3 py-2 text-xs font-bold text-sky-900 shadow-sm transition hover:bg-white"
                    >
                      Open slide <ExternalLink className="ml-1 inline size-3" />
                    </button>
                  </div>
                </div>
              )}

              <form
                className="prompt"
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget.elements.namedItem(
                    "prompt_input"
                  ) as HTMLTextAreaElement;
                  if (target && target.value.trim() && phase === "answering") {
                    handleTeachingSubmit(target.value);
                    target.value = "";
                  }
                }}
              >
                <label className="sr-only" htmlFor="prompt-input">
                  Trả lời câu hỏi TeachBack
                </label>
                <textarea
                  id="prompt-input"
                  name="prompt_input"
                  className="prompt__input"
                  rows={2}
                  disabled={phase === "loading" || phase === "understood"}
                  placeholder={
                    isRecording
                      ? "Đang lắng nghe giọng nói của bạn..."
                      : "Trả lời bằng cách hiểu của bạn — không cần giống từng chữ trong slide"
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val && phase === "answering") {
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
                      title="Mở gợi ý và nguồn slide"
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
                          onClick={() => {
                            setHintOpen(true);
                            setSourceOpen(false);
                            handleTeachingSubmit("", true);
                          }}
                          className="faq-chip"
                          style={{ opacity: 1, background: "white" }}
                        >
                          💡 Xin gợi ý
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSourceOpen((value) => !value);
                            setHintOpen(false);
                          }}
                          className="faq-chip"
                          style={{ opacity: 1, background: "white" }}
                        >
                          📚 Nguồn học
                        </button>
                        <button
                          type="button"
                          onClick={openSlideViewer}
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
                      type="button"
                      onClick={() => {
                        setHintOpen(true);
                        setSourceOpen(false);
                        handleTeachingSubmit("", true);
                      }}
                      disabled={phase === "loading" || phase === "understood"}
                      className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-[#444444] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
                    >
                      I’m not sure
                    </button>
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
                      disabled={phase === "loading" || phase === "understood"}
                      title="Gửi (Enter)"
                    >
                      <Send className="size-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
              </section>

              <aside className="glass-box hidden max-h-full self-start overflow-y-auto rounded-[22px] p-4 xl:block">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#5f6e68]">
                  Lesson progress
                </p>
                <ol className="mt-4 space-y-1.5">
                  {curriculumLesson.questions.map((item, index) => {
                    const complete = index < currentQuestionIndex;
                    const current = index === currentQuestionIndex;
                    return (
                      <li
                        key={item.id}
                        className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition ${
                          current
                            ? "border border-emerald-700/10 bg-emerald-50/80 shadow-sm"
                            : ""
                        }`}
                      >
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                            complete
                              ? "bg-emerald-600 text-white"
                              : current
                                ? "bg-[#141414] text-white"
                                : "bg-white/60 text-[#9a9f9c]"
                          }`}
                        >
                          {complete ? (
                            <Check className="size-3.5" strokeWidth={3} />
                          ) : current ? (
                            index + 1
                          ) : (
                            <LockKeyhole className="size-3" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className={`truncate text-xs font-bold ${current ? "text-emerald-950" : complete ? "text-[#3d554d]" : "text-[#8b928f]"}`}>
                            Câu {index + 1}
                          </p>
                          <p className="truncate text-[10px] text-[#7b8581]">
                            {complete ? "Completed" : current ? item.concept : "Locked"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div className="my-4 h-px bg-black/[0.08]" />
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#74807b]">Current concept</p>
                    <p className="mt-1 text-sm font-bold leading-5 text-[#17342b]">{currentQuestion.concept}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white/55 p-2.5">
                      <p className="text-[10px] text-[#718078]">Lượt trả lời</p>
                      <p className="mt-0.5 text-sm font-bold text-[#17342b]">{attempts}</p>
                    </div>
                    <div className="rounded-xl bg-white/55 p-2.5">
                      <p className="text-[10px] text-[#718078]">Ý đã làm rõ</p>
                      <p className="mt-0.5 text-sm font-bold text-[#17342b]">
                        {masteredPointIds.length}/{currentQuestion.requiredPoints.length}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5 rounded-xl bg-white/45 p-2.5">
                    {currentQuestion.requiredPoints.map((point) => {
                      const complete = masteredPointIds.includes(point.id);
                      return (
                        <div key={point.id} className="flex items-center gap-2 text-[10px]">
                          <span className={`grid size-4 shrink-0 place-items-center rounded-full ${complete ? "bg-emerald-600 text-white" : "border border-black/15 bg-white/70 text-transparent"}`}>
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                          <span className={complete ? "font-semibold text-emerald-800" : "text-[#66706c]"}>
                            {point.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          </main>
        )}

        {/* ================================================================= */}
        {/* MODAL 1: SLIDE PREVIEW                                            */}
        {/* ================================================================= */}
        <Dialog
          open={slideOpen}
          onOpenChange={(open) => {
            setSlideOpen(open);
            if (open) setActiveSlideIndex(0);
          }}
        >
          <DialogContent className="max-h-[94vh] overflow-hidden rounded-[26px] border-white/60 bg-[#f7f8f6]/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-5xl">
            <DialogHeader className="border-b border-black/[0.08] px-5 py-4 pr-14 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#141414] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  {currentLesson.label}
                </span>
                <DialogTitle className="text-lg font-bold text-[#111111] sm:text-xl">
                  Slide {activeSlideNumber}
                </DialogTitle>
                <span className="text-xs font-medium text-[#6d7672]">
                  {activeSlideIndex + 1}/{questionSlides.length}
                </span>
              </div>
              <DialogDescription className="text-xs leading-5 text-[#59635f]">
                {currentQuestion.concept} · {currentQuestion.source.topic}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-5">
              <div className="relative mt-4 overflow-hidden rounded-2xl border border-black/10 bg-[#e7ebe8] shadow-sm">
                <div className="relative aspect-video w-full">
                  <Image
                    key={activeSlideImage}
                    src={activeSlideImage}
                    alt={`${currentLesson.label} - Slide ${activeSlideNumber}: ${currentQuestion.source.topic}`}
                    fill
                    priority
                    sizes="(max-width: 640px) 92vw, 900px"
                    className="object-contain"
                  />
                </div>

                {questionSlides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlideIndex((index) =>
                          index === 0 ? questionSlides.length - 1 : index - 1
                        )
                      }
                      className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-black/70 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black sm:left-3 sm:size-10"
                      aria-label="Slide trước"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlideIndex((index) =>
                          index === questionSlides.length - 1 ? 0 : index + 1
                        )
                      }
                      className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-black/70 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black sm:right-3 sm:size-10"
                      aria-label="Slide tiếp theo"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}
              </div>

              {questionSlides.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {questionSlides.map((slideNumber, index) => (
                    <button
                      key={slideNumber}
                      type="button"
                      onClick={() => setActiveSlideIndex(index)}
                      className={`group relative w-28 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition sm:w-32 ${
                        index === activeSlideIndex
                          ? "border-emerald-600 shadow-md"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      aria-label={`Mở slide ${slideNumber}`}
                      aria-current={index === activeSlideIndex ? "true" : undefined}
                    >
                      <div className="relative aspect-video w-full">
                        <Image
                          src={`/slides/day-${currentLesson.id}/slide-${slideNumber}.jpg`}
                          alt=""
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>
                      <span className="absolute bottom-1 right-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Slide {slideNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2 rounded-2xl border border-emerald-900/10 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-950 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold">Điểm cần chú ý</p>
                  <p className="mt-0.5 leading-5 text-emerald-900/80">
                    {currentQuestion.source.takeaway}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-emerald-900/60">
                  {currentQuestion.source.range}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================================================================= */}
        {/* MODAL 2: HOÀN THÀNH 4 CÂU HỎI & HỎI LÀM FLASHCARD                 */}
        {/* ================================================================= */}
        <Dialog open={scorecardModalOpen} onOpenChange={setScorecardModalOpen}>
          <DialogContent className="rounded-[24px] border-black/10 bg-white p-6 sm:p-7 sm:max-w-lg text-left">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  HOÀN THÀNH XUẤT SẮC ✓
                </span>
                <h3 className="text-xl font-bold text-[#111111] mt-1">
                  {currentLesson.title}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-emerald-700">{questionTotal}/{questionTotal}</span>
                <p className="text-[10px] text-[#777777]">Câu hỏi hoàn thành</p>
              </div>
            </div>

            {/* Khung hỏi người dùng có muốn làm flashcards không */}
            <div className="my-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-start gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-[#141414] text-white shrink-0 shadow-xs">
                  <span className="text-lg">🃏</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Bạn có muốn ôn luyện nhanh với bộ thẻ Flashcards không?
                  </h4>
                  <p className="text-xs text-emerald-900/80 mt-1 leading-relaxed">
                    Bộ 12 thẻ Flashcard 3D của {currentLesson.label} giúp bạn khắc sâu các khái niệm cốt lõi vừa học qua hình thức lật 2 mặt súc tích và trực quan.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-xs">
              <div className="p-3 rounded-xl bg-[#f8f9fa] border border-black/[0.06]">
                <p className="font-bold text-[#111111] mb-0.5">🧠 Tóm tắt cốt lõi:</p>
                <p className="text-[#555555] leading-relaxed">
                  {currentLesson.description}
                </p>
              </div>
            </div>

            {/* Các lựa chọn: Có làm flashcard ngay hoặc để sau */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setScorecardModalOpen(false);
                  setFlashcardDeckLessonId(currentLesson.id);
                  setFlashcardModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-black text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Sparkles className="size-3.5 text-emerald-400" />
                <span>Có, luyện Flashcards ngay →</span>
              </button>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopyFlashcard}
                  className="text-xs font-medium text-zinc-500 hover:text-black px-2 py-1.5 transition"
                  title="Sao chép chứng chỉ hoàn thành"
                >
                  {copiedFlashcard ? "✓ Đã chép!" : "Sao chép"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScorecardModalOpen(false);
                    setScreen("lessons");
                  }}
                  className="px-3.5 py-2 rounded-xl border border-black/15 bg-white hover:bg-black/5 text-xs font-semibold text-[#222222] transition cursor-pointer"
                >
                  Để sau, chọn bài khác
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================================================================= */}
        {/* MODAL 3: FIREBASE AUTHENTICATION & GMAIL VERIFICATION             */}
        {/* ================================================================= */}
        <AuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          reasonMessage={authModalReason}
          onSuccess={(user) => {
            setCurrentUser(user);
            if (pendingLessonId !== null) {
              const id = pendingLessonId;
              setPendingLessonId(null);
              startSession(id);
            }
          }}
        />

        {/* ================================================================= */}
        {/* MODAL 4: INTERACTIVE 3D FLIP FLASHCARD DECK                       */}
        {/* ================================================================= */}
        <FlashcardDeckModal
          open={flashcardModalOpen}
          onClose={() => setFlashcardModalOpen(false)}
          initialLessonId={flashcardDeckLessonId}
        />
      </div>
    </div>
  );
}

