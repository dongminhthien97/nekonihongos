// src/pages/MiniTestModal.tsx
import { useState, useEffect, useRef, type JSX } from "react";
import {
  X,
  Send,
  Clock,
  Sparkles,
  HelpCircle,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";

// --- INTERFACES ---
interface Question {
  id: number;
  lesson_id: number;
  example: string;
  question_type: "fill_blank" | "multiple_choice" | "reorder" | "rearrange";
  raw_text: string;
  points: number;
  options?: string[];
}

interface MiniTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: number;
  lessonTitle: string;
  userId: number;
  onSuccess?: (data: {
    lessonId: number;
    lessonTitle: string;
    timeSpent: number;
    questionCount: number;
  }) => void;
  onError?: (
    message: string,
    type: "validation" | "server" | "timeout",
  ) => void;
}

// --- DRAG & DROP TYPES ---
interface DragItem {
  questionId: number;
  index: number;
}

// --- HELPER: Parse Furigana ---
const renderWithFurigana = (text: string) => {
  if (!text) return null;

  if (text.includes("<")) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }

  const furiganaRegex =
    /([\u4e00-\u9faf\u3005\u30a0-\u30ff\u3040-\u309f]+)[(（]([\u3040-\u309f\u30a0-\u30ff\s]+)[)）]/g;

  const parts: JSX.Element[] = [];
  let lastIndex = 0;

  let matchResults;
  while ((matchResults = furiganaRegex.exec(text)) !== null) {
    if (matchResults.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex, matchResults.index)}
        </span>,
      );
    }

    const kanji = matchResults[1];
    const reading = matchResults[2];
    parts.push(
      <ruby key={`ruby-${matchResults.index}`}>
        {kanji}
        <rt>{reading}</rt>
      </ruby>,
    );

    lastIndex = matchResults.index + matchResults[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>,
    );
  }

  if (parts.length === 0) {
    return <span>{text}</span>;
  }

  return <>{parts}</>;
};

