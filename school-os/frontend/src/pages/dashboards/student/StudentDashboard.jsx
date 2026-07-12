import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  BookOpen, Calendar, Bell, Clock, Star, CheckCircle2,
  TrendingUp, Wallet, Award, ChevronRight,
} from "lucide-react";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";

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
  default: "#6b7280",
};

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

const DEMO_TIMETABLE = [
  { time: "8:00", subject: "Mathematics", teacher: "Mr. Sharma", room: "A1" },
  { time: "9:00", subject: "English", teacher: "Mrs. Singh", room: "A1" },
  { time: "10:00", subject: "Science", teacher: "Mr. Verma", room: "Lab-1" },
  { time: "11:00", subject: "Hindi", teacher: "Mrs. Gupta", room: "A1" },
  { time: "12:00", subject: "Lunch Break", teacher: "", room: "" },
  { time: "13:00", subject: "Social Science", teacher: "Mr. Kumar", room: "A1" },
  { time: "14:00", subject: "P.E.", teacher: "Mr. Rao", room: "Ground" },
];

const DEMO_EXAMS = [
  { subject: "Mathematics", date: "2026-07-18", type: "Unit Test" },
  { subject: "Science", date: "2026-07-22", type: "Practical" },
  { subject: "English", date: "2026-07-25", type: "Unit Test" },
];

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const todayQuote = QUOTES[new Date().getDate() % QUOTES.length];

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
    queryKey: ["my-homework"],
    queryFn: () => api.get("/homework?classId=1").then((r) => r.data.homework),
  });

  const { data: notices } = useQuery({
    queryKey: ["notices"],
    queryFn: () => api.get("/notices").then((r) => r.data.notices),
  });

  const attPct = attendance?.percentage ?? 91;

  return (
    <DashboardShell
      title={`Welcome, ${me?.name?.split(" ")[0] || user?.name?.split(" ")[0] || "Student"}!`}
      subtitle={me ? `${me.class_name} ${me.section_name} · ${me.admission_no}` : "Loading your profile…"}
    >
      {/* MOTIVATIONAL QUOTE */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-2xl p-5 mb-6 text-white relative overflow-hidden">
        <Star size={64} className="absolute -right-4 -top-4 opacity-10" />
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-200 mb-1">Quote of the Day</p>
        <p className="font-display text-xl leading-snug">"{todayQuote.text}"</p>
        <p className="text-xs text-indigo-200 mt-2">— {todayQuote.author}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
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
                <p className="font-display text-lg font-semibold text-ink">{fees && fees.balance ? `₹${fees.balance.toLocaleString("en-IN")}` : "₹0"}</p>
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
            <p className="font-display text-lg text-ink">Today's Schedule</p>
            <button onClick={() => navigate("/dashboard/timetable")} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition">
              Full timetable <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {DEMO_TIMETABLE.map((slot, i) => {
              const isBreak = !slot.teacher;
              const color = SUBJECT_COLORS[slot.subject] || SUBJECT_COLORS.default;
              return (
                <div
                  key={i}
                  className={`flex-shrink-0 w-28 rounded-xl p-3 text-center transition ${isBreak ? "bg-indigo-50 border border-indigo-100" : "border-2"}`}
                  style={isBreak ? {} : { borderColor: color + "30", backgroundColor: color + "08" }}
                >
                  <p className="text-xs text-indigo-400 mb-1">{slot.time}</p>
                  <p className="text-xs font-semibold text-ink line-clamp-2" style={isBreak ? {} : { color }}>{slot.subject}</p>
                  {slot.teacher && <p className="text-[10px] text-indigo-400 mt-1">{slot.teacher}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Homework */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-lg text-ink">Homework Due</p>
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
          <p className="font-display text-lg text-ink mb-4">Upcoming Exams</p>
          <div className="space-y-3">
            {DEMO_EXAMS.map((exam, i) => {
              const daysLeft = Math.ceil((new Date(exam.date) - new Date()) / 86400000);
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition">
                  <div className="w-10 h-10 bg-indigo-700 rounded-lg flex flex-col items-center justify-center text-white">
                    <span className="text-[10px] leading-none">{new Date(exam.date).toLocaleDateString("en-IN", { month: "short" })}</span>
                    <span className="text-lg font-display leading-none">{new Date(exam.date).getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{exam.subject}</p>
                    <p className="text-xs text-indigo-400">{exam.type}</p>
                  </div>
                  <span className="text-xs text-indigo-500">{daysLeft}d away</span>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate("/dashboard/timetable")} className="mt-4 w-full text-xs text-indigo-500 hover:text-indigo-700 flex items-center justify-center gap-1 transition">
            View full exam schedule <ChevronRight size={12} />
          </button>
        </div>

        {/* Notice Board */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-lg text-ink">Notice Board</p>
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
      </div>
    </DashboardShell>
  );
}
