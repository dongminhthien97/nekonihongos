// src/components/HiraKataSelector.tsx
import React from "react";
interface HiraKataSelectorProps {
  onNavigate: (page: string) => void;
}

export function HiraKataSelector({ onNavigate }: HiraKataSelectorProps) {
  const options = [
    {
      id: "hiragana",
      title: "Hiragana",
      char: "あ",
      subtitle: "Bảng chữ mềm",
      description: "Linh hồn của từ thuần Nhật, trợ từ và ngữ pháp căn bản.",
      hoverClass: "hiragana-gradient",
    },
    {
      id: "katakana",
      title: "Katakana",
      char: "ア",
      subtitle: "Bảng chữ cứng",
      description:
        "Chìa khóa để đọc từ mượn nước ngoài, tên riêng và từ tượng thanh.",
      hoverClass: "katakana-gradient",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <main className="relative z-10 container mx-auto px-4 py-16 md:py-24 animate-fade-in">
        {/* Header Section */}
        <div className="text-center mb-16 md:mb-24">
          <h1 className="hero-section-title hero-text-glow">
            Chọn bảng chữ cái
          </h1>
          <p className="lead-text">
            Bắt đầu hành trình chinh phục tiếng Nhật cùng mèo nhé! 🐾
          </p>
        </div>

        {/* Grid Cards */}
        <div className="grid-container">
          {options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => onNavigate(option.id)}
              className="glass-card"
              style={{ animationDelay: `${0.3 + index * 0.2}s` }}
            >
              {/* Lớp nền màu khi hover */}
              <div className={`gradient-overlay ${option.hoverClass}`} />

              {/* Hiệu ứng ánh sáng Orbs */}
              <div className="subtle-overlay">
                <div className="glow-orb orb-top" />
                <div className="glow-orb orb-bottom" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-10 md:p-16 text-center">
                <div className="hero-text">{option.char}</div>

                <h2 className="card-title">{option.title}</h2>
                <p className="card-subtitle">{option.subtitle}</p>
                <p className="card-description">{option.description}</p>

                <div className="flex-container">
                  <span>Bắt đầu ngay</span>
                  <span className="moving-icon">→</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Text */}
        <div
          className="footer-container text-center"
          style={{ animationDelay: "0.8s" }}
        >
          <p className="accent-text">
            Học mỗi ngày một ít, mèo tin bạn sẽ làm được! ✨
          </p>
          <div className="bouncing-icon">🐱</div>
        </div>
      </main>

      {/* Reused CSS Styles from VocabularySelector */}
      <style>{`
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .hero-section-title {
          position: relative;
          display: block;
          font-weight: 900;
          color: #ffffff;
          filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
          font-size: 3.5rem;
          line-height: 1;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        @media (min-width: 768px) { .hero-section-title { font-size: 4.5rem; } }
        @media (min-width: 1024px) { .hero-section-title { font-size: 7rem; } }

        .hero-text-glow {
          text-shadow: 0 0 20px #FF69B4, 0 0 40px #A020F0, 0 0 60px #00FFFF;
          animation: pulse-soft 2s ease-in-out infinite;
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }

        .lead-text {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          max-width: 56rem;
          margin: 0 auto;
          text-align: center;
        }

        .grid-container {
          max-width: 72rem;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          padding: 1rem;
        }

        @media (min-width: 1024px) {
          .grid-container { grid-template-columns: repeat(2, 1fr); gap: 5rem; }
        }

        .glass-card {
          position: relative;
          overflow: hidden;
          border-radius: 2rem;
          background-color: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .glass-card:hover {
          transform: scale(1.05) translateY(-24px);
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.6);
        }

        /* Gradient Overlays */
        .gradient-overlay {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.7s ease;
          z-index: 0;
        }
        .glass-card:hover .gradient-overlay { opacity: 1; }
        .hiragana-gradient { background: linear-gradient(to bottom right, rgba(236, 72, 153, 0.3), rgba(147, 51, 234, 0.3)); }
        .katakana-gradient { background: linear-gradient(to bottom right, rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.3)); }

        .hero-text {
          font-size: 6rem;
          color: white;
          margin-bottom: 2rem;
          display: inline-block;
          transition: transform 0.5s ease;
        }
        .glass-card:hover .hero-text { transform: scale(1.1) rotate(5deg); }

        .card-title { font-size: 3rem; font-weight: 900; color: white; margin-bottom: 1rem; }
        .card-subtitle { font-size: 1.5rem; font-weight: 600; color: white; margin-bottom: 1.5rem; }
        .card-description { font-size: 1.125rem; color: white; line-height: 1.6; max-width: 28rem; margin: 0 auto 2.5rem; }

        .flex-container {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .moving-icon {
          display: inline-block;
          transition: transform 0.5s ease;
        }
        .glass-card:hover .moving-icon { transform: translateX(1.5rem); }

        .glow-orb {
          position: absolute;
          width: 20rem;
          height: 20rem;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          filter: blur(64px);
          z-index: 0;
        }
        .orb-top { top: 0; left: 0; transform: translate(-50%, -50%); }
        .orb-bottom { bottom: 0; right: 0; transform: translate(50%, 50%); }

        .subtle-overlay {
          position: absolute;
          inset: 0;
          background-color: white;
          opacity: 0;
          transition: opacity 0.7s ease;
        }
        .glass-card:hover .subtle-overlay { opacity: 0.1; }

        .footer-container { margin-top: 6rem; }
        .accent-text { font-size: 1.5rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 1.5rem; }
        .bouncing-icon { font-size: 4rem; animation: bounce 1s infinite; display: inline-block; }

        @keyframes bounce {
          0%, 100% { transform: translateY(-25%); }
          50% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
