// client/utils/adminHelpers.ts
// Mirrors the pattern of helpers.js but uses "adminToken" key
// so regular user tokens and admin tokens never overlap.

const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_USER_KEY = "adminUser";

export const getAdminToken = (): string | null => {
   if (typeof window === "undefined") return null;
   return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const setAdminToken = (token: string): void => {
   localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const removeAdminToken = (): void => {
   localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const getStoredAdminUser = (): Record<string, unknown> | null => {
   if (typeof window === "undefined") return null;
   const raw = localStorage.getItem(ADMIN_USER_KEY);
   if (!raw) return null;
   try {
      return JSON.parse(raw);
   } catch {
      return null;
   }
};

export const setStoredAdminUser = (user: Record<string, unknown>): void => {
   localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
};

export const removeStoredAdminUser = (): void => {
   localStorage.removeItem(ADMIN_USER_KEY);
};
