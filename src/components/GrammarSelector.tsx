// src/components/GrammarSelector.tsx
import { useState, useEffect } from "react";
import api from "../api/axios";

interface GrammarType {
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
  data?: number; // SỬA: Đổi từ count sang data
  message?: string;
}

const grammarTypes: GrammarType[] = [
  {
    id: "minna",
    title: "Minna no Nihongo",
    subtitle: "Giáo trình chuẩn Nhật Bản",
    description:
      "Học ngữ pháp theo bài có cấu trúc rõ ràng, phù hợp người mới bắt đầu",
    icon: "📘",
    available: true,
  },
  {
    id: "n5",
    title: "JLPT N5",
    subtitle: "~100 cấu trúc cơ bản",
    description: "Tóm tắt ngữ pháp quan trọng nhất cho kỳ thi JLPT N5",
    icon: "🎯",
    available: true,
    count: 0,
  },
  {
    id: "n4",
    title: "JLPT N4",
    subtitle: "~150 cấu trúc trung cấp",
    description:
      "Ngữ pháp N4 sẽ sớm ra mắt để bạn chinh phục cấp độ tiếp theo!",
    icon: "📈",
    available: true,
    count: 0,
  },
  {
    id: "n3",
    title: "JLPT N3",
    subtitle: "~350 cấu trúc trung cấp",
    description: "Ngữ pháp trình độ trung cấp, chuẩn bị cho kỳ thi JLPT N3",
    icon: "📊",
    available: true,
    count: 0,
  },
  {
    id: "n2",
    title: "JLPT N2",
    subtitle: "~600 cấu trúc nâng cao",
    description: "Ngữ pháp trình độ cao cấp, đang trong quá trình phát triển",
    icon: "📙",
    available: true,
    count: 0,
  },
  {
    id: "n1",
    title: "JLPT N1",
    subtitle: "~1000 cấu trúc thành thạo",
    description:
      "Ngữ pháp trình độ thượng cấp, đang trong quá trình phát triển",
    icon: "📕",
    available: true,
    count: 0,
  },
];

