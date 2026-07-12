import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from "recharts";
import {
  BookOpen, Calendar, Bell, Clock, Star, CheckCircle2,
  TrendingUp, Wallet, Award, ChevronRight, Lock, Trophy,
  Flame, BookMarked, Heart, Zap,
} from "lucide-react";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";

/* ───── animation variants ──────────────────────────── */
const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemV = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ───── constants & mock data ────────────────────────── */
const QUOTES = [
  { text: "Education is the most powerful weapon you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Success is not final, failure is not fatal — it is the courage to continue that counts.", author: "Winston Churchill" },
];

const SUBJECT_COLORS = {
  Mathematics: "#2C3670",
  Science: "#10b981",
  English: "#E8940F",
  Hindi: "#8b5cf6",
  "Social Science": "#ef4444",
  Computer: "#06b6d4",
  default: "#6b7280",
};

const BADGES = [
  { label: "Perfect Attendance", icon: Flame, unlocked: true, color: "#ef4444" },
  { label: "Top Scorer", icon: Trophy, unlocked: true, color: "#E8940F" },
  { label: "Library Lover", icon: BookMarked, unlocked: true, color: "#8b5cf6" },
  { label: "Science Star", icon: Zap, unlocked: false, color: "#10b981" },
  { label: "Kindness Award", icon: Heart, unlocked: false, color: "#ec4899" },
  { label: "Sports Champion", icon: Award, unlocked: false, color: "#06b6d4" },
];

/* ───── generate attendance calendar ─────────────────── */
function generateAttendanceCalendar() {
  const cells = [];
  const today = new Date();
  const sundays = new Set();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const isSun = d.getDay() === 0;
    const isHoliday = isSun || [15, 26].includes(d.getDate());
    let status = "present";
    if (isHoliday) status = "holiday";
    else if (Math.random() < 0.08) status = "absent";
    cells.push({
      date: d.toISOString().slice(0, 10),
      day: d.getDate(),
      status,
    });
  }
  return cells;
}

