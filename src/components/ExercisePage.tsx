// src/components/ExercisePage.tsx
import { useState, useEffect, useRef } from "react";
import { NekoLoading } from "./NekoLoading";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

interface Question {
  id: number;
  displayOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation?: string;
}

interface Exercise {
  id: number;
  title: string;
  description: string;
  lessonNumber: number;
  totalQuestions: number;
  questions: Question[];
}

interface SubmitExerciseRequest {
  correctAnswers: number;
  totalQuestions: number;
  difficultyLevel: number;
  exerciseType: string;
  exerciseId: number;
  exerciseTitle?: string;
}

interface ExerciseResult {
  userId: number;
  pointsEarned: number;
  totalPoints: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  levelInfo: LevelInfo;
  streak: number;
  message: string;
}

interface LevelInfo {
  currentLevel: number;
  totalPoints: number;
  nextLevelPoints: number;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressToNextLevel: number;
  exercisesNeededForNextLevel: number;
}

export function ExercisePage({
  onNavigate,
  category = "vocabulary",
  level = "n5",
}: {
  onNavigate: (page: string) => void;
  category?: string;
  level?: string;
}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const hasShownToast = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user: authUser, updateUser, refreshUser } = useAuth();
  const isAuthenticated = !!authUser;

  // Phân trang danh sách bài tập
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const totalPages = Math.ceil(exercises.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentExercises = exercises.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Fetch danh sách bài tập theo category + level
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const endpoint = `/exercises/${category}/${level}`;

        //Loading
        await new Promise((resolve) => setTimeout(resolve, 600));
        const res = await api.get(endpoint);
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setExercises(res.data);
        } else {
          setExercises([]);
          toast(
            "Bài tập này sẽ sớm ra mắt nhé! Mèo đang chuẩn bị rất kỹ đây 😺",
            { icon: "⏳", duration: 1000 },
          );
        }
      } catch (err: any) {
        console.error("❁ELỗi tải bài tập:", err);
        if (err.response?.status === 401) {
          toast.error(
            "Phiên đăng nhập hết hạn rồi... Mèo đưa bạn về đăng nhập nhé 😿",
            { duration: 6000 },
          );
          setTimeout(() => onNavigate("login"), 3000);
        } else {
          toast.error("Không tải được bài tập. Mèo đang kiểm tra lại... 😿");
        }
      } finally {
        setTimeout(() => setIsLoading(false), 600);
      }
    };

    fetchExercises();
  }, [category, level, onNavigate]);

  // Reset toast khi rời trang
  useEffect(() => {
    return () => {
      hasShownToast.current = false;
    };
  }, []);

  const handleExerciseSelect = async (exerciseId: number) => {
    // Sử dụng toast.promise đềEchềEcó 1 toast duy nhất (loading →success hoặc error)
    await toast.promise(
      api.get(`/exercises/${exerciseId}`),
      {
        loading: "Mèo đang chuẩn bị bài tập... 🐱",
        success: (res) => {
          const exercise: Exercise = res.data;
          if (!exercise.questions || exercise.questions.length === 0) {
            throw new Error("no_questions");
          }
          const shuffled = [...exercise.questions].sort(
            () => Math.random() - 0.5,
          );
          setSelectedExercise(exercise);
          setShuffledQuestions(shuffled);
          setUserAnswers(new Array(shuffled.length).fill(null));
          setShowResult(false);
          setScore(0);
          return `Sẵn sàng làm bài "${exercise.title}" rồi! 🎉`;
        },
        error: (err: any) => {
          if (err.message === "no_questions") {
            return "Bài tập này chưa có câu hỏi. Mèo sẽ bổ sung sớm nhé! 😿";
          }
          return "Không tải được bài tập này. Mèo đang kiểm tra lại... 😿";
        },
      },
      {
        success: { duration: 1000 },
        error: { duration: 3000 },
      },
    );
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    let correctCount = 0;
    shuffledQuestions.forEach((q, i) => {
      const correctIndex = ["A", "B", "C", "D"].indexOf(q.correctOption);
      if (userAnswers[i] === correctIndex) correctCount++;
    });

    setScore(correctCount);
    setShowResult(true);

    toast.success(
      `Nộp bài thành công! Bạn được ${correctCount}/${shuffledQuestions.length} điểm! 🎉`,
      { duration: 2000 },
    );

    if (authUser?.id && selectedExercise) {
      await submitExerciseResults(correctCount, shuffledQuestions.length);
    } else {
      toast(
        "Bạn chưa đăng nhập. Kết quả sẽ không được lưu. Hãy đăng nhập đềEnhận điểm nhé! 😺",
        {
          icon: "🔒",
          duration: 4000,
        },
      );
    }
  };

  const handleRetry = () => {
    if (selectedExercise) {
      const shuffled = [...selectedExercise.questions].sort(
        () => Math.random() - 0.5,
      );
      setShuffledQuestions(shuffled);
      setUserAnswers(new Array(selectedExercise.questions.length).fill(null));
      setShowResult(false);
      setScore(0);
    }
  };

  const handleBackToList = () => {
    setSelectedExercise(null);
    setShowResult(false);
    setCurrentPage(1);
  };

  const getScoreMessage = (score: number, total: number) => {
    const ratio = score / total;
    if (ratio <= 0.3) return "Cố lên nào mèo con ơi 😿";
    if (ratio <= 0.6) return "Khá lắm rồi, cố lên chút nữa 💪";
    if (ratio <= 0.9) return "Giỏi quá đi 😸";
    return "Tuyệt vời! Mèo tự hào vềEbạn 🎉";
  };

  const getScoreEmoji = (score: number, total: number) => {
    const ratio = score / total;
    if (ratio <= 0.3) return "😿";
    if (ratio <= 0.6) return "😼";
    if (ratio <= 0.9) return "😸";
    return "😻";
  };

  const determineDifficultyLevel = (
    category: string,
    level: string,
  ): number => {
    const levelMap: Record<string, number> = {
      n5: 1,
      n4: 2,
      n3: 3,
      n2: 4,
      n1: 5,
    };

    const baseDifficulty = levelMap[level.toLowerCase()] || 1;
    return category === "grammar" ? baseDifficulty + 1 : baseDifficulty;
  };

  const submitExerciseResults = async (
    correctCount: number,
    totalQuestions: number,
  ) => {
    if (!authUser?.id || !selectedExercise) {
      toast.error("Không thể lưu kết quả. Vui lòng đăng nhập lại! 🔒");
      return null;
    }

    setIsSubmitting(true);
    const submissionToast = toast.loading("Đang lưu kết quả... ⏳");

    try {
      const difficultyLevel = determineDifficultyLevel(category, level);

      const request: SubmitExerciseRequest = {
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        difficultyLevel: difficultyLevel,
        exerciseType: category.toUpperCase(),
        exerciseId: selectedExercise.id,
        // THÊM exerciseTitle nếu backend cần
        exerciseTitle: selectedExercise.title || `Bài tập ${category} ${level}`,
      };

      const response = await api.post("/exercises/submit", request);
      const result: ExerciseResult = response.data.data;

      // Toast level up hoặc normal
      if (result.leveledUp) {
        toast.success(
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">🎉 LEVEL UP! 🎉</div>
            <div className="text-lg mb-1">
              Level {result.oldLevel} →Level {result.newLevel}
            </div>
            <div className="text-sm">
              +{result.pointsEarned} điểm • Tổng: {result.totalPoints} điểm
            </div>
            <div className="text-xs mt-2">{result.message}</div>
          </div>,
          { duration: 5000 },
        );
      } else {
        toast.success(
          <div className="text-center">
            <div className="text-lg font-bold">✁EHoàn thành bài tập!</div>
            <div>
              +{result.pointsEarned} điểm • Tổng: {result.totalPoints} điểm
            </div>
          </div>,
          { duration: 3000 },
        );
      }

      // === REAL-TIME UPDATE CONTEXT ===
      updateUser({
        points: result.totalPoints,
        level: result.newLevel,
        streak: result.streak,
      });

      // Thử query logs ngay sau khi submit
      setTimeout(async () => {
        try {
          console.log("[DEBUG] Checking activity logs after 2 seconds...");
          // Có thể gọi API để lấy logs mới nhất
          // const logsResponse = await api.get("/admin/activity-logs");
          // console.log("[DEBUG] Latest logs:", logsResponse.data);
        } catch (logErr) {
          console.error("[DEBUG] Error checking logs:", logErr);
        }
      }, 2000);

      //Refresh full data từ backend đồng bộ chắc chắn
      await refreshUser();
      return result;
    } catch (error: any) {
      console.error("❁Lỗi khi lưu kết quả:", error);

      // DEBUG chi tiết
      if (error.response) {
        console.error("[DEBUG] Error response status:", error.response.status);
        console.error("[DEBUG] Error response data:", error.response.data);
        console.error(
          "[DEBUG] Error response headers:",
          error.response.headers,
        );
      }

      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        setTimeout(() => onNavigate("login"), 2000);
      } else {
        toast.error("Không thể lưu kết quả bài tập. Vui lòng thử lại!");
      }
      return null;
    } finally {
      setIsSubmitting(false);
      toast.dismiss(submissionToast);
    }
  };

  if (isLoading && !selectedExercise) {
    return <NekoLoading message="Mèo đang chuẩn bị bài tập..." />;
  }

  return (
    <div className="min-h-screen relative">
      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Header động theo category + level */}
        <div className="text-center mb-16 animate-bounce-in">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-6xl animate-float-custom">📝</span>
            <h1 className="header-title">
              Bài Tập {category === "grammar" ? "Ngữ Pháp" : "Từ Vựng"}{" "}
              {level.toUpperCase()}
            </h1>
            <span
              className="text-6xl animate-float-custom"
              style={{ animationDelay: "0.5s" }}
            >
              ✨
            </span>
          </div>
          <p className="header-subtitle">
            Làm bài trắc nghiệm đềEcủng cố{" "}
            <span className="text-highlight-pink">
              {category === "grammar" ? "ngữ pháp" : "từ vựng"}
            </span>{" "}
            {level.toUpperCase()} cùng mèo nhé!
          </p>

          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              isAuthenticated
                ? "bg-green-500/20 text-green-300"
                : "bg-red-500/20 text-red-300"
            }`}
          ></div>
        </div>

        {/* Danh sách bài tập với phân trang */}
        {!selectedExercise && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="main-glass-container">
              <div className="flex items-center gap-4">
                <span className="text-5xl">📚</span>
                <h2 className="exercise-title">
                  Bài tập{" "}
                  {category === "grammar"
                    ? "Ngữ pháp"
                    : category === "kanji"
                      ? "Kanji"
                      : "Từ vựng"}{" "}
                  {level.toUpperCase()}
                </h2>
              </div>
              <p className="exercise-meta">
                Tổng cộng{" "}
                <span className="text-accent-purple">{exercises.length}</span>{" "}
                bài • Trang {currentPage}/{totalPages}
              </p>
            </div>

            <div className="space-y-4">
              {currentExercises.length === 0 ? (
                <p className="text-center text-white text-xl py-20">
                  Chưa có bài tập nào cho phần này 😿
                </p>
              ) : (
                currentExercises.map((ex, idx) => (
                  <button
                    key={ex.id}
                    onClick={() => handleExerciseSelect(ex.id)}
                    className="glass-card-item group"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="fbadge-icon">
                        <span className="text-xl">{ex.lessonNumber}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="exercise-card-title">{ex.title}</h3>
                        <p className="exercise-card-desc">{ex.description}</p>
                        <div className="exercise-card-meta">
                          <span>📝 {ex.totalQuestions || 10} câu hỏi</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-16">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="circular-icon-button"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                <div className="flex gap-3 items-center">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => goToPage(i + 1)}
                      className={`rounded-full transition-all duration-200 flex items-center justify-center w-12 h-12 text-lg font-bold ${
                        currentPage === i + 1
                          ? "custom-element"
                          : "button-icon-effect"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="circular-icon-button"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Làm bài */}
        {selectedExercise && !showResult && (
          <div className="max-w-4xl mx-auto">
            <button onClick={handleBackToList} className="glass-button-back">
              <ArrowLeft className="back-icon" />
              <span>Quay lại danh sách</span>
            </button>

            <div className="exercise-header-card">
              <h2 className="text-4xl mb-3 drop-shadow-lg">
                {selectedExercise.title}
              </h2>
              <p className="text-black text-2xl leading-relaxed">
                {selectedExercise.description}
              </p>
              <div className="mt-6 flex items-center gap-4 text-xl">
                <span>📝 {shuffledQuestions.length} câu hỏi</span>
                <span>•</span>
                <span>
                  ✁E{userAnswers.filter((a) => a !== null).length}/
                  {shuffledQuestions.length} đã trả lời
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {shuffledQuestions.map((question, qIndex) => {
                const correctIndex = ["A", "B", "C", "D"].indexOf(
                  question.correctOption,
                );
                return (
                  <div
                    key={question.id}
                    className="question-card"
                    style={{ animationDelay: `${qIndex * 0.05}s` }}
                  >
                    <div className="question-row">
                      <div className="circle-badge">
                        <span className="text-lg">{qIndex + 1}</span>
                      </div>
                      <h3 className="question-text">{question.questionText}</h3>
                    </div>

                    <div className="space-y-3 ml-16">
                      {[
                        { text: question.optionA, key: "A" },
                        { text: question.optionB, key: "B" },
                        { text: question.optionC, key: "C" },
                        { text: question.optionD, key: "D" },
                      ].map(({ text, key }, oIndex) => {
                        const isSelected =
                          userAnswers.length > qIndex &&
                          userAnswers[qIndex] === oIndex;

                        return (
                          <button
                            key={key}
                            onClick={() => handleAnswerSelect(qIndex, oIndex)}
                            className={`option-button ${
                              isSelected
                                ? "option-selected"
                                : "exercise-card-item"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`check-circle ${
                                  isSelected
                                    ? "check-circle-selected"
                                    : "check-circle-default"
                                }`}
                              >
                                {isSelected && <div className="inner-dot" />}
                              </div>
                              <span className="option-text">{text}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={userAnswers.some((a) => a === null) || isSubmitting}
                className="submit-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    <span className="font-bold">Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="check-icon" />
                    <span className="font-bold">Nộp bài</span>
                  </>
                )}
              </button>
            </div>

            {!isAuthenticated && (
              <div className="mt-4 text-center text-yellow-300 text-sm">
                Bạn chưa đăng nhập. Kết quả sẽ không được lưu!
              </div>
            )}
          </div>
        )}

        {/* Kết quả */}
        {showResult && selectedExercise && (
          <div className="max-w-2xl mx-auto">
            <div className="result-card">
              <div className="score-display">
                {getScoreEmoji(score, selectedExercise.questions.length)}
              </div>
              <h2 className="result-title">Kết quả của bạn</h2>
              <div className="mb-6">
                <span className="result-score">
                  {score}/{selectedExercise.questions.length}
                </span>
              </div>
              <p className="result-message">
                {getScoreMessage(score, selectedExercise.questions.length)}
              </p>

              {!isAuthenticated && (
                <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    Kết quả chưa được lưu vì bạn chưa đăng nhập
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-6 mt-10">
                <button onClick={handleRetry} className="action-button">
                  <RotateCcw className="w-6 h-6" />
                  <span className="text-xl font-bold">Làm lại</span>
                </button>
                <button
                  onClick={handleBackToList}
                  className="action-button-secondary"
                >
                  <List className="w-6 h-6" />
                  <span className="text-xl font-bold">Danh sách</span>
                </button>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <h3 className="result-header">Chi tiết câu trả lời ✨</h3>
              {shuffledQuestions.map((question, index) => {
                const userAnswerIndex = userAnswers[index];
                const correctIndex = ["A", "B", "C", "D"].indexOf(
                  question.correctOption,
                );
                const isCorrect = userAnswerIndex === correctIndex;

                const optionTexts = [
                  question.optionA,
                  question.optionB,
                  question.optionC,
                  question.optionD,
                ];

                return (
                  <div
                    key={question.id}
                    className={`review-card ${
                      isCorrect ? "card-correct" : "card-wrong"
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`index-badge ${
                          isCorrect ? "bg-correct-soft" : "bg-wrong-soft"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle className="icon-correct" />
                        ) : (
                          <XCircle className="icon-wrong" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-black text-2xl mb-4 drop-shadow-lg">
                          {question.questionText}
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl font-medium text-gray-600">
                              Bạn chọn:
                            </span>
                            <span
                              className={`answer-badge-2xl ${
                                isCorrect
                                  ? "answer-badge-correct-2xl"
                                  : "answer-badge-wrong-2xl"
                              }`}
                            >
                              {userAnswerIndex !== null
                                ? optionTexts[userAnswerIndex]
                                : "Chưa chọn"}
                            </span>
                          </div>

                          {!isCorrect && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="label-correct-text">
                                Đáp án đúng:
                              </span>
                              <span className="answer-badge-3xl">
                                {optionTexts[correctIndex]}
                              </span>
                            </div>
                          )}

                          {question.explanation && (
                            <div className="explanation-box">
                              <p className="explanation-content">
                                <span className="explanation-title">
                                  💡 Giải thích:
                                </span>
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-10 right-10 pointer-events-none z-50 hidden lg:block">
        <img
          src="https://i.pinimg.com/1200x/8c/98/00/8c9800bb4841e7daa0a3db5f7db8a4b7.jpg"
          alt="Flying Neko"
          className="w-40 h-40 rounded-full object-cover shadow-2xl animate-fly drop-shadow-2xl"
          style={{
            filter: "drop-shadow(0 10px 20px rgba(255, 182, 233, 0.4))",
          }}
        />
      </div>
      {/* CSS giữ nguyên đẹp lung linh */}
      <style>{`
           .circular-icon-button {
  /* p-4 */
  padding: 1rem; /* 16px */
  
  /* rounded-full */
  border-radius: 9999px; 
  
  /* bg-white/30 */
  background-color: rgba(255, 255, 255, 0.3); 
  
  /* transition và transform */
  transition: all 150ms ease-in-out; /* Giá trềEmặc định cho transition */
}

/* md:p-5 */
@media (min-width: 768px) {
  .circular-icon-button {
    padding: 1.25rem; /* 20px */
  }
}

/* hover:bg-pink-200, hover:scale-105 */
.circular-icon-button:hover {
  background-color: #fecaca; /* pink-200 */
  transform: scale(1.05);
}

/* disabled:opacity-50 */
.circular-icon-button:disabled {
  opacity: 0.5;
}
            .button-icon-effect {
  /* bg-white/90 */
  background-color: rgba(255, 255, 255, 0.9);
  
  /* w-6 */
  width: 1.5rem; /* 24px */
  
  /* h-6 */
  height: 1.5rem; /* 24px */
  
  /* transition (Thêm vào đềEhiệu ứng scale mượt mà) */
  transition: transform 150ms ease-in-out; 
}

/* md:w-8 và md:h-8 */
@media (min-width: 768px) {
  .button-icon-effect {
    width: 2rem; /* 32px */
    height: 2rem; /* 32px */
  }
}

/* hover:scale-110 */
.button-icon-effect:hover {
  transform: scale(1.1);
}
           .custom-element {
  /* bg-pink-400 */
  background-color: #f472b6; 
  
  /* text-white */
  color: #ffffff; 
  
  /* px-4 */
  padding-left: 1rem;  /* 16px */
  padding-right: 1rem; /* 16px */
  
  /* h-10 */
  height: 2.5rem; /* 40px */
  
  /* font-bold */
  font-weight: 700; 
  
  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); 
}

/* md:h-12 */
@media (min-width: 768px) {
  .custom-element {
    height: 3rem; /* 48px */
  }
}
      .bubble-item {
  /* Kích thước & Hình dạng */
  width: 3rem;                /* w-12 */
  height: 3rem;               /* h-12 */
  border-radius: 9999px;      /* rounded-full */
  
  /* Font & Layout */
  display: flex;              /* flex */
  align-items: center;        /* items-center */
  justify-content: center;   /* justify-center */
  font-size: 1.125rem;        /* text-lg */
  font-weight: 700;           /* font-bold */
  
  /* Hiệu ứng chuyển cảnh */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); /* duration-200 */
  
  /* Chống răng cưa khi xoay hoặc phóng to */
  -webkit-font-smoothing: antialiased;
  cursor: pointer;
  user-select: none;
}

/* Hiệu ứng tương tác mặc định */
.bubble-item:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.bubble-item:active {
  transform: scale(0.9);
}
            .custom-button {
  /* p-4 */
  padding: 1rem; 
  
  /* rounded-full */
  border-radius: 9999px; 
  
  /* bg-white/30 */
  background-color: rgba(255, 255, 255, 0.3); 
  
  /* transition */
  transition: all 150ms ease-in-out; /* Giá trềEmặc định cho transition */
  
  /* transform */
  /* ChềElà một lớp đánh dấu, không thêm thuộc tính CSS riêng biệt */
}
      /* Tiêu đềEbài tập nhềE*/
.exercise-card-title {
  /* text-2xl */
  font-size: 1.5rem;
  font-weight: 800;
  /* Dùng Gray-900 thay vì Black thuần đềEtinh tế hơn */
  color: #111827; 
  margin-bottom: 0.5rem;
  /* Shadow nhẹ đềEnổi khối, không làm nhòe chữ */
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05));
}

/* Mô tả ngắn */
.exercise-card-desc {
  /* text-xl */
  font-size: 1.25rem;
  line-height: 1.625;
  /* Gray-600 giúp mắt dềElướt qua nội dung phụ */
  color: #4b5563;
  font-weight: 400;
}

/* Badge thông tin (sềEcâu hỏi) */
.exercise-card-meta {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  /* Màu tím thương hiệu của bạn */
  color: #7e22ce; 
  font-weight: 600;
  /* Thêm nền nhẹ cho meta đềEnó chuyên nghiệp hơn */
  background: rgba(126, 34, 206, 0.08);
  padding: 4px 12px;
  border-radius: 8px;
  width: fit-content;
}
      .text-accent-purple {
  /* text-purple-700 (#7e22ce) */
  color: #7e22ce;
  
  /* font-bold */
  font-weight: 700;

  /* Giúp chữ nổi bật hơn trên nền trắng mềE*/
  letter-spacing: -0.01em;
  
  /* Tạo một lớp shadow cực mảnh đềEchữ không bềEnhòe bởi backdrop-blur của thẻ cha */
  filter: drop-shadow(0 1px 1px rgba(126, 34, 206, 0.1));

  /* Khi nằm trên nền tối, màu này có thể tự động sáng lên một chút (tùy chọn) */
  transition: color 0.2s ease;
}

/* Hiệu ứng hover nhẹ nếu là liên kết hoặc sẽ có thể tương tác */
.text-accent-purple:hover {
  color: #9333ea; /* Purple-600 */
}
      /* Tiêu đềEBài tập: Sắc nét và có chiều sâu */
.exercise-title {
  /* text-4xl (36px) */
  font-size: 2.25rem;
  font-weight: 900;
  color:#8034eb;

  /* Thay hero-text-glow bằng drop-shadow đa lớp đềEchữ nổi bật trên nền kính */
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) 
          drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1));
  
  letter-spacing: -0.01em;
}

/* Phần mô tả: Tinh tế và dềEđọc */
.exercise-meta {
  /* text-2xl (24px) */
  font-size: 1.5rem;
  margin-top: 1rem;
  
  /* Thay text-black bằng Gray-800 đềEgiảm đềEgắt, tạo cảm giác cao cấp */
  color: #1f2937; 
  font-weight: 500;
  
  /* Thêm đềEmềEnhẹ đềEhài hòa với phong cách kính */
  opacity: 0.9;
}

/* Dấu chấm ngăn cách (Bullet point) */
.separator-dot {
  color: #ec4899; /* Màu hồng đềEtạo điểm nhấn đồng bềEvới action-button */
  margin: 0 0.5rem;
  font-weight: 900;
}
      .icon-main-purple {
  /* w-16 h-16 (64px) */
  width: 4rem;
  height: 4rem;

  /* text-purple-600 (#9333ea) */
  color: #9333ea;

  /* drop-shadow-lg */
  /* Tạo đềEnổi khối mạnh mẽ cho icon trên nền kính */
  filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04)) 
          drop-shadow(0 4px 3px rgba(147, 51, 234, 0.2));

  /* Đảm bảo icon SVG hiển thị mượt mà */
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Thêm hiệu ứng chuyển động nếu cần */
  transition: transform 0.3s ease;
}

.icon-main-purple:hover {
  /* Hiệu ứng tương tác nhẹ khi di chuột */
  transform: scale(1.1) rotate(5deg);
}
      .decorative-divider {
  /* w-24 (96px) h-1 (4px) */
  width: 6rem;
  height: 4px;
  
  /* mx-auto mt-8 */
  margin-left: auto;
  margin-right: auto;
  margin-top: 2rem;

  /* bg-gradient-to-r from-transparent via-white/40 to-transparent */
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.4) 50%,
    transparent
  );

  /* Thêm hiệu ứng nhòe đềEđường kẻ trông mềm mại hơn */
  filter: blur(0.5px);
  
  /* Bo tròn nhẹ đầu đường kẻ */
  border-radius: 9999px;
}
      .text-highlight-pink {
  /* text-pink-200 (#fbcfe8) */
  color: #fbcfe8;
  
  /* font-bold */
  font-weight: 700;

  /* Hiệu ứng bóng chữ đềEnổi bật trên mọi loại nền */
  text-shadow: 0 0 10px rgba(236, 72, 153, 0.3);
  
  /* Thêm một chút gradient nhẹ nếu muốn chữ có chiều sâu hơn */
  background: linear-gradient(to bottom right, #fdf2f8, #fbcfe8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  /* Đảm bảo chữ vẫn rõ nét */
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
}
      /* Tiêu đềEchính sắc nét */
.header-title {
  /* text-5xl md:text-6xl */
  font-size: clamp(6rem, 8vw, 4rem); 
  font-weight: 900;
  color: #ffffff;
  
  /* BềEhero-text-glow, thay bằng drop-shadow sắc sảo */
  filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.2));
  
  /* Thêm gradient nhẹ đềEtạo chiều sâu */
  background: linear-gradient(to bottom, #ffffff 70%, #fbcfe8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  letter-spacing: -0.02em;
}

/* Script mô tả bên dưới */
.header-subtitle {
  font-size: 2.00rem; 
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  
  /* ĐềEbóng nhẹ đềEđọc được trên nền gradient màu sắc */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  
  max-width: 42rem; /* max-w-2xl */
  margin: 0 auto;
}

/* Hiệu ứng float nhẹ nhàng cho emoji */
@keyframes float-gentle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}
.animate-float-custom {
  animation: float-gentle 3s ease-in-out infinite;
}
      .explanation-box {
  /* mt-4 p-6 (Tăng padding một chút đềEchữ 2xl không bềEngộp) */
  margin-top: 1.5rem;
  padding: 1.5rem;

  /* bg-white/60 + Glassmorphism */
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  /* rounded-[16px] */
  border-radius: 16px;

  /* border border-white/40 (Tăng đềEsáng viền đềEtách biệt với thẻ cha) */
  border: 1px solid rgba(255, 255, 255, 0.4);

  /* Thêm một chút shadow nội khối đềEtạo chiều sâu nhã nhặn */
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3), 0 4px 6px rgba(0, 0, 0, 0.02);
}

