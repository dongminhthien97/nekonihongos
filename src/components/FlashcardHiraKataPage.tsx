import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Cat, Sparkles } from "lucide-react";
import { NekoLoading } from "./NekoLoading";
import { NekoAlertModal } from "./NekoAlertModal";

interface FlashcardItem {
  character: string;
  romanji: string;
}

interface FlashcardData {
  type: "hiragana" | "katakana";
  lessonTitle?: string;
  characters: FlashcardItem[];
  originPage?: string;
}

interface FlashcardHiraKataPageProps {
  onNavigate: (page: string) => void;
}

export function FlashcardHiraKataPage({
  onNavigate,
}: FlashcardHiraKataPageProps) {
  const [items, setItems] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [flashcardData, setFlashcardData] = useState<FlashcardData | null>(
    null,
  );
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    const loadingTimer = setTimeout(() => setIsLoading(false), 1000);

    const loadData = () => {
      const rawData = localStorage.getItem("nekoFlashcardHiraKata");
      if (!rawData) {
        setShowErrorModal(true);
        return;
      }

      try {
        const parsed: FlashcardData = JSON.parse(rawData);
        if (
          !parsed.characters ||
          !Array.isArray(parsed.characters) ||
          parsed.characters.length === 0
        ) {
          throw new Error("Invalid flashcard data");
        }
        setFlashcardData(parsed);
        setItems(parsed.characters);
      } catch {
        setShowErrorModal(true);
      }
    };

    loadData();
    return () => clearTimeout(loadingTimer);
  }, []);

  if (isLoading) {
    return (
      <NekoLoading message="Mèo đang chuẩn bị flashcard HiraKata cho bạn nhé..." />
    );
  }

  if (showErrorModal) {
    return (
      <NekoAlertModal
        isOpen={true}
        onClose={() => onNavigate(flashcardData?.originPage || "landing")}
        title="Oops!"
        message="Không có dữ liệu flashcard hoặc dữ liệu không hợp lệ!"
      />
    );
  }

  if (!flashcardData || items.length === 0) {
    return (
      <NekoAlertModal
        isOpen={true}
        onClose={() => onNavigate("landing")}
        title="Meow..."
        message="Flashcard trống! Mèo sẽ đưa bạn về trang chính"
      />
    );
  }

  const currentItem = items[currentIndex];
  const progress =
    items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0;
  const lessonTitle =
    flashcardData.lessonTitle ||
    `Flashcard ${flashcardData.type === "hiragana" ? "Hiragana" : "Katakana"}`;

  const handleFlip = () => setIsFlipped((prev) => !prev);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex === items.length - 1) {
      setShowEndModal(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowEndModal(false);
  };

  const handleReturn = () => {
    localStorage.removeItem("nekoFlashcardHiraKata");
    onNavigate(flashcardData.originPage || flashcardData.type);
  };

  return (
    <div className="flashcard-page-container">
      <main className="flashcard-main-content">
        <div className="flashcard-header">
          <h1 className="flashcard-title">{lessonTitle}</h1>
        </div>

        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-text">
              Ký tự <span className="progress-current">{currentIndex + 1}</span>{" "}
              / {items.length}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}>
              <div className="progress-badge">🐾</div>
            </div>
          </div>
        </div>

        <div className="flashcard-container">
          <div
            onClick={handleFlip}
            className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}
          >
            <div className="flashcard-front">
              <p className="character-display">{currentItem.character}</p>
              <p className="flip-hint">Nhấn để xem cách đọc</p>
              <Cat className="flip-icon" />
            </div>

            <div className="flashcard-back">
              <p className="romanji-display">{currentItem.romanji}</p>
              <p className="back-hint">Nhấn để quay lại</p>
              <Sparkles className="sparkle-icon" />
            </div>
          </div>
        </div>

        <div className="navigation-buttons">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="nav-button prev-button"
          >
            <ChevronLeft className="nav-icon" strokeWidth={4} />
          </button>

          <div className="decorative-icon">
            <Cat className="bouncing-cat" strokeWidth={3} />
            <Sparkles className="sparkle-corner" />
          </div>

          <button onClick={handleNext} className="nav-button next-button">
            <span className="button-text">
              {currentIndex === items.length - 1 ? "XONG RỒI!" : "TIẾP THEO"}
            </span>
            {currentIndex !== items.length - 1 ? (
              <ChevronRight className="next-icon" strokeWidth={5} />
            ) : (
              <span className="celebration-icon">🎉</span>
            )}
          </button>
        </div>

        {showEndModal && (
          <div className="modal-overlay">
            <div className="end-modal">
              <div className="modal-header">
                <Cat className="modal-cat" strokeWidth={2.5} />
                <Sparkles className="modal-sparkle" />
              </div>

              <h2 className="modal-title">Siêu tuyệt vời!</h2>

              <p className="modal-message">
                Bạn đã hoàn thành bài học này một cách xuất sắc! <br />
                Mèo rất tự hào về sự chăm chỉ của bạn đấy! 🐾
              </p>

              <div className="modal-actions">
                <button
                  onClick={handleRestart}
                  className="action-button restart-button"
                >
                  Học lại từ đầu nhé!
                </button>
                <button
                  onClick={handleReturn}
                  className="action-button return-button"
                >
                  Về trang chính
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .flashcard-page-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .flashcard-main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .flashcard-header {
          padding: 3rem 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .flashcard-title {
          text-align: center;
          font-size: 3rem;
          font-weight: 900;
          color: white;
          text-shadow: 0 0 20px #ff69b4, 0 0 40px #a020f0, 0 4px 20px rgba(0, 0, 0, 0.5);
          margin-bottom: 2rem;
          line-height: 1.2;
        }

        .progress-section {
          width: 100%;
          max-width: 800px;
          margin-bottom: 2rem;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 0.5rem;
          padding: 0 0.5rem;
        }

        .progress-text {
          color: white;
          font-weight: bold;
          font-size: 1.25rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .progress-current {
          color: #fbbf24;
          font-size: 1.5rem;
        }

        .progress-bar {
          height: 2rem;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
          overflow: hidden;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.1);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(to right, #f472b6, #7c3aed);
          transition: width 500ms ease-in-out;
          position: relative;
        }

        .progress-badge {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translate(50%, -50%);
          animation: bounce 1s infinite;
        }

        .flashcard-container {
          position: relative;
          width: 100%;
          max-width: 800px;
          height: 24rem;
          margin-bottom: 3rem;
          perspective: 1000px;
        }

        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
          cursor: pointer;
        }

        .flashcard-inner.flipped {
          transform: rotateY(180deg);
        }

        .flashcard-front, .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .flashcard-front {
          background-color: white;
        }

        .flashcard-back {
          background: linear-gradient(to bottom right, #ec4899, #7c3aed);
          transform: rotateY(180deg);
        }

        .character-display {
          font-size: 8rem;
          font-weight: 900;
          color: #1f2937;
          margin: 0;
        }

        .romanji-display {
          font-size: 6rem;
          font-weight: 900;
          color: white;
          text-align: center;
          margin: 0;
        }

        .flip-hint {
          font-size: 1.125rem;
          color: #6b7280;
          margin-top: 2rem;
        }

        .back-hint {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 1.5rem;
        }

        .flip-icon {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          width: 3rem;
          height: 3rem;
          color: #f472b6;
          animation: wiggle 1s infinite;
        }

        .sparkle-icon {
          position: absolute;
          bottom: 1.5rem;
          left: 1.5rem;
          width: 3rem;
          height: 3rem;
          color: white;
          animation: pulse 2s infinite;
        }

        .navigation-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3rem;
          margin-top: 4rem;
        }

        .nav-button {
          position: relative;
          padding: 1.5rem;
          border-radius: 1.5rem;
          border: none;
          cursor: pointer;
          transition: all 300ms;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .prev-button {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          color: #4f46e5;
        }

        .prev-button:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 0 20px rgba(236, 72, 153, 0.4);
        }

        .prev-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .next-button {
          background: linear-gradient(to bottom right, #ec4899, #7c3aed, #06b6d4);
          color: white;
          padding: 1.5rem 3rem;
          overflow: hidden;
          transition: all 500ms ease-in-out;
        }

        .next-button:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 30px rgba(6, 182, 212, 0.5);
        }

        .nav-icon, .next-icon {
          width: 2rem;
          height: 2rem;
        }

        .button-text {
          font-size: 1.5rem;
          font-weight: 900;
          filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.2));
          margin-right: 1rem;
        }

        .next-icon {
          animation: pulse 1.5s infinite;
        }

        .celebration-icon {
          font-size: 2.5rem;
          margin-left: 1rem;
          animation: bounce 1s infinite;
        }

        .decorative-icon {
          position: relative;
        }

        .bouncing-cat {
          width: 4rem;
          height: 4rem;
          color: #ec4899;
          animation: bounce 1s infinite;
          filter: drop-shadow(0 10px 10px rgba(0, 0, 0, 0.2));
        }

        .sparkle-corner {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 1.5rem;
          height: 1.5rem;
          color: #fbbf24;
          animation: pulse 2s infinite;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1.25rem;
        }

        .end-modal {
          background: white;
          padding: 3rem;
          border-radius: 2.5rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: modalIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-header {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .modal-cat {
          width: 6rem;
          height: 6rem;
          color: #ec4899;
          margin: auto;
          animation: bounce 1s infinite;
        }

        .modal-sparkle {
          position: absolute;
          top: -10px;
          right: 30%;
          width: 2rem;
          height: 2rem;
          color: #fbbf24;
          animation: pulse 2s infinite;
        }

        .modal-title {
          font-size: 2.5rem;
          font-weight: 900;
          color: #1e293b;
          margin-bottom: 1rem;
          letter-spacing: -0.025em;
        }

        .modal-message {
          font-size: 1.15rem;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }

        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .action-button {
          padding: 1.25rem 2rem;
          border-radius: 1.25rem;
          font-size: 1.2rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .restart-button {
          background: linear-gradient(to right, #ec4899, #7c3aed);
          color: white;
          box-shadow: 0 10px 15px -3px rgba(236, 72, 153, 0.3);
        }

        .restart-button:hover {
          transform: scale(1.03) translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(236, 72, 153, 0.4);
          filter: brightness(1.1);
        }

        .return-button {
          background-color: #f1f5f9;
          color: #64748b;
        }

        .return-button:hover {
          background-color: #e2e8f0;
          color: #1e293b;
          transform: scale(1.03);
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(-25%); }
          50% { transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes modalIn {
          from { transform: scale(0.8) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        @media (max-width: 768px) {
          .flashcard-title {
            font-size: 2rem;
          }

          .flashcard-container {
            height: 18rem;
          }

          .character-display {
            font-size: 5rem;
          }

          .romanji-display {
            font-size: 4rem;
          }

          .navigation-buttons {
            gap: 1.5rem;
            margin-top: 2rem;
          }

          .nav-button {
            padding: 1rem;
          }

          .next-button {
            padding: 1rem 2rem;
          }

          .button-text {
            font-size: 1.125rem;
          }

          .end-modal {
            padding: 2rem;
          }

          .modal-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
