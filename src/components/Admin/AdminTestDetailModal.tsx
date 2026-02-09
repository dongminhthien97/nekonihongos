import React, { useState, useEffect, useRef, useCallback } from "react";
import apiClient from "../../lib/api";
import {
  X,
  Check,
  XCircle,
  MessageSquare,
  Star,
  Clock,
  User,
  BookOpen,
  Send,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  XSquare,
  Loader2,
  Download,
  RefreshCw,
  Info,
  Filter,
  Hash,
  Database,
  CheckSquare,
  Square,
  List,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

interface TestAnswer {
  questionId: number;
  userAnswer: string;
  isCorrect?: boolean;
  correctAnswer?: string;
  allCorrectAnswers?: string;
  subQuestionIndex: number;
  points?: number;
  maxPoints?: number;
  explanation?: string;
  questionType?: string;
  questionText?: string;
  originalAnswer?: string;
  adminChecked?: boolean;
}

interface UserTest {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  lessonId: number;
  lessonTitle?: string;
  score?: number | null;
  status: "pending" | "feedbacked";
  feedback: string | null;
  feedbackAt: string | null;
  submittedAt: string;
  answers?: TestAnswer[];
  timeSpent?: number;
}

interface AdminTestDetailModalProps {
  test: UserTest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (
    testId: number,
    feedback: string,
    score: number,
  ) => Promise<void>;
  onDeleteTest: (testId: number) => Promise<void>;
  onShowCorrectAnswers: () => void;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

interface GrammarQuestion {
  id: number;
  lesson_id: number;
  example: string | null;
  type: string;
  text: string;
  options: string[] | null;
  correct_answer: string;
  points: number;
  explanation: string | null;
  created_at: string;
  updated_at: string;
}

export function AdminTestDetailModal({
  test,
  isOpen,
  onClose,
  onSubmitFeedback,
  onDeleteTest,
  onShowCorrectAnswers,
  position = { x: 100, y: 100 },
  onPositionChange,
}: AdminTestDetailModalProps) {
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>(
    {},
  );
  const [modalPosition, setModalPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [grammarQuestions, setGrammarQuestions] = useState<GrammarQuestion[]>(
    [],
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGrammarQuestions, setShowGrammarQuestions] = useState(true);
  const [autoGraded, setAutoGraded] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const fetchTimeoutRef = useRef<number | null>(null);

  // Khởi tạo dữ liệu khi test thay đổi
  useEffect(() => {
    if (test) {
      setFeedback(test.feedback || "");
      setScore(test.score ?? null);
      setFetchError(null);

      const initialChecks: Record<string, boolean> = {};
      if (test.answers) {
        test.answers.forEach((answer) => {
          const key = `${answer.questionId}_${answer.subQuestionIndex}`;
          if (answer.isCorrect !== undefined) {
            initialChecks[key] = answer.isCorrect;
          }
        });
      }
      setCheckedAnswers(initialChecks);

      fetchGrammarQuestions();
    }
  }, [test]);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Cập nhật vị trí modal khi prop thay đổi
  useEffect(() => {
    setModalPosition(position);
  }, [position]);

  // Hàm lấy token xác thực
  const getAuthToken = useCallback((): string | null => {
    const tokenKeys = [
      "token",
      "access_token",
      "auth_token",
      "user_token",
      "jwt_token",
      "jwt",
      "authToken",
      "accessToken",
      "user",
      "auth",
      "nekonihongo_token",
      "admin_token",
    ];

    for (const key of tokenKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        return value;
      }
    }

    for (const key of tokenKeys) {
      const value = sessionStorage.getItem(key);
      if (value) {
        return value;
      }
    }

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const trimmedCookie = cookie.trim();
      for (const key of tokenKeys) {
        if (trimmedCookie.startsWith(`${key}=`)) {
          return trimmedCookie.substring(key.length + 1);
        }
      }
    }

    return null;
  }, []);

  // Hàm hiển thị lỗi trong modal
  const showError = (title: string, message: string) => {
    setErrorModal({
      isOpen: true,
      title,
      message,
    });
  };

  // Đóng modal lỗi
  const closeErrorModal = () => {
    setErrorModal({
      isOpen: false,
      title: "",
      message: "",
    });
  };

  // Fetch grammar questions từ API
  const fetchGrammarQuestions = async () => {
    if (!test || !test.lessonId) {
      toast.error("Không tìm thấy bài học để lấy câu hỏi");
      return;
    }

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập và thử lại.");
      }

      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const apiUrl = `/api/grammar/mini-test/questions?lesson_id=${test.lessonId}`;

      const response = await apiClient.get(apiUrl);

      const processedData = processGrammarQuestionsData(response.data);
      if (!processedData || processedData.length === 0) {
        throw new Error("Không tìm thấy câu hỏi trong phản hồi");
      }

      setGrammarQuestions(processedData);
      toast.success(`Đã tải ${processedData.length} câu hỏi từ server`);
    } catch (error: any) {
      const errorMessage = error.message || "Không thể kết nối đến server";
      setFetchError(errorMessage);
      toast.error(`Lỗi: ${errorMessage}`);
      showError("Lỗi khi tải câu hỏi", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý dữ liệu grammar questions từ API
  const processGrammarQuestionsData = (
    responseData: any,
  ): GrammarQuestion[] => {
    if (!responseData) {
      return [];
    }

    if (Array.isArray(responseData)) {
      return responseData.map((item) => normalizeGrammarQuestionData(item));
    }

    if (responseData.data && Array.isArray(responseData.data)) {
      return responseData.data.map((item: any) =>
        normalizeGrammarQuestionData(item),
      );
    }

    if (responseData.questions && Array.isArray(responseData.questions)) {
      return responseData.questions.map((item: any) =>
        normalizeGrammarQuestionData(item),
      );
    }

    return [];
  };

  // Chuẩn hóa dữ liệu grammar question
  const normalizeGrammarQuestionData = (item: any): GrammarQuestion => {
    return {
      id: item.id || 0,
      lesson_id: item.lesson_id || item.lessonId || 0,
      example: item.example || null,
      type: item.type || "fill_blank",
      text: item.text || item.questionText || item.content || "",
      options: item.options || null,
      correct_answer: item.correct_answer || item.correctAnswer || "",
      points: item.points || 10,
      explanation: item.explanation || item.hint || null,
      created_at: item.created_at || item.createdAt || new Date().toISOString(),
      updated_at: item.updated_at || item.updatedAt || new Date().toISOString(),
    };
  };

  // Xử lý kéo thả modal
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 1000));
      const boundedY = Math.max(0, Math.min(newY, window.innerHeight - 700));

      const newPosition = { x: boundedX, y: boundedY };
      setModalPosition(newPosition);
      if (onPositionChange) {
        onPositionChange(newPosition);
      }
    },
    [isDragging, dragStart, onPositionChange],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Xử lý check/uncheck đáp án
  const handleAnswerCheck = (
    questionId: number,
    subIndex: number,
    isCorrect: boolean,
  ) => {
    const key = `${questionId}_${subIndex}`;
    setCheckedAnswers((prev) => ({
      ...prev,
      [key]: isCorrect,
    }));

    setTimeout(() => calculateScoreFromChecks(), 100);
  };

  // Tính điểm từ các check
  const calculateScoreFromChecks = () => {
    if (!test?.answers) return 0;

    const totalQuestions = test.answers.length;
    const correctCount = Object.values(checkedAnswers).filter(Boolean).length;
    const calculatedScore = correctCount;

    setScore(calculatedScore);
    return calculatedScore;
  };

  // Xử lý toggle tất cả đáp án
  const handleToggleAllCorrect = () => {
    if (!test?.answers) return;

    const newChecks: Record<string, boolean> = {};
    test.answers.forEach((answer) => {
      const key = `${answer.questionId}_${answer.subQuestionIndex}`;
      newChecks[key] = true;
    });

    setCheckedAnswers(newChecks);
    calculateScoreFromChecks();
    toast.success("Đã chấm tất cả câu là ĐÚNG");
  };

  const handleToggleAllIncorrect = () => {
    if (!test?.answers) return;

    const newChecks: Record<string, boolean> = {};
    test.answers.forEach((answer) => {
      const key = `${answer.questionId}_${answer.subQuestionIndex}`;
      newChecks[key] = false;
    });

    setCheckedAnswers(newChecks);
    calculateScoreFromChecks();
    toast.success("Đã chấm tất cả câu là SAI");
  };

  // Hàm auto grade đơn giản
  const handleAutoGrade = () => {
    if (!test?.answers || grammarQuestions.length === 0) {
      toast.error("Không thể tự động chấm: thiếu dữ liệu câu hỏi");
      return;
    }

    const newChecks: Record<string, boolean> = {};
    let correctCount = 0;

    test.answers.forEach((answer) => {
      const key = `${answer.questionId}_${answer.subQuestionIndex}`;

      if (checkedAnswers[key] !== undefined) {
        newChecks[key] = checkedAnswers[key];
        if (checkedAnswers[key]) correctCount++;
        return;
      }

      newChecks[key] = true;
      correctCount++;
    });

    setCheckedAnswers(newChecks);
    setScore(correctCount);
    setAutoGraded(true);

    toast.success(
      `Đã tự động chấm: ${correctCount}/${test.answers.length} câu đúng`,
    );
  };

  // Xử lý submit feedback
  const handleSubmit = async () => {
    if (!test) return;

    if (!feedback.trim()) {
      toast.error("Vui lòng nhập phản hồi cho học viên");
      return;
    }

    setIsSubmitting(true);
    const finalScore = score || calculateScoreFromChecks() || 0;

    try {
      await onSubmitFeedback(test.id, feedback.trim(), finalScore);
      toast.success("Đã gửi phản hồi thành công");
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi khi gửi phản hồi";
      showError("Lỗi khi gửi phản hồi", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý xóa test
  const handleDelete = async () => {
    if (!test) return;

    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa bài test này? Hành động này không thể hoàn tác.",
    );

    if (!confirmed) return;

    try {
      await onDeleteTest(test.id);
      toast.success("Đã xóa bài test thành công");
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || "Lỗi khi xóa bài test";
      showError("Lỗi khi xóa bài test", errorMessage);
    }
  };

  // Tính toán tiến độ và thống kê
  const totalQuestions = test?.answers?.length || 0;
  const checkedCount = Object.keys(checkedAnswers).length;
  const correctCount = Object.values(checkedAnswers).filter(Boolean).length;
  const progressPercentage =
    totalQuestions > 0 ? (checkedCount / totalQuestions) * 100 : 0;

  if (!isOpen || !test) return null;

  return (
    <>
      {/* Modal lỗi */}
      {errorModal.isOpen && (
        <div className="error-modal-overlay">
          <div className="error-modal">
            <div className="error-modal-header">
              <AlertCircle size={24} className="error-modal-icon" />
              <h3 className="error-modal-title">{errorModal.title}</h3>
            </div>
            <div className="error-modal-content">
              <p>{errorModal.message}</p>
            </div>
            <div className="error-modal-actions">
              <button onClick={closeErrorModal} className="error-modal-button">
                Đóng
              </button>
            </div>
          </div>
          <style>{`
            .error-modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              animation: fadeIn 0.2s ease;
            }

            .error-modal {
              background: white;
              border-radius: 12px;
              width: 90%;
              max-width: 500px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              overflow: hidden;
              animation: slideUp 0.3s ease;
            }

            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }

            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .error-modal-header {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 20px 24px;
              background: #fef2f2;
              border-bottom: 1px solid #fecaca;
            }

            .error-modal-icon {
              color: #dc2626;
              flex-shrink: 0;
            }

            .error-modal-title {
              margin: 0;
              color: #dc2626;
              font-size: 18px;
              font-weight: 600;
            }

            .error-modal-content {
              padding: 24px;
              color: #4b5563;
              line-height: 1.6;
              font-size: 14px;
            }

            .error-modal-content p {
              margin: 0;
            }

            .error-modal-actions {
              padding: 0 24px 24px;
              display: flex;
              justify-content: flex-end;
            }

            .error-modal-button {
              padding: 10px 24px;
              background: #dc2626;
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
            }

            .error-modal-button:hover {
              background: #b91c1c;
            }
          `}</style>
        </div>
      )}

      <div
        className="modal-container draggable-modal"
        style={{
          position: "fixed",
          left: `${modalPosition.x}px`,
          top: `${modalPosition.y}px`,
          zIndex: 1001,
        }}
      >
        {/* Modal Header - Draggable area */}
        <div
          className="modal-header draggable-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <div className="modal-header-content">
            <h2 className="modal-title">
              <MessageSquare size={24} />
              Chấm điểm bài test
              {isLoading && (
                <span className="loading-badge">
                  <Loader2 size={14} className="animate-spin" />
                  Đang tải...
                </span>
              )}
            </h2>
            <div className="modal-subtitle-section">
              <div className="user-info">
                <User size={16} />
                <span>{test.userName || `User ${test.userId}`}</span>
                <span className="email-text">{test.userEmail}</span>
              </div>
              <div className="lesson-info">
                <BookOpen size={16} />
                <span>
                  Bài {test.lessonId}: {test.lessonTitle || "Chưa có tiêu đề"}
                </span>
              </div>
              <div className="time-info">
                <Clock size={16} />
                <span>
                  Nộp lúc: {new Date(test.submittedAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-header">
            <h3>Tiến độ chấm điểm</h3>
            <div className="progress-info">
              <span className="progress-text">
                {checkedCount}/{totalQuestions} câu đã chấm
                {autoGraded && (
                  <span className="auto-grade-badge">
                    <CheckCircle size={12} />
                    Đã tự động chấm
                  </span>
                )}
              </span>
              <span className="lesson-id">Bài {test.lessonId}</span>
            </div>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="progress-stats">
            <div className="stat-item">
              <Check size={16} className="stat-icon correct" />
              <span className="stat-count correct">{correctCount}</span>
              <span className="stat-label">Đúng</span>
            </div>
            <div className="stat-item">
              <XCircle size={16} className="stat-icon incorrect" />
              <span className="stat-count incorrect">
                {checkedCount - correctCount}
              </span>
              <span className="stat-label">Sai</span>
            </div>
            <div className="stat-item">
              <AlertCircle size={16} className="stat-icon pending" />
              <span className="stat-count pending">
                {totalQuestions - checkedCount}
              </span>
              <span className="stat-label">Chưa chấm</span>
            </div>
            <div className="stat-item">
              <Database size={16} className="stat-icon info" />
              <span className="stat-count info">{grammarQuestions.length}</span>
              <span className="stat-label">Câu hỏi</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="header-actions">
          <div className="action-buttons-group">
            <button
              onClick={fetchGrammarQuestions}
              className="view-questions-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Tải câu hỏi từ DB
                </>
              )}
            </button>
            <button
              onClick={handleAutoGrade}
              className="auto-grade-button"
              disabled={grammarQuestions.length === 0 || isLoading}
            >
              <CheckCircle size={16} />
              Chấm tự động
            </button>
            <button
              onClick={() => setShowGrammarQuestions(!showGrammarQuestions)}
              className="toggle-questions-button"
            >
              <List size={16} />
              {showGrammarQuestions ? "Ẩn câu hỏi" : "Hiện câu hỏi"}
            </button>
          </div>

          <div className="questions-info">
            <span className="questions-text">
              <Hash size={14} />
              {grammarQuestions.length} câu hỏi trong DB
            </span>
          </div>
        </div>

        {/* Error message */}
        {fetchError && (
          <div className="error-section">
            <div className="error-message">
              <AlertCircle size={20} />
              <div className="error-content">
                <strong>Lỗi khi tải câu hỏi:</strong>
                <p className="error-detail">{fetchError}</p>
                <div className="error-actions">
                  <button
                    onClick={fetchGrammarQuestions}
                    className="retry-button"
                    disabled={isLoading}
                  >
                    <RefreshCw size={14} />
                    Thử lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grammar Questions Section */}
        {showGrammarQuestions && grammarQuestions.length > 0 && (
          <div className="grammar-questions-section">
            <div className="section-header">
              <h3 className="section-title">
                <FileText size={20} />
                Danh sách câu hỏi trong bài ({grammarQuestions.length} câu)
              </h3>
              <div className="scoring-info">
                <HelpCircle size={16} />
                <span>
                  Hiển thị tất cả câu hỏi từ bảng grammar_questions cho bài học
                  này
                </span>
              </div>
            </div>

            <div className="grammar-questions-list">
              {grammarQuestions.map((question, index) => (
                <div key={question.id} className="grammar-question-card">
                  <div className="grammar-question-header">
                    <div className="grammar-question-header-left">
                      <span className="grammar-question-number">
                        Câu {index + 1}
                      </span>
                      <span className="grammar-question-type">
                        {question.type === "fill_blank"
                          ? "Điền vào chỗ trống"
                          : question.type === "multiple_choice"
                            ? "Trắc nghiệm"
                            : question.type === "rearrange"
                              ? "Sắp xếp"
                              : question.type}
                      </span>
                      <span className="grammar-question-points">
                        {question.points} điểm
                      </span>
                    </div>
                  </div>

                  <div className="grammar-question-content">
                    <div className="grammar-question-text-section">
                      <div className="grammar-question-text">
                        {question.text.split("\n").map((line, idx) => (
                          <div key={idx} className="grammar-question-line">
                            {line}
                          </div>
                        ))}
                      </div>

                      {question.example && (
                        <div className="grammar-question-example">
                          <strong>Ví dụ:</strong> {question.example}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="grammar-question-explanation">
                          <strong>Giải thích:</strong> {question.explanation}
                        </div>
                      )}

                      {question.correct_answer && (
                        <div className="grammar-question-correct-answer">
                          <strong>Đáp án đúng:</strong>{" "}
                          <code>{question.correct_answer}</code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Answers Section */}
        <div className="user-answers-section">
          <div className="section-header">
            <h3 className="section-title">
              <List size={20} />
              Câu trả lời của học viên ({totalQuestions} câu)
            </h3>
            <div className="scoring-info">
              <HelpCircle size={16} />
              <span>
                Chấm điểm thủ công bằng cách chọn Đúng/Sai cho từng câu trả lời
              </span>
            </div>
          </div>

          {totalQuestions === 0 ? (
            <div className="no-answers-message">
              <p>
                <Info size={20} />
                Học viên chưa trả lời câu hỏi nào.
              </p>
            </div>
          ) : (
            <>
              <div className="bulk-actions">
                <button
                  onClick={handleToggleAllCorrect}
                  className="bulk-correct-button"
                >
                  <CheckSquare size={16} />
                  Chấm tất cả là ĐÚNG
                </button>
                <button
                  onClick={handleToggleAllIncorrect}
                  className="bulk-incorrect-button"
                >
                  <Square size={16} />
                  Chấm tất cả là SAI
                </button>
                <button
                  onClick={calculateScoreFromChecks}
                  className="calculate-score-button"
                >
                  <Calculator size={16} />
                  Tính điểm
                </button>
              </div>

              <div className="user-answers-list">
                {test.answers?.map((answer, index) => {
                  const key = `${answer.questionId}_${answer.subQuestionIndex}`;
                  const isChecked = checkedAnswers[key] !== undefined;
                  const isCorrect = checkedAnswers[key];

                  return (
                    <div key={index} className="user-answer-card">
                      <div className="user-answer-header">
                        <div className="user-answer-info">
                          <span className="answer-index">
                            Câu {index + 1}
                            {answer.subQuestionIndex > 0 &&
                              ` (Phần ${answer.subQuestionIndex + 1})`}
                          </span>
                          <span className="answer-question-id">
                            ID câu hỏi: {answer.questionId}
                          </span>
                          {answer.questionType && (
                            <span className="answer-type">
                              Loại: {answer.questionType}
                            </span>
                          )}
                        </div>

                        <div className="answer-check-controls">
                          <button
                            onClick={() =>
                              handleAnswerCheck(
                                answer.questionId,
                                answer.subQuestionIndex,
                                true,
                              )
                            }
                            className={`check-button ${isChecked && isCorrect ? "active-correct" : ""}`}
                          >
                            <Check size={16} />
                            <span>Đúng</span>
                          </button>
                          <button
                            onClick={() =>
                              handleAnswerCheck(
                                answer.questionId,
                                answer.subQuestionIndex,
                                false,
                              )
                            }
                            className={`check-button ${isChecked && !isCorrect ? "active-incorrect" : ""}`}
                          >
                            <XCircle size={16} />
                            <span>Sai</span>
                          </button>
                        </div>
                      </div>

                      <div className="user-answer-content">
                        <div className="user-answer-text">
                          <strong>Câu trả lời:</strong>
                          <div className="answer-value">
                            {answer.userAnswer || "(Chưa trả lời)"}
                          </div>
                        </div>

                        {answer.questionText && (
                          <div className="original-question">
                            <strong>Câu hỏi gốc:</strong>
                            <div className="question-text">
                              {answer.questionText}
                            </div>
                          </div>
                        )}

                        {answer.explanation && (
                          <div className="answer-explanation">
                            <strong>Giải thích (nếu có):</strong>{" "}
                            {answer.explanation}
                          </div>
                        )}
                      </div>

                      <div className="user-answer-footer">
                        <div className="answer-status">
                          <span className="status-label">Trạng thái:</span>
                          <span
                            className={`status-badge ${isChecked ? (isCorrect ? "status-correct" : "status-incorrect") : "status-unchecked"}`}
                          >
                            {isChecked
                              ? isCorrect
                                ? "✓ Đã chấm Đúng"
                                : "✗ Đã chấm Sai"
                              : "Chưa chấm"}
                          </span>
                        </div>

                        {isChecked && (
                          <div className="score-display">
                            <span className="score-label">Điểm:</span>
                            <span className="score-value">
                              {isCorrect ? "1" : "0"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Score Summary */}
        <div className="score-summary">
          <div className="score-info">
            <h3>
              <Star size={20} />
              Điểm số
            </h3>
            <div className="score-display">
              <span className="score-value">{score !== null ? score : 0}</span>
              <span className="score-max">/{totalQuestions} điểm</span>
            </div>
            <div className="score-percentage">
              (
              {totalQuestions > 0
                ? Math.round(((score || 0) / totalQuestions) * 100)
                : 0}
              %)
            </div>
          </div>
          <div className="score-actions">
            <button
              onClick={calculateScoreFromChecks}
              className="calculate-button"
            >
              Tính điểm từ chấm thủ công
            </button>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="feedback-section">
          <h3>
            <MessageSquare size={20} />
            Phản hồi của Admin
          </h3>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Nhập phản hồi chi tiết cho học viên (nhận xét về bài làm, gợi ý cải thiện, lời khen...)"
            className="feedback-textarea"
            rows={4}
          />

          {test.feedback && test.feedbackAt && (
            <div className="previous-feedback">
              <strong>Phản hồi trước:</strong>
              <p>{test.feedback}</p>
              <small>
                Lúc: {new Date(test.feedbackAt).toLocaleString("vi-VN")}
              </small>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={handleDelete} className="delete-button">
            <XSquare size={16} />
            Xóa bài test
          </button>
          <div className="submit-buttons">
            <button onClick={onClose} className="cancel-button">
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={!feedback.trim() || isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Gửi phản hồi ({score !== null ? score : 0} điểm)
                </>
              )}
            </button>
          </div>
        </div>

        <style>{`
          .modal-container {
            background: white;
            border-radius: 1rem;
            box-shadow:
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(0, 0, 0, 0.05);
            width: 1000px;
            max-height: 90vh;
            overflow: hidden auto;
            pointer-events: auto;
            min-width: 800px;
            min-height: 600px;
            animation: fadeIn 0.3s ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .modal-header {
            padding: 1.25rem 1.5rem;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            user-select: none;
          }

          .modal-header-content {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            flex: 1;
          }

          .modal-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
          }

          .loading-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.2);
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            margin-left: 10px;
          }

          .modal-subtitle-section {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .user-info,
          .lesson-info,
          .time-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            opacity: 0.9;
          }

          .email-text {
            font-style: italic;
            opacity: 0.8;
            margin-left: 0.5rem;
          }

          .close-button {
            color: white;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 0.5rem;
            padding: 0.5rem;
            transition: background-color 0.2s;
            border: none;
            cursor: pointer;
            flex-shrink: 0;
          }

          .close-button:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .progress-section {
            padding: 1.25rem 1.5rem;
            background: #f8fafc;
            border-bottom: 1px solid #e5e7eb;
          }

          .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }

          .progress-header h3 {
            margin: 0;
            color: #1f2937;
            font-size: 1.125rem;
          }

          .progress-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .progress-text {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #6b7280;
          }

          .auto-grade-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            background: #10b981;
            color: white;
            padding: 0.125rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
          }

          .lesson-id {
            padding: 0.25rem 0.75rem;
            background: #e0f2fe;
            color: #0369a1;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
          }

          .progress-bar-container {
            height: 0.5rem;
            background: #e5e7eb;
            border-radius: 9999px;
            overflow: hidden;
            margin-bottom: 1rem;
          }

          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
            border-radius: 9999px;
            transition: width 0.3s ease;
          }

          .progress-stats {
            display: flex;
            gap: 2rem;
          }

          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .stat-icon {
            border-radius: 50%;
            padding: 0.25rem;
          }

          .stat-icon.correct { color: #10b981; background: #dcfce7; }
          .stat-icon.incorrect { color: #ef4444; background: #fee2e2; }
          .stat-icon.pending { color: #f59e0b; background: #fef3c7; }
          .stat-icon.info { color: #3b82f6; background: #dbeafe; }

          .stat-count {
            font-size: 1.25rem;
            font-weight: 700;
          }

          .stat-count.correct { color: #10b981; }
          .stat-count.incorrect { color: #ef4444; }
          .stat-count.pending { color: #f59e0b; }
          .stat-count.info { color: #3b82f6; }

          .stat-label {
            font-size: 0.875rem;
            color: #6b7280;
          }

          .header-actions {
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .action-buttons-group {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          .questions-info {
            padding: 0.5rem 0.75rem;
            background: #f3f4f6;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .questions-text {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .view-questions-button,
          .auto-grade-button,
          .toggle-questions-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
          }

          .view-questions-button {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
          }

          .view-questions-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            transform: translateY(-1px);
          }

          .auto-grade-button {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
          }

          .auto-grade-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-1px);
          }

          .toggle-questions-button {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
          }

          .toggle-questions-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            transform: translateY(-1px);
          }

          .view-questions-button:disabled,
          .auto-grade-button:disabled,
          .toggle-questions-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
          }

          .error-section {
            padding: 1.5rem;
            background: #fef2f2;
            border-bottom: 1px solid #fecaca;
          }

          .error-message {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            color: #dc2626;
            font-size: 0.875rem;
          }

          .error-content {
            flex: 1;
          }

          .error-content strong {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 1rem;
          }

          .error-detail {
            margin: 0 0 1rem 0;
            line-height: 1.5;
            color: #991b1b;
          }

          .error-actions {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
          }

          .retry-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
            background: #dc2626;
            color: white;
          }

          .retry-button:hover:not(:disabled) {
            background: #b91c1c;
          }

          .retry-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* Grammar Questions Section */
          .grammar-questions-section {
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .section-header {
            margin-bottom: 1.5rem;
          }

          .section-title {
            margin: 0 0 0.5rem 0;
            color: #1f2937;
            font-size: 1.125rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .scoring-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: #f0f9ff;
            color: #0369a1;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            border-left: 3px solid #0ea5e9;
          }

          .grammar-questions-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .grammar-question-card {
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            overflow: hidden;
            background: white;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }

          .grammar-question-header {
            padding: 1rem 1.25rem;
            background: #f9fafb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e5e7eb;
          }

          .grammar-question-header-left {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          .grammar-question-number {
            padding: 0.375rem 0.875rem;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 9999px;
            min-width: 70px;
            text-align: center;
          }

          .grammar-question-type {
            padding: 0.25rem 0.75rem;
            background: #f3f4f6;
            color: #4b5563;
            font-size: 0.75rem;
            font-weight: 500;
            border-radius: 0.375rem;
          }

          .grammar-question-points {
            padding: 0.25rem 0.75rem;
            background: #fef3c7;
            color: #92400e;
            font-size: 0.75rem;
            font-weight: 500;
            border-radius: 0.375rem;
          }

          .grammar-question-content {
            padding: 1.5rem;
            background: white;
          }

          .grammar-question-text-section {
            margin-bottom: 1rem;
          }

          .grammar-question-text {
            font-size: 0.875rem;
            color: #1f2937;
            line-height: 1.6;
            white-space: pre-wrap;
            margin-bottom: 1rem;
          }

          .grammar-question-line {
            margin-bottom: 0.5rem;
          }

          .grammar-question-example {
            padding: 0.75rem;
            background: #fefce8;
            border-radius: 0.375rem;
            margin-bottom: 0.75rem;
            font-size: 0.875rem;
            color: #854d0e;
            border-left: 3px solid #f59e0b;
          }

          .grammar-question-explanation {
            padding: 0.75rem;
            background: #f0f9ff;
            border-radius: 0.375rem;
            margin-bottom: 0.75rem;
            font-size: 0.875rem;
            color: #0369a1;
            border-left: 3px solid #0ea5e9;
          }

          .grammar-question-correct-answer {
            padding: 0.75rem;
            background: #f0fdf4;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            color: #065f46;
            border-left: 3px solid #10b981;
          }

          .grammar-question-correct-answer code {
            background: #d1fae5;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-family: monospace;
            margin-left: 0.5rem;
          }

          /* User Answers Section */
          .user-answers-section {
            padding: 1.5rem;
          }

          .no-answers-message {
            padding: 2rem;
            text-align: center;
            background: #f3f4f6;
            border-radius: 0.5rem;
            margin: 1.5rem;
            color: #6b7280;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }

          .bulk-actions {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
          }

          .bulk-correct-button,
          .bulk-incorrect-button,
          .calculate-score-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
            font-size: 0.875rem;
          }

          .bulk-correct-button {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
          }

          .bulk-correct-button:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            transform: translateY(-1px);
          }

          .bulk-incorrect-button {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
          }

          .bulk-incorrect-button:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            transform: translateY(-1px);
          }

          .calculate-score-button {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
          }

          .calculate-score-button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-1px);
          }

          .user-answers-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .user-answer-card {
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            overflow: hidden;
            background: white;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }

          .user-answer-header {
            padding: 1rem 1.25rem;
            background: #f9fafb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e5e7eb;
          }

          .user-answer-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          .answer-index {
            font-weight: 600;
            color: #1f2937;
            font-size: 0.875rem;
          }

          .answer-question-id {
            padding: 0.25rem 0.75rem;
            background: #e0f2fe;
            color: #0369a1;
            font-size: 0.75rem;
            font-weight: 500;
            border-radius: 0.375rem;
            border: 1px solid #bae6fd;
          }

          .answer-type {
            padding: 0.25rem 0.75rem;
            background: #f3f4f6;
            color: #4b5563;
            font-size: 0.75rem;
            font-weight: 500;
            border-radius: 0.375rem;
          }

          .answer-check-controls {
            display: flex;
            gap: 0.5rem;
          }

          .check-button {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 0.875rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            transition: all 0.2s;
            background: #f3f4f6;
            color: #374151;
            border: 1px solid transparent;
            cursor: pointer;
          }

          .check-button.active-correct {
            background: #dcfce7;
            color: #166534;
            border-color: #86efac;
          }

          .check-button.active-incorrect {
            background: #fee2e2;
            color: #991b1b;
            border-color: #fca5a5;
          }

          .check-button:hover:not(.active-correct):not(.active-incorrect) {
            background: #e5e7eb;
          }

          .user-answer-content {
            padding: 1.5rem;
            background: white;
          }

          .user-answer-text {
            margin-bottom: 1rem;
          }

          .user-answer-text strong {
            display: block;
            margin-bottom: 0.5rem;
            color: #374151;
            font-size: 0.875rem;
          }

          .answer-value {
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            color: #1f2937;
            border: 1px solid #e5e7eb;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .original-question {
            margin-bottom: 1rem;
          }

          .original-question strong {
            display: block;
            margin-bottom: 0.5rem;
            color: #374151;
            font-size: 0.875rem;
          }

          .question-text {
            padding: 0.75rem;
            background: #f9fafb;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            color: #6b7280;
            border: 1px solid #e5e7eb;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .answer-explanation {
            padding: 0.75rem;
            background: #f0f9ff;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            color: #0369a1;
            border-left: 3px solid #0ea5e9;
          }

          .user-answer-footer {
            padding: 1rem 1.25rem;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #fafafa;
          }

          .answer-status {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .status-label {
            font-size: 0.875rem;
            color: #6b7280;
          }

          .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
          }

          .status-correct {
            background: #dcfce7;
            color: #166534;
          }

          .status-incorrect {
            background: #fee2e2;
            color: #991b1b;
          }

          .status-unchecked {
            background: #f3f4f6;
            color: #6b7280;
          }

          .score-display {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .score-label {
            font-size: 0.875rem;
            color: #6b7280;
          }

          .score-value {
            font-weight: 600;
            color: #1e40af;
            font-size: 0.875rem;
          }

          .score-summary {
            padding: 1.5rem;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-top: 1px solid #e5e7eb;
          }

          .score-info h3 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 0 0.5rem 0;
            color: #1e40af;
            font-size: 1.125rem;
          }

          .score-display {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;
            margin-bottom: 0.25rem;
          }

          .score-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1e40af;
          }

          .score-max {
            font-size: 1.5rem;
            color: #3b82f6;
          }

          .score-percentage {
            font-size: 1rem;
            color: #6b7280;
          }

          .score-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1rem;
          }

          .calculate-button {
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            font-size: 0.875rem;
          }

          .calculate-button:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            transform: translateY(-1px);
          }

          .feedback-section {
            padding: 1.5rem;
            border-top: 1px solid #e5e7eb;
          }

          .feedback-section h3 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 0 1rem 0;
            color: #1f2937;
            font-size: 1.125rem;
          }

          .feedback-textarea {
            width: 100%;
            padding: 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.75rem;
            resize: none;
            transition: all 0.2s;
            font-family: inherit;
            margin-bottom: 1rem;
            font-size: 0.875rem;
            min-height: 100px;
          }

          .feedback-textarea:focus {
            outline: none;
            border-color: transparent;
            box-shadow:
              0 0 0 2px #3b82f6,
              0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }

          .previous-feedback {
            padding: 1rem;
            background: #f3f4f6;
            border-radius: 0.5rem;
            border-left: 4px solid #9ca3af;
          }

          .previous-feedback strong {
            display: block;
            margin-bottom: 0.5rem;
            color: #374151;
          }

          .previous-feedback p {
            margin: 0 0 0.5rem 0;
            color: #4b5563;
            font-size: 0.875rem;
          }

          .previous-feedback small {
            color: #9ca3af;
            font-size: 0.75rem;
          }

          .action-buttons {
            padding: 1.5rem;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f9fafb;
          }

          .delete-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: #fee2e2;
            color: #dc2626;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
          }

          .delete-button:hover {
            background: #fecaca;
          }

          .submit-buttons {
            display: flex;
            gap: 0.75rem;
          }

          .cancel-button {
            padding: 0.75rem 1.5rem;
            border: 1px solid #d1d5db;
            background: white;
            color: #374151;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: all 0.2s;
            cursor: pointer;
          }

          .cancel-button:hover {
            background: #f3f4f6;
          }

          .submit-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
          }

          .submit-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-1px);
          }

          .submit-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </>
  );
}

// Thêm icon Calculator nếu chưa có
const Calculator = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="12" y2="14" />
    <line x1="14" y1="14" x2="16" y2="14" />
    <line x1="8" y1="18" x2="12" y2="18" />
    <line x1="14" y1="18" x2="16" y2="18" />
  </svg>
);

export default AdminTestDetailModal;