/* ───── Attendance Ring ──────────────────────────────── */
function AttendanceRing({ percentage = 0 }) {
  const pct = Math.min(100, Math.max(0, percentage));
  const data = [{ value: pct }, { value: 100 - pct }];
  const color = pct >= 75 ? "#10b981" : pct >= 60 ? "#E8940F" : "#ef4444";
  return (
    <div className="relative w-24 h-24">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={44} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            <Cell fill={color} />
            <Cell fill="#EEF0F9" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-display font-bold" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ───── Fee progress bar with animation ──────────────── */
function FeeProgressBar({ paid = 11800, total = 18000 }) {
  const [width, setWidth] = useState(0);
  const pct = Math.min(100, (paid / total) * 100);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);
  const balance = total - paid;

  return (
    <div>
      <div className="flex justify-between text-xs text-indigo-400 mb-1.5">
        <span>Fee Paid</span>
        <span>₹{paid.toLocaleString("en-IN")} / ₹{total.toLocaleString("en-IN")}</span>
      </div>
      <div className="w-full bg-indigo-50 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, background: "linear-gradient(90deg, #2C3670, #6366f1)" }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-green-600 font-medium">✅ ₹{paid.toLocaleString("en-IN")} paid</span>
        <span className="text-xs text-red-500 font-medium">₹{balance.toLocaleString("en-IN")} pending</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STUDENT DASHBOARD
   ═══════════════════════════════════════════════════════ */
export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const todayQuote = QUOTES[new Date().getDate() % QUOTES.length];

  /* ── API queries ── */
  const { data: students } = useQuery({
    queryKey: ["me-student-lookup"],
    queryFn: () => api.get("/students?search=").then((r) => r.data.students),
  });
  const me = (students || [])[0];

  const { data: attendance } = useQuery({
    queryKey: ["my-attendance", me?.id],
    queryFn: () => api.get(`/attendance/student/${me.id}`).then((r) => r.data.summary),
    enabled: !!me,
  });

  const { data: fees } = useQuery({
    queryKey: ["my-fees", me?.id],
    queryFn: () => api.get(`/fees/student/${me.id}`).then((r) => r.data.summary),
    enabled: !!me,
  });

  const { data: homework } = useQuery({
    queryKey: ["my-homework", me?.class_id],
    queryFn: () => api.get(`/homework?classId=${me?.class_id || ""}`).then((r) => r.data.homework),
    enabled: !!me,
  });

  const { data: notices } = useQuery({
    queryKey: ["notices"],
    queryFn: () => api.get("/notices").then((r) => r.data.notices),
  });

  const attPct = attendance?.percentage ?? 91;
  const attCalendar = useMemo(() => generateAttendanceCalendar(), []);

  return (
    <DashboardShell
      title={`Welcome, ${me?.name?.split(" ")[0] || user?.name?.split(" ")[0] || "Student"}!`}
      subtitle={me ? `${me.class_name} ${me.section_name} · ${me.admission_no}` : "Loading your profile…"}
    >
      <motion.div variants={containerV} initial="hidden" animate="visible">

        {/* ── Quote Banner ── */}
        <motion.div variants={itemV} className="mb-6">
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-2xl p-5 text-white relative overflow-hidden">
            <Star size={64} className="absolute -right-4 -top-4 opacity-10" />
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-200 mb-1">Quote of the Day</p>
            <p className="font-display text-xl leading-snug">"{todayQuote.text}"</p>
            <p className="text-xs text-indigo-200 mt-2">— {todayQuote.author}</p>
          </div>
        </motion.div>

        {/* ── Profile + Timetable ── */}
        <motion.div variants={itemV} className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Profile Card */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl font-display font-bold">
                {(me?.name || user?.name || "S").charAt(0)}
              </div>
              <div>
                <p className="font-display text-lg text-ink">{me?.name || user?.name || "Student"}</p>
                <p className="text-xs text-indigo-400">{me?.class_name} {me?.section_name}</p>
                <p className="text-xs text-indigo-400">{me?.admission_no || "SNPS-2026-001"}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-indigo-50 pt-4">
              <div className="text-center">
                <p className="text-xs text-indigo-400">Attendance</p>
                <AttendanceRing percentage={attPct} />
              </div>
              <div className="text-right space-y-2">
                <div>
                  <p className="text-xs text-indigo-400">Fee Balance</p>
                  <p className="font-display text-lg font-semibold text-ink">{fees ? `₹${fees.balance.toLocaleString("en-IN")}` : "₹4,800"}</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-400">Days Present</p>
                  <p className="font-display text-lg font-semibold text-ink">{attendance?.present ?? 142}/{attendance?.total ?? 155}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Timetable */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-lg text-ink">📅 Today's Schedule</p>
              <button onClick={() => navigate("/dashboard/timetable")} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition">
                Full timetable <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
               <div className="text-center w-full py-4 text-indigo-400 text-sm">
                  Schedule not available.
               </div>
            </div>
          </div>
        </motion.div>

        {/* ── NEW: Performance Trend + Subject Radar ── */}
        <motion.div variants={itemV} className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Performance Trend Line Chart */}
          <div className="card p-5">
            <p className="font-display text-lg text-indigo-700 mb-4">📈 Performance Trend</p>
            <div className="h-[240px] flex items-center justify-center text-sm text-center px-4 text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
               No exam marks data available yet.
            </div>
          </div>

          {/* Subject Radar Chart */}
          <div className="card p-5">
            <p className="font-display text-lg text-indigo-700 mb-4">🎯 Subject Strengths</p>
            <div className="h-[240px] flex items-center justify-center text-sm text-center px-4 text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
               No subject strength data available yet.
            </div>
          </div>
        </motion.div>

        {/* ── NEW: Attendance Calendar ── */}
        <motion.div variants={itemV} className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-lg text-indigo-700">📅 Attendance Calendar — Last 90 Days</p>
            <div className="flex items-center gap-3 text-[10px] text-indigo-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500" /> Present</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400" /> Absent</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-100" /> Holiday</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {attCalendar.map((cell) => (
              <div
                key={cell.date}
                className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-medium transition-transform hover:scale-125 cursor-default ${
                  cell.status === "present"
                    ? "bg-green-500 text-white"
                    : cell.status === "absent"
                    ? "bg-red-400 text-white"
                    : "bg-indigo-100 text-indigo-400"
                }`}
                title={`${cell.date}: ${cell.status}`}
              >
                {cell.day}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── NEW: Achievement Badges ── */}
        <motion.div variants={itemV} className="card p-5 mb-6">
          <p className="font-display text-lg text-indigo-700 mb-4">🏆 Achievement Badges</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {BADGES.map((badge) => {
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all duration-300 ${
                    badge.unlocked
                      ? "bg-white border-2 shadow-sm hover:shadow-md hover:-translate-y-1"
                      : "bg-gray-50 border border-gray-200 opacity-50"
                  }`}
                  style={badge.unlocked ? { borderColor: badge.color + "40" } : {}}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      badge.unlocked ? "" : "bg-gray-200"
                    }`}
                    style={badge.unlocked ? { backgroundColor: badge.color + "15", color: badge.color } : {}}
                  >
                    {badge.unlocked ? <BadgeIcon size={20} /> : <Lock size={16} className="text-gray-400" />}
                  </div>
                  <p className="text-[10px] font-medium text-ink leading-tight">{badge.label}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── NEW: Fee Status Card ── */}
        <motion.div variants={itemV} className="card p-5 mb-6">
          <p className="font-display text-lg text-indigo-700 mb-4">💳 Fee Status</p>
          <FeeProgressBar
            paid={fees?.totalPaid ?? 11800}
            total={18000}
          />
        </motion.div>

        {/* ── Homework + Exams + Notices (existing, wrapped in motion) ── */}
        <motion.div variants={itemV} className="grid lg:grid-cols-3 gap-6">
          {/* Homework */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-lg text-ink">📝 Homework Due</p>
              <button onClick={() => navigate("/dashboard/homework")} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition">
                All <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {(homework || []).slice(0, 4).map((h) => {
                const subColor = SUBJECT_COLORS[h.subject_name] || SUBJECT_COLORS.default;
                const daysLeft = h.due_date ? Math.ceil((new Date(h.due_date) - new Date()) / 86400000) : null;
                return (
                  <div key={h.id} className="flex items-start gap-3 group">
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: subColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink line-clamp-2">{h.description}</p>
                      <p className="text-xs text-indigo-400 mt-0.5">{h.class_name} {h.section_name}</p>
                    </div>
                    {daysLeft !== null && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${daysLeft <= 1 ? "bg-red-100 text-red-600" : daysLeft <= 3 ? "bg-marigold-500/10 text-marigold-600" : "bg-indigo-50 text-indigo-500"}`}>
                        {daysLeft <= 0 ? "Today" : `${daysLeft}d`}
                      </span>
                    )}
                  </div>
                );
              })}
              {(homework || []).length === 0 && (
                <div className="text-center py-6 text-indigo-300">
                  <CheckCircle2 size={28} className="mx-auto mb-1 opacity-40" />
                  <p className="text-xs">No pending homework! Great job.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
            <p className="font-display text-lg text-ink mb-4">📅 Upcoming Exams</p>
            <div className="space-y-3">
               <div className="text-center py-4 text-indigo-400 text-sm">
                  No upcoming exams.
               </div>
            </div>
          </div>

          {/* Notice Board */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-lg text-ink">🔔 Notice Board</p>
              <button onClick={() => navigate("/dashboard/notices")} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition">
                All <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {(notices || []).slice(0, 4).map((n) => (
                <div key={n.id} className="border-l-2 border-marigold-500 pl-3 py-1">
                  <p className="text-sm font-medium text-ink line-clamp-1">{n.title}</p>
                  <p className="text-xs text-indigo-400">
                    {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    &nbsp;·&nbsp;<span className="capitalize">{n.audience}</span>
                  </p>
                </div>
              ))}
              {(notices || []).length === 0 && (
                <div className="text-center py-6 text-indigo-300">
                  <Bell size={28} className="mx-auto mb-1 opacity-40" />
                  <p className="text-xs">No new notices at this time.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </motion.div>
    </DashboardShell>
  );
}
