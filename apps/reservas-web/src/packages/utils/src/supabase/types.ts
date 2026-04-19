export interface CookieMethodsServer {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (
    cookies: Array<{
      name: string;
      value: string;
      options?: Record<string, unknown>;
    }>
  ) => void;
}