// --- HELPER: Parse Multiple Choice Options ---
const parseMultipleChoiceOptions = (text: string) => {
  const bracketRegex = /（(.*?)）|［(.*?)］/g;
  const matches = [];
  let match;

  while ((match = bracketRegex.exec(text)) !== null) {
    const content = match[1] || match[2];
    if (content) {
      const options = content
        .split(/[、,]/)
        .map((opt) => opt.trim())
        .filter(Boolean);
      if (options.length >= 2) {
        matches.push({
          fullMatch: match[0],
          options: options,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }
  }

  return matches;
};

export function MiniTestModal({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  userId,
  onSuccess,
  onError,
}: MiniTestModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<
    Record<number, Record<number, string>>
  >({});
  const [rearrangeItems, setRearrangeItems] = useState<
    Record<number, string[]>
  >({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [emptyQuestions, setEmptyQuestions] = useState<number[]>([]);

  const [draggingItem, setDraggingItem] = useState<DragItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [draftAnswers, setDraftAnswers] = useState<
    Record<number, Record<number, string>>
  >({});

  // Reset states khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setQuestions([]);
      setLoading(true);
      setSubmitting(false);
      setAnswers({});
      setRearrangeItems({});
      setTimeLeft(600);
      setTestSubmitted(false);
      setIsClosingModal(false);
      setDraggingItem(null);
      setShowValidationModal(false);
      setValidationMessage("");
      setEmptyQuestions([]);
      setDraftAnswers({});
    }
  }, [isOpen]);

  // --- FETCH DATA ---
  useEffect(() => {
    if (!isOpen || testSubmitted) return;

    if (!lessonId || lessonId <= 0 || !userId || userId <= 0) {
      if (onError) {
        onError("ID bài học hoặc người dùng không hợp lệ", "validation");
      }
      return;
    }

    const initData = async () => {
      try {
        setLoading(true);

        try {
          await api.get(`/grammar-tests/check`, {
            params: { lessonId },
          });
        } catch (checkErr) {}

        const qRes = await api.get(
          `/grammar/mini-test/questions?lesson_id=${lessonId}`,
        );

        if (qRes.data.success && Array.isArray(qRes.data.data)) {
          const formatted = qRes.data.data.map((item: any, index: number) => ({
            id: item.id || index + 1,
            lesson_id: item.lessonId || lessonId,
            example: item.example || "",
            question_type: item.type || "fill_blank",
            raw_text: (item.text || "").replace(item.example || "", "").trim(),
            points: item.points || 10,
            options: item.options || null,
          }));
          setQuestions(formatted);

          const initialRearrange: Record<number, string[]> = {};
          formatted.forEach((q: Question) => {
            if (
              q.question_type === "rearrange" ||
              q.question_type === "reorder"
            ) {
              const lines = q.raw_text.split("\n");
              for (const line of lines) {
                if (
                  line.includes("→") ||
                  line.includes("／") ||
                  line.includes("/")
                ) {
                  const questionPart = line.split("→")[0] || line;
                  const words = questionPart
                    .replace("例：", "")
                    .replace("例", "")
                    .trim()
                    .split(/[／\/]/)
                    .map((w) => w.trim())
                    .filter((w) => w && !w.includes("例") && !w.includes("→"));

                  if (words.length > 0) {
                    initialRearrange[q.id] = words;
                    break;
                  }
                }
              }
            }
          });

          setRearrangeItems(initialRearrange);
        } else {
          if (onError) {
            onError(
              "Không thể tải câu hỏi. Dữ liệu không đúng định dạng.",
              "server",
            );
          }
        }
      } catch (err: any) {
        if (onError) {
          onError("Không thể tải câu hỏi. Vui lòng thử lại sau.", "server");
        }
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [isOpen, lessonId, userId, testSubmitted, onError]);

  // --- TIMER ---
  useEffect(() => {
    if (
      !isOpen ||
      timeLeft <= 0 ||
      testSubmitted ||
      isClosingModal ||
      showValidationModal
    ) {
      return;
    }

    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isOpen, testSubmitted, isClosingModal, showValidationModal]);

  useEffect(() => {
    if (
      timeLeft === 0 &&
      isOpen &&
      !testSubmitted &&
      !isClosingModal &&
      !showValidationModal
    ) {
      handleAutoSubmit();
    }
  }, [timeLeft, isOpen, testSubmitted, isClosingModal, showValidationModal]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- VALIDATION ---
  const validateAnswers = () => {
    const emptyAnswers: number[] = [];

    questions.forEach((q) => {
      if (q.question_type === "rearrange" || q.question_type === "reorder") {
        return;
      }

      const qAnsObj = answers[q.id] || {};

      if (q.question_type === "multiple_choice") {
        const lines = q.raw_text.split("\n").filter((l) => l.trim());

        lines.forEach((line, lineIdx) => {
          const matches = parseMultipleChoiceOptions(line);

          matches.forEach((_mcMatch, matchIdx) => {
            const uniqueIndex = parseInt(`${q.id}${lineIdx}${matchIdx}`);
            if (!qAnsObj[uniqueIndex] || qAnsObj[uniqueIndex].trim() === "") {
              if (!emptyAnswers.includes(q.id)) {
                emptyAnswers.push(q.id);
              }
            }
          });
        });
      } else if (q.question_type === "fill_blank") {
        const blankRegex = /（\s*）|＿{2,}|_{2,}|【\s*】|\[ \]|___+/g;
        const lines = q.raw_text.split("\n").filter((l) => l.trim());

        lines.forEach((line, lineIdx) => {
          const lineMatches = line.match(blankRegex) || [];

          lineMatches.forEach((_match, matchIdx) => {
            const uniqueIndex = parseInt(`${q.id}${lineIdx}${matchIdx}`);
            if (!qAnsObj[uniqueIndex] || qAnsObj[uniqueIndex].trim() === "") {
              if (!emptyAnswers.includes(q.id)) {
                emptyAnswers.push(q.id);
              }
            }
          });
        });
      }
    });

    return emptyAnswers;
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (
    e: React.DragEvent,
    questionId: number,
    index: number,
  ) => {
    setDraggingItem({ questionId, index });
    e.dataTransfer.setData("text/plain", `${questionId}-${index}`);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    questionId: number,
    targetIndex: number,
  ) => {
    e.preventDefault();
    if (!draggingItem || draggingItem.questionId !== questionId) return;

    const sourceIndex = draggingItem.index;
    if (sourceIndex === targetIndex) return;

    const newItems = [...(rearrangeItems[questionId] || [])];
    const [movedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    setRearrangeItems((prev) => ({
      ...prev,
      [questionId]: newItems,
    }));

    setAnswers((prev) => ({
      ...prev,
      [questionId]: { 0: newItems.join(" ") },
    }));
  };

  // --- HANDLERS ---
  const handleAnswerChange = (
    qId: number,
    index: number,
    value: string,
  ) => {
    setAnswers((prev) => {
      const currentQuestionAnswers = { ...(prev[qId] || {}) };
      return {
        ...prev,
        [qId]: {
          ...currentQuestionAnswers,
          [index]: value,
        },
      };
    });
  };

  const handleAutoSubmit = async () => {
    await handleSubmitInternal(true);
  };

  const handleSubmit = async () => {
    await handleSubmitInternal(false);
  };

  const handleSubmitInternal = async (isAutoSubmit: boolean) => {
    try {
      setSubmitting(true);

      if (!isAutoSubmit) {
        const emptyQuestions = validateAnswers();
        if (emptyQuestions.length > 0) {
          const questionNumbers = emptyQuestions.map((id) => {
            const index = questions.findIndex((q) => q.id === id);
            return index !== -1 ? index + 1 : "Unknown";
          });

          setDraftAnswers({ ...answers });
          setEmptyQuestions(emptyQuestions);
          setValidationMessage(
            `Vui lòng điền đầy đủ các ô trống trong nhóm câu hỏi: ${questionNumbers.join(", ")}`,
          );
          setShowValidationModal(true);

          setSubmitting(false);
          return;
        }
      }

      const formattedAnswers: Record<string, string[]> = {};
      questions.forEach((q) => {
        if (q.question_type === "rearrange" || q.question_type === "reorder") {
          const items = rearrangeItems[q.id] || [];
          formattedAnswers[q.id.toString()] = [items.join(" ")];
        } else {
          const qAnsObj = answers[q.id] || {};
          const sortedIndices = Object.keys(qAnsObj)
            .map(Number)
            .sort((a, b) => a - b);
          const qAnsArr = sortedIndices.map((k) => qAnsObj[k]);
          formattedAnswers[q.id.toString()] = qAnsArr;
        }
      });

      const payload = {
        userId: Number(userId),
        lessonId: Number(lessonId),
        answers: formattedAnswers,
        timeSpent: isAutoSubmit ? 600 : Math.max(0, 600 - timeLeft),
        submittedAt: new Date().toISOString(),
      };

      const res = await api.post("/grammar-tests/submit", payload, {
        timeout: 10000,
      });

      if (res.data.success) {
        setTestSubmitted(true);
        if (onSuccess) {
          onSuccess({
            lessonId,
            lessonTitle,
            timeSpent: isAutoSubmit ? 600 : Math.max(0, 600 - timeLeft),
            questionCount: questions.length,
          });
        }
        setIsClosingModal(true);
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        if (
          res.data.message?.includes("đã nộp bài") ||
          res.data.message?.includes("nộp bài này rồi")
        ) {
          setTestSubmitted(true);
          if (onSuccess) {
            onSuccess({
              lessonId,
              lessonTitle,
              timeSpent: isAutoSubmit ? 600 : Math.max(0, 600 - timeLeft),
              questionCount: questions.length,
            });
          }
          setIsClosingModal(true);
          setTimeout(() => {
            onClose();
          }, 300);
        } else {
          if (onError) {
            onError(res.data.message || "Nộp bài không thành công!", "server");
          }
        }
      }
    } catch (e: any) {
      let errorMsg = "Có lỗi xảy ra khi nộp bài!";
      let errorTyp: "validation" | "server" | "timeout" = "server";

      if (e.code === "ECONNABORTED" || e.message.includes("timeout")) {
        errorMsg = "Request timeout. Vui lòng thử lại.";
        errorTyp = "timeout";
      } else if (e.code === "ERR_NETWORK" || e.message.includes("Network")) {
        errorMsg = "Mất kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.";
        errorTyp = "server";
      } else if (e.response?.status === 400) {
        const errorData = e.response.data;
        if (
          errorData.message?.includes("đã nộp bài") ||
          errorData.message?.includes("nộp bài này rồi")
        ) {
          setTestSubmitted(true);
          if (onSuccess) {
            onSuccess({
              lessonId,
              lessonTitle,
              timeSpent: isAutoSubmit ? 600 : Math.max(0, 600 - timeLeft),
              questionCount: questions.length,
            });
          }
          setIsClosingModal(true);
          setTimeout(() => {
            onClose();
          }, 300);
          return;
        } else {
          errorMsg =
            errorData.message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
          errorTyp = "validation";
        }
      } else if (e.response?.status === 401) {
        errorMsg = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        errorTyp = "server";
      } else if (e.response?.status === 500) {
        errorMsg = "Lỗi máy chủ. Vui lòng thử lại sau.";
        errorTyp = "server";
      }

      if (onError) {
        onError(errorMsg, errorTyp);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmValidation = () => {
    setShowValidationModal(false);
    setAnswers(draftAnswers);

    setTimeout(() => {
      const firstEmptyQuestion = document.querySelector(
        `[data-question-id="${emptyQuestions[0]}"]`,
      );
      if (firstEmptyQuestion) {
        firstEmptyQuestion.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        firstEmptyQuestion.classList.add("highlight-empty");
        setTimeout(() => {
          firstEmptyQuestion.classList.remove("highlight-empty");
        }, 3000);
      }
    }, 100);
  };

  // --- RENDERERS ---
  const renderInteractiveContent = (question: Question) => {
    if (
      question.question_type === "rearrange" ||
      question.question_type === "reorder"
    ) {
      const items = rearrangeItems[question.id] || [];

      if (items.length === 0) {
        return (
          <div className="question-content-container">
            <div className="fill-blank-line">
              {renderWithFurigana(question.raw_text)}
            </div>
          </div>
        );
      }

      return (
        <div className="rearrange-container">
          <div className="rearrange-instruction">
            <p>Kéo và thả các từ dưới đây để sắp xếp thành câu đúng:</p>
          </div>
          <div className="rearrange-words">
            {items.map((word, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, question.id, index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, question.id, index)}
                className={`rearrange-word ${draggingItem?.questionId === question.id && draggingItem.index === index ? "dragging" : ""}`}
              >
                <GripVertical className="drag-handle" />
                <span>{renderWithFurigana(word)}</span>
              </div>
            ))}
          </div>
          <div className="rearrange-preview">
            <p className="preview-label">Câu đã sắp xếp:</p>
            <div className="preview-text">
              {items.map((word, idx) => (
                <span key={idx} className="preview-word">
                  {renderWithFurigana(word)}
                  {idx < items.length - 1 && " "}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const lines = question.raw_text.split("\n").filter((l) => l.trim());

    return (
      <div className="question-content-container">
        {lines.map((line, lineIdx) => {
          if (question.question_type === "fill_blank") {
            const blankRegex = /（\s*）|＿{2,}|_{2,}|【\s*】|\[ \]|___+/g;

            const parts: Array<
              | { type: "text"; content: string }
              | { type: "input"; index: number; content: string }
            > = [];

            let match;
            let lastIndex = 0;
            let blankCount = 0;

            blankRegex.lastIndex = 0;

            while ((match = blankRegex.exec(line)) !== null) {
              if (match.index > lastIndex) {
                parts.push({
                  type: "text",
                  content: line.substring(lastIndex, match.index),
                });
              }

              const uniqueIndex = parseInt(`${question.id}${lineIdx}${blankCount}`);

              parts.push({
                type: "input",
                index: uniqueIndex,
                content: match[0],
              });
              blankCount++;

              lastIndex = match.index + match[0].length;
            }

            if (lastIndex < line.length) {
              parts.push({
                type: "text",
                content: line.substring(lastIndex),
              });
            }

            if (!parts.some((part) => part.type === "input")) {
              const fallbackKey = parseInt(`${question.id}${lineIdx}0`);
              return (
                <div
                  key={lineIdx}
                  className="fill-blank-line fill-blank-fallback"
                >
                  <div>{renderWithFurigana(line)}</div>
                  <textarea
                    value={answers[question.id]?.[fallbackKey] || ""}
                    onChange={(e) =>
                      handleAnswerChange(
                        question.id,
                        fallbackKey,
                        e.target.value,
                      )
                    }
                    className="blank-input-field blank-textarea-field"
                    placeholder="Nhập câu trả lời..."
                    rows={2}
                  />
                </div>
              );
            }

            return (
              <div key={lineIdx} className="fill-blank-line">
                {parts.map((part, partIdx) => {
                  if (part.type === "text") {
                    return (
                      <span key={`text-${lineIdx}-${partIdx}`}>
                        {renderWithFurigana(part.content)}
                      </span>
                    );
                  } else {
                    const inputIndex = part.index;
                    const currentValue =
                      answers[question.id]?.[inputIndex] || "";

                    return (
                      <input
                        key={`input-${question.id}-${lineIdx}-${partIdx}`}
                        type="text"
                        value={currentValue}
                        onChange={(e) => {
                          handleAnswerChange(
                            question.id,
                            inputIndex,
                            e.target.value,
                          );
                        }}
                        className="blank-input-field"
                        placeholder="Điền..."
                        autoComplete="off"
                      />
                    );
                  }
                })}
              </div>
            );
          }

          if (question.question_type === "multiple_choice") {
            const matches = parseMultipleChoiceOptions(line);

            if (matches.length === 0) {
              return (
                <div key={lineIdx} className="multiple-choice-line">
                  {renderWithFurigana(line)}
                </div>
              );
            }

            let lastIndex = 0;
            const elements: JSX.Element[] = [];
            let choiceIndex = 0;

            matches.forEach((match, matchIndex) => {
              if (match.startIndex > lastIndex) {
                const textBefore = line.substring(lastIndex, match.startIndex);
                elements.push(
                  <span key={`text-${lineIdx}-${matchIndex}`}>
                    {renderWithFurigana(textBefore)}
                  </span>,
                );
              }

              const uniqueChoiceIndex = parseInt(`${question.id}${lineIdx}${choiceIndex}`);
              const currentVal = answers[question.id]?.[uniqueChoiceIndex];

              elements.push(
                <span
                  key={`choice-${lineIdx}-${choiceIndex}`}
                  className="choice-container"
                >
                  {match.options.map((opt, optIdx) => {
                    const isSelected = currentVal === opt;
                    return (
                      <button
                        key={`opt-${lineIdx}-${choiceIndex}-${optIdx}`}
                        type="button"
                        onClick={() => {
                          handleAnswerChange(
                            question.id,
                            uniqueChoiceIndex,
                            opt,
                          );
                        }}
                        className={`choice-button ${isSelected ? "choice-button-selected" : "choice-button-default"}`}
                      >
                        {renderWithFurigana(opt)}
                      </button>
                    );
                  })}
                </span>,
              );

              choiceIndex++;
              lastIndex = match.endIndex;
            });

            if (lastIndex < line.length) {
              const textAfter = line.substring(lastIndex);
              elements.push(
                <span key={`text-after-${lineIdx}`}>
                  {renderWithFurigana(textAfter)}
                </span>,
              );
            }

            return (
              <div key={lineIdx} className="multiple-choice-line">
                {elements}
              </div>
            );
          }

          return (
            <div key={lineIdx} className="fill-blank-line">
              {renderWithFurigana(line)}
            </div>
          );
        })}
      </div>
    );
  };

  // --- RENDER LOGIC ---
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className={`test-modal-container ${isClosingModal ? "fade-out" : ""}`}
      >
        <div className="test-modal">
          {/* HEADER */}
          <div className="modal-header">
            <div className="header-left">
              <div className="header-icon">
                <Sparkles className="sparkles-icon" />
              </div>
              <div>
                <h2 className="modal-title">Mini Test</h2>
                <p className="lesson-title">
                  {lessonTitle}{" "}
                  <span className="lesson-id-badge">ID: {lessonId}</span>
                </p>
              </div>
            </div>

            <div className="header-right">
              <div
                className={`timer-display ${timeLeft < 60 ? "timer-warning" : ""} ${timeLeft < 300 ? "timer-low" : ""}`}
              >
                <Clock className="timer-icon" />
                <span className="timer-value">{formatTime(timeLeft)}</span>
              </div>
              <button onClick={onClose} className="close-modal-button">
                <X className="close-icon" />
              </button>
            </div>
          </div>

          {/* BODY (Scrollable) */}
          <div className="modal-body" ref={scrollRef}>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải câu hỏi...</p>
                <p className="debug-info">
                  Lesson ID: {lessonId} | User ID: {userId}
                </p>
              </div>
            ) : (
              <div className="questions-container">
                {questions.length === 0 ? (
                  <div className="no-questions-message">
                    <p>Không tìm thấy câu hỏi cho bài học này.</p>
                    <div className="debug-info">
                      <p>Lesson ID: {lessonId}</p>
                      <p>User ID: {userId}</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="close-no-questions-button"
                    >
                      Đóng
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="questions-stats">
                      <span className="stat-badge">
                        Tổng: {questions.length} nhóm câu
                      </span>
                      <span className="stat-badge">
                        Thời gian: {formatTime(timeLeft)}
                      </span>
                      <span className="stat-badge">Lesson ID: {lessonId}</span>
                    </div>
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="question-card"
                        data-question-id={q.id}
                      >
                        <div className="question-badge">Nhóm câu {idx + 1}</div>

                        <div className="question-content">
                          <div className="instruction-hint">
                            <HelpCircle className="hint-icon" />
                            <div>
                              <p className="hint-title">Hướng dẫn</p>
                              <p>
                                {q.question_type === "fill_blank"
                                  ? "Điền từ thích hợp vào ô trống."
                                  : q.question_type === "multiple_choice"
                                    ? "Chọn đáp án đúng trong các ngoặc."
                                    : q.question_type === "rearrange" ||
                                        q.question_type === "reorder"
                                      ? "Kéo thả các từ để sắp xếp thành câu đúng."
                                      : "Sắp xếp lại các từ/cụm từ."}
                              </p>
                              <p className="hint-points">
                                (Tổng cộng: {q.points} điểm)
                              </p>
                            </div>
                          </div>

                          {q.example && (
                            <div className="example-section">
                              <p className="example-label">Ví dụ (Rei)</p>
                              <div className="example-content">
                                {q.example}
                              </div>
                            </div>
                          )}

                          <div className="main-question-content">
                            {renderInteractiveContent(q)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <div className="submit-debug-info">
              <span>
                Debug: LessonID={lessonId} | UserID={userId} | Time=
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || timeLeft <= 0 || questions.length === 0}
              className={`submit-button ${submitting ? "submitting" : ""}`}
            >
              {submitting ? (
                <div className="submit-spinner" />
              ) : timeLeft <= 0 ? (
                "Hết giờ"
              ) : (
                <>
                  <span>Nộp bài</span>
                  <Send className="submit-icon" />
                </>
              )}
            </button>
          </div>
        </div>

        <style>{`
          .test-modal-container {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            padding: 1rem;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Arial, sans-serif;
            animation: fadeIn 0.3s ease-out;
          }
          
          .fade-out {
            animation: fadeOut 0.3s ease-out forwards;
          }
          
          @keyframes fadeIn {
            0% {
              opacity: 0;
              transform: scale(0.95);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes fadeOut {
            0% {
              opacity: 1;
              transform: scale(1);
            }
            100% {
              opacity: 0;
              transform: scale(0.95);
            }
          }
          
          .test-modal {
            pointer-events: auto;
            background: #FDFCFE;
            width: 100%;
            max-width: 96rem;
            height: 90vh;
            border-radius: 32px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.5);
            animation: slideInUp 0.4s ease-out;
          }
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .modal-header {
            flex: none;
            padding-left: 2rem;
            padding-right: 2rem;
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
            background: white;
            border-bottom: 1px solid #f3f4f6;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 10;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          
          .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          
          .header-icon {
            background: #f3e8ff;
            padding: 0.75rem;
            border-radius: 1rem;
          }
          
          .sparkles-icon {
            color: #7c3aed;
            width: 1.5rem;
            height: 1.5rem;
          }
          
          .modal-title {
            font-size: 1.5rem;
            font-weight: 900;
            color: #1f2937;
            letter-spacing: -0.025em;
          }
          
          .lesson-title {
            color: #6b7280;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .lesson-id-badge {
            font-size: 0.75rem;
            background: #e5e7eb;
            padding: 0.125rem 0.5rem;
            border-radius: 0.375rem;
            color: #6b7280;
            font-family: monospace;
          }
          
          .header-right {
            display: flex;
            align-items: center;
            gap: 1.5rem;
          }
          
          .timer-display {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding-left: 1.25rem;
            padding-right: 1.25rem;
            padding-top: 0.625rem;
            padding-bottom: 0.625rem;
            border-radius: 9999px;
            font-weight: bold;
            font-size: 1.125rem;
            transition: all 0.2s;
            background: #f3f4f6;
            color: #374151;
          }
          
          .timer-low {
            background: #fef3c7;
            color: #d97706;
            animation: pulse 2s infinite;
          }
          
          .timer-warning {
            background: #fef2f2;
            color: #dc2626;
            animation: pulse 1s infinite;
          }
          
          .timer-icon {
            width: 1.25rem;
            height: 1.25rem;
          }
          
          .timer-value {
            font-variant-numeric: tabular-nums;
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          .close-modal-button {
            padding: 0.75rem;
            border-radius: 9999px;
            transition: background-color 0.2s;
            color: #9ca3af;
            background: none;
            border: none;
            cursor: pointer;
          }
          
          .close-modal-button:hover {
            background: #f3f4f6;
            color: #4b5563;
          }
          
          .close-icon {
            width: 1.75rem;
            height: 1.75rem;
          }
          
          .modal-body {
            flex: 1;
            overflow-y: auto;
            background: rgba(249, 250, 251, 0.5);
            padding: 1.5rem;
          }
          
          @media (min-width: 768px) {
            .modal-body {
              padding: 2.5rem;
            }
          }
          
          .loading-container {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            gap: 1rem;
          }
          
          .loading-spinner {
            animation: spin 1s linear infinite;
            width: 2.5rem;
            height: 2.5rem;
            border: 4px solid #7c3aed;
            border-top-color: transparent;
            border-radius: 9999px;
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          
          .debug-info {
            font-size: 0.75rem;
            color: #6b7280;
            background: #f3f4f6;
            padding: 0.5rem;
            border-radius: 0.375rem;
            font-family: monospace;
            margin-top: 0.5rem;
          }
          
          .questions-container {
            max-width: 64rem;
            margin-left: auto;
            margin-right: auto;
            padding-bottom: 5rem;
          }
          
          .questions-stats {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
          }
          
          .stat-badge {
            font-size: 0.875rem;
            background: #e0e7ff;
            color: #3730a3;
            padding: 0.375rem 0.75rem;
            border-radius: 9999px;
            font-weight: 500;
          }
          
          .no-questions-message {
            text-align: center;
            padding: 3rem;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            max-width: 32rem;
            margin: 0 auto;
            color: #6b7280;
          }
          
          .close-no-questions-button {
            margin-top: 1rem;
            padding: 0.75rem 2rem;
            background: #7c3aed;
            color: white;
            border-radius: 0.5rem;
            font-weight: bold;
            transition: background-color 0.2s;
            border: none;
            cursor: pointer;
          }
          
          .close-no-questions-button:hover {
            background: #6d28d9;
          }
          
          .question-card {
            background: white;
            border-radius: 1.5rem;
            padding: 2rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            border: 1px solid #f3f4f6;
            position: relative;
            margin-bottom: 3rem;
            transition: box-shadow 0.3s;
          }
          
          .question-card.highlight-empty {
            animation: shake 0.5s ease-in-out;
            border-color: #f59e0b !important;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1) !important;
          }
          
          @keyframes shake {
            0%, 100% {
              transform: translateX(0);
            }
            10%, 30%, 50%, 70%, 90% {
              transform: translateX(-5px);
            }
            20%, 40%, 60%, 80% {
              transform: translateX(5px);
            }
          }
          
          .question-card:hover {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
          }
          
          .question-badge {
            position: absolute;
            left: -0.75rem;
            top: 2rem;
            background: #7c3aed;
            color: white;
            padding-left: 1rem;
            padding-right: 1rem;
            padding-top: 0.25rem;
            padding-bottom: 0.25rem;
            border-radius: 0 9999px 9999px 0;
            font-weight: bold;
            font-size: 0.875rem;
            box-shadow: 0 10px 15px rgba(124, 58, 237, 0.1);
          }
          
          .question-content {
            padding-left: 1.5rem;
          }
          
          .instruction-hint {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            color: #d97706;
            background: rgba(254, 243, 199, 0.3);
            padding: 1rem;
            border-radius: 0.75rem;
            border: 1px solid #fef3c7;
            margin-bottom: 1.5rem;
          }
          
          .hint-icon {
            flex-shrink: 0;
            margin-top: 0.125rem;
            width: 1.25rem;
            height: 1.25rem;
          }
          
          .hint-title {
            font-weight: bold;
            margin-bottom: 0.25rem;
          }
          
          .hint-points {
            color: rgba(217, 119, 6, 0.8);
            font-size: 0.75rem;
            margin-top: 0.25rem;
          }
          
          .example-section {
            margin-bottom: 2rem;
            padding-left: 1rem;
            border-left: 4px solid #bfdbfe;
            padding-top: 0.25rem;
            padding-bottom: 0.25rem;
          }
          
          .example-label {
            font-size: 0.875rem;
            color: #3b82f6;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
          }
          
          .example-content {
            font-size: 1.125rem;
            color: #4b5563;
            font-weight: 500;
          }
          
          .main-question-content {
            position: relative;
          }
          
          .question-content-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .fill-blank-line, .multiple-choice-line {
            line-height: 3.5rem;
            font-size: 1.25rem;
            color: #1f2937;
            word-break: break-word;
          }
          
          .blank-input-field {
            display: inline-flex;
            margin-left: 0.5rem;
            margin-right: 0.5rem;
            width: 8rem;
            height: 2.5rem;
            text-align: center;
            color: #7c3aed;
            font-weight: bold;
            background: #faf5ff;
            border: 2px solid #d8b4fe;
            border-radius: 0.25rem;
            transition: all 0.2s;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            padding: 0 0.5rem;
            font-size: 1rem;
          }
          
          .blank-input-field:focus {
            border-color: #7c3aed;
            background: white;
            outline: none;
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
          }
          
          .blank-input-field::placeholder {
            color: #c4b5fd;
          }

          .fill-blank-fallback {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            line-height: 1.75rem;
          }

          .blank-textarea-field {
            width: 100%;
            min-height: 5.5rem;
            text-align: left;
            padding: 0.75rem;
            resize: vertical;
          }
          
          .choice-container {
            display: inline-flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-left: 0.5rem;
            margin-right: 0.5rem;
            vertical-align: middle;
          }
          
          .choice-button {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: bold;
            border: 2px solid;
            transition: all 0.2s;
            transform: scale(1);
            cursor: pointer;
            white-space: nowrap;
          }
          
          .choice-button:hover {
            transform: scale(1.05);
          }
          
          .choice-button-selected {
            background: #7c3aed;
            color: white;
            border-color: #7c3aed;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .choice-button-default {
            background: white;
            color: #4b5563;
            border-color: #d1d5db;
          }
          
          .choice-button-default:hover {
            border-color: #c4b5fd;
            color: #7c3aed;
          }
          
          /* Rearrange styles */
          .rearrange-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-top: 1rem;
          }
          
          .rearrange-instruction {
            color: #6b7280;
            font-size: 0.95rem;
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 0.5rem;
            border-left: 4px solid #7c3aed;
          }
          
          .rearrange-words {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            padding: 1rem;
            background: #faf5ff;
            border-radius: 1rem;
            min-height: 120px;
            border: 2px dashed #d8b4fe;
          }
          
          .rearrange-word {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            background: white;
            border: 2px solid #e9d5ff;
            border-radius: 0.75rem;
            cursor: move;
            user-select: none;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(124, 58, 237, 0.1);
          }
          
          .rearrange-word:hover {
            border-color: #c4b5fd;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(124, 58, 237, 0.15);
          }
          
          .rearrange-word.dragging {
            opacity: 0.5;
            border-style: dashed;
            background: #f3e8ff;
          }
          
          .drag-handle {
            color: #a78bfa;
            width: 1rem;
            height: 1rem;
            cursor: grab;
          }
          
          .rearrange-word:active .drag-handle {
            cursor: grabbing;
          }
          
          .rearrange-preview {
            padding: 1.25rem;
            background: white;
            border-radius: 1rem;
            border: 2px solid #e0e7ff;
          }
          
          .preview-label {
            font-weight: 600;
            color: #4f46e5;
            margin-bottom: 0.75rem;
            font-size: 0.95rem;
          }
          
          .preview-text {
            font-size: 1.25rem;
            line-height: 2;
            color: #1f2937;
            min-height: 2.5rem;
            padding: 0.5rem;
            background: #f8fafc;
            border-radius: 0.5rem;
          }
          
          .preview-word {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            margin: 0.125rem;
            background: #e0e7ff;
            border-radius: 0.25rem;
          }
          
          .modal-footer {
            flex: none;
            padding: 1.5rem;
            background: white;
            border-top: 1px solid #f3f4f6;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            z-index: 20;
            box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.02);
          }
          
          .submit-debug-info {
            text-align: center;
            font-size: 0.75rem;
            color: #6b7280;
            font-family: monospace;
            background: #f3f4f6;
            padding: 0.5rem;
            border-radius: 0.375rem;
          }
          
          .submit-button {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            background-image: linear-gradient(to right, #7c3aed, #db2777);
            color: white;
            padding-left: 3rem;
            padding-right: 3rem;
            padding-top: 1rem;
            padding-bottom: 1rem;
            border-radius: 1rem;
            font-size: 1.25rem;
            font-weight: bold;
            box-shadow: 0 10px 25px rgba(124, 58, 237, 0.1);
            transition: all 0.2s;
            width: 100%;
            min-width: 300px;
            border: none;
            cursor: pointer;
          }
          
          .submit-button:disabled {
            opacity: 0.5;
            transform: translateY(0);
            box-shadow: none;
            cursor: not-allowed;
          }
          
          @media (min-width: 768px) {
            .submit-button {
              width: auto;
              align-self: center;
            }
          }
          
          .submit-button:hover:not(:disabled) {
            box-shadow: 0 15px 30px rgba(124, 58, 237, 0.2);
            transform: translateY(-0.25rem);
          }
          
          .submit-spinner {
            animation: spin 1s linear infinite;
            width: 1.5rem;
            height: 1.5rem;
            border: 2px solid white;
            border-top-color: transparent;
            border-radius: 9999px;
          }
          
          .submit-icon {
            width: 1.375rem;
            height: 1.375rem;
            transition: transform 0.2s;
          }
          
          .submit-button:hover:not(:disabled) .submit-icon {
            transform: translateX(0.25rem);
          }
          
          .modal-body::-webkit-scrollbar {
            width: 8px;
          }
          
          .modal-body::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .modal-body::-webkit-scrollbar-thumb {
            background-color: #E9D5FF;
            border-radius: 20px;
            border: 3px solid transparent;
            background-clip: content-box;
          }
          
          .modal-body::-webkit-scrollbar-thumb:hover {
            background-color: #C084FC;
          }
          
          ruby {
            ruby-align: center;
          }
        `}</style>
      </div>

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="validation-modal-overlay">
          <div className="validation-modal">
            <div className="validation-modal-header">
              <AlertCircle className="validation-alert-icon" />
              <h3 className="validation-modal-title">Thiếu thông tin</h3>
            </div>
            <div className="validation-modal-body">
              <p>{validationMessage}</p>
              <p className="validation-hint">
                Vui lòng kiểm tra lại các câu hỏi và điền đầy đủ thông tin.
              </p>
            </div>
            <div className="validation-modal-footer">
              <button
                onClick={handleConfirmValidation}
                className="validation-confirm-button"
              >
                Xác nhận
              </button>
            </div>
          </div>
          <style>{`
            .validation-modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.5);
              backdrop-filter: blur(4px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 100000;
              padding: 1rem;
            }
            
            .validation-modal {
              background: white;
              border-radius: 1rem;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
              width: 100%;
              max-width: 400px;
              overflow: hidden;
              animation: slideInUp 0.3s ease-out;
            }
            
            .validation-modal-header {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              padding: 1.5rem;
              background: #fef3c7;
              border-bottom: 1px solid #fde68a;
            }
            
            .validation-alert-icon {
              color: #d97706;
              width: 1.5rem;
              height: 1.5rem;
            }
            
            .validation-modal-title {
              font-size: 1.25rem;
              font-weight: bold;
              color: #92400e;
              margin: 0;
            }
            
            .validation-modal-body {
              padding: 1.5rem;
              color: #4b5563;
            }
            
            .validation-hint {
              margin-top: 0.75rem;
              color: #6b7280;
              font-size: 0.875rem;
            }
            
            .validation-modal-footer {
              padding: 1rem 1.5rem;
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
              display: flex;
              justify-content: flex-end;
            }
            
            .validation-confirm-button {
              padding: 0.5rem 1.5rem;
              background: #7c3aed;
              color: white;
              border-radius: 0.5rem;
              font-weight: bold;
              border: none;
              cursor: pointer;
              transition: background-color 0.2s;
            }
            
            .validation-confirm-button:hover {
              background: #6d28d9;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
