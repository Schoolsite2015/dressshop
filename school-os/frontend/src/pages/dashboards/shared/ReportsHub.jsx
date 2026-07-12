import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api.js";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import DashboardShell from "../../../components/DashboardShell.jsx";
import StatCard from "../../../components/StatCard.jsx";
import { useAuthStore } from "../../../store/authStore.js";
import {
  BarChart2, PieChart as PieIcon, Users, CreditCard, BookOpen,
  TrendingUp, Calendar, Printer, Download, Award, GraduationCap, FileText, ClipboardCheck,
  Loader2
} from "lucide-react";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"];

export default function ReportsHub() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "attendance", label: "Attendance", icon: ClipboardCheck },
    { id: "exam", label: "Exam & Academics", icon: GraduationCap },
    { id: "fees", label: "Fees & Finance", icon: CreditCard },
    { id: "staff", label: "Staff & HR", icon: Users },
  ];

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports-hub-data"],
    queryFn: () => api.get("/admin/reports-hub").then(res => res.data),
  });

  if (isLoading) {
    return (
      <DashboardShell title="Reports Hub" subtitle="Centralized analytics and reporting center">
        <div className="flex items-center justify-center h-64 text-indigo-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell title="Reports Hub" subtitle="Centralized analytics and reporting center">
        <div className="flex items-center justify-center h-64 text-red-500">
          Failed to load reports data.
        </div>
      </DashboardShell>
    );
  }

  const { overview, charts } = data;

  return (
    <DashboardShell title="Reports Hub" subtitle="Centralized analytics and reporting center">
      <div className="flex flex-col gap-6 pb-12">
        {/* Top Navigation & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition whitespace-nowrap ${
                  activeTab === tab.id ? "bg-indigo-600 text-white font-medium shadow-sm" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition text-sm font-medium">
              <Download size={16} /> Export Data
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow-md transition text-sm font-medium">
              <Printer size={16} /> Print Report
            </button>
          </div>
        </div>

        {/* Dynamic Content Based on Tab */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Students" value={overview.totalStudents} sub={`Across ${overview.totalSections} sections`} trend="up" trendVal="New" icon={Users} color="indigo" />
                <StatCard label="Avg Attendance" value={`${overview.avgAttendance}%`} sub="This month" trend="up" trendVal="" icon={ClipboardCheck} color="emerald" />
                <StatCard label="Pass Percentage" value={`${overview.passPercentage}%`} sub="Overall" trend="up" trendVal="" icon={Award} color="marigold" />
                <StatCard label="Fee Collection" value={`${overview.feeCollectionRate}%`} sub="Target vs Expected" trend="up" trendVal="" icon={CreditCard} color="rose" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Class-wise Attendance</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.attendanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend />
                        <Bar dataKey="present" name="Present %" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                        <Bar dataKey="absent" name="Absent %" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Grade Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">School Grade Distribution</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.gradeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="count"
                          labelLine={false}
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {charts.gradeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend layout="horizontal" verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subject Performance */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Average Subject Performance</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={charts.subjectAvgData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                        <Radar name="Average Score" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.4} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "overview" && (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-500">
                <FileText size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 capitalize">{activeTab} Reports</h2>
              <p className="text-gray-500 max-w-md">
                Detailed {activeTab} analytics and tabular reports will be displayed here. Use the export button above to download full CSV/PDF versions.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardShell>
  );
}
