// src/pages/LoginPage.tsx hoặc src/components/LoginPage.tsx
import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { Background } from "./Background";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] = useState<"checking" | "waking" | "ready" | "error">("checking");
  const [countdown, setCountdown] = useState(50);
  const { login } = useAuth();

  // Wake up backend and track status
  useEffect(() => {
    let pollInterval: any;
    let countdownInterval: any;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
          method: "GET",
          cache: "no-cache",
        });
        if (response.ok) {
          setBackendStatus("ready");
          clearInterval(pollInterval);
        } else {
          setBackendStatus("waking");
        }
      } catch (err) {
        setBackendStatus("waking");
      }
    };

    // Initial check
    checkHealth();

    // Poll every 5s if not ready
    pollInterval = setInterval(checkHealth, 5000);

    // Countdown logic
    countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  const getVietnameseErrorMessage = (error: any): string => {
    // Network / timeout / no response errors
    if (!error.response && !error.status) {
      if (
        error.code === "NETWORK_ERROR" ||
        error.message?.includes("timeout")
      ) {
        return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.";
      }
      return "Hệ thống đang khởi động, vui lòng chờ trong giây lát...";
    }

    // HTTP errors
    const status = error.response?.status ?? error.status;
    switch (status) {
      case 401:
        return "Email hoặc mật khẩu không đúng.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
      default:
        return "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
    }
  };

  const handleLoginWithRetry = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    const maxRetries = 4;
    const retryDelay = 2500; // 2.5 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const success = await login(email, password);
        if (success) return true;

        // If login returns false, it's a credential error - don't retry
        return false;
      } catch (err: any) {
        // If we have a response (HTTP error), don't retry
        if (err.response) {
          throw err;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw err;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await handleLoginWithRetry(email, password);
      if (!success) {
        setError("Email hoặc mật khẩu không đúng.");
      }
    } catch (err: any) {
      const vietnameseError = getVietnameseErrorMessage(err);
      setError(vietnameseError);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <Background />
      {/* Gradient Overlay */}
      <div className="absolute inset-0" />

      {/* Floating Sakura Petals */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl animate-sakura-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-30 + Math.random() * 20}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          >
            🌸
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in-scale">
          <h1 className="hero-text-glow text-5xl sm:text-6xl lg:text-7xl text-white mb-4">
            🐾 猫日本語 🐾
          </h1>
          <p className="hero-text-glow text-3xl sm:text-4xl text-white">
            にゃんこログイン
          </p>
        </div>

        {/* Backend Status Warning */}
        {backendStatus === "waking" && (
          <div className="w-full max-w-sm mb-6 animate-fade-in">
            <div className="bg-yellow-100/80 backdrop-blur-md border-2 border-yellow-400 rounded-2xl p-4 text-center shadow-lg">
              <p className="text-yellow-800 font-bold mb-1">
                🐱 Mèo đang gọi máy chủ thức dậy...
              </p>
              <p className="text-yellow-700 text-sm">
                Hệ thống đang khởi động, vui lòng chờ mèo một xíu nhé! ({countdown}s)
              </p>
            </div>
          </div>
        )}

        {backendStatus === "ready" && countdown < 48 && (
          <div className="w-full max-w-sm mb-6 animate-fade-in">
            <div className="bg-green-100/80 backdrop-blur-md border-2 border-green-400 rounded-2xl p-4 text-center shadow-lg">
              <p className="text-green-800 font-bold">
                ✨ Máy chủ đã sẵn sàng! Meow!
              </p>
            </div>
          </div>
        )}

        {/* Bouncing Neko */}
        <div className="mb-8 animate-bounce-gentle">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
            <div className="glowing-gradient-aura"></div>
            <div className="spinning-gradient-blur"></div>
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <ImageWithFallback
                src="https://ih1.redbubble.net/image.5481873298.3314/st,small,507x507-pad,600x600,f8f8f8.jpg"
                alt="Neko Nihongo"
                className="profile-avatar-effect"
              />
            </div>
            <div className="pulsing-pink-ring"></div>
          </div>
        </div>

        {/* Login Form */}

        <div className="w-full max-w-md animate-slide-up">
          <div className="relative">
            <div className="halo-glow-neko"></div>
            <div className="glass-panel-card">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block mb-2 text-gray-700">
                    <span className="mr-2 text-xl">Email</span> 📧
                  </label>
                  <input
                    type="email"
                    value={email}
                    placeholder="admin@neko.jp"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className={`input-neko-focus ${error ? "input-shake" : ""}`}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700">
                    <span className="mr-2 text-xl">Password</span> 🔐
                  </label>
                  <input
                    type="password"
                    value={password}
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className={`input-neko-focus ${error ? "input-shake" : ""}`}
                  />
                </div>

                {error && (
                  <div className="text-center animate-scale-in">
                    <p className="alert-error-neko">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-gradient-neko"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? (
                      <>
                        Đang đăng nhập...{" "}
                        <span className="animate-spin text-2xl">🐱</span>
                      </>
                    ) : (
                      <>
                        ĐĂNG NHẬP <span className="text-3xl">🐾</span>
                      </>
                    )}
                  </span>
                  <div className="full-hover-gradient-overlay"></div>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <style>{`
      .full-hover-gradient-overlay {
  /* absolute */
  position: absolute;
  
  /* inset-0 */
  top: 0;
  right: 0;
  bottom: 0;
  left: 0; /* Bao phủ hoàn toàn phần tử cha */
  
  /* bg-linear-to-r from-purple-600 to-pink-600 */
  background-image: linear-gradient(to right, #9333ea, #db2777);
  /* Purple-600: #9333ea, Pink-600: #db2777 */
  
  /* opacity-0 */
  opacity: 0;
  
  /* transition-opacity duration-300 */
  transition: opacity 300ms ease-in-out;
}

/* group-hover:opacity-100 (Áp dụng khi di chuột qua phần tử cha có class 'group') */
.group:hover .full-hover-gradient-overlay {
  opacity: 1;
}
      .glass-panel-card {
  /* relative */
  position: relative;
  
  /* bg-white */
  background-color: #ffffff; /* Nền trắng (Tailwind mặc định sẽ không có opacity) */
  /* Nếu bạn muốn hiệu ứng mờ (glass effect) rõ ràng, bạn nên dùng bg-white/opacity, 
     nhưng theo yêu cầu thì giữ nguyên #ffffff cho bg-white. */
  
  /* rounded-[32px] */
  border-radius: 2rem; /* 32px (Ưu tiên giá trị tùy chỉnh này) */
  
  /* backdrop-blur-2xl */
  backdrop-filter: blur(40px); 
  
  /* p-8 */
  padding: 2rem; /* 32px */
  
  /* shadow-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
  
  /* border-4 */
  border-width: 4px; 
  
  /* border-white/50 */
  border-color: rgba(255, 255, 255, 0.5); /* Viền trắng mờ 50% */
}

/* Thiết lập cho màn hình nhỏ (sm) - min-width: 640px */
@media (min-width: 640px) {
  .glass-panel-card {
    /* sm:p-10 */
    padding: 2.5rem; /* 40px */
  }
}
      .pulsing-pink-ring {
  /* absolute */
  position: absolute;
  
  /* inset-0 */
  top: 0;
  right: 0;
  bottom: 0;
  left: 0; /* Bao phủ hoàn toàn phần tử cha */
  
  /* rounded-full */
  border-radius: 9999px; /* Hình tròn */
  
  /* ring-8 ring-pink-400/30 (Sử dụng box-shadow để mô phỏng ring) */
  box-shadow: 0 0 0 8px rgba(244, 114, 182, 0.3);
  /* Ring 8px, màu hồng 400, độ mờ 30% */
  
  /* z-index (Đảm bảo lớp này nằm dưới nội dung chính) */
  z-index: -1; 
  
  /* animate-ping-slow (CSS Tùy chỉnh: Tạo keyframes và áp dụng) */
  /* Sử dụng keyframes 'ping' để phóng to và làm mờ */
  animation: ping-slow 4s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* Keyframes cho hiệu ứng ping-slow */
@keyframes ping-slow {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2); /* Phóng to gấp 2 lần */
    opacity: 0;        /* Làm mờ hoàn toàn */
  }
}
      .profile-avatar-effect {
  /* w-28, h-28 */
  width: 7rem;  /* 112px */
  height: 7rem; /* 112px */
  
  /* rounded-full */
  border-radius: 9999px;
  
  /* object-cover */
  object-fit: cover; /* Đảm bảo hình ảnh bao phủ hết container */
  
  /* shadow-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* border-6 border-white/95 */
  border-width: 6px;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.95); /* Viền trắng dày */
  
  /* ring-4 ring-pink-300/60 (Sử dụng box-shadow để mô phỏng ring) */
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25), /* Shadow-2xl */
    0 0 0 4px rgba(249, 168, 212, 0.6);   /* Ring 4px, màu hồng nhạt mờ */

  /* transition-all duration-500 */
  transition: all 500ms ease-in-out; 
}

/* Kích thước cho màn hình nhỏ (sm) - min-width: 640px */
@media (min-width: 640px) {
  .profile-avatar-effect {
    /* sm:w-36, sm:h-36 */
    width: 9rem;  /* 144px */
    height: 9rem; /* 144px */
  }
}

/* Các hiệu ứng hover */
.profile-avatar-effect:hover {
  /* hover:ring-pink-400/90 (Thay đổi lớp ring hiện tại) */
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25), /* Shadow-2xl giữ nguyên */
    0 0 0 4px rgba(244, 114, 182, 0.9);   /* Ring 4px, màu hồng đậm hơn và rõ hơn */
    
  /* hover:scale-110 */
  transform: scale(1.1) rotate(-6deg); 
  
  /* hover:-rotate-6 */
  /* transform: rotate(-6deg); đã được gộp vào transform: scale(1.1) ở trên */
}
      .spinning-gradient-blur {
  /* absolute */
  position: absolute;
  
  /* inset-2 */
  top: 0.5rem;    /* 8px */
  right: 0.5rem;  /* 8px */
  bottom: 0.5rem; /* 8px */
  left: 0.5rem;   /* 8px */
  /* Tạo viền đệm 8px bên trong phần tử cha */
  
  /* rounded-full */
  border-radius: 9999px; /* Hình tròn */
  
  /* bg-linear-to-br from-pink-300 to-purple-400 */
  background-image: linear-gradient(to bottom right, #f9a8d4, #c084fc);
  /* Pink-300: #f9a8d4, Purple-400: #c084fc */
  
  /* blur-xl */
  filter: blur(20px); 
  
  /* opacity-50 */
  opacity: 0.5;
  
  /* z-index (Thường cần thiết để đặt phía sau) */
  z-index: -1; 
  
  /* animate-spin-slow (CSS Tùy chỉnh: Tạo keyframes và áp dụng) */
  animation: spin-slow 8s linear infinite; /* Tốc độ xoay chậm hơn */
}

/* Keyframes cho hiệu ứng spin-slow */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
      .glowing-gradient-aura {
  /* absolute */
  position: absolute;
  
  /* inset-0 */
  top: 0;
  right: 0;
  bottom: 0;
  left: 0; /* Bao phủ hoàn toàn phần tử cha */
  
  /* rounded-full */
  border-radius: 9999px; /* Hình tròn */
  
  /* bg-linear-to-br from-pink-400 via-purple-400 to-indigo-500 */
  background-image: linear-gradient(to bottom right, #f472b6, #c084fc, #6366f1);
  /* Pink-400: #f472b6, Purple-400: #c084fc, Indigo-500: #6366f1 */
  
  /* blur-3xl */
  filter: blur(48px); /* Làm mờ rất mạnh */
  
  /* opacity-60 */
  opacity: 0.6;
  
  /* z-index (Thường cần thiết để đặt phía sau) */
  z-index: -1; 
  
  /* animate-pulse-slow (CSS Tùy chỉnh: Tạo keyframes và áp dụng) */
  animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Keyframes cho hiệu ứng pulse-slow (giảm/tăng độ mờ chậm) */
@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.4;
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

        @keyframes scroll-bg {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100vw); }
        }

        .animate-scroll-bg {
          animation: scroll-bg 30s linear infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        @keyframes fade-in-scale {
          0% { 
            opacity: 0;
            transform: scale(0);
          }
          100% { 
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.8s ease-out;
        }

        @keyframes slide-up {
          0% { 
            opacity: 0;
            transform: translateY(50px);
          }
          100% { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.3s both;
        }

        @keyframes scale-in {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        @keyframes sakura-fall {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
          }
          100% {
            transform: translateY(100vh) rotate(360deg) translateX(50px);
          }
        }

        .animate-sakura-fall {
          animation: sakura-fall 10s linear infinite;
        }

        @keyframes wiggle-1 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-15deg); }
        }

        .animate-wiggle-1 {
          animation: wiggle-1 2s ease-in-out infinite;
        }

        @keyframes wiggle-2 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }

        .animate-wiggle-2 {
          animation: wiggle-2 2s ease-in-out infinite 0.5s;
        }

        @keyframes wiggle-3 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }

        .animate-wiggle-3 {
          animation: wiggle-3 2s ease-in-out infinite 1s;
        }

        @keyframes wiggle-4 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-15deg); }
        }

        .animate-wiggle-4 {
          animation: wiggle-4 2s ease-in-out infinite 1.5s;
        }

        @keyframes confetti {
          0% {
            transform: translate(0, 0) scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(var(--confetti-x), calc(var(--confetti-y) / 2)) scale(1) rotate(calc(var(--confetti-rotate) / 2));
            opacity: 1;
          }
          100% {
            transform: translate(var(--confetti-x), var(--confetti-y)) scale(0.8) rotate(var(--confetti-rotate));
            opacity: 0;
          }
        }

        .animate-confetti {
          animation: confetti 2.5s ease-out forwards;
        }

        input::placeholder {
          color: #d8b4d8;
        }

        input:focus {
          transform: translateY(-2px);
        }

        /* Paw cursor effect */
        button:hover {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23ff69b4"><text y="20" font-size="20">🐾</text></svg>') 12 12, pointer;
        }
        .input-neko-focus {
    /* Trạng thái mặc định */
    width: 100%;
    padding: 1.5rem 1.5rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border: 4px solid #FBB6CE;                    /* border-pink-300 */
    color: #1F2937;
    font-size: 1.125rem;
    font-weight: 600;
    outline: none;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 10px 25px -5px rgba(236, 72, 153, 0.15);
  }

  .input-neko-focus::placeholder {
    color: rgba(168, 85, 247, 0.6);               /* tím nhạt cho placeholder */
  }

  /* KHI FOCUS – ĐẸP NHƯ ƯỚC MƠ */
  .input-neko-focus:focus {
    border-color: #A855F7;                        /* border-purple-500 */
    box-shadow: 
      0 0 0 4px rgba(168, 85, 247, 0.3),          /* focus:ring-4 + focus:ring-purple-200 */
      0 20px 40px -10px rgba(168, 85, 247, 0.35);
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 1);
  }

  /* Hiệu ứng khi đã nhập chữ (không còn placeholder) */
  .input-neko-focus:not(:placeholder-shown) {
    border-color: #F472B6;                        /* hồng đậm hơn một chút */
  }

  /* Optional: rung nhẹ khi sai */
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
  .input-shake {
    animation: shake 0.5s ease-in-out;
    border-color: #EF4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3) !important;
  }

  .alert-error-neko {
    color: #EF4444;                    /* text-red-500 */
    background-color: #FEE2E2;         /* bg-red-100 */
    border: 3px solid #FCA5A5;         /* viền đỏ hồng cute thêm */
    border-radius: 1rem;               /* rounded-2xl */
    padding: 1rem 1.5rem;              /* px-6 py-4 → mình làm to hơn tí cho dễ đọc */
    font-weight: 700;
    font-size: 1.1rem;
    text-align: center;
    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.25);
    backdrop-filter: blur(10px);
    animation: shake 0.6s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    max-width: 420px;
    margin: 1rem auto;
  }

  /* Icon cảnh báo (tùy chọn thêm) */
  .alert-error-neko::before {
    content: "Warning";
    font-size: 1.8rem;
  }

  /* Animation shake siêu mượt + rung mạnh hơn */
  @keyframes shake {
    0%, 100%   { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-12px); }
    20%, 40%, 60%, 80%      { transform: translateX(12px); }
  }

  /* Khi hover → rung thêm lần nữa (cực kỳ cute) */
  .alert-error-neko:hover {
    animation: shake 0.8s ease-in-out;
    background-color: #FECACA;   /* đỏ nhạt hơn khi hover */
  }

  .btn-gradient-neko {
    /* Kích thước & layout */
    width: 100%;
    padding-top: 1.25rem;      /* py-5 */
    padding-bottom: 1.25rem;
    border-radius: 1rem;       /* rounded-2xl */
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: 0.5px;
    text-align: center;

    /* Gradient chính xác như Tailwind */
    background: linear-gradient(to right, #ec4899, #a855f7, #ec4899); /* from-pink-500 → via-purple-500 → to-pink-500 */
    color: white;
    border: none;
    cursor: pointer;

    /* Bóng đổ */
    box-shadow: 0 10px 25px -5px rgba(236, 72, 153, 0.4),
                0 20px 40px -12px rgba(168, 85, 247, 0.35);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

    /* Hiệu ứng hover */
    &:hover {
      box-shadow: 0 25px 50px -12px rgba(236, 72, 153, 0.5),
                  0 35px 60px -15px rgba(168, 85, 247, 0.45);
      transform: scale(1.05);
    }

    /* Hiệu ứng click */
    &:active {
      transform: scale(0.95);
    }

    /* Hiệu ứng sóng lấp lánh khi hover (cực kỳ kawaii max level) */
    position: relative;
    overflow: hidden;
  }

  .btn-gradient-neko::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.7s;
  }

  .btn-gradient-neko:hover::before {
    left: 100%;
  }

  /* Icon hoặc text bên trong vẫn căn giữa đẹp */
  .btn-gradient-neko > * {
    position: relative;
    z-index: 10;
  }
  
  .halo-glow-neko {
    /* Đè ra ngoài phần tử cha 1px mỗi cạnh → tạo hiệu ứng viền phát sáng */
    position: absolute;
    inset: -1px;                     /* -inset-1 = top:-1px right:-1px bottom:-1px left:-1px */

    /* Gradient siêu rực */
    background: linear-gradient(
      to right,
      #ec4899 0%,      /* from-pink-500 */
      #a855f7 50%,     /* via-purple-500 */
      #06b6d4 100%     /* to-cyan-500 */
    );

    border-radius: 1.5rem;           /* rounded-3xl */
    filter: blur(20px);              /* blur-xl */
    opacity: 0.75;

    /* Hiệu ứng nhấp nháy nhẹ nhàng */
    animation: pulseGlow 3s ease-in-out infinite;
    z-index: -1;                     /* luôn nằm dưới nội dung chính */
  }

  /* Pulse mượt hơn + sáng tối nhịp nhàng */
  @keyframes pulseGlow {
    0%, 100% {
      opacity: 0.65;
      transform: scale(1);
    }
    50% {
      opacity: 0.9;
      transform: scale(1.05);
    }
  }

  /* Khi hover lên phần tử cha → sáng bùng lên luôn! */
  .group:hover .halo-glow-neko {
    opacity: 1;
    filter: blur(24px);
    animation-duration: 1.5s;
  }
    
      `}</style>
    </div>
  );
}
