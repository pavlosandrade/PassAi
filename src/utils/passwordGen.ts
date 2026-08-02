export interface PasswordGenOptions {
  length?: number;
  useUppercase?: boolean;
  useLowercase?: boolean;
  useNumbers?: boolean;
  useSymbols?: boolean;
  avoidSimilar?: boolean; // Evita caracteres ambíguos (I, l, 1, O, 0)
}

export interface PassphraseOptions {
  wordCount?: number;
  separator?: string;
  capitalize?: boolean;
  includeNumber?: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0 a 100
  label: 'Fraca' | 'Média' | 'Forte' | 'Excelente';
  color: string;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const SIMILAR = /[Il1O0]/g;

const EFF_WORDLIST = [
  'astro', 'nuvem', 'sol', 'terra', 'galaxia', 'satelite', 'orbita', 'nexus', 'prisma', 'quantum',
  'cofre', 'portal', 'chave', 'escudo', 'dragao', 'horizonte', 'aurora', 'cometa', 'codigo', 'banco',
  'cristal', 'falcao', 'farol', 'floresta', 'impulso', 'labirinto', 'magma', 'oceano', 'planeta', 'raio',
  'selva', 'sombra', 'sinal', 'tempestade', 'universo', 'veloz', 'vortex', 'vulcao', 'zenite', 'alfa',
  'beta', 'delta', 'omega', 'titan', 'sirius', 'polaris', 'orion', 'andromeda', 'pulsar', 'nebula',
  'starlight', 'cyber', 'hyper', 'matrix', 'vector', 'sonic', 'blaze', 'echo', 'shadow', 'phoenix'
];

/**
 * Gera uma senha aleatória criptograficamente segura.
 */
export function generatePassword(options: PasswordGenOptions = {}): string {
  const {
    length = 16,
    useUppercase = true,
    useLowercase = true,
    useNumbers = true,
    useSymbols = true,
    avoidSimilar = false,
  } = options;

  let charset = '';
  if (useUppercase) charset += UPPERCASE;
  if (useLowercase) charset += LOWERCASE;
  if (useNumbers) charset += NUMBERS;
  if (useSymbols) charset += SYMBOLS;

  if (avoidSimilar) {
    charset = charset.replace(SIMILAR, '');
  }

  if (!charset) {
    charset = LOWERCASE + NUMBERS;
  }

  const randomValues = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues);
  } else {
    require('crypto').randomFillSync(randomValues);
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }

  return result;
}

/**
 * Gera uma frase de senha (Passphrase) legível e memorável de alta entropia.
 */
export function generatePassphrase(options: PassphraseOptions = {}): string {
  const {
    wordCount = 4,
    separator = '-',
    capitalize = true,
    includeNumber = true,
  } = options;

  const randomValues = new Uint32Array(wordCount + 1);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues);
  } else {
    require('crypto').randomFillSync(randomValues);
  }

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    let word = EFF_WORDLIST[randomValues[i] % EFF_WORDLIST.length];
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    words.push(word);
  }

  let result = words.join(separator);

  if (includeNumber) {
    const num = (randomValues[wordCount] % 90) + 10; // Número de 2 dígitos (10-99)
    result += `${separator}${num}`;
  }

  return result;
}

/**
 * Calcula o diagnóstico de força de uma senha.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: 'Fraca', color: 'var(--color-danger)' };
  }

  let score = 0;

  // Tamanho
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 15;
  if (password.length >= 20) score += 10;

  // Variedade de caracteres
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  if (score < 40) {
    return { score, label: 'Fraca', color: 'var(--color-danger)' };
  } else if (score < 70) {
    return { score, label: 'Média', color: 'var(--color-warning)' };
  } else if (score < 90) {
    return { score, label: 'Forte', color: 'var(--accent-cyan)' };
  } else {
    return { score: 100, label: 'Excelente', color: 'var(--accent-emerald)' };
  }
}
