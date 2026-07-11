import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import logoUrl from "../assets/logo.png";
import {
  LayoutDashboard, Users, ClipboardCheck, CreditCard, UserPlus,
  Calendar, BookOpen, Bell, BarChart2, Sparkles, Lightbulb,
  FileText, Bus, BookMarked, Home, Package, Briefcase, Award,
  Star, MessageCircle, LogOut, ChevronRight, ChevronDown, Settings,
  ShoppingBag, Receipt, TrendingUp, PieChart, Wallet, Activity,
  Menu, X, UserCheck, Fingerprint, MonitorPlay
} from "lucide-react";


/* ── Section-based menu config ── */
const SECTIONS = {
  principal: [
    {
      title: "Overview",
      items: [
        { label: "Analytics",        path: "/dashboard/principal",              icon: LayoutDashboard },
        { label: "Reports Hub",      path: "/dashboard/reports",                icon: PieChart, badge: "NEW" },
      ],
    },
    {
      title: "Academic",
      items: [
        { label: "Students",         path: "/dashboard/office",                 icon: Users },
        { label: "Admissions",       path: "/dashboard/office",                 icon: UserPlus },
        { label: "Timetable",        path: "/dashboard/timetable",              icon: Calendar },
        { label: "Notices",          path: "/dashboard/notices",                icon: Bell },
      ],
    },
    {
      title: "Finance",
      items: [
        { label: "Fee Collection",   path: "/dashboard/office",                 icon: CreditCard },
        { label: "Fee Analytics",    path: "/dashboard/fees/analytics",         icon: TrendingUp, badge: "NEW" },
        { label: "Fee Receipts",     path: "/dashboard/fees/receipt/demo",      icon: Receipt, badge: "NEW" },
      ],
    },
    {
      title: "Examinations",
      items: [
        { label: "Exam Scheduler",   path: "/dashboard/office/exam-scheduler",  icon: Calendar, badge: "NEW" },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "HR & Payroll",     path: "/dashboard/hr",                     icon: Briefcase },
        { label: "Transport",        path: "/dashboard/transport",              icon: Bus },
        { label: "Library",          path: "/dashboard/library",                icon: BookMarked },
        { label: "Hostel",           path: "/dashboard/hostel",                 icon: Home },
        { label: "Inventory",        path: "/dashboard/inventory",              icon: Package },
        { label: "Certificates",     path: "/dashboard/certificates",           icon: Award },
        { label: "Events",           path: "/dashboard/events",                 icon: Star },
        { label: "Messages",        path: "/dashboard/messages",               icon: MessageCircle },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Admin Settings",   path: "/dashboard/admin",                  icon: Settings },
        { label: "Uniform Shop",     path: "/shop",                             icon: ShoppingBag },
      ],
    },
  ],
  teacher: [
    {
      title: "Teaching",
      items: [
        { label: "Attendance",       path: "/dashboard/teacher/attendance",     icon: ClipboardCheck },
        { label: "Gradebook",        path: "/dashboard/teacher/gradebook",      icon: BarChart2 },
        { label: "AI Report Card",   path: "/dashboard/teacher/report-card",    icon: Sparkles },
        { label: "AI Lesson Planner",path: "/dashboard/teacher/lesson-planner", icon: Lightbulb },
        { label: "AI Question Paper",path: "/dashboard/teacher/question-paper", icon: FileText },
        { label: "Smart Board",      path: "/dashboard/teacher/smart-board",    icon: MonitorPlay, badge: "NEW" },
      ],
    },
    {
      title: "School",
      items: [
        { label: "Homework",         path: "/dashboard/homework",               icon: BookOpen },
        { label: "Timetable",        path: "/dashboard/timetable",              icon: Calendar },
        { label: "Notices",          path: "/dashboard/notices",                icon: Bell },
        { label: "Messages",        path: "/dashboard/messages",               icon: MessageCircle },
      ],
    },
  ],
  student: [
    {
      title: "My Space",
      items: [
        { label: "My Dashboard",     path: "/dashboard/student",                icon: LayoutDashboard },
        { label: "Homework",         path: "/dashboard/homework",               icon: BookOpen },
        { label: "Timetable",        path: "/dashboard/timetable",              icon: Calendar },
        { label: "My Bus",           path: "/dashboard/my-bus",                 icon: Bus },
        { label: "Digital ID Card",  path: "/dashboard/student/id-card",        icon: Fingerprint, badge: "NEW" },
      ],
    },
    {
      title: "School",
      items: [
        { label: "Notices",          path: "/dashboard/notices",                icon: Bell },
        { label: "Library",          path: "/dashboard/library",                icon: BookMarked },
        { label: "Events",           path: "/dashboard/events",                 icon: Star },
      ],
    },
  ],
  parent: [
    {
      title: "My Child",
      items: [
        { label: "Dashboard",        path: "/dashboard/parent",                 icon: LayoutDashboard },
        { label: "Homework",         path: "/dashboard/homework",               icon: BookOpen },
        { label: "Timetable",        path: "/dashboard/timetable",              icon: Calendar },
        { label: "Track Bus",        path: "/dashboard/my-bus",                 icon: Bus },
      ],
    },
    {
      title: "School",
      items: [
        { label: "Notices",          path: "/dashboard/notices",                icon: Bell },
        { label: "Events",           path: "/dashboard/events",                 icon: Star },
        { label: "Messages",        path: "/dashboard/messages",               icon: MessageCircle },
      ],
    },
  ],
  office: [
    {
      title: "Operations",
      items: [
        { label: "Visitor Log",      path: "/dashboard/office/visitors",        icon: UserCheck, badge: "NEW" },
        { label: "Exam Scheduler",   path: "/dashboard/office/exam-scheduler",  icon: Calendar, badge: "NEW" },
        { label: "Admissions & Fees",path: "/dashboard/office",                 icon: UserPlus },
        { label: "Fee Analytics",    path: "/dashboard/fees/analytics",         icon: TrendingUp, badge: "NEW" },
        { label: "Fee Receipts",     path: "/dashboard/fees/receipt/demo",      icon: Receipt, badge: "NEW" },
        { label: "Reports Hub",      path: "/dashboard/reports",                icon: PieChart, badge: "NEW" },
        { label: "Students",         path: "/dashboard/office",                 icon: Users },
      ],
    },
    {
      title: "School",
      items: [
        { label: "Notices",          path: "/dashboard/notices",                icon: Bell },
        { label: "Certificates",     path: "/dashboard/certificates",           icon: Award },
        { label: "Events",           path: "/dashboard/events",                 icon: Star },
        { label: "Messages",        path: "/dashboard/messages",               icon: MessageCircle },
        { label: "Admin Settings",   path: "/dashboard/admin",                  icon: Settings },
        { label: "Uniform Shop",     path: "/shop",                             icon: ShoppingBag },
      ],
    },
  ],
};


