interface Lesson {
  id: number;
  title: string;
  total_characters: number;
}

interface LessonSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  selectedIds: Set<number>;
  onSelectedChange: (newSet: Set<number>) => void;
  onConfirm: () => void;
  type: "hiragana" | "katakana";
}

export function LessonSelectModal({
  isOpen,
  onClose,
  lessons,
  selectedIds,
  onSelectedChange,
  onConfirm,
  type,
}: LessonSelectModalProps) {
  if (!isOpen) return null;

  const selectedCount = selectedIds.size;
  const totalCharacters = lessons
    .filter((l) => selectedIds.has(l.id))
    .reduce((sum, l) => sum + l.total_characters, 0);

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              Luyện tập {type === "hiragana" ? "Hiragana" : "Katakana"}
            </h2>
            <p className="modal-subtitle">
              Chọn các bài học để bắt đầu thử thách ngay!
            </p>
          </div>
          <button onClick={onClose} className="close-btn">
            &times;
          </button>
        </div>

        <div className="lesson-grid">
          {lessons.map((lesson) => {
            const isSelected = selectedIds.has(lesson.id);
            return (
              <label
                key={lesson.id}
                className={`lesson-card ${isSelected ? "active" : ""}`}
              >
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newSet = new Set(selectedIds);
                      if (e.target.checked) {
                        newSet.add(lesson.id);
                      } else {
                        newSet.delete(lesson.id);
                      }
                      onSelectedChange(newSet);
                    }}
                  />
                  <span className="custom-checkbox"></span>
                </div>
                <div className="lesson-info">
                  <span className="lesson-label">Bài {lesson.id}</span>
                  <p className="lesson-name">{lesson.title}</p>
                  <p className="lesson-stats">
                    {lesson.total_characters} ký tự
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="modal-footer">
          <button
            onClick={onConfirm}
            disabled={selectedCount === 0}
            className="confirm-btn"
          >
            <span>Bắt đầu ôn tập</span>
            {selectedCount > 0 && (
              <small className="btn-badge">
                {selectedCount} bài • {totalCharacters} ký tự
              </small>
            )}
          </button>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        .modal-container {
          background: #ffffff;
          width: 100%;
          max-width: 650px;
          max-height: 85vh;
          border-radius: 32px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }

        .modal-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 8px 0;
          background: linear-gradient(90deg, #6366f1, #d946ef);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .modal-subtitle {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0;
        }

        .close-btn {
          background: #f1f5f9;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: rotate(90deg);
        }

        .lesson-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          overflow-y: auto;
          padding-right: 8px;
          margin-bottom: 30px;
        }

        /* Responsive cho mobile */
        @media (max-width: 640px) {
          .lesson-grid { grid-template-columns: 1fr; }
          .modal-container { padding: 24px; }
        }

        .lesson-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 20px;
          border: 2px solid #f1f5f9;
          background: #fff;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .lesson-card:hover {
          border-color: #e2e8f0;
          background: #f8fafc;
          transform: translateY(-2px);
        }

        .lesson-card.active {
          border-color: #6366f1;
          background: #f5f3ff;
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.1);
        }

        /* Checkbox Custom */
        .checkbox-wrapper {
          position: relative;
          width: 24px;
          height: 24px;
        }

        .checkbox-wrapper input {
          opacity: 0;
          position: absolute;
          cursor: pointer;
        }

        .custom-checkbox {
          position: absolute;
          top: 0;
          left: 0;
          height: 24px;
          width: 24px;
          background-color: #fff;
          border: 2px solid #cbd5e1;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .lesson-card.active .custom-checkbox {
          background-color: #6366f1;
          border-color: #6366f1;
        }

        .custom-checkbox:after {
          content: "";
          position: absolute;
          display: none;
          left: 7px;
          top: 3px;
          width: 6px;
          height: 11px;
          border: solid white;
          border-width: 0 2.5px 2.5px 0;
          transform: rotate(45deg);
        }

        .lesson-card.active .custom-checkbox:after {
          display: block;
        }

        .lesson-info {
          display: flex;
          flex-direction: column;
        }

        .lesson-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.05em;
        }

        .lesson-name {
          font-weight: 700;
          color: #334155;
          margin: 2px 0;
        }

        .lesson-stats {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }

        .modal-footer {
          display: flex;
          justify-content: center;
        }

        .confirm-btn {
          width: 100%;
          padding: 18px;
          border-radius: 20px;
          border: none;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
        }

        .confirm-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 25px -5px rgba(99, 102, 241, 0.5);
          filter: brightness(1.1);
        }

        .confirm-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .confirm-btn:disabled {
          background: #cbd5e1;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-badge {
          font-size: 0.8rem;
          opacity: 0.9;
          font-weight: 400;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Scrollbar tinh tế */
        .lesson-grid::-webkit-scrollbar { width: 6px; }
        .lesson-grid::-webkit-scrollbar-track { background: transparent; }
        .lesson-grid::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `,
        }}
      />
    </div>
  );
}
