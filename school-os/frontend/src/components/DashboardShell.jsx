import Sidebar from "./Sidebar.jsx";
import { useAuthStore } from "../store/authStore.js";
import { Bell, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export default function DashboardShell({ title, subtitle, children }) {
  const { user } = useAuthStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const dateStr = time.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-indigo-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-display text-xl text-indigo-700 font-semibold leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-indigo-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-400">
              <Clock size={12} />
              <span>{dateStr}</span>
            </div>
            <button className="relative p-2 rounded-xl hover:bg-indigo-50 transition">
              <Bell size={18} className="text-indigo-500" />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {(user?.name || "U").split(" ").map(w => w[0]).slice(0, 2).join("")}
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
