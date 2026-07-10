import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";
import { Wand2, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

const DAY_NAMES = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };
const DAY_SHORT = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
const PERIOD_TIMES = ["8:00", "8:45", "9:30", "10:15", "11:15", "12:00"];

export default function Timetable() {
  const { user } = useAuthStore();
  const isPrincipal = user?.role === "principal" || user?.role === "admin";

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [activeTab, setActiveTab] = useState("view");

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get("/students/classes").then((r) => r.data.classes),
  });
  const { data: sections } = useQuery({
    queryKey: ["sections", classId],
    queryFn: () => api.get(`/students/sections?classId=${classId}`).then((r) => r.data.sections),
    enabled: !!classId,
  });
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get("/students/subjects").then((r) => r.data.subjects).catch(() => []),
  });
  const { data: staffList } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => api.get("/hr/staff").then((r) => r.data.staff).catch(() => []),
  });

  const { data: timetable, refetch } = useQuery({
    queryKey: ["timetable", classId, sectionId],
    queryFn: () => api.get(`/timetable?classId=${classId}&sectionId=${sectionId}`).then((r) => r.data),
    enabled: !!classId && !!sectionId,
  });

  const selectedClass = (classes || []).find((c) => c.id === classId);

  return (
    <DashboardShell title="Timetable" subtitle={isPrincipal ? "View and auto-generate class timetables" : "Your weekly schedule"}>
      {/* Class/Section Selector */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div>
          <label className="text-xs text-indigo-500 block mb-1 font-medium">Class</label>
          <select
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}
            className="border border-indigo-100 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-marigold-400 outline-none transition"
          >
            <option value="">Select class</option>
            {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-indigo-500 block mb-1 font-medium">Section</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="border border-indigo-100 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-marigold-400 outline-none transition disabled:opacity-50"
            disabled={!classId}
          >
            <option value="">Select section</option>
            {(sections || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {isPrincipal && classId && sectionId && (
          <div className="flex gap-2 items-end ml-auto">
            <button
              onClick={() => setActiveTab("view")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "view" ? "bg-indigo-700 text-white" : "bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50"}`}
            >
              View
            </button>
            <button
              onClick={() => setActiveTab("generate")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === "generate" ? "bg-marigold-500 text-white" : "bg-white border border-marigold-400 text-marigold-600 hover:bg-marigold-50"}`}
            >
              <Wand2 size={14} /> Auto-Generate
            </button>
          </div>
        )}
      </div>

      {/* Generator Panel */}
      {isPrincipal && classId && sectionId && activeTab === "generate" && (
        <GeneratorPanel
          classId={classId}
          sectionId={sectionId}
          subjects={subjects || []}
          staff={staffList || []}
          className={selectedClass?.name || ""}
          onGenerated={() => { refetch(); setActiveTab("view"); }}
        />
      )}

      {/* Timetable Grid */}
      {activeTab === "view" && timetable && (
        <div className="bg-white border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 px-5 py-3">
            <p className="text-white font-display text-sm font-semibold">
              {selectedClass?.name} — {(sections || []).find(s => s.id === sectionId)?.name} Weekly Schedule
            </p>
            <p className="text-indigo-200 text-xs mt-0.5">Monday to Saturday · 6 periods per day</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 text-indigo-600">
                <tr>
                  <th className="p-3 text-left font-medium w-24">Period</th>
                  {timetable.days.map((d) => (
                    <th key={d} className="p-3 font-medium text-center">
                      <div>{DAY_NAMES[d]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: timetable.periodsPerDay }).map((_, periodIdx) => (
                  <tr key={periodIdx} className="border-t border-indigo-50 hover:bg-paper transition">
                    <td className="p-3">
                      <div className="text-xs font-semibold text-indigo-500">Period {periodIdx + 1}</div>
                      <div className="text-xs text-indigo-300">{PERIOD_TIMES[periodIdx]}</div>
                    </td>
                    {timetable.days.map((d) => {
                      const cell = timetable.grid[d][periodIdx];
                      return (
                        <td key={d} className="p-3 text-center">
                          {cell ? (
                            <div className="bg-indigo-50 rounded-lg p-2 min-h-[50px] flex flex-col justify-center">
                              <p className="font-semibold text-indigo-700 text-xs">{cell.subject_name}</p>
                              {cell.teacher_name && (
                                <p className="text-xs text-indigo-400 mt-0.5">{cell.teacher_name}</p>
                              )}
                              {cell.room && (
                                <p className="text-xs text-marigold-600 mt-0.5">Room {cell.room}</p>
                              )}
                            </div>
                          ) : (
                            <div className="min-h-[50px] flex items-center justify-center">
                              <span className="text-indigo-200 text-xs">—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "view" && !timetable && classId && sectionId && (
        <div className="bg-white border border-dashed border-indigo-200 rounded-xl p-12 text-center">
          <p className="text-indigo-400 text-sm mb-3">No timetable generated yet for this class/section.</p>
          {isPrincipal && (
            <button
              onClick={() => setActiveTab("generate")}
              className="bg-marigold-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-marigold-400 transition flex items-center gap-2 mx-auto"
            >
              <Wand2 size={14} /> Generate Timetable
            </button>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

function GeneratorPanel({ classId, sectionId, subjects, staff, className, onGenerated }) {
  const [rows, setRows] = useState([
    { subjectId: "", teacherId: "", periodsPerWeek: 6 },
  ]);
  const [result, setResult] = useState(null);

  const generateMutation = useMutation({
    mutationFn: (payload) => api.post("/timetable/generate", payload).then((r) => r.data),
    onSuccess: (data) => {
      setResult(data);
      if (data.placed > 0) setTimeout(onGenerated, 2000);
    },
  });

  function addRow() {
    setRows((r) => [...r, { subjectId: "", teacherId: "", periodsPerWeek: 4 }]);
  }

  function removeRow(i) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  function updateRow(i, field, value) {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  function handleGenerate() {
    const subjectsList = rows
      .filter((r) => r.subjectId)
      .map((r) => ({ subjectId: r.subjectId, teacherId: r.teacherId || null, periodsPerWeek: Number(r.periodsPerWeek) }));
    if (!subjectsList.length) return;
    generateMutation.mutate({ classId, sectionId, subjects: subjectsList });
  }

  const totalPeriods = rows.reduce((s, r) => s + Number(r.periodsPerWeek || 0), 0);
  const maxPeriods = 36; // 6 days × 6 periods

  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-display text-lg text-indigo-700">Auto-generate Timetable</p>
          <p className="text-xs text-indigo-400 mt-0.5">
            For {className} — {sectionId}. Add subjects with weekly periods and assign teachers.
          </p>
        </div>
        <div className={`text-xs font-semibold px-3 py-1 rounded-full ${totalPeriods > maxPeriods ? "bg-red-100 text-red-600" : "bg-green-50 text-green-600"}`}>
          {totalPeriods} / {maxPeriods} periods
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-indigo-400 px-1">
          <div className="col-span-4">Subject</div>
          <div className="col-span-4">Assign Teacher</div>
          <div className="col-span-2">Periods/Week</div>
          <div className="col-span-2"></div>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <select
                value={row.subjectId}
                onChange={(e) => updateRow(i, "subjectId", e.target.value)}
                className="w-full border border-indigo-100 rounded-lg px-3 py-2 text-sm bg-paper focus:ring-2 focus:ring-marigold-400 outline-none"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-4">
              <select
                value={row.teacherId}
                onChange={(e) => updateRow(i, "teacherId", e.target.value)}
                className="w-full border border-indigo-100 rounded-lg px-3 py-2 text-sm bg-paper focus:ring-2 focus:ring-marigold-400 outline-none"
              >
                <option value="">No teacher assigned</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <div className="flex items-center border border-indigo-100 rounded-lg overflow-hidden bg-paper">
                <button
                  type="button"
                  onClick={() => updateRow(i, "periodsPerWeek", Math.max(1, row.periodsPerWeek - 1))}
                  className="px-2 py-2 text-indigo-500 hover:bg-indigo-50 transition"
                >−</button>
                <span className="flex-1 text-center text-sm font-medium">{row.periodsPerWeek}</span>
                <button
                  type="button"
                  onClick={() => updateRow(i, "periodsPerWeek", Math.min(12, row.periodsPerWeek + 1))}
                  className="px-2 py-2 text-indigo-500 hover:bg-indigo-50 transition"
                >+</button>
              </div>
            </div>
            <div className="col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition"
        >
          <Plus size={14} /> Add subject
        </button>
        <div className="flex-1" />
        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || totalPeriods > maxPeriods || rows.every(r => !r.subjectId)}
          className="bg-marigold-500 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-marigold-400 transition disabled:opacity-50 flex items-center gap-2"
        >
          {generateMutation.isPending ? (
            <><RefreshCw size={14} className="animate-spin" /> Generating...</>
          ) : (
            <><Wand2 size={14} /> Generate Timetable</>
          )}
        </button>
      </div>

      {result && (
        <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${result.placed > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          {result.placed > 0 ? (
            <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className={`text-sm font-medium ${result.placed > 0 ? "text-green-700" : "text-red-700"}`}>
              {result.placed > 0 ? `Successfully placed ${result.placed} periods!` : "Could not generate timetable"}
            </p>
            {result.unplaced > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {result.unplaced} period(s) could not be placed due to teacher conflicts.
              </p>
            )}
            {result.placed > 0 && (
              <p className="text-xs text-green-600 mt-1">Refreshing timetable view...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
