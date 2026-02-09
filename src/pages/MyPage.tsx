// src/pages/MyPage.tsx (FULL CODE ENTRY POINT MYPAGE – FIX CRASH/REDIRECT SAI KHI BẤM MYPAGE NAV, THÊM AUTH GUARD + LOADING + LOG DEBUG)

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface MyPageProps {
  onNavigate: (path: string) => void;
}

export function MyPage({ onNavigate }: MyPageProps) {
  const { user, loading: authLoading } = useAuth();

  console.log("[MyPage] Render triggered");
  console.log("[MyPage] authLoading:", authLoading);
  console.log("[MyPage] user:", user);

  useEffect(() => {
    console.log("[MyPage] useEffect run");
    console.log("[MyPage] authLoading:", authLoading);
    console.log("[MyPage] user:", user);

    if (authLoading) {
      console.log("[MyPage] Auth loading → chờ...");
      return;
    }

    if (!user) {
      console.log("[MyPage] No user → redirect login");
      onNavigate("login");
      return;
    }

    if (user.role === "ADMIN") {
      console.log("[MyPage] ADMIN → navigate to admin dashboard");
      onNavigate("admin");
    } else {
      console.log("[MyPage] USER → navigate to user mypage");
      onNavigate("user");
    }
  }, [authLoading, user, onNavigate]);

  // LOADING SCREEN KHI CHỜ AUTH
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="text-indigo-600 text-2xl mt-6 font-bold">
            Đang kiểm tra thông tin mèo...
          </p>
          <p className="text-gray-600 mt-2">にゃん... chờ chút nhé! 🐱</p>
        </div>
      </div>
    );
  }

  // TRANSITION SCREEN SAU KHI AUTH LOADED (trước khi redirect)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="text-9xl animate-bounce mb-8">🐱</div>
        <p className="text-4xl font-bold text-purple-700 animate-pulse">
          Đang đưa mèo về nhà...
        </p>
      </div>
    </div>
  );
}
