import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";
import { Plus, Calendar, MapPin, Star } from "lucide-react";

export default function Events() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const canEdit = ["principal","office","admin"].includes(user?.role);
  const [form, setForm] = useState(null);

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn:  () => api.get("/events").then(r=>r.data.events).catch(()=>[]),
  });

  const addMut = useMutation({
    mutationFn: ()=>api.post("/events", form),
    onSuccess: ()=>{ qc.invalidateQueries(["events"]); setForm(null); },
  });
  const delMut = useMutation({
    mutationFn: (id)=>api.delete(`/events/${id}`),
    onSuccess: ()=>qc.invalidateQueries(["events"]),
  });

  const upcoming = (events||[]).filter(e=>new Date(e.event_date)>=new Date()).slice(0,10);
  const past     = (events||[]).filter(e=>new Date(e.event_date)<new Date());

  function EventCard({ e }) {
    const dt = new Date(e.event_date);
    return (
      <div className="card p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 bg-indigo-700 rounded-xl flex flex-col items-center justify-center text-white leading-none">
            <span className="text-lg font-bold">{dt.getDate()}</span>
            <span className="text-xs opacity-75">{dt.toLocaleString("en-IN",{month:"short"})}</span>
          </div>
          <Star size={14} className="text-marigold-500 mt-1"/>
        </div>
        <p className="font-display text-base text-indigo-700 font-semibold mb-1">{e.title}</p>
        {e.venue && <p className="flex items-center gap-1 text-xs text-indigo-400 mb-2"><MapPin size={12}/>{e.venue}</p>}
        {e.description && <p className="text-sm text-indigo-500 line-clamp-2">{e.description}</p>}
        {canEdit && (
          <button onClick={()=>delMut.mutate(e.id)} className="mt-3 text-xs text-red-400 hover:text-red-600 transition">Delete event</button>
        )}
      </div>
    );
  }

  return (
    <DashboardShell title="Events" subtitle="School events and activities">
      {canEdit && (
        <div className="flex justify-end mb-5">
          <button onClick={()=>setForm({title:"",description:"",eventDate:"",venue:""})} className="btn-accent flex items-center gap-2">
            <Plus size={14}/> Create Event
          </button>
        </div>
      )}

      {form && (
        <div className="card p-5 mb-6">
          <p className="font-display text-lg text-indigo-700 mb-4">New Event</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div className="sm:col-span-2"><label className="text-xs text-indigo-500 mb-1 block">Title *</label>
              <input value={form.title} onChange={e=>setForm(d=>({...d,title:e.target.value}))} className="form-input"/></div>
            <div><label className="text-xs text-indigo-500 mb-1 block">Date *</label>
              <input type="date" value={form.eventDate} onChange={e=>setForm(d=>({...d,eventDate:e.target.value}))} className="form-input"/></div>
            <div><label className="text-xs text-indigo-500 mb-1 block">Venue</label>
              <input value={form.venue} onChange={e=>setForm(d=>({...d,venue:e.target.value}))} className="form-input" placeholder="School Auditorium"/></div>
            <div className="sm:col-span-2"><label className="text-xs text-indigo-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e=>setForm(d=>({...d,description:e.target.value}))} rows={3} className="form-input resize-none"/></div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>addMut.mutate()} disabled={!form.title||!form.eventDate} className="btn-accent">Create Event</button>
            <button onClick={()=>setForm(null)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-8">
          <p className="font-display text-xl text-indigo-700 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-marigold-500"/> Upcoming Events
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map(e=><EventCard key={e.id} e={e}/>)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="font-display text-xl text-indigo-400 mb-4">Past Events</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
            {past.slice(0,6).map(e=><EventCard key={e.id} e={e}/>)}
          </div>
        </div>
      )}

      {!(events||[]).length && (
        <div className="text-center py-16 text-indigo-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30"/>
          <p>No events scheduled yet.</p>
          {canEdit && <p className="text-sm mt-1">Click "Create Event" to add the first event.</p>}
        </div>
      )}
    </DashboardShell>
  );
}
