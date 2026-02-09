import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  MessageSquare,
  Trash2,
  Bell,
  User,
  BookOpen,
  Star,
  RefreshCw,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Square,
  Home,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { AdminTestDetailModal } from "../../components/Admin/AdminTestDetailModal";
import { CorrectAnswersModal } from "../../components/Admin/CorrectAnswersModal";

interface TestAnswer {
  questionId: number;
  userAnswer: string;
  isCorrect?: boolean;
  correctAnswer?: string;
  allCorrectAnswers?: string;
  subQuestionIndex: number;
  points?: number;
  maxPoints?: number;
  explanation?: string;
  questionType?: string;
  questionText?: string;
  originalAnswer?: string;
}

interface UserTest {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  lessonId: number;
  lessonTitle?: string;
  score?: number | null;
  status: "pending" | "feedbacked";
  feedback: string | null;
  feedbackAt: string | null;
  submittedAt: string;
  answers?: TestAnswer[];
  timeSpent?: number;
}

interface TestManagementPageProps {
  onNavigate: (
    page: string,
    params?: { category?: string; level?: string },
  ) => void;
}

export function TestManagementPage({ onNavigate }: TestManagementPageProps) {
  const { user } = useAuth();
  const [tests, setTests] = useState<UserTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<UserTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<UserTest | null>(null);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "feedbacked">(
    "pending",
  );
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userInfoMap, setUserInfoMap] = useState<
    Record<number, { name: string; email: string }>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [scoringModalPos, setScoringModalPos] = useState({ x: 50, y: 50 });
  const [answersModalPos, setAnswersModalPos] = useState({ x: 550, y: 50 });

  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      onNavigate("login");
      return;
    }
    if (user.role !== "ADMIN") {
      toast.error("Bạn không có quyền truy cập trang quản trị. 😿");
      onNavigate("landing");
      return;
    }
    fetchTests();
    fetchUnreadCount();
  }, [user, onNavigate]);

  useEffect(() => {
    let filtered = tests;

    if (filter === "pending") {
      filtered = filtered.filter((t) => t.status === "pending");
    } else if (filter === "feedbacked") {
      filtered = filtered.filter((t) => t.status === "feedbacked");
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (test) =>
          test.userName?.toLowerCase().includes(searchLower) ||
          test.userEmail?.toLowerCase().includes(searchLower) ||
          test.lessonTitle?.toLowerCase().includes(searchLower) ||
          test.lessonId.toString().includes(search),
      );
    }

    setFilteredTests(filtered);
    setCurrentPage(1);
  }, [tests, filter, search]);

  useEffect(() => {
    setSelectedTests([]);
    setIsSelectAll(false);
  }, [filteredTests]);

  const fetchUserInfo = async (userIds: number[]) => {
    try {
      const uniqueIds = [...new Set(userIds)];
      const userPromises = uniqueIds.map((id) =>
        api.get(`/admin/users/${id}`).catch(() => null),
      );

      const responses = await Promise.all(userPromises);
      const userMap: Record<number, { name: string; email: string }> = {};

      responses.forEach((res, index) => {
        if (res && res.data) {
          userMap[uniqueIds[index]] = {
            name:
              res.data.data?.fullName ||
              res.data.data?.username ||
              `User ${uniqueIds[index]}`,
            email: res.data.data?.email || "N/A",
          };
        }
      });

      setUserInfoMap((prev) => ({ ...prev, ...userMap }));
    } catch (error) {}
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/mini-test/submissions");

      let backendData: any[] = [];
      if (response.data.data && Array.isArray(response.data.data)) {
        backendData = response.data.data;
      } else if (Array.isArray(response.data)) {
        backendData = response.data;
      }

      const mappedTests: UserTest[] = backendData.map((item: any) => {
        let answers: TestAnswer[] = [];

        if (item.answers) {
          try {
            if (typeof item.answers === "string") {
              const parsed = JSON.parse(item.answers);
              const testAnswers: TestAnswer[] = [];

              Object.entries(parsed).forEach(
                ([questionIdStr, answerValues]) => {
                  const questionId = parseInt(questionIdStr);
                  if (Array.isArray(answerValues)) {
                    answerValues.forEach((value: any, index: number) => {
                      testAnswers.push({
                        questionId,
                        userAnswer: String(value),
                        subQuestionIndex: index,
                        originalAnswer: JSON.stringify(value),
                      });
                    });
                  } else {
                    testAnswers.push({
                      questionId,
                      userAnswer: String(answerValues),
                      subQuestionIndex: 0,
                      originalAnswer: String(answerValues),
                    });
                  }
                },
              );

              answers = testAnswers;
            } else if (Array.isArray(item.answers)) {
              answers = item.answers.map((ans: any, index: number) => ({
                questionId: ans.questionId || ans.question_id || index + 1,
                userAnswer:
                  ans.userAnswer ||
                  ans.user_answer ||
                  ans.answer ||
                  String(ans),
                isCorrect: ans.isCorrect || ans.is_correct || undefined,
                correctAnswer:
                  ans.correctAnswer || ans.correct_answer || undefined,
                subQuestionIndex: ans.subQuestionIndex || 0,
                originalAnswer: JSON.stringify(ans),
              }));
            } else if (typeof item.answers === "object") {
              const testAnswers: TestAnswer[] = [];
              Object.entries(item.answers).forEach(
                ([questionIdStr, answerValues]) => {
                  const questionId = parseInt(questionIdStr);
                  if (Array.isArray(answerValues)) {
                    answerValues.forEach((value: any, index: number) => {
                      testAnswers.push({
                        questionId,
                        userAnswer: String(value),
                        subQuestionIndex: index,
                        originalAnswer: JSON.stringify(value),
                      });
                    });
                  } else {
                    testAnswers.push({
                      questionId,
                      userAnswer: String(answerValues),
                      subQuestionIndex: 0,
                      originalAnswer: String(answerValues),
                    });
                  }
                },
              );
              answers = testAnswers;
            }
          } catch (e) {}
        }

        let status: "pending" | "feedbacked" = "pending";
        if (item.status) {
          const statusStr = String(item.status).toLowerCase();
          if (statusStr === "feedbacked") {
            status = "feedbacked";
          } else if (statusStr === "pending") {
            status = "pending";
          } else {
            status =
              item.feedback || item.score !== null ? "feedbacked" : "pending";
          }
        } else {
          status =
            item.feedback || item.score !== null ? "feedbacked" : "pending";
        }

        return {
          id: item.id,
          userId: item.userId || item.user_id,
          userName:
            item.userName ||
            item.user_name ||
            `User ${item.userId || item.user_id}`,
          userEmail: item.userEmail || item.user_email || "N/A",
          lessonId: item.lessonId || item.lesson_id,
          lessonTitle:
            item.lessonTitle ||
            item.lesson_title ||
            `Bài ${item.lessonId || item.lesson_id}`,
          score: item.score !== undefined ? item.score : null,
          status,
          feedback: item.feedback || item.admin_feedback || null,
          feedbackAt: item.feedbackAt || item.feedback_at || null,
          submittedAt:
            item.submittedAt ||
            item.submitted_at ||
            item.created_at ||
            new Date().toISOString(),
          answers,
          timeSpent: item.timeSpent || item.time_spent || 0,
        };
      });

      setTests(mappedTests);

      const userIds = mappedTests
        .filter((t) => !userInfoMap[t.userId])
        .map((t) => t.userId);

      if (userIds.length > 0) {
        fetchUserInfo(userIds);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Lỗi khi tải danh sách bài test",
      );
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/admin/mini-test/pending-count");
      setUnreadCount(response.data.count || response.data || 0);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  const handleSelectTest = (testId: number) => {
    setSelectedTests((prev) => {
      if (prev.includes(testId)) {
        const newSelected = prev.filter((id) => id !== testId);
        setIsSelectAll(false);
        return newSelected;
      } else {
        const newSelected = [...prev, testId];
        if (newSelected.length === paginatedTests.length) {
          setIsSelectAll(true);
        }
        return newSelected;
      }
    });
  };

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedTests([]);
      setIsSelectAll(false);
    } else {
      const currentPageIds = paginatedTests.map((test) => test.id);
      setSelectedTests(currentPageIds);
      setIsSelectAll(true);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedTests.length === 0) {
      toast.error("Hãy chọn ít nhất 1 bài test để xóa. 😿");
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc muốn xóa ${selectedTests.length} bài test đã chọn? Hành động này không thể hoàn tác.`,
      )
    ) {
      return;
    }

    try {
      setIsBatchDeleting(true);

      const response = await api.post("/admin/mini-test/batch-delete", {
        ids: selectedTests,
      });

      if (response.data.success) {
        const successCount = response.data.successCount || 0;
        const failedCount = response.data.failedCount || 0;

        if (successCount > 0) {
          const successIds = response.data.successIds || [];
          setTests((prevTests) =>
            prevTests.filter((test) => !successIds.includes(test.id)),
          );
          setFilteredTests((prevTests) =>
            prevTests.filter((test) => !successIds.includes(test.id)),
          );

          setSelectedTests((prev) =>
            prev.filter((id) => !successIds.includes(id)),
          );
        }

        if (successCount > 0 && failedCount === 0) {
          toast.success(`Đã xóa thành công ${successCount} bài test`);
        } else if (successCount > 0 && failedCount > 0) {
          toast.success(
            `Đã xóa thành công ${successCount} bài test, ${failedCount} bài không thể xóa`,
          );
        } else {
          toast.error("Không thể xóa các bài test này. Vui lòng thử lại sau. 😿");
        }

        await fetchUnreadCount();
      } else {
        toast.error(
          response.data.message || "Có lỗi xảy ra khi xóa nhiều bài test",
        );
      }
    } catch (error: any) {
      toast.error("Lỗi khi xóa hàng loạt bài test. 😿");
      fetchTests();
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleDeleteTest = async (testId: number) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa bài test này? Hành động này không thể hoàn tác.",
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(
        `/admin/mini-test/submission/${testId}`,
      );

      if (response.data && response.data.success === true) {
        setTests((prevTests) => prevTests.filter((test) => test.id !== testId));
        setFilteredTests((prevTests) =>
          prevTests.filter((test) => test.id !== testId),
        );

        setSelectedTests((prev) => prev.filter((id) => id !== testId));

        if (selectedTest && selectedTest.id === testId) {
          setSelectedTest(null);
          setShowScoringModal(false);
          setShowAnswersModal(false);
        }

        await fetchUnreadCount();

        toast.success(response.data.message || "Đã xóa bài test thành công!");
      } else {
        throw new Error(
          response.data?.message || "Xóa thất bại (không rõ lý do)",
        );
      }
    } catch (error: any) {
      toast.error("Lỗi khi xóa bài test. 😿");
      fetchTests();
    }
  };

  const handleReviewTest = (test: UserTest) => {
    setSelectedTest(test);
    setShowScoringModal(true);
    setShowAnswersModal(false);
    setScoringModalPos({ x: 50, y: 50 });
    setAnswersModalPos({ x: 550, y: 50 });
  };

  const handleSubmitFeedback = async (
    testId: number,
    feedback: string,
    score: number,
  ) => {
    try {
      const payload: any = {
        feedback: feedback.trim(),
        score: score,
      };

      await api.post(`/admin/mini-test/submission/${testId}/feedback`, payload);

      try {
        await api.post("/notifications", {
          user_id: selectedTest?.userId,
          type: "test_reviewed",
          title: `Phản hồi bài Mini Test - Bài ${selectedTest?.lessonId}`,
          message: `Giáo viên đã chấm điểm bài test của bạn: ${payload.score} điểm. Hãy kiểm tra phản hồi chi tiết!`,
          related_id: testId,
        });
      } catch (notifError) {}

      fetchTests();
      fetchUnreadCount();
      toast.success(
        `Đã gửi phản hồi và chấm điểm ${payload.score} thành công!`,
      );
      return Promise.resolve();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi gửi phản hồi",
      );
      return Promise.reject(error);
    }
  };

  const exportToCSV = () => {
    const BOM = "\uFEFF";

    const headers = [
      "ID",
      "Học viên",
      "Email",
      "Bài học",
      "Điểm",
      "Trạng thái",
      "Thời gian nộp",
      "Thời gian phản hồi",
      "Thời gian làm bài (phút)",
    ];

    const data = filteredTests.map((test) => [
      test.id,
      test.userName || `User ${test.userId}`,
      test.userEmail || "N/A",
      test.lessonTitle || `Bài ${test.lessonId}`,
      test.score !== null && test.score !== undefined
        ? test.score.toString().replace(".", ",")
        : "Chưa chấm",
      test.status === "pending" ? "Chờ duyệt" : "Đã phản hồi",
      formatDateForCSV(test.submittedAt),
      test.feedbackAt ? formatDateForCSV(test.feedbackAt) : "Chưa phản hồi",
      test.timeSpent ? Math.round(test.timeSpent / 60) : "0",
    ]);

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        row
          .map((cell) => {
            if (
              typeof cell === "string" &&
              (cell.includes(",") || cell.includes("\n") || cell.includes('"'))
            ) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return `"${cell}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const now = new Date();
    const dateStr = now.toLocaleDateString("vi-VN").replace(/\//g, "-");
    const timeStr = now.toLocaleTimeString("vi-VN").replace(/:/g, "-");
    a.download = `bai-test-${dateStr}_${timeStr}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Đã xuất file CSV thành công!");
  };

  const formatDateForCSV = (dateString: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTests = filteredTests.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="test-management-page">
      {(showScoringModal || showAnswersModal) && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowScoringModal(false);
            setShowAnswersModal(false);
          }}
        />
      )}

      <div className="page-container">
        <header className="page-header">
          <div className="header-content">
            <div className="header-left">
              <button
                className="back-button"
                onClick={() => onNavigate("landing")}
              >
                <Home size={20} />
                <span>Trang chính</span>
              </button>
            </div>
            <div className="header-center">
              <h1 className="page-title">Quản lý Mini Test</h1>
              <p className="page-subtitle">
                Xem và phản hồi bài test của học viên
              </p>
            </div>
            <div className="header-actions">
              {selectedTests.length > 0 && (
                <button
                  className="batch-delete-button"
                  onClick={handleBatchDelete}
                  disabled={isBatchDeleting}
                >
                  <Trash2 size={16} />
                  {isBatchDeleting
                    ? `Đang xóa...`
                    : `Xóa (${selectedTests.length})`}
                </button>
              )}
              <button className="export-button" onClick={exportToCSV}>
                <Download size={16} />
                Xuất CSV
              </button>
              <button className="refresh-button" onClick={fetchTests}>
                <RefreshCw size={16} />
                Làm mới
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-content">
                <div>
                  <p className="stat-label">Tổng bài nộp</p>
                  <p className="stat-value">{tests.length}</p>
                </div>
                <div className="stat-icon">
                  <BookOpen size={24} />
                </div>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-content">
                <div>
                  <p className="stat-label">Chờ duyệt</p>
                  <p className="stat-value">
                    {tests.filter((t) => t.status === "pending").length}
                  </p>
                </div>
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
              </div>
            </div>
            <div className="stat-card reviewed">
              <div className="stat-content">
                <div>
                  <p className="stat-label">Đã duyệt</p>
                  <p className="stat-value">
                    {tests.filter((t) => t.status === "feedbacked").length}
                  </p>
                </div>
                <div className="stat-icon">
                  <CheckCircle size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="controls-section">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                Tất cả ({tests.length})
              </button>
              <button
                className={`filter-tab ${filter === "pending" ? "active" : ""}`}
                onClick={() => setFilter("pending")}
              >
                <Clock size={14} />
                Chờ duyệt ({tests.filter((t) => t.status === "pending").length})
              </button>
              <button
                className={`filter-tab ${filter === "feedbacked" ? "active" : ""}`}
                onClick={() => setFilter("feedbacked")}
              >
                <CheckCircle size={14} />
                Đã phản hồi (
                {tests.filter((t) => t.status === "feedbacked").length})
              </button>
            </div>
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Tìm theo tên học viên, email hoặc bài học..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </header>

        <main className="main-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Đang tải danh sách bài test...</p>
            </div>
          ) : filteredTests.length > 0 ? (
            <>
              {selectedTests.length > 0 && (
                <div className="selection-info-bar">
                  <div className="selection-info-content">
                    <span className="selected-count">
                      Đã chọn: {selectedTests.length} bài test
                    </span>
                    <button
                      className="clear-selection"
                      onClick={() => setSelectedTests([])}
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>
              )}

              <div className="table-container">
                <table className="tests-table">
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>
                        <div
                          className="checkbox-header"
                          onClick={handleSelectAll}
                        >
                          {isSelectAll ? (
                            <Check size={16} />
                          ) : (
                            <Square size={16} />
                          )}
                        </div>
                      </th>
                      <th>Học viên</th>
                      <th>Bài học</th>
                      <th>Điểm</th>
                      <th>Trạng thái</th>
                      <th>Thời gian nộp</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTests.map((test) => {
                      const userInfo = userInfoMap[test.userId] || {};
                      const displayName = userInfo.name || test.userName;
                      const displayEmail = userInfo.email || test.userEmail;
                      const isSelected = selectedTests.includes(test.id);

                      return (
                        <tr
                          key={test.id}
                          className={isSelected ? "selected-row" : ""}
                        >
                          <td>
                            <div
                              className="test-checkbox"
                              onClick={() => handleSelectTest(test.id)}
                            >
                              {isSelected ? (
                                <Check size={16} />
                              ) : (
                                <Square size={16} />
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">
                                <User size={16} />
                              </div>
                              <div>
                                <p className="user-name">{displayName}</p>
                                <p className="user-email">{displayEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="lesson-cell">
                              <BookOpen size={14} />
                              <span>Bài {test.lessonId}</span>
                              <span className="lesson-title">
                                {test.lessonTitle}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div
                              className={`score-badge ${
                                test.score == null
                                  ? "pending"
                                  : test.score >= 7
                                    ? "good"
                                    : test.score >= 5
                                      ? "average"
                                      : "poor"
                              }`}
                            >
                              {test.score ?? "Chưa chấm"}
                            </div>
                          </td>
                          <td>
                            <div className={`status-badge ${test.status}`}>
                              {test.status === "pending" ? (
                                <>
                                  <Clock size={12} />
                                  Chờ duyệt
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={12} />
                                  Đã phản hồi
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="time-cell">
                              <div className="date">
                                {new Date(test.submittedAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </div>
                              <div className="time">
                                {new Date(test.submittedAt).toLocaleTimeString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="review-button"
                                onClick={() => handleReviewTest(test)}
                                title="Chấm điểm"
                              >
                                <MessageSquare size={16} />
                              </button>
                              <button
                                className="delete-button"
                                onClick={() => handleDeleteTest(test.id)}
                                title="Xóa bài test"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        className={`pagination-page ${currentPage === pageNum ? "active" : ""}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    className="pagination-button"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <AlertCircle size={48} />
              <h3>Không tìm thấy bài test nào</h3>
              <p>
                {search
                  ? "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm"
                  : "Học viên chưa nộp bài test nào cho các bài học ngữ pháp"}
              </p>
              {search && (
                <button className="clear-search" onClick={() => setSearch("")}>
                  Xóa bộ lọc tìm kiếm
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showScoringModal && (
        <AdminTestDetailModal
          test={selectedTest}
          isOpen={showScoringModal}
          onClose={() => setShowScoringModal(false)}
          onSubmitFeedback={handleSubmitFeedback}
          onDeleteTest={handleDeleteTest}
          onShowCorrectAnswers={() => setShowAnswersModal(true)}
          position={scoringModalPos}
          onPositionChange={setScoringModalPos}
        />
      )}

      {showAnswersModal && selectedTest && (
        <CorrectAnswersModal
          lessonId={selectedTest.lessonId}
          isOpen={showAnswersModal}
          onClose={() => setShowAnswersModal(false)}
          position={answersModalPos}
          onPositionChange={setAnswersModalPos}
        />
      )}

      <style>{`
        .test-management-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
          padding: 1.5rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }

        .page-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .header-left {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }

        .header-center {
          flex: 1;
          text-align: center;
        }

        .header-right {
          flex: 0 0 auto;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          background: #10b981;
          color: white;
        }

        .back-button:hover {
          background: #059669;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .page-subtitle {
          color: #6b7280;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .batch-delete-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          background: #dc2626;
          color: white;
        }

        .batch-delete-button:hover:not(:disabled) {
          background: #b91c1c;
        }

        .batch-delete-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .export-button,
        .refresh-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .export-button {
          background: #374151;
          color: white;
        }

        .export-button:hover {
          background: #4b5563;
        }

        .refresh-button {
          background: #3b82f6;
          color: white;
        }

        .refresh-button:hover {
          background: #2563eb;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid;
        }

        .stat-card.total {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-color: #bfdbfe;
        }

        .stat-card.pending {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border-color: #fde68a;
        }

        .stat-card.reviewed {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-color: #bbf7d0;
        }

        .stat-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .stat-card.total .stat-label {
          color: #2563eb;
        }

        .stat-card.pending .stat-label {
          color: #d97706;
        }

        .stat-card.reviewed .stat-label {
          color: #059669;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .stat-icon {
          color: rgba(0, 0, 0, 0.1);
        }

        .stat-card.total .stat-icon {
          color: #3b82f6;
        }

        .stat-card.pending .stat-icon {
          color: #f59e0b;
        }

        .stat-card.reviewed .stat-icon {
          color: #10b981;
        }

        .controls-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 0.75rem;
        }

        .filter-tab {
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          background: transparent;
          color: #6b7280;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-tab.active {
          background: white;
          color: #1f2937;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .filter-tab:hover:not(.active) {
          background: rgba(255, 255, 255, 0.5);
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          width: 1.25rem;
          height: 1.25rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          background: white;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .main-content {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .selection-info-bar {
          background: linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%);
          padding: 0.75rem 1.5rem;
          border-bottom: 1px solid #93c5fd;
        }

        .selection-info-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .selected-count {
          font-weight: 600;
          color: #1e40af;
        }

        .clear-selection {
          background: transparent;
          border: 1px solid #3b82f6;
          color: #3b82f6;
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-selection:hover {
          background: #3b82f6;
          color: white;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: #6b7280;
        }

        .loading-container .spinner {
          width: 3rem;
          height: 3rem;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .table-container {
          overflow-x: auto;
        }

        .tests-table {
          width: 100%;
          border-collapse: collapse;
        }

        .tests-table thead {
          background: #f9fafb;
        }

        .tests-table th {
          padding: 1rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
          cursor: default;
        }

        .tests-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.15s;
        }

        .tests-table tbody tr:hover {
          background: #f9fafb;
        }

        .tests-table tbody tr.selected-row {
          background: #eff6ff;
        }

        .tests-table tbody tr.selected-row:hover {
          background: #dbeafe;
        }

        .tests-table td {
          padding: 1rem 1.5rem;
          font-size: 0.875rem;
        }

        .checkbox-header {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          cursor: pointer;
          color: #6b7280;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .checkbox-header:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .test-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          cursor: pointer;
          color: #6b7280;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .test-checkbox:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .test-checkbox svg {
          pointer-events: none;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .user-name {
          font-weight: 500;
          color: #1f2937;
          margin: 0 0 0.125rem 0;
        }

        .user-email {
          color: #6b7280;
          font-size: 0.75rem;
          margin: 0;
        }

        .lesson-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #4b5563;
        }

        .lesson-title {
          color: #9ca3af;
          font-size: 0.75rem;
        }

        .score-badge {
          display: inline-block;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          min-width: 60px;
          text-align: center;
        }

        .score-badge.pending {
          background: #f3f4f6;
          color: #6b7280;
        }

        .score-badge.good {
          background: #dcfce7;
          color: #166534;
        }

        .score-badge.average {
          background: #fef3c7;
          color: #92400e;
        }

        .score-badge.poor {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.pending {
          background: #fffbeb;
          color: #92400e;
        }

        .status-badge.feedbacked {
          background: #f0fdf4;
          color: #166534;
        }

        .time-cell {
          color: #6b7280;
        }

        .date {
          font-weight: 500;
        }

        .time {
          font-size: 0.75rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .review-button,
        .delete-button {
          padding: 0.5rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .review-button {
          background: #dbeafe;
          color: #2563eb;
        }

        .review-button:hover {
          background: #bfdbfe;
        }

        .delete-button {
          background: #fee2e2;
          color: #dc2626;
        }

        .delete-button:hover {
          background: #fecaca;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .pagination-button,
        .pagination-page {
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 2.5rem;
          text-align: center;
        }

        .pagination-button:hover:not(:disabled),
        .pagination-page:hover:not(.active) {
          background: #f3f4f6;
        }

        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-page.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          color: #6b7280;
        }

        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin: 1rem 0 0.5rem 0;
        }

        .empty-state p {
          margin: 0 0 1rem 0;
          max-width: 24rem;
        }

        .clear-search {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border-radius: 0.5rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .clear-search:hover {
          background: #2563eb;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .controls-section {
            flex-direction: column;
          }
          
          .search-box {
            max-width: 100%;
          }

          .header-actions {
            flex-wrap: wrap;
          }

          .batch-delete-button,
          .export-button,
          .refresh-button,
          .back-button {
            font-size: 0.75rem;
            padding: 0.5rem 0.75rem;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
          }

          .header-left,
          .header-center,
          .header-actions {
            width: 100%;
            justify-content: center;
          }

          .back-button {
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
