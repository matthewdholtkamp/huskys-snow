/**
 * Decrypts a key that was obfuscated using Reverse -> Rot13 -> Base64.
 * The decryption process is the inverse: Base64 Decode -> Rot13 -> Reverse.
 */
export const revealKey = (obfuscatedKey: string): string => {
  // 1. Base64 Decode
  const rot13Reversed = atob(obfuscatedKey);

  // 2. Rot13 (Rot13 is its own inverse)
  const reversed = rot13Reversed.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });

  // 3. Reverse
  return reversed.split('').reverse().join('');
};
