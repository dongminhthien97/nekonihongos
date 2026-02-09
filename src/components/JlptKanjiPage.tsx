// src/components/JlptKanjiPage.tsx
import { useState, useEffect } from "react";
import { NekoLoading } from "./NekoLoading";
import api from "../api/axios";
import toast from "react-hot-toast";

interface KanjiJlptItem {
  id: number;
  stt: string;
  kanji: string;
  hanViet: string;
  meaning: string;
  onYomi: string;
  kunYomi: string;
  level: string;
}

const KANJI_PER_DAY = 10;

export function JlptKanjiPage({
  level = "N5",
  onNavigate,
}: {
  level: string;
  onNavigate: (page: string) => void;
}) {
  const [kanjiList, setKanjiList] = useState<KanjiJlptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let hasToasted = false;
    const fetchKanjiByLevel = async () => {
      try {
        const res = await api.get(`/kanji/jlpt/${level}`);
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          if (res.data.data.length > 0) {
            const formattedData = res.data.data.map(
              (item: any, index: number) => ({
                id: item.id || index + 1,
                stt: (index + 1).toString(),
                kanji: item.kanji || item.character || "",
                hanViet: item.hanViet || item.han_viet || item.meaning || "",
                meaning: item.meaning || item.meanings?.join?.(", ") || "",
                onYomi: item.onyomi || item.onYomi || item.on_reading || "",
                kunYomi: item.kunyomi || item.kunYomi || item.kun_reading || "",
                level: item.level || level,
              }),
            );
            setKanjiList(formattedData);
            await new Promise((resolve) => setTimeout(resolve, 600));
          } else {
            setKanjiList([]);
            if (!hasToasted) {
              hasToasted = true;
              toast(`Chưa có Kanji ${level} nào. Mèo sẽ sớm cập nhật nhé! 😺`, {
                icon: "😺",
                duration: 1000,
              });
            }
          }
        }
      } catch (err: any) {
        console.error(`💥 [KANJI ${level}] Lỗi API:`, err);
      } finally {
        setTimeout(() => setIsLoading(false), 600);
      }
    };
    fetchKanjiByLevel();
  }, [level]);

  const searchedKanji = kanjiList.filter((k) =>
    searchQuery.trim()
      ? k.kanji.includes(searchQuery) ||
        (k.hanViet &&
          k.hanViet.toLowerCase().includes(searchQuery.toLowerCase())) ||
        k.meaning.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  const totalDays = Math.ceil(searchedKanji.length / KANJI_PER_DAY);
  const currentDayKanji = searchedKanji.slice(
    (selectedDay - 1) * KANJI_PER_DAY,
    selectedDay * KANJI_PER_DAY,
  );

  const handleStartFlashcardDay = () => {
    if (currentDayKanji.length === 0)
      return toast("Ngày này chưa có Kanji! 😿");
    const flashcardData = currentDayKanji.map((k) => ({
      japanese: k.kanji,
      kanji: k.kanji,
      vietnamese: k.meaning,
      onYomi: k.onYomi || "-",
      kunYomi: k.kunYomi || "-",
      hanViet: k.hanViet,
      level: k.level,
    }));
    localStorage.setItem(
      "nekoFlashcardData",
      JSON.stringify({
        lessonId: `Kanji${level}-Day${selectedDay}`,
        lessonTitle: `Kanji ${level} - Ngày ${selectedDay}`,
        words: flashcardData,
        originPage: `jlpt-kanji-${level.toLowerCase()}`,
      }),
    );
    onNavigate("flashcard");
  };

  if (isLoading)
    return <NekoLoading message={`Mèo đang vẽ Kanji ${level}...`} />;

  return (
    <div className="kanji-page-wrapper">
      <main className="kanji-main-content">
        <h1 className="hero-section-title hero-text-glow">
          Kanji JLPT {level} (~{kanjiList.length} chữ)
        </h1>

        {/* Search Bar Container */}
        <div className="search-section">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={`Tìm kiếm Kanji ${level}, âm Hán, nghĩa...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="kanji-search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          {searchQuery && (
            <p className="search-result-count">
              Tìm thấy {searchedKanji.length} kết quả
            </p>
          )}
        </div>

        {/* Pagination Section */}
        <div className="pagination-container">
          <p className="pagination-subtitle">
            Học theo ngày  E10 Kanji mỗi ngày
          </p>
          <div className="pagination-controls">
            <button
              onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
              disabled={selectedDay === 1}
              className="btn-nav"
            >
              →Ngày trước
            </button>
            <div className="day-indicator">
              Ngày {selectedDay} / {totalDays}
            </div>
            <button
              onClick={() => setSelectedDay((d) => Math.min(totalDays, d + 1))}
              disabled={selectedDay === totalDays}
              className="btn-nav"
            >
              Ngày sau →
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="kanji-table-glass">
          <table className="kanji-data-table">
            <thead>
              <tr>
                <th>Kanji</th>
                <th>Âm Hán</th>
                <th>Nghĩa</th>
                <th>Âm On</th>
                <th>Âm Kun</th>
              </tr>
            </thead>
            <tbody>
              {currentDayKanji.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    {searchQuery
                      ? `Không tìm thấy kết quả nào cho "${searchQuery}" 😿`
                      : "Ngày này chưa có Kanji 😿"}
                  </td>
                </tr>
              ) : (
                currentDayKanji.map((k) => (
                  <tr key={`${k.id}-${k.kanji}`} className="kanji-row">
                    <td className="cell-kanji">
                      <div className="kanji-display">
                        <span className="kanji-char">{k.kanji}</span>
                        <span className="kanji-stt">#{k.stt}</span>
                      </div>
                    </td>
                    <td className="cell-hanviet">{k.hanViet || "-"}</td>
                    <td className="cell-meaning">{k.meaning}</td>
                    <td className="cell-onyomi">
                      <span className="reading-text">{k.onYomi || "-"}</span>
                      {k.onYomi && <span className="reading-label">(On)</span>}
                    </td>
                    <td className="cell-kunyomi">
                      <span className="reading-text">{k.kunYomi || "-"}</span>
                      {k.kunYomi && (
                        <span className="reading-label">(Kun)</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Floating Action Button (MÁE BAY) */}
        <div className="floating-neko-container">
          <div className="neko-trigger" onClick={handleStartFlashcardDay}>
            <div className="neko-tooltip">
              <div className="tooltip-content">
                Học flashcard 10 Kanji {level} ngày {selectedDay} nào mèo ơi!
                🖌�E�🐾
              </div>
            </div>
            <div className="neko-image-wrapper">
              <img
                src="https://i.pinimg.com/1200x/8c/98/00/8c9800bb4841e7daa0a3db5f7db8a4b7.jpg"
                alt="Flying Neko"
                className="neko-image"
              />
              <div className="neko-glow"></div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        /* --- Page Layout --- */
        .kanji-page-wrapper {
          min-height: 100 screen;
          padding: 2rem 1rem;
        }

        .kanji-main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding-bottom: 5rem;
        }

        /* --- Hero Title & Glow --- */
        .hero-section-title {
          text-align: center;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 2rem;
          font-size: clamp(2.5rem, 8vw, 6rem);
          line-height: 1.1;
        }

        .hero-text-glow {
          text-shadow: 
            0 0 20px rgba(236, 72, 153, 0.7),
            0 0 40px rgba(147, 51, 234, 0.5);
          animation: pulse-soft 3s infinite;
        }

        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.98); opacity: 0.9; }
        }

        /* --- Search Section --- */
        .search-section {
          max-width: 42rem;
          margin: 0 auto 3rem;
          text-align: center;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .kanji-search-input {
          width: 100%;
          padding: 1.25rem 4rem 1.25rem 2rem;
          font-size: 1.25rem;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.1);
          color: white;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .kanji-search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.15);
          border-color: #f472b6;
          box-shadow: 0 0 20px rgba(244, 114, 182, 0.3);
        }

        .search-icon {
          position: absolute;
          right: 1.5rem;
          font-size: 1.5rem;
        }

        .search-result-count {
          color: rgba(255, 255, 255, 0.7);
          margin-top: 0.75rem;
        }

        /* --- Pagination --- */
        .pagination-container {
          text-align: center;
          margin-bottom: 3rem;
        }

        .pagination-subtitle {
          color: white;
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
          font-weight: 300;
        }

        .pagination-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .btn-nav {
          padding: 0.75rem 1.75rem;
          background: white;
          color: #1e293b;
          border-radius: 9999px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-nav:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px rgba(0,0,0,0.3);
          background: #fdf2f8;
        }

        .btn-nav:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .day-indicator {
          padding: 0.75rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border-radius: 9999px;
          font-weight: 700;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(5px);
        }

        /* --- Table Styling --- */
        .kanji-table-glass {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          margin-bottom: 2rem;
        }

        .kanji-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
        }

        .kanji-data-table thead {
          background: linear-gradient(90deg, #ec4899, #9333ea);
          color: white;
        }

        .kanji-data-table th {
          padding: 1.5rem;
          font-size: 1.4rem;
        }

        .kanji-row {
          border-bottom: 1px solid #eee;
          transition: all 0.2s ease;
        }

        .kanji-row:hover {
          background: #fff5f8;
          transform: scale(1.005);
        }

        /* --- Cell Specifics --- */
        .cell-kanji { padding: 1.5rem; }
        .kanji-char { font-size: 4rem; font-weight: 900; display: block; color: #111; }
        .kanji-stt { font-size: 0.8rem; color: #999; }
        
        .cell-hanviet { font-size: 1.6rem; font-weight: 700; color: #1d4ed8; }
        .cell-meaning { font-size: 1.5rem; color: #374151; max-width: 250px; }
        
        .reading-text { display: block; font-size: 1.4rem; font-weight: 700; color: #7e22ce; }
        .reading-label { font-size: 0.75rem; color: #999; }
        .cell-kunyomi .reading-text { color: #1d4ed8; }

        .empty-state { padding: 4rem; font-size: 1.5rem; color: #666; }

        /* --- Floating Neko (FAB) --- */
        .floating-neko-container {
          position: fixed;
          bottom: 2.5rem;
          right: 2.5rem;
          z-index: 100;
        }

        .neko-trigger {
          position: relative;
          cursor: pointer;
        }

        .neko-image-wrapper {
          position: relative;
          width: 8rem;
          height: 8rem;
        }

        .neko-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #f9a8d4;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          animation: fly 4s ease-in-out infinite;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .neko-trigger:hover .neko-image {
          transform: scale(1.15) rotate(10deg);
        }

        .neko-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, #f472b6, #a855f7);
          border-radius: 50%;
          filter: blur(20px);
          opacity: 0;
          transition: opacity 0.4s;
          z-index: -1;
        }

        .neko-trigger:hover .neko-glow { opacity: 0.6; }

        .neko-tooltip {
          position: absolute;
          bottom: 110%;
          right: 0;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.4s;
          pointer-events: none;
        }

        .neko-trigger:hover .neko-tooltip {
          opacity: 1;
          transform: translateY(0);
        }

        .tooltip-content {
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 1.25rem;
          border: 3px solid #f9a8d4;
          white-space: nowrap;
          color: #6d28d9;
          font-weight: 800;
          box-shadow: 0 10px 15px rgba(0,0,0,0.2);
        }

        @keyframes fly {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        /* --- Responsive --- */
        @media (max-width: 768px) {
          .floating-neko-container { display: none; }
          .kanji-data-table th:nth-child(4),
          .kanji-data-table td:nth-child(4),
          .kanji-data-table th:nth-child(5),
          .kanji-data-table td:nth-child(5) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
