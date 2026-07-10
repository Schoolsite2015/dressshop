import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

// Wrap any dashboard route. If allowedRoles is given, only those roles pass.
// Pass shopRoute={true} to guard dress-shop routes (checks shopToken instead).
export default function ProtectedRoute({ children, allowedRoles, shopRoute }) {
  const { token, user, shopToken, shopUser } = useAuthStore();

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
