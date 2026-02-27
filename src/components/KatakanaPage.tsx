import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Cat } from "lucide-react";
import { HiraKataDetailModal } from "./HiraKataDetailModal";
import { NekoLoading } from "./NekoLoading";
import { safeRequest } from "../api/safeRequest";
import { NekoAlertModal } from "./NekoAlertModal";
import { LessonSelectModal } from "./LessonSelectModal";
import { DraggableFloatingNeko } from "./DraggableFloatingNeko";

interface Katakana {
  id: number;
  character: string;
  romanji: string;
  unicode: string;
  stroke_order: number;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  total_characters: number;
  characters: Katakana[];
}

interface KatakanaPageProps {
  onNavigate: (page: string) => void;
}

const LESSONS_PER_PAGE = 12;
const CHARACTERS_PER_PAGE = 12;

export function KatakanaPage({ onNavigate }: KatakanaPageProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonPage, setLessonPage] = useState(1);
  const [characterPage, setCharacterPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<Katakana | null>(
    null,
  );
  const [showNoLessonModal, setShowNoLessonModal] = useState(false);

  // Modal chọn nhiều lesson cho flashcard
  const [showLessonSelectModal, setShowLessonSelectModal] = useState(false);
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<number>>(
    new Set(),
  );

  // FETCH & NORMALIZE DATA (Sử dụng endpoint /katakana)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const rawData = await safeRequest<any[]>({
          url: "/katakana",
          method: "GET",
        });

        if (Array.isArray(rawData)) {
          const normalizedData = rawData.map((item: any) => ({
            id: item.id,
            character: item["`character`"] || item.character || "?",
            romanji: item.romanji || "",
            unicode: item.unicode || "",
            stroke_order: item.stroke_order || 0,
          }));

          await new Promise((resolve) => setTimeout(resolve, 600));
          setLessons(createLessons(normalizedData));
        }
      } catch (err: any) {
        console.error("Lỗi kết nối server:", err);
      } finally {
        setTimeout(() => setIsLoading(false), 600);
      }
    };
    fetchData();
  }, []);

  const createLessons = (data: Katakana[]): Lesson[] => {
    const lessonTitles = [
      "Nguyên âm",
      "Hàng KA",
      "Hàng SA",
      "Hàng TA",
      "Hàng NA",
      "Hàng HA",
      "Hàng MA",
      "Hàng YA",
      "Hàng RA",
      "Hàng WA",
      "Hàng GA",
      "Hàng ZA",
      "Hàng DA",
      "Hàng BA",
      "Hàng PA",
      "Âm ghép (Yoon)",
    ];

    // Chia nhóm tương tự Hiragana
    const groups = [
      data.slice(0, 5),
      data.slice(5, 10),
      data.slice(10, 15),
      data.slice(15, 20),
      data.slice(20, 25),
      data.slice(25, 30),
      data.slice(30, 35),
      data.slice(35, 38),
      data.slice(38, 43),
      data.slice(43, 46),
      data.slice(46, 51),
      data.slice(51, 56),
      data.slice(56, 61),
      data.slice(61, 66),
      data.slice(66, 71),
      data.slice(71, data.length),
    ];

    return groups.map((chars, index) => ({
      id: index + 1,
      title: lessonTitles[index] || `Nhóm ${index + 1}`,
      description: `Học các ký tự Katakana ${lessonTitles[index] || "nhóm"}`,
      total_characters: chars.length,
      characters: chars,
    }));
  };

  const handleStartFlashcard = () => {
    setShowLessonSelectModal(true);
    if (selectedLesson) {
      setSelectedLessonIds(new Set([selectedLesson.id]));
    } else {
      setSelectedLessonIds(new Set());
    }
  };

  const handleConfirmFlashcard = () => {
    if (selectedLessonIds.size === 0) {
      setShowNoLessonModal(true);
      return;
    }

    const selectedLessons = lessons.filter((l) => selectedLessonIds.has(l.id));
    const rawCharacters = selectedLessons.flatMap((l) => l.characters);

    // Lọc trùng lặp dựa trên mặt chữ
    const uniqueCharacters = Array.from(
      new Map(rawCharacters.map((char) => [char.character, char])).values(),
    );

    const shuffled = [...uniqueCharacters].sort(() => Math.random() - 0.5);

    const flashcardData = {
      type: "katakana",
      lessonTitle: `Ôn ${selectedLessonIds.size} bài Katakana (${uniqueCharacters.length} ký tự)`,
      characters: shuffled,
    };

    localStorage.setItem(
      "nekoFlashcardHiraKata",
      JSON.stringify(flashcardData),
    );
    setShowLessonSelectModal(false);
    onNavigate("flashcard-hirakata");
  };

  const totalLessonPages = Math.ceil(lessons.length / LESSONS_PER_PAGE);
  const currentLessons = lessons.slice(
    (lessonPage - 1) * LESSONS_PER_PAGE,
    lessonPage * LESSONS_PER_PAGE,
  );
  const currentCharacters =
    selectedLesson?.characters.slice(
      (characterPage - 1) * CHARACTERS_PER_PAGE,
      characterPage * CHARACTERS_PER_PAGE,
    ) || [];
  const totalCharPages = Math.ceil(
    (selectedLesson?.characters.length || 0) / CHARACTERS_PER_PAGE,
  );

  if (isLoading)
    return <NekoLoading message="Mèo đang chuẩn bị bảng chữ Katakana..." />;

  if (lessons.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-3xl font-bold text-red-400">
          Không thể tải dữ liệu Katakana. 😿
        </p>
      </div>
    );

  return (
    <div className="min-h-screen">
      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="relative z-10 mb-12 md:mb-16">
            <span className="hero-section-title hero-text-glow">
              Học Katakana
            </span>
          </h1>
        </div>

        {!selectedLesson ? (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {currentLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLesson(lesson);
                    setCharacterPage(1);
                  }}
                  className="responsive-hover-card animate-fade-in"
                >
                  <div className="text-gray-800 animate-pulse-soft flex justify-center">
                    <Cat className="relative w-full h-full" />
                  </div>
                  <div className="text-center py-6">
                    <p className="hero-text-glow text-white text-4xl">
                      Bài {lesson.id}
                    </p>
                    <p className="hero-text-glow text-2xl text-white mt-2 px-4 line-clamp-1">
                      {lesson.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {totalLessonPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-12">
                <button
                  className="custom-button"
                  onClick={() => setLessonPage((p) => Math.max(1, p - 1))}
                  disabled={lessonPage === 1}
                >
                  <ChevronLeft className="w-6 h-6 text-black" />
                </button>
                <div className="flex gap-3 items-center">
                  {Array.from({ length: totalLessonPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setLessonPage(i + 1)}
                      className={`rounded-full w-10 h-10 flex items-center justify-center transition-all ${
                        lessonPage === i + 1
                          ? "bg-white text-purple-600 font-bold scale-110 shadow-lg"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  className="custom-button"
                  onClick={() =>
                    setLessonPage((p) => Math.min(totalLessonPages, p + 1))
                  }
                  disabled={lessonPage === totalLessonPages}
                >
                  <ChevronRight className="w-6 h-6 text-black" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center mb-12">
              <div className="lesson-header-container">
                <div className="header-wrapper">
                  <h2 className="text-4xl hero-text-glow text-white mb-6">
                    {selectedLesson.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedLesson(null)}
                className="button py-3 px-8 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all font-bold"
              >
                →Quay lại danh sách
              </button>
            </div>

            <div className="grid-container">
              {currentCharacters.map((char) => (
                <div
                  key={char.id}
                  className="glassmorphism-card animate-fade-in group cursor-pointer"
                  onClick={() => setSelectedCharacter(char)}
                >
                  <div className="text-center space-y-4">
                    <p
                      className="text-7xl font-light text-black group-hover:scale-110 transition-transform"
                      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                    >
                      {char.character}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {totalCharPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-16">
                <button
                  className="custom-button"
                  onClick={() => setCharacterPage((p) => Math.max(1, p - 1))}
                  disabled={characterPage === 1}
                >
                  <ChevronLeft className="w-6 h-6 text-black" />
                </button>
                <button
                  className="custom-button"
                  onClick={() =>
                    setCharacterPage((p) => Math.min(totalCharPages, p + 1))
                  }
                  disabled={characterPage === totalCharPages}
                >
                  <ChevronRight className="w-6 h-6 text-black" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MÁE FLASHCARD */}
      <DraggableFloatingNeko
        storageKey="floating-neko-katakana"
        onClick={handleStartFlashcard}
        tooltip={
          <div className="tooltip-slide-out">
            <div className="colored-border-label">
              <p className="text-xl font-bold">Ôn Flashcard Katakana! 🐾</p>
              <div className="absolute bottom-0 right-8 translate-y-full">
                <div className="triangle-down-pink"></div>
              </div>
            </div>
          </div>
        }
        glow={<div className="circular-gradient-hover-glow"></div>}
      />

      <LessonSelectModal
        isOpen={showLessonSelectModal}
        onClose={() => setShowLessonSelectModal(false)}
        lessons={lessons}
        selectedIds={selectedLessonIds}
        onSelectedChange={setSelectedLessonIds}
        onConfirm={handleConfirmFlashcard}
        type="katakana"
      />

      {selectedCharacter && (
        <HiraKataDetailModal
          character={{
            ...selectedCharacter,
            strokeOrder: selectedCharacter.stroke_order,
          }}
          type="katakana"
          onClose={() => setSelectedCharacter(null)}
        />
      )}

      <NekoAlertModal
        isOpen={showNoLessonModal}
        onClose={() => setShowNoLessonModal(false)}
        title="Meow meow..."
        message="Hãy chọn ít nhất 1 bài để ôn flashcard Katakana nhé!"
      />

      {/* TOÀN BềESTYLE TỪ HIRAGANAPAGE  EĐỒNG BềE100% */}
      <style>{`
        @keyframes fly {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0) rotate(-1deg); }
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

        @media (min-width: 640px) { .responsive-circular-image-hover { width: 6rem; height: 6rem; } }
        @media (min-width: 768px) { .responsive-circular-image-hover { width: 7rem; height: 7rem; } }
        @media (min-width: 1024px) { .responsive-circular-image-hover { width: 8rem; height: 8rem; } }
        @media (min-width: 1280px) { .responsive-circular-image-hover { width: 9rem; height: 9rem; } }

        .group:hover .responsive-circular-image-hover {
          transform: scale(1.1) rotate(12deg);
        }

             /* Mặc định cho thiết bị di động (grid-cols-2) */
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem; /* Tương đương gap-6 (6 * 0.25rem) */
}

/* Cho màn hình Medium - Tablet (md:grid-cols-5) */
@media (min-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

/* Cho màn hình Large - Desktop (lg:grid-cols-5) */
@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
      .lesson-header-container {
  width: 100%;
  display: flex;
  justify-content: center;
}
.header-wrapper {
  transform: translateY(-20px); /* Điều chỉnh số này (ví dụ -30px, -40px) để đẩy cao hơn */
  transition: transform 0.3s ease; /* Hiệu ứng mượt nếu tiêu đề thay đổi */
}
      .circular-gradient-hover-glow {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 9999px;
  background-image: linear-gradient(to right, 
    rgba(244, 114, 182, 0.3), /* Pink-400/30 */
    rgba(168, 85, 247, 0.3)  /* Purple-400/30 */
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
  /* Khai báo animation: pulse, chu kỳ 2s, lặp vô hạn, timing function default */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Định nghĩa keyframes cho hiệu ứng pulse */
@keyframes pulse {
  0%, 100% {
    opacity: 1; /* Bắt đầu và kết thúc với độ mờ đầy đủ */
  }
  50% {
    opacity: 0.4; /* Giảm độ mờ xuống 40% ở giữa chu kỳ */
  }
}
      .bold-subheading-style {
  /* text-2xl */
  font-size: 1.5rem; /* 24px */
  line-height: 2rem; /* 32px */
  
  /* font-bold */
  font-weight: 700; 
  
  /* opacity-90 */
  opacity: 0.9; 
  
  /* mt-2 */
  margin-top: 0.5rem; /* 8px */
}
  .responsive-hover-card {
  /* group */
  /* Lớp đánh dấu cho phần tử cha, không có thuộc tính CSS trực tiếp. */
  
  /* relative */
  position: relative;
  
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8); /* Nền trắng mờ 80% */
  
  /* rounded-[32px] */
  border-radius: 2rem; /* 32px */
  
  /* p-8 */
  padding: 2rem; /* 32px */
  
  /* transition-all duration-500 */
  transition: all 500ms ease-in-out; 
  
  /* overflow-hidden */
  overflow: hidden; 
}

/* hover:scale-105 */
.responsive-hover-card:hover {
  transform: scale(1.05); /* Phóng to 5% khi di chuột */
}
      .pulsing-centered-text {
  /* text-center */
  text-align: center;
  
  /* text-white */
  color: #ffffff;
  
  /* font-bold */
  font-weight: 700;
  
  /* text-xl */
  font-size: 1.25rem; /* 20px */
  line-height: 1.75rem; /* 28px */
  
  /* mb-6 */
  margin-bottom: 1.5rem; /* 24px */
  
  /* animate-pulse */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Keyframes cho hiệu ứng pulse */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
      .full-screen-gradient-center {
  /* min-h-screen */
  min-height: 100vh; /* Chiều cao tối thiểu bằng chiều cao của viewport */
  
  /* flex */
  display: flex;
  
  /* items-center */
  align-items: center; /* Căn giữa dọc các item con */
  
  /* justify-center */
  justify-content: center; /* Căn giữa ngang các item con */
  
  /* bg-gradient-to-br */
  background-image: linear-gradient(to bottom right, #581c87, #831843);
  /* from-purple-900 (#581c87) */
  /* to-pink-900 (#831843) */
}
      .centered-circle-transition {
  /* rounded-full */
  border-radius: 9999px; 
  
  /* transition-all duration-200 */
  transition: all 200ms ease-in-out; 
  
  /* flex */
  display: flex;
  
  /* items-center */
  align-items: center; /* Căn giữa dọc */
  
  /* justify-center */
  justify-content: center; /* Căn giữa ngang */
}
      .glassmorphism-card {
  /* bg-white */
  background-color: #ffffff;
  /* rounded-[32px] (Ưu tiên giá trị tùy chỉnh này) */
  border-radius: 2rem; /* 32px */
  
  /* p-8 */
  padding: 2rem; /* 32px */
  
  /* border-2 */
  border-width: 2px;
  
  /* border-white/40 */
  border-color: rgba(255, 255, 255, 0.4); 
  
  /* transition-all duration-400 */
  transition: all 400ms ease-in-out; 
  
  /* shadow-xl */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

/* Các hiệu ứng hover */
.glassmorphism-card:hover {
  /* hover:border-pink-400 */
  border-color: #f472b6; 
  
  /* hover:bg-white/80 */
  background-color: rgba(255, 255, 255, 0.80); 
  
  /* hover:scale-105 */
  transform: scale(1.05);
}
      .small-white-rainbow-glow {
  /* text-lg */
  font-size: 1.125rem; /* 18px */
  line-height: 1.75rem; /* 28px */
  
  /* text-white */
  color: #ffffff; 
  
  /* mt-2 */
  margin-top: 0.5rem; /* 8px */
  
  /* text-glow-rainbow (CSS Tùy chỉnh: Hiệu ứng phát sáng cầu vồng rực rỡ) */
  /* Sử dụng text-shadow để tạo hiệu ứng glow */
  text-shadow: 
    /* Lớp bóng mờ trắng làm nền để chữ sáng hơn */
    0 0 3px rgba(255, 255, 255, 0.9),
    /* Các lớp bóng mờ màu neon chính */
    0 0 8px rgba(255, 0, 150, 0.9),  /* Hồng đậm (Fuschia) */
    0 0 12px rgba(147, 51, 234, 0.9),  /* Tím (Violet) */
    0 0 16px rgba(6, 182, 212, 0.9);   /* Xanh ngọc (Cyan) */
}
      .white-rainbow-glow-bold {
  /* text-3xl */
  font-size: 1.875rem; /* 30px */
  line-height: 2.25rem; /* 36px */
  
  /* font-bold */
  font-weight: 700; 
  
  /* text-white */
  color: #ffffff; 
  
  /* text-glow-rainbow (CSS Tùy chỉnh: Hiệu ứng phát sáng cầu vồng rực rỡ) */
  /* Tập trung vào các lớp bóng mờ màu neon để làm nổi bật chữ trắng */
  text-shadow: 
    /* Lớp bóng mờ trắng nhẹ làm nền */
    0 0 4px rgba(255, 255, 255, 0.8),
    /* Các lớp bóng mờ màu neon chính */
    0 0 10px rgba(255, 0, 150, 0.9),  /* Hồng đậm (Fuschia) */
    0 0 15px rgba(147, 51, 234, 0.9),  /* Tím (Violet) */
    0 0 20px rgba(6, 182, 212, 0.9);   /* Xanh ngọc (Cyan) */
    
  /* drop-shadow-lg loại bỏ do không phù hợp với hiệu ứng glow của chữ trắng */
  filter: none; /* Đảm bảo không có drop-shadow */
}
      
      .small-rainbow-glow {
  /* text-2xl */
  font-size: 1.5rem; /* 24px */
  line-height: 2rem; /* 32px */
  
  /* text-white */
  color: #ffffff; 
  
  /* mt-1 */
  margin-top: 0.25rem; /* 4px */
  
  /* text-glow-rainbow (CSS Tùy chỉnh: Hiệu ứng phát sáng cầu vồng rực rỡ) */
  /* Sử dụng text-shadow để tạo hiệu ứng glow */
  text-shadow: 
    /* Lớp bóng mờ trắng làm nền */
    0 0 2px rgba(255, 255, 255, 0.8),
    /* Các lớp bóng mờ màu neon */
    0 0 5px rgba(255, 0, 150, 0.9),  /* Hồng đậm (Fuschia) */
    0 0 8px rgba(147, 51, 234, 0.9),  /* Tím (Violet) */
    0 0 12px rgba(6, 182, 212, 0.9);   /* Xanh ngọc (Cyan) */
}
      .rainbow-glow-title {
  /* text-4xl */
  font-size: 2.25rem; /* 36px */
  line-height: 2.5rem; /* 40px */
  
  /* font-black */
  font-weight: 900; 
  
  /* text-white */
  color: #ffffff; /* Giữ nguyên màu chữ trắng */
  
  /* text-glow-rainbow (CSS Tùy chỉnh: Hiệu ứng phát sáng cầu vồng rực rỡ) */
  /* Sử dụng text-shadow để tạo hiệu ứng glow, không dùng filter: drop-shadow */
  text-shadow: 
    /* Lớp bóng mờ trắng làm nền */
    0 0 4px rgba(255, 255, 255, 0.8),
    /* Các lớp bóng mờ màu neon */
    0 0 10px rgba(255, 0, 150, 0.9),  /* Hồng đậm (Fuschia) */
    0 0 15px rgba(147, 51, 234, 0.9),  /* Tím (Violet) */
    0 0 20px rgba(6, 182, 212, 0.9);   /* Xanh ngọc (Cyan) */
    
    /* Có thể thêm các màu khác nếu muốn đầy đủ dải cầu vồng */
}
      .full-gradient-hover-effect {
  /* absolute */
  position: absolute;
  
  /* inset-0 */
  top: 0;
  right: 0;
  bottom: 0;
  left: 0; /* Bao phủ hoàn toàn phần tử cha */
  
  /* rounded-2xl */
  border-radius: 1rem; /* 16px */
  
  /* bg-linear-to-r from-pink-500 via-purple-500 to-cyan-500 */
  background: linear-gradient(to right, #ec4899, #a855f7, #06b6d4);
  
  /* opacity-0 */
  opacity: 0;
  
  /* blur-xl */
  filter: blur(20px); 
  
  /* transition-opacity duration-500 */
  transition: opacity 500ms ease-in-out;
  
  /* -z-10 */
  z-index: -10; /* Đặt lớp này ra phía sau nội dung chính */
}

/* group-hover:opacity-100 (Áp dụng khi di chuột qua phần tử cha có class 'group') */
.group:hover .full-gradient-hover-effect {
  opacity: 1;
}
      .glass-card-hover-effect {
  /* relative */
  position: relative;
  
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8); /* Nền trắng mờ 80% */
  
  /* border */
  border-width: 1px; 
  
  /* border-white/30 */
  border-color: rgba(255, 255, 255, 0.3); 
  
  /* rounded-2xl */
  border-radius: 1rem; /* 16px */
  
  /* p-6 */
  padding: 1.5rem; /* 24px */
  
  /* transition-all duration-400 */
  transition: all 400ms ease-in-out; 
  
  /* shadow-xl */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); 
}

/* hover:border-pink-400, hover:bg-white/20, hover:scale-[1.02], hover:shadow-2xl, hover:shadow-pink-500/30 */
.glass-card-hover-effect:hover {
  /* hover:border-pink-400 */
  border-color: #f472b6; 
  
  /* hover:bg-white/20 */
  background-color: rgba(255, 255, 255, 0.2); 
  
  /* hover:scale-[1.02] */
  transform: scale(1.02);
  
  /* hover:shadow-2xl (Kết hợp với shadow màu hồng) */
  box-shadow: 
    /* shadow-2xl */
    0 25px 50px -12px rgba(0, 0, 0, 0.25), 
    /* hover:shadow-pink-500/30 */
    0 0 15px rgba(236, 72, 153, 0.3); /* Giá trị gần đúng cho shadow màu hồng */
}
      .transparent-search-input {
  /* w-full */
  width: 100%;
  
  /* py-8 */
  padding-top: 2rem;    /* 32px */
  padding-bottom: 2rem; /* 32px */
  
  /* pl-28 */
  padding-left: 7rem;   /* 112px */
  
  /* pr-10 */
  padding-right: 2.5rem; /* 40px */
  
  /* text-3xl */
  font-size: 1.875rem; /* 30px */
  line-height: 2.25rem; /* 36px */
  
  /* font-black */
  font-weight: 900; 
  
  /* text-white */
  color: #ffffff; 
  
  /* bg-transparent */
  background-color: transparent; 
  
  /* text-center */
  text-align: center; 
}

/* focus:outline-none */
.transparent-search-input:focus {
  outline: 0; /* Loại bềEviền focus mặc định của trình duyệt */
}

/* placeholder:text-white/70 và placeholder:font-bold */
.transparent-search-input::placeholder {
  color: rgba(255, 255, 255, 0.7); /* Màu trắng mềE70% */
  font-weight: 700; /* In đậm */
}
      .element-overlay-positioned {
  /* absolute */
  position: absolute;
  
  /* left-8 */
  left: 2rem; /* 32px */
  
  /* top-1/2 */
  top: 50%;
  
  /* -translate-y-1/2 */
  transform: translateY(-50%); /* Căn giữa dọc */
  
  /* pointer-events-none */
  pointer-events: none; /* NGāE CHẶN tương tác chuột/chạm */
  
  /* z-20 */
  z-index: 20; 
}
      .icon-centered-left {
  /* absolute */
  position: absolute;
  
  /* left-8 */
  left: 2rem; /* 32px */
  
  /* top-1/2 */
  top: 50%;
  
  /* -translate-y-1/2 */
  transform: translateY(-50%); /* Dùng đềEcăn giữa dọc (Vertical centering) */
  
  /* w-12 */
  width: 3rem; /* 48px */
  
  /* h-12 */
  height: 3rem; /* 48px */
  
  /* text-white */
  color: #ffffff;
  
  /* z-20 */
  z-index: 20; 
  
  /* drop-shadow-neon (CSS Tùy chỉnh gần đúng cho hiệu ứng neon) */
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 10px #f472b6);
  /* Hoặc sử dụng text-shadow nếu đây là icon dạng chữ: */
  /* text-shadow: 0 0 5px #fff, 0 0 10px #f472b6; */
}
      .glass-effect-container {
  /* relative */
  position: relative;
  
  /* bg-black/50 */
  background-color: rgba(0, 0, 0, 0.5); /* Nền đen mềE50% */
  
  /* backdrop-blur-2xl */
  backdrop-filter: blur(40px); /* Hiệu ứng làm mềEnền phía sau */
  
  /* rounded-full */
  border-radius: 9999px; 
  
  /* border-4 */
  border-width: 4px; 
  
  /* border-white/40 */
  border-color: rgba(255, 255, 255, 0.4); /* Viền trắng mềE40% */
  
  /* shadow-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* Bóng lớn */
  
  /* ring-8 ring-white/10 (Tạo hiệu ứng "ring" bằng box-shadow inset hoặc outline/viền thứ hai) */
  /* Sử dụng box-shadow đềEmô phỏng hiệu ứng ring */
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25), /* Shadow-2xl */
    0 0 0 8px rgba(255, 255, 255, 0.1); /* Ring 8px, màu trắng 10% */

  /* overflow-hidden */
  overflow: hidden; 
}

/* LƯU ÁEQUAN TRỌNG VỀ backdrop-filter:
ĐềEđảm bảo backdrop-filter hoạt động, phần tử này phải có đềEtrong suốt (opacity < 1) hoặc màu nền sử dụng rgba() (như bg-black/50 đã làm).
*/
      .pulsing-gradient-aura {
  /* absolute */
  position: absolute;
  
  /* -inset-3 */
  top: -0.75rem;    /* -12px */
  bottom: -0.75rem; /* -12px */
  left: -0.75rem;   /* -12px */
  right: -0.75rem;  /* -12px */
  
  /* rounded-full */
  border-radius: 9999px; 
  
  /* bg-linear-to-r from-pink-400 via-purple-500 to-cyan-400 */
  background: linear-gradient(to right, #f472b6, #8b5cf6, #22d3ee);
  
  /* blur-xl */
  filter: blur(24px); 
  
  /* opacity-60 */
  opacity: 0.6;
  
  /* z-index */
  z-index: -1; /* Đảm bảo hiệu ứng nằm dưới nội dung chính */
  
  /* transition (đềEchuyển đổi opacity mượt mà) */
  transition: opacity 150ms ease-in-out;
  
  /* animate-border-spin */
  animation: border-spin 3s linear infinite; 
  
  /* delay-75 */
  animation-delay: 75ms; 
}

/* group-focus-within:opacity-90 (Sử dụng selector lồng nhau) */
/* Áp dụng cho phần tử mẹ có class 'group' và bên trong nó có phần tử đang focus */
.group:focus-within .pulsing-gradient-aura {
  opacity: 0.9;
}

/* Keyframes cho hiệu ứng border-spin (giả định) */
@keyframes border-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
      .gradient-border-effect {
  /* absolute */
  position: absolute;
  
  /* -inset-1.5 */
  top: -0.375rem;    /* -6px */
  bottom: -0.375rem; /* -6px */
  left: -0.375rem;   /* -6px */
  right: -0.375rem;  /* -6px */
  
  /* rounded-full */
  border-radius: 9999px; 
  
  /* bg-linear-to-r from-pink-500 via-purple-600 to-cyan-500 */
  background: linear-gradient(to right, #ec4899, #9333ea, #06b6d4);
  
  /* opacity-90 */
  opacity: 0.9;
  
  /* animate-border-spin (CSS Tùy chỉnh: Tạo keyframes và áp dụng) */
  animation: border-spin 3s linear infinite; 
  z-index: -1; /* Thường được dùng đềEđặt lớp này dưới nội dung chính */
}

/* group-focus-within:opacity-100 (Sử dụng selector lồng nhau) */
/* Áp dụng cho phần tử mẹ có class 'group' và bên trong nó có phần tử đang focus */
.group:focus-within .gradient-border-effect,
.gradient-border-effect:focus { /* ChềEsử dụng focus trực tiếp nếu không phải group */
  opacity: 1;
}

/* Keyframes cho hiệu ứng border-spin (giả định) */
@keyframes border-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
      .hero-section-title {
  /* relative */
  position: relative;
  
  /* block */
  display: block; 
  
  /* p-x (padding-left và padding-right) */
  padding-left: 2.5rem;  /* 40px */
  padding-right: 2.5rem; /* 40px */
  
  /* p-y (padding-top và padding-bottom) */
  padding-top: 2rem;    /* 32px */
  padding-bottom: 2rem; /* 32px */
  
  /* font-black */
  font-weight: 900; 
  
  /* tracking-wider */
  letter-spacing: 0.05em; 
  
  /* text-white */
  color: #ffffff; 
  
  /* drop-shadow-2xl (Giá trị gần đúng, có thể phức tạp hơn) */
  filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15)) drop-shadow(0 10px 10px rgba(0, 0, 0, 0.04));
  
  /* -translate-y-3 */
  transform: translateY(-0.75rem); /* -12px */
  
  /* text-6xl (Giá trềEmặc định cho text-6xl) */
  font-size: 3.75rem; /* 60px */
  line-height: 1; 
  
  /* hero-text-glow (CSS Tùy chỉnh gần đúng cho hiệu ứng glow) */
  text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #f687b3; /* Ánh sáng trắng và hồng nhạt */
  
  /* animate-pulse-soft (CSS Tùy chỉnh: Tạo keyframes và áp dụng) */
  animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Kích thước text cho màn hình nhềE(sm:text-6xl) */
/* Cùng giá trềEmặc định, không cần media query */

/* Thiết lập cho màn hình trung bình (md) - min-width: 768px */
@media (min-width: 768px) {
  .hero-section-title {
    /* md:px-14 */
    padding-left: 3.5rem;  /* 56px */
    padding-right: 3.5rem; /* 56px */
    
    /* md:py-10 */
    padding-top: 2.5rem;    /* 40px */
    padding-bottom: 2.5rem; /* 40px */
    
    /* md:text-7xl */
    font-size: 4.5rem; /* 72px */
    line-height: 1;
    
    /* md:-translate-y-4 */
    transform: translateY(-1rem); /* -16px */
  }
}

/* Thiết lập cho màn hình lớn (lg) - min-width: 1024px */
@media (min-width: 1024px) {
  .hero-section-title {
    /* lg:px-20 */
    padding-left: 5rem;  /* 80px */
    padding-right: 5rem; /* 80px */
    
    /* lg:py-12 */
    padding-top: 3rem;    /* 48px */
    padding-bottom: 3rem; /* 48px */
    
    /* lg:text-10xl (Không có trong Tailwind mặc định, tôi dùng 9xl + 1/2) */
    font-size: 8rem; /* 128px */ 
    line-height: 1;
    
    /* lg:-translate-y-5 */
    transform: translateY(-1.25rem); /* -20px */
  }
}

/* Keyframes cho hiệu ứng pulse-soft (giả định) */
@keyframes pulse-soft {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.9;
  }
}
      .circular-shadow-button {
  /* p-4 */
  padding: 1rem; /* 16px */
  
  /* rounded-full */
  border-radius: 9999px; 
  
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8); 
  
  /* transition */
  transition: all 150ms ease-in-out; 
}

/* hover:bg-pink-200 */
.circular-shadow-button:hover {
  background-color: #fecaca; /* pink-200 */
}

/* disabled:opacity-50 */
.circular-shadow-button:disabled {
  opacity: 0.5;
}

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
  .button {
  /* px-8 py-4 -> padding: 1rem top/bottom, 2rem left/right */
  padding: 1rem 2rem;
  /* bg-white */
  background-color: #ffffff;
  /* backdrop-blur-xl approximation */
  backdrop-filter: blur(8px);
  /* rounded-full */
  border-radius: 9999px;
  /* text-black font-bold */
  color: #000000;
  font-weight: 700;
  /* smooth hover */
  transition: background-color 150ms ease, transform 150ms ease;
}
.button:hover {
  /* hover:bg-white/60 */
  background-color: rgba(255,255,255,0.6);
}

/* md:p-5 */
@media (min-width: 768px) {
  .custom-button {
    padding: 1.25rem;
  }
}

/* hover:bg-pink-200, hover:scale-105 */
.custom-button:hover {
  background-color: #fecaca; /* pink-200 */
  transform: scale(1.05);
}

/* disabled:opacity-50 */
.custom-button:disabled {
  opacity: 0.5;
  /* Thêm disabled:pointer-events-none nếu bạn muốn chặn click */
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

     @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }    
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
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
