// src/components/VocabularySelector.tsx
import { useState, useEffect } from "react";
import api from "../api/axios";

interface VocabType {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  available: boolean;
  count?: number;
}

interface ApiResponse {
  success: boolean;
  count?: number;
  message?: string;
}

const vocabTypes: VocabType[] = [
  {
    id: "minna",
    title: "Minna no Nihongo",
    subtitle: "Giáo trình chuẩn Nhật Bản",
    description: "Học theo bài có cấu trúc rõ ràng, phù hợp người mới bắt đầu",
    icon: "📚",
    available: true,
  },
  {
    id: "n5",
    title: "JLPT N5",
    subtitle: "~800 từ vựng chuẩn thi",
    description: "Học theo ngày, flashcard thông minh, dễ đạt chứng chỉ",
    icon: "🎯",
    available: true,
    count: 0,
  },
  {
    id: "n4",
    title: "JLPT N4",
    subtitle: "~1,500 từ vựng chuẩn thi",
    description: "Nâng cao trình độ, mở rộng vốn từ thông dụng",
    icon: "📘",
    available: true,
    count: 0,
  },
  {
    id: "n3",
    title: "JLPT N3",
    subtitle: "~3,700 từ vựng chuẩn thi",
    description: "Trình độ trung cấp, giao tiếp thực tế",
    icon: "📗",
    available: true,
    count: 0,
  },
  {
    id: "n2",
    title: "JLPT N2",
    subtitle: "~6,000 từ vựng chuẩn thi",
    description: "Thông thạo tiếng Nhật trong công việc",
    icon: "📙",
    available: true,
    count: 0,
  },
  {
    id: "n1",
    title: "JLPT N1",
    subtitle: "~10,000 từ vựng chuẩn thi",
    description: "Trình độ cao cấp, thành thạo như người bản xứ",
    icon: "📕",
    available: true,
    count: 0,
  },
];

