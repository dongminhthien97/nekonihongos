// src/components/KanjiDetailModal.tsx
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface KanjiCompound {
  word: string;
  reading: string;
  meaning: string;
}

interface Kanji {
  kanji: string;
  on: string;
  kun: string;
  hanViet: string;
  meaning: string;
  compounds: KanjiCompound[];
  strokes: number;
}

interface KanjiDetailModalProps {
  kanji: Kanji;
  onClose: () => void;
}

export function KanjiDetailModal({ kanji, onClose }: KanjiDetailModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const unicode = kanji.kanji.charCodeAt(0).toString(16).padStart(5, "0");

    fetch(
      `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${unicode}.svg`,
    )
      .then((r) => {
        if (r.ok) return r.text();
        throw new Error("No SVG");
      })
      .then((svgText) => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const svgElement = svgDoc.documentElement;

        // STYLE SỐ THỨ TỰ NÉT – MÀU ĐỎ NỔI BẬT
        const textElements = svgElement.querySelectorAll("text");
        textElements.forEach((text) => {
          text.style.fill = "#dc2626"; // đỏ nổi (red-600)
          text.style.fontWeight = "bold";
          text.style.fontSize = "10px"; // to hơn, dễ đọc
          text.style.fontFamily = "sans-serif";
          text.style.textAnchor = "middle";
          text.style.dominantBaseline = "middle";
          // Thêm bóng nhẹ để nổi hơn trên nền
          text.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";
        });

        const cleanedSvg = new XMLSerializer().serializeToString(svgElement);
        containerRef.current!.innerHTML = cleanedSvg;

        // Animate nét
        const paths = containerRef.current!.querySelectorAll("path");
        paths.forEach((path, i) => {
          const length = path.getTotalLength();
          path.style.strokeDasharray = `${length}`;
          path.style.strokeDashoffset = `${length}`;
          path.style.animation = `draw 1s ease-in-out ${i * 0.3}s forwards`;
          path.style.stroke = "#111827";
          path.style.fill = "none";
          path.style.strokeWidth = "10";
          path.style.strokeLinecap = "round";
          path.style.strokeLinejoin = "round";
        });
      })
      .catch(() => {
        console.warn(
          `[KanjiVG] Không load SVG cho "${kanji.kanji}". Dùng placeholder.`,
        );
        const placeholder = createSVGPlaceholder(kanji.strokes || 4);
        containerRef.current!.innerHTML = placeholder;
      });

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [kanji.kanji]);

  const handleReplay = () => {
    const container = containerRef.current;
    if (!container) return;

    const svg = container.querySelector("svg");
    if (!svg) return;

    const paths = svg.querySelectorAll("path");

    paths.forEach((path, i) => {
      // Clone path để reset hoàn toàn
      const newPath = path.cloneNode(true) as SVGPathElement;
      path.parentNode?.replaceChild(newPath, path);

      const length = newPath.getTotalLength();
      newPath.style.strokeDasharray = `${length}`;
      newPath.style.strokeDashoffset = `${length}`;
      newPath.style.animation = `draw 1s ease-in-out ${i * 0.3}s forwards`;
    });
  };
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Tạo SVG placeholder đơn giản
  const createSVGPlaceholder = (strokeCount: number): string => {
    let paths = "";
    const cx = 160,
      cy = 160,
      size = 100;

    for (let i = 0; i < strokeCount; i++) {
      const angle = (i * 360) / strokeCount;
      const x1 = cx + Math.cos((angle * Math.PI) / 180) * size;
      const y1 = cy + Math.sin((angle * Math.PI) / 180) * size;
      const x2 = cx + Math.cos(((angle + 60) * Math.PI) / 180) * (size * 0.6);
      const y2 = cy + Math.sin(((angle + 60) * Math.PI) / 180) * (size * 0.6);

      paths += `<path d="M${x1},${y1} L${cx},${cy} L${x2},${y2}" stroke="#111827" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" />`;
    }

    return `
      <svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="100%" height="100%" fill="none" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="6,6" />
        ${paths}
      </svg>
    `;
  };

  return (
    <div className="modal-overlay-blurred" onClick={handleOverlayClick}>
      <div className="modal-card-premium">
        {/* Header */}
        <div className="modal-header-divider">
          <h2 className="heading-dark-xl">Chi tiết chữ Kanji</h2>
          <button
            onClick={onClose}
            className="icon-button-circle"
            aria-label="Đóng"
          >
            <X className="icon-gray-medium" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 md:p-12 space-y-12">
          {/* PHẦN TRÊN: 2 CỘT CÂN ĐỐI */}
          <div className="responsive-hero-grid">
            {/* CỘT TRÁI: CHỮ KANJI */}
            <div className="flex items-center justify-center h-full px-4">
              <div className="bg-gray-50 rounded-2xl w-full h-full flex items-center justify-center shadow-inner">
                <div className="display-ultra-massive">{kanji.kanji}</div>
              </div>
            </div>

            {/* CỘT PHẢI: THỨ TỰ NÉT VIẾT – KANJIVG SVG + CSS ANIMATION */}
            <div className="flex flex-col h-full justify-center">
              <div className="flex flex-col items-center space-y-6">
                {/* SVG container */}
                <div
                  ref={containerRef}
                  className="w-full h-full flex items-center justify-center kanji-svg-container"
                  style={{
                    maxWidth: "320px",
                    maxHeight: "320px",
                    minHeight: "200px",
                  }}
                />

                {/* Button replay riêng biệt – đẹp, rõ ràng */}
                <button onClick={handleReplay} className="btn-icon-minimal">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* THÔNG TIN CHI TIẾT – 2 CỘT */}
          <div className="responsive-grid-layout">
            <div className="space-y-6">
              <div>
                <p className="label-medium-gray">Âm On (音読み)</p>
                <p className="heading-display-lg">{kanji.on}</p>
              </div>
              <div>
                <p className="label-medium-gray">Âm Kun (訓読み)</p>
                <p className="heading-display-lg">{kanji.kun || "—"}</p>
              </div>
              <div>
                <p className="label-medium-gray">Âm Hán Việt</p>
                <p className="heading-display-lg">{kanji.hanViet}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="label-medium-gray">Ý nghĩa</p>
                <p className="heading-display-lg">{kanji.meaning}</p>
              </div>
              <div>
                <p className="label-medium-gray">Số nét</p>
                <p className="heading-display-lg">{kanji.strokes} nét</p>
              </div>
            </div>
          </div>

          {/* TỪ GHÉP PHỔ BIẾN – CHIA 2 CỘT ĐỀU NHAU */}
          <div className="mt-12">
            <p className="label-medium-gray mb-6">Từ ghép phổ biến</p>
            <div className="bg-gray-50 rounded-2xl p-8">
              {kanji.compounds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {kanji.compounds
                      .slice(0, Math.ceil(kanji.compounds.length / 2))
                      .map((c, i) => (
                        <div
                          key={i}
                          className="border-b border-gray-200 pb-6 last:border-0 last:pb-0"
                        >
                          <p className="text-2xl font-bold text-gray-900">
                            {c.word}
                          </p>
                          <p className="text-lg text-gray-600 mt-2">
                            {c.reading}
                          </p>
                          <p className="text-lg text-gray-700 mt-3 leading-relaxed">
                            {c.meaning}
                          </p>
                        </div>
                      ))}
                  </div>
                  <div className="space-y-6">
                    {kanji.compounds
                      .slice(Math.ceil(kanji.compounds.length / 2))
                      .map((c, i) => (
                        <div
                          key={i}
                          className="border-b border-gray-200 pb-6 last:border-0 last:pb-0"
                        >
                          <p className="text-2xl font-bold text-gray-900">
                            {c.word}
                          </p>
                          <p className="text-lg text-gray-600 mt-2">
                            {c.reading}
                          </p>
                          <p className="text-lg text-gray-700 mt-3 leading-relaxed">
                            {c.meaning}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 italic py-8">
                  Chưa có từ ghép nào
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Style giữ nguyên + animation draw */}
      <style>{`
 .btn-icon-minimal {
  /* Hiển thị flex để căn giữa icon */
  display: inline-flex;
  align-items: center;
  justify-content: center;

  /* Kích thước nút nhỏ gọn (44px x 44px là kích thước tối thiểu tốt cho cảm ứng) */
  width: 44px;
  height: 44px;
  padding: 0; /* Loại bỏ padding vì kích thước đã cố định */

  /* Nền trong suốt hoặc xám rất nhẹ */
  background-color: transparent; 
  color: #4b5563; /* Màu icon mặc định (xám) */

  /* Hình tròn hoàn hảo */
  border-radius: 9999px; 

  /* Không có đường viền */
  border: none;
  cursor: pointer;

  /* Hiệu ứng chuyển động mượt mà */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* Loại bỏ shadow mặc định nếu có */
  box-shadow: none;
}

/* Hiệu ứng Hover: Nền xám nhạt và icon đậm hơn */
.btn-icon-minimal:hover {
  background-color: #e5e7eb; /* Nền xám nhạt khi hover */
  color: #1f2937; /* Icon đậm hơn */
  transform: translateY(-1px); /* Nhích nhẹ */
}

/* Hiệu ứng Active (Khi nhấn) */
.btn-icon-minimal:active {
  background-color: #d1d5db; /* Nền đậm hơn chút khi nhấn */
  transform: translateY(0);
}
      .kanji-svg-container > svg {
  width: 100%;
  height: 100%;
  max-width: 280px;
  max-height: 280px;
  object-fit: contain;
}
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        .display-ultra-massive {
          font-size: 8rem;
          font-weight: 500;
          color: #111827;
          line-height: 1;
          user-select: none;
          transition: font-size 0.3s ease-in-out;
        }
        @media (min-width: 768px) {
          .display-ultra-massive {
            font-size: 160px;
          }
        }
        @media (min-width: 1024px) {
          .display-ultra-massive {
            font-size: 200px;
          }
        }
        .flex-center-both-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100%;
        }
        .description-text-spaced {
          margin-top: 1.5rem;
          font-size: 1.125rem;
          line-height: 1.75rem;
          color: #4b5563;
          text-align: center;
        }
        .interactive-empty-state-box {
          text-align: center;
          padding: 2rem;
          background-color: #f9fafb;
          border-radius: 1rem;
          transition: all 150ms ease;
        }
        .interactive-empty-state-box:hover {
          background-color: #f3f4f6;
        }
        .heading-display-lg {
          font-size: 1.875rem;
          line-height: 2.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .label-medium-gray {
          font-size: 1.125rem;
          line-height: 1.75rem;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 0.5rem;
        }
        .responsive-grid-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 768px) {
          .responsive-grid-layout {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .responsive-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          align-items: center;
          gap: 2rem;
        }
        @media (min-width: 768px) {
          .responsive-hero-grid {
            gap: 3rem;
          }
        }
        @media (min-width: 1024px) {
          .responsive-hero-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .icon-gray-medium {
          width: 1.75rem;
          height: 1.75rem;
          color: #4b5563;
        }
        .icon-button-circle {
          padding: 0.75rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background-color: transparent;
          cursor: pointer;
          transition: background-color 150ms ease;
        }
        .icon-button-circle:hover {
          background-color: #f3f4f6;
        }
        .heading-dark-xl {
          font-size: 1.875rem;
          line-height: 2.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .modal-header-divider {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem;
          border-bottom: 1px solid #e5e7eb;
          background-color: #ffffff;
        }
        .modal-card-premium {
          background-color: #ffffff;
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 56rem;
          margin-left: 1rem;
          margin-right: 1rem;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-overlay-blurred {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
      `}</style>
    </div>
  );
}
