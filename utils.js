
// == Helpers: Safe Get/Set localStorage ==
export function safeLocalStorageGetItem(key, defaultValue) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function safeLocalStorageSetItem(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}
