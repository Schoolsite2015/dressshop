import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import {
  User, Zap, Printer, Download, Share2, CheckCircle2,
  TrendingUp, TrendingDown, Minus, BookOpen, ChevronDown,
  Star, Calendar, Award, AlignLeft
} from "lucide-react";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";

/* ─── Helpers ───────────────────────────────────────────────── */
function gradeInfo(pct) {
  if (pct >= 91) return { grade: "A+", label: "Outstanding",  color: "bg-emerald-500",  text: "text-emerald-600", ring: "ring-emerald-300" };
  if (pct >= 81) return { grade: "A",  label: "Excellent",    color: "bg-green-500",    text: "text-green-600",   ring: "ring-green-300" };
  if (pct >= 71) return { grade: "B+", label: "Very Good",    color: "bg-teal-500",     text: "text-teal-600",    ring: "ring-teal-300" };
  if (pct >= 61) return { grade: "B",  label: "Good",         color: "bg-blue-500",     text: "text-blue-600",    ring: "ring-blue-300" };
  if (pct >= 51) return { grade: "C",  label: "Satisfactory", color: "bg-marigold-500", text: "text-marigold-600",ring: "ring-marigold-300" };
  if (pct >= 33) return { grade: "D",  label: "Needs Work",   color: "bg-orange-500",   text: "text-orange-600",  ring: "ring-orange-300" };
  return           { grade: "F",  label: "Fail",         color: "bg-rose-600",     text: "text-rose-600",    ring: "ring-rose-300" };
}

function TrendIcon({ pct }) {
  if (pct >= 75) return <TrendingUp  size={14} className="text-green-500"  />;
  if (pct >= 50) return <Minus       size={14} className="text-amber-500"  />;
  return               <TrendingDown size={14} className="text-rose-500"  />;
}

