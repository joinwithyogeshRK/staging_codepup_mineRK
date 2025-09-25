declare module "zustand" {
  export type StateCreator<T> = (
    set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
    get?: () => T
  ) => T;

  export interface StoreApi<T> {
    getState: () => T;
    setState: (
      partial: Partial<T> | ((state: T) => Partial<T>),
      replace?: boolean,
      action?: any
    ) => void;
    subscribe?: (listener: (state: T, prevState: T) => void) => () => void;
  }

  export function create<T>(initializer: StateCreator<T>): StoreApi<T> & ((selector?: (s: T) => any) => any);
}

