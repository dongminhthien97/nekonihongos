import {
  Home,
  BookOpen,
  FileText,
  Languages,
  Dumbbell,
  LogOut,
  Bell,
  User,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import api from "../api/axios";

export function Navigation({
  currentPage,
  onNavigate,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
}) {
  const navItems = [
    { id: "landing", label: "Trang chủ", icon: Home },
    { id: "hirakata-selector", label: "Bảng chữ cái", icon: BookOpen },
    { id: "vocabulary-selector", label: "Từ vựng", icon: Languages },
    { id: "grammar-selector", label: "Ngữ pháp", icon: BookOpen },
    { id: "kanji-selector", label: "Kanji", icon: FileText },
    { id: "exercise-selector", label: "Bài tập", icon: Dumbbell },
    { id: "mypage", label: "MyPage", icon: User },
    {
      id: "logout",
      label: "Thoát",
      icon: LogOut,
      itemId: "nav-logout",
      isLogout: true,
    },
  ];

  const { user, logout } = useAuth();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);

  // Fetch số bài mini test đã feedback khi user đăng nhập
  useEffect(() => {
    if (user?.role === "USER") {
      const fetchFeedbackCount = async () => {
        try {
          const res = await api.get("/user/mini-test/feedback-count");
          setFeedbackCount(res.data.count || 0);
        } catch (err) {
          console.error("Lỗi lấy feedback:", err);
        }
      };
      fetchFeedbackCount();
    }
  }, [user]);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  if (!user) return null;

  return (
    <nav className="header-sticky-blur">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-4 group"
            style={{ cursor: "pointer" }}
          >
            <ImageWithFallback
              src="https://i.ibb.co/1fK2RY6J/icon.jpg"
              alt="Neko Nihongo"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                objectFit: "cover",
                boxShadow: "0 10px 25px -5px rgba(236, 72, 153, 0.5)",
                border: "4px solid rgba(255, 255, 255, 0.9)",
                transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              className="group:hover .group-transform-effect"
            />

            <span
              className="hidden sm:block text-2xl font-extrabold"
              style={{
                background:
                  "linear-gradient(to right, #F472B6, #C084FC, #A78BFA)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Neko Nihongo
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isLogout = item.isLogout;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    isLogout ? handleLogout() : onNavigate(item.id)
                  }
                  className={`flex-button-style ${
                    isLogout
                      ? "text-shadow-hover-effect"
                      : isActive
                        ? "gradient-text-shadow"
                        : "red-text-hover-gradient"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isLogout ? "group-hover-rotate" : ""
                    }`}
                  />
                  <span
                    className={`small-text-bold-transition${
                      item.isLogout
                        ? "text-hover-shadow-effect"
                        : "text-gray-800"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* BELL NOTIFICATION CHO USER (chỉ hiện khi là USER và có feedback mới) */}
            {user.role === "USER" && (
              <div className="relative ml-4">
                <button
                  onClick={() => onNavigate("user-mini-test-submissions")}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/40 transition-all"
                >
                  <Bell className="w-6 h-6 text-black" />
                  {feedbackCount > 0 && (
                    <span className="badge-error-pulse">
                      {feedbackCount > 9 ? "9+" : feedbackCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isLogout = item.isLogout;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    isLogout ? handleLogout() : onNavigate(item.id)
                  }
                  className={`small-padding-rounded-transition ${
                    isLogout
                      ? "hover-text-scale"
                      : isActive
                        ? "hover-black-scale"
                        : "gray-text-hover-pink"
                  }`}
                  title={item.label}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isLogout ? "group-hover-rotate" : ""
                    }`}
                  />
                </button>
              );
            })}

            {/* BELL MOBILE */}
            {user.role === "USER" && (
              <div className="relative">
                <button
                  onClick={() => onNavigate("user-mini-test-submissions")}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/40 transition-all"
                >
                  <Bell className="w-6 h-6 text-white" />
                  {feedbackCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {feedbackCount > 9 ? "9+" : feedbackCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL LOGOUT  EGIỮ NGUYÊN 100% TỪ CODE GỐC */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsLogoutModalOpen(false)}
          />

          <div className="relative w-full max-w-md">
            <div className="my-20 sm:my-0">
              <div className="modal-card-neko">
                <div className="text-9xl text-center mb-6 drop-shadow-lg"></div>

                <h3 className="title-logout-neko">Thoát hả em?</h3>

                <p className="text-center text-red-600 mb-10 text-lg font-medium leading-relaxed">
                  Are you sure??
                </p>

                <div className="grid-layout-2">
                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="btn-stay-neko"
                  >
                    Học tiếp
                  </button>

                  <button
                    onClick={confirmLogout}
                    className="btn-logout-danger-neko"
                  >
                    Thoát
                  </button>
                </div>

                <div className="absolute -top-10 -right-10 text-8xl animate-wiggle-1 opacity-90"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
      .badge-error-pulse {
  /* Vị trí tuyệt đối */
  position: absolute;
  top: -0.25rem;    /* tương ứng -top-1 (1 * 0.25rem = 4px) */
  right: -0.25rem;  /* tương ứng -right-1 */

  /* Kích thước & Hình dạng */
  width: 1.25rem;   /* tương ứng w-5 (20px) */
  height: 1.25rem;  /* tương ứng h-5 (20px) */
  border-radius: 9999px; /* tương ứng rounded-full */

  /* Màu sắc & Font */
  background-color: #ef4444; /* đềEred-500 */
  color: #ffffff;
  font-size: 0.75rem;        /* tương ứng text-xs (12px) */
  font-weight: 700;          /* tương ứng font-bold */

  /* Căn giữa nội dung bên trong */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Hiệu ứng nhấp nháy */
  animation: pulse-animation 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Định nghĩa hiệu ứng animate-pulse */
@keyframes pulse-animation {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
      .group-hover-rotate {
  /* transition duration-500 */
  /* Áp dụng transition cho thuộc tính transform đềEviệc xoay diềE ra mượt mà */
  transition: transform 500ms ease-in-out; 
}

/* group-hover:rotate-180 */
/* Áp dụng khi di chuột qua phần tử cha có class 'group' */
.group:hover .group-hover-rotate {
  transform: rotate(180deg);
}
      .gray-text-hover-pink {
  /* text-gray-600 */
  color: #4b5563; 
  
  /* transition (Thêm vào đềEhiệu ứng hover mượt mà) */
  transition: background-color 300ms ease-in-out; 
}

/* Các hiệu ứng hover */
.gray-text-hover-pink:hover {
  /* hover:bg-[#FFC7EA]/20 (Màu hồng nhạt #FFC7EA với đềEmềE20%) */
  background-color: rgba(255, 199, 234, 0.2); 
}
      .hover-black-scale {
  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); 
  
  /* scale-110 (Phần tử này được phóng to 110% mặc định) */
  transform: scale(1.1);
  
  /* transition (Thêm vào đềEhiệu ứng hover mượt mà) */
  transition: all 300ms ease-in-out; 
}

/* Các hiệu ứng hover (hover:text-black) */
.hover-black-scale:hover {
  /* hover:text-black */
  color: #000000; /* Màu đen */
  
  /* Các thuộc tính khác (shadow, scale) giữ nguyên trừ khi có lớp hover tương ứng */
}
      .small-padding-rounded-transition {
  /* p-2 */
  padding: 0.5rem; /* 8px */
  
  /* rounded-[12px] */
  border-radius: 0.75rem; /* 12px */
  
  /* transition-all duration-300 */
  transition: all 300ms ease-in-out; 
}
      .hover-text-scale {
  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); 
  
  /* scale-110 (Phần tử này được phóng to 110% mặc định, thường là lỗi nếu muốn scale khi hover) */
  /* Nếu bạn muốn hiệu ứng chềExảy ra khi hover, lớp này phải là hover:scale-110 */
  /* ềEđây tôi giữ nguyên theo yêu cầu: scale(1.1) là trạng thái mặc định. */
  transform: scale(1.1);
  
  /* transition (Thêm vào đềEhiệu ứng hover mượt mà) */
  transition: all 300ms ease-in-out; 
}

/* Các hiệu ứng hover (hover:text-red-600) */
.hover-text-scale:hover {
  /* hover:text-red-600 */
  color: #dc2626; /* Màu đềE600 */
  
  /* Các thuộc tính khác (shadow, scale) giữ nguyên trừ khi có lớp hover tương ứng */
}
      .text-hover-shadow-effect {
  /* text-red-600 */
  color: #dc2626; 
  
  /* drop-shadow-md */
  filter: drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07)) drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06));
  
  /* transition (Thêm vào đềEhiệu ứng hover mượt mà) */
  transition: all 300ms ease-in-out; 
}

