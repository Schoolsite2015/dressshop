import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api.js";
import logoUrl from "../../assets/logo.png";
import { CheckCircle2, XCircle, Printer } from "lucide-react";

export default function VerifyCertificate() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["verify-cert", id],
    queryFn:  () => api.get(`/certificates/verify/${id}`).then(r=>r.data),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center text-indigo-400">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-marigold-500 rounded-full animate-spin mx-auto mb-3"/>
        <p>Verifying certificate…</p>
      </div>
    </div>
  );

  const cert = data?.certificate;

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <img src={logoUrl} alt="logo" className="w-16 h-16 object-contain mx-auto mb-2"/>
          <p className="font-display text-lg text-indigo-700">St. S.N. Public School</p>
          <p className="text-sm text-indigo-400">Certificate Verification Portal</p>
        </div>

        {data?.valid && cert ? (
          <div className="card p-8 text-center">
            <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4"/>
            <p className="font-display text-2xl text-green-600 font-semibold mb-1">Certificate Verified ✓</p>
            <p className="text-indigo-400 text-sm mb-6">This is an authentic certificate issued by St. S.N. Public School</p>
            <div className="space-y-3 text-left border border-indigo-100 rounded-xl p-5 bg-indigo-50 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-500">Student Name</span>
                <span className="font-semibold text-indigo-700">{cert.student_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-500">Admission No.</span>
                <span className="font-mono text-indigo-700">{cert.admission_no}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-500">Class</span>
                <span className="text-indigo-700">{cert.class_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-500">Certificate Type</span>
                <span className="text-indigo-700 capitalize">{cert.type?.replace("-"," ")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-500">Issued Date</span>
                <span className="text-indigo-700">{new Date(cert.issued_date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-500">Issued By</span>
                <span className="text-indigo-700">{cert.issued_by_name}</span>
              </div>
            </div>
            <button onClick={()=>window.print()} className="btn-primary flex items-center gap-2 mx-auto">
              <Printer size={14}/> Print Verification
            </button>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <XCircle size={56} className="text-red-400 mx-auto mb-4"/>
            <p className="font-display text-2xl text-red-600 font-semibold mb-2">Certificate Not Found</p>
            <p className="text-indigo-400 text-sm">The certificate ID provided is invalid or has not been issued by this institution.</p>
            <p className="mt-4 text-xs font-mono text-indigo-300 break-all">ID: {id}</p>
          </div>
        )}
      </div>
    </div>
  );
}
