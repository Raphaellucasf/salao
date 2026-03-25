import { useCallback } from 'react';

/**
 * Persiste o estado de um formulário no localStorage enquanto o usuário preenche.
 * Usado para evitar perda de dados ao fechar/atualizar o modal antes de salvar.
 *
 * @param key  Chave única para o formulário (ex: 'cliente_novo', 'produto_novo')
 */
export function useFormCache<T extends object>(key: string) {
  const storageKey = `otimiza_form_cache_${key}`;

  const save = useCallback(
    (data: T) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        // localStorage pode estar indisponível (modo privado, quota cheia)
      }
    },
    [storageKey]
  );

  const load = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  return { save, load, clear };
}
