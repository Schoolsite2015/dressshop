import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { Printer, Plus, CheckCircle } from "lucide-react";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function HRPayroll() {
  const qc = useQueryClient();
  const [tab, setTab]   = useState("staff");
  const [month, setMonth] = useState(new Date().getMonth()+1);
  const [year, setYear]   = useState(new Date().getFullYear());
  const [payslip, setPayslip] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm]   = useState({ employeeId:"", name:"", designation:"", department:"", joiningDate:"", salaryBasic:"" });

  const { data: staff } = useQuery({
    queryKey: ["staff-list"],
    queryFn:  () => api.get("/hr/staff").then(r=>r.data.staff).catch(()=>[]),
  });
  const { data: payroll } = useQuery({
    queryKey: ["payroll", month, year],
    queryFn:  () => api.get(`/hr/payroll?month=${month}&year=${year}`).then(r=>r.data.payroll).catch(()=>[]),
  });

  const addStaffMut = useMutation({
    mutationFn: ()=>api.post("/hr/staff",form),
    onSuccess: ()=>{ qc.invalidateQueries(["staff-list"]); setAddOpen(false); },
  });
  const genPayrollMut = useMutation({
    mutationFn: ()=>Promise.all((staff||[]).map(s=>api.post("/hr/payroll",{
      staffId:s.id, month, year,
      basic:s.salary_basic||0, allowances:Math.round(s.salary_basic*0.2)||0, deductions:Math.round(s.salary_basic*0.1)||0,
    }))),
    onSuccess: ()=>qc.invalidateQueries(["payroll"]),
  });
  const markPaidMut = useMutation({
    mutationFn: (id)=>api.patch(`/hr/payroll/${id}/pay`),
    onSuccess: ()=>qc.invalidateQueries(["payroll"]),
  });

  return (
    <DashboardShell title="HR & Payroll" subtitle="Staff directory, attendance and payroll management">
      <div className="flex gap-2 mb-6">
        {["staff","payroll"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab===t?"bg-indigo-700 text-white":"bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab==="staff" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={()=>setAddOpen(o=>!o)} className="btn-accent flex items-center gap-2"><Plus size={14}/>Add Staff</button>
          </div>
          {addOpen && (
            <div className="card p-5 mb-4">
              <p className="font-display text-base text-indigo-700 mb-3">New Staff Member</p>
              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                {[["employeeId","Employee ID"],["name","Full Name"],["designation","Designation"],["department","Department"],["joiningDate","Joining Date"],["salaryBasic","Basic Salary (₹)"]].map(([f,l])=>(
                  <div key={f}>
                    <label className="text-xs text-indigo-500 mb-1 block">{l}</label>
                    <input value={form[f]} onChange={e=>setForm(d=>({...d,[f]:e.target.value}))}
                      className="form-input" type={f==="joiningDate"?"date":f==="salaryBasic"?"number":"text"}/>
                  </div>
                ))}
              </div>
              <button onClick={()=>addStaffMut.mutate()} disabled={!form.name||!form.employeeId} className="btn-accent">Save Staff</button>
            </div>
          )}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 text-indigo-600 text-left">
                <tr><th className="p-3">Employee ID</th><th className="p-3">Name</th><th className="p-3">Designation</th><th className="p-3">Department</th><th className="p-3">Joining Date</th><th className="p-3">Basic Salary</th></tr>
              </thead>
              <tbody>
                {(staff||[]).map(s=>(
                  <tr key={s.id} className="border-t border-indigo-50 hover:bg-paper transition">
                    <td className="p-3 font-mono text-xs text-indigo-400">{s.employee_id}</td>
                    <td className="p-3 font-medium text-indigo-700">{s.name}</td>
                    <td className="p-3 text-indigo-500">{s.designation||"—"}</td>
                    <td className="p-3 text-indigo-400">{s.department||"—"}</td>
                    <td className="p-3 text-xs">{s.joining_date?new Date(s.joining_date).toLocaleDateString("en-IN"):"—"}</td>
                    <td className="p-3">{s.salary_basic?`₹${Number(s.salary_basic).toLocaleString("en-IN")}`:"—"}</td>
                  </tr>
                ))}
                {!(staff||[]).length && <tr><td colSpan={6} className="p-8 text-center text-indigo-400">No staff records found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="payroll" && (
        <div>
          <div className="flex gap-3 mb-4 flex-wrap items-end">
            <div>
              <label className="text-xs text-indigo-500 mb-1 block">Month</label>
              <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="form-select w-32">
                {MONTH_NAMES.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-indigo-500 mb-1 block">Year</label>
              <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="form-input w-24"/>
            </div>
            <button onClick={()=>genPayrollMut.mutate()} disabled={genPayrollMut.isPending||(staff||[]).length===0} className="btn-primary">
              {genPayrollMut.isPending?"Generating...":"Generate Payroll"}
            </button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 text-indigo-600 text-left">
                <tr><th className="p-3">Staff Name</th><th className="p-3">Designation</th><th className="p-3">Basic</th><th className="p-3">Allowances</th><th className="p-3">Deductions</th><th className="p-3">Net Pay</th><th className="p-3">Status</th><th className="p-3">Pay Slip</th></tr>
              </thead>
              <tbody>
                {(payroll||[]).map(p=>(
                  <tr key={p.id} className="border-t border-indigo-50 hover:bg-paper transition">
                    <td className="p-3 font-medium text-indigo-700">{p.staff_name}</td>
                    <td className="p-3 text-indigo-400">{p.designation||"—"}</td>
                    <td className="p-3">₹{Number(p.basic).toLocaleString("en-IN")}</td>
                    <td className="p-3 text-green-600">+₹{Number(p.allowances).toLocaleString("en-IN")}</td>
                    <td className="p-3 text-red-500">−₹{Number(p.deductions).toLocaleString("en-IN")}</td>
                    <td className="p-3 font-semibold text-indigo-700">₹{Number(p.net_pay).toLocaleString("en-IN")}</td>
                    <td className="p-3">
                      {p.paid_on ? (
                        <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12}/>Paid</span>
                      ) : (
                        <button onClick={()=>markPaidMut.mutate(p.id)} className="text-xs text-indigo-600 hover:underline">Mark Paid</button>
                      )}
                    </td>
                    <td className="p-3">
                      <button onClick={()=>setPayslip(p)} className="text-indigo-500 hover:text-indigo-700 transition"><Printer size={14}/></button>
                    </td>
                  </tr>
                ))}
                {!(payroll||[]).length && <tr><td colSpan={8} className="p-8 text-center text-indigo-400">No payroll generated for this month yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {payslip && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl print:shadow-none">
            <div className="text-center mb-6">
              <p className="font-display text-xl text-indigo-700 font-semibold">St. S.N. Public School</p>
              <p className="text-xs text-indigo-400">Pindra, Varanasi</p>
              <p className="mt-2 font-semibold text-indigo-600">Pay Slip — {MONTH_NAMES[payslip.month-1]} {payslip.year}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-indigo-500">Employee</span><span className="font-medium">{payslip.staff_name}</span></div>
              <div className="flex justify-between"><span className="text-indigo-500">Designation</span><span>{payslip.designation||"—"}</span></div>
              <div className="border-t border-dashed my-3"/>
              <div className="flex justify-between"><span className="text-indigo-500">Basic Salary</span><span>₹{Number(payslip.basic).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between text-green-600"><span>Allowances</span><span>+₹{Number(payslip.allowances).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between text-red-500"><span>Deductions</span><span>−₹{Number(payslip.deductions).toLocaleString("en-IN")}</span></div>
              <div className="border-t my-2"/>
              <div className="flex justify-between font-semibold text-indigo-700 text-base"><span>Net Pay</span><span>₹{Number(payslip.net_pay).toLocaleString("en-IN")}</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>window.print()} className="btn-primary flex items-center gap-2"><Printer size={14}/>Print</button>
              <button onClick={()=>setPayslip(null)} className="btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
