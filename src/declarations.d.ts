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

// Keep the API's small Node.js surface typed without requiring the full
// @types/node package during Vercel's isolated production-function scan.
declare const process: {
  env: Record<string, string | undefined>;
};

interface Buffer extends Uint8Array {
  toString(encoding?: string): string;
}

declare const Buffer: {
  from(value: string, encoding?: string): Buffer;
};

declare module 'node:crypto' {
  export function timingSafeEqual(
    first: Uint8Array,
    second: Uint8Array,
  ): boolean;
}
