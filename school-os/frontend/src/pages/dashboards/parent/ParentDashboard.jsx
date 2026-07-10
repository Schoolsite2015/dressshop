import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Bell, Calendar, Bus, MessageSquare, ChevronRight,
  AlertCircle, CreditCard, CheckCircle2, BookOpen,
} from "lucide-react";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";

function AttendanceRing({ percentage = 0 }) {
  const pct = Math.min(100, Math.max(0, percentage));
  const data = [{ value: pct }, { value: 100 - pct }];
  const color = pct >= 75 ? "#10b981" : pct >= 60 ? "#E8940F" : "#ef4444";
  return (
    <div className="relative w-28 h-28">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={52} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            <Cell fill={color} />
            <Cell fill="#EEF0F9" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-display font-bold" style={{ color }}>{pct}%</span>
        <span className="text-[10px] text-indigo-400">Attendance</span>
      </div>
    </div>
  );
}

const DEMO_CHILD = {
  name: "Priya Sharma",
  class_name: "Class X",
  section_name: "A",
  admission_no: "SNPS-2026-003",
  attendance: 88,
  feeBalance: 6200,
  totalFee: 18000,
  paid: 11800,
};

export default function ParentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: notices } = useQuery({
    queryKey: ["notices"],
    queryFn: () => api.get("/notices").then((r) => r.data.notices),
  });
  const { data: homework } = useQuery({
    queryKey: ["my-homework"],
    queryFn: () => api.get("/homework?classId=1").then((r) => r.data.homework),
  });
  const { data: students } = useQuery({
    queryKey: ["me-student-lookup"],
    queryFn: () => api.get("/students?search=").then((r) => r.data.students),
  });
  const child = (students || [])[0] || DEMO_CHILD;

  const { data: fees } = useQuery({
    queryKey: ["child-fees", child?.id],
    queryFn: () => api.get(`/fees/student/${child.id}`).then((r) => r.data.summary),
    enabled: !!child?.id,
  });
  const { data: attendance } = useQuery({
    queryKey: ["child-attendance", child?.id],
    queryFn: () => api.get(`/attendance/student/${child.id}`).then((r) => r.data.summary),
    enabled: !!child?.id,
  });

  const attPct = attendance?.percentage ?? DEMO_CHILD.attendance;
  const feeBalance = fees?.balance ?? DEMO_CHILD.feeBalance;
  const hasFeeBalance = feeBalance > 0;

  return (
    <DashboardShell
      title={`Hello, ${user?.name?.split(" ")[0] || "Parent"}!`}
      subtitle="Your child's progress at a glance"
    >
      {/* Fee Reminder Banner */}
      {hasFeeBalance && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Fee balance pending</p>
              <p className="text-xs text-amber-600">₹{feeBalance.toLocaleString("en-IN")} is due for {child.name || DEMO_CHILD.name}.</p>
            </div>
          </div>
          <button className="bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-400 transition flex items-center gap-1">
            <CreditCard size={14} /> Pay Online
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Child Profile Card */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-700 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-3xl font-display font-bold mb-3 shadow-lg">
            {(child.name || DEMO_CHILD.name).charAt(0)}
          </div>
          <p className="font-display text-xl text-ink">{child.name || DEMO_CHILD.name}</p>
          <p className="text-sm text-indigo-400 mt-1">{child.class_name || DEMO_CHILD.class_name} · Section {child.section_name || DEMO_CHILD.section_name}</p>
          <p className="text-xs text-indigo-300 mt-0.5">{child.admission_no || DEMO_CHILD.admission_no}</p>
          <div className="mt-5">
            <AttendanceRing percentage={attPct} />
          </div>
          <p className="text-xs text-indigo-400 mt-2">{attendance?.present ?? 138} of {attendance?.total ?? 157} days present</p>
        </div>

        {/* Fee Status Card */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <p className="font-display text-lg text-ink mb-4">Fee Status</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-indigo-400 mb-1.5">
                <span>Paid</span>
                <span>₹{(fees?.totalPaid ?? DEMO_CHILD.paid).toLocaleString("en-IN")} / ₹{(DEMO_CHILD.totalFee).toLocaleString("en-IN")}</span>
              </div>
              <div className="w-full bg-indigo-50 rounded-full h-3">
                <div
                  className="bg-indigo-700 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, ((fees?.totalPaid ?? DEMO_CHILD.paid) / DEMO_CHILD.totalFee) * 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-600">Paid</p>
                <p className="font-display text-lg font-semibold text-emerald-700">₹{(fees?.totalPaid ?? DEMO_CHILD.paid).toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-red-500">Balance</p>
                <p className="font-display text-lg font-semibold text-red-600">₹{feeBalance.toLocaleString("en-IN")}</p>
              </div>
            </div>
            {hasFeeBalance && (
              <button className="w-full bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-600 transition flex items-center justify-center gap-2">
                <CreditCard size={16} /> Pay Online
              </button>
            )}
            {!hasFeeBalance && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm py-2">
                <CheckCircle2 size={18} /> All fees cleared!
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <p className="font-display text-lg text-ink mb-4">Quick Access</p>
          <div className="space-y-2">
            {[
              { label: "Timetable", icon: Calendar, path: "/dashboard/timetable", desc: "View class schedule" },
              { label: "Homework", icon: BookOpen, path: "/dashboard/homework", desc: "Pending assignments" },
              { label: "Notice Board", icon: Bell, path: "/dashboard/notices", desc: "School announcements" },
              { label: "Messages", icon: MessageSquare, path: "/dashboard/messages", desc: "Contact teachers" },
              { label: "Transport", icon: Bus, path: "/dashboard/transport", desc: "Bus tracking" },
            ].map(({ label, icon: Icon, path, desc }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition group text-left"
              >
                <span className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition flex-shrink-0">
                  <Icon size={18} className="text-indigo-600" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{label}</p>
                  <p className="text-xs text-indigo-400">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-indigo-300 group-hover:text-indigo-500 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Homework */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-lg text-ink">Recent Homework</p>
            <button onClick={() => navigate("/dashboard/homework")} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {(homework || []).slice(0, 5).map((h) => {
              const daysLeft = h.due_date ? Math.ceil((new Date(h.due_date) - new Date()) / 86400000) : null;
              return (
                <div key={h.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-indigo-50 hover:border-indigo-100 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink line-clamp-1">{h.description}</p>
                    <p className="text-xs text-indigo-400 mt-0.5">{h.class_name} {h.section_name} {h.subject_name && `· ${h.subject_name}`}</p>
                  </div>
                  {daysLeft !== null && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${daysLeft <= 1 ? "bg-red-100 text-red-600" : daysLeft <= 3 ? "bg-marigold-500/10 text-marigold-600" : "bg-indigo-50 text-indigo-500"}`}>
                      {daysLeft <= 0 ? "Today" : `${daysLeft}d left`}
                    </span>
                  )}
                </div>
              );
            })}
            {(homework || []).length === 0 && (
              <div className="text-center py-8 text-indigo-300">
                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No homework assigned currently.</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Notices */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-lg text-ink">Latest Notices</p>
            <button onClick={() => navigate("/dashboard/notices")} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {(notices || []).slice(0, 5).map((n) => (
              <div key={n.id} className="p-3 rounded-xl border border-indigo-50 hover:border-indigo-100 transition">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-ink line-clamp-1">{n.title}</p>
                  <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full capitalize flex-shrink-0">{n.audience}</span>
                </div>
                <p className="text-xs text-indigo-400 line-clamp-1 mt-0.5">{n.body}</p>
                <p className="text-[10px] text-indigo-300 mt-1.5">
                  {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
            {(notices || []).length === 0 && (
              <div className="text-center py-8 text-indigo-300">
                <Bell size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No recent notices.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
