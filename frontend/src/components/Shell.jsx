import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Boxes, Receipt, BarChart3, Users, Search, ShieldCheck, LogOut,
  Truck, Undo2,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/stock', label: 'Stock', icon: Boxes },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/returns', label: 'Returns', icon: Undo2 },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/search', label: 'Search', icon: Search },
];

export default function Shell({ children }) {
  const { user, school, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 text-white flex flex-col no-print" style={{ background: 'var(--color-navy)' }}>
        <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
          {school?.logo_path && (
            <img src={school.logo_path} alt={`${school.name} logo`}
              className="w-10 h-10 rounded-full object-cover shrink-0 bg-white" />
          )}
          <div className="min-w-0">
            <div className="font-display text-lg leading-tight truncate">{school?.name || 'Uniform Shop'}</div>
            <div className="text-xs text-white/50 mt-0.5 tracking-wide truncate">{school?.address || ''}</div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) => (isActive ? { background: 'var(--color-maroon)' } : {})}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) => (isActive ? { background: 'var(--color-maroon)' } : {})}
            >
              <ShieldCheck size={17} strokeWidth={2} />
              Admin
            </NavLink>
          )}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 text-xs text-white/50 mb-2">
            Signed in as <span className="text-white/80">{user?.username}</span> · {user?.role}
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/5"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
