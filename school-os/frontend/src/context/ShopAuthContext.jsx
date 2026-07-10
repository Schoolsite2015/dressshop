/**
 * ShopAuthContext — adapts the Zustand shopToken/shopUser/shopSchool state
 * into a React context so dress shop pages can use useShopAuth() exactly
 * like the original useAuth() hook from the dress shop project.
 */
import { createContext, useContext } from "react";
import { useAuthStore } from "../store/authStore.js";

const ShopAuthContext = createContext(null);

export function ShopAuthProvider({ children }) {
  const {
    shopToken,
    shopUser,
    shopSchool,
    shopLogin,
    shopLogout,
  } = useAuthStore();

  const value = {
    user: shopUser,
    school: shopSchool,
    token: shopToken,
    isAdmin: shopUser?.role === "admin",
    logout: shopLogout,
    login: shopLogin,
  };

  return (
    <ShopAuthContext.Provider value={value}>
      {children}
    </ShopAuthContext.Provider>
  );
}

export function useShopAuth() {
  return useContext(ShopAuthContext);
}
