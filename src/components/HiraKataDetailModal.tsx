// components/HiraKataDetailModal.tsx
import { useEffect, useRef, useState } from "react";
import { X, RotateCcw, Info } from "lucide-react";

interface HiraKata {
  id: number;
  character: string;
  romanji: string;
  unicode: string;
  strokeOrder?: number;
}

interface HiraKataDetailModalProps {
  character: HiraKata | null;
  type: "hiragana" | "katakana";
  onClose: () => void;
}

export function HiraKataDetailModal({
  character,
  type,
  onClose,
}: HiraKataDetailModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Chỉ chạy logic khi character tồn tại
    if (!character) return;

    let isMounted = true; // Flag để tránh cập nhật state nếu component đã unmount
    setLoading(true);

    const renderSVG = async () => {
      const charArray = Array.from(character.character);

      try {
        const svgDataList = await Promise.all(
          charArray.map(async (char) => {
            const unicodeHex = char.charCodeAt(0).toString(16).padStart(5, "0");
            const response = await fetch(
              `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${unicodeHex}.svg`
            );
            return response.ok ? await response.text() : null;
          })
        );

        if (!isMounted || !containerRef.current) return;

        // Xóa nội dung cũ một cách an toàn trước khi thêm mới
        containerRef.current.innerHTML = "";

        const compositeWrapper = document.createElement("div");
        compositeWrapper.className = "svg-composite-wrapper";

        let globalStrokeIndex = 0;
        const parser = new DOMParser();

        svgDataList.forEach((svgText, charIndex) => {
          if (!svgText) return;

          const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
          const svgElement = svgDoc.documentElement;

          svgElement.removeAttribute("width");
          svgElement.removeAttribute("height");
          svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
          svgElement.classList.add(charIndex === 0 ? "main-svg" : "sub-svg");

          svgElement
            .querySelectorAll("text")
            .forEach(
              (t) => ((t as unknown as HTMLElement).style.display = "none")
            );

          const paths = svgElement.querySelectorAll("path");
          paths.forEach((path) => {
            const p = path as SVGPathElement;
            const length = p.getTotalLength();
            p.style.strokeDasharray = `${length}`;
            p.style.strokeDashoffset = `${length}`;

            const totalDelay = globalStrokeIndex * 0.25;
            p.style.animation = `draw-stroke 0.7s ease-in-out ${totalDelay}s forwards`;
            p.style.stroke = "#1e293b";
            p.style.strokeWidth = "8";
            p.style.fill = "none";
            p.style.strokeLinecap = "round";

            globalStrokeIndex++;
          });

          compositeWrapper.appendChild(svgElement);
        });

        if (compositeWrapper.children.length === 0) {
          containerRef.current.innerHTML = `<div class="error-msg">Dữ liệu nét vẽ đang được cập nhật</div>`;
        } else {
          containerRef.current.appendChild(compositeWrapper);
        }
      } catch (e) {
        console.error("SVG Render Error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    renderSVG();

    // Cleanup function: Khi component unmount hoặc character đổi, dọn dẹp DOM
    return () => {
      isMounted = false;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [character]);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allPaths = containerRef.current?.querySelectorAll("path");
    if (!allPaths) return;

    allPaths.forEach((path, i) => {
      const p = path as SVGPathElement;
      p.style.animation = "none";
      p.getBoundingClientRect(); // Trigger reflow thay vì offsetWidth để tránh lỗi Type
      const length = p.getTotalLength();
      p.style.strokeDashoffset = `${length}`;
      p.style.animation = `draw-stroke 0.7s ease-in-out ${i * 0.25}s forwards`;
    });
  };

  if (!character) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card">
        <div className="modal-header">
          <div className="header-left">
            <h2 className="title-text">
              Chi tiết {type === "hiragana" ? "Hiragana" : "Katakana"}
            </h2>
            <span className={`type-badge ${type}`}>
              {type === "hiragana" ? "ひらがな" : "カタカナ"}
            </span>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="visual-grid">
            {/* CỘT TRÁI */}
            <div className="display-box-wrapper">
              <div className="display-box grid-paper">
                <div
                  className={`char-static-container ${
                    character.character.length > 1 ? "is-compound" : ""
                  }`}
                >
                  <span className="char-unit">{character.character[0]}</span>
                  {character.character[1] && (
                    <span className="char-unit sub">
                      {character.character[1]}
                    </span>
                  )}
                </div>
              </div>
              <div className="box-caption">Ký tự mẫu</div>
            </div>

            {/* CỘT PHẢI */}
            <div className="display-box-wrapper">
              <div className="display-box grid-paper svg-render-area">
                {/* Dùng một div trung gian để React không quản lý nội dung bên trong nó */}
                <div
                  ref={containerRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
                {loading && (
                  <div className="loading-spinner-overlay">
                    <div className="loading-spinner" />
                  </div>
                )}
              </div>
              <button
                onClick={handleReplay}
                className="btn-replay"
                disabled={loading}
              >
                <RotateCcw size={16} />
                <span>Xem nét vẽ</span>
              </button>
            </div>
          </div>

          <div className="info-layout">
            <div className="info-column">
              <div className="info-group">
                <label className="label-caps">Cách đọc (Romaji)</label>
                <div className="val-romaji">{character.romanji}</div>
              </div>
            </div>
            <div className="info-column">
              <div className="info-group">
                <label className="label-caps">Loại chữ</label>
                <div className="desc-card">
                  <p className="desc-highlight">
                    {type === "hiragana" ? "Chữ mềm" : "Chữ cứng"}
                  </p>
                  <p className="desc-sub">
                    {character.character.length > 1
                      ? "Âm ghép (Yoon)"
                      : "Âm đơn"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .modal-backdrop { position: fixed; inset: 0; z-index: 999; background: rgba(15,23,42,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
          .modal-card { background: white; width: 100%; max-width: 800px; border-radius: 2rem; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); max-height: 95vh; display: flex; flex-direction: column; }
          .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
          .header-left { display: flex; align-items: center; gap: 1rem; }
          .title-text { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
          .type-badge { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
          .type-badge.hiragana { background: #eff6ff; color: #2563eb; }
          .type-badge.katakana { background: #fef2f2; color: #dc2626; }
          .btn-close { background: #f8fafc; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
          .btn-close:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }
          .modal-content { padding: 2rem; overflow-y: auto; }
          .visual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem; }
          .display-box-wrapper { display: flex; flex-direction: column; align-items: center; width: 100%; }
          .display-box { width: 100%; aspect-ratio: 1/1; max-width: 280px; background: white; border: 2px solid #e2e8f0; border-radius: 1.25rem; position: relative; overflow: hidden; }
          .grid-paper { background-image: linear-gradient(to right, #f1f5f9 2px, transparent 2px), linear-gradient(to bottom, #f1f5f9 2px, transparent 2px); background-size: 50% 50%; background-position: center; }
          .char-static-container { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
          .char-unit { font-size: 10rem; font-family: serif; color: #1e293b; line-height: 1; flex: 1; text-align: center; }
          .is-compound { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: -1rem; /* Tạo khoảng cách âm nếu cần */
}

.is-compound .char-unit { 
  font-size: 7.5rem; /* Tăng nhẹ kích thước chữ chính */
  flex: 0 1 auto; 
  margin-right: -0.5rem; /* Kéo chữ chính về bên phải */
}
  .is-compound .char-unit.sub { 
  font-size: 4.5rem; 
  flex: 0 1 auto; 
  align-self: flex-end; 
  margin-bottom: 12%; 
  margin-left: -1.5rem;
}
          .svg-composite-wrapper { display: flex; align-items: center; justify-content: center; width: 90%; height: 90%; }
          .main-svg { flex: 0.7; height: 85%; width: auto; }
          .sub-svg { flex: 0.4; height: 55%; width: auto; align-self: flex-end; margin-bottom: 5%; margin-left: -5%; }
          .btn-replay { margin-top: 1rem; display: flex; align-items: center; gap: 0.5rem; background: #0f172a; color: white; padding: 0.75rem 1.5rem; border-radius: 0.75rem; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 600; }
          .btn-replay:disabled { opacity: 0.5; cursor: not-allowed; }
          .info-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
          .val-romaji { font-size: 2.5rem; font-weight: 900; color: #2563eb; }
          .val-strokes { font-size: 2rem; font-weight: 800; }
          .desc-card { background: #f8fafc; padding: 1rem; border-radius: 0.75rem; border-left: 4px solid #3b82f6; }
          .loading-spinner-overlay { position: absolute; inset: 0; display: flex; items-center; justify-content: center; background: rgba(255,255,255,0.7); z-index: 10; }
          .loading-spinner { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes draw-stroke { to { stroke-dashoffset: 0; } }
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 640px) { .visual-grid, .info-layout { grid-template-columns: 1fr; } }
        `}</style>
      </div>
    </div>
  );
}
