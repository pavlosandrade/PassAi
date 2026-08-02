/**
 * sessionService.ts
 *
 * Persiste a sessão ativa do usuário no sessionStorage.
 * - Sobrevive a recargas de página (F5)
 * - É limpo automaticamente ao fechar a aba/janela
 * - Nunca é gravado em localStorage (não persiste entre sessões)
 */

const SESSION_EMAIL_KEY = 'passai_session_email';
const SESSION_PASSWORD_KEY = 'passai_session_password';

/**
 * Salva a sessão ativa após login bem-sucedido.
 */
export function saveSession(email: string, masterPassword: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_EMAIL_KEY, email);
  sessionStorage.setItem(SESSION_PASSWORD_KEY, masterPassword);
}

/**
 * Recupera a sessão ativa (se existir).
 */
export function loadSession(): { email: string; masterPassword: string } | null {
  if (typeof window === 'undefined') return null;
  const email = sessionStorage.getItem(SESSION_EMAIL_KEY);
  const masterPassword = sessionStorage.getItem(SESSION_PASSWORD_KEY);
  if (email && masterPassword) return { email, masterPassword };
  return null;
}

/**
 * Remove a sessão (logout / trancamento).
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_EMAIL_KEY);
  sessionStorage.removeItem(SESSION_PASSWORD_KEY);
}
