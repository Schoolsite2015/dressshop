import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { Lightbulb, Printer, Loader2, Clock, CheckSquare } from "lucide-react";

const CLASSES  = ["Nursery","KG","Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];
const SUBJECTS = ["Hindi","English","Mathematics","Science","Social Science","Sanskrit","Computer Science","Physical Education","Art & Craft","General Knowledge"];
const DURATIONS = [1,2,3,4,5,6];

export default function LessonPlanner() {
  const [form, setForm] = useState({
    classLevel:"Class 8", subject:"Science", chapter:"", duration:2,
    objectives:"", difficulty:"Standard",
  });
  const [plan, setPlan] = useState(null);

  const genMut = useMutation({
    mutationFn: () => api.post("/ai/lesson-plan", form).then(r=>r.data.plan),
    onSuccess: (p) => setPlan(p),
  });

  const E5_LABELS = {
    engage:    { label:"Engage",    color:"bg-purple-100 text-purple-700",   desc:"Hook & activate prior knowledge" },
    explore:   { label:"Explore",   color:"bg-blue-100 text-blue-700",       desc:"Investigation & discovery" },
    explain:   { label:"Explain",   color:"bg-indigo-100 text-indigo-700",   desc:"Direct instruction & clarity" },
    elaborate: { label:"Elaborate", color:"bg-teal-100 text-teal-700",       desc:"Application & extension" },
    evaluate:  { label:"Evaluate",  color:"bg-marigold-400/30 text-marigold-700", desc:"Assessment & feedback" },
  };

  return (
    <DashboardShell title="AI Lesson Planner" subtitle="Generate detailed lesson plans powered by AI">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-20">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb size={20} className="text-marigold-500"/>
              <p className="font-display text-lg text-indigo-700">Plan Details</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-indigo-500 mb-1 block">Class</label>
                <select value={form.classLevel} onChange={e=>setForm(f=>({...f,classLevel:e.target.value}))} className="form-select">
                  {CLASSES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-indigo-500 mb-1 block">Subject</label>
                <select value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} className="form-select">
                  {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-indigo-500 mb-1 block">Chapter / Topic *</label>
                <input value={form.chapter} onChange={e=>setForm(f=>({...f,chapter:e.target.value}))}
                  className="form-input" placeholder="e.g. Photosynthesis"/>
              </div>
              <div>
                <label className="text-xs text-indigo-500 mb-1 block">Duration (periods)</label>
                <div className="flex gap-2 flex-wrap">
                  {DURATIONS.map(d=>(
                    <button key={d} type="button" onClick={()=>setForm(f=>({...f,duration:d}))}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${form.duration===d?"bg-indigo-700 text-white":"bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}>
                      {d}P
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-indigo-500 mb-1 block">Difficulty</label>
                <div className="flex gap-2">
                  {["Introductory","Standard","Advanced"].map(d=>(
                    <button key={d} type="button" onClick={()=>setForm(f=>({...f,difficulty:d}))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex-1 ${form.difficulty===d?"bg-indigo-700 text-white":"bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-indigo-500 mb-1 block">Learning Objectives</label>
                <textarea value={form.objectives} onChange={e=>setForm(f=>({...f,objectives:e.target.value}))}
                  className="form-input resize-none" rows={3} placeholder="Optional: enter specific objectives (one per line)"/>
              </div>
              <button onClick={()=>genMut.mutate()} disabled={!form.chapter||genMut.isPending}
                className="btn-accent w-full flex items-center justify-center gap-2 py-3">
                {genMut.isPending ? <><Loader2 size={16} className="animate-spin"/>Generating plan...</> : <><Lightbulb size={16}/>Generate Lesson Plan</>}
              </button>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-3">
          {!plan && !genMut.isPending && (
            <div className="card p-12 text-center text-indigo-400 h-64 flex flex-col items-center justify-center gap-3">
              <Lightbulb size={40} className="opacity-30"/>
              <p>Fill in the form and click Generate to create your lesson plan</p>
            </div>
          )}

          {plan && (
            <div className="space-y-4">
              <div className="flex justify-end no-print">
                <button onClick={()=>window.print()} className="btn-ghost flex items-center gap-2"><Printer size={14}/>Print Plan</button>
              </div>

              {/* Objectives */}
              <div className="card p-5">
                <p className="font-display text-indigo-700 font-semibold mb-3 flex items-center gap-2">
                  <CheckSquare size={16} className="text-green-500"/> Learning Objectives
                </p>
                <ul className="space-y-2">
                  {(plan.objectives||[]).map((o,i)=>(
                    <li key={i} className="flex items-start gap-2 text-sm text-indigo-600">
                      <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 5E Teaching Plan */}
              <div className="card p-5">
                <p className="font-display text-indigo-700 font-semibold mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-indigo-500"/> 5E Teaching Model
                </p>
                <div className="space-y-3">
                  {Object.entries(plan.teachingPlan||{}).map(([k,v])=>{
                    const info = E5_LABELS[k];
                    return (
                      <div key={k} className="flex gap-3">
                        <div className="flex-shrink-0 w-20 text-right">
                          <span className="text-xs text-indigo-400">{v.time} min</span>
                        </div>
                        <div className="flex-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1 ${info?.color||""}`}>
                            {info?.label||k}
                          </span>
                          <p className="text-sm text-indigo-600">{v.activity}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activities */}
              {(plan.activities||[]).length > 0 && (
                <div className="card p-5">
                  <p className="font-display text-indigo-700 font-semibold mb-3">Classroom Activities</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {plan.activities.map((a,i)=>(
                      <div key={i} className="bg-indigo-50 rounded-xl p-4">
                        <p className="font-semibold text-indigo-700 text-sm mb-1">{a.title}</p>
                        <p className="text-xs text-indigo-500 mb-2">{a.description}</p>
                        <p className="text-xs text-indigo-400">Materials: {a.materials} · {a.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Homework */}
              {plan.homework && (
                <div className="card p-5 bg-amber-50 border-amber-200">
                  <p className="font-display text-amber-700 font-semibold mb-2">📚 Homework Assignment</p>
                  <p className="text-sm text-amber-800">{plan.homework}</p>
                </div>
              )}

              {/* Quiz */}
              {(plan.quiz||[]).length > 0 && (
                <div className="card p-5">
                  <p className="font-display text-indigo-700 font-semibold mb-3">Exit Quiz (5 Questions)</p>
                  <div className="space-y-4">
                    {plan.quiz.map((q,i)=>(
                      <div key={i}>
                        <p className="text-sm font-medium text-indigo-700">Q{i+1}. {q.q}</p>
                        <p className="text-xs text-indigo-400 mt-1 pl-5">✓ {q.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PPT Outline */}
              {(plan.pptOutline||[]).length > 0 && (
                <div className="card p-5">
                  <p className="font-display text-indigo-700 font-semibold mb-3">📊 Presentation Outline</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {plan.pptOutline.map((s,i)=>(
                      <div key={i} className="bg-indigo-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-indigo-500 mb-1">Slide {s.slide}</p>
                        <p className="text-sm font-medium text-indigo-700 mb-2">{s.title}</p>
                        <ul className="space-y-0.5">
                          {(s.bullets||[]).map((b,j)=><li key={j} className="text-xs text-indigo-500">• {b}</li>)}
                        </ul>
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