export function GrammarSelector({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
  });
  const [grammarList, setGrammarList] = useState<GrammarType[]>(grammarTypes);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Hàm gọi API để lấy số lượng ngữ pháp theo level
  const fetchGrammarCounts = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const updatedGrammarList = [...grammarList];

      for (let i = 1; i < updatedGrammarList.length; i++) {
        const grammar = updatedGrammarList[i];
        if (grammar.id.startsWith("n")) {
          try {
            // SỬA: Dùng đúng endpoint mới với /api/grammar/jlpt/{level}/count
            const response = await api.get(
              `/grammar/jlpt/${grammar.id.toUpperCase()}/count`,
            );
            const data: ApiResponse = response.data;

            if (!data?.success) {
              console.warn(
                `API không trả về cho ${grammar.id}, giữ nguyên trạng thái mặc định`,
              );
              continue;
            }

            if (data.data !== undefined) {
              // SỬA: Lấy data.data thay vì data.count
              updatedGrammarList[i] = {
                ...grammar,
                available: true,
                count: data.data || 0,
                subtitle: `~${data.data?.toLocaleString() || "0"} cấu trúc ngữ pháp`,
              };
            }
          } catch (error) {
            console.error(`Lỗi khi gọi API cho ${grammar.id}:`, error);
          }
        }
      }

      setGrammarList(updatedGrammarList);
    } catch (error) {
      console.error("Lỗi khi lấy số lượng ngữ pháp:", error);
      setApiError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrammarCounts();
  }, []);

  const handleSelect = async (typeId: string) => {
    const grammarType = grammarList.find((type) => type.id === typeId);

    if (!grammarType) {
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
        // SỬA: Dùng đúng endpoint mới
        const response = await api.get(
          `/grammar/jlpt/${typeId.toUpperCase()}/count`,
        );
        const data: ApiResponse = response.data;

        if (!data?.success) {
          console.warn(
            `API không khả dụng cho ${typeId}, vẫn cho phép truy cập`,
          );
          // Vẫn cho phép điều hướng dù API không trả về
        } else {
          if (data.data === 0) {
            console.warn(`Dữ liệu ${typeId} đang trống, vẫn cho phép truy cập`);
          }
        }
      } catch (error) {
        console.error("Lỗi kiểm tra API:", error);
        // Vẫn cho phép điều hướng ngay cả khi API lỗi
      } finally {
        setIsLoading(false);
      }
    }

    const pageMapping: Record<string, string> = {
      minna: "grammar",
      n5: "grammar-n5",
      n4: "grammar-n4",
      n3: "grammar-n3",
      n2: "grammar-n2",
      n1: "grammar-n1",
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
    fetchGrammarCounts();
    setApiError(null);
  };

  return (
    <div className="grammar-selector-container">
      {/* Modal thông báo */}
      {isModalOpen && (
        <div className="grammar-selector-error-modal">
          <div className="error-modal-overlay" onClick={closeModal} />
          <div className="error-modal-content">
            <div className="error-modal-header">
              <div className="error-modal-icon">⚠️</div>
              <h3 className="error-modal-title">Thông báo</h3>
            </div>
            <div className="error-modal-body">
              <p>{modalContent.message}</p>
            </div>
            <div className="error-modal-actions">
              <button
                className="error-modal-button"
                onClick={closeModal}
                autoFocus
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="grammar-selector-main">
        {/* Tiêu đề */}
        <div className="grammar-selector-header">
          <h1 className="grammar-selector-title">Chọn lộ trình Ngữ pháp</h1>
          <p className="grammar-selector-subtitle">
            Mèo đã chuẩn bị sẵn các phong cách học ngữ pháp siêu hay cho bạn rồi
            đấy! 🐾
          </p>
        </div>

        {/* Hiển thị loading hoặc lỗi */}
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span className="loading-text">Đang tải dữ liệu...</span>
          </div>
        ) : apiError ? (
          <div className="error-container">
            <p className="error-text">{apiError}</p>
            <button onClick={retryFetch} className="retry-button">
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {/* Cards chọn loại */}
            <div className="grammar-selector-grid">
              {grammarList.map((type, index) => (
                <button
                  key={type.id}
                  onClick={() => handleSelect(type.id)}
                  className={`grammar-card ${
                    type.available
                      ? "grammar-card-available"
                      : "grammar-card-disabled"
                  }`}
                  style={{ animationDelay: `${0.3 + index * 0.15}s` }}
                  disabled={isLoading}
                >
                  <div
                    className={`grammar-card-gradient ${
                      type.id === "minna"
                        ? "gradient-minna"
                        : type.id === "n5"
                          ? "gradient-n5"
                          : type.id === "n4"
                            ? "gradient-n4"
                            : type.id === "n3"
                              ? "gradient-n3"
                              : type.id === "n2"
                                ? "gradient-n2"
                                : "gradient-n1"
                    }`}
                  />
                  <div className="grammar-card-glow">
                    <div className="glow-orb glow-orb-top" />
                    <div className="glow-orb glow-orb-bottom" />
                  </div>

                  {/* Badge hiển thị số lượng ngữ pháp */}
                  {type.count !== undefined && type.count > 0 && (
                    <div className="grammar-count-badge">
                      {type.count.toLocaleString()} cấu trúc
                    </div>
                  )}

                  {/* Badge cho dữ liệu đang trống */}
                  {type.count !== undefined && type.count === 0 && (
                    <div className="empty-data-badge">Đang cập nhật</div>
                  )}

                  <div className="grammar-card-content">
                    <div className="grammar-card-icon">{type.icon}</div>

                    <h2 className="grammar-card-title">{type.title}</h2>
                    <p className="grammar-card-subtitle">{type.subtitle}</p>
                    <p className="grammar-card-description">
                      {type.description}
                    </p>

                    <div className="grammar-card-action">
                      <span>
                        {type.id === "minna"
                          ? "Bấm để bắt đầu"
                          : type.count && type.count > 0
                            ? `Học ${type.count.toLocaleString()} cấu trúc`
                            : "Xem chi tiết"}
                      </span>
                      <span className="action-arrow">
                        {type.count && type.count > 0 ? "→" : "🔍"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer text */}
            <div className="grammar-selector-footer">
              <p className="footer-text">
                Tất cả các cấp độ đều đã được mở khóa! Bắt đầu từ N5 và tiến lên
                dần nhé! 💕
              </p>
              <div className="footer-icon">🐾</div>
            </div>
          </>
        )}
      </main>

      <style>{`
        .grammar-selector-container {
          min-height: 100vh;
          position: relative;
        }

        .grammar-selector-main {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 72rem;
          margin: 0 auto;
          padding: 4rem 1rem;
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .grammar-selector-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .grammar-selector-title {
          position: relative;
          display: block;
          padding: 2rem 2.5rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          color: #ffffff;
          filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15))
                  drop-shadow(0 10px 10px rgba(0, 0, 0, 0.04));
          transform: translateY(-0.75rem);
          font-size: 3.75rem;
          line-height: 1;
          text-shadow: 
            0 0 20px #FF69B4,
            0 0 40px #A020F0,
            0 0 60px #00FFFF,
            0 0 80px #FF69B4,
            0 0 100px #A020F0,
            0 4px 20px rgba(0,0,0,0.9);
          animation: pulse-soft 2s ease-in-out infinite;
        }

        @media (min-width: 768px) {
          .grammar-selector-title {
            padding: 2.5rem 3.5rem;
            font-size: 4.5rem;
            transform: translateY(-1rem);
          }
        }

        @media (min-width: 1024px) {
          .grammar-selector-title {
            padding: 3rem 5rem;
            font-size: 8rem;
            transform: translateY(-1.25rem);
          }
        }

        .grammar-selector-subtitle {
          font-size: 1.25rem;
          line-height: 1.75rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          max-width: 56rem;
          margin: 0 auto;
          text-align: center;
        }

        @media (min-width: 768px) {
          .grammar-selector-subtitle {
            font-size: 1.875rem;
            line-height: 2.25rem;
          }
        }

        /* Loading và Error Styles */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #667eea;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }

        .loading-text {
          color: white;
          font-size: 1.25rem;
        }

        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
          text-align: center;
        }

        .error-text {
          color: #fca5a5;
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
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

        /* Grid Layout */
        .grammar-selector-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 3rem;
          max-width: 72rem;
          margin: 0 auto;
          padding: 1rem;
        }

        @media (min-width: 768px) {
          .grammar-selector-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }
        }

        @media (min-width: 1024px) {
          .grammar-selector-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 2.5rem;
          }
        }

        /* Card Styles */
        .grammar-card {
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
          min-height: 400px;
          width: 100%;
        }

        .grammar-card-available {
          cursor: pointer;
        }

        .grammar-card-available:hover {
          transform: scale(1.05) translateY(-1.5rem);
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.6);
        }

        .grammar-card-disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .grammar-card-disabled:hover {
          transform: none;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .grammar-card-gradient {
          position: absolute;
          inset: 0;
          opacity: 0.2;
          transition: opacity 0.3s ease;
        }

        .gradient-minna {
          background: linear-gradient(135deg, #60a5fa, #06b6d4);
        }

        .gradient-n5 {
          background: linear-gradient(135deg, #f472b6, #a855f7);
        }

        .gradient-n4 {
          background: linear-gradient(135deg, #4ade80, #14b8a6);
        }

        .gradient-n3 {
          background: linear-gradient(135deg, #fbbf24, #f97316);
        }

        .gradient-n2 {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .gradient-n1 {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
        }

        .grammar-card-available:hover .grammar-card-gradient {
          opacity: 0.4;
        }

        .grammar-card-glow {
          position: absolute;
          inset: 0;
          background-color: white;
          opacity: 0;
          transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .grammar-card-available:hover .grammar-card-glow {
          opacity: 0.4;
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

        .glow-orb-top {
          top: 0;
          left: 0;
          transform: translate(-50%, -50%);
        }

        .glow-orb-bottom {
          bottom: 0;
          right: 0;
          transform: translate(50%, 50%);
        }

        .grammar-card-content {
          position: relative;
          z-index: 1;
          padding: 2rem;
          text-align: center;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        @media (min-width: 768px) {
          .grammar-card-content {
            padding: 2.5rem;
          }
        }

        .grammar-card-icon {
          font-size: 4rem;
          line-height: 1;
          margin-bottom: 1.5rem;
          display: inline-block;
          transition: transform 0.5s ease;
          will-change: transform;
        }

        .grammar-card-available:hover .grammar-card-icon {
          transform: scale(1.1);
        }

        .grammar-card-title {
          font-size: 2rem;
          line-height: 2.25rem;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 0.5rem;
          filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04)) 
                  drop-shadow(0 4px 3px rgba(0, 0, 0, 0.1));
        }

        @media (min-width: 768px) {
          .grammar-card-title {
            font-size: 2.25rem;
            line-height: 2.5rem;
          }
        }

        .grammar-card-subtitle {
          font-size: 1.125rem;
          line-height: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          margin-bottom: 1rem;
        }

        @media (min-width: 768px) {
          .grammar-card-subtitle {
            font-size: 1.25rem;
            line-height: 1.75rem;
          }
        }

        .grammar-card-description {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
          margin-bottom: 1.5rem;
          flex-grow: 1;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @media (min-width: 768px) {
          .grammar-card-description {
            font-size: 1.125rem;
            line-height: 1.625;
          }
        }

        .grammar-card-action {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          color: #ffffff;
          font-size: 1.125rem;
          font-weight: 700;
          vertical-align: middle;
        }

        @media (min-width: 768px) {
          .grammar-card-action {
            font-size: 1.25rem;
          }
        }

        .action-arrow {
          font-size: 1.5rem;
          display: inline-block;
          transition: transform 0.5s ease;
          will-change: transform;
        }

        .grammar-card-available:hover .action-arrow {
          transform: translateX(0.75rem);
        }

        /* Grammar Count Badge */
        .grammar-count-badge {
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

        /* Footer */
        .grammar-selector-footer {
          margin-top: 4rem;
          text-align: center;
        }

        @media (min-width: 768px) {
          .grammar-selector-footer {
            margin-top: 6rem;
          }
        }

        .footer-text {
          font-size: 1.5rem;
          line-height: 2rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 768px) {
          .footer-text {
            font-size: 1.875rem;
            line-height: 2.25rem;
          }
        }

        .footer-icon {
          font-size: 3.75rem;
          line-height: 1;
          display: inline-block;
          animation: bounce 1s infinite;
        }

        @media (min-width: 768px) {
          .footer-icon {
            font-size: 6rem;
          }
        }

        /* Error Modal */
        .grammar-selector-error-modal {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: error-modal-fade-in 0.2s ease;
          opacity: 0;
        }

        .error-modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }

        .error-modal-content {
          position: relative;
          background: #1f2937;
          border-radius: 1rem;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          animation: error-modal-slide-up 0.3s ease;
        }

        .error-modal-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
          background: rgba(220, 38, 38, 0.1);
          border-bottom: 1px solid rgba(220, 38, 38, 0.2);
        }

        .error-modal-icon {
          font-size: 1.5rem;
        }

        .error-modal-title {
          margin: 0;
          color: #fca5a5;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .error-modal-body {
          padding: 1.5rem;
        }

        .error-modal-body p {
          margin: 0;
          color: #e5e7eb;
          line-height: 1.5;
        }

        .error-modal-actions {
          padding: 0 1.5rem 1.5rem;
          display: flex;
          justify-content: flex-end;
        }

        .error-modal-button {
          padding: 0.75rem 1.5rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .error-modal-button:hover {
          background: #b91c1c;
        }

        .error-modal-button:focus {
          outline: 2px solid #fca5a5;
          outline-offset: 2px;
        }

        /* Animations */
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

        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
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

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes error-modal-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes error-modal-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .grammar-selector-grid {
            gap: 2rem;
          }

          .grammar-card {
            margin: 0 0.5rem;
          }

          .error-modal-content {
            width: 95%;
          }
        }

        @media (max-width: 640px) {
          .grammar-selector-title {
            font-size: 2.5rem;
            padding: 1.5rem 1rem;
          }

          .grammar-selector-subtitle {
            font-size: 1.125rem;
            line-height: 1.5rem;
          }

          .grammar-card-content {
            padding: 1.5rem;
          }

          .grammar-card-icon {
            font-size: 3rem;
          }

          .error-modal-header {
            padding: 1.25rem;
          }

          .error-modal-body {
            padding: 1.25rem;
          }

          .error-modal-actions {
            padding: 0 1.25rem 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .grammar-selector-title {
            font-size: 2rem;
            padding: 1rem;
          }

          .grammar-selector-grid {
            grid-template-columns: 1fr;
          }

          .footer-text {
            font-size: 1.25rem;
            line-height: 1.75rem;
          }

          .footer-icon {
            font-size: 3rem;
          }
        }
      `}</style>
    </div>
  );
}
