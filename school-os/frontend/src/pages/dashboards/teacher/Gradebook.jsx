import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";

// Two-step flow: create/select an exam for a class, then fill in the
// students x subjects gradebook grid. Feeds directly into the AI Report
// Card Writer, which reads from the same `marks` table.
export default function Gradebook() {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [examId, setExamId] = useState("");
  const [newExamName, setNewExamName] = useState("");
  const [pendingEdits, setPendingEdits] = useState({});
  const [saved, setSaved] = useState(false);

  const { data: classes } = useQuery({
    queryKey: ["classes"], queryFn: () => api.get("/students/classes").then((r) => r.data.classes),
  });
  const { data: sections } = useQuery({
    queryKey: ["sections", classId],
    queryFn: () => api.get(`/students/sections?classId=${classId}`).then((r) => r.data.sections),
    enabled: !!classId,
  });
  const { data: exams, refetch: refetchExams } = useQuery({
    queryKey: ["exams", classId],
    queryFn: () => api.get(`/exams?classId=${classId}`).then((r) => r.data.exams),
    enabled: !!classId,
  });

  const { data: gradebook, refetch: refetchGrid } = useQuery({
    queryKey: ["gradebook", examId, classId, sectionId],
    queryFn: () => api.get(`/exams/${examId}/gradebook?classId=${classId}&sectionId=${sectionId}`).then((r) => r.data),
    enabled: !!examId && !!classId,
  });

  const createExamMutation = useMutation({
    mutationFn: () => api.post("/exams", { name: newExamName, classId, academicYear: "2026-27" }).then((r) => r.data.exam),
    onSuccess: (exam) => { setExamId(exam.id); setNewExamName(""); refetchExams(); },
  });

  const saveMutation = useMutation({
    mutationFn: (entries) => api.post("/exams/marks", { entries }),
    onSuccess: () => { setSaved(true); setPendingEdits({}); refetchGrid(); },
  });

  function updateCell(studentId, examSubjectId, value) {
    setPendingEdits((p) => ({ ...p, [`${studentId}:${examSubjectId}`]: { studentId, examSubjectId, marksObtained: value === "" ? null : Number(value) } }));
    setSaved(false);
  }

  function handleSave() {
    const entries = Object.values(pendingEdits);
    if (entries.length === 0) return;
    saveMutation.mutate(entries);
  }

  return (
    <DashboardShell title="Gradebook" subtitle="Create an exam, then enter marks — feeds straight into the AI Report Card Writer">
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        <div>
          <label className="text-xs text-indigo-500 block mb-1">Class</label>
          <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); setExamId(""); }} className="select">
            <option value="">Select class</option>
            {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-indigo-500 block mb-1">Section</label>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="select" disabled={!classId}>
            <option value="">All sections</option>
            {(sections || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-indigo-500 block mb-1">Exam</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="select" disabled={!classId}>
            <option value="">Select exam</option>
            {(exams || []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        {classId && (
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-xs text-indigo-500 block mb-1">New exam name</label>
              <input value={newExamName} onChange={(e) => setNewExamName(e.target.value)} placeholder="e.g. Term 1" className="select" />
            </div>
            <button
              disabled={!newExamName || createExamMutation.isPending}
              onClick={() => createExamMutation.mutate()}
              className="bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              + Create exam
            </button>
          </div>
        )}
      </div>

      {examId && gradebook && (
        <>
          {gradebook.subjects.length === 0 ? (
            <p className="text-sm text-indigo-400 bg-white border border-indigo-100 rounded-xl p-4">
              This exam has no subjects yet. Add subjects via the API (<code>POST /api/exams</code> with a
              <code> subjects</code> array) — a subject-picker UI is the natural next addition here.
            </p>
          ) : (
            <div className="bg-white border border-indigo-100 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-indigo-50 text-indigo-600 text-left">
                  <tr>
                    <th className="p-3 sticky left-0 bg-indigo-50">Student</th>
                    {gradebook.subjects.map((s) => (
                      <th key={s.exam_subject_id} className="p-3">{s.subject_name} <span className="text-indigo-300">/{s.max_marks}</span></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gradebook.grid.map((row) => (
                    <tr key={row.student.id} className="border-t border-indigo-50">
                      <td className="p-3 font-medium sticky left-0 bg-white">{row.student.name}</td>
                      {row.marks.map((m) => (
                        <td key={m.examSubjectId} className="p-2">
                          <input
                            type="number"
                            defaultValue={m.obtained ?? ""}
                            max={m.maxMarks}
                            onChange={(e) => updateCell(row.student.id, m.examSubjectId, e.target.value)}
                            className="w-16 border border-indigo-200 rounded px-2 py-1 text-sm"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="mt-5 bg-marigold-500 text-ink font-semibold px-6 py-2.5 rounded-lg hover:bg-marigold-400 transition disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save marks"}
          </button>
          {saved && <p className="text-sm text-marigold-600 mt-2">Marks saved.</p>}
        </>
      )}

      <style>{`.select { border: 1px solid #D6DAF0; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.85rem; background: white; }`}</style>
    </DashboardShell>
  );
}
