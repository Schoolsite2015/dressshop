import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { Bus, MapPin, Radio, Phone, User, Clock, ShieldCheck } from "lucide-react";

// Same demo corridor used by the driver simulator (Pindra ↔ Varanasi)
const BOUNDS = { minLng: 82.97, maxLng: 83.04, minLat: 25.31, maxLat: 25.34 };

export default function MyBus() {
  const [live, setLive] = useState(null);        // { lat, lng, at }
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  // Resolve ONLY this user's bus (student's own, or parent's child's).
  const { data, isLoading } = useQuery({
    queryKey: ["my-bus"],
    queryFn: () => api.get("/transport/my-bus").then(r => r.data),
  });
  const bus = data?.bus;

  // Subscribe to live location for THIS bus only.
  useEffect(() => {
    if (!bus?.id) return;
    let socket = null;
    import("socket.io-client").then(({ io }) => {
      socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000");
      socketRef.current = socket;
      socket.on("connect", () => {
        setConnected(true);
        socket.emit("bus:subscribe", bus.id);   // join only this bus's room
      });
      socket.on("disconnect", () => setConnected(false));
      socket.on("bus:location", (loc) => {
        if (loc.busId === bus.id) setLive({ lat: loc.lat, lng: loc.lng, at: loc.at });
      });
    }).catch(() => {});
    return () => { if (socket) socket.disconnect(); };
  }, [bus?.id]);

  // Seed the marker from the bus's last known DB position until a live ping arrives.
  const pos = live || (bus?.last_lat != null ? { lat: Number(bus.last_lat), lng: Number(bus.last_lng), at: bus.last_ping_at } : null);
  const x = pos ? 30 + ((pos.lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 350 : null;
  const y = pos ? 120 - ((pos.lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100 : null;

  return (
    <DashboardShell title="My Bus" subtitle="Live location of your school bus — visible only to you">
      {isLoading ? (
        <div className="card p-10 text-center text-indigo-400 animate-fade-in">Loading your bus details...</div>
      ) : !bus ? (
        <div className="card p-10 text-center animate-slide-up max-w-lg mx-auto">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bus size={28} className="text-indigo-300" />
          </div>
          <p className="font-display text-lg text-indigo-700 mb-1">No bus assigned</p>
          <p className="text-sm text-indigo-400">
            {data?.message || "You are not registered for school transport."} Please contact the school office to be assigned to a route.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5 animate-slide-up">
          {/* Live map */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-indigo-700 flex items-center gap-2">
                <MapPin size={16} className="text-marigold-500" /> Live Position
              </p>
              <span className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-green-600" : "text-indigo-300"}`}>
                <Radio size={12} className={connected ? "animate-pulse" : ""} />
                {connected ? "Live tracking on" : "Connecting..."}
              </span>
            </div>

            <div className="w-full bg-indigo-50 rounded-xl overflow-hidden relative">
              <svg viewBox="0 0 400 150" className="w-full h-56">
                <polyline points="30,120 100,100 170,80 250,70 320,65 380,60" fill="none" stroke="#C7CCF0" strokeWidth="3" strokeDasharray="6" />
                <circle cx={30} cy={120} r={5} fill="#6366F1" />
                <circle cx={380} cy={60} r={5} fill="#E8940F" />
                {x != null && (
                  <g style={{ transition: "all 1.8s ease" }} transform={`translate(${x},${y})`}>
                    <circle r={12} fill="#E8940F" opacity={0.25} className="animate-pulse" />
                    <circle r={7} fill="#E8940F" />
                    <text y={-14} textAnchor="middle" fontSize={12}>🚌</text>
                  </g>
                )}
                <text x={20} y={138} fontSize={10} fill="#8891C7">Pindra</text>
                <text x={340} y={52} fontSize={10} fill="#8891C7">School</text>
              </svg>
            </div>

            {pos ? (
              <p className="text-xs text-indigo-500 mt-3 flex items-center gap-2">
                <span className="text-green-600 font-medium">📍 {Number(pos.lat).toFixed(4)}, {Number(pos.lng).toFixed(4)}</span>
                {pos.at && <span className="flex items-center gap-1 text-indigo-400"><Clock size={11} /> updated {new Date(pos.at).toLocaleTimeString("en-IN")}</span>}
              </p>
            ) : (
              <p className="text-xs text-indigo-400 mt-3">Waiting for the bus to start sharing its location...</p>
            )}
          </div>

          {/* Bus + driver details */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-indigo-700 rounded-xl flex items-center justify-center">
                <Bus size={20} className="text-white" />
              </div>
              <div>
                <p className="font-display text-lg text-indigo-700 font-semibold">{bus.number_plate}</p>
                <p className="text-xs text-indigo-400">{bus.route_name || "Route"}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <Detail icon={User}  label="Driver" value={bus.driver_name || "—"} />
              <Detail icon={Phone} label="Driver phone" value={bus.driver_phone || "—"} />
              <Detail icon={MapPin} label="Your pickup point" value={bus.pickup_point || "—"} />
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <ShieldCheck size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700">Only you can see this bus. Other families see their own bus only.</p>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-indigo-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-indigo-400">{label}</p>
        <p className="text-indigo-700 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
