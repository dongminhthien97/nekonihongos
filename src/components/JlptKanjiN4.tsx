// src/components/JlptKanjiN4.tsx
import { JlptKanjiPage } from "./JlptKanjiPage";

export function JlptKanjiN4({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <JlptKanjiPage level="N4" onNavigate={onNavigate} />;
}
