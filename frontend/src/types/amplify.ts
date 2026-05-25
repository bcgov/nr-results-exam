// src/types/amplify.ts
export interface JWT {
  toString(): string;
  payload: Record<string, any>;
}

export type ProviderType = 'idir' | 'bceid';
