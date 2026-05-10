const PREFIX = "llm-playground:";

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    throw new Error(`Failed to write "${key}" to localStorage: ${e instanceof Error ? e.message : String(e)}`);
  }
}
