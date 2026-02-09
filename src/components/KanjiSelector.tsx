// src/components/KanjiSelector.tsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

interface KanjiType {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  available: boolean;
  gradient: string;
  count?: number;
}

interface ApiResponse {
  success: boolean;
  data?: any[];
  count?: number;
  message?: string;
}

// Default counts for each level (fallback values)
const DEFAULT_KANJI_COUNTS: Record<string, number> = {
  "jlpt-n5": 100,
  "jlpt-n4": 200,
  "jlpt-n3": 400,
  "jlpt-n2": 1000,
  "jlpt-n1": 2000,
};

const kanjiTypes: KanjiType[] = [
  {
    id: "minna",
    title: "Minna no Nihongo",
    subtitle: "Kanji theo giáo trình chuẩn",
    description: "Học Kanji theo bài Minna – có nét viết, ví dụ, từ ghép",
    icon: "📖",
    available: true,
    gradient: "from-green-400 to-teal-500",
  },
  {
    id: "jlpt-n5",
    title: "JLPT N5",
    subtitle: "~100 Kanji cơ bản",
    description: "Danh sách Kanji chính thức cho kỳ thi JLPT N5",
    icon: "🎯",
    available: true,
    gradient: "from-pink-400 to-purple-500",
    count: DEFAULT_KANJI_COUNTS["jlpt-n5"],
  },
  {
    id: "jlpt-n4",
    title: "JLPT N4",
    subtitle: "~200 Kanji",
    description: "Danh sách Kanji chính thức cho kỳ thi JLPT N4",
    icon: "📚",
    available: true,
    gradient: "from-blue-400 to-cyan-500",
    count: DEFAULT_KANJI_COUNTS["jlpt-n4"],
  },
  {
    id: "jlpt-n3",
    title: "JLPT N3",
    subtitle: "~400 Kanji",
    description: "Danh sách Kanji chính thức cho kỳ thi JLPT N3",
    icon: "🔥",
    available: true,
    gradient: "from-orange-400 to-red-500",
    count: DEFAULT_KANJI_COUNTS["jlpt-n3"],
  },
  {
    id: "jlpt-n2",
    title: "JLPT N2",
    subtitle: "~1000 Kanji",
    description: "Danh sách Kanji chính thức cho kỳ thi JLPT N2",
    icon: "🚀",
    available: true,
    gradient: "from-purple-400 to-pink-500",
    count: DEFAULT_KANJI_COUNTS["jlpt-n2"],
  },
  {
    id: "jlpt-n1",
    title: "JLPT N1",
    subtitle: "~2000 Kanji",
    description: "Danh sách Kanji chính thức cho kỳ thi JLPT N1",
    icon: "🏆",
    available: true,
    gradient: "from-yellow-400 to-red-500",
    count: DEFAULT_KANJI_COUNTS["jlpt-n1"],
  },
];