.explanation-title {
  /* Màu tím hoặc hồng từ dải màu Gradient của bạn đềEtạo điểm nhấn */
  color: #9333ea; 
  font-weight: 800;
  margin-right: 0.5rem;
}

.explanation-content {
  /* text-2xl leading-relaxed */
  font-size: 1.5rem;
  line-height: 1.625;
  color: #1f2937; /* Gray-800: Đủ tối đềEđọc văn bản dài không mỏi mắt */
}
      /* Nhãn "Đáp án đúng:" */
.label-correct-text {
  font-size: 1.5rem; /* text-2xl */
  color: #4b5563; /* Gray-600 thay vì white/70 đềErõ nét trên nền sáng */
  font-weight: 600;
}

/* Badge Đáp án đúng khổng lềE*/
.answer-badge-3xl {
  /* text-3xl (30px) */
  font-size: 1.875rem;
  line-height: 2.25rem;
  
  /* Cực đậm đềEkhẳng định đáp án */
  font-weight: 900; 
  
  /* Padding rộng hơn cho bõ với kích thước 3xl */
  padding: 0.75rem 1.75rem;
  
  /* Bo góc lớn đồng bềEvới hềEthống */
  border-radius: 16px;
  
  display: inline-flex;
  align-items: center;
  
  /* Màu sắc xanh lá chủ đạo của sự chính xác */
  background-color: rgba(34, 197, 94, 0.2);
  color: #15803d; /* Green-700 */
  
  /* Viền và đềEbóng tạo đềEnổi (Depth) */
  border: 2px solid rgba(34, 197, 94, 0.3);
  box-shadow: 0 10px 20px -5px rgba(34, 197, 94, 0.2);
}
 .answer-badge-2xl {
  /* text-2xl (24px) */
  font-size: 1.5rem;
  line-height: 2rem;
  
  /* Tăng đềEdày chữ đềEcân bằng với kích thước lớn */
  font-weight: 800; 
  
  /* Điều chỉnh lại padding cho phù hợp với chữ 2xl */
  padding: 0.75rem 1.5rem;
  
  border-radius: 16px; /* Tăng bo góc một chút cho cân đối với size chữ */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  /* Hiệu ứng shadow sâu hơn một chút vì badge đã lớn hơn */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Trạng thái Đúng 2xl */
.answer-badge-correct-2xl {
  background-color: rgba(34, 197, 94, 0.15);
  color: #16a34a; /* Green-600 */
  border-color: rgba(34, 197, 94, 0.3);
}

/* Trạng thái Sai 2xl */
.answer-badge-wrong-2xl {
  background-color: rgba(239, 68, 68, 0.15);
  color: #dc2626; /* Red-600 */
  border-color: rgba(239, 68, 68, 0.3);
}
      .icon-wrong {
  /* w-7 h-7 (28px) */
  width: 1.75rem;
  height: 1.75rem;

  /* text-red-500 */
  color: #ef4444;

  display: inline-block;
  vertical-align: middle;
  
  /* Thêm hiệu ứng Shadow đềEnhạt đềEnổi bật trên nền Glassmorphism */
  filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.2));
}

