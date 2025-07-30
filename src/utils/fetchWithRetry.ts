// Utilitaire pour fetch avec retry - améliore la compatibilité mobile
export interface FetchWithRetryOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retryOptions: FetchWithRetryOptions = {}
): Promise<Response> => {
  const { retries = 3, retryDelay = 1000, timeout = 10000 } = retryOptions;

  // Configuration par défaut pour mobile
  const defaultOptions: RequestInit = {
    cache: "no-cache",
    credentials: "omit",
    mode: "cors",
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      ...options.headers,
    },
  };

  // Fonction de timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), timeout);
  });

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await Promise.race([
        fetch(url, defaultOptions),
        timeoutPromise,
      ]);

      // Si la réponse est OK ou si c'est le dernier essai
      if (response.ok || i === retries) {
        return response;
      }

      // Si erreur serveur (5xx), on retry
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Autres erreurs, on ne retry pas
      return response;
    } catch (error) {
      console.warn(`Fetch attempt ${i + 1} failed:`, error);

      // Si c'est le dernier essai, on throw l'erreur
      if (i === retries) {
        throw error;
      }

      // Attendre avant le prochain essai
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)));
    }
  }

  throw new Error("Max retries exceeded");
};
