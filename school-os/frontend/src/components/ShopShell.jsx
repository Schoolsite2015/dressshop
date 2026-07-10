/**
 * ShopShell — the sidebar + main layout for the Dress Shop module.
 * Styled to match the School OS indigo design system while using
 * the dress shop's own navigation items and maroon accent colour.
 */
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import logoUrl from "../assets/logo.png";
import {
  LayoutDashboard, Boxes, Receipt, BarChart3, Users,
  Search, ShieldCheck, LogOut, Truck, Undo2, ShoppingBag,
} from "lucide-react";

const navItems = [
  { to: "/shop",          label: "Dashboard",  icon: LayoutDashboard, end: true },
  { to: "/shop/stock",    label: "Stock",       icon: Boxes },
  { to: "/shop/billing",  label: "Billing",     icon: Receipt },
  { to: "/shop/returns",  label: "Returns",     icon: Undo2 },
  { to: "/shop/reports",  label: "Reports",     icon: BarChart3 },
  { to: "/shop/customers",label: "Customers",   icon: Users },
  { to: "/shop/suppliers",label: "Suppliers",   icon: Truck },
  { to: "/shop/search",   label: "Search",      icon: Search },
];

export default function ShopShell({ children }) {
  const { shopUser, shopSchool, shopLogout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = shopUser?.role === "admin";

  const initials = (shopUser?.username || "U")
    .slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-paper">
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 flex flex-col no-print"
        style={{ background: "linear-gradient(180deg, #1B2A4A 0%, #162240 100%)" }}>

        {/* Logo + school header */}
        <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
          {shopSchool?.logo_path ? (
            <img
              src={shopSchool.logo_path.startsWith("/logos") ? shopSchool.logo_path.replace("/logos", "/shop-logos") : shopSchool.logo_path}
              alt={shopSchool.name}
              className="w-10 h-10 rounded-full object-cover shrink-0 bg-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <ShoppingBag size={18} className="text-white/60" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold leading-tight text-white truncate">
              {shopSchool?.name || "Uniform Shop"}
            </p>
            <p className="text-white/40 text-[10px] mt-0.5 truncate">
              {shopSchool?.address || ""}
            </p>
          </div>
        </div>

        {/* Module badge */}
        <div className="px-4 py-2 border-b border-white/10"
          style={{ background: "rgba(122, 46, 46, 0.3)" }}>
          <span className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: "#e8a0a0" }}>
            🛍 Uniform Shop Module
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  isActive
                    ? "text-white font-medium"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`
              }
              style={({ isActive }) =>
                isActive ? { background: "var(--color-maroon, #7A2E2E)", boxShadow: "inset 3px 0 0 #E8940F" } : {}
              }
            >
              <Icon size={16} className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}

          {/* Admin link — only for admin role */}
          {isAdmin && (
            <NavLink
              to="/shop/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  isActive
                    ? "text-white font-medium"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`
              }
              style={({ isActive }) =>
                isActive ? { background: "var(--color-maroon, #7A2E2E)", boxShadow: "inset 3px 0 0 #E8940F" } : {}
              }
            >
              <ShieldCheck size={16} className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition" />
              <span className="truncate">Admin</span>
            </NavLink>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
              style={{ background: "var(--color-maroon, #7A2E2E)" }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{shopUser?.username}</p>
              <p className="text-white/40 text-xs capitalize">{shopUser?.role}</p>
            </div>
          </div>
          <button
            onClick={() => { shopLogout(); navigate("/login"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/60
                       hover:bg-red-500/20 hover:text-red-300 transition-all"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10 no-print">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="School logo" className="w-7 h-7 object-contain opacity-60" />
            <span className="text-xs text-gray-400 font-medium">
              School OS <span className="text-gray-300 mx-1">›</span>
              <span style={{ color: "var(--color-maroon, #7A2E2E)" }} className="font-semibold">Uniform Shop</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="hidden sm:inline">{shopSchool?.name}</span>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto animate-fade-in
          [--color-navy:#1B2A4A] [--color-navy-light:#2C4270]
          [--color-maroon:#7A2E2E] [--color-maroon-light:#9C4646]
          [--color-gold:#C89B3C] [--color-paper:#FAF8F3] [--color-ink:#22252B]">
          {children}
        </div>
      </main>
    </div>
  );
}
