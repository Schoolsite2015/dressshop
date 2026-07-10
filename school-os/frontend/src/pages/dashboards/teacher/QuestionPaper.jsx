import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import logoUrl from "../../../assets/logo.png";
import { FileText, Printer, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const CLASSES  = ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];
const SUBJECTS = ["Mathematics","Science","Physics","Chemistry","Biology","English","Hindi","Social Science","History","Geography","Computer Science","Sanskrit","Economics"];
const BOARDS   = ["CBSE","ICSE","UP Board","State Board"];
const MARKS    = [20,40,60,80,100];
const DURATIONS = ["1 Hour","2 Hours","3 Hours","3.5 Hours"];

export default function QuestionPaper() {
  const [form, setForm] = useState({
    classLevel:"Class 10", subject:"Science", board:"CBSE",
    difficulty:"medium", totalMarks:80, duration:"3 Hours", syllabus:"",
  });
  const [paper, setPaper] = useState(null);
  const [showKey, setShowKey] = useState(false);

  const genMut = useMutation({
    mutationFn: ()=>api.post("/ai/question-paper", form).then(r=>r.data.paper),
    onSuccess: (p)=>setPaper(p),
  });

  return (
    <DashboardShell title="AI Question Paper Generator" subtitle="Generate exam papers with answer keys and blueprints">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Config form */}
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-20">
            <div className="flex items-center gap-2 mb-5">
              <FileText size={20} className="text-marigold-500"/>
              <p className="font-display text-lg text-indigo-700">Paper Configuration</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-indigo-500 mb-1 block">Class</label>
                  <select value={form.classLevel} onChange={e=>setForm(f=>({...f,classLevel:e.target.value}))} className="form-select">
                    {CLASSES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-indigo-500 mb-1 block">Board</label>
                  <select value={form.board} onChange={e=>setForm(f=>({...f,board:e.target.value}))} className="form-select">
                    {BOARDS.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-indigo-500 mb-1 block">Subject</label>
                <select value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} className="form-select">
                  {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-indigo-500 mb-1 block">Syllabus / Topics</label>
                <textarea value={form.syllabus} onChange={e=>setForm(f=>({...f,syllabus:e.target.value}))}
                  className="form-input resize-none" rows={3} placeholder="Chapter 1 & 2: Life Processes, Chapter 3: Control..."/>
              </div>
              <div>
                <label className="text-xs text-indigo-500 mb-1 block">Difficulty</label>
                <div className="flex gap-2">
                  {["easy","medium","hard"].map(d=>(
                    <button key={d} onClick={()=>setForm(f=>({...f,difficulty:d}))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition ${form.difficulty===d?"bg-indigo-700 text-white":"bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-indigo-500 mb-1 block">Total Marks</label>
                  <select value={form.totalMarks} onChange={e=>setForm(f=>({...f,totalMarks:Number(e.target.value)}))} className="form-select">
                    {MARKS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-indigo-500 mb-1 block">Duration</label>
                  <select value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} className="form-select">
                    {DURATIONS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={()=>genMut.mutate()} disabled={genMut.isPending}
                className="btn-accent w-full flex items-center justify-center gap-2 py-3">
                {genMut.isPending?<><Loader2 size={16} className="animate-spin"/>Generating...</>:<><FileText size={16}/>Generate Paper</>}
              </button>
            </div>
          </div>
        </div>

        {/* Paper output */}
        <div className="lg:col-span-3">
          {!paper && !genMut.isPending && (
            <div className="card p-12 text-center text-indigo-400 h-64 flex flex-col items-center justify-center gap-3">
              <FileText size={40} className="opacity-30"/>
              <p>Configure and generate your question paper</p>
            </div>
          )}
          {genMut.isPending && (
            <div className="card p-12 text-center text-indigo-400 h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 size={40} className="animate-spin text-marigold-500"/>
              <p>AI is generating your question paper…</p>
              <p className="text-xs">This may take a few seconds</p>
            </div>
          )}

          {paper && (
            <div className="space-y-4">
              <div className="flex justify-between no-print">
                <button onClick={()=>setShowKey(!showKey)} className="btn-ghost flex items-center gap-2">
                  {showKey?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                  {showKey?"Hide":"Show"} Answer Key
                </button>
                <button onClick={()=>window.print()} className="btn-primary flex items-center gap-2"><Printer size={14}/>Print Paper</button>
              </div>

              {/* Official header */}
              <div className="card p-6 text-center print-full">
                <div className="flex items-center justify-between mb-4">
                  <img src={logoUrl} alt="logo" className="w-14 h-14 object-contain"/>
                  <div className="flex-1">
                    <p className="font-display text-xl text-indigo-700 font-semibold">St. S.N. Public School, Pindra, Varanasi</p>
                    <p className="text-indigo-400 text-sm">{paper.meta?.board} Affiliated · CBSE Code: XXXXXX</p>
                  </div>
                </div>
                <div className="border border-indigo-200 rounded-xl p-3">
                  <p className="font-display text-lg font-semibold text-ink">
                    {form.subject.toUpperCase()} — {form.classLevel}
                  </p>
                  <div className="flex justify-between text-sm text-indigo-500 mt-2">
                    <span>Board: {paper.meta?.board}</span>
                    <span>Total Marks: {paper.meta?.totalMarks}</span>
                    <span>Time: {paper.meta?.duration || form.duration}</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-indigo-400 text-left space-y-0.5">
                  <p>• All questions are compulsory unless specified.</p>
                  <p>• Section A: {paper.meta?.sectionA} marks | Section B: {paper.meta?.sectionB} marks | Section C: {paper.meta?.sectionC} marks</p>
                </div>
              </div>

              {/* Section A */}
              {(paper.sectionA||[]).length > 0 && (
                <div className="card p-6">
                  <p className="font-display text-indigo-700 font-semibold text-lg mb-4">
                    Section A — Multiple Choice Questions <span className="text-sm font-normal text-indigo-400">({paper.meta?.sectionA} marks, 1 mark each)</span>
                  </p>
                  <div className="space-y-5">
                    {paper.sectionA.map((q,i)=>(
                      <div key={i}>
                        <p className="text-sm text-ink font-medium mb-2">{q.no}. {q.question}</p>
                        <div className="grid grid-cols-2 gap-1 pl-4">
                          {(q.options||[]).map((o,j)=><p key={j} className="text-sm text-indigo-600">{o}</p>)}
                        </div>
                        {showKey && <p className="text-xs text-green-600 mt-1 pl-4">Answer: {q.answer}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section B */}
              {(paper.sectionB||[]).length > 0 && (
                <div className="card p-6">
                  <p className="font-display text-indigo-700 font-semibold text-lg mb-4">
                    Section B — Short Answer <span className="text-sm font-normal text-indigo-400">({paper.meta?.sectionB} marks, 3 marks each)</span>
                  </p>
                  <div className="space-y-5">
                    {paper.sectionB.map((q,i)=>(
                      <div key={i} className="border-l-2 border-indigo-100 pl-4">
                        <p className="text-sm text-ink font-medium">{q.no}. {q.question}</p>
                        <p className="text-xs text-indigo-400 mt-0.5">[{q.marks} marks]</p>
                        {showKey && <p className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded">{q.answer}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section C */}
              {(paper.sectionC||[]).length > 0 && (
                <div className="card p-6">
                  <p className="font-display text-indigo-700 font-semibold text-lg mb-4">
                    Section C — Long Answer <span className="text-sm font-normal text-indigo-400">({paper.meta?.sectionC} marks, 5 marks each)</span>
                  </p>
                  <div className="space-y-5">
                    {paper.sectionC.map((q,i)=>(
                      <div key={i} className="border-l-4 border-marigold-400 pl-4">
                        <p className="text-sm text-ink font-medium">{q.no}. {q.question}</p>
                        <p className="text-xs text-indigo-400 mt-0.5">[{q.marks} marks]</p>
                        {showKey && <p className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded">{q.answer}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blueprint */}
              {(paper.blueprint||[]).length > 0 && (
                <div className="card p-6">
                  <p className="font-display text-indigo-700 font-semibold mb-3">Question Paper Blueprint</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-indigo-100 rounded-xl overflow-hidden">
                      <thead className="bg-indigo-50 text-indigo-600">
                        <tr>
                          <th className="p-2 text-left">Topic</th>
                          <th className="p-2">Knowledge</th>
                          <th className="p-2">Understanding</th>
                          <th className="p-2">Application</th>
                          <th className="p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paper.blueprint.map((r,i)=>(
                          <tr key={i} className="border-t border-indigo-50">
                            <td className="p-2">{r.topic}</td>
                            <td className="p-2 text-center">{r.knowledge}</td>
                            <td className="p-2 text-center">{r.understanding}</td>
                            <td className="p-2 text-center">{r.application}</td>
                            <td className="p-2 text-center font-semibold text-indigo-700">{r.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bloom's taxonomy */}
              {paper.bloom && (
                <div className="card p-5">
                  <p className="font-display text-indigo-700 font-semibold mb-3">Bloom's Taxonomy Distribution</p>
                  <div className="space-y-2">
                    {Object.entries(paper.bloom).map(([k,v])=>(
                      <div key={k} className="flex items-center gap-3">
                        <span className="text-xs text-indigo-500 w-28 capitalize">{k}</span>
                        <div className="flex-1 bg-indigo-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-indigo-700" style={{width:`${Math.round((v/paper.meta?.totalMarks)*100)}%`}}/>
                        </div>
                        <span className="text-xs font-medium text-indigo-600 w-12 text-right">{v} marks</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
