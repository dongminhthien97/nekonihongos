import { JlptGrammar } from "./JlptGrammar";

export function JlptGrammarN1({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <JlptGrammar level="n1" onNavigate={onNavigate} />;
}
