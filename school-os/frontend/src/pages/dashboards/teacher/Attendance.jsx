import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";

const STATUSES = ["present", "absent", "late"];
const today = new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today);
  const [marks, setMarks] = useState({});
  const [saved, setSaved] = useState(false);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get("/students/classes").then((r) => r.data.classes),
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", classId],
    queryFn: () => api.get(`/students/sections?classId=${classId}`).then((r) => r.data.sections),
    enabled: !!classId,
  });

  const { data: roster, refetch } = useQuery({
    queryKey: ["attendance-roster", classId, sectionId, date],
    queryFn: () =>
      api.get(`/attendance?classId=${classId}&sectionId=${sectionId}&date=${date}`).then((r) => r.data.students),
    enabled: !!classId,
  });

  const mutation = useMutation({
    mutationFn: (records) => api.post("/attendance", { date, records }),
    onSuccess: () => { setSaved(true); refetch(); },
  });

  function setStatus(studentId, status) {
    setMarks((m) => ({ ...m, [studentId]: status }));
    setSaved(false);
  }

  function handleSave() {
    const records = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
    if (records.length === 0) return;
    mutation.mutate(records);
  }

  return (
    <DashboardShell title="Attendance" subtitle="Mark today's attendance by class and section">
      <div className="flex gap-4 mb-6">
        <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} className="select">
          <option value="">Select class</option>
          {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="select" disabled={!classId}>
          <option value="">All sections</option>
          {(sections || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="select" />
      </div>

      {classId && (
        <div className="bg-white border border-indigo-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-indigo-50 text-indigo-600 text-left">
              <tr><th className="p-3">Student</th><th className="p-3">Admission No.</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {(roster || []).map((s) => (
                <tr key={s.student_id} className="border-t border-indigo-50">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3 text-indigo-400">{s.admission_no}</td>
                  <td className="p-3 flex gap-2">
                    {STATUSES.map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatus(s.student_id, st)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          (marks[s.student_id] || s.status) === st
                            ? "bg-marigold-500 border-marigold-500 text-ink"
                            : "border-indigo-200 text-indigo-500"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
              {(roster || []).length === 0 && (
                <tr><td colSpan={3} className="p-4 text-indigo-400 text-center">No students found for this class/section.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {classId && (
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="mt-5 bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-600 transition disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save attendance"}
        </button>
      )}
      {saved && <p className="text-sm text-marigold-600 mt-2">Attendance saved.</p>}

      <style>{`.select { border: 1px solid #D6DAF0; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.85rem; background: white; }`}</style>
    </DashboardShell>
  );
}
