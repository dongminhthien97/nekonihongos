// src/components/VocabularyN4.tsx
import { VocabularyJLPT } from "./VocabularyJLPT";

export function VocabularyN4({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <VocabularyJLPT level="N4" onNavigate={onNavigate} />;
}
