// src/components/VocabularyJLPT.tsx
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { NekoLoading } from "./NekoLoading";
import api from "../api/axios";
import toast from "react-hot-toast";

interface JLPTWord {
  level: string;
  stt: string;
  tuVung: string;
  hanTu: string;
  tiengViet: string;
}

interface VocabularyJLPTProps {
  onNavigate: (page: string) => void;
  level: string; // "N5", "N4", "N3", "N2", "N1"
}

const WORDS_PER_DAY = 10;

export function VocabularyJLPT({ onNavigate, level }: VocabularyJLPTProps) {
  const [words, setWords] = useState<JLPTWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [levelTitle, setLevelTitle] = useState("");

  // Level configuration
  const levelConfig = {
    N5: { title: "JLPT N5", wordsPerDay: 10, description: "Trình độ sơ cấp" },
    N4: {
      title: "JLPT N4",
      wordsPerDay: 15,
      description: "Trình độ sơ trung cấp",
    },
    N3: {
      title: "JLPT N3",
      wordsPerDay: 20,
      description: "Trình độ trung cấp",
    },
    N2: {
      title: "JLPT N2",
      wordsPerDay: 25,
      description: "Trình độ thượng trung cấp",
    },
    N1: { title: "JLPT N1", wordsPerDay: 30, description: "Trình độ cao cấp" },
  };

  // Set level title based on prop
  useEffect(() => {
    const config =
      levelConfig[level as keyof typeof levelConfig] || levelConfig.N5;
    setLevelTitle(config.title);
  }, [level]);

  useEffect(() => {
    const fetchJLPTWords = async () => {
      try {
        setIsLoading(true);

        // SỬA: Dùng level.toUpperCase() thay vì level.toLowerCase()
        const res = await api.get(
          `/vocabulary/${level.toUpperCase()}?page=1&size=2000`,
        );
        const data = res.data?.data || [];

        // SỬA: Tương tự cho count endpoint
        const countRes = await api.get(
          `/vocabulary/${level.toUpperCase()}/count`,
        );
        const count = countRes.data?.count || 0;

        // Simulate loading
        await new Promise((resolve) => setTimeout(resolve, 600));

        setWords(data);
        setTotalCount(count);
      } catch (err: any) {
        console.error(`Lỗi tải ${level}:`, err);
        setError(`Không tải được từ vựng ${level}. Mèo đang cố gắng...`);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 600);
      }
    };

    fetchJLPTWords();
  }, [level]);

  // Search in all data
  const searchedWords = words.filter((w) =>
    searchQuery.trim()
      ? w.tuVung.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.hanTu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.tiengViet.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  // Get words per day for current level
  const currentWordsPerDay =
    levelConfig[level as keyof typeof levelConfig]?.wordsPerDay ||
    WORDS_PER_DAY;

  // Calculate total days needed (based on searched data)
  const totalDays = Math.ceil(searchedWords.length / currentWordsPerDay);

  // Get words for current day
  const currentDayWords = searchedWords.slice(
    (selectedDay - 1) * currentWordsPerDay,
    selectedDay * currentWordsPerDay,
  );

  const handleStartFlashcardDay = () => {
    if (currentDayWords.length === 0) {
      toast(`Ngày này chưa có từ để học flashcard! 😿`, { icon: "😿" });
      return;
    }

    // Random words from current day (max 10 for flashcard)
    let selectedWords = [...currentDayWords];
    if (selectedWords.length > 10) {
      selectedWords = selectedWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);
    }

    // Map fields for FlashcardPage
    const mappedSelectedWords = selectedWords.map((w) => ({
      japanese: w.tuVung,
      kanji: w.hanTu || w.tuVung,
      vietnamese: w.tiengViet,
    }));

    const mappedAllWordsInDay = currentDayWords.map((w) => ({
      japanese: w.tuVung,
      kanji: w.hanTu || w.tuVung,
      vietnamese: w.tiengViet,
    }));

    // Origin page for navigation back
    const originPage = `vocabulary-${level.toLowerCase()}`;

    // Save flashcard data
    const flashcardData = {
      lessonId: `${level}-Day${selectedDay}`,
      lessonTitle: `${levelTitle} - Ngày ${selectedDay}`,
      words: mappedSelectedWords,
      originPage: originPage,
    };

    localStorage.setItem("nekoFlashcardData", JSON.stringify(flashcardData));

    // Save all words in day for continued learning
    localStorage.setItem(
      "nekoFlashcardAllWords",
      JSON.stringify({
        words: mappedAllWordsInDay,
        originPage: originPage,
      }),
    );

    requestAnimationFrame(() => onNavigate("flashcard"));
  };

  if (isLoading)
    return (
      <NekoLoading message={`Mèo đang chuẩn bị từ vựng ${levelTitle}...`} />
    );

  if (error)
    return (
      <div className="text-center text-red-500 text-3xl py-20">{error}</div>
    );

  const config =
    levelConfig[level as keyof typeof levelConfig] || levelConfig.N5;

  return (
    <div className="min-h-screen">
      <main className="relative z-10 mb-12 md:mb-16">
        <h1 className="hero-section-title hero-text-glow">
          Từ Vựng {levelTitle} (~
          {totalCount > 0 ? totalCount.toLocaleString() : words.length} từ)
        </h1>

        {/* Level description */}
        <div className="text-center mb-6">
          <p className="white-rainbow-glow-bold">{config.description}</p>
          <p className="small-rainbow-glow">
            Học theo ngày - {currentWordsPerDay} từ mỗi ngày
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="glass-effect-container">
            <div className="element-overlay-positioned">
              <Search className="icon-centered-left" strokeWidth={5} />
            </div>
            <input
              type="text"
              placeholder="Tìm từ... (人, hito, người...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedDay(1);
              }}
              className="transparent-search-input"
            />
          </div>
        </div>

        {/* Day selector */}
        <div className="text-center mb-10">
          <div className="flex-center-group">
            <button
              onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
              disabled={selectedDay === 1}
              className="btn-primary"
            >
              →Ngày trước
            </button>

            <span className="btn-secondary">
              Ngày {selectedDay} / {totalDays} ({currentDayWords.length} từ)
            </span>

            <button
              onClick={() => setSelectedDay((d) => Math.min(totalDays, d + 1))}
              disabled={selectedDay === totalDays}
              className="btn-primary"
            >
              Ngày sau →
            </button>
          </div>
        </div>

        {/* Vocabulary table */}
        <div className="main-container-glass">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-pink-purple">
              <tr>
                <th className="p-6 text-lg text-center font-bold">STT</th>
                <th className="p-6 text-lg text-center font-bold">Từ vựng</th>
                <th className="p-6 text-lg text-center font-bold">Hán tự</th>
                <th className="p-6 text-lg text-center font-bold">Nghĩa</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {currentDayWords.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-12 text-center text-gray-500 text-2xl"
                  >
                    Không có từ nào trong ngày này 😿
                  </td>
                </tr>
              ) : (
                currentDayWords.map((word) => (
                  <tr
                    key={`${word.stt}-${word.tuVung}`}
                    className="list-item-hover"
                  >
                    <td className="p-6 text-center font-medium">{word.stt}</td>
                    <td className="p-6">
                      <span className="text-4xl font-black text-center text-gray-900">
                        {word.tuVung}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="text-3xl text-black font-bold">
                        {word.hanTu || "-"}
                      </span>
                    </td>
                    <td className="p-6 text-4xl text-center text-gray-800">
                      {word.tiengViet}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Flying cat for flashcard */}
        <div className="fixed bottom-10 right-10 z-50 hidden lg:block">
          <div
            className="relative group cursor-pointer"
            onClick={handleStartFlashcardDay}
          >
            {/* Chat bubble */}
            <div className="tooltip-slide-out">
              <div className="colored-border-label">
                <p className="text-xl font-bold drop-shadow-md">
                  Học flashcard 10 từ ngày {selectedDay} nào mèo ơi! 🐾
                </p>
                <div className="absolute bottom-0 right-8 translate-y-full">
                  <div className="triangle-down-pink"></div>
                </div>
              </div>
              <div className="absolute bottom-full mb-2 right-12 text-4xl animate-bounce">
                ✨
              </div>
            </div>

            {/* Flying cat image */}
            <img
              src="https://i.pinimg.com/1200x/8c/98/00/8c9800bb4841e7daa0a3db5f7db8a4b7.jpg"
              alt="Flying Neko"
              className="responsive-circular-image-hover"
              style={{
                filter: "drop-shadow(0 10px 20px rgba(255, 182, 233, 0.6))",
              }}
            />

            <div className="circular-gradient-hover-glow"></div>
          </div>
        </div>
      </main>
      <style>{`
        .flex-center-group {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin: 2rem 0;
        }
        
        .btn-secondary {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 700;
          background-color: rgba(0, 0, 0, 0.5);
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
        }
        
        .btn-secondary:hover {
          background-color: rgba(0, 0, 0, 0.7);
          transform: scale(1.05);
        }
        
        .btn-primary {
          padding: 0.75rem 1.5rem;
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 9999px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          color: #1e293b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          background-color: rgba(255, 255, 255, 1);
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .list-item-hover {
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        
        .list-item-hover:hover {
          background-color: rgba(253, 242, 248, 0.7);
        }
        
        .bg-gradient-pink-purple {
          background: linear-gradient(to right, #ec4899, #9333ea);
          color: #ffffff;
        }
        
        .main-container-glass {
          max-width: 80rem;
          margin-left: auto;
          margin-right: auto;
          overflow-x: auto;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          background-color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          width: 100%;
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
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid #f9a8d4;
        }
        
        .colored-border-label {
          background-color: #ffffff;
          color: #6d28d9;
          padding: 1rem 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          white-space: nowrap;
          border: 4px solid #f9a8d4;
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
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
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
        
        .transparent-search-input {
          width: 100%;
          padding: 2rem 2.5rem 2rem 7rem;
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
          padding: 2rem 2.5rem;
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
            padding: 2.5rem 3.5rem;
            font-size: 4.5rem;
            line-height: 1;
            transform: translateY(-1rem);
          }
        }
        
        @media (min-width: 1024px) {
          .hero-section-title {
            padding: 3rem 5rem;
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
      `}</style>
    </div>
  );
}
