import { JlptGrammar } from "./JlptGrammar";

export function JlptGrammarN5({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <JlptGrammar level="n5" onNavigate={onNavigate} />;
}
