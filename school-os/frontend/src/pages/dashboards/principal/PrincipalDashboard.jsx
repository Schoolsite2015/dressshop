import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import DashboardShell from "../../../components/DashboardShell.jsx";
import StatCard from "../../../components/StatCard.jsx";
import { api } from "../../../lib/api.js";
import { Link } from "react-router-dom";
import { Users, CreditCard, UserPlus, BarChart2, BookMarked, ClipboardCheck } from "lucide-react";

const PIE_COLORS = ["#E8940F","#2C3670","#16a34a","#1C2340","#dc2626"];

export default function PrincipalDashboard() {
  const { data: feeSummary } = useQuery({
    queryKey: ["fee-summary"],
    queryFn:  () => api.get("/fees/summary").then((r) => r.data.monthly).catch(() => []),
  });
  const { data: admissions } = useQuery({
    queryKey: ["admissions-all"],
    queryFn:  () => api.get("/admissions").then((r) => r.data.applications).catch(() => []),
  });
  const { data: students } = useQuery({
    queryKey: ["all-students"],
    queryFn:  () => api.get("/students").then((r) => r.data.students).catch(() => []),
  });
  const { data: staff } = useQuery({
    queryKey: ["staff-list"],
    queryFn:  () => api.get("/hr/staff").then((r) => r.data.staff).catch(() => []),
  });
  const { data: notices } = useQuery({
    queryKey: ["notices"],
    queryFn:  () => api.get("/notices").then((r) => r.data.notices).catch(() => []),
  });

  const feeChart = (feeSummary || []).slice().reverse().map((m) => ({
    month: new Date(m.month).toLocaleDateString("en-IN", { month: "short" }),
    collected: Number(m.collected),
  }));

  const admissionStatus = ["submitted","shortlisted","interview","offered","admitted","rejected"].map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: (admissions || []).filter((a) => a.status === s).length,
  })).filter((d) => d.value > 0);

  const totalFee = feeChart.reduce((s, c) => s + c.collected, 0);

  return (
    <DashboardShell title="Principal's Dashboard" subtitle="School-wide analytics and management overview">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Students"  value={(students||[]).length} icon={Users}         color="default" />
        <StatCard label="Active Staff"    value={(staff||[]).length}    icon={ClipboardCheck}  color="default" />
        <StatCard label="Fee Collected"   value={`₹${(totalFee/1000).toFixed(1)}k`} icon={CreditCard} color="default" />
        <StatCard label="Pending Admissions" value={(admissions||[]).filter(a=>a.status==="submitted").length} icon={UserPlus} color="warning" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Fee trend */}
        <div className="card p-5">
          <p className="font-display text-lg text-indigo-700 mb-4">Fee Collection Trend</p>
          {feeChart.length === 0 ? (
            <p className="text-sm text-indigo-400 py-8 text-center">No payments yet. Record fees from the Office dashboard.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={feeChart}>
                <XAxis dataKey="month" stroke="#8891C7" fontSize={12} />
                <YAxis stroke="#8891C7" fontSize={12} tickFormatter={v=>`₹${v/1000}k`} />
                <Tooltip formatter={(v)=>[`₹${Number(v).toLocaleString("en-IN")}`, "Collected"]} />
                <Line type="monotone" dataKey="collected" stroke="#E8940F" strokeWidth={2} dot={{ r: 4, fill: "#E8940F" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Admissions pipeline */}
        <div className="card p-5">
          <p className="font-display text-lg text-indigo-700 mb-4">Admissions Pipeline</p>
          {admissionStatus.length === 0 ? (
            <p className="text-sm text-indigo-400 py-8 text-center">No applications yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={admissionStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {admissionStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent notices */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-lg text-indigo-700">Recent Notices</p>
            <Link to="/dashboard/notices" className="text-xs text-marigold-500 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(notices || []).slice(0, 4).map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-paper hover:bg-indigo-50 transition">
                <div className="w-2 h-2 rounded-full bg-marigold-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-indigo-700">{n.title}</p>
                  <p className="text-xs text-indigo-400 mt-0.5">{new Date(n.created_at).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
            ))}
            {(notices||[]).length === 0 && (
              <p className="text-sm text-indigo-400 text-center py-4">No notices posted yet.</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <p className="font-display text-lg text-indigo-700 mb-4">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Timetable Generator", path: "/dashboard/timetable",     icon: BarChart2, color: "bg-indigo-50 text-indigo-700" },
              { label: "HR & Payroll",         path: "/dashboard/hr",             icon: Users,      color: "bg-green-50 text-green-700" },
              { label: "Certificates",         path: "/dashboard/certificates",   icon: BarChart2, color: "bg-purple-50 text-purple-700" },
              { label: "Library",             path: "/dashboard/library",        icon: BookMarked, color: "bg-amber-50 text-amber-700" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} to={a.path}
                  className={`${a.color} rounded-xl p-4 flex flex-col gap-2 hover:opacity-80 transition-opacity`}>
                  <Icon size={20} />
                  <p className="text-sm font-medium">{a.label}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