/* group-hover:text-red-400 và group-hover:drop-shadow-xl */
/* Áp dụng khi di chuột qua phần tử cha có class 'group' */
.group:hover .text-hover-shadow-effect {
  /* group-hover:text-red-400 */
  color: #f87171; 
  
  /* group-hover:drop-shadow-xl */
  filter: drop-shadow(0 20px 13px rgba(0, 0, 0, 0.03)) drop-shadow(0 8px 5px rgba(0, 0, 0, 0.08));
}
      .small-text-bold-transition {
  /* text-sm */
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem; /* 20px */
  
  /* font-bold */
  font-weight: 700; 
  
  /* transition-all duration-300 */
  transition: all 300ms ease-in-out; 
}
      .group-hover-rotate {
  /* transition duration-500 */
  transition: transform 500ms ease-in-out; 
}

/* group-hover:rotate-180 */
/* Áp dụng khi di chuột qua phần tử cha có class 'group' */
.group:hover .group-hover-rotate {
  transform: rotate(180deg);
}
      .red-text-hover-gradient {
  /* text-red-600 */
  color: #dc2626; 
  
  /* transition (Thêm vào đềEhiệu ứng hover mượt mà) */
  transition: background-image 300ms ease-in-out; 
}

/* Các hiệu ứng hover */
.red-text-hover-gradient:hover {
  /* hover:bg-linear-to-r hover:from-[#FFC7EA]/20 hover:to-[#D8C8FF]/20 */
  background-image: linear-gradient(to right, 
    rgba(255, 199, 234, 0.2), /* #FFC7EA/20 */
    rgba(216, 200, 255, 0.2)  /* #D8C8FF/20 */
  );
  
  /* Đảm bảo nền được áp dụng */
  background-clip: padding-box; 
}
      .gradient-text-shadow {
  /* bg-linear-to-r from-[#FFC7EA] to-[#D8C8FF] */
  background-image: linear-gradient(to right, #FFC7EA, #D8C8FF);
  
  /* text-red-600 */
  color: #dc2626; 
  
  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); 
  
  /* scale-105 */
  transform: scale(1.05);
  
  /* transition (Thêm vào đềEđảm bảo hiệu ứng scale mượt mà) */
  transition: all 300ms ease-in-out; 
}
      .text-shadow-hover-effect {
  /* text-black */
  color: #000000;
  
  /* shadow-lg */
  /* Áp dụng box-shadow (cho phần tử) hoặc filter: drop-shadow (cho văn bản). 
     Nếu áp dụng cho văn bản, cần dùng filter. Ta dùng box-shadow mặc định. */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); 
  
  /* scale-105 (Áp dụng transform cơ bản) */
  transform: scale(1.05);
  
  /* transition (Thêm vào đềEhiệu ứng hover mượt mà) */
  transition: all 300ms ease-in-out; 
}

