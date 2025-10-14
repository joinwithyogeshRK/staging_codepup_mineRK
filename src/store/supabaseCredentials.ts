import { create } from "zustand";

export interface SupabaseCredentialsState {
  supabaseAccessToken?: string; // Service role token from user table (supabaseToken)
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  databaseUrl?: string;

  // actions
  setAccessToken: (token?: string) => void;
  setProjectCredentials: (creds: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    databaseUrl?: string;
  }) => void;
  clear: () => void;
}

export const useSupabaseCredentialsStore = create<SupabaseCredentialsState>((set) => ({
  supabaseAccessToken: undefined,
  supabaseUrl: undefined,
  supabaseAnonKey: undefined,
  databaseUrl: undefined,

  setAccessToken: (token) => set({ supabaseAccessToken: token }),
  setProjectCredentials: ({ supabaseUrl, supabaseAnonKey, databaseUrl }) =>
    set({ supabaseUrl, supabaseAnonKey, databaseUrl }),
  clear: () =>
    set({
      supabaseAccessToken: undefined,
      supabaseUrl: undefined,
      supabaseAnonKey: undefined,
      databaseUrl: undefined,
    }),
}));


