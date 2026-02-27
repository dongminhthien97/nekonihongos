import { DraggableFloatingNeko } from "./DraggableFloatingNeko";
// src/pages/KanjiPage.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, Cat } from "lucide-react";
import { KanjiDetailModal } from "./KanjiDetailModal";
import { NekoLoading } from "./NekoLoading";
import { useSafeRequest } from "../hooks/useSafeRequest";
import { NekoAlertModal } from "./NekoAlertModal";
import { tokenStorage } from "../auth/storage";
import { useBackendReady } from "../hooks/useBackendReady";

const LESSONS_PER_PAGE = 12;
const KANJI_PER_PAGE = 12;

interface KanjiCompound {
  word: string;
  reading: string;
  meaning: string;
}

interface Kanji {
  kanji: string;
  on: string;
  kun: string;
  hanViet: string;
  meaning: string;
  strokes: number;
  svgPaths: string[];
  compounds: KanjiCompound[];
}

interface KanjiLesson {
  id: number;
  title: string;
  icon: string;
  kanjiList: Kanji[];
}

// Backend API response types
interface BackendKanjiLesson {
  lessonId: number;
  lessonTitle: string;
  icon: string;
  kanji: BackendKanji[];
}

interface BackendKanji {
  kanji: string;
  onReading: string;
  kunReading: string;
  hanViet: string;
  meaning: string;
  strokes: number;
  svgPaths?: string[]; // Optional - may not be present in backend
  compounds?: KanjiCompound[]; // Optional - may not be present in backend
}

// Mapping functions
const normalizeKanji = (backendKanji: BackendKanji): Kanji => ({
  kanji: backendKanji.kanji || "",
  on: backendKanji.onReading || "",
  kun: backendKanji.kunReading || "",
  hanViet: backendKanji.hanViet || "",
  meaning: backendKanji.meaning || "",
  strokes: backendKanji.strokes || 0,
  svgPaths: backendKanji.svgPaths || [],
  compounds: backendKanji.compounds || [],
});

const normalizeKanjiLesson = (
  backendLesson: BackendKanjiLesson,
): KanjiLesson => ({
  id: backendLesson.lessonId,
  title: backendLesson.lessonTitle,
  icon: backendLesson.icon || "",
  kanjiList: (backendLesson.kanji || []).map(normalizeKanji),
});