/* Các hiệu ứng hover */
.text-shadow-hover-effect:hover {
  /* hover:shadow-red-500/60 */
  /* Thay đổi box-shadow sang màu đềE500 (#ef4444) với đềEmềE60% */
  box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.6), 0 4px 6px -4px rgba(239, 68, 68, 0.6);
  
  /* Khi dùng hover:shadow mà không có hover:scale, ta giữ nguyên scale. 
     Tuy nhiên, lớp scale-105 nằm ngoài hover, nên nó đã được áp dụng. 
     Nếu muốn scale chềExảy ra khi hover, cần thêm lớp hover:scale-105. 
     ềEđây ta giữ nguyên scale 1.05 cho cả hai trạng thái. */
}
      .flex-button-style {
  /* flex */
  display: flex;
  
  /* items-center */
  align-items: center; /* Căn giữa dọc các item con */
  
  /* gap-2 */
  gap: 0.5rem; /* 8px - Khoảng cách giữa các item con */
  
  /* px-4 */
  padding-left: 1rem;  /* 16px */
  padding-right: 1rem; /* 16px */
  
  /* py-2 */
  padding-top: 0.5rem;    /* 8px */
  padding-bottom: 0.5rem; /* 8px */
  
  /* rounded-[16px] */
  border-radius: 1rem; /* 16px */
  
  /* transition-all duration-300 */
  transition: all 300ms ease-in-out; 
}
      /* Đảm bảo phần tử này có transition đã được định nghĩa ềElớp CSS cơ bản */

