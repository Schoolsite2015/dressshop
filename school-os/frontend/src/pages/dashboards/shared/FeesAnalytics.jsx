import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import DashboardShell from "../../../components/DashboardShell.jsx";
import StatCard from "../../../components/StatCard.jsx";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, DollarSign, Users, AlertTriangle, Calendar,
  Printer, Download, Filter, CreditCard, Wallet, PieChart as PieIcon, BarChart2
} from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

// Mock data
const revenueData = [
  { month: "Apr", revenue: 450000, target: 400000 },
  { month: "May", revenue: 520000, target: 450000 },
  { month: "Jun", revenue: 380000, target: 400000 },
  { month: "Jul", revenue: 650000, target: 500000 },
  { month: "Aug", revenue: 480000, target: 450000 },
  { month: "Sep", revenue: 510000, target: 500000 },
];

const classData = [
  { name: "Class I", collected: 85000, due: 15000 },
  { name: "Class II", collected: 75000, due: 20000 },
  { name: "Class V", collected: 95000, due: 10000 },
  { name: "Class X", collected: 120000, due: 30000 },
  { name: "Class XII", collected: 150000, due: 45000 },
];

const methodData = [
  { name: "Online (UPI)", value: 45 },
  { name: "Bank Transfer", value: 30 },
  { name: "Cash", value: 15 },
  { name: "Cheque", value: 10 },
];

const defaulters = [
  { id: 1, name: "Rahul Verma", class: "X - A", amount: 15000, daysOverdue: 45, phone: "9876543210" },
  { id: 2, name: "Sneha Gupta", class: "VIII - B", amount: 8500, daysOverdue: 30, phone: "8765432109" },
  { id: 3, name: "Amit Kumar", class: "XII - Sci", amount: 25000, daysOverdue: 60, phone: "7654321098" },
  { id: 4, name: "Priya Singh", class: "VI - A", amount: 6000, daysOverdue: 15, phone: "6543210987" },
];

export default function FeesAnalytics() {
  const [dateRange, setDateRange] = useState("This Quarter");

  return (
    <DashboardShell title="Fees Analytics" subtitle="Comprehensive financial overview and insights">
      <div className="flex flex-col gap-6 pb-12">
        {/* Top Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-white rounded-xl shadow-sm p-1">
            {["This Month", "Last Month", "This Quarter", "This Year"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-1.5 text-sm rounded-lg transition ${
                  dateRange === range ? "bg-indigo-600 text-white font-medium shadow-sm" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition text-sm font-medium">
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value="₹ 29,90,000" sub="vs last quarter" trend="up" trendVal="12.5%" icon={DollarSign} color="indigo" />
          <StatCard label="Collection Rate" value="92.4%" sub="Target: 95%" trend="up" trendVal="2.1%" icon={TrendingUp} color="emerald" />
          <StatCard label="Average Payment" value="₹ 14,250" sub="Per student" trend="down" trendVal="1.2%" icon={Wallet} color="amber" />
          <StatCard label="Total Outstanding" value="₹ 4,50,000" sub="From 45 students" trend="up" trendVal="5.4%" icon={AlertTriangle} color="rose" />
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Revenue Trend ({dateRange})</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis tickFormatter={(val) => `₹${val/1000}k`} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip formatter={(value) => `₹ ${value.toLocaleString("en-IN")}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="target" stroke="#9ca3af" strokeDasharray="5 5" fill="none" name="Target" />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Actual Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Payment Methods</h3>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {methodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Lower Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Class-wise Collection vs Due</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" tickFormatter={(val) => `₹${val/1000}k`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(value) => `₹ ${value.toLocaleString("en-IN")}`} cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Bar dataKey="collected" stackId="a" fill="#10b981" name="Collected" radius={[0, 0, 0, 0]} barSize={20} />
                  <Bar dataKey="due" stackId="a" fill="#ef4444" name="Pending Due" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Top Defaulters</h3>
              <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">View All</button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Class</th>
                    <th className="pb-3 font-medium text-right">Amount Due</th>
                    <th className="pb-3 font-medium text-right">Overdue By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {defaulters.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition group cursor-pointer">
                      <td className="py-3">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.phone}</p>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{student.class}</td>
                      <td className="py-3 text-sm font-semibold text-rose-600 text-right">
                        ₹{student.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                          {student.daysOverdue} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
