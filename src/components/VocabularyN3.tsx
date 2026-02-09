// src/components/VocabularyN3.tsx
import { VocabularyJLPT } from "./VocabularyJLPT";

export function VocabularyN3({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <VocabularyJLPT level="N3" onNavigate={onNavigate} />;
}
