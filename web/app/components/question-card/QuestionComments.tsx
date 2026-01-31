"use client";

import { useState, useEffect, useMemo } from "react";
import { useSettingsStore, useQuizStore } from "../../lib/stores";
import { UserAvatar } from "../ui/UserAvatar";
import { Send, MessageCircle, Reply, CornerDownRight } from "lucide-react";
import type { Comment } from "../../lib/types";

interface QuestionCommentsProps {
  questionHash: string;
}

interface CommentThread extends Comment {
  replies: CommentThread[];
}

function formatCommentTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 7) {
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMinutes < 1) return "před chvílí";
    if (diffMinutes < 60)
      return `před ${Math.floor(diffMinutes)} ${Math.floor(diffMinutes) === 1 ? "minutou" : "minutami"}`;
    if (diffHours < 24)
      return `před ${Math.floor(diffHours)} ${Math.floor(diffHours) === 1 ? "hodinou" : "hodinami"}`;
    if (diffDays < 2) return "včera";
    return `před ${Math.floor(diffDays)} dny`;
  }

  return date.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function QuestionComments({ questionHash }: QuestionCommentsProps) {
  const { backendUrl, uid, username } = useSettingsStore();
  const showComments = useQuizStore((s) => s.showComments);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyToId, setReplyToId] = useState<number | null>(null);

  useEffect(() => {
    if (showComments && questionHash && backendUrl) {
      fetchComments();
    }
  }, [showComments, questionHash, backendUrl]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const baseUrl = backendUrl!.endsWith("/") ? backendUrl : `${backendUrl}/`;
      const response = await fetch(`${baseUrl}comments/${questionHash}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setLoading(false);
    }
  };

  const structuredComments = useMemo(() => {
    const commentMap: Record<number, CommentThread> = {};
    const rootComments: CommentThread[] = [];

    // First pass: create threads
    comments.forEach((c) => {
      commentMap[c.id] = { ...c, replies: [] };
    });

    // Second pass: link replies
    comments.forEach((c) => {
      if (c.parentId && commentMap[c.parentId]) {
        commentMap[c.parentId].replies.push(commentMap[c.id]);
      } else {
        rootComments.push(commentMap[c.id]);
      }
    });

    // Sort roots by newest first
    return rootComments.reverse();
  }, [comments]);

  const handleSubmit = async (text: string, parentId: number | null = null) => {
    if (!text.trim() || !backendUrl || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const baseUrl = backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`;
      const response = await fetch(`${baseUrl}comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionHash,
          uid,
          username: username || "Anonym",
          text: text.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments((prev) => [...prev, comment]);
        if (!parentId) setNewComment("");
        setReplyToId(null);
      }
    } catch (error) {
      console.error("Failed to post comment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showComments) return null;

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 mb-6 px-1">
        <MessageCircle size={18} className="text-[var(--subject-primary)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--fg-muted)]">
          Komentáře ({comments.length})
        </h3>
      </div>

      {/* Main Comment Input */}
      <CommentInput
        value={newComment}
        onChange={setNewComment}
        onSubmit={(text) => handleSubmit(text)}
        placeholder="Napište komentář..."
        isSubmitting={isSubmitting}
        username={username}
      />

      {/* Comments List */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-[var(--subject-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-[var(--fg-muted)] text-sm italic">
            Zatím žádné komentáře. Buďte první!
          </div>
        ) : (
          structuredComments.map((thread) => (
            <CommentItem
              key={thread.id}
              comment={thread}
              onReply={(text, pId) => handleSubmit(text, pId)}
              isSubmitting={isSubmitting}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              currentUserUsername={username}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  isSubmitting,
  username,
  autoFocus,
  small,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (text: string) => void;
  placeholder: string;
  isSubmitting: boolean;
  username?: string;
  autoFocus?: boolean;
  small?: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
      className={`flex gap-3 ${small ? "mb-4" : "mb-8"}`}
    >
      <UserAvatar
        name={username}
        size={small ? 24 : 32}
        className="shrink-0 mt-1"
      />
      <div className="flex-1 relative">
        <input
          type="text"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-[var(--fg-primary)]/5 border border-[var(--border-default)] text-[var(--fg-primary)] rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--subject-primary)] transition-all pr-12 ${
            small ? "py-1.5 text-xs" : "py-2.5"
          }`}
        />
        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--subject-primary)] hover:bg-[var(--subject-primary)]/10 rounded-xl transition-all disabled:opacity-30"
        >
          <Send size={small ? 14 : 18} />
        </button>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  onReply,
  isSubmitting,
  depth = 0,
  replyToId,
  setReplyToId,
  currentUserUsername,
}: {
  comment: CommentThread;
  onReply: (text: string, pId: number) => void;
  isSubmitting: boolean;
  depth?: number;
  replyToId: number | null;
  setReplyToId: (id: number | null) => void;
  currentUserUsername?: string;
}) {
  const [replyValue, setReplyValue] = useState("");

  return (
    <div
      className={`space-y-2 ${
        depth > 0
          ? "ml-4 md:ml-8 border-l-2 border-[var(--subject-primary)]/10 pl-4 md:pl-6"
          : ""
      }`}
    >
      <div className="flex gap-3 group relative">
        {depth > 0 && (
          <div className="absolute -left-4 md:-left-6 top-5 w-4 md:w-6 h-px bg-[var(--subject-primary)]/10" />
        )}
        <UserAvatar
          name={comment.user.username}
          size={depth === 0 ? 36 : 28}
          className="shrink-0 shadow-sm"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`font-bold text-[var(--fg-primary)] ${
                depth === 0 ? "text-sm" : "text-xs"
              }`}
            >
              {comment.user.username}
            </span>
            <span className="text-[10px] text-[var(--fg-muted)]">
              {formatCommentTime(comment.timestamp)}
            </span>
          </div>
          <p
            className={`${
              depth === 0 ? "text-sm" : "text-[13px]"
            } text-[var(--fg-primary)]/90 leading-relaxed bg-[var(--fg-primary)]/[0.02] p-3 rounded-2xl rounded-tl-none border border-[var(--border-default)]/50 shadow-sm`}
          >
            {comment.text}
          </p>
          <div className="flex items-center gap-4 mt-1 px-1">
            <button
              onClick={() =>
                setReplyToId(replyToId === comment.id ? null : comment.id)
              }
              className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-muted)] hover:text-[var(--subject-primary)] flex items-center gap-1 transition-colors"
            >
              <Reply size={12} />
              Odpovědět
            </button>
          </div>
        </div>
      </div>

      {replyToId === comment.id && (
        <div className="ml-10 md:ml-12">
          <CommentInput
            value={replyValue}
            onChange={setReplyValue}
            onSubmit={(text) => {
              onReply(text, comment.id);
              setReplyValue("");
            }}
            placeholder={`Odpovědět uživateli ${comment.user.username}...`}
            isSubmitting={isSubmitting}
            autoFocus
            small
            username={currentUserUsername}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="space-y-2 mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              isSubmitting={isSubmitting}
              depth={depth + 1}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              currentUserUsername={currentUserUsername}
            />
          ))}
        </div>
      )}
    </div>
  );
}
