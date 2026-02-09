// src/components/JlptKanjiN5.tsx
import { JlptKanjiPage } from "./JlptKanjiPage";

export function JlptKanjiN5({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <JlptKanjiPage level="N5" onNavigate={onNavigate} />;
}
