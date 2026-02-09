// components/Background.tsx
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Background() {
  return (
    <>
      {/* BACKGROUND MÈO FLOAT TỪ TRÁI SANG PHẢI – SIÊU MƯỢT, SIÊU ĐẸP */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="float-container">
          <div className="float-track h-full">
            {/* Lặp lại 2 lần để tạo vòng lặp vô tận */}
            {[...Array(2)].map((_, loop) => (
              <div key={loop} className="float-set inline-flex">
                <div className="w-screen h-screen flex-shrink-0">
                  <ImageWithFallback
                    src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yuumi_61.jpg"
                    alt="Yuumi"
                    className="w-full h-full object-cover"
                    style={{
                      filter: "brightness(0.92) contrast(1.15) saturate(1.3)",
                    }}
                  />
                </div>
                <div className="w-screen h-screen flex-shrink-0">
                  <ImageWithFallback
                    src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yuumi_49.jpg"
                    alt="Yuumi"
                    className="w-full h-full object-cover"
                    style={{
                      filter: "brightness(0.92) contrast(1.15) saturate(1.3)",
                    }}
                  />
                </div>
                <div className="w-screen h-screen flex-shrink-0">
                  <ImageWithFallback
                    src="https://www.lolvvv.com/_next/image?url=https%3A%2F%2Fddragon.leagueoflegends.com%2Fcdn%2Fimg%2Fchampion%2Fsplash%2FYuumi_50.jpg&w=1200&q=75"
                    alt="Yuumi"
                    className="w-full h-full object-cover"
                    style={{
                      filter: "brightness(0.92) contrast(1.15) saturate(1.3)",
                    }}
                  />
                </div>
                <div className="w-screen h-screen flex-shrink-0">
                  <ImageWithFallback
                    src="https://www.lolvvv.com/_next/image?url=https%3A%2F%2Fddragon.leagueoflegends.com%2Fcdn%2Fimg%2Fchampion%2Fsplash%2FYuumi_0.jpg&w=1200&q=75"
                    alt="Yuumi"
                    className="w-full h-full object-cover"
                    style={{
                      filter: "brightness(0.92) contrast(1.15) saturate(1.3)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lớp phủ gradient + orb glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-purple-900/35 to-pink-900/45 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-400/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* CSS FLOAT SIÊU MƯỢT – CHUẨN HIỆN ĐẠI */}
      <style>{`
        .float-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .float-track {
          display: inline-flex;
          width: max-content;
          animation: float-left-to-right 160s linear infinite;
        }

        .float-set {
          display: inline-flex;
        }

        @keyframes float-left-to-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </>
  );
}
