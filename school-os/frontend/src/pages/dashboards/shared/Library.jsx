import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { Search, BookMarked, Plus, RotateCcw, AlertCircle, CheckCircle } from "lucide-react";

export default function Library() {
  const qc = useQueryClient();
  const [search, setSearch]     = useState("");
  const [tab, setTab]           = useState("catalog");
  const [addOpen, setAddOpen]   = useState(false);
  const [newBook, setNewBook]   = useState({ title:"", author:"", isbn:"", barcode:"", totalCopies:"1" });
  const [issueData, setIssueData] = useState({ bookId:"", studentId:"", dueDays:"14" });

  const { data: books } = useQuery({
    queryKey: ["library-books", search],
    queryFn:  () => api.get(`/library/books?search=${search}`).then(r=>r.data.books).catch(()=>[]),
  });
  const { data: issues } = useQuery({
    queryKey: ["library-issues"],
    queryFn:  () => api.get("/library/issues").then(r=>r.data.issues).catch(()=>[]),
  });
  const { data: students } = useQuery({
    queryKey: ["all-students"],
    queryFn:  () => api.get("/students").then(r=>r.data.students).catch(()=>[]),
  });

  const addMut = useMutation({
    mutationFn: () => api.post("/library/books", { ...newBook, totalCopies: Number(newBook.totalCopies) }),
    onSuccess: () => { qc.invalidateQueries(["library-books"]); setAddOpen(false); setNewBook({ title:"", author:"", isbn:"", barcode:"", totalCopies:"1" }); },
  });
  const issueMut = useMutation({
    mutationFn: () => api.post("/library/issue", issueData),
    onSuccess: () => { qc.invalidateQueries(["library-books","library-issues"]); setIssueData({ bookId:"", studentId:"", dueDays:"14" }); },
  });
  const returnMut = useMutation({
    mutationFn: (issueId) => api.post("/library/return", { issueId }),
    onSuccess: () => qc.invalidateQueries(["library-books","library-issues"]),
  });

  const available = (books||[]).filter(b => b.available_copies > 0).length;
  const overdue   = (issues||[]).filter(i => !i.return_date && new Date(i.due_date) < new Date()).length;

  return (
    <DashboardShell title="Library" subtitle="Book catalog, issue & return management">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { l:"Total Books",  v:(books||[]).length,   c:"text-indigo-700" },
          { l:"Available",    v:available,             c:"text-green-600" },
          { l:"Issued",       v:(issues||[]).filter(i=>!i.return_date).length, c:"text-amber-600" },
          { l:"Overdue",      v:overdue,               c:"text-red-600" },
        ].map(s=>(
          <div key={s.l} className="card p-4 text-center">
            <p className={`font-display text-2xl font-semibold ${s.c}`}>{s.v}</p>
            <p className="text-xs text-indigo-400 mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {["catalog","issues","issue-book"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab===t?"bg-indigo-700 text-white":"bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50"}`}>
            {t==="issue-book" ? "Issue a Book" : t}
          </button>
        ))}
      </div>

      {/* Catalog */}
      {tab==="catalog" && (
        <div>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search by title, author or barcode..."
                className="form-input pl-9" />
            </div>
            <button onClick={()=>setAddOpen(true)} className="btn-accent flex items-center gap-2">
              <Plus size={14} /> Add Book
            </button>
          </div>

          {addOpen && (
            <div className="card p-5 mb-4 border-marigold-400">
              <p className="font-display text-base text-indigo-700 mb-3">Add New Book</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                {[["title","Title*"],["author","Author"],["isbn","ISBN"],["barcode","Barcode"],["totalCopies","Copies"]].map(([f,l])=>(
                  <div key={f}>
                    <label className="text-xs text-indigo-500 mb-1 block">{l}</label>
                    <input value={newBook[f]} onChange={e=>setNewBook(b=>({...b,[f]:e.target.value}))}
                      className="form-input" type={f==="totalCopies"?"number":"text"} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>addMut.mutate()} disabled={!newBook.title||addMut.isPending} className="btn-accent">
                  {addMut.isPending?"Saving...":"Save Book"}
                </button>
                <button onClick={()=>setAddOpen(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 text-indigo-600 text-left">
                <tr><th className="p-3">Title</th><th className="p-3">Author</th><th className="p-3">Barcode</th><th className="p-3">Available</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {(books||[]).map(b=>(
                  <tr key={b.id} className="border-t border-indigo-50 hover:bg-paper transition">
                    <td className="p-3 font-medium text-indigo-700">{b.title}</td>
                    <td className="p-3 text-indigo-400">{b.author}</td>
                    <td className="p-3 text-xs font-mono">{b.barcode}</td>
                    <td className="p-3">{b.available_copies}/{b.total_copies}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.available_copies>0?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>
                        {b.available_copies>0?"Available":"All Issued"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!(books||[]).length && <tr><td colSpan={5} className="p-8 text-center text-indigo-400">No books in catalog yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues */}
      {tab==="issues" && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-indigo-50 text-indigo-600 text-left">
              <tr><th className="p-3">Book</th><th className="p-3">Student</th><th className="p-3">Issued</th><th className="p-3">Due</th><th className="p-3">Status</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {(issues||[]).map(i=>{
                const overdue = !i.return_date && new Date(i.due_date) < new Date();
                return (
                  <tr key={i.id} className="border-t border-indigo-50 hover:bg-paper transition">
                    <td className="p-3 font-medium text-indigo-700">{i.title}</td>
                    <td className="p-3 text-indigo-500">{i.student_name}</td>
                    <td className="p-3 text-xs">{new Date(i.issue_date).toLocaleDateString("en-IN")}</td>
                    <td className="p-3 text-xs">{new Date(i.due_date).toLocaleDateString("en-IN")}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${i.return_date?"bg-green-100 text-green-700":overdue?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>
                        {i.return_date?"Returned":overdue?"Overdue":"Issued"}
                      </span>
                      {i.fine>0 && <span className="ml-2 text-xs text-red-600">Fine: ₹{i.fine}</span>}
                    </td>
                    <td className="p-3">
                      {!i.return_date && (
                        <button onClick={()=>returnMut.mutate(i.id)}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition">
                          <RotateCcw size={12} /> Return
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!(issues||[]).length && <tr><td colSpan={6} className="p-8 text-center text-indigo-400">No issues recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Issue book form */}
      {tab==="issue-book" && (
        <div className="card p-6 max-w-lg">
          <p className="font-display text-lg text-indigo-700 mb-4">Issue a Book to Student</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-indigo-500 mb-1 block">Book</label>
              <select value={issueData.bookId} onChange={e=>setIssueData(d=>({...d,bookId:e.target.value}))} className="form-select">
                <option value="">Select book</option>
                {(books||[]).filter(b=>b.available_copies>0).map(b=>(
                  <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-indigo-500 mb-1 block">Student</label>
              <select value={issueData.studentId} onChange={e=>setIssueData(d=>({...d,studentId:e.target.value}))} className="form-select">
                <option value="">Select student</option>
                {(students||[]).map(s=>(<option key={s.id} value={s.id}>{s.name} — {s.class_name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-indigo-500 mb-1 block">Return in (days)</label>
              <input type="number" value={issueData.dueDays} onChange={e=>setIssueData(d=>({...d,dueDays:e.target.value}))} className="form-input w-32" />
            </div>
            <button onClick={()=>issueMut.mutate()} disabled={!issueData.bookId||!issueData.studentId||issueMut.isPending} className="btn-accent">
              {issueMut.isPending?"Issuing...":"Issue Book"}
            </button>
            {issueMut.isSuccess && <p className="text-green-600 text-sm flex items-center gap-1"><CheckCircle size={14}/>Book issued successfully.</p>}
            {issueMut.isError   && <p className="text-red-600 text-sm flex items-center gap-1"><AlertCircle size={14}/>{issueMut.error?.response?.data?.error}</p>}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
