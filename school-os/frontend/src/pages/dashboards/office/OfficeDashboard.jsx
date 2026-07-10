import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import StatCard from "../../../components/StatCard.jsx";
import { api } from "../../../lib/api.js";

const STATUS_FLOW = ["submitted", "shortlisted", "interview", "offered", "admitted", "rejected"];

export default function OfficeDashboard() {
  const [tab, setTab] = useState("admissions");
  return (
    <DashboardShell title="Office Dashboard" subtitle="Admissions pipeline, fee collection, student records">
      <div className="flex gap-2 mb-6">
        {["admissions", "fees", "students"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? "bg-indigo-700 text-white" : "bg-white border border-indigo-100 text-indigo-600"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "admissions" && <AdmissionsPanel />}
      {tab === "fees" && <FeesPanel />}
      {tab === "students" && <StudentsPanel />}
    </DashboardShell>
  );
}

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

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-5 mb-6">
        <StatCard label="Total applications" value={(applications || []).length} />
        <StatCard label="Awaiting review" value={(applications || []).filter((a) => a.status === "submitted").length} />
        <StatCard label="Admitted" value={(applications || []).filter((a) => a.status === "admitted").length} />
      </div>
      <div className="bg-white border border-indigo-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-indigo-50 text-indigo-600 text-left">
            <tr><th className="p-3">Applicant</th><th className="p-3">Class</th><th className="p-3">Parent / Phone</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {(applications || []).map((a) => (
              <tr key={a.id} className="border-t border-indigo-50">
                <td className="p-3">{a.applicant_name}</td>
                <td className="p-3">{a.class_applied_for}</td>
                <td className="p-3 text-indigo-400">{a.parent_name} · {a.phone}</td>
                <td className="p-3">
                  <select
                    value={a.status}
                    onChange={(e) => mutation.mutate({ id: a.id, status: e.target.value })}
                    className="border border-indigo-200 rounded-lg px-2 py-1 text-xs"
                  >
                    {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {(applications || []).length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-indigo-400">No applications yet — try the public Admissions page.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeesPanel() {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("cash");
  const qc = useQueryClient();

  const { data: students } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => api.get("/students").then((r) => r.data.students),
  });

  const mutation = useMutation({
    mutationFn: () => api.post("/fees/pay", { studentId, amount: Number(amount), mode }),
    onSuccess: () => { setAmount(""); qc.invalidateQueries({ queryKey: ["fee-summary"] }); },
  });

  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-6 max-w-lg">
      <p className="font-display text-lg text-indigo-700 mb-4">Record a fee payment</p>
      <div className="space-y-3">
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="select w-full">
          <option value="">Select student</option>
          {(students || []).map((s) => <option key={s.id} value={s.id}>{s.name} — {s.class_name}</option>)}
        </select>
        <input type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} className="select w-full" />
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="select w-full">
          <option value="cash">Cash</option>
          <option value="online">Online</option>
          <option value="cheque">Cheque</option>
          <option value="upi">UPI</option>
        </select>
        <button
          onClick={() => mutation.mutate()}
          disabled={!studentId || !amount || mutation.isPending}
          className="bg-marigold-500 text-ink font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
        >
          {mutation.isPending ? "Recording..." : "Record payment"}
        </button>
        {mutation.isSuccess && <p className="text-sm text-marigold-600">Payment recorded.</p>}
      </div>
      <style>{`.select { border: 1px solid #D6DAF0; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.85rem; }`}</style>
    </div>
  );
}

function StudentsPanel() {
  const { data: students } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => api.get("/students").then((r) => r.data.students),
  });
  return (
    <div className="bg-white border border-indigo-100 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-indigo-50 text-indigo-600 text-left">
          <tr><th className="p-3">Name</th><th className="p-3">Admission No.</th><th className="p-3">Class</th><th className="p-3">Status</th></tr>
        </thead>
        <tbody>
          {(students || []).map((s) => (
            <tr key={s.id} className="border-t border-indigo-50">
              <td className="p-3">{s.name}</td>
              <td className="p-3 text-indigo-400">{s.admission_no}</td>
              <td className="p-3">{s.class_name} {s.section_name}</td>
              <td className="p-3 capitalize">{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
