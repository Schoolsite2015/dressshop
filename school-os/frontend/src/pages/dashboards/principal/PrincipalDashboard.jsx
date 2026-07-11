import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import DashboardShell from "../../../components/DashboardShell.jsx";
import StatCard from "../../../components/StatCard.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";
import { Link } from "react-router-dom";
import {
  Users, CreditCard, UserPlus, BarChart2, BookMarked, ClipboardCheck,
  TrendingUp, Calendar, Award, Activity, Bell, Zap, FileText, Wallet,
} from "lucide-react";
import AIAssistant from "../../../components/AIAssistant.jsx";

/* ───── palette ──────────────────────────────────────── */
const PIE_COLORS = ["#E8940F", "#2C3670", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];
const RADAR_COLORS = ["#2C3670", "#E8940F", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

/* ───── animation variants ──────────────────────────── */
const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemV = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ───── mock generators ─────────────────────────────── */
function generateHeatmap() {
  const cells = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const isSun = d.getDay() === 0;
    const rate = isSun ? null : Math.floor(Math.random() * 30) + 70;
    cells.push({
      date: d.toISOString().slice(0, 10),
      day: d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2),
      rate,
      label: d.getDate(),
    });
  }
  return cells;
}

/* ───── heatmap color ────────────────────────────────── */
function heatColor(rate) {
  if (rate === null) return "bg-indigo-50";
  if (rate >= 90) return "bg-green-500";
  if (rate >= 80) return "bg-green-400";
  if (rate >= 70) return "bg-yellow-400";
  if (rate >= 60) return "bg-orange-400";
  return "bg-red-400";
}

