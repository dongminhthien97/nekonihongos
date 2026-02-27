import { DraggableFloatingNeko } from "./DraggableFloatingNeko";
// src/pages/GrammarPage.tsx
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cat,
  ChevronDown,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { NekoLoading } from "./NekoLoading";
import { safeRequest } from "../api/safeRequest";
import { MiniTestModal } from "./MiniTestModal";

const LESSONS_PER_PAGE = 12;
const GRAMMAR_PER_PAGE = 3;

interface GrammarExample {
  japanese: string;
  vietnamese: string;
}

interface GrammarPoint {
  title: string;
  meaning: string;
  explanation: string;
  examples: GrammarExample[];
}

interface GrammarLesson {
  id: number;
  title: string;
  icon: string;
  grammar: GrammarPoint[];
}

export function GrammarPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [lessonPage, setLessonPage] = useState(1);
  const [grammarPage, setGrammarPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedExamples, setExpandedExamples] = useState<number[]>([]);
  const [showMiniTestModal, setShowMiniTestModal] = useState(false);
  const [completedMiniTests, setCompletedMiniTests] = useState<Set<number>>(
    new Set(),
  );
  const [userId, setUserId] = useState<number>(0);

  // States cho modal thành công và lỗi
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorType, setErrorType] = useState<
    "validation" | "server" | "timeout"
  >("validation");
  const [isClosingSuccessModal, setIsClosingSuccessModal] = useState(false);
  const [isClosingErrorModal, setIsClosingErrorModal] = useState(false);
  const [submissionData, setSubmissionData] = useState<{
    lessonId: number;
    lessonTitle: string;
    timeSpent: number;
    questionCount: number;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("completedMiniTests");
    if (saved) setCompletedMiniTests(new Set(JSON.parse(saved)));

    const userData = localStorage.getItem("nekoUser");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserId(user.id || user.userId || 0);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchGrammarLessons = async () => {
      try {
        const serverLessons = await safeRequest<GrammarLesson[]>({
          url: "/grammar/lessons",
          method: "GET",
        });
        await new Promise((resolve) => setTimeout(resolve, 600));

        setLessons(serverLessons);
        setError("");
      } catch (err: any) {
        console.error("😿 Lỗi khi tải ngữ pháp:", err);

        if (err.status === 401) {
          alert("Phiên đăng nhập hết hạn! Mèo đưa bạn về trang đăng nhập nhé");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("nekoUser");
          onNavigate("login");
          return;
        }

        setError("Không thể kết nối đến server! Mèo đang cố gắng...");
      } finally {
        setTimeout(() => setIsLoading(false), 600);
      }
    };

    fetchGrammarLessons();
  }, [onNavigate]);

  const totalLessonPages = Math.ceil(lessons.length / LESSONS_PER_PAGE);
  const currentLessons = lessons.slice(
    (lessonPage - 1) * LESSONS_PER_PAGE,
    lessonPage * LESSONS_PER_PAGE,
  );

  const currentLessonData = selectedLesson
    ? lessons.find((l) => l.id === selectedLesson)
    : null;

  const paginatedGrammar =
    currentLessonData?.grammar.slice(
      (grammarPage - 1) * GRAMMAR_PER_PAGE,
      grammarPage * GRAMMAR_PER_PAGE,
    ) || [];

  const toggleExample = (pointIndex: number) => {
    setExpandedExamples((prev) =>
      prev.includes(pointIndex)
        ? prev.filter((i) => i !== pointIndex)
        : [...prev, pointIndex],
    );
  };

  const [expandedSections, setExpandedSections] = useState<{
    [pointIndex: number]: {
      explanation?: boolean;
      examples?: boolean;
    };
  }>({});

  const toggleSection = (
    pointIndex: number,
    section: "explanation" | "examples",
  ) => {
    setExpandedSections((prev) => ({
      ...prev,
      [pointIndex]: {
        ...prev[pointIndex],
        [section]: !prev[pointIndex]?.[section],
      },
    }));
  };

  const handleNekoClick = () => {
    if (selectedLesson && currentLessonData && userId) {
      setShowMiniTestModal(true);
    } else if (!selectedLesson) {
      showCustomError("Vui lòng chọn bài học để làm bài test!");
    } else if (!userId) {
      showCustomError("Vui lòng đăng nhập để làm bài test!");
    }
  };

  // Hàm hiển thị modal thành công
  const showCustomSuccess = (data: {
    lessonId: number;
    lessonTitle: string;
    timeSpent: number;
    questionCount: number;
  }) => {
    setSubmissionData(data);
    setShowSuccessModal(true);
  };

  // Hàm hiển thị modal lỗi
  const showCustomError = (
    message: string,
    type: "validation" | "server" | "timeout" = "server",
  ) => {
    setErrorMessage(message);
    setErrorType(type);
    setShowErrorModal(true);
  };

  // Xử lý khi mini test submit thành công
  const handleMiniTestSuccess = (data: {
    lessonId: number;
    lessonTitle: string;
    timeSpent: number;
    questionCount: number;
  }) => {
    showCustomSuccess(data);
    setShowMiniTestModal(false);

    // Đánh dấu bài test đã hoàn thành
    if (selectedLesson) {
      const newSet = new Set(completedMiniTests);
      newSet.add(selectedLesson);
      setCompletedMiniTests(newSet);
      localStorage.setItem(
        "completedMiniTests",
        JSON.stringify(Array.from(newSet)),
      );
    }
  };

  // Xử lý khi mini test có lỗi
  const handleMiniTestError = (
    message: string,
    type: "validation" | "server" | "timeout" = "server",
  ) => {
    showCustomError(message, type);
    setShowMiniTestModal(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (isLoading) {
    return (
      <NekoLoading message="Mèo đang chuẩn bị bài học ngữ pháp cho bạn..." />
    );
  }

  if (error && lessons.length === 0) {
    return (
      <div className="full-page-dark-gradient-center">
        <div className="text-center text-white">
          <Cat className="text-9xl animate-bounce" />
          <p className="text-4xl font-bold mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-10 py-5 bg-white/20 backdrop-blur-xl rounded-2xl hover:bg-white/30 transition-all text-2xl font-bold"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subtle-gradient-background-relative">
      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-12">
          <h1 className="hero-title-style hero-text-glow">
            Ngữ Pháp Tiếng Nhật
          </h1>
        </div>

        {/* Danh sách bài học */}
        {!selectedLesson && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-12">
              {currentLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLesson(lesson.id);
                    setGrammarPage(1);
                  }}
                  className="interactive-blur-card"
                >
                  <Cat className="text-gray-800 animate-pulse-soft w-full h-full" />
                  <div className="text-center">
                    <p className="hero-text-glow text-white text-4xl">
                      Bài {lesson.id}
                    </p>
                    <p className="hero-text-glow text-2xl text-white mt-2 px-4 line-clamp-2">
                      {lesson.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {totalLessonPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-12">
                <button
                  onClick={() => setLessonPage((p) => Math.max(1, p - 1))}
                  disabled={lessonPage === 1}
                  className="custom-button"
                >
                  <ChevronLeft className="w-6 h-6 text-black" />
                </button>

                <div className="flex gap-3 items-center">
                  {Array.from({ length: totalLessonPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setLessonPage(i + 1)}
                      className={`rounded-full transition-all duration-200 flex items-center justify-center ${
                        lessonPage === i + 1
                          ? "custom-element"
                          : "button-icon-effect"
                      }`}
                    >
                      {lessonPage === i + 1 ? i + 1 : ""}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setLessonPage((p) => Math.min(totalLessonPages, p + 1))
                  }
                  disabled={lessonPage === totalLessonPages}
                  className="circular-icon-button"
                >
                  <ChevronRight className="w-6 h-6 text-black" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Chi tiết bài học */}
        {selectedLesson && currentLessonData && (
          <div className="max-w-7xl mx-auto">
            <div className="w-full flex flex-col items-center gap-4 mb-12">
              <button
                onClick={() => setSelectedLesson(null)}
                className="glass-pill-button"
              >
                Quay lại tất cả bài học
              </button>
            </div>

            <h1 className="text-5xl hero-text-glow text-white text-center animate-fade-in mb-12">
              Bài {selectedLesson}: {currentLessonData.title}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">
              {paginatedGrammar.map((g, i) => {
                const pointIndex = (grammarPage - 1) * GRAMMAR_PER_PAGE + i;
                const isExpanded = expandedExamples.includes(pointIndex);

                return (
                  <div key={i} className="glassmorphism-hover-card">
                    <h4 className="large-purple-heading text-center mb-6">
                      {g.title}
                    </h4>

                    <div className="subtle-gradient-panel mb-6">
                      <p className="pink-bold-label">Ý NGHĨA</p>
                      <p className="large-bold-text">{g.meaning}</p>
                    </div>

                    {/* Giải thích - có toggle ẩn/hiện */}
                    <button
                      onClick={() => toggleSection(pointIndex, "explanation")}
                      className="interactive-gradient-row-spaced"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="icon-indigo-standard" />
                        <span className="purple-heading-bold">
                          Giải thích chi tiết
                        </span>
                      </div>
                      <ChevronDown
                        className={`icon-purple-transition ${
                          expandedSections[pointIndex]?.explanation
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>

                    {expandedSections[pointIndex]?.explanation && (
                      <div className="subtle-purple-card animate-fade-in mb-8">
                        <p className="preformatted-text-large whitespace-pre-line">
                          {g.explanation}
                        </p>
                      </div>
                    )}

                    {/* Nút toggle ví dụ */}
                    <button
                      onClick={() => toggleExample(pointIndex)}
                      className="gradient-interactive-row"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="icon-yellow-highlight" />
                        <span className="purple-heading-bold">Ví dụ</span>
                      </div>
                      <ChevronDown
                        className={`icon-purple-transition ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Ví dụ - chỉ hiện khi expanded */}
                    {isExpanded && (
                      <div className="space-y-6 animate-fade-in">
                        {g.examples.map((ex, j) => (
                          <div key={j} className="interactive-white-card">
                            <div
                              className="section-title-style"
                              dangerouslySetInnerHTML={{ __html: ex.japanese }}
                            />
                            <div
                              className="flex-text-style font-medium"
                              dangerouslySetInnerHTML={{
                                __html: ex.vietnamese,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="footer-flex-bar">
                      <span className="wiggle-title">🐾</span>
                      <span className="wiggle-title">🐾</span>
                      <span className="wiggle-title">🐾</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phân trang ngữ pháp */}
            {currentLessonData.grammar.length > GRAMMAR_PER_PAGE && (
              <div className="flex justify-center items-center gap-6 mt-16">
                <button
                  onClick={() => setGrammarPage((p) => Math.max(1, p - 1))}
                  disabled={grammarPage === 1}
                  className="custom-button"
                >
                  <ChevronLeft className="w-6 h-6 text-black" />
                </button>

                <div className="flex gap-3 items-center">
                  {Array.from(
                    {
                      length: Math.ceil(
                        currentLessonData.grammar.length / GRAMMAR_PER_PAGE,
                      ),
                    },
                    (_, i) => (
                      <button
                        key={i}
                        onClick={() => setGrammarPage(i + 1)}
                        className={`rounded-full transition-all duration-200 flex items-center justify-center ${
                          grammarPage === i + 1
                            ? "custom-element"
                            : "button-icon-effect"
                        }`}
                      >
                        {grammarPage === i + 1 ? i + 1 : ""}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() =>
                    setGrammarPage((p) =>
                      Math.min(
                        p + 1,
                        Math.ceil(
                          currentLessonData.grammar.length / GRAMMAR_PER_PAGE,
                        ),
                      ),
                    )
                  }
                  disabled={
                    grammarPage * GRAMMAR_PER_PAGE >=
                    currentLessonData.grammar.length
                  }
                  className="circular-icon-button"
                >
                  <ChevronRight className="w-6 h-6 text-black" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Phần hình con mèo */}
      <DraggableFloatingNeko
        storageKey="floating-neko-grammar"
        onClick={handleNekoClick}
        imageClassName="rounded-full object-cover shadow-2xl animate-fly drop-shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
        imageStyle={{
          filter: "drop-shadow(0 10px 20px rgba(255, 182, 233, 0.4))",
        }}
        title={
          selectedLesson
            ? "Làm bài test cho bài học này!"
            : "Chọn bài học để làm test"
        }
      />

      {/* Modal Mini Test */}
      <MiniTestModal
        isOpen={showMiniTestModal}
        onClose={() => setShowMiniTestModal(false)}
        lessonId={selectedLesson || 0}
        lessonTitle={currentLessonData?.title || ""}
        userId={userId}
        onSuccess={handleMiniTestSuccess}
        onError={handleMiniTestError}
      />

      {/* Modal thành công */}
      {showSuccessModal && submissionData && (
        <div
          className={`modal-overlay success-overlay ${isClosingSuccessModal ? "fade-out" : ""}`}
        >
          <div className="submission-success-modal">
            <div className="success-icon-container">
              <CheckCircle2 className="success-icon" />
            </div>
            <h2 className="success-title">Đã gửi bài thành công!</h2>
            <p className="success-message">
              Chờ phản hồi từ admin nhé. Mèo sẽ thông báo cho bạn khi có kết
              quả.
            </p>
            <div className="success-stats">
              <div className="stat-item">
                <span className="stat-label">Bài học:</span>
                <span className="stat-value">#{submissionData.lessonId}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Thời gian làm:</span>
                <span className="stat-value">
                  {formatTime(submissionData.timeSpent)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Số nhóm câu:</span>
                <span className="stat-value">
                  {submissionData.questionCount}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsClosingSuccessModal(true);
                setTimeout(() => {
                  setShowSuccessModal(false);
                  setIsClosingSuccessModal(false);
                  setSubmissionData(null);
                }, 300);
              }}
              className="close-success-button"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal lỗi */}
      {showErrorModal && (
        <div
          className={`modal-overlay error-overlay ${isClosingErrorModal ? "fade-out" : ""}`}
        >
          <div className="submission-error-modal">
            <div className={`error-icon-container ${errorType}`}>
              {errorType === "validation" ? (
                <AlertCircle className="error-icon" />
              ) : (
                <AlertTriangle className="error-icon" />
              )}
            </div>
            <h2 className="error-title">
              {errorType === "validation" ? "Thiếu thông tin" : "Có lỗi xảy ra"}
            </h2>
            <p className="error-message">{errorMessage}</p>

            {errorType === "validation" && (
              <div className="error-hint">
                <p>
                  💡 <strong>Mẹo:</strong> Hãy kiểm tra lại tất cả các ô trống
                  và chọn đáp án.
                </p>
              </div>
            )}

            {errorType === "server" && (
              <div className="error-hint">
                <p>
                  <strong>Khắc phục:</strong> Kiểm tra kết nối mạng và thử lại.
                </p>
              </div>
            )}

            {errorType === "timeout" && (
              <div className="error-hint">
                <p>
                  ⏱<strong>Timeout:</strong> Request mất quá nhiều thời gian.
                  Vui lòng thử lại.
                </p>
              </div>
            )}

            <div className="error-actions">
              <button
                onClick={() => {
                  setIsClosingErrorModal(true);
                  setTimeout(() => {
                    setShowErrorModal(false);
                    setIsClosingErrorModal(false);
                    setErrorMessage("");
                  }, 300);
                }}
                className="error-button primary"
              >
                {errorType === "validation"
                  ? "Tiếp tục làm bài"
                  : errorType === "timeout"
                    ? "Thử lại"
                    : "Hiểu rồi"}
              </button>
              {errorType === "server" && (
                <button
                  onClick={() => {
                    setIsClosingErrorModal(true);
                    setTimeout(() => {
                      setShowErrorModal(false);
                      setIsClosingErrorModal(false);
                      setErrorMessage("");
                    }, 300);
                  }}
                  className="error-button secondary"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fly {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) rotate(2deg);
          }
          50% {
            transform: translateY(-5px) rotate(0deg);
          }
          75% {
            transform: translateY(-10px) rotate(-2deg);
          }
        }
        
        .animate-fly {
          animation: fly 4s ease-in-out infinite;
        }

        .icon-yellow-highlight {
          width: 1.5rem;
          height: 1.5rem;
          color: #eab308;
        }
        
        .icon-indigo-standard {
          width: 1.5rem;
          height: 1.5rem;
          color: #6366f1;
        }
        
        .icon-purple-transition {
          width: 2rem;
          height: 2rem;
          color: #9333ea;
          transition-property: transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
        
        .interactive-gradient-row-spaced {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background-image: linear-gradient(to right, #fce7f6, #ede9fe);
          border-radius: 1rem;
          transition: all 150ms ease-in-out;
          margin-bottom: 1.5rem;
          cursor: pointer;
          border: none;
        }
        
        .interactive-gradient-row-spaced:hover {
          background-image: linear-gradient(to right, #fbcfe8, #ddd6fe);
          transform: translateY(-2px);
        }
        
        .purple-heading-bold {
          font-size: 1.5rem;
          line-height: 2rem;
          font-weight: 700;
          color: #7e22ce;
        }
        
        @keyframes wiggle {
          0%, 100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }
        
        .wiggle-title {
          font-size: 2.25rem;
          animation: wiggle 1s ease-in-out infinite;
        }
        
        .full-page-dark-gradient-center {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: linear-gradient(to bottom right, #581c87, #831843);
        }
        
        .subtle-purple-card {
          background-color: rgba(243, 232, 255, 0.5);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
        }
        
        .button-icon-effect {
          background-color: rgba(255, 255, 255, 0.9);
          width: 1.5rem;
          height: 1.5rem;
          transition: transform 150ms ease-in-out;
        }
        
        .custom-element {
          background-color: #f472b6;
          color: #ffffff;
          padding-left: 1rem;
          padding-right: 1rem;
          height: 2.5rem;
          font-weight: 700;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        }
        
        .gradient-interactive-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          padding-bottom: 1rem;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          background-image: linear-gradient(to right, #fce7f6, #ede9fe);
          border-radius: 1rem;
          transition: all 150ms ease-in-out;
          margin-bottom: 1.5rem;
        }
        
        .gradient-interactive-row:hover {
          background-image: linear-gradient(to right, #fbcfe8, #ddd6fe);
        }
        
        .preformatted-text-large {
          font-size: 1.875rem;
          color: #1f2937;
          line-height: 1.625;
          white-space: pre-line;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        
        .full-bounce-pink-element {
          position: relative;
          width: 100%;
          height: 100%;
          color: #ec4899;
          animation: bounce 1s infinite;
          filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
        }
        
        .footer-flex-bar {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #f3e8ff;
        }
        
        .flex-text-style {
          font-size: 1.25rem;
          line-height: 1.75rem;
          color: #4b5563;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .section-title-style {
          font-size: 1.875rem;
          font-weight: 900;
          color: #1f2937;
          margin-bottom: 0.75rem;
          line-height: 1.625;
        }
        
        .interactive-white-card {
          background-color: #ffffff;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -4px rgba(0, 0, 0, 0.1);
          border: 2px solid #fbcfe8;
          transition: all 300ms ease-in-out;
        }
        
        .interactive-white-card:hover {
          border-color: #ec4899;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 8px 10px -6px rgba(0, 0, 0, 0.1);
          transform: translateY(-0.25rem);
        }
        
        .large-bold-text {
          font-size: 2rem;
          line-height: 2rem;
          font-weight: 700;
          color: #1f2937;
        }
        
        .pink-bold-label {
          font-size: 1.45rem;
          line-height: 1.25rem;
          font-weight: 700;
          color: #be185d;
          margin-bottom: 0.5rem;
        }
        
        .subtle-gradient-panel {
          background-image: linear-gradient(to right, #fce7f3, #f3e8ff);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -2px rgba(0, 0, 0, 0.1);
        }
        
        .large-purple-heading {
          font-size: 2.875rem;
          line-height: 2.25rem;
          font-weight: 900;
          color: #6d28d9;
          letter-spacing: -0.025em;
        }
        
        .glassmorphism-hover-card {
          background-color: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 2rem;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 4px solid #e9d5ff;
          transition: all 500ms ease-in-out;
        }
        
        .glassmorphism-hover-card:hover {
          border-color: #f472b6;
          transform: scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 10px 15px -3px rgba(236, 72, 153, 0.3),
            0 4px 6px -4px rgba(236, 72, 153, 0.3);
        }
        
        .glass-pill-button {
          padding: 1rem 2rem;
          background-color: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 9999px;
          color: #000000;
          font-weight: 700;
          transition: background-color 300ms ease-in-out;
        }
        
        .glass-pill-button:hover {
          background-color: rgba(255, 255, 255, 0.6);
        }
        
        .interactive-blur-card {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 2rem;
          background-color: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 4px solid #d8b4fe;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          transition: all 500ms ease-in-out;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        
        .interactive-blur-card:hover {
          border-color: #ec4899;
          transform: scale(1.1);
        }
        
        .hero-title-style {
          position: relative;
          display: block;
          padding-left: 2.5rem;
          padding-right: 2.5rem;
          padding-top: 2rem;
          padding-bottom: 2rem;
          font-size: 3.75rem;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.05em;
          color: #ffffff;
          filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5),
            0 0 20px rgba(255, 255, 255, 0.3);
          transform: translateY(-0.75rem);
          animation: pulse-soft 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @media (min-width: 768px) {
          .hero-title-style {
            padding-left: 3.5rem;
            padding-right: 3.5rem;
            padding-top: 2.5rem;
            padding-bottom: 2.5rem;
            font-size: 4.5rem;
            transform: translateY(-1rem);
          }
        }
        
        @media (min-width: 1024px) {
          .hero-title-style {
            padding-left: 5rem;
            padding-right: 5rem;
            padding-top: 3rem;
            padding-bottom: 3rem;
            font-size: 8rem;
            transform: translateY(-1.25rem);
          }
        }
        
        .subtle-gradient-background-relative {
          min-height: 100vh;
          position: relative;
          background-attachment: fixed;
        }
        
        @keyframes pulse-soft {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
        
        .hero-text-glow {
          text-shadow: 0 0 20px #ff69b4, 0 0 40px #a020f0, 0 0 60px #00ffff,
            0 0 80px #ff69b4, 0 0 100px #a020f0, 0 4px 20px rgba(0, 0, 0, 0.9);
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.8));
        }
        
        .custom-button {
          padding: 1rem 1.25rem;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.9);
          transition: all 150ms ease-in-out;
        }
        
        .custom-button:hover {
          background-color: #fecaca;
          transform: scale(1.03);
        }
        
        .custom-button:disabled {
          opacity: 0.5;
        }
        
        .button-icon-effect {
          background-color: rgba(255, 255, 255, 0.9);
          width: 1.5rem;
          height: 1.5rem;
          transition: transform 150ms ease-in-out;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        @media (min-width: 768px) {
          .button-icon-effect {
            width: 2rem;
            height: 2rem;
          }
        }
        
        .button-icon-effect:hover {
          transform: scale(1.1);
        }
        
        @media (min-width: 768px) {
          .custom-element {
            height: 3rem;
          }
        }
        
        .circular-icon-button {
          padding: 0.75rem;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.3);
          transition: all 150ms ease-in-out;
        }
        
        .circular-icon-button:hover {
          background-color: #fecaca;
          transform: scale(1.05);
        }
        
        .circular-icon-button:disabled {
          opacity: 0.5;
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          padding: 1rem;
          animation: fadeIn 0.3s ease-out;
        }
        
        .success-overlay, .error-overlay {
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
        
        .submission-success-modal {
          background: white;
          border-radius: 1.5rem;
          padding: 2.5rem;
          max-width: 32rem;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
          animation: slideInUp 0.4s ease-out;
        }
        
        .success-icon-container {
          width: 5rem;
          height: 5rem;
          background: #dcfce7;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 1.5rem;
        }
        
        .success-icon {
          width: 2.5rem;
          height: 2.5rem;
          color: #16a34a;
        }
        
        .success-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 1rem;
        }
        
        .success-message {
          color: #6b7280;
          margin-bottom: 2rem;
          line-height: 1.5;
          font-size: 1.125rem;
        }
        
        .success-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        
        .stat-value {
          font-size: 1.25rem;
          font-weight: bold;
          color: #7c3aed;
        }
        
        .close-success-button {
          width: 100%;
          padding: 0.875rem;
          background: #111827;
          color: white;
          border-radius: 0.75rem;
          font-weight: bold;
          transition: background-color 0.2s;
          border: none;
          cursor: pointer;
        }
        
        .close-success-button:hover {
          background: #1f2937;
        }
        
        .submission-error-modal {
          background: white;
          border-radius: 1.5rem;
          padding: 2.5rem;
          max-width: 36rem;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
          animation: slideInUp 0.4s ease-out;
        }
        
        .error-icon-container {
          width: 5rem;
          height: 5rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 1.5rem;
        }
        
        .error-icon-container.validation {
          background: #fef3c7;
          border: 2px solid #f59e0b;
        }
        
        .error-icon-container.server {
          background: #fee2e2;
          border: 2px solid #ef4444;
        }
        
        .error-icon-container.timeout {
          background: #f3f4f6;
          border: 2px solid #6b7280;
        }
        
        .error-icon {
          width: 2.5rem;
          height: 2.5rem;
        }
        
        .error-icon-container.validation .error-icon {
          color: #d97706;
        }
        
        .error-icon-container.server .error-icon {
          color: #dc2626;
        }
        
        .error-icon-container.timeout .error-icon {
          color: #6b7280;
        }
        
        .error-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 1rem;
        }
        
        .error-message {
          color: #6b7280;
          margin-bottom: 1.5rem;
          line-height: 1.5;
          background: #f9fafb;
          padding: 1rem;
          border-radius: 0.75rem;
          border-left: 4px solid #e5e7eb;
          text-align: left;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .error-hint {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }
        
        .error-hint p {
          margin: 0;
          color: #0369a1;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .error-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .error-button {
          flex: 1;
          padding: 0.875rem;
          border-radius: 0.75rem;
          font-weight: bold;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }
        
        .error-button.primary {
          background: #111827;
          color: white;
        }
        
        .error-button.primary:hover {
          background: #1f2937;
          transform: translateY(-2px);
        }
        
        .error-button.secondary {
          background: white;
          color: #111827;
          border: 2px solid #e5e7eb;
        }
        
        .error-button.secondary:hover {
          background: #f9fafb;
          border-color: #d1d5db;
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
      `}</style>
    </div>
  );
}
