/**
 * Heuristic-based code detection as defined in the TRD.
 * Uses a scoring system — score >= 2 triggers code mode.
 */
export function isCode(text: string, element?: Element | null): boolean {
  let score = 0;

  const lines = text.split('\n');

  // Rule 1: Multiple lines with consistent indentation
  if (lines.length >= 2 && lines.some(l => l.startsWith('  ') || l.startsWith('\t'))) {
    score++;
  }

  // Rule 2: Contains programming keywords
  const keywords = /\b(function|def|class|const|let|var|return|import|for|while|if|else|try|catch|async|await|export|public|private|static)\b/;
  if (keywords.test(text)) {
    score++;
  }

  // Rule 3: Contains code operators / syntax
  if (/=>|::|->|;|\{|\}/.test(text)) {
    score++;
  }

  // Rule 4: Originated from a code/pre element
  if (element?.closest('code, pre, .highlight, .hljs, .CodeMirror, .monaco-editor')) {
    score += 2;
  }

  return score >= 2;
}
