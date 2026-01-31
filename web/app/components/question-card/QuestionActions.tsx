"use client";

import {
  Star,
  TriangleAlert,
  ImageIcon,
  FileText,
  MessageSquare,
  MessageCircle,
  BarChart2,
} from "lucide-react";
import { favoritesHelper } from "../../lib/helper/favoritesHelper";
import { useState, useEffect } from "react";
import { useDataStore, useQuizStore, useSettingsStore } from "../../lib/stores";
import { SuggestEditModal } from "./SuggestEditModal";

interface QuestionActionsProps {
  questionId: string;
  hasQuizPhoto: boolean;
  showQuizPhoto: boolean;
  onToggleQuizPhoto: () => void;
  hasOriginalText: boolean;
  showOriginalText: boolean;
  onToggleOriginalText: () => void;
}

export function QuestionActions({
  questionId,
  hasQuizPhoto,
  showQuizPhoto,
  onToggleQuizPhoto,
  hasOriginalText,
  showOriginalText,
  onToggleOriginalText,
}: QuestionActionsProps) {
  const questions = useDataStore((s) => s.questions);
  const currentSubject = useDataStore((s) => s.currentSubject);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const showComments = useQuizStore((s) => s.showComments);
  const toggleComments = useQuizStore((s) => s.toggleComments);
  const showStats = useQuizStore((s) => s.showStats);
  const toggleStats = useQuizStore((s) => s.toggleStats);
  const backendUrl = useSettingsStore((s) => s.backendUrl);

  const hasRepository = Boolean(currentSubject?.repositoryUrl);
  const currentQuestion = questions.find((q) => q.id === questionId);

  useEffect(() => {
    setIsFavorite(favoritesHelper.isFavorite(questionId));

    const handleUpdate = () => {
      setIsFavorite(favoritesHelper.isFavorite(questionId));
    };

    window.addEventListener("favorites-updated", handleUpdate);
    return () => window.removeEventListener("favorites-updated", handleUpdate);
  }, [questionId]);

  useEffect(() => {
    if (!backendUrl || !currentQuestion) return;

    const fetchCommentCount = async () => {
      try {
        const baseUrl = backendUrl.endsWith("/")
          ? backendUrl
          : `${backendUrl}/`;
        const response = await fetch(
          `${baseUrl}comments/${currentQuestion.id}`,
        );
        if (response.ok) {
          const comments = await response.json();
          setCommentCount(comments.length);
        }
      } catch (error) {
        console.error("Failed to fetch comment count", error);
      }
    };

    fetchCommentCount();
  }, [backendUrl, currentQuestion, currentSubject?.id]);

  const handleToggleFavorite = () => {
    const willBeFavorite = !isFavorite;
    favoritesHelper.toggleFavorite(questionId);
    if (willBeFavorite) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
      {/* {hasOriginalText && (
        <button
          onClick={onToggleOriginalText}
          title="Zobrazit původní text z Wordu"
          className={`p-1 transition-all duration-200 hover:scale-110 active:scale-90 ${
            showOriginalText
              ? "text-[var(--subject-primary)]"
              : "text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
          }`}
        >
          <FileText size={20} />
        </button>
      )} */}
      {hasQuizPhoto && (
        <button
          onClick={onToggleQuizPhoto}
          title="Zobrazit detailní obrázek"
          className={`p-1 transition-all duration-200 hover:scale-110 active:scale-90 ${
            showQuizPhoto
              ? "text-[var(--subject-primary)]"
              : "text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
          }`}
        >
          <ImageIcon size={20} />
        </button>
      )}
      {backendUrl && (
        <button
          onClick={() => {
            toggleComments();
            toggleStats();
          }}
          title="Komunita - Komentáře a globální statistiky"
          className={`relative p-1 transition-all duration-200 hover:scale-110 active:scale-90 ${
            showComments
              ? "text-[var(--subject-primary)]"
              : "text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
          }`}
        >
          <MessageSquare size={20} />
          {commentCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--fg-subtle)] px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-[var(--surface-color)]">
              {commentCount}
            </span>
          )}
        </button>
      )}
      {/* {hasRepository && (
                <button
                    onClick={() => setIsSuggestModalOpen(true)}
                    title="Navrhnout úpravu"
                    className="p-1 text-[var(--fg-muted)] transition-all duration-200 hover:scale-110 hover:text-[var(--fg-primary)] active:scale-90"
                >
                    <TriangleAlert size={20} />
                </button>
            )} */}
      <button
        onClick={handleToggleFavorite}
        title={isFavorite ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
        className={`p-1 transition-all duration-300 hover:scale-110 active:scale-90 ${
          isFavorite
            ? "fill-yellow-400 text-yellow-400 star-glow"
            : "text-[var(--fg-muted)] hover:text-yellow-400"
        } ${isAnimating ? "animate-star-pop" : ""}`}
      >
        <Star size={24} className={isFavorite ? "fill-inherit" : ""} />
      </button>

      {isSuggestModalOpen && currentQuestion && (
        <SuggestEditModal
          isOpen={isSuggestModalOpen}
          onClose={() => setIsSuggestModalOpen(false)}
          question={currentQuestion}
          repositoryUrl={currentSubject?.repositoryUrl}
        />
      )}
    </div>
  );
}
