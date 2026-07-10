import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";
import logoUrl from "../../../assets/logo.png";
import { Award, Printer, CheckCircle2, XCircle } from "lucide-react";

const CERT_TYPES = [
  { id:"bonafide",       label:"Bonafide Certificate",    desc:"For institutional/bank purposes" },
  { id:"transfer",       label:"Transfer Certificate",    desc:"School leaving document" },
  { id:"character",      label:"Character Certificate",   desc:"Good conduct verification" },
  { id:"participation",  label:"Participation Certificate", desc:"Events and competitions" },
  { id:"merit",          label:"Merit Certificate",       desc:"Academic excellence recognition" },
];

export default function Certificates() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const canIssue = ["principal","office","admin"].includes(user?.role);

  const [selType, setSelType]     = useState(null);
  const [selStudent, setSelStudent] = useState("");
  const [preview, setPreview]     = useState(null);
  const printRef = useRef();

  const { data: students } = useQuery({
    queryKey: ["all-students"],
    queryFn:  () => api.get("/students").then(r=>r.data.students).catch(()=>[]),
  });
  const { data: certs } = useQuery({
    queryKey: ["certificates"],
    queryFn:  () => api.get("/certificates").then(r=>r.data.certificates).catch(()=>[]),
  });

  const issueMut = useMutation({
    mutationFn: () => api.post("/certificates", { studentId: selStudent, type: selType }),
    onSuccess: (r) => { qc.invalidateQueries(["certificates"]); setPreview(r.data.certificate); },
  });

  function doPrint() { window.print(); }

  return (
    <DashboardShell title="Certificates" subtitle="Issue and manage student certificates">
      {canIssue && (
        <div className="card p-6 mb-6">
          <p className="font-display text-lg text-indigo-700 mb-4">Issue New Certificate</p>

          {/* Type selector */}
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            {CERT_TYPES.map(c=>(
              <div key={c.id}
                onClick={()=>setSelType(c.id)}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all text-center hover:shadow-md ${selType===c.id?"border-marigold-500 bg-marigold-50":"border-indigo-100 hover:border-indigo-300"}`}>
                <Award size={20} className={`mx-auto mb-2 ${selType===c.id?"text-marigold-500":"text-indigo-400"}`}/>
                <p className={`text-xs font-semibold leading-tight ${selType===c.id?"text-marigold-700":"text-indigo-600"}`}>{c.label}</p>
                <p className="text-xs text-indigo-400 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-48">
              <label className="text-xs text-indigo-500 mb-1 block">Select Student</label>
              <select value={selStudent} onChange={e=>setSelStudent(e.target.value)} className="form-select">
                <option value="">Choose student</option>
                {(students||[]).map(s=><option key={s.id} value={s.id}>{s.name} — {s.class_name} {s.section_name}</option>)}
              </select>
            </div>
            <button
              onClick={()=>issueMut.mutate()}
              disabled={!selType||!selStudent||issueMut.isPending}
              className="btn-accent flex items-center gap-2">
              <Award size={14}/> {issueMut.isPending?"Issuing...":"Issue Certificate"}
            </button>
          </div>
        </div>
      )}

      {/* Certificate Preview (print-ready) */}
      {preview && (
        <div className="card p-6 mb-6 border-marigold-400">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-lg text-green-600 flex items-center gap-2">
              <CheckCircle2 size={20}/> Certificate Issued!
            </p>
            <div className="flex gap-2">
              <button onClick={doPrint} className="btn-primary flex items-center gap-2 no-print">
                <Printer size={14}/> Print
              </button>
              <button onClick={()=>setPreview(null)} className="btn-ghost no-print">Close Preview</button>
            </div>
          </div>

          {/* Printable certificate */}
          <div ref={printRef} className="border-4 border-double border-indigo-700 rounded-2xl p-10 text-center max-w-2xl mx-auto print-full">
            <img src={logoUrl} alt="logo" className="w-20 h-20 object-contain mx-auto mb-3"/>
            <p className="font-display text-2xl text-indigo-700 font-semibold">St. S.N. Public School</p>
            <p className="text-indigo-400 text-sm">Pindra, Varanasi — 221209</p>
            <div className="mt-6 mb-6">
              <p className="inline-block bg-marigold-500 text-ink font-semibold px-6 py-2 rounded-full text-lg font-display">
                {CERT_TYPES.find(t=>t.id===preview.type)?.label || preview.type}
              </p>
            </div>
            <p className="text-indigo-600 text-lg leading-relaxed max-w-lg mx-auto">
              This is to certify that <strong className="text-indigo-800">{preview.student_name}</strong>{" "}
              (Admission No: {preview.admission_no}), student of{" "}
              <strong>{preview.class_name}</strong>, is a bonafide student of this institution.
            </p>
            <div className="mt-8 flex justify-between text-sm text-indigo-400">
              <div>
                <p>Date: {new Date(preview.issued_date).toLocaleDateString("en-IN")}</p>
                <p className="font-mono text-xs mt-1">Cert: {preview.qr_code?.split("|")[0]?.split("/").pop() || preview.id.slice(0,12)}</p>
              </div>
              <div className="text-right">
                <div className="border-t-2 border-ink w-36 mb-1"/>
                <p>Principal</p>
                <p className="text-xs">{preview.issued_by_name || "Principal"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-indigo-50">
          <p className="font-display text-indigo-700">Issued Certificates History</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-indigo-50 text-indigo-600 text-left">
            <tr><th className="p-3">Student</th><th className="p-3">Type</th><th className="p-3">Class</th><th className="p-3">Issued Date</th><th className="p-3">Verify Link</th></tr>
          </thead>
          <tbody>
            {(certs||[]).map(c=>(
              <tr key={c.id} className="border-t border-indigo-50 hover:bg-paper transition">
                <td className="p-3 font-medium text-indigo-700">{c.student_name}</td>
                <td className="p-3 capitalize text-indigo-500">{c.type?.replace("-"," ")}</td>
                <td className="p-3 text-indigo-400">{c.class_name}</td>
                <td className="p-3 text-xs">{new Date(c.issued_date).toLocaleDateString("en-IN")}</td>
                <td className="p-3">
                  <a href={`/verify-certificate/${c.id}`} target="_blank" rel="noreferrer"
                    className="text-xs text-marigold-600 hover:underline">Verify ↗</a>
                </td>
              </tr>
            ))}
            {!(certs||[]).length && <tr><td colSpan={5} className="p-8 text-center text-indigo-400">No certificates issued yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
