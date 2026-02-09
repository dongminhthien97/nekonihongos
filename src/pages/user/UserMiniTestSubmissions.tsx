// src/pages/User/UserMiniTestSubmissions.tsx
import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  Eye,
  Trash2,
  FileText,
  AlertCircle,
  Search,
  RefreshCw,
  MessageSquare,
  Grid,
  List,
  BarChart,
  Home,
  X,
} from "lucide-react";

interface Submission {
  id: number;
  lesson_id: number;
  lesson_title: string;
  answers: { question_id: number; user_answer: string }[];
  submitted_at: string;
  feedback: string | null;
  feedback_at: string | null;
  status: "pending" | "feedbacked" | "reviewed";
  score?: number;
  total_questions?: number;
  time_spent?: number;
}

export function UserMiniTestSubmissions({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [errorModal, setErrorModal] = useState({
    open: false,
    message: "",
    title: "",
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setDebugInfo("Đang tải dữ liệu...");

      const res = await api.get("/user/mini-test/submissions");

      let rawData: any[] = [];

      if (Array.isArray(res.data)) {
        rawData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        rawData = res.data.data;
      } else if (res.data?.success && Array.isArray(res.data.data)) {
        rawData = res.data.data;
      } else if (res.data && typeof res.data === "object") {
        const keys = Object.keys(res.data);
        const arrayKey = keys.find((key) => Array.isArray(res.data[key]));
        if (arrayKey) {
          rawData = res.data[arrayKey];
        } else {
          rawData = [res.data];
        }
      }

      const normalized = rawData
        .map((s: any, index: number) => {
          let answers: { question_id: number; user_answer: string }[] = [];

          if (s.answers) {
            if (Array.isArray(s.answers)) {
              answers = s.answers
                .filter((ans: any) => ans != null)
                .map((ans: any) => ({
                  question_id: Number(ans.question_id || ans.questionId || 0),
                  user_answer: String(
                    ans.user_answer ||
                      ans.userAnswer ||
                      ans.answer ||
                      ans ||
                      "",
                  ),
                }))
                .filter((ans: { question_id: number }) => ans.question_id > 0);
            } else if (typeof s.answers === "string") {
              try {
                const parsed = JSON.parse(s.answers);

                if (Array.isArray(parsed)) {
                  answers = parsed
                    .filter((ans: any) => ans != null)
                    .map((ans: any) => ({
                      question_id: Number(
                        ans.question_id || ans.questionId || 0,
                      ),
                      user_answer: String(
                        ans.user_answer || ans.userAnswer || ans.answer || "",
                      ),
                    }))
                    .filter((ans) => ans.question_id > 0);
                } else if (typeof parsed === "object" && parsed !== null) {
                  answers = Object.entries(parsed)
                    .map(([key, value]: [string, any]) => {
                      let questionId = 0;
                      let userAnswer = "";

                      if (value && typeof value === "object") {
                        questionId = Number(
                          value.question_id ||
                            value.questionId ||
                            key.replace("question_", "").replace("q", ""),
                        );
                        userAnswer = String(
                          value.user_answer ||
                            value.userAnswer ||
                            value.answer ||
                            "",
                        );
                      } else {
                        questionId = Number(
                          key.replace("question_", "").replace("q", ""),
                        );
                        userAnswer = String(value || "");
                      }

                      return {
                        question_id: questionId || 0,
                        user_answer: userAnswer,
                      };
                    })
                    .filter((ans) => ans.question_id > 0);
                }
              } catch (parseError) {
                setErrorModal({
                  open: true,
                  title: "Lỗi Parse Dữ Liệu",
                  message: "Không thể phân tích dữ liệu câu trả lời từ server.",
                });
              }
            } else if (typeof s.answers === "object" && s.answers !== null) {
              answers = Object.entries(s.answers)
                .map(([key, value]: [string, any]) => {
                  let questionId = 0;
                  let userAnswer = "";

                  if (value && typeof value === "object") {
                    questionId = Number(
                      value.question_id ||
                        value.questionId ||
                        key.replace("question_", "").replace("q", ""),
                    );
                    userAnswer = String(
                      value.user_answer ||
                        value.userAnswer ||
                        value.answer ||
                        "",
                    );
                  } else {
                    questionId = Number(
                      key.replace("question_", "").replace("q", ""),
                    );
                    userAnswer = String(value || "");
                  }

                  return {
                    question_id: questionId || 0,
                    user_answer: userAnswer,
                  };
                })
                .filter((ans) => ans.question_id > 0);
            }
          }

          let lessonTitle =
            s.lesson_title ||
            s.lesson?.title ||
            s.lesson?.name ||
            `Bài ${s.lesson_id || s.lessonId || "N/A"}`;

          const submission: Submission = {
            id: s.id || s.submission_id || index + 1,
            lesson_id: s.lesson_id || s.lessonId || s.lesson?.id || 0,
            lesson_title: lessonTitle,
            answers: answers.sort((a, b) => a.question_id - b.question_id),
            submitted_at:
              s.submitted_at ||
              s.submittedAt ||
              s.created_at ||
              s.createdAt ||
              new Date().toISOString(),
            feedback: s.feedback || s.admin_feedback || null,
            feedback_at:
              s.feedback_at || s.feedbackAt || s.feedbackDate || null,
            status: (s.status || "pending") as
              | "pending"
              | "feedbacked"
              | "reviewed",
            score: s.score || s.total_score || undefined,
            total_questions:
              s.total_questions || s.question_count || answers.length || 0,
            time_spent: s.time_spent || s.timeSpent || undefined,
          };

          return submission;
        })
        .filter((s) => s.lesson_id > 0 && s.id > 0);

      setDebugInfo(`Đã tải ${normalized.length} bài nộp`);
      setSubmissions(normalized);
    } catch (err: any) {
      if (err.response) {
        setDebugInfo(`Lỗi ${err.response.status}`);
        if (err.response.status === 404) {
          setErrorModal({
            open: true,
            title: "Không tìm thấy endpoint",
            message:
              "Endpoint API không tồn tại hoặc bị lỗi. Vui lòng thử lại sau!",
          });
        } else if (err.response.status === 500) {
          setErrorModal({
            open: true,
            title: "Lỗi Server",
            message: "Lỗi server. Vui lòng thử lại sau!",
          });
        }
      } else if (err.request) {
        setDebugInfo("Không nhận được phản hồi");
        setErrorModal({
          open: true,
          title: "Lỗi Kết Nối",
          message:
            "Không thể kết nối đến server! Vui lòng kiểm tra kết nối mạng.",
        });
      } else {
        setDebugInfo(`Lỗi: ${err.message}`);
        setErrorModal({
          open: true,
          title: "Lỗi Kết Nối",
          message: "Lỗi kết nối! Vui lòng thử lại.",
        });
      }

      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.lesson_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.lesson_id.toString().includes(searchTerm);

    const matchesFilter = filterStatus === "all" || sub.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa bài nộp này?")) return;

    try {
      await api.delete(`/user/mini-test/submission/${id}`);
      toast.success("Đã xóa bài nộp!");
      fetchSubmissions();
      if (selected?.id === id) setSelected(null);
    } catch (error) {
      setErrorModal({
        open: true,
        title: "Lỗi Xóa Bài Nộp",
        message: "Không thể xóa bài nộp. Vui lòng thử lại sau!",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "feedbacked":
      case "reviewed":
        return <CheckCircle className="status-icon status-icon--checked" />;
      case "pending":
        return <Clock className="status-icon status-icon--pending" />;
      default:
        return <AlertCircle className="status-icon status-icon--unknown" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "feedbacked":
      case "reviewed":
        return "Đã chấm";
      case "pending":
        return "Chờ chấm";
      default:
        return "Không xác định";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const handleGoHome = () => {
    onNavigate("landing");
  };

  const closeErrorModal = () => {
    setErrorModal({ open: false, message: "", title: "" });
  };

  return (
    <div className="submissions-container">
      <div className="submissions-wrapper">
        {/* Header Section */}
        <div className="submissions-header">
          <div className="submissions-header-content">
            <div className="header-left-controls">
              <button
                onClick={() => onNavigate("user")}
                className="submissions-back-button"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={handleGoHome}
                className="submissions-home-button"
                title="Về trang chủ"
              >
                <Home />
              </button>
            </div>
            <div className="submissions-title-section">
              <h1 className="submissions-main-title">Bài Mini Test của tôi</h1>
              <p className="submissions-subtitle">
                Quản lý và xem kết quả các bài test đã làm
              </p>
            </div>
            <div className="submissions-view-toggle">
              <button
                onClick={() => setViewMode("grid")}
                className={`view-toggle-button ${viewMode === "grid" ? "view-toggle-button--active" : ""}`}
              >
                <Grid />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`view-toggle-button ${viewMode === "list" ? "view-toggle-button--active" : ""}`}
              >
                <List />
                List
              </button>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="submissions-filter-section">
            <div className="filter-section-content">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-controls">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="status-filter"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ chấm</option>
                  <option value="feedbacked">Đã chấm</option>
                  <option value="reviewed">Đã xem xét</option>
                </select>
                <button onClick={fetchSubmissions} className="refresh-button">
                  <RefreshCw />
                  Làm mới
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Đang tải bài nộp...</p>
            {debugInfo && <p className="loading-debug">{debugInfo}</p>}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper stat-icon--total">
                  <FileText className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{submissions.length}</div>
                  <div className="stat-label">Tổng bài nộp</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper stat-icon--graded">
                  <CheckCircle className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {
                      submissions.filter(
                        (s) =>
                          s.status === "feedbacked" || s.status === "reviewed",
                      ).length
                    }
                  </div>
                  <div className="stat-label">Đã chấm</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper stat-icon--pending">
                  <Clock className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {submissions.filter((s) => s.status === "pending").length}
                  </div>
                  <div className="stat-label">Chờ chấm</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper stat-icon--average">
                  <BarChart className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {submissions.filter((s) => s.score).length > 0
                      ? (
                          submissions.reduce(
                            (acc, s) => acc + (s.score || 0),
                            0,
                          ) / submissions.filter((s) => s.score).length
                        ).toFixed(1)
                      : "0.0"}
                  </div>
                  <div className="stat-label">Điểm TB</div>
                </div>
              </div>
            </div>

            {/* Submissions Content */}
            {filteredSubmissions.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-state-icon" />
                <p className="empty-state-title">Không tìm thấy bài nộp nào</p>
                <p className="empty-state-description">
                  {searchTerm
                    ? "Thử tìm kiếm với từ khóa khác"
                    : submissions.length === 0
                      ? "Bạn chưa có bài nộp nào. Hãy làm bài test đềEbắt đầu!"
                      : "Không có bài nộp nào phù hợp với bộ lọc"}
                </p>
                <button
                  onClick={fetchSubmissions}
                  className="empty-state-button"
                >
                  Thử tải lại
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="submissions-grid">
                {filteredSubmissions.map((sub) => (
                  <div key={sub.id} className="submission-card">
                    <div className="submission-card-content">
                      <div className="submission-header">
                        <div className="submission-title-section">
                          <span className="lesson-badge">
                            Bài {sub.lesson_id}
                          </span>
                          <h3 className="lesson-title">{sub.lesson_title}</h3>
                        </div>
                        <div className="submission-status">
                          {getStatusIcon(sub.status)}
                          <span className="status-text">
                            {getStatusText(sub.status)}
                          </span>
                        </div>
                      </div>

                      <div className="submission-details">
                        <div className="detail-row">
                          <span className="detail-label">Ngày nộp:</span>
                          <span className="detail-value">
                            {formatDate(sub.submitted_at)}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">SềEcâu:</span>
                          <span className="detail-value">
                            {sub.total_questions}
                          </span>
                        </div>
                        {sub.time_spent && (
                          <div className="detail-row">
                            <span className="detail-label">Thời gian:</span>
                            <span className="detail-value">
                              {Math.floor(sub.time_spent / 60)}:
                              {String(sub.time_spent % 60).padStart(2, "0")}
                            </span>
                          </div>
                        )}
                        {sub.score !== undefined && (
                          <div className="detail-row">
                            <span className="detail-label">Điểm:</span>
                            <span
                              className={`score-value ${sub.score >= 5 ? "score-pass" : "score-fail"}`}
                            >
                              {sub.score}/{sub.total_questions}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="submission-actions">
                        <button
                          onClick={() => setSelected(sub)}
                          className="view-detail-button"
                        >
                          <Eye />
                          Xem chi tiết ({sub.answers.length} câu)
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="delete-button"
                          title="Xóa bài nộp"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="submissions-table-container">
                <table className="submissions-table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Bài học</th>
                      <th className="table-header-cell">Trạng thái</th>
                      <th className="table-header-cell">Điểm</th>
                      <th className="table-header-cell">Ngày nộp</th>
                      <th className="table-header-cell">SềEcâu</th>
                      <th className="table-header-cell">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="table-row">
                        <td className="table-cell">
                          <div className="lesson-cell">
                            <div className="lesson-number">
                              Bài {sub.lesson_id}
                            </div>
                            <div className="lesson-name">
                              {sub.lesson_title}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="status-cell">
                            {getStatusIcon(sub.status)}
                            {getStatusText(sub.status)}
                          </div>
                        </td>
                        <td className="table-cell">
                          {sub.score !== undefined ? (
                            <span
                              className={`table-score ${sub.score >= 5 ? "score-pass" : "score-fail"}`}
                            >
                              {sub.score}/{sub.total_questions}
                            </span>
                          ) : (
                            <span className="no-score">--</span>
                          )}
                        </td>
                        <td className="table-cell">
                          {formatDate(sub.submitted_at)}
                        </td>
                        <td className="table-cell">
                          <span className="answer-count">
                            {sub.answers.length}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="action-buttons">
                            <button
                              onClick={() => setSelected(sub)}
                              className="view-button"
                            >
                              Xem
                            </button>
                            <button
                              onClick={() => handleDelete(sub.id)}
                              className="delete-table-button"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Error Modal */}
      {errorModal.open && (
        <div className="error-modal-overlay">
          <div className="error-modal">
            <div className="error-modal-header">
              <AlertCircle className="error-modal-icon" />
              <h3 className="error-modal-title">{errorModal.title}</h3>
              <button onClick={closeErrorModal} className="error-modal-close">
                <X />
              </button>
            </div>
            <div className="error-modal-body">
              <p>{errorModal.message}</p>
            </div>
            <div className="error-modal-footer">
              <button onClick={closeErrorModal} className="error-modal-button">
                Đóng
              </button>
              <button
                onClick={() => {
                  closeErrorModal();
                  fetchSubmissions();
                }}
                className="error-modal-button retry"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="detail-modal-overlay">
          <div className="detail-modal">
            <div className="modal-header">
              <div className="modal-title-section">
                <h2 className="modal-title">
                  Bài {selected.lesson_id}: {selected.lesson_title}
                </h2>
                <div className="modal-subtitle">
                  <p>Nộp ngày: {formatDate(selected.submitted_at)}</p>
                  {selected.time_spent && (
                    <p>
                      Thời gian làm bài: {Math.floor(selected.time_spent / 60)}{" "}
                      phút {selected.time_spent % 60} giây
                    </p>
                  )}
                  <p>Trạng thái: {getStatusText(selected.status)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="modal-close-button"
              >
                ✁E
              </button>
            </div>

            <div className="modal-content">
              {/* Answers Section */}
              <div className="answers-section">
                <div className="section-header">
                  <h3 className="section-title">Câu trả lời của bạn</h3>
                  <span className="section-count">
                    {selected.answers.length} câu hỏi
                  </span>
                </div>
                {selected.answers.length === 0 ? (
                  <div className="empty-answers">
                    <AlertCircle className="empty-answers-icon" />
                    <p>Không có câu trả lời nào được ghi nhận</p>
                    <p className="empty-notes">Có thể do:</p>
                    <ul className="empty-reasons">
                      <li>• Backend chưa xử lý đúng dữ liệu answers</li>
                      <li>• Dữ liệu answers trong database bị lỗi</li>
                      <li>• Frontend không parse được format của answers</li>
                    </ul>
                  </div>
                ) : (
                  <div className="answers-list">
                    {selected.answers.map((answer, index) => (
                      <div key={index} className="answer-item">
                        <div className="answer-header">
                          <div className="answer-info">
                            <span className="question-number">
                              Câu {answer.question_id}
                            </span>
                            <span className="question-index">#{index + 1}</span>
                          </div>
                          <span className="question-id">
                            ID: {answer.question_id}
                          </span>
                        </div>
                        <div className="answer-content">
                          {answer.user_answer || "(Không có câu trả lời)"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback Section */}
              {selected.feedback && (
                <div className="feedback-section">
                  <h3 className="section-title">Phản hồi từ giáo viên</h3>
                  <div className="feedback-content">
                    <div className="feedback-header">
                      <MessageSquare className="feedback-icon" />
                      <div className="feedback-details">
                        {selected.feedback_at && (
                          <p className="feedback-date">
                            Ngày feedback: {formatDate(selected.feedback_at)}
                          </p>
                        )}
                        <div className="feedback-text">{selected.feedback}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Section */}
              <div className="modal-actions">
                <div className="action-buttons-group">
                  <button
                    onClick={() => {
                      if (confirm("Bạn có chắc muốn xóa bài nộp này?")) {
                        handleDelete(selected.id);
                      }
                    }}
                    className="modal-delete-button"
                  >
                    <Trash2 />
                    Xóa bài nộp
                  </button>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="modal-close-action"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Global Styles */
        .submissions-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 1rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .submissions-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Header Controls */
        .header-left-controls {
          display: flex;
          gap: 0.5rem;
        }

        .submissions-home-button {
          padding: 0.75rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .submissions-home-button:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px) scale(1.05);
          background: #667eea;
          color: white;
        }

        .submissions-home-button svg {
          width: 24px;
          height: 24px;
          color: #4b5563;
          transition: color 0.3s ease;
        }

        .submissions-home-button:hover svg {
          color: white;
        }

        /* Loading State */
        .loading-state {
          text-align: center;
          padding: 6rem 2rem;
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          animation: fadeIn 0.6s ease;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 1.25rem;
          color: #4b5563;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .loading-debug {
          color: #9ca3af;
          font-size: 0.875rem;
          font-family: 'SF Mono', monospace;
          background: #f3f4f6;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          display: inline-block;
        }

        /* Header Section */
        .submissions-header {
          margin-bottom: 2rem;
          animation: fadeIn 0.6s ease;
        }

        .submissions-header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .submissions-back-button {
          padding: 0.75rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .submissions-back-button:hover {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px) scale(1.05);
        }

        .submissions-back-button svg {
          width: 24px;
          height: 24px;
          color: #4b5563;
          transition: color 0.3s ease;
        }

        .submissions-back-button:hover svg {
          color: #7c3aed;
        }

        .submissions-title-section {
          flex: 1;
          min-width: 300px;
        }

        .submissions-main-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 0.5rem;
          line-height: 1.2;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .submissions-subtitle {
          color: #6b7280;
          font-size: 1rem;
          font-weight: 500;
        }

        .submissions-view-toggle {
          display: flex;
          gap: 0.5rem;
          background: white;
          padding: 0.25rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .view-toggle-button {
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .view-toggle-button:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
        }

        .view-toggle-button--active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .view-toggle-button svg {
          width: 16px;
          height: 16px;
        }

        /* Filter Section */
        .submissions-filter-section {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          margin-bottom: 1.5rem;
          animation: slideUp 0.7s ease;
        }

        .filter-section-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .filter-section-content {
            flex-direction: row;
            align-items: center;
          }
        }

        .search-container {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #9ca3af;
          z-index: 2;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 0.9375rem;
          outline: none;
          transition: all 0.3s ease;
          background: #f9fafb;
        }

        .search-input:focus {
          border-color: #7c3aed;
          background: white;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
        }

        .filter-controls {
          display: flex;
          gap: 0.75rem;
        }

        .status-filter {
          padding: 0.875rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
          font-size: 0.9375rem;
          color: #374151;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 160px;
        }

        .status-filter:focus {
          outline: none;
          border-color: #7c3aed;
          background: white;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
        }

        .refresh-button {
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .refresh-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .refresh-button:active {
          transform: translateY(0);
        }

        .refresh-button svg {
          width: 16px;
          height: 16px;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.25rem;
          margin-bottom: 2rem;
          animation: slideUp 0.8s ease;
        }

        @media (min-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 1.75rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-card:nth-child(1) { --gradient-start: #667eea; --gradient-end: #764ba2; }
        .stat-card:nth-child(2) { --gradient-start: #10b981; --gradient-end: #059669; }
        .stat-card:nth-child(3) { --gradient-start: #f59e0b; --gradient-end: #d97706; }
        .stat-card:nth-child(4) { --gradient-start: #3b82f6; --gradient-end: #1d4ed8; }

        .stat-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-icon--total {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
          color: #667eea;
        }

        .stat-icon--graded {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15));
          color: #10b981;
        }

        .stat-icon--pending {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
          color: #f59e0b;
        }

        .stat-icon--average {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(29, 78, 216, 0.15));
          color: #3b82f6;
        }

        .stat-icon {
          width: 28px;
          height: 28px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.375rem;
          font-feature-settings: "tnum";
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-value {
          transform: translateY(-2px);
        }

        .stat-icon--total + .stat-content .stat-value { color: #667eea; }
        .stat-icon--graded + .stat-content .stat-value { color: #10b981; }
        .stat-icon--pending + .stat-content .stat-value { color: #f59e0b; }
        .stat-icon--average + .stat-content .stat-value { color: #3b82f6; }

        .stat-label {
          color: #6b7280;
          font-size: 0.9375rem;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          animation: fadeIn 0.9s ease;
        }

        .empty-state-icon {
          width: 80px;
          height: 80px;
          color: #e5e7eb;
          margin: 0 auto 1.5rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .empty-state-title {
          font-size: 1.5rem;
          color: #4b5563;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .empty-state-description {
          color: #9ca3af;
          font-size: 1rem;
          max-width: 400px;
          margin: 0 auto 2rem;
          line-height: 1.5;
        }

        .empty-state-button {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .empty-state-button:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        /* Grid View */
        .submissions-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.75rem;
          animation: fadeIn 1s ease;
        }

        @media (min-width: 768px) {
          .submissions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1200px) {
          .submissions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .submission-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          border: 2px solid transparent;
        }

        .submission-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .submission-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
          border-color: #e5e7eb;
        }

        .submission-card:hover::before {
          opacity: 1;
        }

        .submission-card-content {
          padding: 1.75rem;
        }

        .submission-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .submission-title-section {
          flex: 1;
          padding-right: 1rem;
        }

        .lesson-badge {
          display: inline-block;
          padding: 0.375rem 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .lesson-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: #1f2937;
          margin-top: 0.75rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .submission-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.375rem;
        }

        .status-icon {
          width: 24px;
          height: 24px;
        }

        .status-icon--checked {
          color: #10b981;
        }

        .status-icon--pending {
          color: #f59e0b;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .status-icon--unknown {
          color: #6b7280;
        }

        .status-text {
          font-size: 0.8125rem;
          font-weight: 600;
          white-space: nowrap;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          background: #f9fafb;
        }

        .status-icon--checked + .status-text { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-icon--pending + .status-text { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-icon--unknown + .status-text { background: #f3f4f6; color: #6b7280; }

        .submission-details {
          margin-bottom: 1.75rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding: 0.5rem 0;
          transition: all 0.2s ease;
        }

        .detail-row:hover {
          background: #f9fafb;
          padding: 0.5rem;
          border-radius: 8px;
        }

        .detail-label {
          color: #6b7280;
          font-size: 0.9375rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .detail-label::before {
          content: '•';
          color: #9ca3af;
        }

        .detail-value {
          font-weight: 600;
          font-size: 0.9375rem;
          color: #374151;
        }

        .score-value {
          font-weight: 800;
          font-size: 1rem;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .score-pass {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .score-fail {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .submission-actions {
          display: flex;
          gap: 0.75rem;
        }

        .view-detail-button {
          flex: 1;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 0.9375rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .view-detail-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .view-detail-button:active {
          transform: translateY(0);
        }

        .view-detail-button svg {
          width: 18px;
          height: 18px;
        }

        .delete-button {
          padding: 1rem;
          color: #ef4444;
          background: transparent;
          border: 2px solid #fecaca;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-button:hover {
          background: #fef2f2;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .delete-button svg {
          width: 18px;
          height: 18px;
        }

        /* Table View */
        .submissions-table-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          animation: fadeIn 1s ease;
        }

        .submissions-table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-header {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
        }

        .table-header-cell {
          padding: 1.25rem 1.75rem;
          text-align: left;
          font-size: 0.875rem;
          font-weight: 700;
          color: #4b5563;
          border-bottom: 2px solid #e5e7eb;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .table-body {
          background: white;
        }

        .table-row {
          border-bottom: 1px solid #f3f4f6;
          transition: all 0.3s ease;
        }

        .table-row:hover {
          background-color: #f9fafb;
          transform: scale(1.01);
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-cell {
          padding: 1.25rem 1.75rem;
          font-size: 0.9375rem;
        }

        .lesson-cell {
          display: flex;
          flex-direction: column;
        }

        .lesson-number {
          font-weight: 700;
          margin-bottom: 0.375rem;
          color: #667eea;
        }

        .lesson-name {
          color: #6b7280;
          font-weight: 500;
        }

        .status-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .table-score {
          font-weight: 800;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .score-pass {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .score-fail {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .no-score {
          color: #9ca3af;
          font-style: italic;
        }

        .answer-count {
          font-weight: 700;
          color: #374151;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .view-button {
          padding: 0.625rem 1.25rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .view-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .delete-table-button {
          padding: 0.625rem 1.25rem;
          color: #ef4444;
          background: transparent;
          border: 2px solid #fecaca;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .delete-table-button:hover {
          background: #fef2f2;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        /* Error Modal */
        .error-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 10000;
          animation: modalFadeIn 0.4s ease;
        }

        .error-modal {
          background: white;
          border-radius: 24px;
          max-width: 500px;
          width: 100%;
          overflow: hidden;
          animation: modalSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .error-modal-header {
          padding: 1.5rem;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 2px solid #fecaca;
        }

        .error-modal-icon {
          width: 32px;
          height: 32px;
          color: #dc2626;
          flex-shrink: 0;
        }

        .error-modal-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #7c2d12;
          margin: 0;
          flex: 1;
        }

        .error-modal-close {
          padding: 0.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #7c2d12;
          border-radius: 8px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-modal-close:hover {
          background: rgba(220, 38, 38, 0.1);
          transform: rotate(90deg);
        }

        .error-modal-close svg {
          width: 24px;
          height: 24px;
        }

        .error-modal-body {
          padding: 2rem;
          color: #4b5563;
          font-size: 1.125rem;
          line-height: 1.6;
        }

        .error-modal-footer {
          padding: 1.5rem;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .error-modal-button {
          padding: 1rem 2rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .error-modal-button {
          background: #e5e7eb;
          color: #374151;
        }

        .error-modal-button.retry {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .error-modal-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .error-modal-button.retry:hover {
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        /* Detail Modal */
        .detail-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 9999;
          animation: modalFadeIn 0.4s ease;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; backdrop-filter: blur(0); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }

        .detail-modal {
          background: white;
          border-radius: 24px;
          max-width: 56rem;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          animation: modalSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          padding: 2rem;
          border-bottom: 2px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
        }

        .modal-title-section {
          flex: 1;
        }

        .modal-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 1rem;
          line-height: 1.3;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .modal-subtitle {
          color: #6b7280;
          font-size: 0.9375rem;
        }

        .modal-subtitle p {
          margin-bottom: 0.375rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-subtitle p:last-child {
          margin-bottom: 0;
        }

        .modal-close-button {
          padding: 0.75rem;
          background: white;
          border: 2px solid #e5e7eb;
          cursor: pointer;
          color: #6b7280;
          border-radius: 12px;
          font-size: 1.5rem;
          line-height: 1;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-left: 1rem;
          flex-shrink: 0;
        }

        .modal-close-button:hover {
          background: #f3f4f6;
          color: #ef4444;
          transform: rotate(90deg);
          border-color: #fecaca;
        }

        .modal-content {
          padding: 2rem;
          overflow-y: auto;
          max-height: calc(90vh - 160px);
        }

        /* Answers Section */
        .answers-section {
          margin-bottom: 2.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .section-count {
          color: #9ca3af;
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          border-radius: 20px;
        }

        .empty-answers {
          text-align: center;
          padding: 3rem 2rem;
          border: 3px dashed #e5e7eb;
          border-radius: 16px;
          color: #6b7280;
          background: #fafafa;
        }

        .empty-answers-icon {
          width: 60px;
          height: 60px;
          color: #d1d5db;
          margin: 0 auto 1.5rem;
        }

        .empty-notes {
          font-size: 1rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #4b5563;
          font-weight: 600;
        }

        .empty-reasons {
          list-style: none;
          padding: 0;
          margin: 0.75rem auto 0;
          max-width: 400px;
          text-align: left;
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .empty-reasons li {
          margin-bottom: 0.5rem;
          padding-left: 1rem;
          position: relative;
        }

        .empty-reasons li::before {
          content: '→;
          position: absolute;
          left: 0;
          color: #667eea;
        }

        .answers-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .answer-item {
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          background: white;
        }

        .answer-item:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
        }

        .answer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .answer-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .question-number {
          font-weight: 700;
          color: #4f46e5;
          font-size: 1.125rem;
        }

        .question-index {
          font-size: 0.875rem;
          color: white;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 600;
        }

        .question-id {
          font-size: 0.8125rem;
          color: #9ca3af;
          font-family: 'SF Mono', monospace;
          background: #f3f4f6;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
        }

        .answer-content {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 12px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
          font-size: 0.9375rem;
          color: #374151;
          word-break: break-word;
          white-space: pre-wrap;
          line-height: 1.6;
          border: 1px solid #e5e7eb;
        }

        /* Feedback Section */
        .feedback-section {
          margin-bottom: 2.5rem;
        }

        .feedback-content {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #bae6fd;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
        }

        .feedback-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .feedback-icon {
          width: 24px;
          height: 24px;
          color: #0ea5e9;
          margin-top: 0.25rem;
          flex-shrink: 0;
        }

        .feedback-details {
          flex: 1;
        }

        .feedback-date {
          color: #0369a1;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .feedback-date::before {
          content: '📅';
          font-size: 0.875rem;
        }

        .feedback-text {
          background: white;
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid #dbeafe;
          color: #1f2937;
          white-space: pre-wrap;
          font-size: 0.9375rem;
          line-height: 1.7;
          font-weight: 500;
        }

        /* Modal Actions */
        .modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 2rem;
          border-top: 2px solid #e5e7eb;
        }

        .action-buttons-group {
          display: flex;
          gap: 1rem;
        }

        .modal-delete-button {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9375rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .modal-delete-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .modal-delete-button:active {
          transform: translateY(0);
        }

        .modal-delete-button svg {
          width: 18px;
          height: 18px;
        }

        .modal-close-action {
          padding: 1rem 2rem;
          background: #f3f4f6;
          color: #374151;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          cursor: pointer;
          font-size: 0.9375rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-close-action:hover {
          background: #e5e7eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Scrollbar Styling */
        .modal-content::-webkit-scrollbar {
          width: 10px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 5px;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 5px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a419b 100%);
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .submissions-main-title {
            font-size: 2rem;
          }
          
          .stat-value {
            font-size: 1.875rem;
          }
          
          .modal-title {
            font-size: 1.5rem;
          }
          
          .modal-actions {
            flex-direction: column;
            gap: 1rem;
          }
          
          .action-buttons-group {
            width: 100%;
          }
          
          .modal-close-action {
            width: 100%;
          }

          .error-modal-footer {
            flex-direction: column;
          }

          .error-modal-button {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .submissions-header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          
          .header-left-controls {
            align-self: flex-start;
          }
          
          .submissions-view-toggle {
            align-self: flex-start;
          }
          
          .filter-controls {
            flex-direction: column;
            width: 100%;
          }
          
          .status-filter {
            width: 100%;
          }
          
          .refresh-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