export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const sections = SECTIONS[user?.role] || [];
  const [collapsed, setCollapsed] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (user?.name || "U")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  function toggleSection(title) {
    setCollapsed((c) => ({ ...c, [title]: !c[title] }));
  }

  const sidebarContent = (
    <>
      {/* ── Logo & School ── */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <img src={logoUrl} alt="School logo" className="w-12 h-12 object-contain flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold leading-tight">St. S.N. Public School</p>
          <p className="text-indigo-300 text-xs mt-0.5">Pindra, Varanasi</p>
          <p className="text-marigold-400 text-[10px] mt-1 font-medium">विद्या ददाति विनयम्</p>
        </div>
      </div>

      {/* ── Role badge with pulse ── */}
      <div className="px-4 py-2 bg-indigo-600/40 border-b border-white/10 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold">
          {user?.role} portal
        </span>
      </div>

      {/* ── Nav with collapsible sections ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {sections.map((section) => {
          const isCollapsed = collapsed[section.title];
          return (
            <div key={section.title} className="mb-2">
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase
                  tracking-widest text-indigo-400 font-semibold hover:text-indigo-200 transition-colors"
              >
                {section.title}
                <motion.span
                  animate={{ rotate: isCollapsed ? -90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={10} />
                </motion.span>
              </button>

              {/* Section items */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-0.5"
                  >
                    {section.items.map((m) => {
                      const Icon = m.icon || ChevronRight;
                      const isActive = location.pathname === m.path;
                      return (
                        <NavLink
                          key={m.label + m.path}
                          to={m.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group relative
                            ${isActive
                              ? "nav-active text-white font-medium"
                              : "text-indigo-200 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                          {/* Animated active indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-marigold-400 rounded-r-full"
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                          <Icon size={16} className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition" />
                          <span className="truncate flex-1">{m.label}</span>
                          {/* Badge */}
                          {m.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-marigold-500 text-ink rounded-full leading-none animate-pulse">
                              {m.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          {user?.photo_url ? (
            <img src={user.photo_url} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/20" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-marigold-500 flex items-center justify-center flex-shrink-0">
              <span className="text-ink text-xs font-bold">{initials}</span>
            </div>
          )}
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
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-indigo-700 text-white shadow-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop always visible, mobile slides in */}
      <aside className={`
        w-64 bg-indigo-700 text-white min-h-screen flex flex-col flex-shrink-0
        fixed lg:sticky lg:top-0 z-40 transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
}
