import { JlptGrammar } from "./JlptGrammar";

export function JlptGrammarN2({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <JlptGrammar level="n2" onNavigate={onNavigate} />;
}
