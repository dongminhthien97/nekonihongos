// src/App.tsx – ĐÃ THÊM TRANG USER MINI TEST SUBMISSIONS
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { SplashScreen } from "./components/SplashScreen";
import { LoginPage } from "./components/LoginPage";
import { LandingPage } from "./components/LandingPage";
import { VocabularyPage } from "./components/VocabularyPage";
import { GrammarPage } from "./components/GrammarPage";
import { KanjiPage } from "./components/KanjiPage";
import { FlashcardPage } from "./components/FlashcardPage";
import { ExercisePage } from "./components/ExercisePage";
import { MyPage } from "./pages/MyPage";
import { DashboardAdmin } from "./pages/admin/DashboardAdmin";
import { MyPageUser } from "./pages/user/MyPageUser";
import { FlashcardKanji } from "./components/FlashcardKanji";
import { VocabularySelector } from "./components/VocabularySelector";
import { ExerciseSelector } from "./components/ExerciseSelector";
import { Toaster } from "react-hot-toast";
import { GrammarSelector } from "./components/GrammarSelector";
import { KanjiSelector } from "./components/KanjiSelector";
import { Background } from "./components/Background";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { HistoryTracking } from "./pages/admin/HistoryTracking";

// THÊM IMPORT CÁC TRANG HIRAGANA/KATAKANA
import { HiraganaPage } from "./components/HiraganaPage";
import { KatakanaPage } from "./components/KatakanaPage";
import { FlashcardHiraKataPage } from "./components/FlashcardHiraKataPage";
import { HiraKataSelector } from "./components/HiraKataSelector";
import { TestManagementPage } from "./pages/admin/TestManagementPage";

// NEW: IMPORT TRANG LƯU TRỮ MINI TEST CỦA USER
import { UserMiniTestSubmissions } from "./pages/user/UserMiniTestSubmissions";

// IMPORT CÁC COMPONENT VOCABULARY JLPT
import { VocabularyJLPT as VocabJLPTComponent } from "./components/VocabularyJLPT";
import { VocabularyN5 } from "./components/VocabularyN5";
import { VocabularyN4 } from "./components/VocabularyN4";
import { VocabularyN3 } from "./components/VocabularyN3";
import { VocabularyN2 } from "./components/VocabularyN2";
import { VocabularyN1 } from "./components/VocabularyN1";
// IMPORT CÁC COMPONENT GRAMMAR JLPT
import { JlptGrammar as JlptGrammarComponent } from "./components/JlptGrammar";
import { JlptGrammarN5 } from "./components/JlptGrammarN5";
import { JlptGrammarN4 } from "./components/JlptGrammarN4";
import { JlptGrammarN3 } from "./components/JlptGrammarN3";
import { JlptGrammarN2 } from "./components/JlptGrammarN2";
import { JlptGrammarN1 } from "./components/JlptGrammarN1";

// IMPORT CÁC COMPONENT KANJI JLPT MỚI
import { JlptKanjiN5 } from "./components/JlptKanjiN5";
import { JlptKanjiN4 } from "./components/JlptKanjiN4";
import { JlptKanjiN3 } from "./components/JlptKanjiN3";
import { JlptKanjiN2 } from "./components/JlptKanjiN2";
import { JlptKanjiN1 } from "./components/JlptKanjiN1";
import { JlptKanjiPage } from "./components/JlptKanjiPage";

