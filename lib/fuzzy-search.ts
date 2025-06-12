// Fuzzy search utility functions
export function generateTypoVariations(word: string): string[] {
  const variations = [word]; // Start with the original word
  
  if (word.length < 2) return variations;
  
  // Handle spacing variations first
  if (word.includes(' ')) {
    variations.push(word.replace(/\s+/g, '')); // Remove all spaces
  } else {
    // Add spaces in various positions for words without spaces
    for (let i = 1; i < word.length; i++) {
      variations.push(word.slice(0, i) + ' ' + word.slice(i));
    }
  }
  
  // Try adding EVERY letter at EVERY position (this is crucial for "wiskey" → "whiskey")
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i <= word.length; i++) {
    for (const letter of alphabet) {
      const variation = word.slice(0, i) + letter + word.slice(i);
      if (variation.length <= word.length + 2) { // Don't make words too long
        variations.push(variation);
      }
    }
  }
  
  // Try removing each letter (for extra letters or typos)
  for (let i = 0; i < word.length; i++) {
    if (word.length > 2) {
      variations.push(word.slice(0, i) + word.slice(i + 1));
    }
  }
  
  // Try replacing each letter with similar letters
  const similarLetters = {
    'a': ['e', 'o', 'u'],
    'e': ['a', 'i', 'o'],
    'i': ['e', 'y', 'a'],
    'o': ['u', 'a', 'e'],
    'u': ['o', 'i', 'a'],
    'y': ['i', 'e'],
    'c': ['k', 's'],
    'k': ['c', 'q'],
    's': ['z', 'c'],
    'z': ['s'],
    'ph': ['f'],
    'f': ['ph'],
    'ck': ['k'],
    'qu': ['kw', 'q'],
    'ei': ['ie'],
    'ie': ['ei']
  };
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i].toLowerCase();
    
    // Single character replacements
    if (similarLetters[char as keyof typeof similarLetters]) {
      const replacements = similarLetters[char as keyof typeof similarLetters];
      replacements.forEach(replacement => {
        variations.push(word.slice(0, i) + replacement + word.slice(i + 1));
      });
    }
    
    // Two-character patterns
    if (i < word.length - 1) {
      const twoChar = word.slice(i, i + 2).toLowerCase();
      if (similarLetters[twoChar as keyof typeof similarLetters]) {
        const replacements = similarLetters[twoChar as keyof typeof similarLetters];
        replacements.forEach(replacement => {
          variations.push(word.slice(0, i) + replacement + word.slice(i + 2));
        });
      }
    }
  }
  
  // Try swapping adjacent characters (for transposed letters)
  for (let i = 0; i < word.length - 1; i++) {
    const chars = word.split('');
    [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
    variations.push(chars.join(''));
  }
  
  // Special case handling for "wiskey" ↔ "whiskey" pattern
  if (word.toLowerCase().includes('wis')) {
    variations.push(word.toLowerCase().replace('wis', 'whis'));
  }
  if (word.toLowerCase().includes('whis')) {
    variations.push(word.toLowerCase().replace('whis', 'wis'));
  }
  
  // Handle "ey" ↔ "y" endings
  if (word.endsWith('ey')) {
    variations.push(word.slice(0, -2) + 'y');
  }
  if (word.endsWith('y') && word.length > 3) {
    variations.push(word.slice(0, -1) + 'ey');
  }
  
  // Handle "ske" ↔ "sk" patterns
  if (word.includes('ske')) {
    variations.push(word.replace(/ske/g, 'sk'));
  }
  if (word.includes('sk') && !word.includes('ske')) {
    variations.push(word.replace(/sk/g, 'ske'));
  }
  
  // Remove duplicates and filter out very short variations
  const uniqueVariations = Array.from(new Set(variations))
    .filter(v => v.length >= Math.max(2, word.length - 2)); // Don't make words too short
  
  return uniqueVariations;
}

export function createFuzzySearchTerms(query: string): string[] {
  if (!query || query.trim().length === 0) return [];
  
  const trimmedQuery = query.trim().toLowerCase();
  const allVariations: string[] = [];
  
  // Add the original query
  allVariations.push(trimmedQuery);
  
  // Add variations of the entire query (handle spacing)
  allVariations.push(trimmedQuery.replace(/\s+/g, '')); // Remove all spaces
  allVariations.push(trimmedQuery.replace(/\s+/g, ' ')); // Normalize spaces
  
  // Split into words and process each word (but only if longer than 1 char)
  const words = trimmedQuery.split(' ').filter(word => word.length > 1);
  
  words.forEach(word => {
    const variations = generateTypoVariations(word);
    allVariations.push(...variations);
  });
  
  return Array.from(new Set(allVariations));
} 