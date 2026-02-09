import { JlptGrammar } from "./JlptGrammar";

export function JlptGrammarN3({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return <JlptGrammar level="n3" onNavigate={onNavigate} />;
}
