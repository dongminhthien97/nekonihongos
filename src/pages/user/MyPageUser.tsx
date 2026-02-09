// src/pages/User/MyPageUser.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { NekoLoading } from "../../components/NekoLoading";

interface MyPageUserProps {
  onNavigate: (page: string) => void;
}

export function MyPageUser({ onNavigate }: MyPageUserProps) {
  const {
    user: authUser,
    updateUser,
    refreshUser,
    loading: authLoading,
  } = useAuth();

  const [localLoading, setLocalLoading] = useState(true);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [feedbackCount, setFeedbackCount] = useState(0);

  const PLACEHOLDER_AVATAR_128 =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='100%' height='100%' fill='%23f3e8ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%236b21a8' font-family='Arial, sans-serif'>Avatar</text></svg>";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authUser) {
      setAvatarUrl(authUser.avatarUrl || "");
    }
  }, [authUser]);

  useEffect(() => {
    const fetchFeedbackCount = async () => {
      try {
        const res = await api.get("/user/mini-test/feedback-count");
        setFeedbackCount(res.data.count || 0);
      } catch (err) {
        console.error("Lỗi lấy feedback:", err);
      }
    };
    fetchFeedbackCount();
  }, []);

  if (!authUser) {
    return (
      <div className="mypage-loading-state">
        <p>Đang tải thông tin mèo...</p>
      </div>
    );
  }

  if (authLoading || localLoading) {
    return <NekoLoading message="Mèo đang chuẩn bị MyPage cho bạn... 😻" />;
  }

  // --- LOGIC TÍNH TOÁN (Giữ nguyên) ---
  const calculateLevel = (points: number = 0): number => {
    if (points < 30) return 1;
    if (points < 70) return 2;
    if (points < 120) return 3;
    if (points < 180) return 4;
    if (points < 250) return 5;
    if (points < 330) return 6;
    if (points < 420) return 7;
    if (points < 520) return 8;
    if (points < 630) return 9;
    if (points < 750) return 10;
    return 10 + Math.floor((points - 630) / 150);
  };

  const getNextLevelPoints = (currentLevel: number): number => {
    if (currentLevel <= 10) {
      const thresholds = [30, 70, 120, 180, 250, 330, 420, 520, 630, 750];
      return thresholds[currentLevel - 1] || 750;
    }
    return 630 + (currentLevel - 9) * 150;
  };

  const userLevel = calculateLevel(authUser.points);
  const nextLevelPoints = getNextLevelPoints(userLevel);
  const progressToNextLevel = Math.min(
    (authUser.points / nextLevelPoints) * 100,
    100,
  );
  const pointsNeeded = nextLevelPoints - authUser.points;

  const handleAvatarUpdate = async () => {
    if (!avatarUrl.trim()) {
      toast.error("Vui lòng nhập URL hợp lệ 😿");
      return;
    }
    try {
      const res = await api.patch("/user/me/avatar", {
        avatarUrl: avatarUrl.trim(),
      });
      const newAvatar =
        res.data?.data?.avatarUrl || res.data?.avatarUrl || avatarUrl.trim();
      updateUser({ avatarUrl: newAvatar });
      await refreshUser();
      toast.success("Cập nhật avatar thành công! 😻");
      setIsEditingAvatar(false);
    } catch (err) {
      toast.error("Không thể cập nhật avatar 😿");
    }
  };

  return (
    <div className="neko-mypage-wrapper">
      <div className="neko-mypage-container">
        {/* TOP BAR */}
        <header className="neko-top-bar">
          <h1 className="neko-page-title">
            マイページ <span className="sakura">🌸</span>
          </h1>
          <button
            onClick={() => onNavigate("landing")}
            className="neko-btn-back"
          >
            <span>🔙</span> Đóng
          </button>
        </header>

        {/* HERO SECTION */}
        <section className="neko-hero-card">
          <div className="neko-avatar-wrapper">
            <div className="neko-avatar-main">
              <img
                src={authUser.avatarUrl || PLACEHOLDER_AVATAR_128}
                alt="Avatar"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_AVATAR_128;
                  e.currentTarget.onerror = null;
                }}
              />
              <button
                className="neko-edit-badge"
                onClick={() => setIsEditingAvatar(true)}
              >
                ✏️
              </button>
            </div>

            {isEditingAvatar && (
              <div className="neko-avatar-edit-modal">
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Dán link ảnh vào đây..."
                />
                <div className="neko-edit-actions">
                  <button
                    onClick={handleAvatarUpdate}
                    className="neko-btn-save"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => setIsEditingAvatar(false)}
                    className="neko-btn-cancel"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="neko-hero-info">
            <h2 className="neko-user-name">
              {authUser.fullName || authUser.username}
            </h2>
            <div className="neko-user-badges">
              <span className="neko-badge-role">
                {authUser.role === "ADMIN"
                  ? "🛡️ Quản trị viên"
                  : "🐾 Học viên Neko"}
              </span>
              <span className="neko-badge-level">Cấp độ {userLevel}</span>
            </div>
          </div>
        </section>

        {/* DASHBOARD GRID */}
        <div className="neko-dashboard-grid">
          {/* LEFT: INFO */}
          <div className="neko-info-column">
            <div className="neko-card-simple">
              <div className="neko-card-icon">📧</div>
              <div className="neko-card-body">
                <label>Email liên hệ</label>
                <p>{authUser.email}</p>
              </div>
            </div>

            <div className="neko-card-simple">
              <div className="neko-card-icon">📅</div>
              <div className="neko-card-body">
                <label>Gia nhập Neko</label>
                <p>
                  {new Date(authUser.joinDate || "").toLocaleDateString(
                    "vi-VN",
                  )}
                </p>
              </div>
            </div>

            <button
              className="neko-cta-card"
              onClick={() => onNavigate("user-mini-test-submissions")}
            >
              <div className="neko-cta-content">
                <div className="neko-cta-icon">📝</div>
                <div className="neko-cta-text">
                  <h3>Bài Mini Test</h3>
                  <p>Xem kết quả & feedback</p>
                </div>
              </div>
              {feedbackCount > 0 && (
                <span className="neko-notif-pill">{feedbackCount}</span>
              )}
            </button>
          </div>

          {/* RIGHT: STATS */}
          <div className="neko-stats-column">
            <div className="neko-card-glass neko-level-stats">
              <div className="neko-stat-header">
                <h3>Tiến trình Cấp độ</h3>
                <span className="neko-stat-value">
                  {Math.round(progressToNextLevel)}%
                </span>
              </div>
              <div className="neko-progress-outer">
                <div
                  className="neko-progress-inner"
                  style={{ width: `${progressToNextLevel}%` }}
                ></div>
              </div>
              <p className="neko-stat-hint">
                {userLevel < 100
                  ? `Cần thêm ${pointsNeeded} điểm để lên Level ${userLevel + 1}`
                  : "Bạn đã đạt đỉnh cao! 🎉"}
              </p>
            </div>

            <div className="neko-stats-row">
              <div className="neko-card-glass neko-stat-mini">
                <span className="neko-mini-icon">🎯</span>
                <label>Tổng điểm</label>
                <div className="neko-mini-value">{authUser.points}</div>
              </div>
              <div className="neko-card-glass neko-stat-mini">
                <span className="neko-mini-icon">🔥</span>
                <label>Chuỗi Streak</label>
                <div className="neko-mini-value">
                  {authUser.streak || 0} ngày
                </div>
              </div>
            </div>

            <div className="neko-card-glass neko-streak-info">
              <p>
                🚀 Kỷ lục cao nhất:{" "}
                <strong>{authUser.longestStreak || 0} ngày</strong>
              </p>
              <p className="neko-last-login">
                Lần cuối học:{" "}
                {authUser.lastLoginDate
                  ? new Date(authUser.lastLoginDate).toLocaleDateString("vi-VN")
                  : "Hôm nay"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Thêm font-family hỗ trợ tiếng Việt */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        
        .neko-mypage-wrapper {
          min-height: 100vh;
          background: #fdf2f8;
          background-image: radial-gradient(#fbcfe8 0.5px, transparent 0.5px);
          background-size: 24px 24px;
          padding: 2rem 1rem;
          font-family: 'Be Vietnam Pro', 'Inter', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .neko-mypage-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        /* TOP BAR */
        .neko-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .neko-page-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #6b21a8;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-btn-back {
          background: white;
          border: 2px solid #e9d5ff;
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          font-weight: 700;
          color: #7c3aed;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }

        .neko-btn-back:hover {
          background: #f3e8ff;
          transform: translateY(-2px);
        }

        /* HERO CARD */
        .neko-hero-card {
          background: white;
          border-radius: 24px;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 10px 25px -5px rgba(107, 33, 168, 0.1);
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }

        .neko-hero-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; height: 120px;
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
          z-index: 0;
        }

        .neko-avatar-wrapper {
          position: relative;
          z-index: 1;
          margin-bottom: 1.5rem;
        }

        .neko-avatar-main {
          position: relative;
          width: 160px;
          height: 160px;
        }

        .neko-avatar-main img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 6px solid white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .neko-edit-badge {
          position: absolute;
          bottom: 5px;
          right: 5px;
          background: #7c3aed;
          border: 3px solid white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
        }

        .neko-user-name {
          font-size: 2.2rem;
          color: #1e1b4b;
          margin: 0.5rem 0;
          font-weight: 800;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-user-badges {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 1rem;
        }

        .neko-badge-role {
          background: #dbeafe;
          color: #1e40af;
          padding: 0.5rem 1.2rem;
          border-radius: 99px;
          font-weight: 700;
          font-size: 1rem;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-badge-level {
          background: #fef3c7;
          color: #92400e;
          padding: 0.5rem 1.2rem;
          border-radius: 99px;
          font-weight: 700;
          font-size: 1rem;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        /* DASHBOARD GRID */
        .neko-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 2rem;
        }

        /* CARDS */
        .neko-card-simple {
          background: white;
          padding: 1.5rem;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          margin-bottom: 1rem;
          border: 1px solid #f3e8ff;
        }

        .neko-card-icon {
          font-size: 2rem;
          background: #f5f3ff;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
        }

        .neko-card-body label {
          display: block;
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-card-body p {
          font-size: 1.2rem;
          font-weight: 700;
          color: #4b5563;
          margin: 0;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        /* CTA CARD (Submission) */
        .neko-cta-card {
          width: 100%;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
          border: none;
          padding: 2rem;
          border-radius: 24px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);
          text-align: left;
          font-family: inherit;
        }

        .neko-cta-card:hover {
          transform: scale(1.02);
          box-shadow: 0 15px 30px rgba(124, 58, 237, 0.4);
        }

        .neko-cta-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .neko-cta-icon {
          font-size: 2.5rem;
        }

        .neko-cta-text h3 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 800;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-cta-text p {
          margin: 0;
          opacity: 0.9;
          font-size: 1rem;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-notif-pill {
          background: #f43f5e;
          padding: 0.4rem 1rem;
          border-radius: 12px;
          font-weight: 800;
          border: 2px solid rgba(255,255,255,0.3);
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        /* STATS RIGHT COLUMN */
        .neko-card-glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid white;
          border-radius: 24px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .neko-stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .neko-stat-header h3 {
          margin: 0;
          color: #6b21a8;
          font-weight: 800;
          font-size: 1.3rem;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-stat-value {
          font-weight: 900;
          color: #7c3aed;
          font-size: 1.4rem;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-progress-outer {
          height: 16px;
          background: #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }

        .neko-progress-inner {
          height: 100%;
          background: linear-gradient(to right, #a855f7, #ec4899);
          border-radius: 10px;
          transition: width 1s ease-out;
        }

        .neko-stat-hint {
          margin-top: 0.8rem;
          font-size: 0.95rem;
          color: #6b7280;
          font-weight: 600;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .neko-stat-mini {
          text-align: center;
        }

        .neko-mini-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .neko-stat-mini label {
          font-size: 0.9rem;
          font-weight: 700;
          color: #6b7280;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-mini-value {
          font-size: 1.8rem;
          font-weight: 900;
          color: #1e1b4b;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        /* EDIT AVATAR INPUT */
        .neko-avatar-edit-modal {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 1.5rem;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          width: 300px;
          z-index: 10;
          margin-top: 10px;
        }

        .neko-avatar-edit-modal input {
          width: 100%;
          padding: 0.8rem;
          border: 2px solid #e9d5ff;
          border-radius: 10px;
          margin-bottom: 1rem;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
          font-size: 1rem;
        }

        .neko-edit-actions {
          display: flex;
          gap: 10px;
        }

        .neko-btn-save {
          flex: 1;
          background: #7c3aed;
          color: white;
          border: none;
          padding: 0.6rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }

        .neko-btn-cancel {
          flex: 1;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          padding: 0.6rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }

        .neko-streak-info p {
          margin: 0.5rem 0;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .neko-last-login {
          color: #6b7280;
          font-size: 0.9rem;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .neko-dashboard-grid {
            grid-template-columns: 1fr;
          }
          .neko-hero-card {
            padding: 2rem 1rem;
          }
          .neko-page-title {
            font-size: 1.8rem;
          }
          .neko-user-name {
            font-size: 1.8rem;
          }
          .neko-avatar-edit-modal {
            width: 250px;
          }
        }
      `}</style>
    </div>
  );
}
