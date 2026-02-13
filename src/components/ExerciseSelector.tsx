// src/components/ExerciseSelector.tsx
import { useState, useEffect } from "react";
import { safeRequest } from "../api/safeRequest";
import toast from "react-hot-toast";

interface Category {
  id: number;
  name: string; // "VOCABULARY", "GRAMMAR", "KANJI"
  displayName: string;
  description: string;
}

interface Level {
  id: number;
  level: string; // "N5", "N4", "N3", "N2", "N1"
  displayName: string;
}

export function ExerciseSelector({
  onNavigate,
}: {
  onNavigate: (
    page: string,
    params?: { category?: string; level?: string },
  ) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  // Lấy data từ DB
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, lvls] = await Promise.all([
          safeRequest<Category[]>({ url: "/categories", method: "GET" }),
          safeRequest<Level[]>({ url: "/levels", method: "GET" }),
        ]);

        setCategories(cats);

        // Sắp xếp N5 → N1 (tăng dần)
        setLevels(
          [...lvls].sort((a: Level, b: Level) =>
            a.level.localeCompare(b.level),
          ),
        );
      } catch (err) {
        toast.error("Không tải được dữ liệu. Mèo đang sửa đây... 😿");
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleLevelSelect = (level: Level) => {
    if (!selectedCategory) return;

    const catName = selectedCategory.name.toLowerCase(); // "vocabulary", "grammar", "kanji"
    const levelName = level.level.toLowerCase(); // "n5", "n4", ...

    // Mở khóa tất cả các cấp độ cho tất cả các loại bài tập (N5 → N1)
    const isAvailable =
      catName === "vocabulary" || // Từ vựng: mở khóa N5, N4, N3, N2, N1
      catName === "grammar" || // Ngữ pháp: mở khóa N5, N4, N3, N2, N1
      catName === "kanji"; // Kanji: mở khóa N5, N4, N3, N2, N1

    if (isAvailable) {
      onNavigate("exercise", { category: catName, level: levelName });
    } else {
      toast("Bài tập này sẽ sớm ra mắt nhé! Mèo đang chuẩn bị rất kỹ đây 😺", {
        icon: "⏳",
        duration: 1000,
      });
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen relative">
      <main className="relative z-10 container mx-auto px-4 py-16 md:py-24 animate-fade-in">
        <div className="text-center mb-16 md:mb-24">
          <h1 className="hero-section-title hero-text-glow">
            {!selectedCategory
              ? "Chọn loại bài tập"
              : `Bài tập ${selectedCategory.displayName}`}
          </h1>
          <p className="lead-text">
            {!selectedCategory
              ? "Mèo đã chuẩn bị sẵn các loại bài tập siêu hay cho bạn rồi!"
              : selectedCategory.name === "VOCABULARY"
                ? "Từ vựng JLPT từ N5 đến N1 đã sẵn sàng! Chọn cấp độ bạn muốn luyện tập nhé!"
                : "Chọn cấp độ JLPT bạn muốn luyện tập nhé!"}
          </p>
        </div>

        {!selectedCategory && (
          <div className="grid-container">
            {categories.map((cat, index) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className="glass-card group"
                style={{ animationDelay: `${0.3 + index * 0.2}s` }}
              >
                <div
                  className={`gradient-overlay ${
                    cat.name === "VOCABULARY"
                      ? "rainbow-gradient"
                      : cat.name === "GRAMMAR"
                        ? "ocean-gradient"
                        : "nature-gradient"
                  }`}
                />
                <div className="subtle-overlay">
                  <div className="glow-orb orb-top" />
                  <div className="glow-orb orb-bottom" />
                </div>

                <div className="relative z-10 p-10 md:p-16 text-center">
                  <div className="hero-text group-hover:scale-110 transition-transform duration-500">
                    {cat.name === "VOCABULARY"
                      ? "📘"
                      : cat.name === "GRAMMAR"
                        ? "✍️"
                        : "🌿"}
                  </div>

                  <h2 className="card-title">{cat.displayName}</h2>
                  <p className="card-subtitle">Học theo cấp độ JLPT</p>
                  <p className="card-description">{cat.description}</p>

                  <div className="flex-container">
                    <span>Bấm để chọn</span>
                    <span className="moving-icon">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedCategory && (
          <div className="max-w-6xl mx-auto">
            <button onClick={handleBack} className="glass-button">
              <span className="text-2xl group-hover:-translate-x-2 transition-transform">
                ←
              </span>
              <span>Quay lại chọn loại</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {levels.map((level, index) => {
                const catName = selectedCategory.name.toLowerCase();
                const levelName = level.level.toLowerCase();

                // Mở khóa tất cả cấp độ cho tất cả các loại bài tập
                const isAvailable =
                  catName === "vocabulary" || // Từ vựng: mở khóa N5, N4, N3, N2, N1
                  catName === "grammar" || // Ngữ pháp: mở khóa N5, N4, N3, N2, N1
                  catName === "kanji"; // Kanji: mở khóa N5, N4, N3, N2, N1

                return (
                  <button
                    key={level.id}
                    onClick={() => isAvailable && handleLevelSelect(level)}
                    disabled={!isAvailable}
                    className={`glass-card relative overflow-hidden transition-all duration-500 ${
                      isAvailable
                        ? "hover:scale-105 cursor-pointer"
                        : "opacity-70 cursor-not-allowed"
                    }`}
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <div className="relative z-10 p-8 text-center">
                      <div className="text-6xl mb-4">
                        {isAvailable
                          ? catName === "vocabulary"
                            ? level.level === "N5"
                              ? "🐣"
                              : level.level === "N4"
                                ? "🐥"
                                : level.level === "N3"
                                  ? "🦆"
                                  : level.level === "N2"
                                    ? "🦅"
                                    : "🦉"
                            : "✨"
                          : "⏳"}
                      </div>
                      <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                        {level.displayName}
                      </h3>
                      <p className="text-xl text-white/90 mb-6">
                        {level.level === "N5"
                          ? "Cơ bản nhất"
                          : level.level === "N4"
                            ? "Nâng tầm"
                            : level.level === "N3"
                              ? "Trung cấp"
                              : level.level === "N2"
                                ? "Nâng cao"
                                : "Thành thạo"}
                      </p>
                      <div className="text-lg font-bold text-white">
                        {isAvailable ? (
                          catName === "vocabulary" ? (
                            <span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                              {level.level === "N5"
                                ? "Bắt đầu nào! →"
                                : level.level === "N4"
                                  ? "Luyện tập N4 →"
                                  : level.level === "N3"
                                    ? "Thử thách N3 →"
                                    : level.level === "N2"
                                      ? "Chinh phục N2 →"
                                      : "Chiến binh N1 →"}
                            </span>
                          ) : (
                            "Bắt đầu ngay →"
                          )
                        ) : (
                          "Sắp ra mắt..."
                        )}
                      </div>
                    </div>

                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20">
                        <p className="text-2xl text-white font-bold animate-pulse">
                          Coming Soon
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="footer-container text-center"
          style={{ animationDelay: "0.8s" }}
        >
          <p className="accent-text">
            {selectedCategory?.name === "VOCABULARY"
              ? "Từ vựng N5-N1 đã có! Grammar và Kanji sắp ra mắt nhé!"
              : "Dù bạn chọn loại bài nào, mèo cũng sẽ đồng hành cùng bạn tới cùng nhé!"}
          </p>
          <div className="bouncing-icon">🐾</div>
        </div>
      </main>
      <style>{`
        /* Dải màu cho Vocabulary */
        .rainbow-gradient {
          background: linear-gradient(135deg, #f472b6, #a855f7);
        }

        /* Dải màu cho Grammar */
        .ocean-gradient {
          background: linear-gradient(135deg, #60a5fa, #06b6d4);
        }

        /* Dải màu cho Kanji */
        .nature-gradient {
          background: linear-gradient(135deg, #4ade80, #14b8a6);
        }

        /* Lớp phủ chung */
        .gradient-overlay {
          position: absolute;
          inset: 0;
          opacity: 0.2;
          transition: opacity 0.3s ease;
        }

        .group:hover .gradient-overlay {
          opacity: 0.4;
        }

        .glass-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 3rem;
          padding: 0.75rem 1.5rem;
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 700;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .glass-button:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .rainbow-gradient {
          background: linear-gradient(135deg, #f472b6, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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

        .grid-container {
          max-width: 72rem;
          margin-left: auto;
          margin-right: auto;
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 3rem;
          padding: 1rem;
        }

        @media (min-width: 1024px) {
          .grid-container {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 5rem;
          }
        }

        .lead-text {
          font-size: 1.25rem;
          line-height: 1.75rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          max-width: 56rem;
          margin-left: auto;
          margin-right: auto;
          text-align: center;
        }

        @media (min-width: 768px) {
          .lead-text {
            font-size: 1.875rem;
            line-height: 2.25rem;
          }
        }

        .bouncing-icon {
          font-size: 3.75rem;
          line-height: 1;
          display: inline-block;
          animation: bounce 1s infinite;
        }

        @media (min-width: 768px) {
          .bouncing-icon {
            font-size: 6rem;
          }
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

        .accent-text {
          font-size: 1.5rem;
          line-height: 2rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 768px) {
          .accent-text {
            font-size: 1.875rem;
            line-height: 2.25rem;
          }
          .footer-container {
            margin-top: 8rem;
          }
        }

        .moving-icon {
          font-size: 2.25rem;
          line-height: 2.5rem;
          display: inline-block;
          transition: transform 0.5s ease;
          will-change: transform;
        }

        .glass-card:hover .moving-icon {
          transform: translateX(1.5rem);
        }

        .flex-container {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 700;
          vertical-align: middle;
        }

        @media (min-width: 768px) {
          .flex-container {
            font-size: 1.5rem;
          }
        }

        .card-description {
          font-size: 1.125rem;
          color: #ffffff;
          line-height: 1.625;
          max-width: 28rem;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 2.5rem;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @media (min-width: 768px) {
          .card-description {
            font-size: 1.25rem;
          }
        }

        .card-subtitle {
          font-size: 1.25rem;
          line-height: 1.75rem;
          color: #ffffff;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 768px) {
          .card-subtitle {
            font-size: 1.5rem;
            line-height: 2rem;
          }
        }

        .card-title {
          font-size: 2.25rem;
          line-height: 2.5rem;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 1rem;
          filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04)) 
                  drop-shadow(0 4px 3px rgba(0, 0, 0, 0.1));
        }

        @media (min-width: 768px) {
          .card-title {
            font-size: 3rem;
            line-height: 1;
          }
        }

        .hero-text {
          font-size: 6rem;
          line-height: 1;
          margin-bottom: 2rem;
          display: inline-block;
          transition: transform 0.5s ease;
          will-change: transform;
        }

        @media (min-width: 768px) {
          .hero-text {
            font-size: 8rem;
          }
        }

        .glass-card:hover .hero-text {
          transform: scale(1.1);
        }

        .glow-orb {
          position: absolute;
          width: 24rem;
          height: 24rem;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          filter: blur(64px);
          pointer-events: none;
          z-index: 0;
        }

        .orb-top {
          top: 0;
          left: 0;
          transform: translate(-50%, -50%);
        }

        .orb-bottom {
          bottom: 0;
          right: 0;
          transform: translate(50%, 50%);
        }

        .subtle-overlay {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background-color: white;
          opacity: 0;
          transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .glass-card:hover .subtle-overlay {
          opacity: 0.4;
        }

        .content {
          position: relative;
          z-index: 1;
        }

        .glass-card {
          position: relative;
          overflow: hidden;
          border-radius: 1.5rem;
          background-color: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeIn 0.8s ease-out forwards;
        }

        .glass-card:hover {
          transform: scale(1.05) translateY(-24px);
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.6);
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

        .circular-shadow-button {
          padding: 1rem;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.8);
          transition: all 150ms ease-in-out;
        }

        .circular-shadow-button:hover {
          background-color: #fecaca;
        }

        .circular-shadow-button:disabled {
          opacity: 0.5;
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

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 10s ease infinite;
        }
      `}</style>
    </div>
  );
}
