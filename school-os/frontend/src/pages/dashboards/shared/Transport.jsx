import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { Bus, Radio, MapPin } from "lucide-react";
import { useAuthStore } from "../../../store/authStore.js";

// Pindra → Varanasi route (mock GPS coordinates)
const PINDRA_VARANASI = [
  { lat: 25.3176, lng: 82.9739 }, { lat: 25.3200, lng: 82.9800 },
  { lat: 25.3250, lng: 82.9900 }, { lat: 25.3300, lng: 83.0000 },
  { lat: 25.3320, lng: 83.0100 }, { lat: 25.3350, lng: 83.0200 },
  { lat: 25.3380, lng: 83.0300 }, { lat: 25.3400, lng: 83.0400 },
  { lat: 25.3350, lng: 82.9739 },
];

export default function Transport() {
  const { user }   = useAuthStore();
  const qc         = useQueryClient();
  const [tab, setTab] = useState("routes");
  const [busLocs, setBusLocs] = useState({});
  const [simRunning, setSimRunning] = useState(false);
  const simRef = useRef(null);
  const isPrincipal = ["principal","admin","transport"].includes(user?.role);

  const { data: buses } = useQuery({
    queryKey: ["buses"],
    queryFn:  () => api.get("/transport/buses").then(r=>r.data.buses).catch(()=>[]),
  });
  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn:  () => api.get("/transport/routes").then(r=>r.data.routes).catch(()=>[]),
  });

  // Try to connect Socket.IO for live updates
  useEffect(() => {
    let io = null;
    try {
      import("socket.io-client").then(({ io: socketIO }) => {
        io = socketIO("http://localhost:4000");
        (buses||[]).forEach(b => io.emit("bus:subscribe", b.id));
        io.on("bus:location", ({ busId, lat, lng }) => {
          setBusLocs(prev => ({ ...prev, [busId]: { lat, lng, at: Date.now() } }));
        });
      }).catch(() => {});
    } catch {}
    return () => { if (io) io.disconnect(); };
  }, [buses]);

  function startSimulation() {
    setSimRunning(true);
    let step = 0;
    const firstBus = (buses||[])[0];
    if (!firstBus) return;
    simRef.current = setInterval(async () => {
      const coord = PINDRA_VARANASI[step % PINDRA_VARANASI.length];
      try {
        await api.post(`/transport/buses/${firstBus.id}/location`, { lat: coord.lat, lng: coord.lng });
        setBusLocs(prev => ({ ...prev, [firstBus.id]: { ...coord, at: Date.now() } }));
      } catch {}
      step++;
    }, 2000);
  }
  function stopSimulation() {
    clearInterval(simRef.current);
    setSimRunning(false);
  }

  return (
    <DashboardShell title="Transport" subtitle="Live bus tracking and route management">
      <div className="flex gap-2 mb-6">
        {["routes","buses","tracker"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab===t?"bg-indigo-700 text-white":"bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50"}`}>
            {t==="tracker"?"Live Tracker":t}
          </button>
        ))}
      </div>

      {/* Routes */}
      {tab==="routes" && (
        <div className="card overflow-hidden">
          <div className="p-4 bg-indigo-50 border-b border-indigo-100">
            <p className="font-semibold text-indigo-700 text-sm">{(routes||[]).length} active routes</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-white border-b border-indigo-50 text-indigo-500 text-left">
              <tr><th className="p-3">Route Name</th></tr>
            </thead>
            <tbody>
              {(routes||[]).map(r=>(
                <tr key={r.id} className="border-t border-indigo-50 hover:bg-paper transition">
                  <td className="p-3 flex items-center gap-2"><MapPin size={14} className="text-marigold-500"/>{r.name}</td>
                </tr>
              ))}
              {!(routes||[]).length && <tr><td className="p-8 text-center text-indigo-400">No routes configured yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Buses */}
      {tab==="buses" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(buses||[]).map(b=>(
            <div key={b.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-700 rounded-xl flex items-center justify-center">
                  <Bus size={18} className="text-white" />
                </div>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
              </div>
              <p className="font-display text-lg text-indigo-700 font-semibold">{b.number_plate}</p>
              <p className="text-sm text-indigo-400 mt-0.5">{b.route_name}</p>
              <div className="mt-3 pt-3 border-t border-indigo-50 text-xs text-indigo-400 space-y-1">
                <p>Driver: <span className="text-ink">{b.driver_name || "—"}</span></p>
                <p>Phone:  <span className="text-ink">{b.driver_phone || "—"}</span></p>
                {busLocs[b.id] && (
                  <p className="text-green-600">
                    📍 {busLocs[b.id].lat.toFixed(4)}, {busLocs[b.id].lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          ))}
          {!(buses||[]).length && (
            <div className="col-span-3 text-center py-12 text-indigo-400">No buses registered yet.</div>
          )}
        </div>
      )}

      {/* Tracker + Simulator */}
      {tab==="tracker" && (
        <div className="space-y-4">
          {/* Mock map */}
          <div className="card p-5">
            <p className="font-display text-indigo-700 mb-3">Live Bus Positions — Pindra ↔ Varanasi</p>
            <div className="w-full h-48 bg-indigo-50 rounded-xl flex items-center justify-center relative overflow-hidden">
              {/* Simple SVG route map */}
              <svg viewBox="0 0 400 150" className="w-full h-full">
                <polyline points="30,120 100,100 170,80 250,70 320,65 380,60" fill="none" stroke="#D6DAF0" strokeWidth="3" strokeDasharray="6"/>
                {Object.entries(busLocs).map(([busId, loc], i) => {
                  const x = 30 + ((loc.lng - 82.97) / (83.04 - 82.97)) * 350;
                  const y = 120 - ((loc.lat - 25.31) / (25.34 - 25.31)) * 100;
                  return (
                    <g key={busId}>
                      <circle cx={x} cy={y} r={10} fill="#E8940F" opacity={0.3} className="animate-pulse"/>
                      <circle cx={x} cy={y} r={6} fill="#E8940F"/>
                      <text x={x} y={y-14} textAnchor="middle" fontSize={9} fill="#1C2340">🚌</text>
                    </g>
                  );
                })}
                <text x={30} y={138} fontSize={10} fill="#8891C7">Pindra</text>
                <text x={340} y={55} fontSize={10} fill="#8891C7">Varanasi</text>
              </svg>
            </div>
            {Object.keys(busLocs).length === 0 && (
              <p className="text-xs text-indigo-400 text-center mt-2">No live data. Use the Driver Simulator below to test.</p>
            )}
          </div>

          {/* Driver Simulator (admin only) */}
          {isPrincipal && (
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-indigo-700">Driver GPS Simulator</p>
                  <p className="text-xs text-indigo-400 mt-0.5">Simulate bus movement along the Pindra–Varanasi route</p>
                </div>
                <div className="flex items-center gap-3">
                  {simRunning && (
                    <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <Radio size={12} className="animate-pulse" /> Broadcasting live...
                    </span>
                  )}
                  <button
                    onClick={simRunning ? stopSimulation : startSimulation}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${simRunning?"bg-red-100 text-red-600 hover:bg-red-200":"bg-marigold-500 text-ink hover:bg-marigold-400"}`}>
                    {simRunning ? "Stop Simulation" : "Start Simulation"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
