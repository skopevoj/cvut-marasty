"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { toast } from "sonner";
import { IconButton } from "../ui/IconButton";
import { usePeerStore, useQuizStore } from "../../lib/stores";
import { selectCurrentQuestion } from "../../lib/stores/quizStore";

interface PaginationProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({
  currentIndex,
  total,
  onPrev,
  onNext,
}: PaginationProps) {
  const isInPeerRoom = usePeerStore((s) => s.isConnected);
  const currentQuestion = useQuizStore(selectCurrentQuestion);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "SELECT" ||
        activeElement?.closest("header") ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInputFocused) return;

      if (e.key === "ArrowLeft") {
        if (currentIndex > 0) onPrev();
      } else if (e.key === "ArrowRight") {
        if (currentIndex < total - 1) onNext();
      } else if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
        if (window.getSelection()?.toString()) return;
        if (!currentQuestion) return;
        const payload = {
          question: currentQuestion.question,
          type: currentQuestion.questionType,
          answers: currentQuestion.answers.map((a) => ({
            text: a.text,
            isCorrect: a.isCorrect,
          })),
        };
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
          toast.success("Otázka zkopírována do schránky");
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, total, onPrev, onNext, currentQuestion]);

  return (
    <div className="flex items-center justify-center gap-1 md:gap-3">
      <IconButton
        onClick={onPrev}
        disabled={currentIndex === 0}
        icon={ChevronLeft}
        variant="frosted"
        size={18}
        className=""
        title={isInPeerRoom ? "Předchozí (sdílené)" : "Předchozí otázka"}
      />

      <div className="flex items-center gap-2">
        {isInPeerRoom && (
          <span title="Synchronizováno se všemi">
            <Users
              size={14}
              className="text-[var(--subject-primary)] animate-pulse"
            />
          </span>
        )}
        <span className="min-w-[50px] md:min-w-[60px] text-center font-medium tabular-nums text-[var(--fg-muted)] text-xs md:text-sm">
          {currentIndex + 1} / {total}
        </span>
      </div>

      <IconButton
        onClick={onNext}
        disabled={currentIndex === total - 1}
        icon={ChevronRight}
        variant="frosted"
        size={18}
        className=""
        title={isInPeerRoom ? "Další (sdílené)" : "Další otázka"}
      />
    </div>
  );
}
