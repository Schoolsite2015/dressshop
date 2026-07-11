import { useState, useEffect } from "react";
import DashboardShell from "../../components/DashboardShell.jsx";
import { Laptop, Smartphone, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../../lib/api.js";

export default function DeviceSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // In a real implementation this would fetch from /api/auth/sessions
      const res = await api.get("/auth/sessions");
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (id) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      setSessions(s => s.filter(x => x.id !== id));
    } catch (err) {
      console.error("Failed to revoke session", err);
    }
  };

  return (
    <DashboardShell title="Device Sessions" subtitle="Manage your active logins">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-6">
          <h2 className="text-lg font-bold text-indigo-900 mb-4">Active Devices</h2>
          <p className="text-sm text-indigo-400 mb-6">
            Review the devices currently logged into your account. If you don't recognize a device, revoke its access immediately.
          </p>

          <div className="space-y-4">
            {loading ? (
              <div className="h-20 bg-indigo-50/50 rounded-xl animate-pulse" />
            ) : sessions.length === 0 ? (
              <p className="text-center text-indigo-300 py-4">No active sessions found.</p>
            ) : (
              sessions.map((session, i) => {
                const isMobile = session.device_info?.toLowerCase().includes("iphone") || session.device_info?.toLowerCase().includes("android");
                
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-indigo-50 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100/50 text-indigo-600 rounded-xl">
                        {isMobile ? <Smartphone size={20} /> : <Laptop size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-900">{session.device_info || "Unknown Device"}</p>
                        <p className="text-xs text-indigo-400 mt-0.5">IP: {session.ip_address} • Last Active: {new Date(session.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeSession(session.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Revoke Access"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