function AppContent() {
  const { user, hasSeenSplash, loading, markSplashAsSeen } = useAuth();

  // ĐƯA STATE LÊN CẤP CAO NHẤT ĐỂ CHIA SẺ CHO TẤT CẢ COMPONENT
  const [currentPage, setCurrentPage] = useState<string>("landing");
  const [pageParams, setPageParams] = useState<{
    category?: string;
    level?: string;
  } | null>(null);

  const handleNavigate = (
    page: string,
    params?: { category?: string; level?: string },
  ) => {
    setCurrentPage(page);
    setPageParams(params || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SEO metadata
  useEffect(() => {
    document.title = "Neko Nihongo - Học Tiếng Nhật Dễ Thương";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Học tiếng Nhật theo phong cách kawaii dễ thương cùng mèo Neko! Từ vựng, Ngữ pháp, Kanji và Flashcard giúp bạn học hiệu quả hơn.",
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content =
        "Học tiếng Nhật theo phong cách kawaii dễ thương cùng mèo Neko! Từ vựng, Ngữ pháp, Kanji và Flashcard giúp bạn học hiệu quả hơn.";
      document.head.appendChild(meta);
    }
  }, []);

  // 1. Đang load → hiện loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <div className="text-8xl mb-6 animate-bounce">🐱</div>
          <div className="w-16 h-16 border-4 border-[#FFC7EA]/30 border-t-[#FFC7EA] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-xl">にゃん…</p>
        </div>
        <style>{`
          @keyframes bounce-in {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
        `}</style>
      </div>
    );
  }

  // 2. Chưa đăng nhập → LoginPage
  if (!user) {
    return <LoginPage />;
  }

  // 3. Đã đăng nhập + chưa thấy splash → hiện SplashScreen
  if (!hasSeenSplash) {
    return <SplashScreen onComplete={markSplashAsSeen} />;
  }

  const isMyPage =
    currentPage === "mypage" ||
    currentPage === "admin" ||
    currentPage === "user" ||
    currentPage === "user-mini-test-submissions";

  const isUserMiniTestSubmissions =
    currentPage === "user-mini-test-submissions";

  // 4. Đã thấy splash → vào app chính
  return (
    <div className="min-h-screen page-transition">
      {!isMyPage && !isUserMiniTestSubmissions && <Background />}
      <div className="relative z-10 min-h-screen">
        {!isMyPage && !isUserMiniTestSubmissions && (
          <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        )}

        {/* Các trang */}
        {currentPage === "landing" && (
          <LandingPage onNavigate={handleNavigate} />
        )}

        {/* CÁC TRANG HIRAGANA/KATAKANA MỚI */}
        {currentPage === "hiragana" && (
          <HiraganaPage onNavigate={handleNavigate} />
        )}
        {currentPage === "katakana" && (
          <KatakanaPage onNavigate={handleNavigate} />
        )}
        {currentPage === "flashcard-hirakata" && (
          <FlashcardHiraKataPage onNavigate={handleNavigate} />
        )}

        {currentPage === "vocabulary" && (
          <VocabularyPage onNavigate={handleNavigate} />
        )}
        {currentPage === "grammar" && (
          <GrammarPage onNavigate={handleNavigate} />
        )}
        {currentPage === "kanji" && <KanjiPage onNavigate={handleNavigate} />}
        {currentPage === "flashcard" && (
          <FlashcardPage onNavigate={handleNavigate} />
        )}
        {currentPage === "flashcard-kanji" && (
          <FlashcardKanji onNavigate={handleNavigate} />
        )}
        {currentPage === "mypage" && <MyPage onNavigate={handleNavigate} />}
        {currentPage === "admin" && (
          <DashboardAdmin onNavigate={handleNavigate} />
        )}
        {currentPage === "test-management" && (
          <TestManagementPage onNavigate={handleNavigate} />
        )}
        {currentPage === "user" && <MyPageUser onNavigate={handleNavigate} />}
        {currentPage === "vocabulary-selector" && (
          <VocabularySelector onNavigate={handleNavigate} />
        )}
        {currentPage === "grammar-selector" && (
          <GrammarSelector onNavigate={handleNavigate} />
        )}
        {currentPage === "vocabulary-n5" && (
          <VocabularyN5 onNavigate={handleNavigate} />
        )}
        {currentPage === "vocabulary-n4" && (
          <VocabularyN4 onNavigate={handleNavigate} />
        )}
        {currentPage === "vocabulary-n3" && (
          <VocabularyN3 onNavigate={handleNavigate} />
        )}
        {currentPage === "vocabulary-n2" && (
          <VocabularyN2 onNavigate={handleNavigate} />
        )}
        {currentPage === "vocabulary-n1" && (
          <VocabularyN1 onNavigate={handleNavigate} />
        )}
        {/* Hoặc sử dụng component chung với tham số */}
        {currentPage === "vocabulary-jlpt" && (
          <VocabJLPTComponent
            level={pageParams?.level || "N5"}
            onNavigate={handleNavigate}
          />
        )}
        {/* THÊM CÁC TRANG GRAMMAR JLPT */}
        {currentPage === "grammar-n5" && (
          <JlptGrammarN5 onNavigate={handleNavigate} />
        )}
        {currentPage === "grammar-n4" && (
          <JlptGrammarN4 onNavigate={handleNavigate} />
        )}
        {currentPage === "grammar-n3" && (
          <JlptGrammarN3 onNavigate={handleNavigate} />
        )}
        {currentPage === "grammar-n2" && (
          <JlptGrammarN2 onNavigate={handleNavigate} />
        )}
        {currentPage === "grammar-n1" && (
          <JlptGrammarN1 onNavigate={handleNavigate} />
        )}

        {/* Hoặc sử dụng component chung với tham số */}
        {currentPage === "grammar-jlpt" && (
          <JlptGrammarComponent
            level={pageParams?.level || "N5"}
            onNavigate={handleNavigate}
          />
        )}
        {/* Trang chọn loại bài tập */}
        {currentPage === "exercise-selector" && (
          <ExerciseSelector onNavigate={handleNavigate} />
        )}

        {/* ExercisePage dùng chung cho tất cả loại + level */}
        {currentPage === "exercise" && (
          <ExercisePage
            onNavigate={handleNavigate}
            category={pageParams?.category || "vocabulary"}
            level={pageParams?.level || "n5"}
          />
        )}

        {/* Giữ route cũ nếu cần tương thích ngược */}
        {(currentPage === "exercise-n5" ||
          currentPage === "exercise-grammar-n5" ||
          currentPage === "exercise-kanji-n5") && (
          <ExercisePage onNavigate={handleNavigate} />
        )}

        {currentPage === "kanji-selector" && (
          <KanjiSelector onNavigate={handleNavigate} />
        )}

        {/* CÁC TRANG KANJI JLPT MỚI */}
        {currentPage === "kanji-n5" && (
          <JlptKanjiN5 onNavigate={handleNavigate} />
        )}
        {currentPage === "jlpt-kanji-n5" && (
          <JlptKanjiN5 onNavigate={handleNavigate} />
        )}
        {currentPage === "jlpt-kanji-n4" && (
          <JlptKanjiN4 onNavigate={handleNavigate} />
        )}
        {currentPage === "jlpt-kanji-n3" && (
          <JlptKanjiN3 onNavigate={handleNavigate} />
        )}
        {currentPage === "jlpt-kanji-n2" && (
          <JlptKanjiN2 onNavigate={handleNavigate} />
        )}
        {currentPage === "jlpt-kanji-n1" && (
          <JlptKanjiN1 onNavigate={handleNavigate} />
        )}

        {/* Component chung cho Kanji JLPT với tham số level */}
        {currentPage === "jlpt-kanji" && (
          <JlptKanjiPage
            level={pageParams?.level || "N5"}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === "historytracking" && (
          <HistoryTracking onNavigate={handleNavigate} />
        )}
        {currentPage === "hirakata-selector" && (
          <HiraKataSelector onNavigate={handleNavigate} />
        )}

        {/* NEW: TRANG LƯU TRỮ MINI TEST CỦA USER */}
        {currentPage === "user-mini-test-submissions" && (
          <UserMiniTestSubmissions onNavigate={handleNavigate} />
        )}

        {/* Toaster – toast dễ thương toàn app */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={12}
          toastOptions={{
            duration: 5000,
            style: {
              background: "rgba(255, 255, 255, 0.9)",
              color: "#000",
              borderRadius: "24px",
              padding: "16px 24px",
              boxShadow: "0 10px 30px rgba(255, 182, 233, 0.4)",
              backdropFilter: "blur(10px)",
              border: "2px solid rgba(255, 199, 234, 0.5)",
              fontSize: "18px",
              fontWeight: "600",
            },
            success: {
              icon: "😻",
              style: {
                borderColor: "#77FFD9",
                boxShadow: "0 10px 30px rgba(119, 255, 217, 0.4)",
              },
            },
            error: {
              icon: "😿",
              style: {
                borderColor: "#FF77C2",
                boxShadow: "0 10px 30px rgba(255, 119, 194, 0.4)",
              },
            },
            loading: {
              icon: "🐱",
            },
          }}
        />

        {!isMyPage && !isUserMiniTestSubmissions && <Footer />}
      </div>
    </div>
  );
}

export function AppShell() {
  return <AppContent />;
}

export default AppShell;
