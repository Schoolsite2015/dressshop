import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import {
  UserPlus, BookOpen, Calendar as CalendarIcon, Upload,
  CheckCircle2, ShieldAlert, Users, GraduationCap,
  Copy, Eye, EyeOff, X, Sparkles
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
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap
              ${tab === t.id
                ? "bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50"}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      <div className="animate-fade-in" key={tab}>
        {tab === "students" && <AddStudentPanel />}
        {tab === "staff" && <AddStaffPanel />}
        {tab === "academics" && <AcademicPanel />}
        {tab === "years" && <YearsPanel />}
      </div>
    </DashboardShell>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  ADD STUDENT                                                    */
/* ─────────────────────────────────────────────────────────────── */
function AddStudentPanel() {
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
  const init = { name: "", email: "", phone: "", role: "teacher", designation: "", department: "", salary_basic: "" };
  const [form, setForm] = useState(init);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  const mut = useMutation({
    mutationFn: (data) => api.post("/admin/staff", data, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data),
    onSuccess: (res) => {
      setResult(res);
      setForm(init);
      setPhoto(null);
      setPreview(null);
    }
  });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) { setPhoto(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (photo) fd.append("photo", photo);
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
