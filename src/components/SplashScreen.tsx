import { useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#FFC7EA] via-[#D8C8FF] to-[#C7FFF1] animate-fade-in">
      {/* Hero Section with Magical Cat Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 flex">
          {/* MÈO 1 – Yuumi 61 */}
          <div className="flex-shrink-0 w-screen h-full">
            <ImageWithFallback
              src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yuumi_61.jpg"
              alt="Yuumi Magical Cat"
              className="w-full h-full object-cover object-center"
              style={{
                filter: "brightness(0.88) contrast(1.12) saturate(1.2)",
              }}
            />
          </div>

          {/* MÈO 2 – Yuumi 49 (lặp lại để tạo hiệu ứng liền mạch) */}
          <div className="flex-shrink-0 w-screen h-full">
            <ImageWithFallback
              src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yuumi_49.jpg"
              alt="Yuumi Magical Cat 2"
              className="w-full h-full object-cover"
              style={{
                filter: "brightness(0.88) contrast(1.12) saturate(1.2)",
              }}
            />
          </div>

          {/* Lặp lại lần nữa để không bị trắng khi cuộn */}
          <div className="flex-shrink-0 w-screen h-full">
            <ImageWithFallback
              src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yuumi_50.jpg"
              alt="Yuumi Magical Cat"
              className="w-full h-full object-cover"
              style={{
                filter: "brightness(0.88) contrast(1.12) saturate(1.2)",
              }}
            />
          </div>
          <div className="flex-shrink-0 w-screen h-full">
            <ImageWithFallback
              src="https://wiki.leagueoflegends.com/en-us/images/Yuumi_YuubeeSkin.jpg?250dd"
              alt="Yuumi 2 repeat"
              className="w-full h-full object-cover"
              style={{
                filter: "brightness(0.88) contrast(1.12) saturate(1.2)",
              }}
            />
          </div>
        </div>
      </div>
      {/* Bouncing Cat */}
      <div className="relative mb-8 animate-bounce-slow">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
          {/* Viền sáng + bóng nhẹ */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 blur-xl opacity-60 animate-pulse"></div>

          <ImageWithFallback
            src="https://ih1.redbubble.net/image.5481873298.3314/st,small,507x507-pad,600x600,f8f8f8.jpg"
            alt="Cute Cat Icon"
            className="relative z-10 w-full h-full object-cover rounded-full shadow-2xl border-6 border-white/90"
            style={{
              animation: "wiggle 4s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Welcome Text */}
      <h1 className="hero-text-glow text-4xl mb-8 text-white animate-pulse-soft tracking-wide">
        🐾猫日本語🐾
      </h1>
      <p className="hero-text-glow text-4xl sm:text-5xl lg:text-6xl text-white mb-12 animate-fade-in-delay">
        🐾ようこそ！🐾
      </p>

      {/* Loading Bar with Paw Prints */}
      <div className="w-80 h-3 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
        <div className="h-full bg-gradient-to-r from-[#FFC7EA] to-[#D8C8FF] rounded-full animate-load-bar relative">
          {/* Paw prints on loading bar */}
          <div className="absolute inset-0 flex items-center justify-evenly">
            <span className="text-white opacity-70 animate-pulse">🐾</span>
            <span className="text-white opacity-70 animate-pulse delay-100">
              🐾
            </span>
            <span className="text-white opacity-70 animate-pulse delay-200">
              🐾
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes load-bar {
          from { width: 0%; }
          to { width: 100%; }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-in;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-in 0.3s both;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }

        .animate-load-bar {
          animation: load-bar 2.5s ease-in-out forwards;
        }

        .animate-wiggle {
          animation: wiggle 1s ease-in-out infinite;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
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