export function KanjiSelector({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
  });
  const [kanjiList, setKanjiList] = useState<KanjiType[]>(kanjiTypes);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingCard, setLoadingCard] = useState<string | null>(null);

  // Hàm gọi API để lấy số lượng Kanji theo level
  const fetchKanjiCounts = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const updatedKanjiList = [...kanjiTypes]; // Start with default types

      for (let i = 0; i < updatedKanjiList.length; i++) {
        const kanji = updatedKanjiList[i];

        // Chỉ fetch counts cho JLPT levels
        if (kanji.id.startsWith("jlpt-")) {
          const level = kanji.id.split("-")[1].toUpperCase(); // "jlpt-n5" -> "N5"

          try {
            const response = await api.get(`/kanji/jlpt/${level}`);
            const data: ApiResponse = response.data;

            if (data.success && data.data) {
              updatedKanjiList[i] = {
                ...kanji,
                count: data.data.length,
                subtitle: `~${data.data.length.toLocaleString()} Kanji chuẩn thi`,
              };
            } else {
              updatedKanjiList[i] = {
                ...kanji,
                count: DEFAULT_KANJI_COUNTS[kanji.id],
                subtitle: `~${DEFAULT_KANJI_COUNTS[kanji.id].toLocaleString()} Kanji chuẩn thi`,
              };
            }
          } catch (error) {
            console.error(`Lỗi network cho ${kanji.id}:`, error);
            // Dùng giá trị mặc định khi có lỗi network
            updatedKanjiList[i] = {
              ...kanji,
              count: DEFAULT_KANJI_COUNTS[kanji.id],
              subtitle: `~${DEFAULT_KANJI_COUNTS[kanji.id].toLocaleString()} Kanji chuẩn thi`,
            };
          }
        }
      }

      setKanjiList(updatedKanjiList);
    } catch (error) {
      console.error("Lỗi khi lấy số lượng Kanji:", error);
      // Sử dụng danh sách mặc định nếu có lỗi
      setKanjiList(kanjiTypes);
      setApiError(
        "Không thể kết nối đến máy chủ. Đang sử dụng dữ liệu mặc định.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKanjiCounts();
  }, []);

  const handleSelect = async (typeId: string) => {
    const kanjiType = kanjiList.find((type) => type.id === typeId);

    if (!kanjiType) {
      setModalContent({
        title: "Lỗi",
        message: "Không tìm thấy lộ trình học này. Vui lòng thử lại!",
      });
      setIsModalOpen(true);
      return;
    }

    if (!kanjiType.available) {
      setModalContent({
        title: "Đang phát triển",
        message: "Tính năng này đang được phát triển. Vui lòng quay lại sau!",
      });
      setIsModalOpen(true);
      return;
    }

    if (typeId === "minna") {
      onNavigate("kanji");
    } else if (typeId.startsWith("jlpt-")) {
      const level = typeId.split("-")[1].toUpperCase();
      setLoadingCard(typeId);

      try {
        const response = await api.get(`/kanji/jlpt/${level}`);
        const data: ApiResponse = response.data;

        if (data.success && data.data && data.data.length > 0) {
          const pageMapping: Record<string, string> = {
            N5: "kanji-n5",
            N4: "jlpt-kanji-n4",
            N3: "jlpt-kanji-n3",
            N2: "jlpt-kanji-n2",
            N1: "jlpt-kanji-n1",
          };

          const targetPage = pageMapping[level] || "kanji-n5";
          onNavigate(targetPage);

          toast.success(`Đã tìm thấy ${data.data.length} Kanji ${level}! 🎉`);
        } else {
          toast.error(
            `Chưa có Kanji ${level} trong database. Mèo sẽ sớm thêm nhé! 🐾`,
          );
        }
      } catch (error: any) {
        console.error(`Lỗi khi tải Kanji ${level}:`, error);
        if (error?.response?.status === 404) {
          toast.error(
            `API cho Kanji ${level} chưa được triển khai. Đang chuyển sang trang thử nghiệm...`,
          );
        } else {
          toast.error(
            `Không thể tải Kanji ${level}. Vui lòng kiểm tra kết nối! 😿`,
          );
        }
      } finally {
        setLoadingCard(null);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const retryFetch = () => {
    fetchKanjiCounts();
    setApiError(null);
  };

  return (
    <div className="min-h-screen relative">
      <main className="relative z-10 container mx-auto px-4 py-16 md:py-24 animate-fade-in">
        {/* Tiêu đề fade in đầu tiên */}
        <div className="text-center mb-16 md:mb-24">
          <h1 className="hero-section-title hero-text-glow">
            Chọn lộ trình học Kanji
          </h1>
          <p className="lead-text">
            Mèo đã chuẩn bị sẵn các cách học Kanji siêu hay cho bạn rồi đây! 🐾
          </p>
        </div>

        {/* Hiển thị loading hoặc lỗi */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="loading-spinner"></div>
            <span className="ml-4 text-white text-xl">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            {/* Cards chọn loại – fade in lần lượt với delay */}
            <div className="grid-container">
              {kanjiList.map((type, index) => {
                const isLoadingCard = loadingCard === type.id;
                const isComingSoon = !type.available;

                return (
                  <button
                    key={type.id}
                    onClick={() => handleSelect(type.id)}
                    className="glass-card"
                    style={{ animationDelay: `${0.3 + index * 0.15}s` }}
                    disabled={isComingSoon || isLoadingCard}
                  >
                    {/* Gradient overlay với màu riêng cho từng loại */}
                    <div
                      className={`gradient-overlay bg-gradient-to-br ${type.gradient}`}
                    />

                    {/* Ánh sáng blur khi hover */}
                    <div className="subtle-overlay">
                      <div className="glow-orb orb-top" />
                      <div className="glow-orb orb-bottom" />
                    </div>

                    {/* Badge hiển thị số lượng Kanji */}
                    {type.count !== undefined && type.count > 0 && (
                      <div className="vocab-count-badge">
                        {type.count.toLocaleString()} Kanji
                      </div>
                    )}

                    {/* Badge cho dữ liệu đang trống */}
                    {type.count !== undefined && type.count === 0 && (
                      <div className="empty-data-badge">Đang cập nhật</div>
                    )}

                    {/* Badge cho tính năng sắp ra mắt */}
                    {isComingSoon && (
                      <div className="coming-soon-badge">Sắp ra mắt</div>
                    )}

                    {/* Nội dung */}
                    <div className="relative z-10 p-8 md:p-12 text-center">
                      {isLoadingCard ? (
                        <div className="hero-text">
                          <div className="loading-spinner-small"></div>
                        </div>
                      ) : (
                        <div className="hero-text">{type.icon}</div>
                      )}

                      <h2 className="card-title">{type.title}</h2>
                      <p className="card-subtitle">{type.subtitle}</p>
                      <p className="card-description">{type.description}</p>

                      <div className="flex-container">
                        <span>
                          {isLoadingCard
                            ? "Đang tải..."
                            : isComingSoon
                              ? "Sắp ra mắt..."
                              : type.id === "minna"
                                ? "Bấm để bắt đầu"
                                : type.count && type.count > 0
                                  ? `Học ${type.count.toLocaleString()} Kanji`
                                  : "Xem chi tiết"}
                        </span>
                        {!isLoadingCard && !isComingSoon && (
                          <span className="moving-icon">
                            {type.count && type.count > 0 ? "→" : "🔍"}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer text – fade in cuối cùng */}
            <div
              className="footer-container text-center"
              style={{ animationDelay: "1.2s" }}
            >
              <p className="accent-text">
                Học Kanji cùng mèo – nhớ lâu, viết đẹp, dùng chuẩn! Mèo tin bạn
                làm được 💪🖌️
              </p>
              <div className="bouncing-icon">🐾</div>
            </div>
          </>
        )}
      </main>

      {/* Modal thông báo */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <h3 className="modal-title">{modalContent.title}</h3>
              <p className="modal-message">{modalContent.message}</p>
              <div className="modal-actions">
                <button onClick={closeModal} className="modal-button">
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS cho toàn bộ component */}
      <style>{`
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
          gap: 2rem;
          padding: 1rem;
        }

        @media (min-width: 640px) {
          .grid-container {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 2.5rem;
          }
        }

        @media (min-width: 1024px) {
          .grid-container {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 3rem;
          }
        }

        @media (min-width: 1280px) {
          .grid-container {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 4rem;
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
        }

        @media (min-width: 768px) {
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

        .gradient-overlay {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          opacity: 0;
          transition: opacity 0.7s ease;
          z-index: 0;
        }

        .glass-card:hover .gradient-overlay {
          opacity: 1;
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
          opacity: 0;
        }

        .glass-card:hover {
          transform: scale(1.05) translateY(-24px);
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.6);
        }

        .glass-card:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .glass-card:disabled:hover {
          transform: none;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
          filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15)) 
                  drop-shadow(0 10px 10px rgba(0, 0, 0, 0.04));
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

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.3s ease-out;
        }

        .modal-container {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          max-width: 500px;
          width: 100%;
          overflow: hidden;
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-content {
          padding: 2.5rem;
          text-align: center;
        }

        .modal-title {
          font-size: 2rem;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 1.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .modal-message {
          font-size: 1.25rem;
          line-height: 1.75rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2rem;
        }

        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .modal-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 2rem;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .modal-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
        }

        .modal-button:active {
          transform: translateY(0);
        }

        /* Kanji Count Badge */
        .vocab-count-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          padding: 0.25rem 1rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          z-index: 20;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          animation: pulse 2s infinite;
        }

        /* Empty Data Badge */
        .empty-data-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%);
          color: white;
          padding: 0.25rem 1rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          z-index: 20;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        /* Coming Soon Badge */
        .coming-soon-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          color: white;
          padding: 0.25rem 1rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          z-index: 20;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(79, 172, 254, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(79, 172, 254, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(79, 172, 254, 0);
          }
        }

        /* Loading Spinner */
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #667eea;
          animation: spin 1s ease-in-out infinite;
        }

        .loading-spinner-small {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
          display: inline-block;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Error Container */
        .error-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .retry-button {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 2rem;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px rgba(245, 87, 108, 0.3);
        }

        .retry-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(245, 87, 108, 0.4);
        }
      `}</style>
    </div>
  );
}