export function KanjiPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [lessons, setLessons] = useState<KanjiLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<KanjiLesson | null>(
    null,
  );
  const [lessonPage, setLessonPage] = useState(1);
  const [kanjiPage, setKanjiPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);
  const [showNoLessonModal, setShowNoLessonModal] = useState(false);

  const { executeRequest } = useSafeRequest();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchKanjiLessons = async () => {
      try {
        console.log("🔍 [KanjiPage] Bắt đầu fetchKanjiLessons");
        console.log("🔍 [KanjiPage] API URL:", import.meta.env.VITE_API_URL);
        console.log(
          "🔍 [KanjiPage] Token:",
          tokenStorage.get() ? "Có token" : "Không có token",
        );

        setIsLoading(true);

        console.log("🔍 [KanjiPage] Gọi API: GET /kanji/lessons");
        const startTime = Date.now();

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        const backendLessons: BackendKanjiLesson[] = await executeRequest({
          url: "/kanji/lessons",
          method: "GET",
          signal: abortControllerRef.current.signal,
        });

        const endTime = Date.now();

        console.log(
          "✅ [KanjiPage] API call thành công trong",
          endTime - startTime,
          "ms",
        );
        console.log("🔍 [KanjiPage] Backend Lessons raw:", backendLessons);
        console.log(
          "🔍 [KanjiPage] Số lượng bài học nhận được:",
          backendLessons.length,
        );

        if (backendLessons.length === 0) {
          console.warn("⚠️ [KanjiPage] Backend trả về 0 bài học");
        }

        const normalizedLessons = backendLessons.map(normalizeKanjiLesson);
        console.log("🔍 [KanjiPage] Normalized Lessons:", normalizedLessons);
        console.log(
          "🔍 [KanjiPage] Số lượng bài học sau normalize:",
          normalizedLessons.length,
        );

        setLessons(normalizedLessons);
        setError("");

        console.log("✅ [KanjiPage] fetchKanjiLessons hoàn thành thành công");
      } catch (err: any) {
        console.error("❌ [KanjiPage] Lỗi trong fetchKanjiLessons:", err);
        console.error("❌ [KanjiPage] Error type:", err.constructor.name);
        console.error("❌ [KanjiPage] Error code:", err.code);
        console.error("❌ [KanjiPage] Error message:", err.message);
        console.error("❌ [KanjiPage] Error status:", err.status);

        // Handle 401 errors (already handled by safeRequest, but keeping for completeness)
        if (err.status === 401) {
          console.log("🔐 [KanjiPage] Phát hiện lỗi 401 - Token hết hạn");
          alert("Phiên đăng nhập hết hạn! Mèo đưa bạn về trang đăng nhập nhé");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("nekoUser");
          onNavigate("login");
          return;
        }

        // Handle network errors and timeouts
        if (err.isTimeout) {
          console.error(
            "⏰ [KanjiPage] Timeout error - Máy chủ không phản hồi trong 15s",
          );
          setError(
            "Mèo không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại sau!!",
          );
        } else if (err.isNetworkError) {
          console.error(
            "🌐 [KanjiPage] Network error - Không thể kết nối tới server",
          );
          setError(
            "Mèo không thể kết nối tới máy chủ. Máy chủ có thể đang bảo trì hoặc không hoạt động!",
          );
        } else if (err.isAbort) {
          console.log("🛑 [KanjiPage] Request bị hủy");
          return;
        } else {
          console.error("❓ [KanjiPage] Lỗi không xác định:", err.status);
          setError("Không thể tải dữ liệu Kanji. Mèo đang cố gắng...");
        }
      } finally {
        console.log(
          "🏁 [KanjiPage] fetchKanjiLessons kết thúc, set isLoading = false",
        );
        setTimeout(() => setIsLoading(false), 600);
      }
    };

    fetchKanjiLessons();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [onNavigate, executeRequest]);

  const handleStartFlashcardKanji = () => {
    if (!selectedLesson) {
      setShowNoLessonModal(true);
      return;
    }

    // Lấy tất cả compounds từ các Kanji trong bài
    let allCompounds: KanjiCompound[] = [];
    selectedLesson.kanjiList.forEach((kanji) => {
      if (kanji.compounds && kanji.compounds.length > 0) {
        allCompounds = allCompounds.concat(kanji.compounds);
      }
    });

    if (allCompounds.length === 0) {
      alert("Bài học này chưa có từ ghép để học flashcard!");
      return;
    }

    // Chọn 10 compounds ngẫu nhiên (cho phép trùng nếu ít hơn 10)
    let selectedCompounds = [...allCompounds];
    if (selectedCompounds.length > 10) {
      selectedCompounds = selectedCompounds
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);
    }

    // Lưu vào localStorage để FlashcardKanji đọc
    localStorage.setItem(
      "nekoFlashcardKanjiData",
      JSON.stringify({
        lessonId: selectedLesson.id,
        lessonTitle: selectedLesson.title,
        compounds: selectedCompounds,
        allCompounds: allCompounds, // để học tiếp có thể lấy lại
      }),
    );

    requestAnimationFrame(() => onNavigate("flashcard-kanji"));
  };

  // Phân trang bài học
  const totalLessonPages = Math.ceil(lessons.length / LESSONS_PER_PAGE);
  const currentLessons = useMemo(() => {
    return lessons.slice(
      (lessonPage - 1) * LESSONS_PER_PAGE,
      lessonPage * LESSONS_PER_PAGE,
    );
  }, [lessons, lessonPage]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.trim();
    const results: {
      type: "compound" | "kanji";
      word?: string; // chỉ có khi là từ ghép
      reading?: string;
      meaning?: string;
      lessonId: number;
      lessonTitle: string;
      kanjiList: Kanji[]; // các Kanji thành phần
    }[] = [];

    // 1. Tìm theo TỪ GHÉP (ưu tiên cao nhất - giống tra từ điển)
    lessons.forEach((lesson) => {
      lesson.kanjiList.forEach((k) => {
        if (k.compounds && k.compounds.length > 0) {
          k.compounds.forEach((compound) => {
            if (compound.word.includes(query)) {
              // Tìm tất cả Kanji trong lesson có trong từ ghép này
              const relatedKanji = lesson.kanjiList.filter((kj) =>
                compound.word.includes(kj.kanji),
              );

              results.push({
                type: "compound",
                word: compound.word,
                reading: compound.reading,
                meaning: compound.meaning,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                kanjiList: relatedKanji,
              });
            }
          });
        }
      });
    });

    // 2. Nếu không tìm thấy từ ghép -> tìm theo Kanji riêng lẻ (fallback)
    if (results.length === 0) {
      lessons.forEach((lesson) => {
        lesson.kanjiList.forEach((k) => {
          const normalizedKanji = (k.kanji || "").toLowerCase();
          const normalizedOn = (k.on || "").toLowerCase();
          const normalizedKun = (k.kun || "").toLowerCase();
          const normalizedHanViet = (k.hanViet || "").toLowerCase();
          const normalizedMeaning = (k.meaning || "").toLowerCase();

          const queryLower = query.toLowerCase();

          if (
            normalizedKanji.includes(queryLower) ||
            normalizedOn.includes(queryLower) ||
            normalizedKun.includes(queryLower) ||
            normalizedHanViet.includes(queryLower) ||
            normalizedMeaning.includes(queryLower)
          ) {
            results.push({
              type: "kanji",
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              kanjiList: [k],
            });
          }
        });
      });
    }

    // Loại bỏ trùng lặp từ ghép (nếu nhiều Kanji cùng có từ ghép giống nhau)
    const uniqueResults = results.filter(
      (result, index, self) =>
        index ===
        self.findIndex((r) =>
          r.type === "compound"
            ? r.word === result.word
            : r.kanjiList[0].kanji === result.kanjiList[0].kanji,
        ),
    );

    return uniqueResults;
  }, [searchQuery, lessons]);
  // Kanji hiện tại khi chọn bài học
  const currentKanjis = useMemo(() => {
    if (!selectedLesson) return [];
    return selectedLesson.kanjiList.slice(
      (kanjiPage - 1) * KANJI_PER_PAGE,
      kanjiPage * KANJI_PER_PAGE,
    );
  }, [selectedLesson, kanjiPage]);

  const totalKanjiPages = selectedLesson
    ? Math.ceil(selectedLesson.kanjiList.length / KANJI_PER_PAGE)
    : 0;

  if (isLoading) {
    return <NekoLoading message="Mèo đang chuẩn bị bài học Kanji cho bạn..." />;
  }

  if (error && lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
        <div className="text-center text-white">
          <div className="text-9xl animate-bounce">Meow</div>
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
    <div className="min-h-screen">
      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Header + Search */}
        <div className="text-center mb-12">
          <h1 className="relative z-10 mb-12 md:mb-16">
            <div className="absolute inset-0 -z-10 rounded-3xl" />
            <span className="hero-section-title hero-text-glow">
              Học Chữ Kanji
            </span>
          </h1>

          {/* THANH TÌM KIẾM */}
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <div className="glass-effect-container animate-fade-in">
                <div className="element-overlay-positioned">
                  <Search className="icon-centered-left" strokeWidth={5} />
                </div>
                <input
                  type="text"
                  placeholder="Tìm Kanji... (猫, ...)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedLesson(null);
                  }}
                  className="transparent-search-input"
                />
              </div>
            </div>

            {/* Kết quả tìm kiếm */}
            {searchResults.length > 0 && (
              <div className="mt-10 max-w-4xl mx-auto space-y-6 animate-fade-in">
                <p className="pulsing-centered-text text-2xl md:text-3xl">
                  Tìm thấy {searchResults.length} kết quả cho "{searchQuery}"
                </p>

                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="glass-card-hover-effect cursor-pointer group"
                    onClick={() => {
                      // Chọn Kanji đầu tiên trong danh sách để xem chi tiết
                      if (result.kanjiList.length > 0) {
                        setSelectedKanji(result.kanjiList[0]);
                      }
                    }}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="full-gradient-hover-effect" />

                    <div className="relative z-10 p-8 md:p-10">
                      {result.type === "compound" ? (
                        /* ===== HIỂN THỊ TỪ GHÉP - GIỐNG TỪ ĐIỂN SIÊU ĐẸP ===== */
                        <div className="text-center space-y-6 max-w-4xl mx-auto p-4">
                          {/* Từ ghép lớn - Giữ vai trò Spotlight */}
                          <div className="space-y-2">
                            <h2 className="rainbow-glow-title">
                              {result.word}
                            </h2>

                            {/* Cách đọc: Thanh lịch và rõ ràng */}
                            <p className="text-3xl md:text-2xl text-black font-semibold italic">
                              {result.reading}
                            </p>

                            {/* Nghĩa tiếng Việt: Điểm nhấn màu sắc dịu */}
                            <p className="text-3xl md:text-2xl text-black font-semibold italic">
                              • {result.meaning} •
                            </p>
                          </div>

                          {/* Thông tin bài học: Nhẹ nhàng, nằm trong một badge mềm */}
                          <div className="inline-block px-4 py-1 text-3xl md:text-base">
                            📚 Bài {result.lessonId} –{" "}
                            <span className="text-black">
                              {result.lessonTitle}
                            </span>
                          </div>

                          {/* Các Kanji thành phần - Layout dạng Card chuyên nghiệp */}

                          {result.kanjiList.map((k) => (
                            <div key={k.kanji} className="kanji-crystal-card">
                              {/* Trang trí background nhẹ cho mỗi card */}
                              <div className="absolute -top-4 -right-4 w-16 h-16 text-black" />

                              <p className="text-5xl font-black rainbow-glow-title mb-4">
                                {k.kanji}
                              </p>

                              <div className="space-y-1">
                                <p className="text-3xl text-black font-bold leading-tight">
                                  {k.meaning}
                                </p>
                                <div className="w-8 mx-auto my-2" />
                                <p className="text-2xl text-white/50 leading-relaxed uppercase tracking-tighter">
                                  <span className="block">On: {k.on}</span>
                                  <span className="block">Kun: {k.kun}</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* ===== HIỂN THỊ KANJI RIÊNG LẺ - GIỮ NGUYÊN STYLE CŨ ===== */
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex-1 text-left">
                            <p className="rainbow-glow-title text-5xl md:text-6xl font-black">
                              {result.kanjiList[0].kanji}
                            </p>
                            <p className="small-rainbow-glow text-xl md:text-2xl mt-2">
                              {result.kanjiList[0].on} /{" "}
                              {result.kanjiList[0].kun}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="white-rainbow-glow-bold text-2xl md:text-3xl">
                              {result.kanjiList[0].meaning}
                            </p>
                            <p className="small-white-rainbow-glow text-lg mt-3">
                              Bài {result.lessonId} •{" "}
                              {result.kanjiList[0].strokes} nét
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Danh sách bài học hoặc kanji */}
        {!selectedLesson ? (
          <>
            {/* DANH SÁCH BÀI HỌC */}
            <div className="max-w-7xl mx-auto">
              <div
                key={lessonPage}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:grid-cols-4 gap-8 mb-16"
              >
                {currentLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setKanjiPage(1);
                      setSearchQuery("");
                    }}
                    className="responsive-hover-card animate-fade-in"
                  >
                    <div className="text-gray-800 animate-pulse-soft">
                      <Cat className="relative w-full h-full" />
                    </div>
                    <div className="text-center py-6">
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

              {/* Phân trang bài học */}
              {totalLessonPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-12">
                  <button
                    onClick={() => setLessonPage((p) => Math.max(1, p - 1))}
                    disabled={lessonPage === 1}
                    className="custom-button"
                    aria-label="Previous lessons page"
                  >
                    <ChevronLeft className="w-6 h-6 text-black" />
                  </button>

                  <div className="flex gap-3 items-center">
                    {Array.from({ length: totalLessonPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setLessonPage(i + 1)}
                        aria-label={`Go to lesson page ${i + 1}`}
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
                    aria-label="Next lessons page"
                  >
                    <ChevronRight className="w-6 h-6 text-black" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* CHI TIẾT BÀI HỌC - DANH SÁCH KANJI */
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center mb-10">
              <div className="w-full flex flex-col items-center gap-4">
                <h2 className="text-3xl hero-text-glow text-white">
                  {selectedLesson.title}
                </h2>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="button"
                >
                  →Tất cả bài học
                </button>
              </div>
            </div>

            {/* GRID KANJI - 4 CỘT */}
            <div
              key={`${selectedLesson?.id || "none"}-${kanjiPage}`}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-8 mt-4"
            >
              {currentKanjis.map((kanji, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedKanji(kanji)}
                  className="kanji-simple-card animate-fade-in"
                >
                  <p className="text-8xl text-black font-black">
                    {kanji.kanji}
                  </p>
                </button>
              ))}
            </div>

            {/* Phân trang kanji */}
            {totalKanjiPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-16">
                <button
                  onClick={() => setKanjiPage((p) => Math.max(1, p - 1))}
                  disabled={kanjiPage === 1}
                  className="custom-button"
                  aria-label="Previous kanji page"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <div className="flex gap-3 items-center">
                  {Array.from({ length: totalKanjiPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setKanjiPage(i + 1)}
                      aria-label={`Go to page ${i + 1}`}
                      className={`rounded-full transition-all duration-200 flex items-center justify-center ${
                        kanjiPage === i + 1
                          ? "custom-element"
                          : "button-icon-effect"
                      }`}
                    >
                      {kanjiPage === i + 1 ? i + 1 : ""}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setKanjiPage((p) => Math.min(totalKanjiPages, p + 1))
                  }
                  disabled={kanjiPage === totalKanjiPages}
                  className="circular-icon-button"
                  aria-label="Next kanji page"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      {/* MÁY BAY SIÊU DỄ THƯƠNG - CLICK VÀO HỌC FLASHCARD KANJI TỪ BÀI HIỆN TẠI */}

      <DraggableFloatingNeko
        storageKey="floating-neko-kanji"
        onClick={handleStartFlashcardKanji}
        tooltip={
          <div className="tooltimainp-slide-out">
            <div className="colored-border-label">
              <p className="text-xl font-bold drop-shadow-md">
                Học flashcard Kanji từ bài hiện tại nào mèo ơi! 🐾
              </p>
              <div className="absolute bottom-0 right-8 translate-y-full">
                <div className="triangle-down-pink"></div>
              </div>
            </div>
            <div className="absolute bottom-full mb-2 right-12 text-4xl animate-bounce">
              ✨
            </div>
          </div>
        }
        imageStyle={{
          filter: "drop-shadow(0 10px 20px rgba(255, 182, 233, 0.6))",
        }}
        glow={<div className="circular-gradient-hover-glow"></div>}
      />
      {/* MODAL CHI TIẾT KANJI */}
      {selectedKanji && (
        <KanjiDetailModal
          kanji={selectedKanji}
          onClose={() => setSelectedKanji(null)}
        />
      )}
      <NekoAlertModal
        isOpen={showNoLessonModal}
        onClose={() => setShowNoLessonModal(false)}
        title="Meow meow..."
        message={
          !selectedLesson
            ? "Hãy chọn 1 bài học trước nhé"
            : "Bài này chưa có từ vựng nào cả... Mèo buồn quá!"
        }
      />
      <style>{`
      .kanji-simple-card {
  /* Nền trắng có độ trong suốt để tạo hiệu ứng kính */
  background-color: rgba(255, 255, 255, 0.9); 
  
  /* Bo góc cực lớn 32px */
  border-radius: 2rem; 
  
  /* Khoảng cách bên trong rộng rãi */
  padding: 3rem 2rem;
  min-height: 200px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Viền trắng mờ tạo độ dày cho mặt kính */
  border: 2px solid rgba(255, 255, 255, 0.4);
  
  /* Hiệu ứng bóng đổ đa tầng (shadow-xl) */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
              0 8px 10px -6px rgba(0, 0, 0, 0.1);
  
  /* Chuyển động mượt 400ms */
  transition: all 400ms ease-in-out;
  cursor: pointer;
  
  /* Quan trọng: Hiệu ứng làm mờ lớp nền phía sau (nếu có màu nền) */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Hiệu ứng Hover giống style Glassmorphism */
.kanji-simple-card:hover {
  /* Phóng lớn nhẹ 105% */
  transform: scale(1.05);
  
  /* Viền chuyển sang màu hồng đặc trưng của bạn */
  border-color: #f472b6; 
  
  /* Nền trong suốt hơn một chút khi hover */
  background-color: rgba(255, 255, 255, 0.8);
  
  /* Đổ bóng sâu hơn khi thẻ nổi lên */
  box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.15);
}

/* Hiệu ứng khi nhấn */
.kanji-simple-card:active {
  transform: scale(0.98);
}

      .kanji-crystal-card {
  position: relative; /* relative */
  
  /* bg-white/10 + backdrop-blur-xl */
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(24px); /* xl blur thường là 24px */
  -webkit-backdrop-filter: blur(24px);

  /* rounded-[32px] */
  border-radius: 32px;
  padding: 1.5rem; /* p-6 */
  
  /* border border-white/20 */
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  /* shadow-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* Tránh tràn nội dung khi hover hoặc có hiệu ứng ánh sáng */
  overflow: hidden; /* overflow-hidden */

  /* transition-all duration-500 */
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

/* Hiệu ứng Hover chuyên nghiệp */
.kanji-crystal-card:hover {
  /* hover:border-white/40 + hover:bg-white/15 */
  border-color: rgba(255, 255, 255, 0.4);
  background-color: rgba(255, 255, 255, 0.15);
  
  /* hover:-translate-y-2 */
  transform: translateY(-8px);
  
  /* Tăng cường bóng đổ khi thẻ nổi lên */
  box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.4);
}
.rainbow-glow-title {
  /* Kích thước cực đại: 60px (mobile) -> 72px (desktop) */
  font-size: clamp(3.75rem, 10vw, 4.5rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em; /* Thu hẹp một chút để các khối màu đặc hơn */

  /* Gradient 5 màu rực rỡ */
  background: linear-gradient(
    45deg, 
    #ff3366, #ffcc00, #33ff99, #00ccff, #9933ff
  );
  background-size: 300% auto;
  -webkit-background-clip: text;
  
  /* Hiệu ứng chuyển động màu mượt mà */
  animation: rainbow-flow 6s ease infinite;

  /* drop-shadow-2xl: Đổ bóng cực sâu để tách lớp */
  filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.3));

  /* Khử răng cưa cực mạnh cho font lớn */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@keyframes rainbow-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

        .circular-gradient-hover-glow {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          border-radius: 9999px;
          background-image: linear-gradient(to right, 
            rgba(244, 114, 182, 0.3),
            rgba(168, 85, 247, 0.3)
          );
          opacity: 0;
          transition: opacity 500ms ease-in-out;
          filter: blur(24px);
        }

        .group:hover .circular-gradient-hover-glow {
          opacity: 1;
        }

        @keyframes fly {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(2deg);
          }
          100% {
            transform: translateY(0) rotate(-1deg);
          }
        }

        .responsive-circular-image-hover {
          width: 10rem;
          height: 10rem;
          border-radius: 9999px;
          object-fit: cover;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: fly 6s ease-in-out infinite;
          filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
          transform: scale(1) rotate(0deg);
          transition: all 300ms ease-in-out;
          border-width: 4px;
          border-style: solid;
          border-color: #f9a8d4;
        }

        @media (min-width: 640px) {
          .responsive-circular-image-hover {
            width: 6rem;
            height: 6rem;
          }
        }

        @media (min-width: 768px) {
          .responsive-circular-image-hover {
            width: 7rem;
            height: 7rem;
          }
        }

        @media (min-width: 1024px) {
          .responsive-circular-image-hover {
            width: 8rem;
            height: 8rem;
          }
        }

        @media (min-width: 1280px) {
          .responsive-circular-image-hover {
            width: 9rem;
            height: 9rem;
          }
        }

        .group:hover .responsive-circular-image-hover {
          transform: scale(1.1) rotate(12deg);
        }

        .triangle-down-pink {
          width: 0;
          height: 0;
          border-left-width: 8px;
          border-left-style: solid;
          border-left-color: transparent;
          border-right-width: 8px;
          border-right-style: solid;
          border-right-color: transparent;
          border-top-width: 8px;
          border-top-style: solid;
          border-top-color: #f9a8d4;
        }

        .colored-border-label {
          background-color: #ffffff;
          color: #6d28d9;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          padding-top: 1rem;
          padding-bottom: 1rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          white-space: nowrap;
          border-width: 4px;
          border-style: solid;
          border-color: #f9a8d4;
        }

        .tooltip-slide-out {
          position: absolute;
          bottom: 100%;
          margin-bottom: 1rem;
          right: 0;
          transform: translateX(2rem);
          opacity: 0;
          transition: all 500ms ease-in-out;
          pointer-events: none;
        }

        .group:hover .tooltip-slide-out {
          opacity: 1;
          transform: translateX(0);
        }

        .pulsing-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        .responsive-hover-card {
          position: relative;
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 2rem;
          padding: 2rem;
          transition: all 500ms ease-in-out;
          overflow: hidden;
        }

        .responsive-hover-card:hover {
          transform: scale(1.05);
        }

        .pulsing-centered-text {
          text-align: center;
          color: #ffffff;
          font-weight: 700;
          font-size: 1.25rem;
          line-height: 1.75rem;
          margin-bottom: 1.5rem;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .glassmorphism-card {
          background-color: #ffffff;
          border-radius: 2rem;
          padding: 2rem;
          border-width: 2px;
          border-color: rgba(255, 255, 255, 0.4);
          transition: all 400ms ease-in-out;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }

        .glassmorphism-card:hover {
          border-color: #f472b6;
          background-color: rgba(255, 255, 255, 0.80);
          transform: scale(1.05);
        }

        .small-white-rainbow-glow {
          font-size: 1.125rem;
          line-height: 1.75rem;
          color: #ffffff;
          margin-top: 0.5rem;
          text-shadow: 
            0 0 3px rgba(255, 255, 255, 0.9),
            0 0 8px rgba(255, 0, 150, 0.9),
            0 0 12px rgba(147, 51, 234, 0.9),
            0 0 16px rgba(6, 182, 212, 0.9);
        }

        .white-rainbow-glow-bold {
          font-size: 1.875rem;
          line-height: 2.25rem;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 
            0 0 4px rgba(255, 255, 255, 0.8),
            0 0 10px rgba(255, 0, 150, 0.9),
            0 0 15px rgba(147, 51, 234, 0.9),
            0 0 20px rgba(6, 182, 212, 0.9);
          filter: none;
        }

        .small-rainbow-glow {
          font-size: 1.5rem;
          line-height: 2rem;
          color: #ffffff;
          margin-top: 0.25rem;
          text-shadow: 
            0 0 2px rgba(255, 255, 255, 0.8),
            0 0 5px rgba(255, 0, 150, 0.9),
            0 0 8px rgba(147, 51, 234, 0.9),
            0 0 12px rgba(6, 182, 212, 0.9);
        }

        .rainbow-glow-title {
          font-size: 3.25rem;
          line-height: 2.5rem;
          font-weight: 900;
          color: #ffffff;
          text-shadow: 
            0 0 4px rgba(255, 255, 255, 0.8),
            0 0 10px rgba(255, 0, 150, 0.9),
            0 0 15px rgba(147, 51, 234, 0.9),
            0 0 20px rgba(6, 182, 212, 0.9);
        }

        .full-gradient-hover-effect {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          border-radius: 1rem;
          background: linear-gradient(to right, #ec4899, #a855f7, #06b6d4);
          opacity: 0;
          filter: blur(20px);
          transition: opacity 500ms ease-in-out;
          z-index: -10;
        }

        .group:hover .full-gradient-hover-effect {
          opacity: 1;
        }

        .glass-card-hover-effect {
          position: relative;
          background-color: rgba(255, 255, 255, 0.8);
          border-width: 1px;
          border-color: rgba(255, 255, 255, 0.3);
          border-radius: 1rem;
          padding: 1.5rem;
          transition: all 400ms ease-in-out;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }

        .glass-card-hover-effect:hover {
          border-color: #f472b6;
          background-color: rgba(255, 255, 255, 0.2);
          transform: scale(1.02);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 15px rgba(236, 72, 153, 0.3);
        }

        .transparent-search-input {
          width: 100%;
          padding-top: 2rem;
          padding-bottom: 2rem;
          padding-left: 7rem;
          padding-right: 2.5rem;
          font-size: 1.875rem;
          line-height: 2.25rem;
          font-weight: 900;
          color: #ffffff;
          background-color: transparent;
          text-align: center;
        }

        .transparent-search-input:focus {
          outline: 0;
        }

        .transparent-search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 700;
        }

        .element-overlay-positioned {
          position: absolute;
          left: 2rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 20;
        }

        .icon-centered-left {
          position: absolute;
          left: 2rem;
          top: 50%;
          transform: translateY(-50%);
          width: 3rem;
          height: 3rem;
          color: #ffffff;
          z-index: 20;
          filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 10px #f472b6);
        }

        .glass-effect-container {
          position: relative;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(40px);
          border-radius: 9999px;
          border-width: 4px;
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 8px rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .hero-section-title {
          position: relative;
          display: block;
          padding-left: 2.5rem;
          padding-right: 2.5rem;
          padding-top: 2rem;
          padding-bottom: 2rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          color: #ffffff;
          filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15)) drop-shadow(0 10px 10px rgba(0, 0, 0, 0.04));
          transform: translateY(-0.75rem);
          font-size: 3.75rem;
          line-height: 1;
          text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #f687b3;
          animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @media (min-width: 768px) {
          .hero-section-title {
            padding-left: 3.5rem;
            padding-right: 3.5rem;
            padding-top: 2.5rem;
            padding-bottom: 2.5rem;
            font-size: 4.5rem;
            line-height: 1;
            transform: translateY(-1rem);
          }
        }

        @media (min-width: 1024px) {
          .hero-section-title {
            padding-left: 5rem;
            padding-right: 5rem;
            padding-top: 3rem;
            padding-bottom: 3rem;
            font-size: 8rem;
            line-height: 1;
            transform: translateY(-1.25rem);
          }
        }

        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }

        .circular-icon-button {
          padding: 1rem;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.3);
          transition: all 150ms ease-in-out;
        }

        @media (min-width: 768px) {
          .circular-icon-button {
            padding: 1.25rem;
          }
        }

        .circular-icon-button:hover {
          background-color: #fecaca;
          transform: scale(1.05);
        }

        .circular-icon-button:disabled {
          opacity: 0.5;
        }

        .button-icon-effect {
          background-color: rgba(255, 255, 255, 0.9);
          width: 1.5rem;
          height: 1.5rem;
          transition: transform 150ms ease-in-out;
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

        .custom-element {
          background-color: #f472b6;
          color: #ffffff;
          padding-left: 1rem;
          padding-right: 1rem;
          height: 2.5rem;
          font-weight: 700;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        }

        @media (min-width: 768px) {
          .custom-element {
            height: 3rem;
          }
        }

        .custom-button {
          padding: 1rem;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.3);
          transition: all 150ms ease-in-out;
        }

        .button {
          padding: 1rem 2rem;
          background-color: #ffffff;
          backdrop-filter: blur(8px);
          border-radius: 9999px;
          color: #000000;
          font-weight: 700;
          transition: background-color 150ms ease, transform 150ms ease;
        }

        .button:hover {
          background-color: rgba(255,255,255,0.6);
        }

        @media (min-width: 768px) {
          .custom-button {
            padding: 1.25rem;
          }
        }

        .custom-button:hover {
          background-color: #fecaca;
          transform: scale(1.05);
        }

        .custom-button:disabled {
          opacity: 0.5;
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }

        .hero-text-glow {
          text-shadow: 
            0 0 20px #FF69B4,
            0 0 40px #A020F0,
            0 0 60px #00FFFF,
            0 0 80px #FF69B4,
            0 0 100px #A020F0,
            0 4px 20px rgba(0,0,0,0.9);
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.8));
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
