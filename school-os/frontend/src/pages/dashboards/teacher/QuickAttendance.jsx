import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { UserCheck, UserX, Search, QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";

export default function QuickAttendance() {
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus the input automatically for barcode scanners
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const lookupMutation = useMutation({
    mutationFn: (q) => api.get(`/students/lookup?q=${encodeURIComponent(q)}`).then((r) => r.data.student),
    onSuccess: (data) => {
      setStudent(data);
      setError(null);
      setSuccessMsg(null);
    },
    onError: (err) => {
      setStudent(null);
      setError(err.response?.data?.error || "Student not found");
      setSuccessMsg(null);
    }
  });

  const markMutation = useMutation({
    mutationFn: (status) => api.post("/attendance/quick", {
      studentId: student.id,
      date: new Date().toISOString().split("T")[0],
      status
    }),
    onSuccess: (data, variables) => {
      setSuccessMsg(`Marked ${student.name} as ${variables.toUpperCase()} for today.`);
      setStudent(null);
      setQuery("");
      setError(null);
      if (inputRef.current) inputRef.current.focus();
    },
    onError: (err) => {
      setError(err.response?.data?.error || "Failed to mark attendance. Ensure you have permissions.");
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    lookupMutation.mutate(query.trim());
  };

  return (
    <DashboardShell
      title="Quick Attendance"
      subtitle="Scan Student QR Code or Enter Admission Number"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Search / Scan Box */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-50">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Scan QR or enter admission number..."
                className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg font-medium text-ink placeholder:text-indigo-300"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={lookupMutation.isPending || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search size={20} />
              {lookupMutation.isPending ? "Searching..." : "Lookup"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-700">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}
        </div>

        {/* Student Result & Actions */}
        {student && (
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-indigo-100/50 border border-indigo-100 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 mb-4 shadow-inner">
              <span className="text-3xl font-bold">
                {student.name.split(" ").map(w => w[0]).join("").substring(0,2)}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-ink mb-2">{student.name}</h2>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-indigo-600/80 font-medium mb-8">
              <span className="px-3 py-1 bg-indigo-50 rounded-lg">ID: {student.admission_no}</span>
              <span className="px-3 py-1 bg-indigo-50 rounded-lg">Class: {student.class_name} {student.section_name}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={() => markMutation.mutate("present")}
                disabled={markMutation.isPending}
                className="group relative flex flex-col items-center justify-center gap-3 p-6 bg-emerald-50 hover:bg-emerald-500 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:text-emerald-600 transition-transform shadow-sm">
                  <UserCheck size={32} strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold text-emerald-700 group-hover:text-white transition-colors">
                  Present
                </span>
              </button>

              <button
                onClick={() => markMutation.mutate("absent")}
                disabled={markMutation.isPending}
                className="group relative flex flex-col items-center justify-center gap-3 p-6 bg-rose-50 hover:bg-rose-500 rounded-2xl border-2 border-rose-200 hover:border-rose-500 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-rose-500 group-hover:scale-110 group-hover:text-rose-600 transition-transform shadow-sm">
                  <UserX size={32} strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold text-rose-700 group-hover:text-white transition-colors">
                  Absent
                </span>
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
