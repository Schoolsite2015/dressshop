import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";
import { Plus, Users, Bed } from "lucide-react";

export default function Hostel() {
  const { user } = useAuthStore();
  const qc       = useQueryClient();
  const canEdit  = ["principal","office","admin"].includes(user?.role);
  const [selRoom, setSelRoom]     = useState(null);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const [newRoom, setNewRoom]     = useState({ roomNo:"", capacity:"4" });
  const [allocData, setAllocData] = useState({ roomId:"", studentId:"" });

  const { data: rooms } = useQuery({
    queryKey: ["hostel-rooms"],
    queryFn:  () => api.get("/hostel/rooms").then(r=>r.data.rooms).catch(()=>[]),
  });
  const { data: allocs } = useQuery({
    queryKey: ["hostel-allocs", selRoom],
    queryFn:  () => api.get(`/hostel/allocations${selRoom?`?roomId=${selRoom}`:""}`).then(r=>r.data.allocations).catch(()=>[]),
  });
  const { data: students } = useQuery({
    queryKey: ["all-students"],
    queryFn:  () => api.get("/students").then(r=>r.data.students).catch(()=>[]),
  });

  const totalBeds   = (rooms||[]).reduce((s,r)=>s+Number(r.capacity),0);
  const totalOccupied = (rooms||[]).reduce((s,r)=>s+Number(r.occupied),0);

  const addRoomMut = useMutation({
    mutationFn: ()=>api.post("/hostel/rooms",{roomNo:newRoom.roomNo,capacity:Number(newRoom.capacity)}),
    onSuccess: ()=>{ qc.invalidateQueries(["hostel-rooms"]); setAddRoomOpen(false); setNewRoom({roomNo:"",capacity:"4"}); },
  });
  const allocMut = useMutation({
    mutationFn: ()=>api.post("/hostel/allocations",{roomId:allocData.roomId,studentId:allocData.studentId}),
    onSuccess: ()=>{ qc.invalidateQueries(["hostel-rooms","hostel-allocs"]); setAllocOpen(false); },
  });
  const deallocMut = useMutation({
    mutationFn: (id)=>api.delete(`/hostel/allocations/${id}`),
    onSuccess: ()=>qc.invalidateQueries(["hostel-rooms","hostel-allocs"]),
  });

  return (
    <DashboardShell title="Hostel" subtitle="Room management and student allocations">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { l:"Total Rooms",  v:(rooms||[]).length },
          { l:"Total Beds",   v:totalBeds },
          { l:"Occupied",     v:totalOccupied },
          { l:"Vacant",       v:totalBeds-totalOccupied },
        ].map(s=>(
          <div key={s.l} className="card p-4 text-center">
            <p className="font-display text-2xl font-semibold text-indigo-700">{s.v}</p>
            <p className="text-xs text-indigo-400 mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {canEdit && (
          <>
            <button onClick={()=>setAddRoomOpen(o=>!o)} className="btn-accent flex items-center gap-2">
              <Plus size={14}/> Add Room
            </button>
            <button onClick={()=>setAllocOpen(o=>!o)} className="btn-primary flex items-center gap-2">
              <Users size={14}/> Allocate Student
            </button>
          </>
        )}
      </div>

      {addRoomOpen && (
        <div className="card p-5 mb-4 max-w-sm">
          <p className="font-display text-base text-indigo-700 mb-3">Add New Room</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs text-indigo-500 mb-1 block">Room No.</label>
              <input value={newRoom.roomNo} onChange={e=>setNewRoom(r=>({...r,roomNo:e.target.value}))} className="form-input" /></div>
            <div><label className="text-xs text-indigo-500 mb-1 block">Capacity</label>
              <input type="number" value={newRoom.capacity} onChange={e=>setNewRoom(r=>({...r,capacity:e.target.value}))} className="form-input" /></div>
          </div>
          <button onClick={()=>addRoomMut.mutate()} disabled={!newRoom.roomNo} className="btn-accent">Save</button>
        </div>
      )}
      {allocOpen && (
        <div className="card p-5 mb-4 max-w-sm">
          <p className="font-display text-base text-indigo-700 mb-3">Allocate Student to Room</p>
          <div className="space-y-3 mb-3">
            <select value={allocData.roomId} onChange={e=>setAllocData(d=>({...d,roomId:e.target.value}))} className="form-select">
              <option value="">Select room</option>
              {(rooms||[]).map(r=><option key={r.id} value={r.id}>{r.room_no} ({r.occupied}/{r.capacity} occupied)</option>)}
            </select>
            <select value={allocData.studentId} onChange={e=>setAllocData(d=>({...d,studentId:e.target.value}))} className="form-select">
              <option value="">Select student</option>
              {(students||[]).map(s=><option key={s.id} value={s.id}>{s.name} — {s.class_name}</option>)}
            </select>
          </div>
          <button onClick={()=>allocMut.mutate()} disabled={!allocData.roomId||!allocData.studentId} className="btn-primary">Allocate</button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(rooms||[]).map(r=>{
          const pct = Math.round((Number(r.occupied)/r.capacity)*100);
          return (
            <div key={r.id}
              onClick={()=>setSelRoom(selRoom===r.id?null:r.id)}
              className={`card p-5 cursor-pointer hover:shadow-md transition-all ${selRoom===r.id?"border-marigold-400 border-2":""}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-xl text-indigo-700 font-semibold">Room {r.room_no}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pct>=100?"bg-red-100 text-red-600":pct>=75?"bg-amber-100 text-amber-700":"bg-green-100 text-green-700"}`}>
                  {pct}% full
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-500 mb-3">
                <Bed size={14}/> {r.occupied}/{r.capacity} beds occupied
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${pct>=100?"bg-red-500":pct>=75?"bg-amber-500":"bg-green-500"}`}
                  style={{width:`${pct}%`}} />
              </div>
            </div>
          );
        })}
        {!(rooms||[]).length && (
          <div className="col-span-3 text-center py-12 text-indigo-400">No rooms added yet.</div>
        )}
      </div>

      {selRoom && (
        <div className="mt-6 card p-5">
          <p className="font-display text-indigo-700 mb-3">
            Occupants of Room {(rooms||[]).find(r=>r.id===selRoom)?.room_no}
          </p>
          {(allocs||[]).filter(a=>a.room_id===selRoom).length === 0 && (
            <p className="text-sm text-indigo-400">No students allocated to this room.</p>
          )}
          <div className="space-y-2">
            {(allocs||[]).filter(a=>a.room_id===selRoom).map(a=>(
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-paper">
                <div>
                  <p className="font-medium text-sm text-indigo-700">{a.student_name}</p>
                  <p className="text-xs text-indigo-400">{a.admission_no}</p>
                </div>
                {canEdit && (
                  <button onClick={()=>deallocMut.mutate(a.id)} className="text-xs text-red-400 hover:text-red-600 transition">Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