/* Hiệu ứng rung nhẹ khi icon xuất hiện (báo lỗi) */
.icon-wrong-animated {
  composes: icon-wrong;
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
  40%, 60% { transform: translate3d(3px, 0, 0); }
}
      .icon-correct {
  /* w-7 h-7 (28px) */
  width: 1.75rem;
  height: 1.75rem;

  /* text-green-500 */
  color: #22c55e;

  /* Đảm bảo icon dạng SVG hiển thị đúng kích thước */
  display: inline-block;
  vertical-align: middle;
  
  /* Thêm hiệu ứng Shadow mỏng đềEicon sắc nét trên nền kính */
  filter: drop-shadow(0 2px 4px rgba(34, 197, 94, 0.2));
}
      .bg-wrong-soft {
  /* bg-red-500/20 */
  background-color: rgba(239, 68, 68, 0.2);

  /* Glassmorphism: Tạo đềEmềEnhẹ cho phần nền đềE*/
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  /* Bo góc nhẹ nhàng đềEđồng bềEvới thẻ chính */
  border-radius: 12px;

  /* Màu chữ đềEđậm đềEđảm bảo đềEtương phản (Accessibility) */
  color: #b91c1c; 
  font-weight: 600;
}
      .bg-correct-soft {
  /* bg-green-500/20 */
  background-color: rgba(34, 197, 94, 0.2);

  /* Đồng bềEGlassmorphism: Làm mềEhậu cảnh nhẹ */
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  /* ĐềEtext bên trong dềEđọc hơn trên nền này */
  color: #15803d; /* Màu xanh lá đậm (green-700) */
}
      .index-badge {
  /* flex-shrink-0: Đảm bảo vòng tròn không bềEméo khi text dài */
  flex-shrink: 0;

  /* w-12 h-12 (48px) */
  width: 3rem;
  height: 3rem;

  /* rounded-full */
  border-radius: 9999px;

  /* flex items-center justify-center */
  display: flex;
  align-items: center;
  justify-content: center;

  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

  /* Style màu sắc đồng bềE(Trắng kính mềE */
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.4);
  
  /* Text bên trong */
  color: #9333ea; /* Màu tím chủ đạo */
  font-weight: 800;
  font-size: 1.125rem;
}
      .card-wrong {
  /* border-red-400/50 */
  border: 2px solid rgba(248, 113, 113, 0.5);

  /* shadow-[0_0_20px_rgba(239,68,68,0.3)] */
  /* Hiệu ứng phát sáng (Glow) sắc đềEcảnh báo nhẹ */
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);

  /* Background trắng hồng nhạt đềEđồng bềEvới nền kính mềE*/
  background-color: rgba(254, 242, 242, 0.8);
  
  /* HềEtrợ kính mềEđặc trưng */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  
  transition: all 0.3s ease-in-out;
}
      .card-correct {
  /* border-green-400/50 */
  /* Sử dụng mã HEX #4ade80 với đềEmềE0.5 */
  border: 2px solid rgba(74, 222, 128, 0.5);

  /* shadow-[0_0_20px_rgba(34,197,94,0.3)] */
  /* Hiệu ứng phát sáng (Glow) màu xanh lá dịu nhẹ */
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);

  /* Background đồng bềE(Thêm chút xanh nhạt đềEphân biệt) */
  background-color: rgba(240, 253, 244, 0.8);
  
  /* HềEtrợ kính mềE*/
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  
  transition: all 0.3s ease-in-out;
}
      .review-card {
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8);
  
  /* Hiệu ứng kính mềEđặc trưng */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  /* rounded-[24px] */
  border-radius: 24px;

  /* p-6 (24px) */
  padding: 1.5rem;

  /* border-2 */
  border-width: 2px;
  border-style: solid;
  
  /* Màu viền mặc định (Trắng mềEđềEđồng bềEGlassmorphism) */
  border-color: rgba(255, 255, 255, 0.5);

  /* Shadow nhẹ hơn thẻ chính đềEtạo phân cấp layer */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);

  margin-bottom: 1rem;
  transition: transform 0.2s ease;
}

