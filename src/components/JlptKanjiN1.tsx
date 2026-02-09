// src/components/JlptKanjiN1.tsx
import { JlptKanjiPage } from "./JlptKanjiPage";

export function JlptKanjiN1({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <JlptKanjiPage level="N1" onNavigate={onNavigate} />;
}
