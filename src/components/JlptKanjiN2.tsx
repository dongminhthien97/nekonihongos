// src/components/JlptKanjiN2.tsx
import { JlptKanjiPage } from "./JlptKanjiPage";

export function JlptKanjiN2({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <JlptKanjiPage level="N2" onNavigate={onNavigate} />;
}
