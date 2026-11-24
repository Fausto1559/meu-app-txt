declare module '*.css';

declare module '@vercel/node' {
  export interface VercelRequest {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
    body?: unknown;
  }

  export interface VercelResponse {
    setHeader(name: string, value: string | number | string[]): void;
    status(code: number): VercelResponse;
    json(payload: unknown): VercelResponse;
  }
}