export function VocabularySelector({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
  });
  const [vocabList, setVocabList] = useState<VocabType[]>(vocabTypes);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Hàm gọi API để lấy số lượng từ vựng theo level
  const fetchVocabCounts = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const updatedVocabList = [...vocabList];

      for (let i = 1; i < updatedVocabList.length; i++) {
        const vocab = updatedVocabList[i];
        if (vocab.id.startsWith("n")) {
          try {
            // SỬA: Dùng toUpperCase() ở đây
            const response = await api.get(
              `/vocabulary/${vocab.id.toUpperCase()}/count`,
            );
            const data: ApiResponse = response.data;

            if (!data?.success) {
              console.warn(
                `API không trả về cho ${vocab.id}, giữ nguyên trạng thái mặc định`,
              );
              continue;
            }

            updatedVocabList[i] = {
              ...vocab,
              available: true,
              count: data.count || 0,
              subtitle: `~${data.count?.toLocaleString() || "0"} từ vựng chuẩn thi`,
            };
          } catch (error) {
            console.error(`Lỗi khi gọi API cho ${vocab.id}:`, error);
          }
        }
      }

      setVocabList(updatedVocabList);
    } catch (error) {
      console.error("Lỗi khi lấy số lượng từ vựng:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabCounts();
  }, []);

  const handleSelect = async (typeId: string) => {
    const vocabType = vocabList.find((type) => type.id === typeId);

    if (!vocabType) {
      setModalContent({
        title: "Lỗi",
        message: "Không tìm thấy lộ trình học này. Vui lòng thử lại!",
      });
      setIsModalOpen(true);
      return;
    }

    // Kiểm tra API trước khi điều hướng cho JLPT levels
    if (typeId.startsWith("n")) {
      setIsLoading(true);
      try {
        const response = await api.get(`/vocabulary/${typeId.toUpperCase()}/count`);
        const data: ApiResponse = response.data;

        if (!data?.success) {
          console.warn(
            `API không khả dụng cho ${typeId}, vẫn cho phép truy cập`,
          );
          // Vẫn cho phép điều hướng dù API không trả về
        } else {
          if (data.count === 0) {
            console.warn(`Dữ liệu ${typeId} đang trống, vẫn cho phép truy cập`);
            // Vẫn cho phép điều hướng, có thể sẽ hiển thị thông báo bên trong component
          }
        }
      } catch (error) {
        console.error("Lỗi kiểm tra API:", error);
        // Vẫn cho phép điều hướng, component sẽ xử lý lỗi bên trong
      } finally {
        setIsLoading(false);
      }
    }

    const pageMapping: Record<string, string> = {
      minna: "vocabulary",
      n5: "vocabulary-n5",
      n4: "vocabulary-n4",
      n3: "vocabulary-n3",
      n2: "vocabulary-n2",
      n1: "vocabulary-n1",
    };

    const targetPage = pageMapping[typeId];
    if (targetPage) {
      onNavigate(targetPage);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const retryFetch = () => {
    fetchVocabCounts();
    setApiError(null);
  };

  return (
    <div className="min-h-screen relative">
      <main className="relative z-10 container mx-auto px-4 py-16 md:py-24 animate-fade-in">
        {/* Tiêu đề fade in đầu tiên */}
        <div className="text-center mb-16 md:mb-24">
          <h1 className="hero-section-title hero-text-glow">
            Chọn lộ trình học
          </h1>
          <p className="lead-text">
            Mèo đã chuẩn bị sẵn phong cách học siêu hay cho bạn rồi đấy! 🐾
          </p>
        </div>

        {/* Hiển thị loading hoặc lỗi */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="loading-spinner"></div>
            <span className="ml-4 text-white text-xl">Đang tải dữ liệu...</span>
          </div>
        ) : apiError ? (
          <div className="error-container text-center py-20">
            <p className="text-red-300 text-xl mb-4">{apiError}</p>
            <button onClick={retryFetch} className="retry-button">
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {/* Cards chọn loại – fade in lần lượt với delay */}
            <div className="grid-container">
              {vocabList.map((type, index) => (
                <button
                  key={type.id}
                  onClick={() => handleSelect(type.id)}
                  className="glass-card"
                  style={{ animationDelay: `${0.3 + index * 0.15}s` }}
                  disabled={isLoading}
                >
                  {/* Gradient nền khi hover */}
                  <div className="gradient-overlay" />

                  {/* Ánh sáng blur khi hover */}
                  <div className="subtle-overlay">
                    <div className="glow-orb orb-top" />
                    <div className="glow-orb orb-bottom" />
                  </div>

                  {/* Badge hiển thị số lượng từ vựng */}
                  {type.count !== undefined && type.count > 0 && (
                    <div className="vocab-count-badge">
                      {type.count.toLocaleString()} từ
                    </div>
                  )}

                  {/* Badge cho dữ liệu đang trống */}
                  {type.count !== undefined && type.count === 0 && (
                    <div className="empty-data-badge">Đang cập nhật</div>
                  )}

                  {/* Nội dung */}
                  <div className="relative z-10 p-8 md:p-12 text-center">
                    <div className="hero-text">{type.icon}</div>

                    <h2 className="card-title">{type.title}</h2>

                    <p className="card-subtitle">{type.subtitle}</p>

                    <p className="card-description">{type.description}</p>

                    <div className="flex-container">
                      <span>
                        {type.id === "minna"
                          ? "Bấm để bắt đầu"
                          : type.count && type.count > 0
                            ? `Học ${type.count.toLocaleString()} từ`
                            : "Xem chi tiết"}
                      </span>
                      <span className="moving-icon">
                        {type.count && type.count > 0 ? "→" : "🔍"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer text – fade in cuối cùng */}
            <div
              className="footer-container text-center"
              style={{ animationDelay: "1.2s" }}
            >
              <p className="accent-text">
                Tất cả các cấp độ đều đã được mở khóa! Bắt đầu từ N5 và tiến lên
                dần nhé! 💕
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
          background: linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2));
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
          opacity: 0.8;
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

        /* Vocabulary Count Badge */
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

        /* Opacity utilities */
        .opacity-60 {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
