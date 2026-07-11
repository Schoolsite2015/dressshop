import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

import { useEffect } from "react";
import { api } from "../lib/api.js";

// Wrap any dashboard route. If allowedRoles is given, only those roles pass.
// Pass shopRoute={true} to guard dress-shop routes (checks shopToken instead).
export default function ProtectedRoute({ children, allowedRoles, shopRoute }) {
  const { token, user, shopToken, shopUser, login } = useAuthStore();

  useEffect(() => {
    if (token && !shopRoute) {
      api.get("/auth/me").then(res => {
        if (res.data?.user) {
          login(token, useAuthStore.getState().refreshToken, res.data.user);
        }
      }).catch(() => {});
    }
  }, [token, shopRoute, login]);

  if (shopRoute) {
    if (!shopToken || !shopUser) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(shopUser.role)) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
