import {
  BookOpen,
  FileText,
  Languages,
  CreditCard,
  ClipboardCheck,
  Type,
} from "lucide-react";
interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="subtle-gradient-background">
      {/* Features Section */}
      <section className="container animate-fade-in mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Hiragana/Katakana Card */}
          <button
            onClick={() => onNavigate("hirakata-selector")}
            className="interactive-elevated-card"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="triple-gradient-bouncing-circle">
                <Type className="w-10 h-10 text-white" />
              </div>
              <h3 className="responsive-gray-text">Bảng Chữ Cái</h3>
              <p className="responsive-text-caption">
                Học Hiragana & Katakana - Nền tảng tiếng Nhật
              </p>
              <div className="flex gap-2 pt-2">
                <span className="text-2xl animate-wiggle delay-3">🃏</span>
                <span className="text-2xl">✨</span>
              </div>
            </div>
          </button>

          {/* Vocabulary Card */}
          <button
            onClick={() => onNavigate("vocabulary-selector")}
            className="interactive-elevated-card"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="pulsing-gradient-circle">
                <Languages className="w-10 h-10 text-white" />
              </div>
              <h3 className="responsive-gray-text">Từ Vựng</h3>
              <p className="responsive-text-caption">
                Học từ vựng tiếng Nhật cơ bản
              </p>
              <div className="flex gap-2 pt-2">
                <span className="text-2xl animate-wiggle">😺</span>
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </button>

          {/* Grammar Card */}
          <button
            onClick={() => onNavigate("grammar-selector")}
            className="interactive-elevated-card"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="subtle-bouncing-gradient-circle">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="responsive-gray-text">Ngữ Pháp</h3>
              <p className="responsive-text-caption">
                Khám phá cấu trúc câu và ngữ pháp tiếng Nhật một cách dễ hiểu
              </p>
              <div className="flex gap-2 pt-2">
                <span className="text-2xl animate-wiggle delay-1">🤓</span>
                <span className="text-2xl">📖</span>
              </div>
            </div>
          </button>

          {/* Kanji Card */}
          <button
            onClick={() => onNavigate("kanji-selector")}
            className="interactive-elevated-card"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bouncing-gradient-circle-alt">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="responsive-gray-text">Kanji</h3>
              <p className="responsive-text-caption">
                Học chữ Kanji với ý nghĩa và cách đọc On-Kun chi tiết
              </p>
              <div className="flex gap-2 pt-2">
                <span className="text-2xl animate-wiggle delay-2">✍️</span>
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </button>

          {/* Exercise Card */}
          <button
            onClick={() => onNavigate("exercise-selector")}
            className="interactive-elevated-card"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="triple-gradient-bouncing-circle-v2">
                <ClipboardCheck className="w-10 h-10 text-white" />
              </div>
              <h3 className="responsive-gray-text">Bài Tập</h3>
              <p className="responsive-text-caption">
                Làm bài tập trắc nghiệm để kiểm tra kiến thức của bạn
              </p>
              <div className="flex gap-2 pt-2">
                <span className="text-2xl animate-wiggle delay-4">📝</span>
                <span className="text-2xl">💯</span>
              </div>
            </div>
          </button>
        </div>
      </section>
      {/* Floating Cat Animation */}
      <div className="fixed bottom-10 right-10 pointer-events-none z-50 hidden lg:block">
        <img
          src="https://i.pinimg.com/1200x/8c/98/00/8c9800bb4841e7daa0a3db5f7db8a4b7.jpg"
          alt="Flying Neko"
          className="w-40 h-40 
               sm:w-24 sm:h-24 
               md:w-28 md:h-28 
               lg:w-32 lg:h-32 
               xl:w-36 xl:h-36 
               rounded-full object-cover 
               shadow-2xl 
               animate-fly 
               drop-shadow-2xl"
          style={{
            filter: "drop-shadow(0 10px 20px rgba(255, 182, 233, 0.4))",
          }}
        />
      </div>
      <style>{`
      .triple-gradient-bouncing-circle-v2 {
  /* w-20 h-20 */
  width: 5rem; /* 80px */
  height: 5rem; /* 80px */
  
  /* rounded-full */
  border-radius: 9999px; /* Hình tròn */
  
  /* bg-gradient-to-br from-[#D8C8FF] via-[#FFC7EA] to-[#FFF6E9] */
  background-image: linear-gradient(to bottom right, #D8C8FF, #FFC7EA, #FFF6E9);
  /* Tím nhạt -> Hồng nhạt -> Kem nhạt */
  
  /* flex items-center justify-center */
  display: flex;
  align-items: center; /* Căn giữa dọc */
  justify-content: center; /* Căn giữa ngang */
  
  /* transition (Thêm vào để hiệu ứng tắt/bật animation mượt mà hơn) */
  transition: transform 0.5s;
}

/* Keyframes cho hiệu ứng bounce-subtle (nhảy nhẹ và chậm) */
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5%); /* Nhảy lên 5% */
  }
}

/* group-hover:animate-bounce-subtle */
/* Áp dụng animation khi di chuột qua phần tử cha có class 'group' */
.group:hover .triple-gradient-bouncing-circle-v2 {
  animation: bounce-subtle 1.5s infinite; /* Animation chậm 1.5s và lặp lại */
}
      
      .triple-gradient-bouncing-circle {
  /* w-20 h-20 */
  width: 5rem; /* 80px */
  height: 5rem; /* 80px */
  
  /* rounded-full */
  border-radius: 9999px; /* Hình tròn */
  
  /* bg-gradient-to-br from-[#FFC7EA] via-[#D8C8FF] to-[#C7FFF1] */
  background-image: linear-gradient(to bottom right, #FFC7EA, #D8C8FF, #C7FFF1);
  /* Hồng nhạt -> Tím nhạt -> Xanh ngọc nhạt */
  
  /* flex items-center justify-center */
  display: flex;
  align-items: center; /* Căn giữa dọc */
  justify-content: center; /* Căn giữa ngang */
  
  /* transition (Thêm vào để hiệu ứng tắt/bật animation mượt mà hơn) */
  transition: transform 0.5s;
}

/* Keyframes cho hiệu ứng bounce-subtle (nhảy nhẹ và chậm) */
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5%); /* Nhảy lên 5% */
  }
}

/* group-hover:animate-bounce-subtle */
/* Áp dụng animation khi di chuột qua phần tử cha có class 'group' */
.group:hover .triple-gradient-bouncing-circle {
  animation: bounce-subtle 1.5s infinite; /* Animation chậm 1.5s và lặp lại */
}

.interactive-elevated-card {
  /* group */
  /* Lớp đánh dấu cho phần tử cha, không có thuộc tính CSS trực tiếp. */

  /* rounded-[32px] */
  border-radius: 2rem; /* 32px */
  
  /* p-6 */
  padding: 1.5rem; /* 24px */
  
  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); 
  
  /* transform (Thiết lập trạng thái mặc định: không có dịch chuyển, scale 1) */
  transform: translateY(0) scale(1);
  
  /* transition-all duration-300 */
  transition: all 300ms ease-in-out; 
  
  /* cursor-pointer */
  cursor: pointer;
}

/* Kích thước đệm cho màn hình nhỏ (sm) - min-width: 640px */
@media (min-width: 640px) {
  .interactive-elevated-card {
    /* sm:p-8 */
    padding: 2rem; /* 32px */
  }
}

/* Các hiệu ứng hover */
.interactive-elevated-card:hover {
  /* hover:shadow-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* hover:scale-105 và hover:-translate-y-2 */
  /* Gộp cả hai biến đổi vào thuộc tính transform */
  transform: translateY(-0.5rem) scale(1.05); /* -translate-y-2 = -0.5rem (8px) */
}
      .bouncing-gradient-circle-alt {
  /* w-20 h-20 */
  width: 5rem; /* 80px */
  height: 5rem; /* 80px */
  
  /* rounded-full */
  border-radius: 9999px; /* Hình tròn */
  
  /* bg-gradient-to-br from-[#C7FFF1] to-[#FFC7EA] */
  background-image: linear-gradient(to bottom right, #C7FFF1, #FFC7EA);
  /* Xanh ngọc nhạt sang Hồng nhạt */
  
  /* flex items-center justify-center */
  display: flex;
  align-items: center; /* Căn giữa dọc */
  justify-content: center; /* Căn giữa ngang */
  
  /* transition (Thêm vào để hiệu ứng tắt/bật animation mượt mà hơn) */
  transition: transform 0.5s;
}

/* Keyframes cho hiệu ứng bounce-subtle (nhảy nhẹ và chậm) */
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5%); /* Nhảy lên 5% */
  }
}

/* group-hover:animate-bounce-subtle */
/* Áp dụng animation khi di chuột qua phần tử cha có class 'group' */
.group:hover .bouncing-gradient-circle-alt {
  animation: bounce-subtle 1.5s infinite; /* Animation chậm 1.5s và lặp lại */
}
      .interactive-elevated-card {
  /* group */
  /* Lớp đánh dấu cho phần tử cha, không có thuộc tính CSS trực tiếp. */
  
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8); /* Nền trắng mờ 80% */
  
  /* rounded-[32px] */
  border-radius: 2rem; /* 32px */
  
  /* p-6 */
  padding: 1.5rem; /* 24px */
  
  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); 
  
  /* transform (Chỉ định transform để transition hoạt động) */
  /* Thiết lập trạng thái mặc định: không có dịch chuyển, scale 1 */
  transform: translateY(0) scale(1);
  
  /* transition-all duration-300 */
  transition: all 300ms ease-in-out; 
  
  /* cursor-pointer */
  cursor: pointer;
}

/* Kích thước đệm cho màn hình nhỏ (sm) - min-width: 640px */
@media (min-width: 640px) {
  .interactive-elevated-card {
    /* sm:p-8 */
    padding: 2rem; /* 32px */
  }
}

/* Các hiệu ứng hover */
.interactive-elevated-card:hover {
  /* hover:shadow-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* hover:scale-105 và hover:-translate-y-2 */
  /* Gộp cả hai biến đổi vào thuộc tính transform */
  transform: translateY(-0.5rem) scale(1.05); /* -translate-y-2 = -0.5rem (8px) */
}
      .interactive-elevated-card {
  /* group */
  /* Lớp đánh dấu cho phần tử cha, không có thuộc tính CSS trực tiếp. */
  
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8); /* Nền trắng mờ 80% */
  
  /* rounded-[32px] */
  border-radius: 2rem; /* 32px */
  
  /* p-6 */
  padding: 1.5rem; /* 24px */
  
  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); 
  
  /* transform (Chỉ định transform để transition hoạt động) */
  transform: translate(0, 0) scale(1);
  
  /* transition-all duration-300 */
  transition: all 300ms ease-in-out; 
  
  /* cursor-pointer */
  cursor: pointer;
}

/* Kích thước đệm cho màn hình nhỏ (sm) - min-width: 640px */
@media (min-width: 640px) {
  .interactive-elevated-card {
    /* sm:p-8 */
    padding: 2rem; /* 32px */
  }
}

/* Các hiệu ứng hover */
.interactive-elevated-card:hover {
  /* hover:shadow-2xl */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* hover:scale-105 và hover:-translate-y-2 */
  /* Gộp cả hai biến đổi vào thuộc tính transform */
  transform: translateY(-0.5rem) scale(1.05); /* -translate-y-2 = -0.5rem (8px) */
}
      .subtle-bouncing-gradient-circle {
  /* w-20 h-20 */
  width: 5rem; /* 80px */
  height: 5rem; /* 80px */
  
  /* rounded-full */
  border-radius: 9999px; /* Hình tròn */
  
  /* bg-gradient-to-br from-[#D8C8FF] to-[#C7FFF1] */
  background-image: linear-gradient(to bottom right, #D8C8FF, #C7FFF1);
  /* Tím nhạt sang Xanh ngọc nhạt */
  
  /* flex items-center justify-center */
  display: flex;
  align-items: center; /* Căn giữa dọc */
  justify-content: center; /* Căn giữa ngang */
  
  /* transition (Thêm vào để hiệu ứng tắt/bật animation mượt mà hơn) */
  transition: transform 0.5s;
}

/* Keyframes cho hiệu ứng bounce-subtle (nhảy nhẹ và chậm) */
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5%); /* Nhảy lên 5% */
  }
}

/* group-hover:animate-bounce-subtle */
/* Áp dụng animation khi di chuột qua phần tử cha có class 'group' */
.group:hover .subtle-bouncing-gradient-circle {
  animation: bounce-subtle 1.5s infinite; /* Animation chậm 1.5s và lặp lại */
}
      .responsive-text-caption {
  /* text-sm */
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem; /* 20px */
  
  /* text-gray-600 */
  color: #4b5563; 
}

/* Kích thước cho màn hình nhỏ (sm) - min-width: 640px */
@media (min-width: 640px) {
  .responsive-text-caption {
    /* sm:text-base */
    font-size: 1rem; /* 16px */
    line-height: 1.5rem; /* 24px */
  }
}
      .responsive-gray-text {
  /* text-xl */
  font-size: 1.25rem; /* 20px */
  line-height: 1.75rem; /* 28px */
  
  /* text-gray-800 */
  color: #1f2937; 
}

/* Kích thước cho màn hình nhỏ (sm) - min-width: 640px */
@media (min-width: 640px) {
  .responsive-gray-text {
    /* sm:text-2xl */
    font-size: 1.5rem; /* 24px */
    line-height: 2rem; /* 32px */
  }
}
      .pulsing-gradient-circle {
  /* w-20 h-20 */
  width: 5rem; /* 80px */
  height: 5rem; /* 80px */
  
  /* rounded-full */
  border-radius: 9999px; /* Hình tròn */
  
  /* bg-gradient-to-br from-[#FFC7EA] to-[#D8C8FF] */
  background-image: linear-gradient(to bottom right, #FFC7EA, #D8C8FF);
  
  /* flex items-center justify-center */
  display: flex;
  align-items: center; /* Căn giữa dọc */
  justify-content: center; /* Căn giữa ngang */
  
  /* transition (Thêm vào để hiệu ứng tắt/bật animation mượt mà hơn) */
  transition: transform 0.5s;
}

/* Keyframes cho hiệu ứng bounce-subtle (nhảy nhẹ và chậm) */
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5%); /* Nhảy lên 5% */
  }
}
/* group-hover:animate-bounce-subtle */
/* Áp dụng animation khi di chuột qua phần tử cha có class 'group' */
.group:hover .pulsing-gradient-circle {
  animation: bounce-subtle 1.5s infinite; /* Animation chậm 1.5s và lặp lại */
}
.subtle-gradient-background {
  /* min-h-screen */
  min-height: 100vh; /* Chiều cao tối thiểu bằng chiều cao của viewport */

  background-attachment: fixed; /* (Thường được thêm vào để gradient toàn màn hình mượt mà) */
}
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes fly {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-50px, -30px); }
          50% { transform: translate(-100px, 0); }
          75% { transform: translate(-50px, 30px); }
          100% { transform: translate(0, 0); }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        @keyframes sakura-fall {
          0% { transform: translateY(-20px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }

        @keyframes sparkle {
          0%, 100% { transform: translateY(0px); opacity: 0.5; }
          50% { transform: translateY(-5px); opacity: 1; }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }

        .animate-fly {
          animation: fly 10s ease-in-out infinite;
        }

        .animate-wiggle {
          animation: wiggle 1.5s ease-in-out infinite;
        }

        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }

        .delay-1 {
          animation-delay: 0.3s;
        }

        .delay-2 {
          animation-delay: 0.6s;
        }

        .delay-3 {
          animation-delay: 0.9s;
        }

        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }

        .animate-sakura-fall {
          animation: sakura-fall 3s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
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
      `}</style>
    </div>
  );
}
