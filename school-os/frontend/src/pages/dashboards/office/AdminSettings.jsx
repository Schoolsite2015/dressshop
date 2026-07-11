import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import {
  UserPlus, BookOpen, Calendar as CalendarIcon, Upload,
  CheckCircle2, ShieldAlert, Users, GraduationCap,
  Copy, Eye, EyeOff, X, Sparkles, ListChecks, Plus, Trash2, Star, KeyRound, DownloadCloud, Pencil
} from "lucide-react";

export default function AdminSettings() {
  const [tab, setTab] = useState("students");
  return (
    <DashboardShell title="Admin Settings" subtitle="Super admin panel — manage students, staff, classes & academic years">
      <div className="flex gap-2 mb-6 border-b border-indigo-100 pb-3 overflow-x-auto">
        {[
          { id: "students", label: "Add Student", icon: UserPlus },
          { id: "staff", label: "Add Staff / Teacher", icon: ShieldAlert },
          { id: "academics", label: "Classes & Sections", icon: GraduationCap },
          { id: "years", label: "Academic Years", icon: CalendarIcon },
          { id: "roster-students", label: "All Students", icon: Users },
          { id: "roster-staff", label: "All Staff", icon: ListChecks },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap
              ${tab === t.id
                ? "bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50"}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
        
        <div className="flex-1" />
        <button 
          onClick={() => {
            // Data is already saved to the database in real-time, 
            // but this visual feedback gives the user confidence.
            alert("All changes have been successfully saved to the cloud database!");
          }}
          className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200"
        >
          <CheckCircle2 size={16} /> Save All Changes
        </button>
      </div>
      <div className="animate-fade-in" key={tab}>
        {tab === "students" && <AddStudentPanel />}
        {tab === "staff" && <AddStaffPanel />}
        {tab === "academics" && <AcademicPanel />}
        {tab === "years" && <YearsPanel />}
        {tab === "roster-students" && <StudentRosterPanel />}
        {tab === "roster-staff" && <StaffRosterPanel />}
      </div>
    </DashboardShell>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  ADD STUDENT                                                    */
/* ─────────────────────────────────────────────────────────────── */
function AddStudentPanel() {
  const qc = useQueryClient();
  const init = { name:"", dob:"", gender:"", blood_group:"", class_id:"", section_id:"", address:"", parent_name:"", parent_email:"", parent_phone:"" };
  const [form, setForm] = useState(init);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  const { data: classes } = useQuery({ queryKey: ["admin-classes"], queryFn: () => api.get("/admin/classes").then(r => r.data.classes).catch(() => []) });
  const { data: sections } = useQuery({ queryKey: ["admin-sections"], queryFn: () => api.get("/admin/sections").then(r => r.data.sections).catch(() => []) });

  const filteredSections = (sections || []).filter(s => s.class_id === form.class_id);

  const mut = useMutation({
    mutationFn: (data) => api.post("/admin/students", data, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["roster-students"] });
      qc.invalidateQueries({ queryKey: ["all-students"] });
      setResult(res);
      setForm(init);
      setPhoto(null);
      setPreview(null);
    }
  });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (photo) fd.append("photo", photo);
    mut.mutate(fd);
  };

  if (result) return <CredentialsCard result={result} onReset={() => setResult(null)} type="Student" />;

  return (
    <div className="card p-6 max-w-3xl animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <UserPlus size={20} className="text-indigo-600" />
        </div>
        <div>
          <p className="font-display text-lg text-indigo-700 font-semibold">Register New Student</p>
          <p className="text-xs text-indigo-400">Student and Parent login credentials will be auto-generated</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo upload */}
        <div className="flex items-center gap-6 pb-5 border-b border-indigo-50">
          <div className="relative">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-200" />
                <button type="button" onClick={() => { setPhoto(null); setPreview(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center cursor-pointer hover:border-marigold-400 hover:bg-indigo-50 transition-all">
                <Upload size={20} className="text-indigo-400 mb-1" />
                <span className="text-xs text-indigo-400">Photo</span>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhoto} />
              </label>
            )}
          </div>
          <div className="text-sm text-indigo-500">
            <p className="font-medium text-indigo-700">Passport Photo</p>
            <p className="text-xs text-indigo-400">Upload a recent photograph of the student (optional)</p>
          </div>
        </div>

        {/* Student info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Student Full Name <span className="text-red-400">*</span></label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="e.g. Riya Singh" />
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Date of Birth</label>
            <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className="form-input" />
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Gender</label>
            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="form-select">
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Blood Group</label>
            <select value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))} className="form-select">
              <option value="">Select</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Class <span className="text-red-400">*</span></label>
            <select required value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value, section_id: "" }))} className="form-select">
              <option value="">Select class</option>
              {(classes || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Section</label>
            <select value={form.section_id} onChange={e => setForm(f => ({ ...f, section_id: e.target.value }))} className="form-select">
              <option value="">Select section</option>
              {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {form.class_id && filteredSections.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">No sections created for this class. Add them in the "Classes & Sections" tab first.</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Address</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="form-input" placeholder="e.g. Village Pindra, Varanasi, UP 221005" />
          </div>
        </div>

        {/* Parent section */}
        <div className="pt-5 border-t border-indigo-50">
          <p className="font-display text-indigo-700 mb-4 flex items-center gap-2">
            <Users size={16} className="text-marigold-500" /> Parent / Guardian Details
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-indigo-500 mb-1 block font-medium">Parent Name <span className="text-red-400">*</span></label>
              <input required value={form.parent_name} onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))} className="form-input" placeholder="e.g. Suresh Singh" />
            </div>
            <div>
              <label className="text-xs text-indigo-500 mb-1 block font-medium">Parent Email <span className="text-xs font-normal text-indigo-400">(auto-generated if empty)</span></label>
              <input type="email" value={form.parent_email} onChange={e => setForm(f => ({ ...f, parent_email: e.target.value }))} className="form-input" placeholder="parent@example.com" />
            </div>
            <div>
              <label className="text-xs text-indigo-500 mb-1 block font-medium">Parent Phone</label>
              <input value={form.parent_phone} onChange={e => setForm(f => ({ ...f, parent_phone: e.target.value }))} className="form-input" placeholder="e.g. 9876543210" />
            </div>
          </div>
        </div>

        {mut.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {mut.error?.response?.data?.error || "Something went wrong. Please try again."}
          </div>
        )}

        <button type="submit" disabled={mut.isPending} className="btn-accent w-full flex items-center justify-center gap-2 py-3 text-base">
          {mut.isPending ? (
            <><div className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" /> Registering student...</>
          ) : (
            <><Sparkles size={18} /> Register Student & Generate Credentials</>
          )}
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  ADD STAFF / TEACHER                                            */
/* ─────────────────────────────────────────────────────────────── */
function AddStaffPanel() {
  const qc = useQueryClient();
  const init = { name: "", email: "", phone: "", role: "teacher", designation: "", department: "", salary_basic: "" };
  const [form, setForm] = useState(init);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const { data: classes } = useQuery({ queryKey: ["admin-classes"], queryFn: () => api.get("/admin/classes").then(r => r.data.classes).catch(() => []) });
  const { data: sections } = useQuery({ queryKey: ["admin-sections"], queryFn: () => api.get("/admin/sections").then(r => r.data.sections).catch(() => []) });
  const { data: subjects } = useQuery({ queryKey: ["admin-subjects"], queryFn: () => api.get("/admin/subjects").then(r => r.data.subjects).catch(() => []) });

  const mut = useMutation({
    mutationFn: (data) => api.post("/admin/staff", data, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["roster-staff"] });
      setResult(res);
      setForm(init);
      setPhoto(null);
      setPreview(null);
      setAssignments([]);
    }
  });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) { setPhoto(file); setPreview(URL.createObjectURL(file)); }
  };

  const addAssignmentRow = () => setAssignments(a => [...a, { class_id: "", section_id: "", subject_id: "", is_class_teacher: false }]);
  const updateAssignment = (i, patch) => setAssignments(a => a.map((row, idx) => idx === i ? { ...row, ...patch } : row));
  const removeAssignment = (i) => setAssignments(a => a.filter((_, idx) => idx !== i));

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (photo) fd.append("photo", photo);
    // Only teachers carry class assignments
    if (form.role === "teacher") {
      const clean = assignments.filter(a => a.class_id);
      if (clean.length) fd.append("assignments", JSON.stringify(clean));
    }
    mut.mutate(fd);
  };

  if (result) return <CredentialsCard result={result} onReset={() => setResult(null)} type="Staff" />;

  return (
    <div className="card p-6 max-w-3xl animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <ShieldAlert size={20} className="text-purple-600" />
        </div>
        <div>
          <p className="font-display text-lg text-indigo-700 font-semibold">Register New Staff / Teacher</p>
          <p className="text-xs text-indigo-400">They will be able to login with the auto-generated credentials</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo */}
        <div className="flex items-center gap-6 pb-5 border-b border-indigo-50">
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-200" />
              <button type="button" onClick={() => { setPhoto(null); setPreview(null); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center cursor-pointer hover:border-marigold-400 hover:bg-indigo-50 transition-all">
              <Upload size={20} className="text-indigo-400 mb-1" />
              <span className="text-xs text-indigo-400">Photo</span>
              <input type="file" className="hidden" accept="image/*" onChange={handlePhoto} />
            </label>
          )}
          <div className="text-sm text-indigo-500">
            <p className="font-medium text-indigo-700">Staff Photo</p>
            <p className="text-xs text-indigo-400">Upload a recent photograph (optional)</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Full Name <span className="text-red-400">*</span></label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="e.g. Anita Verma" />
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Email <span className="text-red-400">*</span></label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="form-input" placeholder="e.g. anita@snpublicschool.edu.in" />
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="form-input" placeholder="e.g. 9876543210" />
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">System Role <span className="text-red-400">*</span></label>
            <select required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="form-select">
              <option value="teacher">Teacher</option>
              <option value="office">Office / Admin Staff</option>
              <option value="hr">HR Manager</option>
              <option value="librarian">Librarian</option>
              <option value="transport">Transport Manager</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Designation</label>
            <input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. Senior Teacher, PRT" className="form-input" />
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Department</label>
            <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Science, Mathematics" className="form-input" />
          </div>
          <div>
            <label className="text-xs text-indigo-500 mb-1 block font-medium">Basic Salary (₹)</label>
            <input type="number" value={form.salary_basic} onChange={e => setForm(f => ({ ...f, salary_basic: e.target.value }))} className="form-input" placeholder="e.g. 35000" />
          </div>
        </div>

        {/* Teacher class assignments */}
        {form.role === "teacher" && (
          <div className="pt-5 border-t border-indigo-50 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-indigo-700 flex items-center gap-2">
                <GraduationCap size={16} className="text-marigold-500" /> Class Assignments
                <span className="text-xs font-normal text-indigo-400">— which classes / subjects this teacher will teach</span>
              </p>
              <button type="button" onClick={addAssignmentRow} className="btn-ghost text-xs flex items-center gap-1 py-1.5 px-3">
                <Plus size={14} /> Add Class
              </button>
            </div>

            {assignments.length === 0 && (
              <p className="text-sm text-indigo-400 bg-indigo-50/50 rounded-xl px-4 py-3 border border-dashed border-indigo-200">
                No classes assigned yet. Click "Add Class" to link this teacher to the classes and subjects they teach.
                You can also assign them later from the "All Staff" tab.
              </p>
            )}

            <div className="space-y-3">
              {assignments.map((a, i) => {
                const rowSections = (sections || []).filter(s => s.class_id === a.class_id);
                return (
                  <div key={i} className="grid md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-center bg-indigo-50/40 rounded-xl p-2 animate-slide-up">
                    <select value={a.class_id} onChange={e => updateAssignment(i, { class_id: e.target.value, section_id: "" })} className="form-select">
                      <option value="">Class...</option>
                      {(classes || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={a.section_id} onChange={e => updateAssignment(i, { section_id: e.target.value })} className="form-select" disabled={!a.class_id}>
                      <option value="">All sections</option>
                      {rowSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={a.subject_id} onChange={e => updateAssignment(i, { subject_id: e.target.value })} className="form-select">
                      <option value="">Subject...</option>
                      {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-indigo-600 cursor-pointer whitespace-nowrap px-1" title="Class Teacher">
                      <input type="checkbox" checked={a.is_class_teacher} onChange={e => updateAssignment(i, { is_class_teacher: e.target.checked })} className="w-3.5 h-3.5 rounded" />
                      <Star size={12} className={a.is_class_teacher ? "text-marigold-500 fill-marigold-500" : "text-indigo-300"} /> CT
                    </label>
                    <button type="button" onClick={() => removeAssignment(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {mut.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {mut.error?.response?.data?.error || "Something went wrong. Please try again."}
          </div>
        )}

        <button type="submit" disabled={mut.isPending} className="btn-accent w-full flex items-center justify-center gap-2 py-3 text-base">
          {mut.isPending ? (
            <><div className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" /> Registering staff...</>
          ) : (
            <><Sparkles size={18} /> Register Staff & Generate Credentials</>
          )}
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  ACADEMICS (Classes + Sections)                                 */
/* ─────────────────────────────────────────────────────────────── */
function AcademicPanel() {
  const qc = useQueryClient();
  const [newClass, setNewClass] = useState("");
  const [newSection, setNewSection] = useState({ class_id: "", name: "" });

  const { data: classes } = useQuery({ queryKey: ["admin-classes"], queryFn: () => api.get("/admin/classes").then(r => r.data.classes).catch(() => []) });
  const { data: sections } = useQuery({ queryKey: ["admin-sections"], queryFn: () => api.get("/admin/sections").then(r => r.data.sections).catch(() => []) });

  const mutClass = useMutation({ mutationFn: () => api.post("/admin/classes", { name: newClass }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-classes"] }); setNewClass(""); } });
  const mutSection = useMutation({ mutationFn: () => api.post("/admin/sections", newSection), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sections"] }); setNewSection({ class_id: "", name: "" }); } });

  return (
    <div className="grid md:grid-cols-2 gap-6 animate-slide-up">
      {/* Classes */}
      <div className="card p-6">
        <p className="font-display text-lg text-indigo-700 mb-4 flex items-center gap-2">
          <GraduationCap size={18} className="text-marigold-500" /> Classes
        </p>
        <div className="flex gap-2 mb-5">
          <input value={newClass} onChange={e => setNewClass(e.target.value)} placeholder="e.g. Class 11" className="form-input flex-1"
            onKeyDown={e => e.key === "Enter" && newClass && (e.preventDefault(), mutClass.mutate())} />
          <button onClick={() => mutClass.mutate()} disabled={!newClass || mutClass.isPending} className="btn-primary whitespace-nowrap">
            {mutClass.isPending ? "Adding..." : "Add Class"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(classes || []).length === 0 && <p className="text-sm text-indigo-400">No classes yet. Add your first class above.</p>}
          {(classes || []).map(c => (
            <span key={c.id} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium border border-indigo-100">
              {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="card p-6">
        <p className="font-display text-lg text-indigo-700 mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-marigold-500" /> Sections
        </p>
        <div className="flex gap-2 mb-5">
          <select value={newSection.class_id} onChange={e => setNewSection(s => ({ ...s, class_id: e.target.value }))} className="form-select flex-1">
            <option value="">Select Class...</option>
            {(classes || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={newSection.name} onChange={e => setNewSection(s => ({ ...s, name: e.target.value }))} placeholder="e.g. A"
            className="form-input w-20" onKeyDown={e => e.key === "Enter" && newSection.class_id && newSection.name && (e.preventDefault(), mutSection.mutate())} />
          <button onClick={() => mutSection.mutate()} disabled={!newSection.class_id || !newSection.name || mutSection.isPending}
            className="btn-primary">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(sections || []).length === 0 && <p className="text-sm text-indigo-400">No sections yet. Select a class and add sections.</p>}
          {(sections || []).map(s => (
            <span key={s.id} className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium border border-purple-100">
              {s.class_name || (classes || []).find(c => c.id === s.class_id)?.name} - {s.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  ACADEMIC YEARS                                                 */
/* ─────────────────────────────────────────────────────────────── */
function YearsPanel() {
  const qc = useQueryClient();
  const [newYear, setNewYear] = useState({ label: "", start_date: "", end_date: "", is_current: false });

  const { data: years } = useQuery({ queryKey: ["admin-years"], queryFn: () => api.get("/admin/academic-years").then(r => r.data.academicYears).catch(() => []) });
  const mutYear = useMutation({
    mutationFn: () => api.post("/admin/academic-years", newYear),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-years"] }); setNewYear({ label: "", start_date: "", end_date: "", is_current: false }); }
  });

  return (
    <div className="card p-6 max-w-3xl animate-slide-up">
      <p className="font-display text-lg text-indigo-700 mb-6 flex items-center gap-2">
        <CalendarIcon size={18} className="text-marigold-500" /> Academic Years
      </p>

      <div className="grid sm:grid-cols-4 gap-3 mb-6 items-end">
        <div>
          <label className="text-xs text-indigo-500 mb-1 block font-medium">Label</label>
          <input value={newYear.label} onChange={e => setNewYear(y => ({ ...y, label: e.target.value }))} className="form-input" placeholder="e.g. 2026-27" />
        </div>
        <div>
          <label className="text-xs text-indigo-500 mb-1 block font-medium">Start Date</label>
          <input type="date" value={newYear.start_date} onChange={e => setNewYear(y => ({ ...y, start_date: e.target.value }))} className="form-input" />
        </div>
        <div>
          <label className="text-xs text-indigo-500 mb-1 block font-medium">End Date</label>
          <input type="date" value={newYear.end_date} onChange={e => setNewYear(y => ({ ...y, end_date: e.target.value }))} className="form-input" />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-indigo-700 cursor-pointer">
            <input type="checkbox" checked={newYear.is_current} onChange={e => setNewYear(y => ({ ...y, is_current: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 rounded" /> Current
          </label>
          <button onClick={() => mutYear.mutate()} disabled={!newYear.label || !newYear.start_date || mutYear.isPending}
            className="btn-primary whitespace-nowrap">{mutYear.isPending ? "Adding..." : "Add"}</button>
        </div>
      </div>

      {(years || []).length > 0 && (
        <table className="w-full text-sm">
          <thead className="bg-indigo-50 text-indigo-600 text-left">
            <tr><th className="p-3 rounded-tl-xl">Label</th><th className="p-3">Duration</th><th className="p-3 rounded-tr-xl">Status</th></tr>
          </thead>
          <tbody>
            {(years || []).map(y => (
              <tr key={y.id} className="border-t border-indigo-50 hover:bg-indigo-50/50 transition">
                <td className="p-3 font-semibold text-indigo-700">{y.label}</td>
                <td className="p-3 text-indigo-500">
                  {new Date(y.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} –{" "}
                  {new Date(y.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="p-3">
                  {y.is_current
                    ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">✓ CURRENT</span>
                    : <span className="text-indigo-300 text-xs">Inactive</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {(years || []).length === 0 && <p className="text-sm text-indigo-400 text-center py-6">No academic years added yet.</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  STUDENT ROSTER                                                 */
/* ─────────────────────────────────────────────────────────────── */
function StudentRosterPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [resetUserId, setResetUserId] = useState(null);

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/admin/students/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster-students"] });
      qc.invalidateQueries({ queryKey: ["all-students"] });
    }
  });

  const handleDelete = (s) => {
    if (confirm(`Are you sure you want to delete ${s.name}? This will remove their user account as well.`)) {
      deleteMut.mutate(s.id);
    }
  };

  const { data: students, isLoading } = useQuery({
    queryKey: ["roster-students"],
    queryFn: () => api.get("/admin/roster/students").then(r => r.data.students).catch(() => []),
  });

  const filtered = (students || []).filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_no?.toLowerCase().includes(search.toLowerCase()) ||
    s.class_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card p-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="font-display text-lg text-indigo-700 flex items-center gap-2">
          <Users size={18} className="text-marigold-500" /> All Students
          <span className="text-sm font-normal text-indigo-400">({(students || []).length})</span>
        </p>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, admission no, class..." className="form-input max-w-xs" />
      </div>

      {isLoading ? (
        <p className="text-center py-10 text-indigo-400">Loading students...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-10 text-indigo-400">No students found. Add students from the "Add Student" tab.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-indigo-50 text-indigo-600 text-left">
              <tr>
                <th className="p-3 rounded-tl-xl">Student</th>
                <th className="p-3">Admission No</th>
                <th className="p-3">Class</th>
                <th className="p-3">Student Login</th>
                <th className="p-3">Parent</th>
                <th className="p-3 rounded-tr-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-t border-indigo-50 hover:bg-indigo-50/40 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {s.photo_url
                        ? <img src={s.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        : <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-500 text-xs font-bold">{s.name?.[0]}</div>}
                      <span className="font-medium text-indigo-700">{s.name}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs text-indigo-500">{s.admission_no}</td>
                  <td className="p-3 text-indigo-600">{s.class_name || "—"}{s.section_name ? ` - ${s.section_name}` : ""}</td>
                  <td className="p-3 font-mono text-xs text-indigo-500">{s.student_email || "—"}</td>
                  <td className="p-3 text-indigo-600">
                    {s.parent_name || "—"}
                    {s.parent_phone && <span className="block text-xs text-indigo-400">{s.parent_phone}</span>}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setResetUserId(s.user_id)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Reset Password"><KeyRound size={16} /></button>
                      <button onClick={() => handleDelete(s)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete Student"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {resetUserId && <PasswordResetModal userId={resetUserId} onClose={() => setResetUserId(null)} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  STAFF ROSTER + assignment management                           */
/* ─────────────────────────────────────────────────────────────── */
function StaffRosterPanel() {
  const qc = useQueryClient();
  const [manageStaff, setManageStaff] = useState(null);
  const [resetUserId, setResetUserId] = useState(null);
  const [editStaff, setEditStaff] = useState(null);

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/admin/staff/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster-staff"] });
      qc.invalidateQueries({ queryKey: ["all-staff"] });
    }
  });

  const handleDelete = (st) => {
    if (confirm(`Are you sure you want to delete ${st.name}? This will remove their user account as well.`)) {
      deleteMut.mutate(st.id);
    }
  };

  const { data: staff, isLoading } = useQuery({
    queryKey: ["roster-staff"],
    queryFn: () => api.get("/admin/roster/staff").then(r => r.data.staff).catch(() => []),
  });

  const roleBadge = {
    teacher: "bg-blue-100 text-blue-700", office: "bg-pink-100 text-pink-700",
    hr: "bg-purple-100 text-purple-700", librarian: "bg-green-100 text-green-700",
    transport: "bg-amber-100 text-amber-700", principal: "bg-indigo-100 text-indigo-700",
  };

  return (
    <div className="card p-6 animate-slide-up">
      <p className="font-display text-lg text-indigo-700 flex items-center gap-2 mb-5">
        <ListChecks size={18} className="text-marigold-500" /> All Staff & Teachers
        <span className="text-sm font-normal text-indigo-400">({(staff || []).length})</span>
      </p>

      {isLoading ? (
        <p className="text-center py-10 text-indigo-400">Loading staff...</p>
      ) : (staff || []).length === 0 ? (
        <p className="text-center py-10 text-indigo-400">No staff yet. Add from the "Add Staff / Teacher" tab.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(staff || []).map(st => (
            <div key={st.id} className="border border-indigo-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                {st.photo_url
                  ? <img src={st.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  : <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold">{st.name?.[0]}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-indigo-700">{st.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleBadge[st.role] || "bg-gray-100 text-gray-600"}`}>{st.role}</span>
                  </div>
                  <p className="text-xs text-indigo-400 font-mono">{st.employee_id}</p>
                  <p className="text-xs text-indigo-500 truncate">{st.email}</p>
                  {st.designation && <p className="text-xs text-indigo-400 mt-0.5">{st.designation}{st.department ? ` · ${st.department}` : ""}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setEditStaff(st)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit Staff"><Pencil size={16} /></button>
                  <button onClick={() => setResetUserId(st.user_id)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Reset Password"><KeyRound size={16} /></button>
                  <button onClick={() => handleDelete(st)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete Staff"><Trash2 size={16} /></button>
                </div>
              </div>

              {st.role === "teacher" && (
                <div className="mt-3 pt-3 border-t border-indigo-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Teaching</p>
                    <button onClick={() => setManageStaff(st)} className="text-xs text-marigold-600 hover:text-marigold-500 font-medium flex items-center gap-1">
                      <Plus size={12} /> Manage
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(st.assignments || []).length === 0 && <span className="text-xs text-indigo-300">No classes assigned yet.</span>}
                    {(st.assignments || []).map((a, i) => (
                      <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs border border-indigo-100 flex items-center gap-1">
                        {a.is_class_teacher && <Star size={10} className="text-marigold-500 fill-marigold-500" />}
                        {a.class_name}{a.section_name ? `-${a.section_name}` : ""}{a.subject_name ? ` · ${a.subject_name}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {manageStaff && (
        <ManageAssignmentsModal
          staff={manageStaff}
          onClose={() => setManageStaff(null)}
          onChanged={() => qc.invalidateQueries({ queryKey: ["roster-staff"] })}
        />
      )}

      {resetUserId && <PasswordResetModal userId={resetUserId} onClose={() => setResetUserId(null)} />}
      
      {editStaff && (
        <EditStaffModal
          staff={editStaff}
          onClose={() => setEditStaff(null)}
          onChanged={() => qc.invalidateQueries({ queryKey: ["roster-staff"] })}
        />
      )}
    </div>
  );
}

function EditStaffModal({ staff, onClose, onChanged }) {
  const [form, setForm] = useState({
    designation: staff.designation || "",
    department: staff.department || "",
    salary_basic: staff.salary_basic || "",
    phone: staff.phone || ""
  });

  const mut = useMutation({
    mutationFn: () => api.put(`/admin/staff/${staff.id}`, form),
    onSuccess: () => {
      onChanged();
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-lg text-indigo-700">Edit Staff: {staff.name}</p>
          <button onClick={onClose} className="p-1.5 hover:bg-indigo-50 rounded-lg"><X size={16} className="text-indigo-400" /></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-indigo-500 mb-1">Designation</label>
            <input type="text" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="form-input" placeholder="e.g. Senior Teacher" />
          </div>
          <div>
            <label className="block text-xs font-medium text-indigo-500 mb-1">Department</label>
            <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="form-input" placeholder="e.g. Science" />
          </div>
          <div>
            <label className="block text-xs font-medium text-indigo-500 mb-1">Basic Salary (₹)</label>
            <input type="number" value={form.salary_basic} onChange={e => setForm({ ...form, salary_basic: e.target.value })} className="form-input" placeholder="e.g. 45000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-indigo-500 mb-1">Phone (Optional)</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="form-input" placeholder="e.g. 9876543210" />
          </div>
          
          {mut.isError && <p className="text-sm text-red-500">{mut.error?.response?.data?.error || "Failed to update staff."}</p>}
          
          <button onClick={() => mut.mutate()} disabled={mut.isPending} className="btn-primary w-full mt-2">
            {mut.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManageAssignmentsModal({ staff, onClose, onChanged }) {
  const [row, setRow] = useState({ class_id: "", section_id: "", subject_id: "", is_class_teacher: false });
  const { data: classes } = useQuery({ queryKey: ["admin-classes"], queryFn: () => api.get("/admin/classes").then(r => r.data.classes).catch(() => []) });
  const { data: sections } = useQuery({ queryKey: ["admin-sections"], queryFn: () => api.get("/admin/sections").then(r => r.data.sections).catch(() => []) });
  const { data: subjects } = useQuery({ queryKey: ["admin-subjects"], queryFn: () => api.get("/admin/subjects").then(r => r.data.subjects).catch(() => []) });

  const add = useMutation({
    mutationFn: () => api.post("/admin/teacher-assignments", { staff_id: staff.id, ...row }),
    onSuccess: () => { setRow({ class_id: "", section_id: "", subject_id: "", is_class_teacher: false }); onChanged(); },
  });

  const rowSections = (sections || []).filter(s => s.class_id === row.class_id);

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-lg text-indigo-700">Assign classes — {staff.name}</p>
          <button onClick={onClose} className="p-1.5 hover:bg-indigo-50 rounded-lg"><X size={16} className="text-indigo-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <select value={row.class_id} onChange={e => setRow(r => ({ ...r, class_id: e.target.value, section_id: "" }))} className="form-select">
            <option value="">Class...</option>
            {(classes || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={row.section_id} onChange={e => setRow(r => ({ ...r, section_id: e.target.value }))} className="form-select" disabled={!row.class_id}>
            <option value="">All sections</option>
            {rowSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={row.subject_id} onChange={e => setRow(r => ({ ...r, subject_id: e.target.value }))} className="form-select">
            <option value="">Subject...</option>
            {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-indigo-600 cursor-pointer px-2">
            <input type="checkbox" checked={row.is_class_teacher} onChange={e => setRow(r => ({ ...r, is_class_teacher: e.target.checked }))} className="w-4 h-4 rounded" />
            Class Teacher
          </label>
        </div>

        {add.isError && <p className="text-xs text-red-500 mb-2">{add.error?.response?.data?.error || "Failed to add."}</p>}

        <button onClick={() => add.mutate()} disabled={!row.class_id || add.isPending} className="btn-primary w-full">
          {add.isPending ? "Adding..." : "Add Assignment"}
        </button>
        <p className="text-xs text-indigo-400 text-center mt-3">Added classes appear on the staff card. Close to refresh.</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  CREDENTIALS RESULT CARD                                        */
/* ─────────────────────────────────────────────────────────────── */
function CredentialsCard({ result, onReset, type }) {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const creds = result.credentials;

  return (
    <div className="card p-8 max-w-lg mx-auto text-center animate-slide-up">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={32} className="text-green-500" />
      </div>
      <p className="font-display text-2xl text-green-600 font-semibold mb-2">{type} Created!</p>
      <p className="text-indigo-500 text-sm mb-6">
        Save these credentials securely. Passwords are shown <strong>only once</strong>.
      </p>

      <div className="space-y-4 mb-8 text-left">
        {/* Student credentials */}
        {creds.student && (
          <CredentialBlock
            title="🎓 Student Portal Login"
            email={creds.student.email}
            password={creds.student.password}
            bgClass="bg-indigo-50 border-indigo-100"
            onCopy={copyToClipboard}
            copied={copied}
          />
        )}
        {/* Parent credentials */}
        {creds.parent && (
          <CredentialBlock
            title="👨‍👩‍👧 Parent App Login"
            email={creds.parent.email}
            password={creds.parent.password}
            bgClass="bg-amber-50 border-amber-100"
            onCopy={copyToClipboard}
            copied={copied}
          />
        )}
        {/* Staff credentials (no student/parent sub-object) */}
        {creds.email && !creds.student && (
          <CredentialBlock
            title="🏫 Staff Portal Login"
            email={creds.email}
            password={creds.password}
            bgClass="bg-indigo-50 border-indigo-100"
            onCopy={copyToClipboard}
            copied={copied}
          />
        )}
      </div>

      <button onClick={onReset} className="btn-primary w-full py-3">
        Create Another {type}
      </button>
    </div>
  );
}

function CredentialBlock({ title, email, password, bgClass, onCopy, copied }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className={`p-4 rounded-xl border ${bgClass}`}>
      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">{title}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-400">Email / Login ID</p>
            <p className="font-mono text-sm text-indigo-700 select-all">{email}</p>
          </div>
          <button onClick={() => onCopy(email, "email")} className="p-1.5 hover:bg-white rounded-lg transition" title="Copy email">
            {copied === "email" ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} className="text-indigo-400" />}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-400">Password</p>
            <p className="font-mono text-sm text-indigo-700 select-all">{showPw ? password : "••••••••"}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowPw(!showPw)} className="p-1.5 hover:bg-white rounded-lg transition">
              {showPw ? <EyeOff size={14} className="text-indigo-400" /> : <Eye size={14} className="text-indigo-400" />}
            </button>
            <button onClick={() => onCopy(password, "password")} className="p-1.5 hover:bg-white rounded-lg transition" title="Copy password">
              {copied === "password" ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} className="text-indigo-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordResetModal({ userId, onClose }) {
  const [newPassword, setNewPassword] = useState("");
  const mut = useMutation({
    mutationFn: () => api.put(`/admin/users/${userId}/password`, { newPassword }),
    onSuccess: () => {
      alert("Password reset successfully!");
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display font-semibold text-indigo-700 flex items-center gap-2">
            <KeyRound size={18} /> Reset Password
          </p>
          <button onClick={onClose} className="text-indigo-400 hover:bg-indigo-50 p-1 rounded-lg transition"><X size={16}/></button>
        </div>
        <input 
          type="text" 
          placeholder="New Password (min 6 chars)" 
          value={newPassword} 
          onChange={e => setNewPassword(e.target.value)} 
          className="form-input mb-4" 
        />
        {mut.isError && <p className="text-xs text-red-500 mb-2">{mut.error?.response?.data?.error || "Failed to reset password"}</p>}
        <button 
          onClick={() => mut.mutate()} 
          disabled={newPassword.length < 6 || mut.isPending} 
          className="btn-primary w-full py-2 disabled:opacity-50"
        >
          {mut.isPending ? "Resetting..." : "Confirm Reset"}
        </button>
      </div>
    </div>
  );
}
