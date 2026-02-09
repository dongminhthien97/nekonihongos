const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "nekoUser";
const SPLASH_KEY = "nekoSplashSeen";

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const refreshTokenStorage = {
  get: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clear: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
};

export const userStorage = {
  get: () => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  set: (user: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => localStorage.removeItem(USER_KEY),
};

export const splashStorage = {
  get: (): boolean => localStorage.getItem(SPLASH_KEY) === "true",
  set: (seen: boolean) => localStorage.setItem(SPLASH_KEY, String(seen)),
  clear: () => localStorage.removeItem(SPLASH_KEY),
};

export const clearAuthStorage = () => {
  tokenStorage.clear();
  refreshTokenStorage.clear();
  userStorage.clear();
  splashStorage.clear();
};
