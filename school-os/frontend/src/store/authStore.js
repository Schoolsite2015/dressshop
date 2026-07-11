import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { Capacitor } from "@capacitor/core";

// Custom storage engine that uses Secure Storage on mobile and localStorage on web
const customStorage = {
  getItem: async (name) => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { value } = await SecureStorage.get({ key: name });
        return value || null;
      } catch (e) {
        console.error("SecureStorage get error", e);
        return null;
      }
    }
    return localStorage.getItem(name);
  },
  setItem: async (name, value) => {
    if (Capacitor.isNativePlatform()) {
      await SecureStorage.set({ key: name, value });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name) => {
    if (Capacitor.isNativePlatform()) {
      await SecureStorage.remove({ key: name });
    } else {
      localStorage.removeItem(name);
    }
  },
};

export const useAuthStore = create(
  persist(
    (set) => ({
      // ── School OS session ─────────────────────────────────────────────────
      token: null, // this will be the accessToken
      refreshToken: null,
      user: null, // { id, name, email, role }
      
      login: (token, refreshToken, user) => set({ token, refreshToken, user }),
      
      logout: () => set({ token: null, refreshToken: null, user: null }),
      
      updateToken: (token, refreshToken) => set((state) => ({ ...state, token, refreshToken })),

      // ── Dress Shop session (Not updated yet) ──────────────────────────────
      shopToken: null,
      shopUser: null,
      shopSchool: null,
      shopLogin: (shopToken, shopUser, shopSchool) =>
        set({ shopToken, shopUser, shopSchool }),
      shopLogout: () =>
        set({ shopToken: null, shopUser: null, shopSchool: null }),
    }),
    { 
      name: "school-os-auth",
      storage: createJSONStorage(() => customStorage)
    }
  )
);
