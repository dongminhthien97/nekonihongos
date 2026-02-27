import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

interface DraggableFloatingNekoProps {
  storageKey: string;
  onClick?: () => void;
  tooltip?: ReactNode;
  imageClassName?: string;
  imageStyle?: CSSProperties;
  wrapperClassName?: string;
  glow?: ReactNode;
  title?: string;
}

const CAT_SIZE = 120;
const MARGIN = 8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getDefaultPosition = () => {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  return {
    x: Math.max(MARGIN, window.innerWidth - CAT_SIZE - 16),
    y: Math.max(MARGIN, window.innerHeight - CAT_SIZE - 16),
  };
};

export function DraggableFloatingNeko({
  storageKey,
  onClick,
  tooltip,
  imageClassName = "responsive-circular-image-hover",
  imageStyle,
  wrapperClassName = "relative group cursor-pointer",
  glow,
  title,
}: DraggableFloatingNekoProps) {
  const [position, setPosition] = useState(getDefaultPosition);
  const pointerIdRef = useRef<number | null>(null);

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { x: number; y: number };
      setPosition({
        x: clamp(parsed.x, MARGIN, window.innerWidth - CAT_SIZE - MARGIN),
        y: clamp(parsed.y, MARGIN, window.innerHeight - CAT_SIZE - MARGIN),
      });
    } catch {
      setPosition(getDefaultPosition());
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setPosition((prev) => ({
        x: clamp(prev.x, MARGIN, window.innerWidth - CAT_SIZE - MARGIN),
        y: clamp(prev.y, MARGIN, window.innerHeight - CAT_SIZE - MARGIN),
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const savePosition = (x: number, y: number) => {
    setPosition({ x, y });
    localStorage.setItem(storageKey, JSON.stringify({ x, y }));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;

    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true;
    }

    const nextX = clamp(
      dragRef.current.originX + dx,
      MARGIN,
      window.innerWidth - CAT_SIZE - MARGIN,
    );
    const nextY = clamp(
      dragRef.current.originY + dy,
      MARGIN,
      window.innerHeight - CAT_SIZE - MARGIN,
    );

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) {
      try {
        event.currentTarget.releasePointerCapture(pointerIdRef.current);
      } catch {}
      pointerIdRef.current = null;
    }

    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    savePosition(position.x, position.y);
  };

  const handleClick = () => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    onClick?.();
  };

  return (
    <div
      className="fixed z-50 select-none"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className={wrapperClassName}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: "none", cursor: dragRef.current.dragging ? "grabbing" : "grab" }}
        title={title}
      >
        {tooltip}
        <img
          src="https://i.pinimg.com/1200x/8c/98/00/8c9800bb4841e7daa0a3db5f7db8a4b7.jpg"
          alt="Flying Neko"
          className={imageClassName}
          style={{ width: "7.5rem", height: "7.5rem", ...imageStyle }}
        />
        {glow}
      </div>
    </div>
  );
}
