import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { 
  LayoutDashboard, Users, Calendar, Settings, BookOpen, 
  Bus, CreditCard, Bell
} from "lucide-react";
import { motion } from "framer-motion";

// Helper to determine the main links per role for the bottom nav
const getMobileNav = (role) => {
  switch (role) {
    case 'principal':
      return [
        { label: "Home", path: "/dashboard/principal", icon: LayoutDashboard },
        { label: "Students", path: "/dashboard/office", icon: Users },
        { label: "Finance", path: "/dashboard/fees/analytics", icon: CreditCard },
        { label: "Settings", path: "/dashboard/admin", icon: Settings },
      ];
    case 'teacher':
      return [
        { label: "Home", path: "/dashboard/teacher/attendance", icon: LayoutDashboard },
        { label: "Timetable", path: "/dashboard/timetable", icon: Calendar },
        { label: "Homework", path: "/dashboard/homework", icon: BookOpen },
        { label: "Notices", path: "/dashboard/notices", icon: Bell },
      ];
    case 'student':
    case 'parent':
      return [
        { label: "Home", path: `/dashboard/${role}`, icon: LayoutDashboard },
        { label: "Timetable", path: "/dashboard/timetable", icon: Calendar },
        { label: "Homework", path: "/dashboard/homework", icon: BookOpen },
        { label: "Bus", path: "/dashboard/my-bus", icon: Bus },
      ];
    default:
      return [
        { label: "Home", path: "/dashboard/principal", icon: LayoutDashboard },
      ];
  }
};

export default function BottomNav() {
  const { user } = useAuthStore();
  const navItems = getMobileNav(user?.role);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-indigo-100 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-colors ${
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-indigo-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-[1px] w-8 h-1 bg-marigold-500 rounded-b-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
