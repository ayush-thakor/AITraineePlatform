const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "if",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "who",
  "will",
  "with"
]);

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !STOP_WORDS.has(token));
}

export function lexicalScore(query: string, text: string) {
  const queryTokens = tokenize(query);
  const textTokens = new Set(tokenize(text));

  if (queryTokens.length === 0 || textTokens.size === 0) {
    return 0;
  }

  let matches = 0;

  for (const token of queryTokens) {
    if (textTokens.has(token)) {
      matches += 1;
    }
  }

  return matches / queryTokens.length;
}
