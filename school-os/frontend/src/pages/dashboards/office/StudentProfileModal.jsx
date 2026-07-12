import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, User, Edit2, Save, MapPin, Phone, CreditCard, Droplet } from "lucide-react";
import { api } from "../../../lib/api.js";

export default function StudentProfileModal({ student, onClose }) {
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: student.name || "",
    dob: student.dob ? student.dob.split("T")[0] : "",
    gender: student.gender || "",
    blood_group: student.blood_group || "",
    mother_name: student.mother_name || "",
    aadhar_no: student.aadhar_no || "",
    address: student.address || "",
    status: student.status || "active",
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data) => api.put(`/students/${student.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-students"] });
      setIsEditing(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-indigo-50 flex justify-between items-center bg-indigo-50/30">
          <h2 className="font-display font-semibold text-lg text-indigo-900">
            {isEditing ? "Edit Student Profile" : "Student Profile"}
          </h2>
          <button onClick={onClose} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {!isEditing ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-3xl font-display font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-ink">{student.name}</h1>
                    <p className="text-indigo-500 font-medium">{student.admission_no} • {student.class_name} {student.section_name}</p>
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                      student.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                >
                  <Edit2 size={16} /> Edit
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <InfoCard icon={<User size={16} />} label="Mother's Name" value={student.mother_name || "N/A"} />
                <InfoCard icon={<CreditCard size={16} />} label="Aadhar No." value={student.aadhar_no || "N/A"} />
                <InfoCard icon={<Phone size={16} />} label="Contact / Parent" value={student.phone || "N/A"} />
                <InfoCard icon={<Droplet size={16} />} label="Blood Group" value={student.blood_group || "N/A"} />
                <div className="sm:col-span-2">
                  <InfoCard icon={<MapPin size={16} />} label="Address" value={student.address || "N/A"} />
                </div>
              </div>

              {student.qr_code && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">QR Code Identifier</p>
                    <p className="text-xs text-indigo-500 font-mono mt-1">{student.qr_code}</p>
                  </div>
                  <div className="w-16 h-16 bg-white border border-indigo-100 rounded flex items-center justify-center shadow-sm">
                    {/* Placeholder for actual QR render, we just show a QR icon or text */}
                    <span className="text-[10px] text-center text-indigo-300 font-medium">QR</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name"><input required value={form.name} onChange={update("name")} className="input" /></Field>
                <Field label="Date of Birth"><input type="date" value={form.dob} onChange={update("dob")} className="input" /></Field>
                <Field label="Gender">
                  <select value={form.gender} onChange={update("gender")} className="input">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field label="Blood Group"><input value={form.blood_group} onChange={update("blood_group")} className="input" /></Field>
                <Field label="Mother's Name"><input value={form.mother_name} onChange={update("mother_name")} className="input" /></Field>
                <Field label="Aadhar No. (12 digits)"><input maxLength={12} value={form.aadhar_no} onChange={update("aadhar_no")} className="input" /></Field>
                <Field label="Status">
                  <select required value={form.status} onChange={update("status")} className="input">
                    <option value="active">Active</option>
                    <option value="left">Left</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </Field>
              </div>
              <Field label="Address">
                <textarea rows={2} value={form.address} onChange={update("address")} className="input" />
              </Field>

              <div className="flex justify-end gap-3 pt-4 border-t border-indigo-50">
                <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm font-semibold text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={mutation.isPending} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  <Save size={16} /> {mutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <style>{`
        .input { width: 100%; border: 1px solid #D6DAF0; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; background: #fff; }
        .input:focus { outline: 2px solid #6366f1; outline-offset: -1px; border-color: transparent; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-indigo-900 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="bg-indigo-50/30 border border-indigo-50 rounded-xl p-3 flex items-start gap-3">
      <div className="text-indigo-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-medium text-indigo-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-ink break-words">{value}</p>
      </div>
    </div>
  );
}