.group:hover .group-transform-effect {
  /* group-hover:scale-125 và group-hover:-rotate-6 */
  /* Gộp cả hai biến đổi vào thuộc tính transform */
  transform: scale(1.25) rotate(-6deg);
  
  /* group-hover:shadow-pink-500/60 */
  /* Sử dụng box-shadow đềEtạo bóng đềEmàu hồng */
  box-shadow: 0 10px 15px -3px rgba(236, 72, 153, 0.6), 0 4px 6px -4px rgba(236, 72, 153, 0.6); 
  /* (Giá trềEbox-shadow tương đương với một shadow trung bình, màu hồng 500 với đềEmềE60%) */
}
      .header-sticky-blur {
  /* sticky top-0 */
  position: sticky;
  top: 0;
  
  /* z-50 */
  z-index: 50;
  
  /* bg-white/95 */
  background-color: rgba(255, 255, 255, 0.95); /* Nền trắng gần như đục */
  
  /* backdrop-blur-md */
  backdrop-filter: blur(12px); /* Làm mềEnền phía sau (hiệu ứng kính mềE */
  
  /* shadow-sm */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Bóng đềEmỏng */
  
  /* border-b */
  border-bottom-width: 1px;
  border-style: solid; /* Cần thiết để viền hiển thị */
  
  /* border-[#FFC7EA]/20 (Màu hồng nhạt #FFC7EA) */
  border-bottom-color: rgba(255, 199, 234, 0.2); /* Viền dưới hồng nhạt mềE20% */
}
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }
          /* TEXT ĐềERỰC GLOBAL CHO NÚT LOGOUT  ESIÊU MẠNH, SIÊU ĐềE SIÊU DềESỢ */
.text-red-600 {
  --tw-text-opacity: 1;
  color: rgb(220 38 38 / var(--tw-text-opacity));
  font-weight: 900 !important;
  text-shadow: 0 2px 6px rgba(220, 38, 38, 0.5) !important;
  letter-spacing: 0.8px !important;
}

/* Hover →đềEsáng + phát sáng neon */
.text-red-600:hover {
  color: #ef4444 !important;
  text-shadow: 
    0 0 12px rgba(239, 68, 68, 0.9),
    0 4px 12px rgba(239, 68, 68, 0.6) !important;
  transform: translateY(-1px);
  transition: all 0.3s ease !important;
}

