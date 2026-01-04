/**
 * Common Password List
 * Top 100 most commonly breached passwords
 * Source: Various security breach databases (RockYou, Have I Been Pwned, etc.)
 */

export const COMMON_PASSWORDS = new Set([
  '123456', 'password', '123456789', '12345678', '12345',
  '1234567', '1234567890', 'qwerty', 'abc123', '111111',
  '123123', 'admin', 'letmein', 'welcome', 'monkey',
  '12345678910', 'dragon', '1234', 'baseball', 'iloveyou',
  'trustno1', '1234567', 'sunshine', 'master', 'welcome',
  'shadow', 'ashley', 'football', 'jesus', 'michael',
  'ninja', 'mustang', 'password1', '1234567890', 'qwerty123',
  'admin123', 'qwertyuiop', '123qwe', '000000', '12345',
  'princess', 'rockyou', '1qaz2wsx', 'access', 'passw0rd',
  'superman', 'qazwsx', 'michael1', 'football1', 'welcome123',
  'qwerty1', 'letmein1', 'login', 'pass', 'root',
  'toor', 'master123', 'admin1', 'password123', 'welcome1',
  'qwerty12345', 'letmein123', 'admin12345', 'password12', 'abc123456',
  'password2', '123456789a', 'pass1234', 'qwerty12', 'admin12',
  'password!', 'qwerty1234', '123456789!', 'pass123', 'qwertyui',
  'letmein!', 'admin!', 'password01', 'qwerty1!', 'welcome!',
  '123456789abc', 'password99', 'qwertyuiop1', 'admin123!', 'pass1234!'
]);

/**
 * Check if a password is in the common passwords list
 */
export const isCommonPassword = (password: string): boolean => {
  // Check exact match
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return true;
  }
  
  // Check common variations (password + number, password + common suffix)
  const lowerPassword = password.toLowerCase();
  const commonVariations = [
    /^password\d+$/,           // password1, password123
    /^12345\d*$/,              // 12345, 123456, 123456789
    /^qwerty\d*$/,             // qwerty1, qwerty123
    /^admin\d*$/,              // admin1, admin123
    /^welcome\d*$/,            // welcome1, welcome123
    /^letmein\d*$/             // letmein1, letmein123
  ];
  
  return commonVariations.some(pattern => pattern.test(lowerPassword));
};

/**
 * Check password against Have I Been Pwned API (top 10k breached passwords)
 * Note: This is a client-side check. For production, consider a server-side proxy
 * to avoid exposing API keys and reduce latency.
 */
export const checkPasswordBreach = async (password: string): Promise<boolean> => {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Use first 5 chars for k-anonymity API (Have I Been Pwned)
    const prefix = hashHex.substring(0, 5).toUpperCase();
    const suffix = hashHex.substring(5).toUpperCase();
    
    // Fetch from Have I Been Pwned API (k-anonymity model)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    
    // Check if our hash suffix is in the response
    const hashes = text.split('\n');
    return hashes.some(line => {
      const [hash, count] = line.split(':');
      return hash === suffix && parseInt(count) > 0;
    });
  } catch (error) {
    // If API call fails, fall back to local common passwords check
    return isCommonPassword(password);
  }
};

