type SearchResult<T> = {
  item: T;
  score: number;
  matchedWords: number;
};

export default function smartSearch<T>(
  data: T[],
  query: string,
  getText: (item: T) => string,
): SearchResult<T>[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return data.map((item) => ({
      item,
      score: 0,
      matchedWords: 0,
    }));
  }

  const keywords = normalizedQuery.split(/\s+/);

  return (
    data
      .map((item) => {
        const text = getText(item).trim().toLowerCase();

        const matchedWords = keywords.filter((keyword) =>
          text.includes(keyword),
        ).length;

        const allWordsMatch = matchedWords === keywords.length;
        const exactMatch = text === normalizedQuery;

        let score = matchedWords;

        // 1. Exact match
        if (exactMatch) {
          score += 1000;
        }
        // 2. Semua kata cocok
        else if (allWordsMatch) {
          score += 500;
        }

        return {
          item,
          score,
          matchedWords,
        };
      })
      // 3 & 4. Kata terbanyak yang cocok → sisanya
      .sort((a, b) => b.score - a.score)
  );
}
