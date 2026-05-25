// src/types/amplify.ts
export interface JWT {
  toString?(): string;
  payload: Record<string, unknown>;
}

export type ProviderType = 'idir' | 'bceid';
