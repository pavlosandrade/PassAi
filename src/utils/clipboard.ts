let clearTimerId: ReturnType<typeof setTimeout> | null = null;

export interface CopyToClipboardOptions {
  autoClearSeconds?: number;
  onCleared?: () => void;
}

/**
 * Copia um texto para a área de transferência do sistema e programa a limpeza automática.
 *
 * @param text O texto a ser copiado (ex: senha)
 * @param options Configurações de tempo e callback
 */
export async function copyToClipboard(
  text: string,
  options: CopyToClipboardOptions = {}
): Promise<boolean> {
  const { autoClearSeconds = 15, onCleared } = options;

  try {
    if (typeof window === 'undefined' || !navigator.clipboard) {
      return false;
    }

    await navigator.clipboard.writeText(text);

    // Cancela temporizador anterior se houver
    if (clearTimerId !== null) {
      clearTimeout(clearTimerId);
      clearTimerId = null;
    }

    // Agenda auto-limpeza se autoClearSeconds > 0
    if (autoClearSeconds > 0) {
      clearTimerId = setTimeout(async () => {
        try {
          // Verifica se o conteúdo atual na área de transferência ainda é o mesmo antes de limpar
          const currentText = await navigator.clipboard.readText();
          if (currentText === text) {
            await navigator.clipboard.writeText('');
          }
        } catch {
          // Caso leitor do clipboard falhe (permissão recusada), força sobrescrita vazia
          try {
            await navigator.clipboard.writeText('');
          } catch {
            /* ignore */
          }
        } finally {
          clearTimerId = null;
          if (onCleared) onCleared();
        }
      }, autoClearSeconds * 1000);
    }

    return true;
  } catch (err) {
    console.error('Falha ao copiar para a área de transferência:', err);
    return false;
  }
}
