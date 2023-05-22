declare global {
  type AnyObject<T = unknown> = Record<string, T>;

  type Unknown = unknown | Promise<unknown>;
}

export {};
