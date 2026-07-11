import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Link } from "react-router-dom";
import DashboardShell from "../../../components/DashboardShell.jsx";
import StatCard from "../../../components/StatCard.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";
import {
  Users, CreditCard, FileText, Search, Plus, Wallet, TrendingUp,
  AlertCircle, CheckCircle, Receipt, BarChart2, Filter, Download, FileSpreadsheet, FileOutput
} from "lucide-react";
import { exportToPDF, exportToExcel } from "../../../lib/exportUtils.js";

/* ─── Constants ──────────────────────────────────────────── */
const STATUS_FLOW = ["submitted", "shortlisted", "interview", "offered", "admitted", "rejected"];
const TABS = [
  { key: "admissions", label: "Admissions", icon: Users },
  { key: "fees",       label: "Fees",       icon: Wallet },
  { key: "students",   label: "Students",   icon: Users },
  { key: "reports",    label: "Reports",    icon: BarChart2 },
];
const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };
const PIE_COLORS = ["#4338ca", "#f59e0b", "#10b981", "#ef4444", "#6366f1"];

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function OfficeDashboard() {
  const [tab, setTab] = useState("admissions");

  return (
    <DashboardShell title="Office Dashboard" subtitle="Admissions pipeline, fee collection, student records & reports">
      {/* Tab bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-indigo-700 text-white shadow-md shadow-indigo-200"
                  : "bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50"
              }`}>
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "admissions" && <AdmissionsPanel />}
      {tab === "fees"       && <FeesPanel />}
      {tab === "students"   && <StudentsPanel />}
      {tab === "reports"    && <ReportsPanel />}
    </DashboardShell>
  );
}

/* ────────────────────────────────────────────────────────────
   ADMISSIONS PANEL  (preserved from original, enhanced)
   ──────────────────────────────────────────────────────────── */
function AdmissionsPanel() {
  const qc = useQueryClient();
  const { data: applications } = useQuery({
    queryKey: ["admissions"],
    queryFn: () => api.get("/admissions").then((r) => r.data.applications),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admissions/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admissions"] }),
  });

  const apps = applications || [];
  const statusColor = (s) => {
    const map = { submitted: "bg-blue-100 text-blue-700", shortlisted: "bg-purple-100 text-purple-700",
      interview: "bg-amber-100 text-amber-700", offered: "bg-cyan-100 text-cyan-700",
      admitted: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700" };
    return map[s] || "bg-gray-100 text-gray-600";
  };

  return (
    <motion.div {...fade}>
      <div className="grid sm:grid-cols-4 gap-5 mb-6">
        <StatCard label="Total Applications" value={apps.length} icon={FileText} />
        <StatCard label="Awaiting Review" value={apps.filter((a) => a.status === "submitted").length} color="warning" icon={AlertCircle} />
        <StatCard label="In Pipeline" value={apps.filter((a) => ["shortlisted", "interview", "offered"].includes(a.status)).length} icon={Users} />
        <StatCard label="Admitted" value={apps.filter((a) => a.status === "admitted").length} color="success" icon={CheckCircle} />
      </div>

      <div className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-indigo-50 flex items-center justify-between">
          <h3 className="font-display text-indigo-700 font-semibold">Admissions Pipeline</h3>
          <span className="text-xs text-indigo-400">{apps.length} total</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-indigo-50/50 text-indigo-600 text-left">
            <tr>
              <th className="p-3 font-medium">Applicant</th>
              <th className="p-3 font-medium">Class</th>
              <th className="p-3 font-medium">Parent / Phone</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} className="border-t border-indigo-50 hover:bg-indigo-50/30 transition">
                <td className="p-3 font-medium text-ink">{a.applicant_name}</td>
                <td className="p-3">{a.class_applied_for}</td>
                <td className="p-3 text-indigo-400">{a.parent_name} · {a.phone}</td>
                <td className="p-3">
                  <select value={a.status}
                    onChange={(e) => mutation.mutate({ id: a.id, status: e.target.value })}
                    className={`rounded-lg px-2 py-1 text-xs font-semibold border-0 cursor-pointer ${statusColor(a.status)}`}>
                    {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {apps.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-indigo-400">No applications yet — try the public Admissions page.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   FEES PANEL  (complete overhaul)
   ──────────────────────────────────────────────────────────── */
function FeesPanel() {
  const qc = useQueryClient();
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount]       = useState("");
  const [mode, setMode]           = useState("cash");
  const [receiptNo, setReceiptNo] = useState("");
  const [search, setSearch]       = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sortBy, setSortBy]       = useState("daysOverdue");
  const [showPayForm, setShowPayForm] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => api.get("/students").then((r) => r.data.students).catch(() => []),
  });

  const { data: feeSummaryData } = useQuery({
    queryKey: ["fee-summary"],
    queryFn: () => api.get("/fees/summary").then((r) => r.data).catch(() => null),
  });

  const mutation = useMutation({
    mutationFn: () => api.post("/fees/pay", {
      studentId, amount: Number(amount), mode,
      receiptNo: receiptNo || `RCP-${Date.now().toString(36).toUpperCase()}`,
    }),
    onSuccess: () => {
      setAmount(""); setReceiptNo("");
      qc.invalidateQueries({ queryKey: ["fee-summary"] });
    },
  });

  // Filter & sort outstanding
  const outstandingRaw = feeSummaryData?.outstanding || [];
  const classes = [...new Set(outstandingRaw.map((s) => s.class))].sort();
  let outstanding = [...outstandingRaw];
  if (search) outstanding = outstanding.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.admNo.toLowerCase().includes(search.toLowerCase()));
  if (classFilter) outstanding = outstanding.filter((s) => s.class === classFilter);
  outstanding.sort((a, b) => sortBy === "daysOverdue" ? b.daysOverdue - a.daysOverdue : b.due - a.due);

  const totalDue = feeSummaryData?.totalDue || 0;
  const totalCollected = feeSummaryData?.totalCollected || 0;
  const totalPending = feeSummaryData?.totalPending || 0;
  const overdue = feeSummaryData?.overdue || 0;
  
  const monthlyData = feeSummaryData?.monthlyComparison || [];
  const paymentMethodsData = feeSummaryData?.paymentMethods || [];

  return (
    <motion.div {...fade}>
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard label="Total Fee Due" value={fmt(totalDue)} sub="Academic Year 2026-27" icon={CreditCard} color="accent" />
        <StatCard label="Total Collected" value={fmt(totalCollected)} sub="Collection this year" trend={totalCollected > 0 ? "up" : "flat"} trendVal={totalCollected > 0 ? "+8.2%" : "0%"} icon={CheckCircle} color="success" />
        <StatCard label="Pending" value={fmt(totalPending)} sub={`${outstandingRaw.length} students`} trend={totalPending > 0 ? "down" : "flat"} trendVal={totalPending > 0 ? "-12%" : "0%"} icon={AlertCircle} color="warning" />
        <StatCard label="Overdue (>30 days)" value={fmt(overdue)} sub="Pending past due date" icon={AlertCircle} color="danger" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly collection comparison */}
        <div className="lg:col-span-2 bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-indigo-700 font-semibold">Monthly Collection</h3>
              <p className="text-xs text-indigo-400 mt-0.5">Current vs Previous Year</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" /> 2026-27</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-200 inline-block" /> 2025-26</span>
            </div>
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#818cf8" }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#818cf8" }} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: "12px", border: "1px solid #e0e7ff", fontSize: "12px" }} />
                <Bar dataKey="previous" fill="#c7d2fe" radius={[4, 4, 0, 0]} name="2025-26" />
                <Bar dataKey="current" fill="#4338ca" radius={[4, 4, 0, 0]} name="2026-27" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-sm text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
              No fee collection data available
            </div>
          )}
        </div>

        {/* Payment methods pie */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display text-indigo-700 font-semibold mb-1">Payment Methods</h3>
          <p className="text-xs text-indigo-400 mb-3">Distribution this month</p>
          {paymentMethodsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentMethodsData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                  paddingAngle={3} dataKey="value" nameKey="name">
                  {paymentMethodsData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e0e7ff", fontSize: "12px" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-[220px] flex items-center justify-center text-sm text-indigo-400 font-medium bg-indigo-50/30 rounded-xl border border-dashed border-indigo-100">
              No payment methods data
            </div>
          )}
        </div>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={() => setShowPayForm(!showPayForm)}
          className="flex items-center gap-2 bg-marigold-500 text-ink font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-marigold-400 transition shadow-sm">
          <Plus size={16} /> Record Payment
        </button>
        <Link to="/dashboard/fees/receipt/demo"
          className="flex items-center gap-2 bg-white border border-indigo-200 text-indigo-600 font-medium px-4 py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition">
          <Receipt size={16} /> View Receipt
        </Link>
        <Link to="/dashboard/fees/analytics"
          className="flex items-center gap-2 bg-white border border-indigo-200 text-indigo-600 font-medium px-4 py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition">
          <TrendingUp size={16} /> Fee Analytics
        </Link>
      </div>

      {/* Record payment form */}
      {showPayForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6">
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm max-w-2xl">
            <h3 className="font-display text-indigo-700 font-semibold mb-4 flex items-center gap-2">
              <Wallet size={18} /> Record a Fee Payment
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-indigo-500 font-medium mb-1 block">Student</label>
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)}
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none">
                  <option value="">Select student</option>
                  {(students || []).map((s) => <option key={s.id} value={s.id}>{s.name} — {s.class_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-indigo-500 font-medium mb-1 block">Amount (₹)</label>
                <input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
              </div>
              <div>
                <label className="text-xs text-indigo-500 font-medium mb-1 block">Payment Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)}
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none">
                  <option value="cash">💵 Cash</option>
                  <option value="online">🏦 Online Transfer</option>
                  <option value="upi">📱 UPI</option>
                  <option value="cheque">📝 Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-indigo-500 font-medium mb-1 block">Receipt No (auto if empty)</label>
                <input type="text" placeholder="RCP-XXXXXXX" value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)}
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button onClick={() => mutation.mutate()} disabled={!studentId || !amount || mutation.isPending}
                className="bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:bg-indigo-800 transition shadow-sm">
                {mutation.isPending ? "Recording…" : "Record Payment"}
              </button>
              {mutation.isSuccess && (
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <CheckCircle size={14} /> Payment recorded successfully!
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Outstanding fees table */}
      <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-indigo-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-indigo-700 font-semibold">Outstanding Fees</h3>
            <p className="text-xs text-indigo-400 mt-0.5">{outstanding.length} students with pending dues</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" />
              <input type="text" placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 border border-indigo-200 rounded-lg text-xs w-44 focus:ring-2 focus:ring-indigo-200 outline-none" />
            </div>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
              className="border border-indigo-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-indigo-200 outline-none">
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="border border-indigo-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-indigo-200 outline-none">
              <option value="daysOverdue">Sort: Days Overdue</option>
              <option value="amount">Sort: Amount</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-indigo-50/50 text-indigo-600 text-left">
              <tr>
                <th className="p-3 font-medium">Student</th>
                <th className="p-3 font-medium">Adm. No</th>
                <th className="p-3 font-medium">Class</th>
                <th className="p-3 font-medium text-right">Due Amount</th>
                <th className="p-3 font-medium">Due Date</th>
                <th className="p-3 font-medium">Overdue</th>
                <th className="p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {outstanding.map((s) => (
                <tr key={s.id} className="border-t border-indigo-50 hover:bg-indigo-50/30 transition">
                  <td className="p-3 font-medium text-ink">{s.name}</td>
                  <td className="p-3 text-indigo-400 font-mono text-xs">{s.admNo}</td>
                  <td className="p-3">{s.class}</td>
                  <td className="p-3 text-right font-semibold text-ink">{fmt(s.due)}</td>
                  <td className="p-3 text-indigo-400">{s.dueDate}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.daysOverdue > 30 ? "bg-red-100 text-red-700" : s.daysOverdue > 14 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {s.daysOverdue}d
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => { setStudentId(String(s.id)); setAmount(String(s.due)); setShowPayForm(true); }}
                      className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-200 transition">
                      Collect
                    </button>
                  </td>
                </tr>
              ))}
              {outstanding.length === 0 && (
                 <tr>
                    <td colSpan={7} className="p-8 text-center text-indigo-400">
                      No outstanding fees right now.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   STUDENTS PANEL  (enhanced)
   ──────────────────────────────────────────────────────────── */
function StudentsPanel() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const { data: students } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => api.get("/students").then((r) => r.data.students).catch(() => []),
  });

  const allStudents = students || [];
  const classes = [...new Set(allStudents.map((s) => s.class_name).filter(Boolean))].sort();

  let filtered = allStudents;
  if (search) filtered = filtered.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_no?.toLowerCase().includes(search.toLowerCase())
  );
  if (classFilter) filtered = filtered.filter((s) => s.class_name === classFilter);

  const getInitials = (name) => (name || "S").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const avatarColors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-violet-500"];

  const handleExportPDF = () => {
    const headers = ["Admission No", "Name", "Class", "Section", "Gender", "Status"];
    const data = filtered.map(s => [s.admission_no || "-", s.name || "-", s.class_name || "-", s.section_name || "-", s.gender || "-", s.status || "-"]);
    exportToPDF("Student Roster Report", headers, data, "student-roster.pdf");
  };

  const handleExportExcel = () => {
    const data = filtered.map(s => ({
      "Admission No": s.admission_no,
      "Name": s.name,
      "Class": s.class_name,
      "Section": s.section_name,
      "Gender": s.gender,
      "Status": s.status,
      "Parent Name": s.parent_name,
      "Parent Phone": s.parent_phone
    }));
    exportToExcel(data, "student-roster.xlsx");
  };

  return (
    <motion.div {...fade}>
      <div className="grid sm:grid-cols-3 gap-5 mb-6">
        <StatCard label="Total Students" value={allStudents.length} icon={Users} />
        <StatCard label="Active" value={allStudents.filter((s) => s.status === "active").length} color="success" icon={CheckCircle} />
        <StatCard label="Classes" value={classes.length || "—"} icon={BarChart2} />
      </div>

      <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-indigo-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-display text-indigo-700 font-semibold">Student Directory</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" />
              <input type="text" placeholder="Search name or adm no..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 border border-indigo-200 rounded-lg text-xs w-52 focus:ring-2 focus:ring-indigo-200 outline-none" />
            </div>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
              className="border border-indigo-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-indigo-200 outline-none">
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100 hover:bg-red-100 transition">
              <FileOutput size={14} /> PDF
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-100 hover:bg-green-100 transition">
              <FileSpreadsheet size={14} /> Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-indigo-50/50 text-indigo-600 text-left">
              <tr>
                <th className="p-3 font-medium">Student</th>
                <th className="p-3 font-medium">Admission No.</th>
                <th className="p-3 font-medium">Class / Section</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className="border-t border-indigo-50 hover:bg-indigo-50/30 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColors[i % avatarColors.length]}`}>
                        {getInitials(s.name)}
                      </div>
                      <span className="font-medium text-ink">{s.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-indigo-400 font-mono text-xs">{s.admission_no}</td>
                  <td className="p-3">{s.class_name} {s.section_name}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>{s.status}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-indigo-400">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   REPORTS PANEL
   ──────────────────────────────────────────────────────────── */
function ReportsPanel() {
  const reports = [
    { title: "Fee Analytics", desc: "Collection trends, defaulter list, class-wise breakdown, payment method analysis", link: "/dashboard/fees/analytics", icon: TrendingUp, color: "bg-indigo-100 text-indigo-700" },
    { title: "Fee Receipts", desc: "Generate and print professional fee receipts for student payments", link: "/dashboard/fees/receipt/demo", icon: Receipt, color: "bg-green-100 text-green-700" },
    { title: "Reports Hub", desc: "Attendance, exam results, staff reports, and comprehensive school analytics", link: "/dashboard/reports", icon: BarChart2, color: "bg-amber-100 text-amber-700" },
    { title: "Student Records", desc: "Export student data, class lists, and admission records", link: "#", icon: Users, color: "bg-cyan-100 text-cyan-700" },
  ];

  return (
    <motion.div {...fade}>
      <div className="grid sm:grid-cols-2 gap-5">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.title} to={r.link}
              className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${r.color}`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-indigo-700 font-semibold group-hover:text-indigo-800 transition">{r.title}</h3>
                  <p className="text-xs text-indigo-400 mt-1 leading-relaxed">{r.desc}</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-indigo-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Open report →
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick stats summary */}
      <div className="mt-6 bg-gradient-to-r from-indigo-700 to-indigo-800 rounded-2xl p-6 text-white">
        <h3 className="font-display text-lg font-semibold mb-1">Quick Summary</h3>
        <p className="text-indigo-200 text-xs mb-4">Auto-generated snapshot of key metrics</p>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: "Attendance Rate", val: "0%", trend: "Stable" },
            { label: "Fee Collection", val: "₹0", trend: "Stable" },
            { label: "Exam Pass Rate", val: "0%", trend: "Stable" },
            { label: "Active Students", val: "0", trend: "Stable" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3">
              <p className="text-indigo-200 text-xs">{s.label}</p>
              <p className="text-xl font-display font-semibold mt-1">{s.val}</p>
              <p className="text-xs text-green-300 mt-0.5">{s.trend}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
