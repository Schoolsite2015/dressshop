import Sidebar from "./Sidebar.jsx";
import BottomNav from "./BottomNav.jsx";
import { useAuthStore } from "../store/authStore.js";
import { Bell, Clock, Search, Sparkles, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network } from "@capacitor/network";

export default function DashboardShell({ title, subtitle, children }) {
  const { user } = useAuthStore();
  const [time, setTime] = useState(new Date());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications] = useState(3); // demo notification count
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const checkNetwork = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };
    checkNetwork();

    const listener = Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  const dateStr = time.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = time.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });

  const greetHour = time.getHours();
  const greeting = greetHour < 12 ? "Good morning" : greetHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex min-h-screen bg-paper pb-16 md:pb-0">
      {/* Sidebar hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Offline Banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500 text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2"
            >
              <WifiOff size={14} /> You are currently offline. Using cached data.
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Enhanced Top Bar ── */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-indigo-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="pl-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl text-indigo-700 font-semibold leading-tight">{title}</h1>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-semibold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </motion.span>
            </div>
            {subtitle && <p className="text-xs text-indigo-400 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {/* Search toggle */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-indigo-50 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-marigold-400"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-xl hover:bg-indigo-50 transition"
            >
              <Search size={18} className="text-indigo-500" />
            </button>

            {/* Date & time */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-400">
              <Clock size={12} />
              <span>{dateStr}</span>
              <span className="text-indigo-300">·</span>
              <span className="font-semibold text-indigo-600">{timeStr}</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl hover:bg-indigo-50 transition">
              <Bell size={18} className="text-indigo-500" />
              {notifications > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                >
                  {notifications}
                </motion.span>
              )}
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-700 to-indigo-500 flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold">
                  {(user?.name || "U").split(" ").map(w => w[0]).slice(0, 2).join("")}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-indigo-700">{user?.name}</p>
                <p className="text-[10px] text-indigo-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Greeting bar ── */}
        <div className="px-6 pt-4 pb-2">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-indigo-400 flex items-center gap-1"
          >
            <Sparkles size={12} className="text-marigold-400" />
            {greeting}, {user?.name?.split(" ")[0] || "User"}! {subtitle ? "" : "Here's your overview for today."}
          </motion.p>
        </div>

        {/* ── Main content with animation ── */}
        <main className="flex-1 px-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Bottom Nav for mobile */}
      <BottomNav />
    </div>
  );
}
