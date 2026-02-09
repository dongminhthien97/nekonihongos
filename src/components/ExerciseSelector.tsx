// src/components/ExerciseSelector.tsx
import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

interface Category {
  id: number;
  name: string; // "VOCABULARY", "GRAMMAR", "KANJI"
  displayName: string;
  description: string;
}

interface Level {
  id: number;
  level: string; // "N5", "N4", "N3", "N2", "N1"
  displayName: string;
}

export function ExerciseSelector({
  onNavigate,
}: {
  onNavigate: (
    page: string,
    params?: { category?: string; level?: string },
  ) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  // Lấy data từ DB
  useEffect(() => {
    const fetchData = async () => {
      try {
        // BềEsetIsLoading(true) →không cần loading nữa
        const [catRes, levelRes] = await Promise.all([
          api.get("/categories"),
          api.get("/levels"),
        ]);

        setCategories(catRes.data);

        // Sắp xếp N5 →N1 (giảm dần)
        setLevels(
          levelRes.data.sort((a: Level, b: Level) =>
            b.level.localeCompare(a.level),
          ),
        );
      } catch (err) {
        toast.error("Không tải được dữ liệu. Mèo đang sửa đây... 😿");
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleLevelSelect = (level: Level) => {
    if (!selectedCategory) return;

    const catName = selectedCategory.name.toLowerCase(); // "vocabulary", "grammar", "kanji"
    const levelName = level.level.toLowerCase(); // "n5", "n4", ...

    const isAvailable =
      (catName === "vocabulary" && levelName === "n5") ||
      (catName === "grammar" && levelName === "n5") ||
      (catName === "kanji" && levelName === "n5");

    if (isAvailable) {
      onNavigate("exercise", { category: catName, level: levelName });
    } else {
      toast("Bài tập này sẽ sớm ra mắt nhé! Mèo đang chuẩn bị rất kỹ đây 😺", {
        icon: "⏳",
        duration: 1000,
      });
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };
  return (
  <div className="min-h-screen relative">
    <main className="relative z-10 container mx-auto px-4 py-16 md:py-24 animate-fade-in">
      <div className="text-center mb-16 md:mb-24">
        <h1 className="hero-section-title hero-text-glow">
          {!selectedCategory
            ? "Chọn loại bài tập"
            : `Bài tập ${selectedCategory.displayName}`}
        </h1>
        <p className="lead-text">
          {!selectedCategory
            ? "Mèo đã chuẩn bị sẵn các loại bài tập siêu hay cho bạn rồi!"
            : "Chọn cấp độ JLPT bạn muốn luyện tập nhé!"}
        </p>
      </div>

      {!selectedCategory && (
        <div className="grid-container">
          {categories.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat)}
              className="glass-card group"
              style={{ animationDelay: `${0.3 + index * 0.2}s` }}
            >
              <div
                className={`gradient-overlay ${
                  cat.name === "VOCABULARY"
                    ? "rainbow-gradient"
                    : cat.name === "GRAMMAR"
                      ? "ocean-gradient"
                      : "nature-gradient"
                }`}
              />
              <div className="subtle-overlay">
                <div className="glow-orb orb-top" />
                <div className="glow-orb orb-bottom" />
              </div>

              <div className="relative z-10 p-10 md:p-16 text-center">
                <div className="hero-text group-hover:scale-110 transition-transform duration-500">
                  {cat.name === "VOCABULARY"
                    ? "📘"
                    : cat.name === "GRAMMAR"
                      ? "✍️"
                      : "🌿"}
                </div>

                <h2 className="card-title">{cat.displayName}</h2>
                <p className="card-subtitle">Học theo cấp độ JLPT</p>
                <p className="card-description">{cat.description}</p>

                <div className="flex-container">
                  <span>Bấm để chọn</span>
                  <span className="moving-icon">→</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedCategory && (
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleBack}
            className="glass-button"
          >
            <span className="text-2xl group-hover:-translate-x-2 transition-transform">
              ←
            </span>
            <span>Quay lại chọn loại</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {levels.map((level, index) => {
              const catName = selectedCategory.name.toLowerCase();
              const levelName = level.level.toLowerCase();
              const isAvailable =
                (catName === "vocabulary" && levelName === "n5") ||
                (catName === "grammar" && levelName === "n5") ||
                (catName === "kanji" && levelName === "n5");

              return (
                <button
                  key={level.id}
                  onClick={() => isAvailable && handleLevelSelect(level)}
                  disabled={!isAvailable}
                  className={`glass-card relative overflow-hidden transition-all duration-500 ${
                    isAvailable
                      ? "hover:scale-105 cursor-pointer"
                      : "opacity-70 cursor-not-allowed"
                  }`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="relative z-10 p-8 text-center">
                    <div className="text-6xl mb-4">
                      {isAvailable ? "✨" : "⏳"}
                    </div>
                    <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                      {level.displayName}
                    </h3>
                    <p className="text-xl text-white/90 mb-6">
                      {level.level === "N5"
                        ? "Cơ bản nhất"
                        : level.level === "N4"
                          ? "Nâng tầm"
                          : level.level === "N3"
                            ? "Trung cấp"
                            : level.level === "N2"
                              ? "Nâng cao"
                              : "Thành thạo"}
                    </p>
                    <div className="text-lg font-bold text-white">
                      {isAvailable ? "Bắt đầu ngay →" : "Sắp ra mắt..."}
                    </div>
                  </div>

                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20">
                      <p className="text-2xl text-white font-bold animate-pulse">
                        Coming Soon
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className="footer-container text-center"
        style={{ animationDelay: "0.8s" }}
      >
        <p className="accent-text">
          Dù bạn chọn loại bài nào, mèo cũng sẽ đồng hành cùng bạn tới cùng nhé!
        </p>
        <div className="bouncing-icon">🐾</div>
      </div>
    </main>
<style>{`
      /* Dải màu cho Vocabulary */
.rainbow-gradient {
  background: linear-gradient(135deg, #f472b6, #a855f7); /* Pink to Purple */
}

/* Dải màu cho Grammar */
.ocean-gradient {
  background: linear-gradient(135deg, #60a5fa, #06b6d4); /* Blue to Cyan */
}

/* Dải màu cho Các mục khác (Ví dụ: Kanji/Listen) */
.nature-gradient {
  background: linear-gradient(135deg, #4ade80, #14b8a6); /* Green to Teal */
}

/* Lớp phủ chung đềEtạo đềEtrong suốt và hiệu ứng kính */
.gradient-overlay {
  position: absolute;
  inset: 0;
  opacity: 0.2; /* ĐềEmềEnhẹ đềEkhông che mất nội dung */
  transition: opacity 0.3s ease;
}

.group:hover .gradient-overlay {
  opacity: 0.4; /* Sáng lên khi di chuột vào thẻ cha */
}
      .glass-button {
  /* Layout & Spacing */
  display: flex;                /* flex */
  align-items: center;          /* items-center */
  gap: 0.5rem;                  /* gap-2 */
  margin-bottom: 3rem;          /* mb-12 (48px) */
  padding: 0.75rem 1.5rem;      /* py-3 px-6 */
  
  /* Style & Shape */
  border-radius: 20px;          /* rounded-[20px] */
  color: rgba(255, 255, 255, 0.9); /* text-white/90 */
  font-weight: 700;
  
  /* Glassmorphism Effect */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  /* Animation */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* transition-all */
  cursor: pointer;
}

/* Hiệu ứng hover cho text và nền */
.glass-button:hover {
  color: #ffffff;               /* hover:text-white */
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}
      .rainbow-gradient {
  /* from-pink-400 (#f472b6) to-purple-500 (#a855f7) */
  background: linear-gradient(135deg, #f472b6, #a855f7);
  
  /* ĐềEáp dụng cho chữ (Text Gradient) */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
      .main-viewport {
  /* min-h-screen: Chiếm toàn bềEchiều cao trình duyệt */
  min-height: 100vh;

  /* flex items-center justify-center: Căn giữa nội dung tuyệt đối */
  display: flex;
  align-items: center;
  justify-content: center;

  /* bg-gradient-to-br from-pink-100 to-purple-100 */
  background: linear-gradient(135deg, #fce4ec, #f3e5f5);

  /* Chống cuộn ngang không mong muốn */
  overflow-x: hidden;
  
  /* Đảm bảo nội dung không bềEdính sát mép trên mobile */
  padding: 1rem;
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
      .grid-container {
  /* max-w-6xl (1152px) */
  max-width: 72rem;
  
  /* mx-auto (Căn giữa toàn bềElưới) */
  margin-left: auto;
  margin-right: auto;

  /* grid grid-cols-1 */
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));

  /* gap-12 (48px) */
  gap: 3rem;
  
  padding: 1rem; /* Padding nhềEđềEkhông bềEdính sát mép màn hình điện thoại */
}

/* lg:grid-cols-3 & lg:gap-20 (Màn hình từ 1024px trềElên) */
@media (min-width: 1024px) {
  .grid-container {
    /* Chia làm 3 cột bằng nhau */
    grid-template-columns: repeat(2, minmax(0, 1fr));
    
    /* gap-20 (80px) */
    gap: 5rem;
  }
}
      .lead-text {
  /* text-xl (20px) */
  font-size: 1.25rem;
  line-height: 1.75rem;

  /* text-white/90 */
  color: rgba(255, 255, 255, 0.9);

  /* font-medium */
  font-weight: 500;

  /* max-w-4xl (896px) */
  max-width: 56rem;

  /* mx-auto (Căn giữa khối văn bản) */
  margin-left: auto;
  margin-right: auto;

  /* Căn giữa nội dung chữ */
  text-align: center;
}

/* md:text-3xl (Màn hình từ 768px trềElên - 30px) */
@media (min-width: 768px) {
  .lead-text {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }
}
      .bouncing-icon {
  /* text-6xl (60px) */
  font-size: 3.75rem;
  line-height: 1;

  /* Cấu hình đềEanimation hoạt động tốt */
  display: inline-block;

  /* animate-bounce */
  animation: bounce 1s infinite;
}

/* md:text-8xl (Màn hình từ 768px trềElên - 96px) */
@media (min-width: 768px) {
  .bouncing-icon {
    font-size: 6rem;
  }
}

/* Định nghĩa Keyframes cho animate-bounce (Chuẩn Tailwind) */
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
  /* text-2xl (24px) */
  font-size: 1.5rem;
  line-height: 2rem;

  /* text-white/90 (ĐềEtrong suốt 90%) */
  color: rgba(255, 255, 255, 0.9);

  /* font-medium */
  font-weight: 500;

  /* mb-6 (24px) */
  margin-bottom: 1.5rem;
}

/* md:text-3xl (Màn hình từ 768px trềElên - 30px) */
@media (min-width: 768px) {
  .accent-text {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }
}

/* md:mt-32 (Màn hình từ 768px trềElên - 128px) */
@media (min-width: 768px) {
  .footer-container {
    margin-top: 8rem;
  }
}

      .moving-icon {
  /* text-4xl */
  font-size: 2.25rem; /* 36px */
  line-height: 2.5rem;

  /* Cấu hình đềEtransform hoạt động */
  display: inline-block;

  /* transition-transform duration-500 */
  transition: transform 0.5s ease;
  will-change: transform;
}

/* group-hover:translate-x-6 */
/* Khi di chuột vào .glass-card (group), icon dịch sang phải 1.5rem (24px) */
.glass-card:hover .moving-icon {
  transform: translateX(1.5rem);
}
      .flex-container {
  /* inline-flex items-center gap-4 */
  display: inline-flex;
  align-items: center;
  gap: 1rem; /* 4 * 4px = 16px */

  /* text-white text-xl font-bold */
  color: #ffffff;
  font-size: 1.25rem; /* 20px */
  font-weight: 700;
  
  /* Đảm bảo căn chỉnh mượt mà */
  vertical-align: middle;
}

/* md:text-2xl (Màn hình từ 768px trềElên) */
@media (min-width: 768px) {
  .flex-container {
    font-size: 1.5rem; /* 24px */
  }
}
      .card-description {
  /* text-lg (18px) */
  font-size: 1.125rem;
  
  /* text-white */
  color: #ffffff;
  
  /* leading-relaxed (line-height: 1.625) */
  line-height: 1.625;
  
  /* max-w-md (448px) */
  max-width: 28rem;
  
  /* mx-auto (Căn giữa theo chiều ngang) */
  margin-left: auto;
  margin-right: auto;
  
  /* mb-10 (10 * 4px = 40px) */
  margin-bottom: 2.5rem;
  
  /* Đảm bảo chữ trông mịn hơn trên nền tối */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* md:text-xl (Màn hình từ 768px trềElên - 20px) */
@media (min-width: 768px) {
  .card-description {
    font-size: 1.25rem;
  }
}
      .card-subtitle {
  /* text-xl (20px) */
  font-size: 1.25rem;
  line-height: 1.75rem;

  /* text-white */
  color: #ffffff;

  /* font-semibold */
  font-weight: 600;

  /* mb-6 (6 * 4px = 24px) */
  margin-bottom: 1.5rem;
}

/* md:text-2xl (Màn hình từ 768px trềElên - 24px) */
@media (min-width: 768px) {
  .card-subtitle {
    font-size: 1.5rem;
    line-height: 2rem;
  }
}
      .card-title {
  /* text-4xl */
  font-size: 2.25rem; /* 36px */
  line-height: 2.5rem;
  
  /* font-black */
  font-weight: 900;
  
  /* text-white */
  color: #ffffff;
  
  /* mb-4 (4 * 4px) */
  margin-bottom: 1rem;
  
  /* drop-shadow-lg */
  filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04)) 
          drop-shadow(0 4px 3px rgba(0, 0, 0, 0.1));
}

/* md:text-5xl (Màn hình từ 768px trềElên) */
@media (min-width: 768px) {
  .card-title {
    font-size: 3rem; /* 48px */
    line-height: 1;
  }
}
  .hero-text {
  /* text-8xl */
  font-size: 6rem; /* 96px */
  line-height: 1;
  margin-bottom: 2rem; /* mb-8 (8 * 4px = 32px) */
  
  /* Cấu hình đềEtransform hoạt động mượt mà */
  display: inline-block; 
  transition: transform 0.5s ease; /* duration-500 */
  will-change: transform; /* Tối ưu hiệu năng cho trình duyệt */
}

/* md:text-9xl (Dành cho màn hình từ 768px trềElên) */
@media (min-width: 768px) {
  .hero-text {
    font-size: 8rem; /* 128px */
  }
}

/* group-hover:scale-110 */
/* Khi di chuột vào .glass-card thì .hero-text sẽ phóng to */
.glass-card:hover .hero-text {
  transform: scale(1.1);
}
      /* Class dùng chung cho cả 2 vầng sáng */
.glow-orb {
  position: absolute;
  width: 24rem; /* w-96 */
  height: 24rem; /* h-96 */
  background-color: rgba(255, 255, 255, 0.3); /* bg-white/30 */
  border-radius: 50%; /* rounded-full */
  filter: blur(64px); /* blur-3xl */
  pointer-events: none;
  z-index: 0;
}

/* VềEtrí góc trên trái */
.orb-top {
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
}

/* VềEtrí góc dưới phải (Mã bạn vừa gửi) */
.orb-bottom {
  bottom: 0;
  right: 0;
  /* translate-x-48 translate-y-48 = dịch chuyển ra ngoài 50% */
  transform: translate(50%, 50%);
}
      .subtle-overlay {
  /* absolute inset-0 */
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  /* Giả sử bạn muốn phủ màu trắng hoặc màu chủ đạo của thương hiệu */
  background-color: white; 

  /* opacity-0 và transition-opacity duration-700 */
  opacity: 0;
  transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  
  pointer-events: none; /* Đảm bảo lớp này không ngăn cản việc click vào nội dung */
}

/* group-hover:opacity-40 */
.glass-card:hover .subtle-overlay {
  opacity: 0.4;
}
      .gradient-overlay {
  /* absolute inset-0 */
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  /* bg-gradient-to-br (Ví dụ: từ xanh sang tím) */
  background: linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2));

  /* opacity-0 + transition-opacity duration-700 */
  opacity: 0;
  transition: opacity 0.7s ease;
  z-index: 0; /* Đảm bảo nằm dưới nội dung */
}

/* group-hover:opacity-100 */
.glass-card:hover .gradient-overlay {
  opacity: 1;
}

/* Đảm bảo nội dung luôn hiển thị trên lớp gradient */
.content {
  position: relative;
  z-index: 1;
}
      .glass-card {
  /* Cấu trúc cơ bản */
  position: relative;
  overflow: hidden;
  border-radius: 1.5rem; /* rounded-3xl */
  
  /* Hiệu ứng Glassmorphism */
  background-color: rgba(255, 255, 255, 0.1); /* bg-white/10 */
  backdrop-filter: blur(24px); /* backdrop-blur-xl */
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.2); /* border-white/20 */
  
  /* ĐềEbóng và Chuyển cảnh */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); /* shadow-2xl */
  transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1); /* duration-700 */
  
  /* Animation khi load trang */
  animation: fadeIn 0.8s ease-out forwards;
}

/* Hiệu ứng Hover (Hover state) */
.glass-card:hover {
  transform: scale(1.05) translateY(-24px); /* hover:scale-105 hover:-translate-y-6 */
  box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.6); /* hover:shadow-3xl */
}

  .hero-section-title {
  /* relative */
  position: relative;
  
  /* block */
  display: block; 
  
  /* p-x (padding-left và padding-right) */
  padding-left: 2.5rem;  /* 40px */
  padding-right: 2.5rem; /* 40px */
  
  /* p-y (padding-top và padding-bottom) */
  padding-top: 2rem;    /* 32px */
  padding-bottom: 2rem; /* 32px */
  
  /* font-black */
  font-weight: 900; 
  
  /* tracking-wider */
  letter-spacing: 0.05em; 
  
  /* text-white */
  color: #ffffff; 
  
  /* drop-shadow-2xl (Giá trị gần đúng, có thể phức tạp hơn) */
  filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15)) drop-shadow(0 10px 10px rgba(0, 0, 0, 0.04));
  
  /* -translate-y-3 */
  transform: translateY(-0.75rem); /* -12px */
  
  /* text-6xl (Giá trềEmặc định cho text-6xl) */
  font-size: 3.75rem; /* 60px */
  line-height: 1; 
  
  /* hero-text-glow (CSS Tùy chỉnh gần đúng cho hiệu ứng glow) */
  text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #f687b3; /* Ánh sáng trắng và hồng nhạt */
  
  /* animate-pulse-soft (CSS Tùy chỉnh: Tạo keyframes và áp dụng) */
  animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Kích thước text cho màn hình nhềE(sm:text-6xl) */
/* Cùng giá trềEmặc định, không cần media query */

/* Thiết lập cho màn hình trung bình (md) - min-width: 768px */
@media (min-width: 768px) {
  .hero-section-title {
    /* md:px-14 */
    padding-left: 3.5rem;  /* 56px */
    padding-right: 3.5rem; /* 56px */
    
    /* md:py-10 */
    padding-top: 2.5rem;    /* 40px */
    padding-bottom: 2.5rem; /* 40px */
    
    /* md:text-7xl */
    font-size: 4.5rem; /* 72px */
    line-height: 1;
    
    /* md:-translate-y-4 */
    transform: translateY(-1rem); /* -16px */
  }
}

/* Thiết lập cho màn hình lớn (lg) - min-width: 1024px */
@media (min-width: 1024px) {
  .hero-section-title {
    /* lg:px-20 */
    padding-left: 5rem;  /* 80px */
    padding-right: 5rem; /* 80px */
    
    /* lg:py-12 */
    padding-top: 3rem;    /* 48px */
    padding-bottom: 3rem; /* 48px */
    
    /* lg:text-10xl (Không có trong Tailwind mặc định, tôi dùng 9xl + 1/2) */
    font-size: 8rem; /* 128px */ 
    line-height: 1;
    
    /* lg:-translate-y-5 */
    transform: translateY(-1.25rem); /* -20px */
  }
}

/* Keyframes cho hiệu ứng pulse-soft (giả định) */
@keyframes pulse-soft {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.9;
  }
}
      .circular-shadow-button {
  /* p-4 */
  padding: 1rem; /* 16px */
  
  /* rounded-full */
  border-radius: 9999px; 
  
  /* bg-white/80 */
  background-color: rgba(255, 255, 255, 0.8); 
  
  /* transition */
  transition: all 150ms ease-in-out; 
}

/* hover:bg-pink-200 */
.circular-shadow-button:hover {
  background-color: #fecaca; /* pink-200 */
}

/* disabled:opacity-50 */
.circular-shadow-button:disabled {
  opacity: 0.5;
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

     @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }    
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
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
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 10s ease infinite;
        }
      `}</style>
    </div>
  );
}
