// src/components/VocabularyN1.tsx
import { VocabularyJLPT } from "./VocabularyJLPT";

export function VocabularyN1({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <VocabularyJLPT level="N1" onNavigate={onNavigate} />;
}
