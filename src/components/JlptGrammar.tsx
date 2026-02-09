// src/pages/JlptGrammar.tsx
import { useState, useEffect } from "react";
import { NekoLoading } from "./NekoLoading";
import api from "../api/axios";
import toast from "react-hot-toast";

interface GrammarPattern {
  id: number;
  level: string; // Thêm trường level
  pattern: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

const PATTERNS_PER_DAY = 5;

interface JlptGrammarProps {
  level: string; // "n5", "n4", "n3", "n2", "n1"
  onNavigate: (page: string) => void;
}

export function JlptGrammar({ level, onNavigate }: JlptGrammarProps) {
  const [patterns, setPatterns] = useState<GrammarPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const levelUpper = level.toUpperCase(); // "N5", "N4", etc.

  useEffect(() => {
    const fetchGrammar = async () => {
      try {
        // SỬA: Gọi đúng API endpoint mới với /api/grammar/jlpt/{level}
        const res = await api.get(`/grammar/jlpt/${levelUpper}`);

        await new Promise((resolve) => setTimeout(resolve, 600));

        // Kiểm tra response format đúng
        if (res.data && res.data.success) {
          const data = res.data.data; // Lấy data từ response

          if (data && Array.isArray(data)) {
            if (data.length > 0) {
              setPatterns(data);
            } else {
              setPatterns([]);
              toast(
                `Chưa có cấu trúc ngữ pháp nào cho ${levelUpper}. Mèo sẽ sớm cập nhật thêm nhé! 😺`,
                {
                  icon: "😺",
                  duration: 2000,
                },
              );
            }
          } else {
            setPatterns([]);
            toast("Dữ liệu không hợp lềE Mèo đang kiểm tra lại... 😿", {
              icon: "😿",
              duration: 2000,
            });
          }
        } else {
          // Nếu response không có format ApiResponse, thử lấy trực tiếp
          if (Array.isArray(res.data)) {
            setPatterns(res.data);
          } else {
            setPatterns([]);
            toast("Dữ liệu không hợp lềE Mèo đang kiểm tra lại... 😿", {
              icon: "😿",
              duration: 2000,
            });
          }
        }
      } catch (err: any) {
        console.error("Error fetching grammar:", err);

        if (err.response?.status === 401) {
          alert(
            "Phiên đăng nhập của bạn đã hết hạn!\nMèo sẽ đưa bạn vềEtrang đăng nhập ngay đây 😿",
          );

          toast.error(
            "Phiên đăng nhập hết hạn rồi... Mèo đưa bạn vềEđăng nhập nhé 😿",
            {
              duration: 2000,
            },
          );

          setTimeout(() => {
            onNavigate("login");
          }, 1000);
        } else if (err.response?.status === 404) {
          toast.error(
            `API endpoint cho ${levelUpper} chưa sẵn sàng. Mèo đang sửa đây... 😿`,
            { duration: 3000 },
          );
        } else {
          toast.error(
            `Không tải được dữ liệu ngữ pháp ${levelUpper}. Mèo đang sửa đây... 😿`,
            { duration: 3000 },
          );
        }
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 600);
      }
    };

    fetchGrammar();
  }, [onNavigate, levelUpper]);

  // Phân trang
  const totalDays = Math.ceil(patterns.length / PATTERNS_PER_DAY);
  const currentDayPatterns = patterns.slice(
    (selectedDay - 1) * PATTERNS_PER_DAY,
    selectedDay * PATTERNS_PER_DAY,
  );

  if (isLoading)
    return (
      <NekoLoading message={`Mèo đang chuẩn bị ngữ pháp ${levelUpper}...`} />
    );

  return (
    <div className="min-h-screen">
      <main className="relative z-10 mb-12 md:mb-16">
        <h1 className="hero-section-title hero-text-glow text-center">
          Ngữ pháp JLPT {levelUpper} (~{patterns.length} cấu trúc)
        </h1>

        {/* Chọn ngày */}
        <div className="text-center mb-10">
          <p className="text-white text-3xl mb-4">
            Học theo ngày  E5 cấu trúc mỗi ngày
          </p>
          <div className="flex-center-group">
            <button
              onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
              disabled={selectedDay === 1}
              className="btn-primary"
            >
              →Ngày trước
            </button>

            <span className="btn-secondary">
              Ngày {selectedDay} / {totalDays} ({currentDayPatterns.length} cấu
              trúc)
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

        {/* Bảng ngữ pháp */}
        <div className="main-container-glass">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-pink-purple">
              <tr>
                <th className="p-6 text-lg text-center font-bold">STT</th>
                <th className="p-6 text-lg text-center font-bold">Cấu trúc</th>
                <th className="p-6 text-lg text-center font-bold">Nghĩa</th>
                <th className="p-6 text-lg text-center font-bold">Ví dụ</th>
                <th className="p-6 text-lg text-center font-bold">
                  Dịch ví dụ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {currentDayPatterns.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-gray-500 text-2xl"
                  >
                    {patterns.length === 0
                      ? `Chưa có dữ liệu ngữ pháp ${levelUpper}. Mèo sẽ cập nhật sớm! 😺`
                      : "Không có cấu trúc nào trong ngày này 😿"}
                  </td>
                </tr>
              ) : (
                currentDayPatterns.map((p, index) => (
                  <tr key={p.id} className="list-item-hover">
                    <td className="p-6 text-center font-medium">
                      {(selectedDay - 1) * PATTERNS_PER_DAY + index + 1}
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-3xl font-black text-gray-900">
                        {p.pattern}
                      </span>
                    </td>
                    <td className="p-6 text-center text-2xl text-gray-800">
                      {p.meaning}
                    </td>
                    <td className="p-6 text-xl text-gray-700 leading-relaxed">
                      {p.example}
                    </td>
                    <td className="p-6 text-xl text-gray-800">
                      {p.exampleMeaning}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* CSS */}
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
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-primary:disabled:hover {
          background-color: rgba(255, 255, 255, 0.8);
          transform: none;
          box-shadow: none;
        }
        
        .list-item-hover {
          border-bottom: 1px solid #e5e7eb;
          transition-property: background-color, border-color, color, fill, stroke;
          transition-duration: 200ms;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
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
        
        .hero-section-title {
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
          .hero-section-title {
            padding: 2.5rem 3.5rem;
            font-size: 4.5rem;
            transform: translateY(-1rem);
          }
        }
        
        @media (min-width: 1024px) {
          .hero-section-title {
            padding: 3rem 5rem;
            font-size: 8rem;
            transform: translateY(-1.25rem);
          }
        }
        
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
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
        
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
