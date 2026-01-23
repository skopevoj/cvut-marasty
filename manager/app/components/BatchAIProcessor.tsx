"use client";

import { useState, useEffect } from "react";
import { Subject } from "../types";
import { ArrowLeft, Sparkles, Check, X, Loader2 } from "lucide-react";
import { LatexRenderer } from "./LatexRenderer";

interface BatchAIProcessorProps {
  subject: Subject;
  folderPath: string;
  selectedImages: string[];
  additionalPrompt?: string;
  forcedTopics?: string[];
  onBack: () => void;
  onRefresh: () => void;
}

interface ProcessedQuestion {
  imageName: string;
  imageUrl: string;
  parsed?: {
    questionType: "multichoice" | "open";
    question: string;
    topics: string[];
    answers?: Array<{ text: string; isCorrect: boolean }>;
    originalText?: string;
  };
  error?: string;
  status: "pending" | "processing" | "done" | "error";
}

export function BatchAIProcessor({
  subject,
  folderPath,
  selectedImages,
  additionalPrompt = "",
  forcedTopics = [],
  onBack,
  onRefresh,
}: BatchAIProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [questions, setQuestions] = useState<ProcessedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    confirmed: 0,
    rejected: 0,
  });

  // Editable state for current question
  const [editingQuestion, setEditingQuestion] = useState<
    ProcessedQuestion["parsed"] | null
  >(null);

  // Update editing state when current question changes
  useEffect(() => {
    const current = questions[currentIndex];
    if (current?.parsed) {
      setEditingQuestion({ ...current.parsed });
    }
  }, [currentIndex, questions]);

  async function startBatchProcessing() {
    setProcessing(true);
    setStats({
      total: selectedImages.length,
      processed: 0,
      confirmed: 0,
      rejected: 0,
    });

    // Initialize questions
    const initialQuestions: ProcessedQuestion[] = selectedImages.map(
      (imageName) => ({
        imageName,
        imageUrl: "",
        status: "pending" as const,
      }),
    );
    setQuestions(initialQuestions);

    // Process in batches of 30
    const batchSize = 30;
    for (let i = 0; i < selectedImages.length; i += batchSize) {
      const batch = selectedImages.slice(
        i,
        Math.min(i + batchSize, selectedImages.length),
      );

      await Promise.all(
        batch.map(async (imageName, batchIndex) => {
          const globalIndex = i + batchIndex;
          await processImage(imageName, globalIndex);
        }),
      );
    }

    setProcessing(false);
  }

  async function processImage(imageName: string, index: number) {
    // Update status to processing
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: "processing" };
      return updated;
    });

    try {
      // Load image
      const imagePath = `${folderPath}/${subject.code}/unprocessed/${imageName}`;
      const imageRes = await fetch(
        `/api/fs?action=readImage&path=${encodeURIComponent(imagePath)}`,
      );
      const blob = await imageRes.blob();
      const imageUrl = URL.createObjectURL(blob);

      // Convert to base64 for AI
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      const imageData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      // Parse with AI
      const aiRes = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData,
          availableTopics: subject.topics || [],
          additionalPrompt,
        }),
      });

      if (!aiRes.ok) {
        throw new Error("AI parsing failed");
      }

      const parsed = await aiRes.json();

      // Merge forced topics with AI suggestions
      const mergedTopics = Array.from(
        new Set([...forcedTopics, ...(parsed.topics || [])]),
      );

      // Update with parsed data
      setQuestions((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          imageUrl,
          parsed: {
            ...parsed,
            topics: mergedTopics,
          },
          status: "done",
        };
        return updated;
      });

      setStats((prev) => ({ ...prev, processed: prev.processed + 1 }));
    } catch (error: any) {
      setQuestions((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          error: error.message,
          status: "error",
        };
        return updated;
      });
      setStats((prev) => ({ ...prev, processed: prev.processed + 1 }));
    }
  }

  async function saveOneQuestion(
    index: number,
    data: ProcessedQuestion["parsed"],
  ) {
    const q = questions[index];
    if (!data) return;

    const questionId = `${Date.now()}-${index}`;

    // Save question with data
    await fetch("/api/fs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveQuestion",
        folderPath,
        data: {
          subjectCode: subject.code,
          questionId,
          questionData: {
            question: data.question,
            questionType: data.questionType,
            topics: data.topics,
            answers: data.answers || [],
            originalText: data.originalText,
          },
        },
      }),
    });

    // Save image as quizImage
    const imagePath = `${folderPath}/${subject.code}/unprocessed/${q.imageName}`;
    const imageRes = await fetch(
      `/api/fs?action=readImage&path=${encodeURIComponent(imagePath)}`,
    );
    const blob = await imageRes.blob();
    const file = new File([blob], "quizImage.png", { type: "image/png" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subjectCode", subject.code);
    formData.append("questionId", questionId);
    formData.append("folderPath", folderPath);
    formData.append("imageType", "quizImage");

    await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    // Delete unprocessed image
    await fetch("/api/fs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deleteFile",
        filePath: imagePath,
      }),
    });
  }

  async function handleConfirm() {
    if (!editingQuestion) return;

    try {
      await saveOneQuestion(currentIndex, editingQuestion);
      setStats((prev) => ({ ...prev, confirmed: prev.confirmed + 1 }));
      moveToNext();
    } catch (error) {
      console.error("Error confirming question:", error);
      alert("Failed to save question");
    }
  }

  async function handleConfirmAll() {
    if (
      !confirm(
        `Are you sure you want to confirm all remaining ${questions.length - currentIndex} questions?`,
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      for (let i = currentIndex; i < questions.length; i++) {
        const q = questions[i];
        if (q.status !== "done") continue;

        // For current index use the edited question, otherwise use parsed data
        const dataToSave = i === currentIndex ? editingQuestion : q.parsed;
        if (!dataToSave) continue;

        await saveOneQuestion(i, dataToSave);
        setStats((prev) => ({ ...prev, confirmed: prev.confirmed + 1 }));
      }
      onRefresh();
      onBack();
    } catch (error) {
      console.error("Error confirming all questions:", error);
      alert("Failed to save some questions");
    } finally {
      setProcessing(false);
    }
  }

  function handleReject() {
    setStats((prev) => ({ ...prev, rejected: prev.rejected + 1 }));
    moveToNext();
  }

  function moveToNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onRefresh();
      onBack();
    }
  }

  const current = questions[currentIndex];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/30 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold">Batch AI Processing</h2>
              <p className="text-sm text-muted-foreground">
                {stats.processed}/{stats.total} processed • {stats.confirmed}{" "}
                confirmed • {stats.rejected} rejected
              </p>
            </div>
          </div>

          {!processing && questions.length === 0 && (
            <button
              onClick={startBatchProcessing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 glow-accent"
            >
              <Sparkles className="w-4 h-4" />
              Start Processing
            </button>
          )}

          {!processing &&
            questions.length > 0 &&
            stats.processed >= stats.total && (
              <button
                onClick={handleConfirmAll}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 glow-accent"
              >
                <Check className="w-4 h-4" />
                Confirm All Remaining
              </button>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          {processing &&
            questions.length > 0 &&
            stats.processed < stats.total && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">
                  Processing with AI...
                </p>
                <p className="text-muted-foreground">
                  {stats.processed}/{stats.total} questions processed
                </p>
                <div className="mt-4 max-w-md mx-auto">
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${(stats.processed / stats.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

          {processing &&
            questions.length > 0 &&
            stats.processed >= stats.total && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">
                  Saving all questions...
                </p>
                <p className="text-muted-foreground">
                  Please wait while we process the remaining questions.
                </p>
              </div>
            )}

          {!processing && questions.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Ready to Process</h3>
              <p className="text-muted-foreground">
                Click "Start Processing" to parse all unprocessed images with
                AI.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {subject.unprocessedImages?.length || 0} images will be
                processed
              </p>
            </div>
          )}

          {!processing &&
            questions.length > 0 &&
            stats.processed >= stats.total &&
            current && (
              <div className="space-y-6">
                {/* Progress */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Question {currentIndex + 1} of {questions.length}
                  </p>
                  <div className="max-w-md mx-auto h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${((currentIndex + 1) / questions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {current.status === "error" ? (
                  <div className="p-6 bg-destructive/10 border border-destructive rounded-xl text-center">
                    <X className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <p className="text-destructive font-semibold">
                      Failed to process this image
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {current.error}
                    </p>
                    <button
                      onClick={handleReject}
                      className="mt-4 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-all"
                    >
                      Skip
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Image */}
                    {current.imageUrl && (
                      <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <img
                          src={current.imageUrl}
                          alt={current.imageName}
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    {/* Parsed Data */}
                    {editingQuestion && (
                      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Question Type
                          </label>
                          <select
                            value={editingQuestion.questionType}
                            onChange={(e) =>
                              setEditingQuestion({
                                ...editingQuestion,
                                questionType: e.target.value as
                                  | "multichoice"
                                  | "open",
                              })
                            }
                            className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <option value="multichoice">Multiple Choice</option>
                            <option value="open">Open</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Topics
                          </label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {subject.topics?.map((topic) => (
                              <button
                                key={topic.id}
                                type="button"
                                onClick={() => {
                                  const isSelected =
                                    editingQuestion.topics.includes(topic.id);
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    topics: isSelected
                                      ? editingQuestion.topics.filter(
                                          (t) => t !== topic.id,
                                        )
                                      : [...editingQuestion.topics, topic.id],
                                  });
                                }}
                                className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                                  editingQuestion.topics.includes(topic.id)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-foreground border-input hover:bg-accent"
                                }`}
                              >
                                {topic.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Question
                          </label>
                          <textarea
                            value={editingQuestion.question}
                            onChange={(e) =>
                              setEditingQuestion({
                                ...editingQuestion,
                                question: e.target.value,
                              })
                            }
                            className="w-full mt-1 px-4 py-3 bg-background border border-input rounded-lg h-32 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            placeholder="Question text (LaTeX supported)"
                          />
                          {editingQuestion.question && (
                            <div className="mt-2 p-3 bg-background/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">
                                Preview:
                              </p>
                              <LatexRenderer
                                content={editingQuestion.question}
                              />
                            </div>
                          )}
                        </div>

                        {editingQuestion.answers &&
                          editingQuestion.answers.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">
                                Answers
                              </label>
                              <div className="mt-2 space-y-2">
                                {editingQuestion.answers.map((answer, i) => (
                                  <div
                                    key={i}
                                    className="p-3 bg-background rounded-lg space-y-2"
                                  >
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        checked={answer.isCorrect}
                                        onChange={(e) => {
                                          const newAnswers = [
                                            ...editingQuestion.answers!,
                                          ];
                                          newAnswers[i] = {
                                            ...newAnswers[i],
                                            isCorrect: e.target.checked,
                                          };
                                          setEditingQuestion({
                                            ...editingQuestion,
                                            answers: newAnswers,
                                          });
                                        }}
                                        className="mt-1 h-4 w-4 rounded border-input accent-primary"
                                      />
                                      <div className="flex-1">
                                        <textarea
                                          value={answer.text}
                                          onChange={(e) => {
                                            const newAnswers = [
                                              ...editingQuestion.answers!,
                                            ];
                                            newAnswers[i] = {
                                              ...newAnswers[i],
                                              text: e.target.value,
                                            };
                                            setEditingQuestion({
                                              ...editingQuestion,
                                              answers: newAnswers,
                                            });
                                          }}
                                          className="w-full px-3 py-2 bg-card border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                          rows={2}
                                        />
                                        {answer.text && (
                                          <div className="mt-1 p-2 bg-card/50 rounded">
                                            <LatexRenderer
                                              content={answer.text}
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => {
                                          const newAnswers =
                                            editingQuestion.answers!.filter(
                                              (_, idx) => idx !== i,
                                            );
                                          setEditingQuestion({
                                            ...editingQuestion,
                                            answers: newAnswers,
                                          });
                                        }}
                                        className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    answers: [
                                      ...(editingQuestion.answers || []),
                                      { text: "", isCorrect: false },
                                    ],
                                  });
                                }}
                                className="mt-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                              >
                                + Add Answer
                              </button>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleReject}
                        className="flex-1 px-6 py-3 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Reject (Keep Unprocessed)
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 glow-accent"
                      >
                        <Check className="w-5 h-5" />
                        Confirm & Save
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
