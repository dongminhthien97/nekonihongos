// src/components/VocabularyN2.tsx
import { VocabularyJLPT } from "./VocabularyJLPT";

export function VocabularyN2({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <VocabularyJLPT level="N2" onNavigate={onNavigate} />;
}
