import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import logoUrl from "../assets/logo.png";
import {
  LayoutDashboard, Users, ClipboardCheck, CreditCard, UserPlus,
  Calendar, BookOpen, Bell, BarChart2, Sparkles, Lightbulb,
  FileText, Bus, BookMarked, Home, Package, Briefcase, Award,
  Star, MessageCircle, LogOut, ChevronRight, School, Settings,
  ShoppingBag,
} from "lucide-react";


const MODULES = {
  principal: [
    { label: "Analytics",           path: "/dashboard/principal",              icon: LayoutDashboard },
    { label: "Students",            path: "/dashboard/office",                 icon: Users },
    { label: "Admissions",          path: "/dashboard/office",                 icon: UserPlus },
    { label: "Fee Collection",      path: "/dashboard/office",                 icon: CreditCard },
    { label: "Timetable",           path: "/dashboard/timetable",              icon: Calendar },
    { label: "Notices",             path: "/dashboard/notices",                icon: Bell },
    { label: "HR & Payroll",        path: "/dashboard/hr",                     icon: Briefcase },
    { label: "Transport",           path: "/dashboard/transport",              icon: Bus },
    { label: "Library",             path: "/dashboard/library",                icon: BookMarked },
    { label: "Hostel",              path: "/dashboard/hostel",                 icon: Home },
    { label: "Inventory",           path: "/dashboard/inventory",              icon: Package },
    { label: "Certificates",        path: "/dashboard/certificates",           icon: Award },
    { label: "Events",              path: "/dashboard/events",                 icon: Star },
    { label: "Admin Settings",      path: "/dashboard/admin",                  icon: Settings },
    { label: "Uniform Shop",        path: "/shop",                             icon: ShoppingBag },
  ],
  teacher: [
    { label: "Quick Attendance",    path: "/dashboard/teacher/quick-attendance", icon: UserPlus },
    { label: "Attendance",          path: "/dashboard/teacher/attendance",     icon: ClipboardCheck },
    { label: "Gradebook",           path: "/dashboard/teacher/gradebook",      icon: BarChart2 },
    { label: "AI Report Card",      path: "/dashboard/teacher/report-card",    icon: Sparkles },
    { label: "AI Lesson Planner",   path: "/dashboard/teacher/lesson-planner", icon: Lightbulb },
    { label: "AI Question Paper",   path: "/dashboard/teacher/question-paper", icon: FileText },
    { label: "Homework",            path: "/dashboard/homework",               icon: BookOpen },
    { label: "Timetable",          path: "/dashboard/timetable",              icon: Calendar },
    { label: "Notices",             path: "/dashboard/notices",                icon: Bell },
    { label: "Messages",            path: "/dashboard/messages",               icon: MessageCircle },
  ],
  student: [
    { label: "My Dashboard",        path: "/dashboard/student",                icon: LayoutDashboard },
    { label: "Homework",            path: "/dashboard/homework",               icon: BookOpen },
    { label: "Timetable",           path: "/dashboard/timetable",              icon: Calendar },
    { label: "Notices",             path: "/dashboard/notices",                icon: Bell },
    { label: "Library",             path: "/dashboard/library",                icon: BookMarked },
    { label: "Events",              path: "/dashboard/events",                 icon: Star },
  ],
  parent: [
    { label: "Dashboard",           path: "/dashboard/parent",                 icon: LayoutDashboard },
    { label: "Homework",            path: "/dashboard/homework",               icon: BookOpen },
    { label: "Timetable",           path: "/dashboard/timetable",              icon: Calendar },
    { label: "Notices",             path: "/dashboard/notices",                icon: Bell },
    { label: "Transport",           path: "/dashboard/transport",              icon: Bus },
    { label: "Events",              path: "/dashboard/events",                 icon: Star },
    { label: "Messages",            path: "/dashboard/messages",               icon: MessageCircle },
  ],
  office: [
    { label: "Admissions & Fees",   path: "/dashboard/office",                 icon: UserPlus },
    { label: "Students",            path: "/dashboard/office",                 icon: Users },
    { label: "Notices",             path: "/dashboard/notices",                icon: Bell },
    { label: "Certificates",        path: "/dashboard/certificates",           icon: Award },
    { label: "Events",              path: "/dashboard/events",                 icon: Star },
    { label: "Messages",            path: "/dashboard/messages",               icon: MessageCircle },
    { label: "Admin Settings",      path: "/dashboard/admin",                  icon: Settings },
    { label: "Uniform Shop",         path: "/shop",                             icon: ShoppingBag },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const modules  = MODULES[user?.role] || [];

  const initials = (user?.name || "U")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside className="w-64 bg-indigo-700 text-white min-h-screen flex flex-col flex-shrink-0">
      {/* ── Logo & School ── */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <img src={logoUrl} alt="School logo" className="w-12 h-12 object-contain flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold leading-tight">St. S.N. Public School</p>
          <p className="text-indigo-300 text-xs mt-0.5">Pindra, Varanasi</p>
          <p className="text-marigold-400 text-[10px] mt-1 font-medium">विद्या ददाति विनयम्</p>
        </div>
      </div>

      {/* ── Role badge ── */}
      <div className="px-4 py-2 bg-indigo-600/40 border-b border-white/10">
        <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold">
          {user?.role} portal
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {modules.map((m) => {
          const Icon = m.icon || ChevronRight;
          return (
            <NavLink
              key={m.label + m.path}
              to={m.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  isActive
                    ? "nav-active text-white font-medium"
                    : "text-indigo-200 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={16} className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition" />
              <span className="truncate">{m.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-marigold-500 flex items-center justify-center flex-shrink-0">
            <span className="text-ink text-xs font-bold">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-indigo-300 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-indigo-200
                     hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}
