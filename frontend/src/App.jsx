import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Shell from './components/Shell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import Search from './pages/Search';
import Admin from './pages/Admin';
import Suppliers from './pages/Suppliers';
import Returns from './pages/Returns';

function Private({ children, adminOnly }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Private><Dashboard /></Private>} />
          <Route path="/stock" element={<Private><Stock /></Private>} />
          <Route path="/billing" element={<Private><Billing /></Private>} />
          <Route path="/reports" element={<Private><Reports /></Private>} />
          <Route path="/customers" element={<Private><Customers /></Private>} />
          <Route path="/suppliers" element={<Private><Suppliers /></Private>} />
          <Route path="/returns" element={<Private><Returns /></Private>} />
          <Route path="/search" element={<Private><Search /></Private>} />
          <Route path="/admin" element={<Private adminOnly><Admin /></Private>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
