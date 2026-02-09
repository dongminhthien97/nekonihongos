import { JlptGrammar } from "./JlptGrammar";

export function JlptGrammarN4({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <JlptGrammar level="n4" onNavigate={onNavigate} />;
}