/* Đảm bảo chữ "Thoát" luôn đềErực dù có class gì đi nữa */
#nav-logout span,
button[title="Thoát"] span,
button:has(svg[data-icon="log-out"]) span,
span:where(.text-red-600) {
  @apply text-red-600 !important;
  
}
  .btn-stay-neko {
    padding: 1.25rem 2rem;               /* py-5 */
    border-radius: 1rem;                 /* rounded-2xl */
    font-weight: 700;                    /* font-bold */
    font-size: 1.25rem;                  /* text-xl */
    color: #7e22ce;                      /* text-purple-700 */
    
    /* Gradient nền */
    background: linear-gradient(to right, #e9d5ff, #fbcfe8); /* from-purple-100 →to-pink-100 */
    
    box-shadow: 0 10px 25px -5px rgba(168, 34, 222, 0.3),
                0 20px 40px -12px rgba(236, 72, 153, 0.25);
    
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    border: none;
    position: relative;
    overflow: hidden;
  }

  /* Hover  Eđậm màu hơn + phóng to */
  .btn-stay-neko:hover {
    background: linear-gradient(to right, #ddd6fe, #f9a8d4); /* hover:from-purple-200 →hover:to-pink-200 */
    transform: scale(1.05);
    box-shadow: 0 20px 40px -10px rgba(168, 34, 222, 0.4),
                0 30px 60px -15px rgba(236, 72, 153, 0.35);
  }

  /* Khi nhấn  Ebẹp xuống tí */
  .btn-stay-neko:active {
    transform: scale(0.95);
  }

  /* Hiệu ứng sóng lấp lánh khi hover  Esiêu kawaii */
  .btn-stay-neko::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    transition: left 0.7s;
  }

  .btn-stay-neko:hover::before {
    left: 100%;
  }
    .btn-logout-danger-neko {
    padding: 1.25rem 2rem;                    /* py-5 */
    border-radius: 1rem;                      /* rounded-2xl */
    font-weight: 800;                         /* font-bold + mạnh hơn tí */
    font-size: 1.25rem;                       /* text-xl */
    color: white;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3);

    /* Gradient đềE→hồng đậm */
    background: linear-gradient(to right, #ef4444, #ec4899); /* from-red-500 →to-pink-600 */

    box-shadow: 
      0 15px 35px -5px rgba(239, 68, 68, 0.5),
      0 25px 50px -12px rgba(236, 72, 153, 0.4);

    border: none;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* HOVER  EđềEhơn, đậm hơn, to hơn */
  .btn-logout-danger-neko:hover {
    background: linear-gradient(to right, #dc2626, #db2777); /* from-red-600 →to-pink-700 */
    transform: scale(1.05);
    box-shadow: 
      0 25px 50px -10px rgba(239, 68, 68, 0.6),
      0 35px 70px -15px rgba(236, 72, 153, 0.5);
  }

  /* KHI NHẤN  Ebẹp xuống + rung nhẹ */
  .btn-logout-danger-neko:active {
    transform: scale(0.95);
  }

  /* SÓNG LẤP LÁNH SIÊU SANG  Echạy ngang khi hover */
  */
  .btn-logout-danger-neko::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    transition: left 0.8s;
  }

  .btn-logout-danger-neko:hover::before {
    left: 100%;
  }

  /* Hiệu ứng rung nhẹ khi hover (thêm drama) */
  .btn-logout-danger-neko:hover {
    animation: microShake 0.5s ease-in-out;
  }

  @keyframes microShake {
    0%, 100% { transform: translateX(0) scale(1.05); }
    25%      { transform: translateX(-4px) scale(1.05); }
     }
    .title-logout-neko {
    font-size: 2.25rem;                    /* text-4xl */
    line-height: 1.2;
    font-weight: 900;                      /* font-black */
    text-align: center;
    margin-bottom: 1rem;                   /* mb-4 */

    /* Gradient hồng →tím đậm */
    background: linear-gradient(to right, #ec4899, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    /* Thêm phát sáng + bóng chữ cho nổi bần bật */
    text-shadow: 
      0 4px 15px rgba(236, 72, 153, 0.4),
      0 8px 25px rgba(168, 85, 247, 0.3);

    /* Hiệu ứng nhẹ khi modal hiện */
    animation: titleGlow 3s ease-in-out infinite alternate;
  }

  @keyframes titleGlow {
    from {
      text-shadow: 
        0 4px 15px rgba(236, 72, 153, 0.4),
        0 8px 25px rgba(168, 85, 247, 0.3);
    }
    to {
      text-shadow: 
        0 4px 25px rgba(236, 72, 153, 0.6),
        0 10px 40px rgba(168, 85, 247, 0.5);
    }
  }

  /* Mobile nhềEhơn tí cho đẹp */
  @media (max-width: 480px) {
    .title-logout-neko {
      font-size: 2rem;
    }
  }
    .modal-card-neko {
    position: relative;
    background: rgba(255, 255, 255, 0.80);       /* bg-white/80 */
    backdrop-filter: blur(24px);                 /* backdrop-blur-xl */
    -webkit-backdrop-filter: blur(24px);
    border-radius: 32px;                         /* rounded-[32px] */
    
    /* Bóng đềEsiêu to */
    box-shadow: 
      0 25px 50px -12px rgba(236, 72, 153, 0.35),
      0 35px 70px -15px rgba(168, 85, 247, 0.25),
      0 0 80px rgba(236, 72, 153, 0.15);

    padding: 2rem;                               /* p-8 */
  }

  @media (min-width: 640px) {
    .modal-card-neko {
      padding: 2.5rem 3rem;                      /* sm:p-10 */
    }
  }

  /* Viền hồng phấn + viền phát sáng tím */
  .modal-card-neko {
    border: 4px solid rgba(236, 146, 255, 0.60);  /* border-pink-300/60 */
    outline: 4px solid rgba(182, 146, 255, 0.20); /* ring-4 ring-purple-300/20 */
    outline-offset: 4px;
  }

  /* Hiệu ứng slide-up mượt như bơ */
  .modal-card-neko {
    animation: slideUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    transform: translateY(60px);
    opacity: 0;
  }

  @keyframes slideUp {
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Bonus: hover nhẹ →nổi lên tí cho sang */
  .modal-card-neko:hover {
    transform: translateY(-6px);
    box-shadow: 
      0 35px 70px -10px rgba(236, 72, 153, 0.45),
      0 45px 90px -20px rgba(168, 85, 247, 0.35);
    transition: all 0.5s ease;
  }
    .grid-layout-2 {
  /* Thiết lập Grid */
  display: grid;
  
  /* grid-cols-2: Chia làm 2 cột bằng nhau */
  grid-template-columns: repeat(2, minmax(0, 1fr));
  
  /* gap-5: Khoảng cách giữa các ô là 1.25rem (20px) */
  gap: 1.25rem;
  
  /* Căn chỉnh mặc định */
  width: 100%;
  margin-bottom: 1.25rem;
}

/* Responsive: Trên màn hình điện thoại rất nhềE(dưới 480px) 
   nên cân nhắc chuyển vềE1 cột nếu nội dung bên trong quá dài */
@media (max-width: 480px) {
  .grid-layout-2-mobile-friendly {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
      `}</style>
      {/* MODAL LOGOUT  EĐÁEFIX HOÀN HẢO, LUÔN ềEGIỮA MÀN HÌNH 100% */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center px-4">
          {/* Overlay mềE+ click đềEtắt */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsLogoutModalOpen(false)}
          />

          {/* Modal chính  EĐÁEĐƯỢC CāE CHÍNH XÁC GIỮA */}
          <div className="relative w-full max-w-md">
            {/* Thêm div này đềEtạo khoảng cách với navbar và căn giữa hoàn hảo */}
            <div className="my-20 sm:my-0">
              <div className="modal-card-neko">
                {/* Mèo khóc huhu */}
                <div className="text-9xl text-center mb-6 drop-shadow-lg"></div>

                <h3 className="title-logout-neko">Thoát hả em?</h3>

                <p className="text-center text-red-600 mb-10 text-lg font-medium leading-relaxed">
                  Are you sure??
                </p>

                <div className="grid-layout-2">
                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="btn-stay-neko"
                  >
                    Học tiếp
                  </button>

                  <button
                    onClick={confirmLogout}
                    className="btn-logout-danger-neko"
                  >
                    Thoát
                  </button>
                </div>

                {/* Mèo nhềEgóc */}
                <div className="absolute -top-10 -right-10 text-8xl animate-wiggle-1 opacity-90"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
