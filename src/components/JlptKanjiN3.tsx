// src/components/JlptKanjiN3.tsx
import { JlptKanjiPage } from "./JlptKanjiPage";

export function JlptKanjiN3({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <JlptKanjiPage level="N3" onNavigate={onNavigate} />;
}
