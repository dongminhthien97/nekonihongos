// src/pages/FlashcardPage.tsx
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Cat, Sparkles } from "lucide-react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";
import { Background } from "./Background";
import { NekoLoading } from "./NekoLoading";
import { NekoAlertModal } from "./NekoAlertModal";

interface Word {
  japanese: string;
  kanji: string;
  vietnamese: string;
  hanViet?: string;
}

interface FlashcardData {
  lessonId: number;
  lessonTitle: string;
  words: Word[];
}

export function FlashcardPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("Flashcard Mèo");
  const [isLoading, setIsLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("Meow meow...");
  const [showLostWordsModal, setShowLostWordsModal] = useState(false);
  const [showAllDoneModal, setShowAllDoneModal] = useState(false);
  const [showContinueMessage, setShowContinueMessage] = useState(false);
  const [continueMessage, setContinueMessage] = useState("");

  // HIỆN LOADING 1 GIÂY + ĐỌC DỮ LIỆU TỪ localStorage
  useEffect(() => {
    const loadingTimer = setTimeout(() => setIsLoading(false), 1000);

    let dataProcessed = false;

    const loadFlashcardData = () => {
      const data = localStorage.getItem("nekoFlashcardData");

      if (!data) {
        console.warn("Không có dữ liệu flashcard trong localStorage");
        setErrorMessage(
          "Không có dữ liệu flashcard! Mèo đưa bạn về trang từ vựng nhé...",
        );
        setShowErrorModal(true);
        return;
      }

      try {
        const parsed: FlashcardData = JSON.parse(data);

        // ĐẢM BẢO ĐÃ CÓ DỮ LIỆU TRƯỚC KHI XÓA
        setWords(parsed.words || []);
        setLessonTitle(parsed.lessonTitle || "Flashcard Mèo");

        dataProcessed = true;
      } catch (err) {
        setErrorTitle("Meow meow...");
        setErrorMessage(
          "Dữ liệu flashcard bị lỗi rồi! Mèo đưa bạn về trang từ vựng nhé...",
        );
        setShowErrorModal(true);
      }
    };

    loadFlashcardData();
  }, [onNavigate]);

  const handleReturnToOrigin = () => {
    const saved = localStorage.getItem("nekoFlashcardData");
    let targetPage = "vocabulary-n5"; // fallback an toàn

    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.originPage) {
          targetPage = data.originPage;
        }
      } catch (e) {
        console.warn("Lỗi parse flashcard data");
      }
    }

    // XÓA SAU KHI ĐÃ ĐỌC XONG originPage
    localStorage.removeItem("nekoFlashcardData");
    localStorage.removeItem("nekoFlashcardAllWords");
    onNavigate(targetPage);
  };
  // HIỆN LOADING 1 GIÂY ĐẦU TIÊN
  if (isLoading) {
    return (
      <NekoLoading
        message="Mèo đang chuẩn bị flashcard siêu dễ thương cho bạn..."
        duration={0}
      />
    );
  }
  if (showErrorModal) {
    return (
      <NekoAlertModal
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          onNavigate("vocabulary");
        }}
        title={errorTitle}
        message={errorMessage}
      />
    );
  }

  // NẾU KHÔNG CÓ TỪ → HIỆN MÀN HÌNH LỖI DỄ THƯƠNG (tùy chọn)
  if (words.length === 0) {
    return (
      <NekoAlertModal
        isOpen={true}
        onClose={() => onNavigate("vocabulary")}
        title="Meow meow..."
        message="Không có từ vựng để học rồi! Mèo đưa bạn về trang từ vựng nhé"
      />
    );
  }

  const currentWord = words[currentIndex];
  const progress =
    words.length > 0 ? (((currentIndex % 10) + 1) / 10) * 100 : 0;

  const handleFlip = () => setIsFlipped((prev) => !prev);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex === words.length - 1) {
      setShowEndModal(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handleContinue = () => {
    const allWordsJson = localStorage.getItem("nekoFlashcardAllWords");
    if (!allWordsJson) {
      setShowLostWordsModal(true);
      return;
    }

    const allWords: Word[] = JSON.parse(allWordsJson);
    const learnedWords = new Set(words.map((w) => w.japanese));
    const remainingWords = allWords.filter(
      (word) => !learnedWords.has(word.japanese),
    );

    let newWords: Word[] = [];

    if (remainingWords.length >= 10) {
      const shuffled = [...remainingWords].sort(() => Math.random() - 0.5);
      newWords = shuffled.slice(0, 10);

      // HIỆN MODAL SIÊU DỄ THƯƠNG
      setContinueMessage(
        "Mèo đã chọn 10 từ mới hoàn toàn khác lần trước cho bạn rồi đấy!",
      );
      setShowContinueMessage(true);
    } else if (remainingWords.length > 0) {
      newWords = [...remainingWords];
      const needed = 10 - remainingWords.length;
      const oldWords = allWords
        .filter((word) => learnedWords.has(word.japanese))
        .sort(() => Math.random() - 0.5)
        .slice(0, needed);
      newWords.push(...oldWords);

      setContinueMessage(
        "Chỉ còn ít từ mới thôi, mèo bù thêm vài từ cũ để bạn ôn lại nhé!",
      );
      setShowContinueMessage(true);
    } else {
      newWords = [...allWords].sort(() => Math.random() - 0.5).slice(0, 10);
      setShowAllDoneModal(true); // đã có modal riêng
    }

    setWords((prev) => [...prev, ...newWords]);
    setCurrentIndex((prev) => prev + 1);
    setIsFlipped(false);
    setShowEndModal(false);
  };
  {
    /* MODAL KHI MÈO LẠC MẤT DANH SÁCH TỪ */
  }
  {
    showLostWordsModal && (
      <NekoAlertModal
        isOpen={showLostWordsModal}
        onClose={() => {
          setShowLostWordsModal(false);
          onNavigate("vocabulary");
        }}
        title="Meow meow..."
        message="Mèo lạc mất danh sách từ rồi! Mèo đưa bạn về trang từ vựng nhé..."
      />
    );
  }
  {
    /* MODAL KHI ĐÃ HỌC HẾT BÀI – SIÊU DỄ THƯƠNG, SIÊU TỰ HÀO */
  }
  {
    showAllDoneModal && (
      <NekoAlertModal
        isOpen={showAllDoneModal}
        onClose={() => setShowAllDoneModal(false)}
        title="Tuyệt vời quá đi!!!"
        message="Bạn đã học hết bài này rồi! Mèo tự hào về bạn lắm luôn á! Giờ mèo cho ôn lại 10 từ ngẫu nhiên nhé!"
      />
    );
  }
  {
    /* MODAL THÔNG BÁO HỌC TIẾP – SIÊU VUI, SIÊU MÈO, SIÊU TÌNH CẢM */
  }
  {
    showContinueMessage && (
      <NekoAlertModal
        isOpen={showContinueMessage}
        onClose={() => setShowContinueMessage(false)}
        title="Meow meow!!!"
        message={continueMessage}
      />
    );
  }
  return (
    <div className="soft-gradient-background">
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="pt-12 pb-6 px-4 flex flex-col items-center">
          {/* Tiêu đề với các hiệu ứng mạnh của bạn */}
          <h1 className="text-center text-5xl md:text-6xl font-black text-white drop-shadow-2xl mb-8 hero-text-glow leading-tight">
            {lessonTitle}
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-2xl mb-8">
          <div className="progress-bar-shell">
            <div
              className="progress-bar-fill-animated"
              style={{ width: `${progress}%` }}
            >
              <div className="bouncing-absolute-badge">🐾🐾🐾</div>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="relative w-full max-w-2xl h-96 mb-12 perspective-1000">
          <div
            onClick={handleFlip}
            className={`flashcard-inner ${
              isFlipped ? "flipped" : ""
            } w-full h-full cursor-pointer`}
          >
            {/* Mặt trước */}
            <div className="flashcard-front-face">
              <p className="huge-dark-title">{currentWord.japanese}</p>
              {currentWord.kanji &&
                currentWord.kanji !== currentWord.japanese && (
                  <p className="sub-text-muted">{currentWord.kanji}</p>
                )}
              <p className="caption-text-muted">Nhấn để xem nghĩa</p>
              <Cat className="absolute-wiggle-icon" />
            </div>

            {/* Mặt sau */}
            <div className="flashcard-back-face">
              <p className="centered-hero-text">{currentWord.vietnamese}</p>

              {/* Chỉ hiển thị Âm Hán Việt nếu có (tức là flashcard từ Kanji N5) */}
              {currentWord.hanViet && (
                <div className="mt-6 text-center">
                  <p className="HanViet">Âm Hán: {currentWord.hanViet}</p>
                </div>
              )}

              <p className="caption-text-white-subtle">Nhấn để quay lại</p>
              <Sparkles className="absolute-pulsing-icon" />
            </div>
          </div>
        </div>

        {/* NÚT ĐIỀU HƯỚNG SIÊU ĐẸP */}
        <div className="flex items-center justify-center gap-12 mt-16">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="interactive-glass-card"
          >
            <div className="gradient-blur-effect" />
            <ChevronLeft className="interactive-icon" strokeWidth={4} />
            <Cat className="bouncing-top-left-icon" />
          </button>

          <div className="relative">
            <Cat className="bouncing-pink-icon-shadow" strokeWidth={3} />
            <Sparkles className="absolute-pulsing-corner-icon" />
            <Sparkles className="absolute-pulsing-bottom-icon" />
          </div>

          <button
            onClick={handleNext}
            className="interactive-gradient-cta-card interactive-gradient-cta-card:hover"
          >
            <div className="glass-blur-effect group:hover glass-blur-effect" />
            <div className="hover-gradient-glow-effect group:hover hover-gradient-glow-effect " />

            <div className="flex-centered-text-row">
              <span className="heavy-shadowed-title">
                {currentIndex === words.length - 1
                  ? "HOÀN THÀNH!"
                  : "TIẾP THEO"}
              </span>
              {currentIndex !== words.length - 1 && (
                <ChevronRight
                  className="pulsing-element-medium"
                  strokeWidth={5}
                />
              )}
              {currentIndex === words.length - 1 && (
                <div className="flex gap-2">
                  <span className="text-6xl bouncing-animation">🥂</span>
                  <span className="text-6xl bouncing-animation">🎉</span>
                  <span className="text-6xl bouncing-animation">🍻</span>
                </div>
              )}
            </div>
            <Cat className="absolute-wiggle-corner-icon" />
          </button>
        </div>

        {/* Modal học tiếp */}
        {showEndModal && (
          <div className="modal-backdrop-dark">
            <div className="modal-card-large">
              <Cat className="bouncing-pink-icon-large" />
              <h2 className="section-title-xl-bold">Siêu giỏi!</h2>
              <p className="paragraph-large-spaced">Mèo tự hào về bạn lắm!</p>
              <div className="flex gap-8 justify-center">
                <button
                  onClick={handleContinue}
                  className="gradient-cta-button-large gradient-cta-button-large:hover"
                >
                  Học tiếp!
                </button>
                <button
                  onClick={handleReturnToOrigin}
                  className="gray-cta-button-large gray-cta-button-large:hover"
                >
                  Về trang trước
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <style>{`
      .gray-cta-button-large {
  /* px-12 py-6 */
  padding-left: 3rem; 
  padding-right: 3rem; 
  padding-top: 1.5rem; 
  padding-bottom: 1.5rem; 
  
  /* bg-gray-400 */
  background-color: #9ca3af;
  
  /* text-white */
  color: #ffffff;
  
  /* rounded-2xl */
  border-radius: 1rem;
  
  /* text-2xl */
  font-size: 1.5rem;
  
  /* font-bold */
  font-weight: 700;
  
  /* transition-all */
  transition: all 150ms ease-in-out;
}

/* Các hiệu ứng hover */
.gray-cta-button-large:hover {
  /* hover:scale-105 */
  transform: scale(1.05);
}
      .gradient-cta-button-large {
  /* px-12 py-6 */
  padding-left: 3rem; 
  padding-right: 3rem; 
  padding-top: 1.5rem; 
  padding-bottom: 1.5rem; 
  
  /* bg-gradient-to-r from-pink-500 to-purple-600 */
  background-image: linear-gradient(to right, #ec4899, #7c3aed);
  
  /* text-white */
  color: #ffffff;
  
  /* rounded-2xl */
  border-radius: 1rem;
  
  /* text-2xl */
  font-size: 1.5rem;
  
  /* font-bold */
  font-weight: 700;
  
  /* transition-all */
  transition: all 150ms ease-in-out;
}

/* Các hiệu ứng hover */
.gradient-cta-button-large:hover {
  /* hover:scale-110 */
  transform: scale(1.1);
}
      .paragraph-large-spaced {
  font-size: 1.5rem;
  color: #374151;
  margin-bottom: 2.5rem;
}
      .section-title-xl-bold {
  font-size: 3rem;
  font-weight: 900;
  color: #7c3aed;
  margin-bottom: 1rem;
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

.bouncing-pink-icon-large {
  width: 8rem;
  height: 8rem;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1.5rem;
  color: #ec4899;
  animation: bounce 1s infinite;
}
      .modal-card-large {
  background-color: #ffffff;
  border-radius: 1.5rem; /* rounded-3xl */
  padding: 3rem; /* p-12 */
  max-width: 32rem; /* max-w-lg */
  width: 100%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* shadow-2xl */
}
      .modal-backdrop-dark {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  
  /* bg-black/70 */
  background-color: rgba(0, 0, 0, 0.7);
  
  /* flex items-center justify-center */
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* z-50 */
  z-index: 50;
}
      @keyframes wiggle {
  0%, 100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}

.absolute-wiggle-corner-icon {
  position: absolute;
  bottom: -1.5rem;
  right: -1.5rem;
  width: 4rem;
  height: 4rem;
  color: rgba(255, 255, 255, 0.8);
  animation: wiggle 1s ease-in-out infinite;
}
      @keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulsing-element-medium {
  width: 3.5rem;
  height: 3.5rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
      .heavy-shadowed-title {
  font-size: 2.25rem;
  font-weight: 900;
  
  /* drop-shadow-2xl (Tailwind dùng filter: drop-shadow, thường áp dụng cho hình dạng không phải hình chữ nhật) */
  filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
}
      .flex-centered-text-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.5rem; /* gap-6 */
  color: #ffffff;
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

.bouncing-animation {
  animation: bounce 1s infinite;
}
      .glass-blur-effect {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  
  /* bg-white/30 */
  background-color: rgba(255, 255, 255, 0.3);
  
  /* blur-2xl (40px) */
  filter: blur(40px); 
  
  /* transition-all duration-700 */
  transition: all 700ms ease-in-out;
}

/* Tương tác Hover (Giả định phần tử cha có lớp '.group') */
.group:hover .glass-blur-effect {
  /* group-hover:blur-3xl (64px) */
  filter: blur(64px); 
}
      .interactive-gradient-cta-card {
  /* relative */
  position: relative;
  
  /* px-16 py-10 */
  padding-left: 4rem; 
  padding-right: 4rem; 
  padding-top: 2.5rem; 
  padding-bottom: 2.5rem; 
  
  /* bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-500 */
  background-image: linear-gradient(to bottom right, #ec4899, #7c3aed, #06b6d4);
  
  /* rounded-3xl */
  border-radius: 1.5rem;
  
  /* shadow-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* transform (Trạng thái ban đầu) */
  transform: scale(1);
  
  /* transition-all duration-500 */
  transition: all 500ms ease-in-out;
  
  /* overflow-hidden */
  overflow: hidden;
}

/* Tương tác Hover */
.interactive-gradient-cta-card:hover {
  /* hover:shadow-cyan-500/70 */
  box-shadow: 0 25px 50px -12px rgba(6, 182, 212, 0.7); /* Tùy chỉnh bóng đổ màu xanh ngọc */
  
  /* hover:scale-110 */
  transform: scale(1.1);
}
      @keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.absolute-pulsing-bottom-icon {
  position: absolute;
  bottom: -1rem;
  left: -1rem;
  width: 2rem;
  height: 2rem;
  color: #c084fc;
  
  /* animate-pulse */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  
  /* delay-300 (Độ trễ trước khi animation bắt đầu) */
  animation-delay: 300ms;
}
      @keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.absolute-pulsing-corner-icon {
  position: absolute;
  top: -1rem;
  right: -1rem;
  width: 2.5rem;
  height: 2.5rem;
  color: #facc15;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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

.bouncing-pink-icon-shadow {
  width: 6rem;
  height: 6rem;
  color: #ec4899;
  animation: bounce 1s infinite;
  
  /* drop-shadow-2xl (Tailwind dùng filter: drop-shadow, thường áp dụng cho hình dạng không phải hình chữ nhật) */
  filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
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

.bouncing-top-left-icon {
  position: absolute;
  top: -1rem;
  left: -1rem;
  width: 3rem;
  height: 3rem;
  color: #ec4899;
  animation: bounce 1s infinite;
}
      .interactive-icon {
  width: 4rem;
  height: 4rem;
  color: #7c3aed;
  transition: color 150ms ease-in-out;
}

.group:hover .interactive-icon {
  color: #4c1d95;
}
      .gradient-blur-effect {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: linear-gradient(to right, 
    rgba(244, 114, 182, 0.2), 
    rgba(126, 34, 206, 0.2)
  );
  border-radius: 1.5rem;
  filter: blur(24px); 
  transition: all 150ms ease-in-out;
}

.group:hover .gradient-blur-effect {
  filter: blur(40px);
}
      .interactive-glass-card {
  position: relative;
  padding: 2rem;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transform: scale(1);
  transition: all 300ms ease-in-out;
}

.interactive-glass-card:hover {
  box-shadow: 0 25px 50px -12px rgba(236, 72, 153, 0.5);
  transform: scale(1.1);
}

.interactive-glass-card[disabled] {
  opacity: 0.4;
  transform: scale(1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
  cursor: not-allowed;
}
      @keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.absolute-pulsing-icon {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 3rem;
  height: 3rem;
  color: #fcd34d;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
      .caption-text-white-subtle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 1.5rem;
}

.HanViet{
font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
}
      .centered-hero-text {
  font-size: 4.00rem;
  font-weight: 900;
  color: #ffffff;
  text-align: center;
}
.flashcard-back-face {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: linear-gradient(to bottom right, #ec4899, #7c3aed);
  border-radius: 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  /* Cần thiết cho hiệu ứng lật 3D */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  
  /* *************************************** */
  /* BỔ SUNG: Xoay mặt sau 180 độ theo trục Y */
  /* *************************************** */
  transform: rotateY(180deg); 
}

/* @keyframes wiggle (Giữ nguyên) */
@keyframes wiggle {
  0%, 100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}

.absolute-wiggle-icon {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 3rem;
  height: 3rem;
  color: #f472b6;
  animation: wiggle 1s ease-in-out infinite;
}
      .caption-text-muted {
  font-size: 1.125rem;
  color: #6b7280;
  margin-top: 2rem;
}
      .sub-text-muted {
  font-size: 3rem;
  color: #a855f7;
  margin-top: 1rem;
  opacity: 0.8;
}
      .huge-dark-title {
  font-size: 6rem;
  font-weight: 900;
  color: #1f2937;
}
      .flashcard-front-face {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: #ffffff;
  border-radius: 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  /* Cần thiết cho hiệu ứng lật 3D */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
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

.bouncing-absolute-badge {
  position: absolute;
  right: 0;
  top: 50%;
  
  /* -translate-y-1/2 translate-x-1/2 */
  transform: translateY(-50%) translateX(50%);
  
  font-size: 1.5rem;
  animation: bounce 1s infinite;
}
      .progress-bar-fill-animated {
  height: 100%;
  background-image: linear-gradient(to right, #f472b6, #7c3aed);
  transition: all 500ms ease-in-out;
  position: relative;
}
  .progress-bar-shell {
  height: 2rem;
  background-color: #ffffff;
  border-radius: 9999px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}
      .metadata-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}
      .glass-button {
  /* px-10 py-5 */
  padding-left: 2.5rem;
  padding-right: 2.5rem;
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
  
  /* bg-white/20 */
  background-color: rgba(255, 255, 255, 0.2);
  
  /* backdrop-blur-xl */
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  
  /* rounded-2xl */
  border-radius: 1rem;
  
  /* text-white text-2xl font-bold */
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  
  /* transition-all */
  transition: all 150ms ease-in-out;
}

/* Các hiệu ứng hover */
.glass-button:hover {
  /* hover:bg-white/30 */
  background-color: rgba(255, 255, 255, 0.3);
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

.bouncing-pink-icon {
  width: 10rem;
  height: 10rem;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 2rem;
  animation: bounce 1s infinite;
  color: #f472b6;
}
      .dark-full-screen-center {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(to bottom right, #581c87, #831843);
}
  .soft-gradient-background {
  min-height: 100vh;
}
        .perspective-1000 {
          perspective: 1000px;
        }
        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
        }
        .flashcard-inner.flipped {
          transform: rotateY(180deg);
        }
        .flashcard-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 32px;
        }
        .flashcard-back {
          transform: rotateY(180deg);
        }

        @keyframes wiggle {
          0%,
          100% {
            transform: rotate(-8deg);
          }
          50% {
            transform: rotate(8deg);
          }
        }
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }

        .hero-text-glow {
          text-shadow: 0 0 20px #ff69b4, 0 0 40px #a020f0, 0 0 60px #00ffff,
            0 0 80px #ff69b4, 0 0 100px #a020f0, 0 4px 20px rgba(0, 0, 0, 0.9);
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.8));
        }
      `}</style>
    </div>
  );
}