/* Trạng thái khi câu hỏi đó làm sai */
.review-card.is-wrong {
  border-color: rgba(244, 114, 114, 0.4); /* Màu đềEhồng nhạt */
  background-color: rgba(255, 245, 245, 0.9);
}

/* Trạng thái khi câu hỏi đó làm đúng */
.review-card.is-correct {
  border-color: rgba(52, 211, 153, 0.4); /* Màu xanh mint nhạt */
  background-color: rgba(240, 253, 244, 0.9);
}
      .result-header {
  /* text-4xl (36px) */
  font-size: 2.25rem;
  
  /* text-center */
  text-align: center;
  
  /* mb-8 (32px) */
  margin-bottom: 2rem;

  /* Thay thế hero-text-glow bằng màu trắng tinh khiết có đềEsâu */
  color: #ffffff;
  font-weight: 800;
  
  /* drop-shadow-lg kết hợp với hiệu ứng Layering */
  filter: drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07)) 
          drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06));

  /* Thêm một chút Letter Spacing đềEchữ sang hơn */
  letter-spacing: -0.02em;
  
  /* Animation nhẹ nhàng khi xuất hiện */
  animation: slideDown 0.6s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
      .action-button-secondary {
  /* px-10 py-5 */
  padding: 1.25rem 2.5rem;

  /* bg-white/80 + Glassmorphism */
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  /* rounded-[24px] */
  border-radius: 24px;

  /* flex items-center gap-3 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  /* text-black & border */
  color: #1a1a1a;
  font-weight: 700;
  font-size: 1.125rem;
  /* Thêm viền mỏng đềEđịnh hình trên nền sáng */
  border: 1px solid rgba(255, 255, 255, 0.4);

  /* shadow-xl */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);

  /* transition-all */
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
}

