const KEY = 'adminAuth';

export const authStorage = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch {
      localStorage.removeItem(KEY);
      return null;
    }
  },
  set(value) {
    if (!value?.accessToken || !value?.user) return;
    localStorage.setItem(KEY, JSON.stringify(value));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
  token() {
    return this.get()?.accessToken || null;
  }
};