/* ───── custom tooltip ───────────────────────────────── */
function FeeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-indigo-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-ink">{payload[0].payload.month}</p>
      <p className="text-indigo-500 mt-1">
        ₹{Number(payload[0].value).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PRINCIPAL DASHBOARD
   ═══════════════════════════════════════════════════════ */
export default function PrincipalDashboard() {
  const { user } = useAuthStore();

  /* ── greeting ── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  /* ── API queries with fallbacks ── */
  const { data: analyticsData } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api.get("/admin/analytics").then((r) => r.data).catch(() => null),
  });
  
  const { data: students } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => api.get("/students").then((r) => r.data.students).catch(() => []),
  });
  const { data: staff } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => api.get("/hr/staff").then((r) => r.data.staff).catch(() => []),
  });
  const { data: feeSummary } = useQuery({
    queryKey: ["fee-summary"],
    queryFn: () => api.get("/fees/summary").then((r) => r.data.monthly).catch(() => null),
  });
  const { data: admissionsRaw } = useQuery({
    queryKey: ["admissions-all"],
    queryFn: () => api.get("/admissions").then((r) => r.data.applications).catch(() => null),
  });
  const { data: notices } = useQuery({
    queryKey: ["notices"],
    queryFn: () => api.get("/notices").then((r) => r.data.notices).catch(() => []),
  });

  /* ── derived data ── */
  const feeChart = useMemo(() => {
    if (feeSummary && feeSummary.length > 0) {
      return feeSummary.slice().reverse().map((m) => ({
        month: new Date(m.month).toLocaleDateString("en-IN", { month: "short" }),
        collected: Number(m.collected),
      }));
    }
    return [];
  }, [feeSummary]);

  const admissionStatus = useMemo(() => {
    if (admissionsRaw && admissionsRaw.length > 0) {
      return ["submitted", "shortlisted", "interview", "offered", "admitted", "rejected"]
        .map((s) => ({
          name: s.charAt(0).toUpperCase() + s.slice(1),
          value: admissionsRaw.filter((a) => a.status === s).length,
        }))
        .filter((d) => d.value > 0);
    }
    return [];
  }, [admissionsRaw]);

  const totalStudents = analyticsData ? analyticsData.totalStudents : 0;
  const activeStaff = analyticsData ? analyticsData.totalStaff : 0;
  const totalFee = analyticsData ? analyticsData.feesCollected : 0;
  const pendingFee = analyticsData ? analyticsData.feesPending : 0;
  const todayAttendance = analyticsData && analyticsData.attendanceRate !== "NaN" ? `${analyticsData.attendanceRate}%` : "0%";

  /* ── heatmap data ── */
  const heatmap = useMemo(() => generateHeatmap(), []);

  /* ── live feed ticker ── */
  const [feedTick, setFeedTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFeedTick((p) => p + 1), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <DashboardShell title="Principal's Command Center" subtitle="Real-time school analytics & management">
      <motion.div variants={containerV} initial="hidden" animate="visible">

        {/* ── 1. Welcome Banner ── */}
        <motion.div variants={itemV} className="mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 p-6 text-white">
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative z-[1]">
              <p className="text-indigo-200 text-sm">{dateStr}</p>
              <h2 className="font-display text-2xl md:text-3xl mt-1">
                {greeting}, {user?.name?.split(" ")[0] || "Principal"} 👋
              </h2>
              <p className="text-indigo-200 text-sm mt-2 max-w-xl">
                {totalStudents > 0 ? `Your school is running smoothly today. ${totalStudents} students enrolled, ${activeStaff} staff on duty, and ${todayAttendance} attendance rate.` : "Welcome to School OS. Start by adding students and staff from the Office dashboard."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── 2. Stat Cards ── */}
        <motion.div variants={itemV} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Students" value={totalStudents} icon={Users} color="default"
            trend={totalStudents > 0 ? "up" : "flat"} trendVal={totalStudents > 0 ? "+3.2%" : "Stable"}
            sparkData={totalStudents > 0 ? [1180, 1195, 1210, 1218, 1230, 1240, 1247] : [0,0,0,0,0,0,0]}
            sub="Across all classes"
          />
          <StatCard
            label="Active Staff" value={activeStaff} icon={ClipboardCheck} color="default"
            trend="flat" trendVal="Stable"
            sparkData={activeStaff > 0 ? [82, 83, 84, 84, 83, 84, 84] : [0,0,0,0,0,0,0]}
            sub="Teaching & non-teaching"
          />
          <StatCard
            label="Fee Collected" value={`₹${(totalFee / 100000).toFixed(1)}L`} icon={Wallet} color="success"
            trend={totalFee > 0 ? "up" : "flat"} trendVal={totalFee > 0 ? "+8.4%" : "Stable"}
            sparkData={feeChart.length > 0 ? feeChart.map((f) => f.collected) : [0,0,0,0,0,0,0]}
            sub="This academic year"
          />
          <StatCard
            label="Pending Fees" value={`₹${(pendingFee / 100000).toFixed(1)}L`} icon={CreditCard} color="accent"
            trend={pendingFee > 0 ? "down" : "flat"} trendVal={pendingFee > 0 ? "-5%" : "Stable"}
            sparkData={pendingFee > 0 ? [180, 160, 155, 140, 130, 125, 120] : [0,0,0,0,0,0,0]}
            sub="Dues to be collected"
          />
        </motion.div>

        {/* ── 3. Attendance Heatmap ── */}
        <motion.div variants={itemV} className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-lg text-indigo-700">📅 Attendance Heatmap — Last 30 Days</p>
            <div className="flex items-center gap-2 text-[10px] text-indigo-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400" /> &lt;70%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-400" /> 70-79%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400" /> 80-89%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500" /> 90%+</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {heatmap.map((cell) => (
              <div
                key={cell.date}
                className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] transition-transform hover:scale-110 cursor-default ${heatColor(cell.rate)}`}
                title={cell.rate !== null ? `${cell.date}: ${cell.rate}%` : `${cell.date}: Holiday`}
              >
                <span className={cell.rate !== null ? "text-white font-medium" : "text-indigo-300"}>{cell.label}</span>
                <span className={cell.rate !== null ? "text-white/70" : "text-indigo-200"}>{cell.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 4 & 5. Fee Trend + Admissions Pipeline ── */}
        <motion.div variants={itemV} className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Fee Collection Trend */}
          <div className="card p-5">
            <p className="font-display text-lg text-indigo-700 mb-4">💰 Fee Collection Trend</p>
            {feeChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={feeChart}>
                  <defs>
                    <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8940F" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E8940F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F9" />
                  <XAxis dataKey="month" stroke="#8891C7" fontSize={12} />
                  <YAxis stroke="#8891C7" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip content={<FeeTooltip />} />
                  <Area
                    type="monotone" dataKey="collected" stroke="#E8940F"
                    strokeWidth={2.5} fill="url(#feeGrad)"
                    dot={{ r: 4, fill: "#E8940F", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
                No fee data available yet
              </div>
            )}
          </div>

          {/* Admissions Pipeline */}
          <div className="card p-5">
            <p className="font-display text-lg text-indigo-700 mb-4">📊 Admissions Pipeline</p>
            {admissionStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={admissionStatus} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90} dataKey="value"
                    paddingAngle={3} cornerRadius={4}
                  >
                    {admissionStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [v, name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
                No admission data available yet
              </div>
            )}
          </div>
        </motion.div>

        {/* ── 6 & 7. Radar + Enrollment ── */}
        <motion.div variants={itemV} className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Class Performance Radar */}
          <div className="card p-5">
            <p className="font-display text-lg text-indigo-700 mb-4">🎯 Class Performance — Subject Wise</p>
            {totalStudents > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={[]} outerRadius="70%">
                  <PolarGrid stroke="#EEF0F9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#4f5b93" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#8891C7" }} />
                  {["Class VI", "Class VII", "Class VIII", "Class IX", "Class X"].map((cls, i) => (
                    <Radar
                      key={cls} name={cls} dataKey={cls}
                      stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]}
                      fillOpacity={0.08} strokeWidth={1.5}
                    />
                  ))}
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
                Performance data requires students & exams
              </div>
            )}
          </div>

          {/* Student Enrollment Trend */}
          <div className="card p-5">
            <p className="font-display text-lg text-indigo-700 mb-4">📈 Monthly New Admissions</p>
            {totalStudents > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F9" />
                  <XAxis dataKey="month" stroke="#8891C7" fontSize={12} />
                  <YAxis stroke="#8891C7" fontSize={12} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(v) => [`${v} students`, "New Admissions"]}
                  />
                  <Bar dataKey="new" radius={[8, 8, 0, 0]} maxBarSize={40}>
                    <Cell key={0} fill={"#2C3670"} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
                Enrollment history requires admission data
              </div>
            )}
          </div>
        </motion.div>

        {/* ── 8 & 9 & 10. Activity Feed + Quick Actions + Notices ── */}
        <motion.div variants={itemV} className="grid lg:grid-cols-3 gap-6">
          {/* Live Activity Feed */}
          <div className="card p-5 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <p className="font-display text-lg text-indigo-700">Live Activity</p>
            </div>
            {totalStudents > 0 ? (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                 <div className="h-[320px] flex items-center justify-center text-sm text-center px-4 text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
                  No live activities available yet.
                 </div>
              </div>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-sm text-center px-4 text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
                School activities will appear here once the system is actively used.
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <p className="font-display text-lg text-indigo-700 mb-4">⚡ Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Timetable",      path: "/dashboard/timetable",     icon: Calendar,    bg: "bg-indigo-50",  text: "text-indigo-700" },
                { label: "HR & Payroll",    path: "/dashboard/hr",            icon: Users,       bg: "bg-green-50",   text: "text-green-700" },
                { label: "Certificates",    path: "/dashboard/certificates",  icon: Award,       bg: "bg-purple-50",  text: "text-purple-700" },
                { label: "Library",         path: "/dashboard/library",       icon: BookMarked,  bg: "bg-amber-50",   text: "text-amber-700" },
                { label: "Reports",         path: "/dashboard/reports",       icon: FileText,    bg: "bg-cyan-50",    text: "text-cyan-700" },
                { label: "Fee Analytics",   path: "/dashboard/fees",          icon: Wallet,      bg: "bg-rose-50",    text: "text-rose-700" },
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.label} to={a.path}
                    className={`${a.bg} ${a.text} rounded-xl p-4 flex flex-col gap-2 hover:opacity-80 transition-all duration-200 hover:scale-[1.03] hover:shadow-md`}
                  >
                    <Icon size={20} />
                    <p className="text-sm font-medium">{a.label}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Notices */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-lg text-indigo-700">🔔 Recent Notices</p>
              <Link to="/dashboard/notices" className="text-xs text-marigold-500 hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {(notices || []).slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-paper hover:bg-indigo-50 transition">
                  <div className="w-2 h-2 rounded-full bg-marigold-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-indigo-700">{n.title}</p>
                    <p className="text-xs text-indigo-400 mt-0.5">{new Date(n.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              ))}
              {(notices || []).length === 0 && (
                <div className="h-[120px] flex items-center justify-center text-sm text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
                  No notices published yet
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </motion.div>
      <AIAssistant />
    </DashboardShell>
  );
}
