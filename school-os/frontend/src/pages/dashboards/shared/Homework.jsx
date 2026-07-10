import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, CheckCircle2, Clock, AlertCircle, BookOpen, X } from "lucide-react";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";

const SUBJECT_COLORS = {
  Mathematics: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", dot: "#2C3670" },
  Science: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "#10b981" },
  English: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", dot: "#E8940F" },
  Hindi: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", dot: "#8b5cf6" },
  "Social Science": { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", dot: "#ef4444" },
  default: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", dot: "#6b7280" },
};

function getSubjectStyle(name) {
  return SUBJECT_COLORS[name] || SUBJECT_COLORS.default;
}

function DaysLeft({ dueDate }) {
  if (!dueDate) return null;
  const days = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  if (days < 0) return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><AlertCircle size={11} />Overdue</span>;
  if (days === 0) return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Clock size={11} />Today</span>;
  if (days <= 2) return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Clock size={11} />{days}d left</span>;
  return <span className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Clock size={11} />{days}d left</span>;
}

export default function Homework() {
  const { user } = useAuthStore();
  const canPost = ["teacher", "principal", "admin"].includes(user?.role);
  const isStudentOrParent = ["student", "parent"].includes(user?.role);
  const qc = useQueryClient();

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [doneSet, setDoneSet] = useState(new Set());

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get("/students/classes").then((r) => r.data.classes),
  });
  const { data: sections } = useQuery({
    queryKey: ["sections", classId],
    queryFn: () => api.get(`/students/sections?classId=${classId}`).then((r) => r.data.sections),
    enabled: !!classId,
  });
  const { data: homework, isLoading } = useQuery({
    queryKey: ["homework", classId, sectionId],
    queryFn: () => api.get(`/homework?classId=${classId}&sectionId=${sectionId}`).then((r) => r.data.homework),
    enabled: !!classId,
  });

  const postMutation = useMutation({
    mutationFn: () => api.post("/homework", { classId, sectionId: sectionId || null, subject: subject || null, description, dueDate: dueDate || null }),
    onSuccess: () => {
      setDescription(""); setDueDate(""); setSubject(""); setShowForm(false); setEditId(null);
      qc.invalidateQueries({ queryKey: ["homework"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/homework/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homework"] }),
  });

  const toggleDone = (id) => {
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const inputCls = "w-full border border-indigo-100 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-ink placeholder-indigo-300";

  return (
    <DashboardShell
      title="Homework"
      subtitle={canPost ? "Post and manage homework by class & subject" : "Your upcoming and recent assignments"}
    >
      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} className={inputCls + " w-auto"}>
          <option value="">Select class…</option>
          {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={inputCls + " w-auto"} disabled={!classId}>
          <option value="">All sections</option>
          {(sections || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {canPost && classId && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-600 transition ml-auto"
          >
            <Plus size={16} /> {showForm ? "Cancel" : "Post Homework"}
          </button>
        )}
      </div>

      {/* POST FORM (Teacher view) */}
      {canPost && showForm && classId && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 mb-6 shadow-sm">
          <p className="font-display text-lg text-ink mb-4">{editId ? "Edit Homework" : "New Homework Assignment"}</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-indigo-400 font-medium block mb-1">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
                <option value="">Any / All subjects</option>
                {["Mathematics", "Science", "English", "Hindi", "Social Science", "Computer Science"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-indigo-400 font-medium block mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} min={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-indigo-400 font-medium block mb-1">Assignment Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the homework clearly, e.g. 'Complete Ex. 4.2 Q1–10, bring the worksheet signed by parent.'"
              rows={3} className={inputCls}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => postMutation.mutate()}
              disabled={!description.trim() || postMutation.isPending}
              className="bg-marigold-500 text-ink font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 hover:bg-marigold-400 transition text-sm"
            >
              {postMutation.isPending ? "Posting…" : editId ? "Save Changes" : "Post Assignment"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2.5 rounded-xl border border-indigo-100 text-sm text-indigo-500 hover:bg-indigo-50 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* HOMEWORK LIST */}
      {classId ? (
        isLoading ? (
          <div className="text-center py-16 text-indigo-300">
            <BookOpen size={36} className="mx-auto mb-2 opacity-30 animate-pulse" />
            <p className="text-sm">Loading homework…</p>
          </div>
        ) : (homework || []).length === 0 ? (
          <div className="text-center py-16 text-indigo-300 bg-white border border-indigo-50 rounded-2xl">
            <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-display text-lg text-indigo-400">No homework assigned yet!</p>
            <p className="text-sm mt-1">{canPost ? "Use the button above to post a new assignment." : "Check back later."}</p>
          </div>
        ) : (
          <div className={`${isStudentOrParent ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}`}>
            {(homework || []).map((h) => {
              const style = getSubjectStyle(h.subject_name);
              const done = doneSet.has(h.id);
              if (isStudentOrParent) {
                // Card view for students/parents
                return (
                  <div
                    key={h.id}
                    className={`bg-white border-2 ${style.border} rounded-2xl p-5 shadow-sm transition-all ${done ? "opacity-60" : "hover:shadow-md"}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      {h.subject_name ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>{h.subject_name}</span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">General</span>
                      )}
                      <DaysLeft dueDate={h.due_date} />
                    </div>
                    <p className={`text-sm text-ink leading-relaxed mb-3 ${done ? "line-through text-indigo-300" : ""}`}>{h.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-indigo-400">{h.class_name} {h.section_name || ""}</p>
                      <button
                        onClick={() => toggleDone(h.id)}
                        className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition ${done ? "bg-emerald-100 text-emerald-700" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                      >
                        <CheckCircle2 size={12} /> {done ? "Done!" : "Mark Done"}
                      </button>
                    </div>
                    {h.due_date && (
                      <p className="text-xs text-indigo-300 mt-2 border-t border-indigo-50 pt-2">
                        Due: {new Date(h.due_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                );
              }
              // Row view for teachers/principal
              return (
                <div key={h.id} className="bg-white border border-indigo-100 rounded-xl p-4 flex items-start gap-4 hover:border-indigo-200 hover:shadow-sm transition group">
                  {h.subject_name && (
                    <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: style.dot }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-xs text-indigo-400">{h.class_name} {h.section_name || "All sections"}</p>
                      {h.subject_name && <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{h.subject_name}</span>}
                    </div>
                    <p className="text-sm text-ink">{h.description}</p>
                    <p className="text-xs text-indigo-300 mt-1">Posted by {h.teacher_name || "Teacher"}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <DaysLeft dueDate={h.due_date} />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => deleteMutation.mutate(h.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="text-center py-16 text-indigo-300 bg-white border border-indigo-50 rounded-2xl">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-display text-lg text-indigo-400">Select a class to view homework</p>
          <p className="text-sm mt-1">Use the dropdown above to filter assignments by class.</p>
        </div>
      )}
    </DashboardShell>
  );
}