function AttBadge({ pct }) {
  const color = pct >= 85 ? "bg-green-100 text-green-700" : pct >= 75 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${color}`}>
      <Calendar size={12} /> {pct}%
    </span>
  );
}

const BAR_COLORS = [
  "#1C2340","#E8940F","#0D9488","#7C3AED","#DB2777","#2563EB","#059669","#D97706","#DC2626"
];

const inputCls = "w-full border border-indigo-100 rounded-xl px-4 py-2.5 text-sm bg-white text-ink focus:outline-none focus:ring-2 focus:ring-marigold-400 focus:border-transparent transition";
function Label({ children }) {
  return <label className="block text-sm font-semibold text-indigo-700 mb-1.5">{children}</label>;
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function AIReportCard() {
  const [studentId, setStudentId]       = useState("");
  const [examId,    setExamId]          = useState("");
  const [examLabel, setExamLabel]       = useState("");
  const [attendancePct, setAttendancePct] = useState("");
  const [behaviourNotes, setBehaviourNotes] = useState("");
  const [subjectRows, setSubjectRows]   = useState([{ subject: "", obtained: "", max: "100" }]);
  const [autoLoaded, setAutoLoaded]     = useState(false);

  /* ── Data fetching ── */
  const { data: students = [] } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => api.get("/students").then(r => r.data.students),
  });

  const { data: exams = [] } = useQuery({
    queryKey: ["exams"],
    queryFn: () => api.get("/exams").then(r => r.data.exams).catch(() => []),
  });

  /* Auto-load marks from gradebook when student + exam are selected */
  useEffect(() => {
    if (!studentId || !examId) { setAutoLoaded(false); return; }
    api.get(`/gradebook?studentId=${studentId}&examId=${examId}`)
      .then(r => {
        const rows = r.data.marks || [];
        if (rows.length > 0) {
          setSubjectRows(rows.map(m => ({
            subject: m.subject_name || m.subject,
            obtained: String(m.marks_obtained ?? m.obtained),
            max: String(m.max_marks ?? m.max ?? 100),
          })));
          setAutoLoaded(true);
        }
      })
      .catch(() => { /* silently ignore — user fills manually */ });
  }, [studentId, examId]);

  /* ── AI generation ── */
  const mutation = useMutation({
    mutationFn: (payload) => api.post("/ai/report-card", payload).then(r => r.data.reportCard),
  });

  function updateRow(i, field, val) {
    setSubjectRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }
  function addRow() { setSubjectRows(r => [...r, { subject: "", obtained: "", max: "100" }]); }
  function removeRow(i) { if (subjectRows.length > 1) setSubjectRows(r => r.filter((_, idx) => idx !== i)); }

  function handleSubmit(e) {
    e.preventDefault();
    const marks = subjectRows
      .filter(r => r.subject)
      .map(r => ({ subject: r.subject, obtained: Number(r.obtained), max: Number(r.max) }));
    mutation.mutate({
      studentId,
      examId: examId || examLabel || "Manual Entry",
      attendancePct: attendancePct ? Number(attendancePct) : undefined,
      behaviourNotes,
      marks,
    });
  }

  /* ── Derived display data ── */
  const selectedStudent = students.find(s => String(s.id) === String(studentId));
  const rc = mutation.data;

  const marksForChart = subjectRows
    .filter(r => r.subject && r.obtained !== "")
    .map(r => ({
      subject: r.subject.length > 10 ? r.subject.slice(0, 10) + "…" : r.subject,
      fullSubject: r.subject,
      obtained: Number(r.obtained),
      max: Number(r.max) || 100,
      pct: Math.round((Number(r.obtained) / (Number(r.max) || 100)) * 100),
    }));

  const overallPct = marksForChart.length > 0
    ? Math.round(marksForChart.reduce((s, m) => s + m.pct, 0) / marksForChart.length)
    : null;
  const overall = overallPct !== null ? gradeInfo(overallPct) : null;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      const info = gradeInfo(d.pct);
      return (
        <div className="bg-white border border-indigo-100 rounded-xl p-3 shadow-lg text-xs">
          <p className="font-bold text-ink mb-1">{d.fullSubject}</p>
          <p className="text-indigo-600">{d.obtained} / {d.max} marks</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-white text-xs font-bold ${info.color}`}>
            {info.grade} · {d.pct}%
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardShell
      title="AI Report Card Writer"
      subtitle="Select a student and exam — auto-load marks or enter manually — get professional AI remarks instantly"
    >
      <style>{`
        @media print {
          aside, .no-print { display: none !important; }
          body { background: white; }
          .print-card { box-shadow: none !important; page-break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-4xl space-y-8">

        {/* ── Input Form ── */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 space-y-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center shadow">
              <BookOpen size={20} className="text-marigold-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Generate Report Card</h2>
              <p className="text-xs text-indigo-400">Enter marks, attendance and notes — AI writes professional remarks</p>
            </div>
          </div>

          {/* Student + Exam Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Student</Label>
              <select
                required value={studentId}
                onChange={e => { setStudentId(e.target.value); setAutoLoaded(false); }}
                className={inputCls}
              >
                <option value="">Select student…</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.class_name} {s.section_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Exam / Term</Label>
              {exams.length > 0 ? (
                <select value={examId} onChange={e => setExamId(e.target.value)} className={inputCls}>
                  <option value="">Select exam…</option>
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name || ex.term}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={examLabel}
                  onChange={e => setExamLabel(e.target.value)}
                  placeholder="e.g. Term 1, Half-Yearly 2025-26"
                  className={inputCls}
                />
              )}
            </div>
          </div>

          {/* Auto-load indicator */}
          <AnimatePresence>
            {autoLoaded && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5"
              >
                <CheckCircle2 size={16} className="text-emerald-600" />
                <p className="text-sm text-emerald-700 font-medium">Marks auto-loaded from Gradebook</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Marks Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Subject Marks</Label>
              <button type="button" onClick={addRow}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition flex items-center gap-1">
                + Add subject
              </button>
            </div>
            <div className="space-y-2">
              {subjectRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    placeholder="Subject" value={row.subject}
                    onChange={e => updateRow(i, "subject", e.target.value)}
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    placeholder="Obtained" type="number" value={row.obtained}
                    onChange={e => updateRow(i, "obtained", e.target.value)}
                    className={`${inputCls} w-24`}
                  />
                  <span className="text-ink/30 text-sm">/</span>
                  <input
                    placeholder="Max" type="number" value={row.max}
                    onChange={e => updateRow(i, "max", e.target.value)}
                    className={`${inputCls} w-20`}
                  />
                  {marksForChart[i] && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0 ${gradeInfo(marksForChart[i].pct).color}`}>
                      {gradeInfo(marksForChart[i].pct).grade}
                    </span>
                  )}
                  <button type="button" onClick={() => removeRow(i)}
                    className="text-rose-400 hover:text-rose-600 text-lg leading-none transition shrink-0">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance + Behaviour */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Attendance %</Label>
              <input
                type="number" min={0} max={100}
                value={attendancePct}
                onChange={e => setAttendancePct(e.target.value)}
                placeholder="e.g. 87"
                className={inputCls}
              />
            </div>
            <div>
              <Label>Behaviour / Participation Notes</Label>
              <textarea
                rows={3} value={behaviourNotes}
                onChange={e => setBehaviourNotes(e.target.value)}
                placeholder="e.g. Active in class, submits homework on time, needs improvement in Science…"
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          <button
            type="submit" disabled={mutation.isPending}
            className="w-full md:w-auto bg-marigold-500 hover:bg-marigold-400 disabled:opacity-60 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Zap size={18} />
            {mutation.isPending ? "Generating with AI…" : "Generate AI Remarks"}
          </button>

          {mutation.isError && (
            <p className="text-sm text-rose-600 bg-rose-50 px-4 py-2.5 rounded-xl">
              {mutation.error?.response?.data?.error || "Generation failed. Please try again."}
            </p>
          )}
        </motion.form>

        {/* ── Loading ── */}
        <AnimatePresence>
          {mutation.isPending && (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-14 gap-5">
              <motion.div
                className="w-16 h-16 rounded-full bg-indigo-700 flex items-center justify-center shadow-xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              >
                <Star size={28} className="text-marigold-400" />
              </motion.div>
              <div className="w-64">
                <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-marigold-500 to-indigo-500 rounded-full"
                    initial={{ width: "5%" }} animate={{ width: "88%" }}
                    transition={{ duration: 5, ease: "easeInOut" }}
                  />
                </div>
              </div>
              <p className="text-indigo-700 font-semibold">Writing professional remarks…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Report Card Output ── */}
        <AnimatePresence>
          {rc && !mutation.isPending && (
            <motion.div key="rc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

              {/* Action bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 no-print">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink">Report Card Generated</h2>
                  <p className="text-sm text-indigo-400">
                    {selectedStudent?.name} · {examLabel || exams.find(e => String(e.id) === examId)?.name || "Exam"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.print()}
                    className="flex items-center gap-2 bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-600 transition shadow-sm">
                    <Printer size={15} /> Print
                  </button>
                  <button onClick={() => window.print()}
                    className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition shadow-sm">
                    <Download size={15} /> PDF
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: "Report Card", text: rc.ai_remarks });
                      } else {
                        navigator.clipboard.writeText(rc.ai_remarks);
                        alert("Remarks copied to clipboard!");
                      }
                    }}
                    className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition shadow-sm">
                    <Share2 size={15} /> Share
                  </button>
                </div>
              </div>

              {/* ── Student Profile Card ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-indigo-700 to-indigo-600 rounded-2xl p-6 text-white shadow-lg print-card"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                      <User size={30} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-bold">
                        {selectedStudent?.name || rc.student_name || "Student"}
                      </h3>
                      <p className="text-indigo-200 text-sm mt-0.5">
                        {selectedStudent?.class_name} {selectedStudent?.section_name} ·{" "}
                        {examLabel || exams.find(e => String(e.id) === examId)?.name || "Exam"}
                      </p>
                      {attendancePct && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-indigo-300">Attendance</span>
                          <AttBadge pct={Number(attendancePct)} />
                        </div>
                      )}
                    </div>
                  </div>
                  {overall && (
                    <div className="text-center">
                      <div className={`w-20 h-20 rounded-full ${overall.color} ring-4 ring-white/30 flex flex-col items-center justify-center shadow-lg`}>
                        <span className="text-2xl font-display font-bold text-white">{overall.grade}</span>
                      </div>
                      <p className="text-xs text-indigo-200 mt-1.5 font-medium">{overall.label}</p>
                      <p className="text-lg font-bold text-white">{overallPct}%</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* ── Performance Chart ── */}
              {marksForChart.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm print-card"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <TrendingUp size={20} className="text-indigo-700" />
                    <h3 className="font-display text-lg font-semibold text-ink">Subject-wise Performance</h3>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={marksForChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F9" />
                        <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "#1C2340" }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#1C2340" }} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                          {marksForChart.map((_, i) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* ── Subject Grade Badges ── */}
              {marksForChart.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm print-card"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Award size={20} className="text-indigo-700" />
                    <h3 className="font-display text-lg font-semibold text-ink">Subject Grades</h3>
                  </div>
                  <div className="space-y-2.5">
                    {marksForChart.map((m, i) => {
                      const info = gradeInfo(m.pct);
                      return (
                        <div key={i} className="flex items-center gap-3 group">
                          <span className="text-sm text-ink/70 w-36 shrink-0 group-hover:text-ink transition">{m.fullSubject}</span>
                          <div className="flex-1 h-4 bg-indigo-50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${m.pct}%` }}
                              transition={{ delay: 0.4 + i * 0.07, duration: 0.7, ease: "easeOut" }}
                              className={`h-full rounded-full ${info.color}`}
                            />
                          </div>
                          <span className="text-xs text-ink/50 w-20 text-right shrink-0">{m.obtained}/{m.max}</span>
                          <span className={`w-9 text-center text-xs font-bold px-1.5 py-0.5 rounded-md text-white ${info.color} shrink-0`}>
                            {info.grade}
                          </span>
                          <TrendIcon pct={m.pct} />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── AI Remarks ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm print-card"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlignLeft size={20} className="text-indigo-700" />
                  <h3 className="font-display text-lg font-semibold text-ink">Teacher's Remarks</h3>
                  <span className="ml-auto text-xs bg-marigold-400/20 text-marigold-600 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Star size={11} /> AI Generated
                  </span>
                </div>
                <div className="bg-paper rounded-xl p-5 border border-indigo-50">
                  <p className="font-display text-base text-ink leading-relaxed">{rc.ai_remarks}</p>
                </div>
                {behaviourNotes && (
                  <div className="mt-4 bg-indigo-50 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-1">Behaviour & Participation</p>
                    <p className="text-sm text-indigo-700">{behaviourNotes}</p>
                  </div>
                )}
              </motion.div>

              {/* ── Print-ready Report Card ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl border-2 border-indigo-700 p-8 shadow-lg print-card"
              >
                {/* Header */}
                <div className="text-center border-b border-indigo-100 pb-5 mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="w-14 h-14 rounded-full bg-indigo-700 flex items-center justify-center">
                      <BookOpen size={26} className="text-marigold-400" />
                    </div>
                  </div>
                  <h2 className="font-display text-xl font-bold text-ink">St. S.N. Public School, Pindra, Varanasi</h2>
                  <p className="text-xs text-ink/50 mt-1">Affiliated to CBSE · Est. 1995</p>
                  <div className="mt-3 inline-block bg-indigo-700 text-white px-6 py-1.5 rounded-full text-sm font-semibold">
                    PROGRESS REPORT — {examLabel || exams.find(e => String(e.id) === examId)?.name || "Academic Year 2025-26"}
                  </div>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-paper rounded-xl p-4">
                  <div>
                    <p className="text-xs text-ink/40 uppercase tracking-wide">Student Name</p>
                    <p className="font-semibold text-ink text-sm mt-0.5">{selectedStudent?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/40 uppercase tracking-wide">Class</p>
                    <p className="font-semibold text-ink text-sm mt-0.5">{selectedStudent?.class_name} {selectedStudent?.section_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/40 uppercase tracking-wide">Attendance</p>
                    <p className="font-semibold text-ink text-sm mt-0.5">{attendancePct ? `${attendancePct}%` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/40 uppercase tracking-wide">Overall Grade</p>
                    <p className={`font-bold text-sm mt-0.5 ${overall?.text}`}>{overall ? `${overall.grade} (${overallPct}%)` : "—"}</p>
                  </div>
                </div>

                {/* Marks Table */}
                <table className="w-full text-sm mb-6">
                  <thead>
                    <tr className="bg-indigo-700 text-white text-xs uppercase tracking-wide">
                      <th className="px-4 py-2.5 text-left rounded-l-lg">Subject</th>
                      <th className="px-4 py-2.5">Max Marks</th>
                      <th className="px-4 py-2.5">Marks Obtained</th>
                      <th className="px-4 py-2.5">Percentage</th>
                      <th className="px-4 py-2.5 rounded-r-lg">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marksForChart.map((m, i) => {
                      const info = gradeInfo(m.pct);
                      return (
                        <tr key={i} className={`${i % 2 === 0 ? "bg-paper" : "bg-white"} text-center`}>
                          <td className="px-4 py-2.5 text-left font-medium text-ink">{m.fullSubject}</td>
                          <td className="px-4 py-2.5 text-ink/70">{m.max}</td>
                          <td className="px-4 py-2.5 font-bold text-ink">{m.obtained}</td>
                          <td className="px-4 py-2.5 text-ink/70">{m.pct}%</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-white text-xs font-bold ${info.color}`}>
                              {info.grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {marksForChart.length > 0 && (
                    <tfoot>
                      <tr className="bg-indigo-700 text-white font-bold text-center">
                        <td className="px-4 py-2.5 text-left rounded-l-lg">Overall</td>
                        <td className="px-4 py-2.5">{marksForChart.reduce((s, m) => s + m.max, 0)}</td>
                        <td className="px-4 py-2.5">{marksForChart.reduce((s, m) => s + m.obtained, 0)}</td>
                        <td className="px-4 py-2.5">{overallPct}%</td>
                        <td className="px-4 py-2.5 rounded-r-lg">{overall?.grade}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {/* Remarks */}
                <div className="bg-paper rounded-xl p-5 border border-indigo-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400 mb-2">Teacher's Remarks</p>
                  <p className="font-display text-sm text-ink leading-relaxed">{rc.ai_remarks}</p>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-indigo-100">
                  {["Class Teacher", "Principal", "Parent/Guardian"].map((role) => (
                    <div key={role} className="text-center">
                      <div className="h-8 border-b border-ink/20 mb-2" />
                      <p className="text-xs text-ink/50">{role}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
