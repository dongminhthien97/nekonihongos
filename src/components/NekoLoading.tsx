// src/components/NekoLoading.tsx
import { useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface NekoLoadingProps {
  message?: string;
  duration?: number; // tự động tắt sau bao lâu (ms)
  onComplete?: () => void;
}

export function NekoLoading({
  message = "Đang tải từ vựng mèo...",
  duration = 1500,
  onComplete,
}: NekoLoadingProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  return (
    <div className="fixed-gradient-background">
      {/* Bouncing Cat – SIÊU DỄ THƯƠNG */}
      <div className="relative mb-12 animate-bounce-slow">
        <div className="relative w-40 h-40 mx-auto">
          {/* Viền sáng + bóng glow */}
          <div className="pulsing-gradient-glow"></div>

          <ImageWithFallback
            src="https://ih1.redbubble.net/image.5481873298.3314/st,small,507x507-pad,600x600,f8f8f8.jpg"
            alt="Neko Loading"
            className="profile-image-styled"
            style={{
              animation: "wiggle 3s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Tiêu đề + tin nhắn */}
      <h1 className="hero-text-glow hero-section-title">猫日本語</h1>

      <p className="pulsing-main-title">{message}</p>

      {/* Thanh loading với dấu chân mèo */}
      <div className="loading-bar-shell-blur">
        <div className="loading-bar-indicator">
          <div className="absolute inset-0 flex items-center justify-evenly">
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="text-white text-2xl animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              ></span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
      @keyframes load-bar {
  0% {
    width: 0%;
  }
  50% {
    width: 75%;
  }
  100% {
    width: 100%;
  }
}

.loading-bar-indicator {
  height: 100%;
  background-image: linear-gradient(to right, #f472b6, #8b5cf6, #22d3ee);
  border-radius: 9999px;
  position: relative;
  /* Giả định animation chạy liên tục và điều chỉnh tốc độ, có thể thay đổi tùy ý */
  animation: load-bar 1.5s infinite ease-in-out; 
}

      .loading-bar-shell-blur {
  width: 24rem;
  height: 1rem;
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: 9999px;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
      @keyframes pulse-soft {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.pulsing-main-title {
  /* text-3xl */
  font-size: 1.875rem;
  /* text-white */
  color: #ffffff;
  /* font-bold */
  font-weight: 700;
  /* animate-pulse-soft */
  animation: pulse-soft 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  /* mb-12 */
  margin-bottom: 3rem;
}

@media (min-width: 768px) {
  .pulsing-main-title {
    /* md:text-4xl */
    font-size: 2.25rem;
  }
}
      .hero-section-title {
  /* text-5xl */
  font-size: 3rem; 
  /* font-black */
  font-weight: 900; 
  /* text-white */
  color: #ffffff;
  /* mb-6 */
  margin-bottom: 1.5rem; 
  /* tracking-wider */
  letter-spacing: 0.05em; 
  /* hero-text-glow (Tạo hiệu ứng phát sáng nhẹ màu trắng) */
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.7);
}

@media (min-width: 768px) {
  .hero-section-title {
    /* md:text-6xl */
    font-size: 3.75rem; 
  }
}
      .profile-image-styled {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 9999px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border-width: 8px;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.9);
}

      @keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 0.35;
  }
}

.pulsing-gradient-glow {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 9999px;
  background-image: linear-gradient(to bottom right, #fbcfe8, #a855f7);
  filter: blur(40px);
  opacity: 0.7;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
      .fixed-gradient-background {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(to bottom right, #FFC7EA, #D8C8FF, #C7FFF1);
}
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-30px);
          }
        }
        @keyframes pulse-soft {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        @keyframes load-bar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
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
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
        .animate-load-bar {
          animation: load-bar 1.4s ease-out forwards;
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
