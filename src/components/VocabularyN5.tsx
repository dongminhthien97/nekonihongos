// src/components/VocabularyN5.tsx
import { VocabularyJLPT } from "./VocabularyJLPT";

export function VocabularyN5({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <VocabularyJLPT level="N5" onNavigate={onNavigate} />;
}
