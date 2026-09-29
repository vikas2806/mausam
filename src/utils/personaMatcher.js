/**
 * Natural language keyword matcher for personas.
 * Matches user input against persona labels, descriptions, and searchTerms.
 * Pure function with no side effects.
 *
 * @param {string} query  Natural language input string from user.
 * @param {object[]} personaList  List of persona objects (built-in + custom).
 * @returns {object[]} Array of matched persona objects with matchScore property, sorted descending.
 */
export function matchPersonasByQuery(query, personaList) {
  if (!query || typeof query !== 'string') return [];
  const cleanQuery = query.trim().toLowerCase();
  if (cleanQuery.length === 0) return [];

  // Tokenize input string into words (alphanumeric only)
  const tokens = cleanQuery.split(/[^a-z0-9]+/).filter(t => t.length > 1);
  if (tokens.length === 0) return [];

  const results = [];

  for (const persona of personaList) {
    let score = 0;
    const labelLower = (persona.label || '').toLowerCase();
    const descLower = (persona.desc || '').toLowerCase();
    const searchTerms = (persona.searchTerms || []).map(t => t.toLowerCase());

    for (const token of tokens) {
      // 1. Direct match on label (high weight)
      if (labelLower.includes(token)) {
        score += 10;
      }
      // 2. Exact match in searchTerms (high weight)
      if (searchTerms.includes(token)) {
        score += 8;
      } else {
        // Partial match in searchTerms
        const partialTerm = searchTerms.find(st => st.includes(token) || token.includes(st));
        if (partialTerm) {
          score += 4;
        }
      }
      // 3. Match in description
      if (descLower.includes(token)) {
        score += 2;
      }
    }

    if (score > 0) {
      results.push({ persona, matchScore: score });
    }
  }

  // Sort by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore).map(r => r.persona);
}