/* hover:scale-110 */
.action-button-secondary:hover {
  transform: scale(1.1);
  background-color: rgba(255, 255, 255, 1);
  box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.1);
  color: #ec4899; /* Chuyển màu chữ sang hồng khi hover đềEtạo điểm nhấn đồng bềE*/
}

.action-button-secondary:active {
  transform: scale(0.95);
}
      .action-button {
  /* px-10 py-5 */
  padding: 1.25rem 2.5rem;

  /* bg-gradient-to-r from-pink-500 to-purple-600 */
  background: linear-gradient(to right, #ec4899, #9333ea);

  /* rounded-[24px] */
  border-radius: 24px;

  /* flex items-center gap-3 */
  display: flex;
  align-items: center;
  gap: 0.75rem;

  /* text-white shadow-xl */
  color: #ffffff;
  font-weight: 700;
  border: none;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* transition-all hover:scale-110 */
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Thêm chút đàn hồi cho mượt */
  cursor: pointer;
}

.action-button:hover {
  transform: scale(1.1);
  filter: brightness(1.1);
  box-shadow: 0 25px 30px -5px rgba(147, 51, 234, 0.3);
}

.action-button:active {
  transform: scale(0.95);
}
      /* Tiêu đềEchính */
.result-title {
  font-size: 2.25rem; /* text-4xl */
  font-weight: 800;
  color: #1a1a1a; /* Màu xám đen đồng bềEvới câu hỏi */
  margin-bottom: 1.5rem; /* mb-6 */
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

/* Con sềEđiểm sềE- Trái tim của màn hình */
.result-score {
  font-size: 5rem; /* text-7xl - 80px */
  font-weight: 900;
  margin-bottom: 1.5rem; /* mb-6 */
  
  /* Tạo Gradient Pink-Purple đồng bềE*/
  background: linear-gradient(135deg, #FF77BC 0%, #9333EA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  /* ĐềEbóng sâu đềEcon sềEnổi hẳn lên */
  filter: drop-shadow(0 10px 15px rgba(147, 51, 234, 0.3));
  display: inline-block;
}

/* Thông điệp khen ngợi */
.result-message {
  font-size: 1.875rem; /* text-3xl */
  font-weight: 600;
  color: #4b5563; /* Gray-600 dịu mắt */
  margin-bottom: 2.5rem; /* mb-10 */
  line-height: 1.4;
}
      .score-display {
  /* text-9xl */
  font-size: 8rem; /* 128px */
  line-height: 1;

  /* mb-6 */
  margin-bottom: 1.5rem; /* 24px */

  /* drop-shadow-2xl */
  filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));

  /* animate-bounce */
  animation: bounce 1s infinite;

  /* ĐềEđồng bềEvới các phần trước, hãy thêm Gradient cho chữ */
  background: linear-gradient(to bottom, #FF77BC, #9333EA);
  -webkit-background-clip: text;
  font-weight: 900; /* Extra Bold */
  display: inline-block;
}

/* Định nghĩa hiệu ứng Bounce (Nhảy) */
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
      .result-card {
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8);
  
  /* HềEtrợ hiệu ứng kính mềE(Đồng bềEvới các thẻ trước) */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  /* rounded-[32px] */
  border-radius: 32px;

  /* p-12 (48px) */
  padding: 3rem;

  /* text-center */
  text-align: center;

  /* border border-white/20 */
  border: 1px solid rgba(255, 255, 255, 0.2);

  /* shadow-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* Đảm bảo nội dung căn giữa trong flexbox cha */
  max-width: 600px;
  width: 90%;
  margin: 2rem auto;
}
      /* Trạng thái mặc định của icon */
.check-icon {
  width: 1.5rem;  /* w-6 (24px) */
  height: 1.5rem; /* h-6 (24px) */
  
  /* transition-all duration-500 */
  transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Đảm bảo xoay quanh tâm */
  transform-origin: center;
}

/* Hiệu ứng khi thẻ cha (nút Nộp bài) được hover */
/* Tương ứng với group-hover:rotate-[360deg] group-hover:scale-125 */
.submit-button:hover .check-icon {
  transform: rotate(360deg) scale(1.25);
}

/* Hiệu ứng khi nút bềEdisabled (tùy chọn đềEđồng bềE */
.submit-button:disabled .check-icon {
  transform: none;
  opacity: 0.5;
}
      .submit-button {
  /* flex items-center gap-3 */
  display: flex;
  align-items: center;
  gap: 0.75rem; /* 12px */

  /* bg-gradient-to-r from-pink-500 to-purple-600 */
  background: linear-gradient(to right, #ec4899, #9333ea);

  /* px-12 py-5 */
  padding: 1.25rem 3rem;

  /* rounded-[24px] */
  border-radius: 24px;

  /* text-white */
  color: #ffffff;
  font-weight: 700;
  font-size: 1.125rem;
  border: none;

  /* shadow-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* transition-all duration-300 */
  transition: all 0.3s ease-in-out;
  cursor: pointer;
}

/* hover:scale-105 */
.submit-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
}

/* Trạng thái disabled (khi chưa làm hết bài) */
.submit-button:disabled {
  /* disabled:opacity-50 */
  opacity: 0.5;

  /* disabled:cursor-not-allowed */
  cursor: not-allowed;

  /* disabled:hover:scale-100 */
  transform: scale(1);
}
      /* Trạng thái mặc định (Chưa chọn) */
.option-text {
  /* Thay text-black bằng màu xám đậm dịu mắt */
  color: #2d3436; 
  font-weight: 500;
  font-size: 1.75rem;
  transition: all 0.3s ease;
  opacity: 0.9;
}

/* Trạng thái khi được chọn (Selected) */
.selected .option-text {
  /* Chuyển sang màu tím đậm hoặc hồng đậm đềEtiệp màu với Check-circle */
  color: #6c5ce7; /* Một tông tím trung tính */
  font-weight: 700;
  opacity: 1;
  /* Hiệu ứng đềEbóng nhẹ cho chữ nếu muốn nổi bật hơn */
  text-shadow: 0px 0px 1px rgba(108, 92, 231, 0.2);
}
      .inner-dot {
  /* w-3 h-3 (12px x 12px) */
  width: 0.75rem;
  height: 0.75rem;

  /* rounded-full */
  border-radius: 9999px;

  /* bg-gradient-to-br from-[#FFC7EA] to-[#D8C8FF] */
  background: linear-gradient(135deg, #FFC7EA 0%, #D8C8FF 100%);

  /* animate-scale-in */
  animation: scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Định nghĩa Animation Scale In */
@keyframes scale-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
      .check-circle-default {
  /* border-white/60 */
  border: 2px solid rgba(255, 255, 255, 0.6);

  /* bg-white/10 */
  background-color: rgba(255, 255, 255, 0.1);

  /* Giữ hình dạng tròn và kích thước cố định */
  border-radius: 9999px;
  width: 1.5rem;  /* 24px */
  height: 1.5rem; /* 24px */
  
  /* HềEtrợ kính mềE(Tùy chọn thêm đềEđồng bềEstyle) */
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  /* Chống bóp méo trong flexbox */
  flex-shrink: 0;
  
  /* Chuyển cảnh mượt mà khi đổi sang Selected */
  transition: all 0.3s ease;
}
      .check-circle-selected {
  /* border-pink-400 */
  border: 2px solid #f472b6;

  /* bg-white */
  background-color: #ffffff;

  /* shadow-[0_0_10px_rgba(255,199,234,0.5)] */
  /* Đây là hiệu ứng phát sáng nhẹ (glow) màu hồng */
  box-shadow: 0 0 10px rgba(255, 199, 234, 0.5);

  /* ĐềEđảm bảo vòng tròn không bềEmóp khi text dài */
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
      .question-text {
  /* flex-1 */
  flex: 1 1 0%;
  min-width: 0; /* Đảm bảo text không phá vỡ layout flexbox */

  /* text-[#1a1a1a] */
  color: #1a1a1a;

  /* text-xl (thường là 20px) */
  font-size: 2.00rem;
  line-height: 1.75rem;

  /* font-bold */
  font-weight: 700;

  /* leading-relaxed */
  line-height: 1.625;

  /* pt-2 (8px) */
  padding-top: 0.5rem;

  /* Bổ sung để hiển thị tốt trên di động */
  word-wrap: break-word;
  overflow-wrap: break-word;
}
      .check-circle {
  /* flex-shrink-0 (Quan trọng: giữ vòng tròn không bềEméo) */
  flex-shrink: 0;

  /* w-6 h-6 (24px x 24px) */
  width: 1.5rem;
  height: 1.5rem;

  /* rounded-full */
  border-radius: 9999px;

  /* border-2 */
  border-width: 2px;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.4);

  /* flex items-center justify-center */
  display: flex;
  align-items: center;
  justify-content: center;

  /* transition-all */
  transition: all 0.2s ease-in-out;
}

/* Khi đáp án được chọn (Selected State) */
.selected .check-circle {
  background-color: white;
  border-color: white;
  transform: scale(1.1);
}
      .exercise-card-item {
  /* glass-card: Nền kính mềEcơ bản */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px; /* Thường dùng 20-24px cho card list */

  /* text-white/80 */
  color: rgba(255, 255, 255, 0.8);

  /* border-white/20 */
  border: 1px solid rgba(255, 255, 255, 0.2);

  /* transition-all */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

/* Hiệu ứng Hover */
.exercise-card-item:hover {
  /* hover:border-white/40 */
  border-color: rgba(255, 255, 255, 0.4);

  /* hover:scale-[1.01] */
  transform: scale(1.01);

  /* Thường đi kèm với việc làm sáng chữ hơn */
  color: #ffffff;
  background: rgba(255, 255, 255, 0.15);
}
      .option-selected {
  /* bg-gradient-to-r from-pink-400 to-purple-500 */
  background: linear-gradient(to right, #f472b6, #a855f7);

  /* text-white */
  color: #ffffff;

  /* border-transparent */
  border-color: transparent;

  /* shadow-2xl (ĐềEbóng cực đại) */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* scale-105 (Phóng lớn 5%) */
  transform: scale(1.05);

  /* Các thuộc tính hềEtrợ */
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); /* Hiệu ứng "nảy" nhẹ */
  cursor: pointer;
}
      .option-button {
  /* w-full text-left */
  width: 100%;
  text-align: left;

  /* p-4 (16px) */
  padding: 1rem;

  /* rounded-[16px] */
  border-radius: 16px;

  /* border-2 */
  border-width: 2px;
  border-style: solid;

  /* transition-all duration-300 */
  transition: all 0.3s ease-in-out;

  /* Mặc định nên có màu đềEtránh bềE"tàng hình" */
  background-color: rgba(255, 255, 255, 0.5);
  border-color: #e5e7eb; /* gray-200 */
  color: #1f2937; /* gray-800 */
  
  cursor: pointer;
  outline: none;
}

/* Hiệu ứng khi hover hoặc được chọn (kết hợp với logic React) */
.option-button:hover {
  border-color: #D8C8FF;
  background-color: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}
      .circle-badge {
  /* flex-shrink-0 (Chống bẹp khi nội dung bên cạnh dài) */
  flex-shrink: 0;

  /* w-12 h-12 (48px x 48px) */
  width: 3rem;
  height: 3rem;

  /* bg-gradient-to-br from-[#FFC7EA] to-[#D8C8FF] */
  background: linear-gradient(to bottom right, #FFC7EA, #D8C8FF);

  /* rounded-full (Hình tròn) */
  border-radius: 9999px;

  /* flex items-center justify-center */
  display: flex;
  align-items: center;
  justify-content: center;

  /* text-white */
  color: #ffffff;

  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
      .question-row {
  /* flex */
  display: flex;

  /* items-start (Căn lềEềEphía trên đỉnh) */
  align-items: flex-start;

  /* gap-4 (16px) */
  gap: 1rem;

  /* mb-6 (24px) */
  margin-bottom: 1.5rem;
}
      .question-card {
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8);

  /* rounded-[24px] */
  border-radius: 24px;

  /* p-6 (24px) */
  padding: 1.5rem;

  /* border border-white/20 */
  border: 1px solid rgba(255, 255, 255, 0.2);

  /* Hỗ trợ hiển thị mờ (Glassmorphism) */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* HềEtrợ Safari */
}
      .exercise-header-card {
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8);

  /* rounded-[32px] */
  border-radius: 32px;

  /* p-8 (32px) */
  padding: 2rem;

  /* mb-8 (32px) */
  margin-bottom: 2rem;

  /* text-black */
  color: #000000;

  /* border border-white/20 */
  border: 1px solid rgba(255, 255, 255, 0.2);

  /* Glassmorphism hiệu ứng mềEnền */
  backdrop-filter: blur(16px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
      .back-icon {
  /* w-5 h-5 (20px x 20px) */
  width: 1.25rem;
  height: 1.25rem;

  /* transition-transform */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Đảm bảo icon là khối đềEdùng được transform */
  display: inline-block;
}

/* group-hover:-translate-x-2 */
/* Khi thẻ cha (nút) được hover, icon dịch sang trái 0.5rem (8px) */
.group:hover .back-icon {
  transform: translateX(-0.5rem);
}
      .glass-button-back {
  /* glass-button (Tùy biến theo style chung của bạn) */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);

  /* flex items-center gap-2 */
  display: flex;
  align-items: center;
  gap: 0.5rem; /* 8px */

  /* text-white/90 */
  color: rgba(255, 255, 255, 0.9);

  /* px-6 py-3 rounded-[20px] */
  padding: 0.75rem 1.5rem;
  border-radius: 20px;

  /* mb-8 */
  margin-bottom: 2rem;

  /* transition & cursor */
  transition: all 0.3s ease;
  cursor: pointer;
  outline: none;
}

/* hover:text-white & hiệu ứng bóng đềEnhẹ */
.glass-button-back:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 20px rgba(255, 199, 234, 0.3);
}

/* Hiệu ứng cho icon mũi tên khi hover (nếu dùng group-hover) */
.glass-button-back:hover .icon-arrow {
  transform: translateX(-4px);
  transition: transform 0.3s ease;
}
      .action-icon {
  /* flex-shrink-0 */
  flex-shrink: 0;

  /* text-3xl (30px) */
  font-size: 1.875rem;
  line-height: 2.25rem;

  /* transition-transform (Thời gian chuyển động) */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* group-hover:translate-x-2 */
/* Khi thẻ cha (.group) được hover, icon dịch chuyển 0.5rem (8px) */
.exercise-card:hover .action-icon {
  transform: translateX(0.5rem);
}
      .main-glass-container {
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8);

  /* rounded-[32px] */
  border-radius: 32px;

  /* p-8 (32px) */
  padding: 2rem;

  /* mb-8 (32px) */
  margin-bottom: 2rem;

  /* border border-white/20 */
  border: 1px solid rgba(255, 255, 255, 0.2);

  /* Hiệu ứng bềEtrợ đềEgiống Glassmorphism thực thụ */
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
}
      .badge-icon {
  /* flex-shrink-0 */
  flex-shrink: 0;

  /* w-14 h-14 (56px x 56px) */
  width: 3.5rem;
  height: 3.5rem;

  /* bg-gradient-to-br from-[#FFC7EA] to-[#D8C8FF] */
  background: linear-gradient(to bottom right, #FFC7EA, #D8C8FF);

  /* rounded-[16px] */
  border-radius: 16px;

  /* flex items-center justify-center */
  display: flex;
  align-items: center;
  justify-content: center;

  /* text-white */
  color: #ffffff;

  /* transition-transform */
  transition: transform 0.3s ease;

  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* group-hover:scale-110 */
/* Lưu ý: .group-container là class của thẻ cha bọc ngoài */
.group-container:hover .badge-icon {
  transform: scale(1.1);
}
      .glass-card-item {
  /* w-full */
  width: 100%;

  /* bg-white/80 (Trắng đục 80%) */
  background-color: rgba(255, 255, 255, 0.8);

  /* rounded-[24px] */
  border-radius: 24px;

  /* p-6 (24px) */
  padding: 1.5rem;

  /* border border-white/10 */
  border: 1px solid rgba(255, 255, 255, 0.1);

  /* transition-all duration-300 */
  transition: all 0.3s ease-in-out;

  /* ĐềEhiệu ứng kính mềEđẹp hơn, nên thêm thuộc tính này */
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* hover:scale-[1.02] */
.glass-card-item:hover {
  transform: scale(1.02);
  
  /* hover:border-white/30 */
  border-color: rgba(255, 255, 255, 0.3);
  
  /* Thêm đềEbóng nhẹ khi hover đềEtăng cảm giác nổi khối */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
        .glass-card { background: rgba(255,255,255,0.08); backdrop-filter: blur(20px); box-shadow: 0 8px 32px rgba(0,0,0,0.37); }
        .glass-button { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
        .glass-button:hover { background: rgba(255,255,255,0.15); box-shadow: 0 0 20px rgba(255,199,234,0.5); }

        @keyframes bounce-in { 0% { opacity: 0; transform: scale(0.9) translateY(-30px); } 50% { transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes sparkle { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }

        .animate-bounce-in { animation: bounce-in 0.8s cubic-bezier(0.68,-0.55,0.265,1.55); }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; opacity: 0; }
        .animate-slide-in { animation: slide-in 0.6s ease-out forwards; opacity: 0; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 2s ease-in-out infinite; }

        .hero-text-glow {
          text-shadow: 0 0 20px #FF69B4, 0 0 40px #A020F0, 0 0 60px #00FFFF, 0 0 80px #FF69B4, 0 0 100px #A020F0, 0 4px 20px rgba(0,0,0,0.9);
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.8));
        }
      `}</style>
    </div>
  );
}
