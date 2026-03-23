"use client";

import { useState, useEffect } from "react";
import { Subject } from "../types";
import {
  ArrowLeft,
  Sparkles,
  Check,
  X,
  Loader2,
  FileText,
  Plus,
} from "lucide-react";
import { LatexRenderer } from "./LatexRenderer";

interface TextImportProcessorProps {
  subject: Subject;
  folderPath: string;
  onBack: () => void;
  onRefresh: () => void;
}

interface ParsedQuestion {
  questionType: "multichoice" | "open" | "yesno";
  question: string;
  topics: string[];
  answers?: Array<{ text: string; isCorrect: boolean }>;
  originalText?: string;
}

export function TextImportProcessor({
  subject,
  folderPath,
  onBack,
  onRefresh,
}: TextImportProcessorProps) {
  const [inputText, setInputText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    rejected: 0,
  });

  const [editingQuestion, setEditingQuestion] = useState<ParsedQuestion | null>(
    null,
  );

  useEffect(() => {
    const current = questions[currentIndex];
    if (current) {
      setEditingQuestion({ ...current });
    }
  }, [currentIndex, questions]);

  async function handleParse() {
    if (!inputText.trim()) return;

    setParsing(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/parse-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          availableTopics: subject.topics || [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse text");
      }

      const data = await res.json();
      const parsed: ParsedQuestion[] = data.questions || [];

      if (parsed.length === 0) {
        setError("AI could not identify any questions in the text.");
        return;
      }

      setQuestions(parsed);
      setStats({ total: parsed.length, confirmed: 0, rejected: 0 });
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err.message || "Failed to parse questions");
    } finally {
      setParsing(false);
    }
  }

  async function saveQuestion(data: ParsedQuestion) {
    const questionId = `${Date.now()}-${currentIndex}`;

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
  }

  async function handleConfirm() {
    if (!editingQuestion) return;

    try {
      await saveQuestion(editingQuestion);
      setStats((prev) => ({ ...prev, confirmed: prev.confirmed + 1 }));
      moveToNext();
    } catch (err) {
      console.error("Error confirming question:", err);
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

    setSaving(true);
    try {
      for (let i = currentIndex; i < questions.length; i++) {
        const dataToSave = i === currentIndex ? editingQuestion : questions[i];
        if (!dataToSave) continue;

        const questionId = `${Date.now()}-${i}`;
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
                question: dataToSave.question,
                questionType: dataToSave.questionType,
                topics: dataToSave.topics,
                answers: dataToSave.answers || [],
                originalText: dataToSave.originalText,
              },
            },
          }),
        });
        setStats((prev) => ({ ...prev, confirmed: prev.confirmed + 1 }));
      }
      onRefresh();
      onBack();
    } catch (err) {
      console.error("Error confirming all questions:", err);
      alert("Failed to save some questions");
    } finally {
      setSaving(false);
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
  const showInputPhase = questions.length === 0;

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
              <h2 className="text-lg font-semibold">Import from Text</h2>
              <p className="text-sm text-muted-foreground">
                {showInputPhase
                  ? "Paste text containing questions for AI to parse"
                  : `${stats.confirmed} confirmed \u2022 ${stats.rejected} rejected \u2022 ${stats.total} total`}
              </p>
            </div>
          </div>

          {!showInputPhase && !saving && (
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
          {/* Input Phase */}
          {showInputPhase && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Paste Questions</h3>
                    <p className="text-sm text-muted-foreground">
                      Paste text containing one or more questions. AI will
                      automatically detect and separate them.
                    </p>
                  </div>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Paste your questions here...\n\nExample:\n1) Question text\nPLATÍ:\n- correct answer 1\n- correct answer 2\nNEPLATÍ:\n- incorrect answer 1\n\n2) Another question...\n\nAny format works - AI will figure it out.`}
                  className="w-full h-80 px-4 py-3 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono"
                />

                {error && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleParse}
                    disabled={parsing || !inputText.trim()}
                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 glow-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {parsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Parse Questions
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Saving all */}
          {saving && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">
                Saving all questions...
              </p>
            </div>
          )}

          {/* Review Phase */}
          {!showInputPhase && !saving && current && (
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

              {/* Original Text */}
              {current.originalText && (
                <div className="bg-card/50 border border-border rounded-xl p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Original Text
                  </p>
                  <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-mono">
                    {current.originalText}
                  </pre>
                </div>
              )}

              {/* Editable Parsed Data */}
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
                            | "open"
                            | "yesno",
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="multichoice">Multiple Choice</option>
                      <option value="open">Open</option>
                      <option value="yesno">Yes / No (Ano / Ne)</option>
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
                        <LatexRenderer content={editingQuestion.question} />
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
                                      <LatexRenderer content={answer.text} />
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
                          className="mt-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Answer
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
                  Reject
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 glow-accent"
                >
                  <Check className="w-5 h-5" />
                  Confirm & Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
