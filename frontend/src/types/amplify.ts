// src/types/amplify.ts

/**
 * JWT token interface compatible with existing code
 */
export interface JWT {
  payload: Record<string, unknown>;
  toString(): string;
}

export type ProviderType = 'idir' | 'bceid';
