import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Database,
  Copy,
  AlertTriangle,
  Key,
  Search,
  Zap,
} from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";

interface QuestionDetail {
  id: number;
  lessonId: number;
  type: "fill_blank" | "multiple_choice" | "rearrange";
  text: string;
  correct_answer?: string;
  points: number;
  example?: string;
  options?: any[] | null;
}

interface CorrectAnswersModalProps {
  lessonId: number;
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export function CorrectAnswersModal({
  lessonId,
  isOpen,
  onClose,
  position = { x: 600, y: 100 },
  onPositionChange,
}: CorrectAnswersModalProps) {
  const [questions, setQuestions] = useState<QuestionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [modalPosition, setModalPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [apiData, setApiData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && lessonId) {
      loadQuestions();
    }
  }, [isOpen, lessonId]);

  useEffect(() => {
    setModalPosition(position);
  }, [position]);

  const loadQuestions = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/admin/questions/lesson/${lessonId}/correct-answers`,
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        const rawData = response.data.data;

        const formattedQuestions: QuestionDetail[] = rawData.map(
          (item: any) => ({
            id: item.id,
            lessonId: item.lessonId,
            type: item.type || "fill_blank",
            text: item.text || "",
            correct_answer: item.correctAnswer || "",
            points: item.points || 10,
            example: item.example,
            options: item.options,
          }),
        );

        setQuestions(formattedQuestions);
        setExpandedQuestions(formattedQuestions.map((q) => q.id));
      } else {
        setQuestions([]);
        toast.error("Không có dữ liệu câu hỏi cho bài học này");
      }
    } catch (error: any) {
      toast.error("Không thể tải thông tin câu hỏi");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 800));
    const boundedY = Math.max(0, Math.min(newY, window.innerHeight - 600));

    const newPosition = { x: boundedX, y: boundedY };
    setModalPosition(newPosition);
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const toggleQuestionExpand = (questionId: number) => {
    if (expandedQuestions.includes(questionId)) {
      setExpandedQuestions(expandedQuestions.filter((id) => id !== questionId));
    } else {
      setExpandedQuestions([...expandedQuestions, questionId]);
    }
  };

  const toggleAllQuestions = () => {
    if (questions.length === 0) return;

    if (expandedQuestions.length === questions.length) {
      setExpandedQuestions([]);
    } else {
      setExpandedQuestions(questions.map((q) => q.id));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Đã copy vào clipboard"))
      .catch(() => toast.error("Không thể copy"));
  };

  const copyFullData = (question: any) => {
    const fullData = {
      ...question,
      metadata: {
        copiedAt: new Date().toISOString(),
        lessonId,
      },
    };

    navigator.clipboard
      .writeText(JSON.stringify(fullData, null, 2))
      .then(() => toast.success("Đã copy toàn bộ dữ liệu"))
      .catch(() => toast.error("Không thể copy"));
  };

  const renderDatabaseWarning = () => {
    const hasAnyCorrectAnswer = questions.some(
      (q) =>
        q.correct_answer !== undefined &&
        q.correct_answer !== null &&
        q.correct_answer.trim() !== "",
    );

    return (
      <div className="database-warning">
        <div className="warning-header">
          <AlertTriangle size={20} />
          <span className="warning-title">VẤN ĐỀ DATABASE</span>
        </div>
        <div className="warning-content">
          {!hasAnyCorrectAnswer ? (
            <>
              <p className="warning-message">
                <strong>
                  Trường "correct_answer" KHÔNG TỒN TẠI trong database!
                </strong>
              </p>
              <div className="warning-details">
                <p>
                  Đã kiểm tra {questions.length} câu hỏi, không có câu nào có
                  trường correct_answer.
                </p>
                <p>Điều này có nghĩa:</p>
                <ul className="warning-list">
                  <li>
                    Bảng <code>grammar_questions</code> không có cột{" "}
                    <code>correct_answer</code>
                  </li>
                  <li>Hoặc cột này tồn tại nhưng API không trả về</li>
                  <li>Hoặc dữ liệu chưa được nhập vào cột này</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <p className="warning-message">
                <strong>Một số câu hỏi có correct_answer</strong>
              </p>
              <div className="warning-details">
                <p>
                  Trong {questions.length} câu hỏi, chỉ có{" "}
                  {
                    questions.filter(
                      (q) => q.correct_answer && q.correct_answer.trim() !== "",
                    ).length
                  }{" "}
                  câu có dữ liệu correct_answer.
                </p>
              </div>
            </>
          )}
        </div>
        <div className="warning-actions">
          <button
            className="action-button"
            onClick={() => {
              toast.success("Đã mở DevTools Console");
            }}
          >
            <Search size={14} /> Xem Console
          </button>
          <button className="action-button" onClick={loadQuestions}>
            <Zap size={14} /> Refresh Data
          </button>
        </div>
      </div>
    );
  };

  const renderQuestionDetails = (question: QuestionDetail) => {
    const hasCorrectAnswer = question.correct_answer !== undefined;
    const correctAnswerValue = question.correct_answer || "";
    const isEmptyCorrectAnswer =
      !correctAnswerValue || correctAnswerValue.trim() === "";

    return (
      <div className="question-details">
        {!hasCorrectAnswer || isEmptyCorrectAnswer ? (
          <div className="data-warning-section">
            <div className="warning-icon">
              <AlertTriangle size={20} />
            </div>
            <div className="warning-text">
              <div className="warning-title">
                CỘT CORRECT_ANSWER KHÔNG CÓ DỮ LIỆU
              </div>
              <div className="warning-description">
                {!hasCorrectAnswer
                  ? "Trường correct_answer không tồn tại trong đối tượng API trả về"
                  : "Trường correct_answer tồn tại nhưng giá trị là rỗng hoặc null."}
              </div>
            </div>
          </div>
        ) : null}

        <div className="detail-section">
          <div className="detail-header">
            <FileText size={16} />
            <span>Nội dung câu hỏi (text)</span>
          </div>
          <div className="detail-content">
            <pre className="question-text">
              {question.text || "(Không có nội dung)"}
            </pre>
          </div>
        </div>

        {question.example && (
          <div className="detail-section">
            <div className="detail-header">
              <BookOpen size={16} />
              <span>Ví dụ (example)</span>
            </div>
            <div className="detail-content">
              <pre className="example-text">{question.example}</pre>
            </div>
          </div>
        )}

        <div className="detail-section">
          <div className="detail-header">
            <Database size={16} />
            <span>
              Dữ liệu cột correct_answer
              {hasCorrectAnswer ? " (ĐÃ TỒN TẠI)" : " (KHÔNG TỒN TẠI)"}
            </span>
          </div>
          <div className="detail-content">
            {!hasCorrectAnswer ? (
              <div className="missing-field-warning">
                <div className="missing-header">
                  <Key size={16} />
                  <span className="missing-title">TRƯỜNG KHÔNG TỒN TẠI</span>
                </div>
                <div className="missing-content">
                  <p>
                    Đối tượng từ API <strong>KHÔNG có thuộc tính</strong>{" "}
                    <code>correct_answer</code>
                  </p>
                  <p className="missing-subtitle">Các trường có sẵn:</p>
                  <ul className="available-fields">
                    {Object.keys(question).map((key, index) => (
                      <li key={index}>
                        <code>{key}</code>: {typeof (question as any)[key]}
                        {Array.isArray((question as any)[key])
                          ? ` (${(question as any)[key].length} items)`
                          : (question as any)[key]
                            ? ` = "${(question as any)[key]}"`
                            : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : isEmptyCorrectAnswer ? (
              <div className="empty-field-warning">
                <div className="empty-header">
                  <AlertTriangle size={16} />
                  <span className="empty-title">TRƯỜNG TỒN TẠI NHƯNG RỖNG</span>
                </div>
                <div className="empty-content">
                  <p>
                    Trường <code>correct_answer</code> tồn tại nhưng giá trị là
                    rỗng hoặc chỉ có khoảng trắng.
                  </p>
                  <div className="empty-value">
                    <span className="value-label">Giá trị</span>
                    <pre className="value-content">"{correctAnswerValue}"</pre>
                  </div>
                  <div className="empty-stats">
                    <span className="stat">
                      Độ dài: {correctAnswerValue.length}
                    </span>
                    <span className="stat">
                      Chỉ có khoảng trắng:{" "}
                      {correctAnswerValue.trim() === "" ? "Có" : "Không"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="correct-answer-display">
                <div className="answer-header">
                  <span className="answer-label">
                    Giá trị cột correct_answer:
                  </span>
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(correctAnswerValue)}
                    title="Copy to clipboard"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="answer-content">
                  <pre className="answer-value">{correctAnswerValue}</pre>
                </div>
                <div className="answer-info">
                  <span className="info-item">
                    Độ dài: {correctAnswerValue.length} ký tự
                  </span>
                  <span className="info-item">Loại: {question.type}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {question.options && (
          <div className="detail-section">
            <div className="detail-header">
              <Database size={16} />
              <span>Options Data ({question.options.length} items)</span>
            </div>
            <div className="detail-content">
              <div className="options-container">
                <div className="options-header">
                  <span className="options-label">
                    Kiểu dữ liệu:{" "}
                    {Array.isArray(question.options)
                      ? "Array"
                      : typeof question.options}
                  </span>
                </div>
                <div className="options-list">
                  {Array.isArray(question.options) ? (
                    question.options.map((option, index) => (
                      <div key={index} className="option-item">
                        <div className="option-header">
                          <span className="option-index">
                            Option {index + 1}
                          </span>
                          <span className="option-type">({typeof option})</span>
                        </div>
                        <div className="option-content">
                          {typeof option === "object"
                            ? JSON.stringify(option, null, 2)
                            : String(option)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <pre className="raw-options">
                      {JSON.stringify(question.options, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="detail-section">
          <div className="detail-header">
            <Database size={16} />
            <span>Raw Data (Toàn bộ đối tượng từ API)</span>
          </div>
          <div className="detail-content">
            <div className="raw-data-container">
              <div className="raw-data-header">
                <button
                  className="copy-button"
                  onClick={() => copyFullData(question)}
                  title="Copy toàn bộ dữ liệu"
                >
                  <Copy size={14} /> Copy JSON
                </button>
              </div>
              <pre className="raw-data-json">
                {JSON.stringify(question, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="metadata">
          <table className="metadata-table">
            <tbody>
              <tr>
                <td className="label">ID:</td>
                <td className="value">{question.id}</td>
              </tr>
              <tr>
                <td className="label">Lesson ID:</td>
                <td className="value">{question.lessonId}</td>
              </tr>
              <tr>
                <td className="label">Type:</td>
                <td className="value">{question.type}</td>
              </tr>
              <tr>
                <td className="label">Points:</td>
                <td className="value">{question.points}</td>
              </tr>
              <tr>
                <td className="label">Has correct_answer:</td>
                <td className="value">{hasCorrectAnswer ? "Có" : "Không"}</td>
              </tr>
              <tr>
                <td className="label">Has Options:</td>
                <td className="value">
                  {question.options
                    ? `Có (${question.options.length})`
                    : "Không"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-container draggable-modal"
      style={{
        position: "fixed",
        left: `${modalPosition.x}px`,
        top: `${modalPosition.y}px`,
        zIndex: 1002,
      }}
    >
      <div
        className="modal-header draggable-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div className="modal-header-content">
          <h2 className="modal-title">
            <Database size={24} />
            Debug Database - Bài {lessonId}
          </h2>
          <div className="modal-subtitle">
            <span>Kiểm tra cấu trúc database và dữ liệu correct_answer</span>
            {apiData && (
              <span className="api-count">
                API trả về {apiData.count} bản ghi
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="close-button">
          <X size={24} />
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p className="loading-text">Đang tải dữ liệu từ database...</p>
        </div>
      ) : (
        <div className="modal-content">
          {renderDatabaseWarning()}

          <div className="actions-section">
            <div className="questions-count">
              Tổng: {questions.length} bản ghi từ grammar_questions
              <span className="correct-count">
                Có correct_answer:{" "}
                {
                  questions.filter(
                    (q) => q.correct_answer && q.correct_answer.trim() !== "",
                  ).length
                }
              </span>
            </div>
            <div className="action-buttons">
              <button onClick={loadQuestions} className="refresh-button">
                Refresh Data
              </button>
              <button
                onClick={toggleAllQuestions}
                className="toggle-all-button"
              >
                {expandedQuestions.length === questions.length
                  ? "Thu gọn tất cả"
                  : "Mở rộng tất cả"}
              </button>
            </div>
          </div>

          {questions.length > 0 ? (
            <div className="questions-list">
              {questions.map((question, index) => {
                const isExpanded = expandedQuestions.includes(question.id);
                const hasCorrectAnswer = question.correct_answer !== undefined;
                const isEmptyCorrectAnswer =
                  !question.correct_answer ||
                  question.correct_answer.trim() === "";

                return (
                  <div key={question.id} className="question-card">
                    <div
                      className="question-header"
                      onClick={() => toggleQuestionExpand(question.id)}
                    >
                      <div className="question-header-left">
                        <span className="question-number">
                          #{index + 1} (ID {question.id})
                        </span>
                        <span className="question-type">{question.type}</span>
                        <span className="question-points">
                          {question.points} điểm
                        </span>
                        {!hasCorrectAnswer ? (
                          <span className="error-badge">
                            <AlertTriangle size={14} /> Missing Field
                          </span>
                        ) : isEmptyCorrectAnswer ? (
                          <span className="warning-badge">
                            <AlertTriangle size={14} /> Empty Value
                          </span>
                        ) : (
                          <span className="success-badge">✓ Has Answer</span>
                        )}
                      </div>
                      <div className="question-header-right">
                        <button
                          className="copy-full-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyFullData(question);
                          }}
                          title="Copy toàn bộ dữ liệu câu hỏi"
                        >
                          <Copy size={14} />
                        </button>
                        <span className="expand-icon">
                          {isExpanded ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </span>
                      </div>
                    </div>

                    {isExpanded && renderQuestionDetails(question)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Eye size={48} />
              </div>
              <h3 className="empty-title">Không có dữ liệu</h3>
              <p className="empty-description">
                Bài học {lessonId} chưa có bản ghi trong bảng grammar_questions
              </p>
              <button onClick={loadQuestions} className="retry-button">
                Thử lại
              </button>
            </div>
          )}
        </div>
      )}

      <div className="modal-footer">
        <div className="footer-info">
          <span>
            Database: grammar_questions | Lesson: {lessonId} | Tìm thấy:{" "}
            {questions.length} câu hỏi
          </span>
        </div>
        <button onClick={onClose} className="close-modal-button">
          Đóng
        </button>
      </div>

      <style>{`
        .modal-container {
          background: white;
          border-radius: 1rem;
          box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(0, 0, 0, 0.05);
          width: 1100px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          pointer-events: auto;
          resize: both;
          min-width: 800px;
          min-height: 600px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .database-warning {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          border-radius: 0.75rem;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          border: 2px solid #fecaca;
        }

        .warning-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .warning-title {
          font-weight: 700;
          font-size: 1.125rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .warning-content {
          margin-bottom: 1rem;
        }

        .warning-message {
          margin: 0 0 0.75rem 0;
          font-size: 1rem;
        }

        .warning-details {
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .warning-list {
          margin: 0.5rem 0 0 1rem;
          padding: 0;
        }

        .warning-list li {
          margin-bottom: 0.25rem;
        }

        .warning-actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-button {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .data-warning-section {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: #fef3f2;
          border-radius: 0.5rem;
          border: 1px solid #fed7d7;
          margin-bottom: 1.5rem;
        }

        .warning-icon {
          color: #dc2626;
          flex-shrink: 0;
        }

        .warning-text {
          flex: 1;
        }

        .warning-text .warning-title {
          color: #dc2626;
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }

        .warning-text .warning-description {
          color: #7c2d12;
          font-size: 0.875rem;
        }

        .missing-field-warning,
        .empty-field-warning {
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .missing-field-warning {
          background: #fef3f2;
          border: 2px solid #fed7d7;
        }

        .empty-field-warning {
          background: #fffbeb;
          border: 2px solid #fde68a;
        }

        .missing-header,
        .empty-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .missing-title,
        .empty-title {
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .missing-title {
          color: #dc2626;
        }

        .empty-title {
          color: #92400e;
        }

        .missing-content,
        .empty-content {
          color: #1f2937;
        }

        .missing-content p,
        .empty-content p {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
        }

        .missing-subtitle {
          font-weight: 600;
          color: #374151;
          margin-top: 1rem !important;
        }

        .available-fields {
          margin: 0.5rem 0 0 1rem;
          padding: 0;
          list-style: none;
        }

        .available-fields li {
          padding: 0.25rem 0;
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
          color: #1f2937;
        }

        .available-fields code {
          background: #e5e7eb;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, monospace;
        }

        .empty-value {
          margin: 1rem 0;
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .value-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 0.75rem;
          display: block;
          margin-bottom: 0.25rem;
        }

        .value-content {
          margin: 0;
          color: #dc2626;
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .empty-stats {
          display: flex;
          gap: 1rem;
          margin-top: 0.75rem;
        }

        .stat {
          padding: 0.25rem 0.5rem;
          background: #f3f4f6;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .raw-data-container {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .raw-data-header {
          padding: 0.75rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }

        .raw-data-json {
          margin: 0;
          padding: 1rem;
          background: white;
          color: #1f2937;
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
          line-height: 1.4;
          white-space: pre-wrap;
          max-height: 300px;
          overflow-y: auto;
        }

        .error-badge {
          padding: 0.375rem 0.75rem;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .warning-badge {
          padding: 0.375rem 0.75rem;
          background: #fef3c7;
          color: #92400e;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .success-badge {
          padding: 0.375rem 0.75rem;
          background: #d1fae5;
          color: #065f46;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .correct-count {
          margin-left: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: #d1fae5;
          color: #065f46;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .api-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
        }

        .draggable-header {
          user-select: none;
        }

        .modal-header {
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, #4338ca 0%, #3730a3 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .modal-subtitle {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .close-button {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 0.5rem;
          transition: background-color 0.2s;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          flex: 1;
        }

        .loading-spinner {
          position: relative;
          margin-bottom: 1rem;
        }

        .spinner {
          width: 3rem;
          height: 3rem;
          border: 3px solid #e5e7eb;
          border-top-color: #4338ca;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          color: #6b7280;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .modal-content {
          padding: 1.25rem;
          overflow-y: auto;
          flex: 1;
        }

        .actions-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .questions-count {
          padding: 0.5rem 0.75rem;
          background: #e0e7ff;
          color: #3730a3;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
        }

        .refresh-button {
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .refresh-button:hover {
          background: #059669;
        }

        .toggle-all-button {
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          color: #374151;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .toggle-all-button:hover {
          background: #e5e7eb;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .question-card {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
          background: white;
        }

        .question-header {
          padding: 1rem 1.25rem;
          background: #f9fafb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .question-header:hover {
          background: #f3f4f6;
        }

        .question-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .question-number {
          padding: 0.375rem 0.875rem;
          background: linear-gradient(135deg, #4338ca 0%, #3730a3 100%);
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 9999px;
          min-width: 80px;
          text-align: center;
        }

        .question-type {
          padding: 0.375rem 0.75rem;
          background: #ede9fe;
          color: #5b21b6;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .question-points {
          padding: 0.375rem 0.75rem;
          background: #fef3c7;
          color: #92400e;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .question-header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .copy-full-button {
          padding: 0.375rem;
          background: #dbeafe;
          color: #1d4ed8;
          border-radius: 0.375rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-full-button:hover {
          background: #bfdbfe;
        }

        .expand-icon {
          color: #6b7280;
        }

        .question-details {
          padding: 1.5rem;
          background: white;
        }

        .detail-section {
          margin-bottom: 1.5rem;
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 0.75rem;
          padding-bottom: 0.375rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .detail-content {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .question-text,
        .example-text {
          margin: 0;
          color: #1f2937;
          line-height: 1.6;
          white-space: pre-wrap;
          font-family: inherit;
          font-size: 0.875rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .correct-answer-display {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .answer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .answer-label {
          font-weight: 600;
          color: #4338ca;
          font-size: 0.875rem;
        }

        .copy-button {
          padding: 0.375rem;
          background: #e0e7ff;
          color: #3730a3;
          border-radius: 0.375rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-button:hover {
          background: #c7d2fe;
        }

        .answer-content {
          padding: 1rem;
          background: white;
          border-radius: 0.5rem;
          border: 2px solid #c7d2fe;
          max-height: 300px;
          overflow-y: auto;
        }

        .answer-value {
          margin: 0;
          color: #3730a3;
          line-height: 1.6;
          white-space: pre-wrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
        }

        .answer-info {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .info-item {
          padding: 0.25rem 0.5rem;
          background: #f3f4f6;
          border-radius: 0.25rem;
        }

        .options-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .options-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .options-label {
          font-weight: 600;
          color: #7c3aed;
          font-size: 0.875rem;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .option-item {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .option-header {
          padding: 0.5rem 0.75rem;
          background: #f5f3ff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
        }

        .option-index {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
        }

        .option-type {
          font-size: 0.625rem;
          font-weight: 600;
          color: #059669;
          background: #d1fae5;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
        }

        .option-content {
          margin: 0;
          padding: 0.75rem;
          background: white;
          color: #374151;
          line-height: 1.4;
          white-space: pre-wrap;
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .raw-options {
          margin: 0;
          padding: 0.75rem;
          background: white;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .metadata {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }

        .metadata-table {
          width: 100%;
          border-collapse: collapse;
        }

        .metadata-table tr {
          border-bottom: 1px solid #e2e8f0;
        }

        .metadata-table tr:last-child {
          border-bottom: none;
        }

        .metadata-table td {
          padding: 0.5rem;
        }

        .metadata-table .label {
          color: #64748b;
          font-weight: 500;
          width: 150px;
        }

        .metadata-table .value {
          color: #1e293b;
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
        }

        .empty-icon {
          color: #9ca3af;
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.5rem 0;
        }

        .empty-description {
          color: #6b7280;
          max-width: 24rem;
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
        }

        .retry-button {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .retry-button:hover {
          background: #2563eb;
        }

        .modal-footer {
          padding: 1rem 1.25rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-info {
          font-size: 0.75rem;
          color: #6b7280;
          font-family: ui-monospace, monospace;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .close-modal-button {
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .close-modal-button:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        .answer-content::-webkit-scrollbar {
          width: 6px;
        }

        .answer-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .answer-content::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 3px;
        }

        .answer-content::-webkit-scrollbar-thumb:hover {
          background: #a5b4fc;
        }

        .raw-data-json::-webkit-scrollbar,
        .option-content::-webkit-scrollbar {
          width: 4px;
        }

        .raw-data-json::-webkit-scrollbar-track,
        .option-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 2px;
        }

        .raw-data-json::-webkit-scrollbar-thumb,
        .option-content::-webkit-scrollbar-thumb {
          background: #ddd6fe;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
