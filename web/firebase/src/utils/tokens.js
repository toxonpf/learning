// src/utils/tokens.js
// Generates search tokens including word prefixes for substring search
// e.g. "AirMax Pro" → ["airmax", "pro", "ai", "air", "airm", "airma", "pr"]
export function generateNameTokens(name) {
  const words = name.toLowerCase().split(/\s+/).filter(Boolean);
  const tokens = new Set(words); // full words always included
  for (const word of words) {
    // Add prefixes starting from length 2
    for (let i = 2; i < word.length; i++) {
      tokens.add(word.slice(0, i));
    }
  }
  return [...tokens];
}
