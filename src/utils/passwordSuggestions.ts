/**
 * Password Suggestions Generator
 * Helps users create strong, memorable passwords
 */

interface PasswordSuggestion {
  password: string;
  hint: string;
  strength: 'Good' | 'Strong' | 'Very Strong';
}

/**
 * Generate random password suggestions
 * Uses memorable patterns that are still secure
 */
export const generatePasswordSuggestions = (count: number = 3): PasswordSuggestion[] => {
  const suggestions: PasswordSuggestion[] = [];
  
  // Word lists for creating memorable passwords
  const adjectives = [
    'Brave', 'Swift', 'Gentle', 'Bright', 'Calm',
    'Wise', 'Bold', 'Clever', 'Silent', 'Quick'
  ];
  
  const nouns = [
    'Tiger', 'Eagle', 'Ocean', 'Mountain', 'Forest',
    'River', 'Star', 'Moon', 'Dragon', 'Phoenix'
  ];
  
  const numbers = ['12', '23', '45', '67', '89', '13', '24', '56', '78', '90'];
  const specialChars = ['!', '@', '#', '$', '%', '&', '*', '?'];
  
  for (let i = 0; i < count; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = numbers[Math.floor(Math.random() * numbers.length)];
    const special = specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Create variations
    let password: string;
    let hint: string;
    let strength: 'Good' | 'Strong' | 'Very Strong';
    
    switch (i % 3) {
      case 0:
        // Pattern: AdjectiveNoun123!
        password = `${adj}${noun}${num}${special}`;
        hint = `Two words + numbers + symbol`;
        strength = 'Strong';
        break;
      case 1:
        // Pattern: adjective123NOUN!
        password = `${adj.toLowerCase()}${num}${noun.toUpperCase()}${special}`;
        hint = `Mixed case words + numbers + symbol`;
        strength = 'Very Strong';
        break;
      case 2:
        // Pattern: NOUN-adjective123!
        password = `${noun.toUpperCase()}-${adj.toLowerCase()}${num}${special}`;
        hint = `Uppercase + lowercase + dash + numbers + symbol`;
        strength = 'Very Strong';
        break;
      default:
        password = `${adj}${noun}${num}${special}`;
        hint = `Two words + numbers + symbol`;
        strength = 'Strong';
    }
    
    suggestions.push({ password, hint, strength });
  }
  
  return suggestions;
};

/**
 * Generate passphrase suggestions (alternative to passwords)
 * Passphrases are easier to remember and can be very secure
 */
export const generatePassphraseSuggestions = (count: number = 2): PasswordSuggestion[] => {
  const suggestions: PasswordSuggestion[] = [];
  
  const words = [
    'apple', 'bridge', 'cloud', 'dragon', 'elephant',
    'forest', 'galaxy', 'harmony', 'island', 'journey',
    'kingdom', 'lantern', 'mountain', 'nature', 'ocean',
    'palace', 'quartz', 'rainbow', 'sunset', 'temple',
    'universe', 'valley', 'waterfall', 'xenon', 'yonder',
    'zenith', 'artistic', 'brilliant', 'creative', 'dynamic'
  ];
  
  for (let i = 0; i < count; i++) {
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const word3 = words[Math.floor(Math.random() * words.length)];
    const word4 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const special = ['!', '@', '#', '$', '%'][Math.floor(Math.random() * 5)];
    
    // Pattern: word1-word2-word3-word41234!
    const password = `${word1}-${word2}-${word3}-${word4}${num}${special}`;
    const hint = `Four words with dashes + 4-digit number + symbol`;
    const strength = 'Very Strong' as const;
    
    suggestions.push({ password, hint, strength });
  }
  
  return suggestions;
};

/**
 * Get contextual password suggestion based on user's input
 */
export const getContextualSuggestion = (
  currentPassword: string
): string => {
  // Don't suggest if password is already strong
  if (currentPassword.length >= 12) {
    return '';
  }
  
  // Suggest based on what's missing
  const hasUpper = /[A-Z]/.test(currentPassword);
  const hasLower = /[a-z]/.test(currentPassword);
  const hasNumber = /\d/.test(currentPassword);
  const hasSpecial = /[@$!%*?&#]/.test(currentPassword);
  
  const suggestion = 'Try adding: ';
  const suggestions: string[] = [];
  
  if (currentPassword.length < 12) {
    suggestions.push('more characters (aim for 12+)');
  }
  if (!hasUpper) suggestions.push('uppercase letters');
  if (!hasLower) suggestions.push('lowercase letters');
  if (!hasNumber) suggestions.push('numbers');
  if (!hasSpecial) suggestions.push('special characters (!@#$%)');
  
  return suggestion + suggestions.join(', ');
};

