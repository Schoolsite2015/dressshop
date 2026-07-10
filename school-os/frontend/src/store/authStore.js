import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      // ── School OS session ─────────────────────────────────────────────────
      token: null,
      user: null, // { id, name, email, role }
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),

      // ── Dress Shop session ────────────────────────────────────────────────
      shopToken: null,
      shopUser: null,   // { id, username, role, school_id }
      shopSchool: null, // { id, name, address, phone, email, logo_path }
      shopLogin: (shopToken, shopUser, shopSchool) =>
        set({ shopToken, shopUser, shopSchool }),
      shopLogout: () =>
        set({ shopToken: null, shopUser: null, shopSchool: null }),
    }),
    { name: "school-os-auth" }
  )
);
