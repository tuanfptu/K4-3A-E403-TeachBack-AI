"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  MessageCircleQuestion,
  RefreshCw,
  Send,
  Target,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { getLesson, lessons, type Lesson, type Question } from "@/lib/lesson-data";

type Screen = "lessons" | "session" | "complete";
type Phase = "answering" | "loading" | "gap" | "understood";

type ToolDefinition = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: unknown) => unknown | Promise<unknown>;
};

type ModelContext = {
  registerTool: (tool: ToolDefinition, options?: { signal?: AbortSignal }) => void | Promise<void>;
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("lessons");
  const [selectedLessonId, setSelectedLessonId] = useState(2);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("answering");
  const [turns, setTurns] = useState<string[]>([]);
  const [challengeDepth, setChallengeDepth] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [followUps, setFollowUps] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [hintOpen, setHintOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [slideOpen, setSlideOpen] = useState(false);

  const lesson = useMemo(() => getLesson(selectedLessonId), [selectedLessonId]);
  const question = lesson.questions[currentIndex];
  const webMcpState = useRef({ screen, phase, currentIndex });
  const webMcpActions = useRef<{
    startLesson: (lessonId: number) => void;
    submitExplanation: (explanation: string) => void;
  }>({
    startLesson: (_lessonId: number) => undefined,
    submitExplanation: (_explanation: string) => undefined,
  });

  function resetQuestion() {
    setPhase("answering");
    setTurns([]);
    setChallengeDepth(0);
    setHintOpen(false);
    setSourceOpen(false);
    setSlideOpen(false);
  }

  function startLesson(lessonId: number) {
    if (!lessons.some((item) => item.id === lessonId)) return;
    setSelectedLessonId(lessonId);
    setCurrentIndex(0);
    setAttempts(0);
    setFollowUps(0);
    resetQuestion();
    setScreen("session");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitExplanation(explanation: string) {
    const clean = explanation.trim();
    if (!clean || phase === "loading" || phase === "understood") return;

    const shouldChallenge = Boolean(question.hasChallenge && challengeDepth === 0);
    setTurns((items) => [...items, clean]);
    setAttempts((value) => value + 1);
    setPhase("loading");

    window.setTimeout(() => {
      if (shouldChallenge) {
        setChallengeDepth(1);
        setFollowUps((value) => value + 1);
        setPhase("gap");
      } else {
        setPhase("understood");
      }
    }, 850);
  }

  function nextQuestion() {
    if (currentIndex === lesson.questions.length - 1) {
      setCompletedLessons((items) => new Set(items).add(lesson.id));
      setScreen("complete");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setCurrentIndex((value) => value + 1);
    resetQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToLessons() {
    setScreen("lessons");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  webMcpState.current = { screen, phase, currentIndex };
  webMcpActions.current = { startLesson, submitExplanation };

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: ToolDefinition) => {
      try {
        void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
      } catch {
        // WebMCP is optional in browsers that do not yet implement it.
      }
    };

    register({
      name: "start_teachai_lesson",
      title: "Start TeachAI lesson",
      description: "Start one of the visible TeachAI lessons by its numeric lesson ID.",
      inputSchema: {
        type: "object",
        properties: { lesson_id: { type: "integer", enum: [1, 2] } },
        required: ["lesson_id"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const lessonId = Number((input as { lesson_id?: number })?.lesson_id);
        if (lessonId !== 1 && lessonId !== 2) throw new Error("lesson_id must be 1 or 2");
        webMcpActions.current.startLesson(lessonId);
        return { status: "started", lesson_id: lessonId };
      },
    });

    register({
      name: "submit_teaching_explanation",
      title: "Submit teaching explanation",
      description: "Submit an explanation to the AI student for the current question.",
      inputSchema: {
        type: "object",
        properties: { explanation: { type: "string", minLength: 1 } },
        required: ["explanation"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        const explanation = String((input as { explanation?: string })?.explanation ?? "").trim();
        const current = webMcpState.current;
        if (current.screen !== "session") throw new Error("Start a lesson before submitting an explanation");
        if (current.phase === "loading" || current.phase === "understood") throw new Error("The current question is not accepting an explanation");
        if (!explanation) throw new Error("explanation cannot be empty");
        webMcpActions.current.submitExplanation(explanation);
        return { status: "submitted", question: current.currentIndex + 1 };
      },
    });

    return () => lifecycle.abort();
  }, []);

  if (screen === "lessons") {
    return (
      <LessonSelector
        selectedLessonId={selectedLessonId}
        completedLessons={completedLessons}
        onSelect={setSelectedLessonId}
        onStart={startLesson}
      />
    );
  }

  if (screen === "complete") {
    return (
      <CompletionScreen
        lesson={lesson}
        attempts={attempts}
        followUps={followUps}
        onBack={backToLessons}
        onReview={() => startLesson(lesson.id)}
      />
    );
  }

  return (
    <LearningSession
      lesson={lesson}
      question={question}
      currentIndex={currentIndex}
      phase={phase}
      turns={turns}
      challengeDepth={challengeDepth}
      attempts={attempts}
      hintOpen={hintOpen}
      sourceOpen={sourceOpen}
      slideOpen={slideOpen}
      onBack={backToLessons}
      onSubmit={submitExplanation}
      onNotSure={() => setHintOpen(true)}
      onHintToggle={() => setHintOpen((value) => !value)}
      onSourceToggle={() => setSourceOpen((value) => !value)}
      onSlideOpenChange={setSlideOpen}
      onNext={nextQuestion}
    />
  );
}

function AppHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`${compact ? "size-9 rounded-xl" : "size-10 rounded-[14px]"} grid place-items-center bg-[#4f46d8] text-white shadow-[0_8px_24px_rgba(79,70,216,.22)]`}>
        <BrainCircuit className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[1.05rem] font-bold tracking-[-0.025em]">TeachAI</p>
        {!compact && <p className="hidden text-sm text-[#6f7891] sm:block">Learn deeper by teaching an AI student.</p>}
      </div>
    </div>
  );
}

function LessonSelector({
  selectedLessonId,
  completedLessons,
  onSelect,
  onStart,
}: {
  selectedLessonId: number;
  completedLessons: Set<number>;
  onSelect: (id: number) => void;
  onStart: (id: number) => void;
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7fb] text-[#17203a]">
      <header className="border-b border-[#e2e6f0] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <AppHeader />
          <div className="flex items-center gap-2 rounded-full border border-[#dce2f0] bg-white px-3 py-1.5 text-sm font-medium text-[#52607c] shadow-sm">
            <GraduationCap className="size-4 text-[#5b5ce2]" aria-hidden="true" />
            You are the teacher
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
        <div className="pointer-events-none absolute -right-28 top-0 size-[26rem] rounded-full bg-[#5b5ce2]/[0.055] blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe1fb] bg-[#f0f0ff] px-3 py-1.5 text-sm font-semibold text-[#4f46d8]">
            <MessageCircleQuestion className="size-4" aria-hidden="true" />
            Learning by teaching
          </span>
          <h1 className="mt-5 text-balance text-4xl font-bold tracking-[-0.045em] text-[#151d34] sm:text-5xl">
            What would you like to teach today?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-[1.05rem] leading-8 text-[#66708a]">
            Choose a lesson and explain what you learned. Your AI student will ask questions whenever something is unclear.
          </p>
        </div>

        <div className="mx-auto mt-9 grid max-w-3xl grid-cols-4 gap-1 rounded-2xl border border-[#e0e4ee] bg-white p-2 shadow-[0_12px_40px_rgba(25,35,65,.06)]">
          {[["1", "AI asks"], ["2", "You explain"], ["3", "AI challenges"], ["4", "You master"]].map(([step, label], index) => (
            <div key={step} className="relative flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-[#59647f]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eef0ff] text-xs text-[#4f46d8]">{step}</span>
              <span className="hidden truncate sm:inline">{label}</span>
              {index < 3 && <ArrowRight className="absolute -right-2 size-3.5 text-[#a2aac0]" aria-hidden="true" />}
            </div>
          ))}
        </div>

        <div className="relative mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-2">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              selected={selectedLessonId === lesson.id}
              completed={completedLessons.has(lesson.id)}
              onSelect={() => onSelect(lesson.id)}
              onStart={() => onStart(lesson.id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function LessonCard({
  lesson,
  selected,
  completed,
  onSelect,
  onStart,
}: {
  lesson: Lesson;
  selected: boolean;
  completed: boolean;
  onSelect: () => void;
  onStart: () => void;
}) {
  return (
    <article
      onClick={onSelect}
      className={`group cursor-pointer rounded-[24px] border bg-white p-6 transition duration-200 sm:p-7 ${selected ? "border-[#6b67e8] shadow-[0_20px_55px_rgba(61,64,140,.14)] ring-4 ring-[#5b5ce2]/[0.07]" : "border-[#e0e4ee] shadow-[0_8px_30px_rgba(25,35,65,.055)] hover:-translate-y-0.5 hover:border-[#c6cbe0] hover:shadow-[0_16px_45px_rgba(25,35,65,.09)]"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${lesson.accent} text-white shadow-lg shadow-indigo-900/10`}>
          <BookOpen className="size-5" aria-hidden="true" />
        </div>
        <span className={`grid size-6 place-items-center rounded-full border transition ${selected ? "border-[#5b5ce2] bg-[#5b5ce2] text-white" : "border-[#cfd5e4] bg-white text-transparent"}`}>
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-6 text-sm font-bold uppercase tracking-[0.1em] text-[#7d86a0]">{lesson.label}</p>
      <h2 className="mt-2 text-2xl font-bold leading-tight tracking-[-0.025em] text-[#19223a]">{lesson.title}</h2>
      <p className="mt-3 min-h-[3.5rem] leading-7 text-[#68728a]">{lesson.description}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-[#edf0f5] py-4 text-sm font-medium text-[#5c6882]">
        <span className="flex items-center gap-2"><MessageCircleQuestion className="size-4 text-[#5b5ce2]" aria-hidden="true" />{lesson.questions.length} questions</span>
        <span className="flex items-center gap-2"><Clock3 className="size-4 text-[#5b5ce2]" aria-hidden="true" />{lesson.time}</span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${completed ? "bg-[#e9f8f1] text-[#14755b]" : "bg-[#f1f3f7] text-[#717b91]"}`}>
          {completed ? "✓ Completed" : "Not started"}
        </span>
        <Button
          onClick={(event) => { event.stopPropagation(); onStart(); }}
          variant={selected ? "default" : "outline"}
          className={`h-11 rounded-xl px-5 font-semibold ${selected ? "bg-[#4f46d8] text-white shadow-[0_8px_20px_rgba(79,70,216,.2)] hover:bg-[#4338ca]" : "border-[#d9deea] bg-white text-[#39445f] hover:bg-[#f5f6fb]"}`}
        >
          {completed ? "Teach again" : "Start teaching"} <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

function LearningSession({
  lesson,
  question,
  currentIndex,
  phase,
  turns,
  challengeDepth,
  attempts,
  hintOpen,
  sourceOpen,
  slideOpen,
  onBack,
  onSubmit,
  onNotSure,
  onHintToggle,
  onSourceToggle,
  onSlideOpenChange,
  onNext,
}: {
  lesson: Lesson;
  question: Question;
  currentIndex: number;
  phase: Phase;
  turns: string[];
  challengeDepth: number;
  attempts: number;
  hintOpen: boolean;
  sourceOpen: boolean;
  slideOpen: boolean;
  onBack: () => void;
  onSubmit: (answer: string) => void;
  onNotSure: () => void;
  onHintToggle: () => void;
  onSourceToggle: () => void;
  onSlideOpenChange: (open: boolean) => void;
  onNext: () => void;
}) {
  const total = lesson.questions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#17203a]">
      <header className="sticky top-0 z-30 border-b border-[#e0e4ee] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <AppHeader compact />
            <span className="hidden h-7 w-px bg-[#e0e4ee] sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-[#26314d]">{lesson.label} — {lesson.title}</p>
              <p className="text-sm text-[#7a849c]">Question {currentIndex + 1} of {total}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onBack} className="rounded-xl text-[#65708a] hover:bg-[#f0f2f7] hover:text-[#26314d]">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to lessons</span>
            <span className="sm:hidden">Lessons</span>
          </Button>
        </div>
        <Progress value={progress} aria-label={`Lesson progress ${Math.round(progress)} percent`} className="h-1 rounded-none bg-[#eceef5] [&_[data-slot=progress-indicator]]:bg-[#5b5ce2]" />
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
        <MobileProgress lesson={lesson} currentIndex={currentIndex} attempts={attempts} />
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_310px]">
          <section className="overflow-hidden rounded-[24px] border border-[#e0e4ee] bg-white shadow-[0_18px_55px_rgba(25,35,65,.075)]">
            <QuestionProgress currentIndex={currentIndex} total={total} concept={question.concept} />

            <div className="min-h-[420px] space-y-6 px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f5] pb-5">
                <div>
                  <p className="text-sm font-semibold text-[#5e6983]">Teaching conversation</p>
                  <p className="mt-1 text-sm text-[#8a93a8]">Explain it naturally—your AI student will ask if anything is unclear.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em]">
                  <span className="rounded-full bg-[#eef0ff] px-3 py-1.5 text-[#4f46d8]">Your role: Teacher</span>
                  <span className="rounded-full bg-[#edf8f7] px-3 py-1.5 text-[#16786e]">AI role: Student</span>
                </div>
              </div>

              <AIStudentMessage badge={`Question ${currentIndex + 1} / ${total}`}>
                {question.prompt}
              </AIStudentMessage>

              {turns[0] && <UserTeacherMessage>{turns[0]}</UserTeacherMessage>}

              {challengeDepth > 0 && (
                <div className="space-y-4">
                  <AIStudentMessage status="Knowledge gap detected">
                    <span className="mb-2 block text-[#65708b]">I think I understand part of it, but I’m still confused about something.</span>
                    {question.followUp}
                  </AIStudentMessage>
                  <KnowledgeGapCard understood={question.understood} stillUnsure={question.stillUnsure} />
                </div>
              )}

              {turns.slice(1).map((turn, index) => <UserTeacherMessage key={`${turn}-${index}`}>{turn}</UserTeacherMessage>)}

              {phase === "loading" && (
                <div className="flex items-center gap-3 pl-12 text-sm font-medium text-[#6b7590]" role="status" aria-live="polite">
                  <LoaderCircle className="size-4 animate-spin text-[#5b5ce2]" aria-hidden="true" />
                  Let me think about your explanation…
                </div>
              )}

              {phase === "understood" && (
                <div className="space-y-4">
                  <AIStudentMessage>{question.success}</AIStudentMessage>
                  <ConceptUnderstoodCard covered={question.covered} finalQuestion={currentIndex === total - 1} onNext={onNext} />
                </div>
              )}
            </div>

            {phase !== "understood" && (
              <div className="border-t border-[#e8ebf2] bg-[#fafbfe] px-5 py-5 sm:px-8 sm:py-6">
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={onHintToggle} disabled={phase === "loading"} className="h-10 rounded-xl border-[#eadcae] bg-[#fffdf5] text-[#876617] hover:bg-[#fff8de] hover:text-[#76570f]">
                    <Lightbulb className="size-4" aria-hidden="true" />
                    Need a hint?
                    <ChevronDown className={`size-3.5 transition ${hintOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </Button>
                  <Button variant="outline" onClick={onSourceToggle} disabled={phase === "loading"} className="h-10 rounded-xl border-[#d9deea] bg-white text-[#56627d] hover:bg-[#f5f6fb]">
                    <BookOpen className="size-4" aria-hidden="true" />
                    View learning source
                    <ChevronDown className={`size-3.5 transition ${sourceOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </Button>
                </div>
                {hintOpen && <HintCard hint={question.hint} />}
                {sourceOpen && <SourceReference lesson={lesson} question={question} onOpenSlide={() => onSlideOpenChange(true)} />}
                <AnswerInput key={`${lesson.id}-${question.id}-${challengeDepth}`} disabled={phase === "loading"} isFollowUp={challengeDepth > 0} onSubmit={onSubmit} onNotSure={onNotSure} />
              </div>
            )}
          </section>

          <LessonProgress lesson={lesson} currentIndex={currentIndex} attempts={attempts} />
        </div>
      </div>

      <SlidePreviewModal open={slideOpen} onOpenChange={onSlideOpenChange} lesson={lesson} question={question} />
    </main>
  );
}

function QuestionProgress({ currentIndex, total, concept }: { currentIndex: number; total: number; concept: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#e5e8f0] bg-[#fbfbfe] px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-[#e9eaff] text-sm font-bold text-[#4f46d8]">{currentIndex + 1}</span>
        <div>
          <p className="text-sm font-bold text-[#26314d]">Question {currentIndex + 1} of {total}</p>
          <p className="text-sm text-[#7c869e]">{concept}</p>
        </div>
      </div>
      <span className="text-sm font-bold text-[#4f46d8]">{Math.round(((currentIndex + 1) / total) * 100)}%</span>
    </div>
  );
}

function AIStudentMessage({ children, badge, status }: { children: React.ReactNode; badge?: string; status?: string }) {
  return (
    <div className="flex max-w-[94%] items-start gap-3 sm:max-w-[85%]">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf0ff] text-[#4f46d8] ring-1 ring-[#dde0fb]">
        <Bot className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-[#303a56]">AI Student</span>
          {badge && <span className="rounded-full bg-[#eef0f6] px-2.5 py-1 text-xs font-semibold text-[#6c7690]">{badge}</span>}
          {status && <span className="rounded-full border border-[#f0cdb6] bg-[#fff4ec] px-2.5 py-1 text-xs font-bold text-[#a14e20]">{status}</span>}
        </div>
        <div className="rounded-[18px] rounded-tl-md border border-[#dfe3f3] bg-[#f4f6ff] px-4 py-3.5 leading-7 text-[#2e3853] shadow-sm">{children}</div>
      </div>
    </div>
  );
}

function UserTeacherMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-auto flex max-w-[94%] flex-row-reverse items-start gap-3 sm:max-w-[80%]">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#4f46d8] text-white">
        <UserRound className="size-[17px]" aria-hidden="true" />
      </span>
      <div className="min-w-0 text-right">
        <p className="mb-2 text-sm font-bold text-[#4f46d8]">You · Teacher</p>
        <div className="rounded-[18px] rounded-tr-md bg-[#4f46d8] px-4 py-3.5 text-left leading-7 text-white shadow-[0_8px_24px_rgba(79,70,216,.18)]">{children}</div>
      </div>
    </div>
  );
}

function AnswerInput({ disabled, isFollowUp, onSubmit, onNotSure }: { disabled: boolean; isFollowUp: boolean; onSubmit: (value: string) => void; onNotSure: () => void }) {
  const [value, setValue] = useState("");

  return (
    <form
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        onSubmit(value);
        setValue("");
      }}
    >
      <label htmlFor="teaching-answer" className="mb-2 block text-sm font-bold text-[#34405d]">
        {isFollowUp ? "Clarify your explanation" : "Teach the AI in your own words"}
      </label>
      <div className="rounded-2xl border border-[#d9deea] bg-white p-2 shadow-[0_5px_18px_rgba(25,35,65,.045)] focus-within:border-[#7774e8] focus-within:ring-4 focus-within:ring-[#5b5ce2]/10">
        <Textarea
          id="teaching-answer"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
          placeholder="Teach the AI in your own words..."
          className="min-h-28 resize-none border-0 bg-transparent px-3 py-2 text-base leading-7 text-[#28334f] shadow-none outline-none placeholder:text-[#9aa2b6] focus-visible:ring-0"
        />
        <div className="flex flex-col gap-3 border-t border-[#edf0f5] px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#7c869d]">Try to explain it as if you were teaching a classmate.</p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="ghost" onClick={onNotSure} disabled={disabled} className="rounded-xl text-[#6c7690] hover:bg-[#f1f3f8]">I’m not sure</Button>
            <Button type="submit" disabled={disabled || !value.trim()} className="rounded-xl bg-[#4f46d8] px-5 text-white shadow-[0_8px_20px_rgba(79,70,216,.18)] hover:bg-[#4338ca]">
              Teach AI <Send className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function HintCard({ hint }: { hint: string }) {
  return (
    <div className="mb-3 flex gap-3 rounded-2xl border border-[#efdfab] bg-[#fffaf0] p-4 text-[#72561a] animate-in fade-in slide-in-from-top-1 duration-200">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#ffefbd] text-[#9b7112]"><Lightbulb className="size-4" aria-hidden="true" /></span>
      <div><p className="text-sm font-bold">Hint</p><p className="mt-1 leading-6 text-[#7d652f]">{hint}</p></div>
    </div>
  );
}

function SourceReference({ lesson, question, onOpenSlide }: { lesson: Lesson; question: Question; onOpenSlide: () => void }) {
  return (
    <div className="mb-3 rounded-2xl border border-[#dbe2ed] bg-[#f8fafc] p-4 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#e8eff8] text-[#476381]"><FileText className="size-4" aria-hidden="true" /></span>
          <div>
            <p className="text-sm font-bold text-[#34425c]">Learning source</p>
            <p className="mt-1 font-semibold text-[#26314d]">{lesson.label} — {question.source.range}</p>
            <p className="mt-1 text-sm text-[#69748c]"><span className="font-semibold">{question.source.topic}.</span> {question.source.note}</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={onOpenSlide} className="shrink-0 rounded-xl border-[#ced7e5] bg-white text-[#40506b] hover:bg-[#eef2f7]">
          Open slide reference <ExternalLink className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function KnowledgeGapCard({ understood, stillUnsure }: { understood: string; stillUnsure: string }) {
  return (
    <div className="ml-0 grid gap-4 rounded-2xl border border-[#efd4c2] bg-[#fffaf7] p-4 sm:ml-12 sm:grid-cols-2 sm:p-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold text-[#42705f]"><CheckCircle2 className="size-4" aria-hidden="true" />What I understood</p>
        <p className="mt-2 text-sm leading-6 text-[#5f6c7e]">{understood}</p>
      </div>
      <div className="border-t border-[#efded2] pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <p className="flex items-center gap-2 text-sm font-bold text-[#a14e20]"><MessageCircleQuestion className="size-4" aria-hidden="true" />What I’m still unsure about</p>
        <p className="mt-2 text-sm leading-6 text-[#6e625d]">{stillUnsure}</p>
      </div>
    </div>
  );
}

function ConceptUnderstoodCard({ covered, finalQuestion, onNext }: { covered: string[]; finalQuestion: boolean; onNext: () => void }) {
  return (
    <div className="ml-0 rounded-2xl border border-[#bfe8d5] bg-[#f1fbf6] p-5 sm:ml-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 font-bold text-[#14755b]"><CheckCircle2 className="size-5" aria-hidden="true" />Concept understood</p>
          <p className="mt-2 text-sm text-[#4f6f66]">You covered</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {covered.map((item) => <span key={item} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#326b59] ring-1 ring-[#cbe9dc]">{item}</span>)}
          </div>
        </div>
        <Button onClick={onNext} className="shrink-0 rounded-xl bg-[#15836a] px-5 text-white shadow-[0_8px_20px_rgba(21,131,106,.17)] hover:bg-[#106c58]">
          {finalQuestion ? "Complete lesson" : "Next question"} <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function LessonProgress({ lesson, currentIndex, attempts }: { lesson: Lesson; currentIndex: number; attempts: number }) {
  return (
    <aside className="sticky top-28 hidden rounded-[22px] border border-[#e0e4ee] bg-white p-5 shadow-[0_12px_40px_rgba(25,35,65,.06)] lg:block">
      <p className="text-sm font-bold uppercase tracking-[0.09em] text-[#818aa1]">Lesson progress</p>
      <ol className="mt-5 space-y-2">
        {lesson.questions.map((item, index) => {
          const complete = index < currentIndex;
          const current = index === currentIndex;
          return (
            <li key={item.id} className={`flex items-center gap-3 rounded-xl p-3 ${current ? "bg-[#f0f0ff] ring-1 ring-[#dddefa]" : ""}`}>
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${complete ? "bg-[#daf3e8] text-[#14755b]" : current ? "bg-[#5b5ce2] text-white" : "bg-[#f0f2f6] text-[#9aa2b5]"}`}>
                {complete ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : current ? index + 1 : <LockKeyhole className="size-3" aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${current ? "text-[#3735aa]" : complete ? "text-[#3d5260]" : "text-[#8a93a8]"}`}>Question {index + 1}</p>
                <p className="truncate text-xs text-[#9098aa]">{complete ? "Completed" : current ? "In progress" : "Locked"}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="my-5 h-px bg-[#edf0f5]" />
      <div className="space-y-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#8a93a8]">Current concept</p><p className="mt-1 font-bold text-[#2b3652]">{lesson.questions[currentIndex].concept}</p></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#8a93a8]">Teaching attempts</p><p className="mt-1 font-bold text-[#2b3652]">{attempts} {attempts === 1 ? "attempt" : "attempts"}</p></div>
      </div>
    </aside>
  );
}

function MobileProgress({ lesson, currentIndex, attempts }: { lesson: Lesson; currentIndex: number; attempts: number }) {
  return (
    <details className="mb-5 rounded-2xl border border-[#e0e4ee] bg-white shadow-sm lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-bold text-[#39445f]">
        <span>Lesson progress · Question {currentIndex + 1} of {lesson.questions.length}</span>
        <ChevronDown className="size-4 text-[#737e96]" aria-hidden="true" />
      </summary>
      <div className="border-t border-[#edf0f5] px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {lesson.questions.map((item, index) => (
            <span key={item.id} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${index < currentIndex ? "bg-[#e3f5ed] text-[#14755b]" : index === currentIndex ? "bg-[#ececff] text-[#4f46d8]" : "bg-[#f1f3f6] text-[#929aab]"}`}>
              {index < currentIndex ? <Check className="size-3" aria-hidden="true" /> : index + 1} {index === currentIndex ? "Current" : index < currentIndex ? "Done" : "Locked"}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-[#69748c]">{lesson.questions[currentIndex].concept} · {attempts} {attempts === 1 ? "attempt" : "attempts"}</p>
      </div>
    </details>
  );
}

function SlidePreviewModal({ open, onOpenChange, lesson, question }: { open: boolean; onOpenChange: (open: boolean) => void; lesson: Lesson; question: Question }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[24px] border-[#dce1eb] p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-[#e6e9f0] px-6 py-5 pr-14">
          <DialogTitle className="text-xl tracking-[-0.02em]">{lesson.label} · Slide {question.source.slide}</DialogTitle>
          <DialogDescription>{question.source.topic}</DialogDescription>
        </DialogHeader>
        <div className="p-5 sm:p-7">
          <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-[#dce2ed] bg-[#f5f7fc] p-5 shadow-inner sm:p-7">
            <div className="flex h-full flex-col rounded-xl bg-white p-5 shadow-[0_12px_32px_rgba(25,35,65,.09)] sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#5b5ce2]">{lesson.label}</p>
                  <h3 className="mt-2 text-xl font-bold tracking-[-0.025em] text-[#19233c] sm:text-2xl">{question.source.topic}</h3>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#ececff] text-sm font-bold text-[#4f46d8]">{question.source.slide}</span>
              </div>
              <div className="my-5 h-px bg-[#eaedf3]" />
              <div className="grid flex-1 place-items-center">
                <div className="flex w-full max-w-lg items-center justify-center gap-2 sm:gap-4">
                  {["Learned patterns", "Relevant context", "Generated response"].map((item, index) => (
                    <div key={item} className="contents">
                      <div className={`grid min-h-20 flex-1 place-items-center rounded-xl px-2 text-center text-xs font-bold sm:text-sm ${index === 1 ? "border border-[#cfe9e5] bg-[#edf9f7] text-[#14756b]" : "border border-[#dcdef5] bg-[#f2f3ff] text-[#4746af]"}`}>{item}</div>
                      {index < 2 && <ArrowRight className="size-4 shrink-0 text-[#9aa3b7]" aria-hidden="true" />}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-5 rounded-lg bg-[#f4f6fa] px-3 py-2 text-center text-xs font-medium text-[#68738b]">{question.source.takeaway}</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#fff8e6] px-4 py-3 text-sm leading-6 text-[#786027]">
            <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Use this slide to refresh your memory, then close it and explain the idea in your own words.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompletionScreen({ lesson, attempts, followUps, onBack, onReview }: { lesson: Lesson; attempts: number; followUps: number; onBack: () => void; onReview: () => void }) {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#17203a]">
      <header className="border-b border-[#e1e5ed] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8"><AppHeader /><Button variant="ghost" onClick={onBack} className="rounded-xl text-[#64708a]"><ArrowLeft className="size-4" aria-hidden="true" />Back to lessons</Button></div>
      </header>
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="relative overflow-hidden rounded-[28px] border border-[#cce8db] bg-white p-6 text-center shadow-[0_24px_70px_rgba(25,80,65,.10)] sm:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#eaf9f2] to-transparent" />
          <div className="relative mx-auto grid size-20 place-items-center rounded-full bg-[#15836a] text-white shadow-[0_12px_30px_rgba(21,131,106,.25)]">
            <Check className="size-10" strokeWidth={2.7} aria-hidden="true" />
          </div>
          <div className="relative mt-6">
            <p className="text-sm font-bold uppercase tracking-[0.11em] text-[#15836a]">{lesson.label} — DONE ✓</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.045em] text-[#17213a] sm:text-5xl">Lesson completed!</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#657089]">You successfully taught the AI all concepts in {lesson.label}.</p>
          </div>

          <div className="relative mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ["Questions completed", `${lesson.questions.length} / ${lesson.questions.length}`],
              ["Follow-up challenges", String(followUps)],
              ["Teaching attempts", String(attempts)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#e3e8ef] bg-[#fafbfc] p-5"><p className="text-sm font-semibold text-[#7a849b]">{label}</p><p className="mt-1 text-2xl font-bold text-[#25304b]">{value}</p></div>
            ))}
          </div>

          <div className="relative mx-auto mt-8 max-w-3xl rounded-2xl border border-[#dfe5ed] bg-[#f8fafc] p-5 text-left sm:p-6">
            <h2 className="flex items-center gap-2 font-bold text-[#293550]"><Target className="size-5 text-[#5b5ce2]" aria-hidden="true" />What you successfully taught</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {lesson.completionTopics.map((topic) => <div key={topic} className="flex items-start gap-2.5 text-[#56627b]"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#15836a]" aria-hidden="true" /><span>{topic}</span></div>)}
            </div>
          </div>

          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={onBack} className="h-12 rounded-xl bg-[#4f46d8] px-6 text-white shadow-[0_9px_24px_rgba(79,70,216,.19)] hover:bg-[#4338ca]">Back to lessons <ArrowRight className="size-4" aria-hidden="true" /></Button>
            <Button variant="outline" onClick={onReview} className="h-12 rounded-xl border-[#d4dae6] bg-white px-6 text-[#4e5a74] hover:bg-[#f3f5f8]"><RefreshCw className="size-4" aria-hidden="true" />Review lesson</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
