"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  RotateCw,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { FLASHCARD_DECKS, type FlashcardItem } from "@/lib/flashcard-data";

interface FlashcardDeckModalProps {
  open: boolean;
  onClose: () => void;
  initialLessonId?: number;
}

export function FlashcardDeckModal({
  open,
  onClose,
  initialLessonId = 1,
}: FlashcardDeckModalProps) {
  const [activeLessonId, setActiveLessonId] = useState<number>(initialLessonId);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<boolean>(false);

  // Cập nhật lesson id khi modal được mở lại với initialLessonId mới
  useEffect(() => {
    if (open) {
      setActiveLessonId(initialLessonId);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }
  }, [open, initialLessonId]);

  // Đọc danh sách thẻ đã thuộc từ localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("teachai_mastered_flashcards");
        if (saved) {
          setMasteredCards(JSON.parse(saved));
        }
      } catch (err) {
        console.warn("Could not load mastered flashcards", err);
      }
    }
  }, []);

  const deck = useMemo<FlashcardItem[]>(() => {
    return FLASHCARD_DECKS[activeLessonId] || FLASHCARD_DECKS[1];
  }, [activeLessonId]);

  const currentCard = deck[currentCardIndex] || deck[0];
  const isCardMastered = Boolean(masteredCards[currentCard.id]);

  // Phím tắt bàn phím: Left/Right đổi thẻ, Space/Enter lật thẻ, Esc đóng
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === " " || e.key === "Enter") {
        if (
          document.activeElement?.tagName !== "BUTTON" &&
          document.activeElement?.tagName !== "INPUT"
        ) {
          e.preventDefault();
          setIsFlipped((v) => !v);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentCardIndex, deck.length]);

  function handleNext() {
    setIsFlipped(false);
    setCurrentCardIndex((idx) => (idx + 1) % deck.length);
  }

  function handlePrev() {
    setIsFlipped(false);
    setCurrentCardIndex((idx) => (idx - 1 + deck.length) % deck.length);
  }

  function handleSelectLesson(id: number) {
    setActiveLessonId(id);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }

  function toggleMastered(cardId: string) {
    setMasteredCards((prev) => {
      const next = { ...prev, [cardId]: !prev[cardId] };
      if (typeof window !== "undefined") {
        localStorage.setItem("teachai_mastered_flashcards", JSON.stringify(next));
      }
      return next;
    });
  }

  function handleCopyCard() {
    const text = `🃏 THẺ GHI NHỚ: ${currentCard.concept} (${currentCard.lessonLabel})
Nguồn: ${currentCard.slideRange}
---
❓ Câu hỏi: ${currentCard.frontPrompt}
🧠 Cơ chế gốc: ${currentCard.mechanism}
💡 Ẩn dụ đời thực: ${currentCard.analogy}
⚠️ Điểm cốt tử: ${currentCard.takeaway}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      {/* 3D Styles & Keyframes */}
      <style>{`
        .perspective-card-deck {
          perspective: 1400px;
        }
        .flip-card-inner {
          transition: transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
        }
        .flip-card-inner.is-flipped {
          transform: rotateY(180deg);
        }
        .flip-card-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>

      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-[28px] border border-white/40 bg-[#f7f8f6] shadow-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 30px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
        }}
      >
        {/* TOP BAR: Header & Tabs */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/[0.08] bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-black text-white shadow-xs">
              <Layers className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <span>Bộ thẻ Flashcard 3D</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {deck.length} Khái niệm
                </span>
              </h2>
            </div>
          </div>

          {/* TAB CHỌN BÀI HỌC */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 border border-black/5">
            <button
              type="button"
              onClick={() => handleSelectLesson(1)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeLessonId === 1
                  ? "bg-white text-black shadow-xs"
                  : "text-[#666666] hover:text-black"
              }`}
            >
              Day 1: Foundation
            </button>
            <button
              type="button"
              onClick={() => handleSelectLesson(2)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeLessonId === 2
                  ? "bg-white text-black shadow-xs"
                  : "text-[#666666] hover:text-black"
              }`}
            >
              Day 2: Bài toán AI
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full bg-black/5 hover:bg-black/10 text-[#444444] transition"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* BODY: THE 3D FLIP CARD CONTAINER */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px]">
          <div className="w-full perspective-card-deck">
            {/* THẺ 3D XOAY */}
            <div
              onClick={() => setIsFlipped((v) => !v)}
              className={`flip-card-inner relative w-full min-h-[340px] sm:min-h-[380px] rounded-[24px] cursor-pointer select-none transition-shadow duration-300 hover:shadow-xl ${
                isFlipped ? "is-flipped" : ""
              }`}
            >
              {/* ──────────────── MẶT TRƯỚC (FRONT) ──────────────── */}
              <div
                className="flip-card-face absolute inset-0 rounded-[24px] border border-black/10 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-sm overflow-hidden"
                style={{
                  background:
                    "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)",
                }}
              >
                {/* Góc trang trí nền */}
                <div className="absolute -top-12 -right-12 size-36 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{currentCard.icon}</span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentCard.badgeColor}`}
                      >
                        {currentCard.concept}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-[#777777] bg-black/5 px-2.5 py-0.5 rounded-full">
                        {currentCard.slideRange}
                      </span>
                      {isCardMastered && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                          Đã thuộc
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-[#111111] leading-snug mt-2">
                    {currentCard.frontPrompt}
                  </h3>

                  <div className="mt-4 p-3.5 rounded-xl bg-[#f5f6f4] border border-black/5">
                    <p className="text-xs text-[#666666] flex items-start gap-2">
                      <Sparkles className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{currentCard.frontHint}</span>
                    </p>
                  </div>
                </div>

                {/* Hướng dẫn lật ở mặt trước */}
                <div className="pt-4 border-t border-black/5 flex items-center justify-between text-xs text-[#888888]">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <RotateCw className="size-3 animate-spin duration-1000" />
                    Chạm hoặc bấm Space để lật xem đáp án 3D
                  </span>
                  <span className="hidden sm:inline text-[11px]">
                    Phím <kbd className="px-1.5 py-0.5 bg-black/5 rounded border font-mono">Space</kbd> để lật
                  </span>
                </div>
              </div>

              {/* ──────────────── MẶT SAU (BACK) ──────────────── */}
              <div
                className="flip-card-face flip-card-back absolute inset-0 rounded-[24px] border border-emerald-900/15 bg-white p-5 sm:p-7 flex flex-col justify-between shadow-sm overflow-y-auto"
                style={{
                  background:
                    "linear-gradient(145deg, #ffffff 0%, #f4fbf7 100%)",
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-black/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{currentCard.icon}</span>
                      <h4 className="text-sm font-bold text-emerald-950">
                        {currentCard.concept} · Bản chất cốt lõi
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      MẶT SAU
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Cơ chế */}
                    <div className="p-3 rounded-xl bg-white border border-emerald-900/10 shadow-xs">
                      <p className="font-bold text-[#111111] mb-1 flex items-center gap-1.5">
                        <span>🧠 Cơ chế kỹ thuật gốc:</span>
                      </p>
                      <p className="text-[#333333] leading-relaxed">
                        {currentCard.mechanism}
                      </p>
                    </div>

                    {/* Ẩn dụ */}
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-900/10">
                      <p className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                        <span>💡 Ẩn dụ đời thực dễ nhớ:</span>
                      </p>
                      <p className="italic text-emerald-950 leading-relaxed">
                        &ldquo;{currentCard.analogy}&rdquo;
                      </p>
                    </div>

                    {/* Điểm cốt tử */}
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-900/10">
                      <p className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                        <span>⚠️ Điểm cốt tử cần nhớ:</span>
                      </p>
                      <p className="text-amber-950 leading-relaxed">
                        {currentCard.takeaway}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hướng dẫn lật lại ở mặt sau */}
                <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs text-[#888888] mt-2">
                  <span className="text-[11px] text-[#666666]">
                    Nguồn: {currentCard.slideRange}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700">
                    Chạm để lật lại câu hỏi ↺
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CONTROLLER: Navigation, Counter, Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-black/[0.08] bg-white/75 backdrop-blur-sm">
          {/* Nút đánh dấu đã thuộc & Copy */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleMastered(currentCard.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isCardMastered
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-white text-[#555555] border-black/10 hover:bg-black/5"
              }`}
            >
              <Star
                className={`size-3.5 ${
                  isCardMastered
                    ? "fill-amber-500 text-amber-500"
                    : "text-[#777777]"
                }`}
              />
              <span>{isCardMastered ? "Đã thuộc ⭐" : "Đánh dấu đã thuộc"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-[#555555] border border-black/10 hover:bg-black/5 transition"
              title="Sao chép nội dung thẻ này"
            >
              <Copy className="size-3.5" />
              <span>{copied ? "Đã chép!" : "Sao chép"}</span>
            </button>
          </div>

          {/* Điều hướng chuyển thẻ Trước / Sau */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-black/10 hover:bg-black/5 text-[#222222] transition"
              aria-label="Thẻ trước"
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Trước</span>
            </button>

            {/* Chấm tròn chỉ số thẻ */}
            <div className="flex items-center gap-1.5 px-2">
              {deck.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex(idx);
                  }}
                  className={`size-2 rounded-full transition-all ${
                    idx === currentCardIndex
                      ? "bg-black w-5"
                      : "bg-black/20 hover:bg-black/40"
                  }`}
                  aria-label={`Chuyển tới thẻ ${idx + 1}`}
                />
              ))}
            </div>

            <span className="text-xs font-bold text-[#111111] min-w-[42px] text-center">
              {currentCardIndex + 1}/{deck.length}
            </span>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#141414] text-white hover:bg-black transition shadow-xs"
              aria-label="Thẻ tiếp theo"
            >
              <span className="hidden sm:inline">Tiếp</span>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
