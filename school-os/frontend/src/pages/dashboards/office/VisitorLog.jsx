import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, UserMinus, Plus, Search, Clock, MapPin, SearchX, Camera as CameraIcon } from "lucide-react";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";

export default function VisitorLog() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "", purpose: "", whomToMeet: "", photoBase64: "" });

  const handleTakePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      setPhotoPreview(`data:image/jpeg;base64,${image.base64String}`);
      setFormData({ ...formData, photoBase64: image.base64String });
    } catch (e) {
      console.log("Camera closed", e);
    }
  };

  const { data: visitors, isLoading } = useQuery({
    queryKey: ["visitors"],
    queryFn: () => api.get("/visitors").then(r => r.data.visitors),
  });

  const checkInMutation = useMutation({
    mutationFn: (data) => api.post("/visitors/check-in", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["visitors"]);
      setShowForm(false);
      setPhotoPreview(null);
      setFormData({ name: "", phone: "", purpose: "", whomToMeet: "", photoBase64: "" });
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: (id) => api.put(`/visitors/${id}/check-out`),
    onSuccess: () => {
      queryClient.invalidateQueries(["visitors"]);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    checkInMutation.mutate(formData);
  };

  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-indigo-900">Visitor Log</h1>
          <p className="text-sm text-indigo-600 mt-1">Manage school campus visitors</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition">
          <Plus size={18} /> New Check-in
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50 mb-6">
          <h2 className="text-lg font-bold text-indigo-900 mb-4">Check-in New Visitor</h2>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
              <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Purpose of Visit</label>
              <input required type="text" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Whom to Meet (Optional)</label>
              <input type="text" value={formData.whomToMeet} onChange={e => setFormData({...formData, whomToMeet: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-600 mb-2">Visitor Photo (Optional)</label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Visitor" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    <UserCheck size={24} />
                  </div>
                )}
                <button type="button" onClick={handleTakePhoto} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition">
                  <CameraIcon size={16} /> Take Native Photo
                </button>
              </div>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={checkInMutation.isPending} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                {checkInMutation.isPending ? "Checking in..." : "Check-in"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading visitor logs...</div>
        ) : (visitors || []).length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <SearchX size={48} className="mx-auto mb-4 opacity-50" />
            <p>No visitors logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-indigo-50/50 text-indigo-900 border-b border-indigo-50">
                  <th className="p-4 font-semibold">Visitor</th>
                  <th className="p-4 font-semibold">Purpose</th>
                  <th className="p-4 font-semibold">Whom to Meet</th>
                  <th className="p-4 font-semibold">Time In</th>
                  <th className="p-4 font-semibold">Time Out</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visitors.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{v.name}</p>
                      <p className="text-xs text-gray-500">{v.phone}</p>
                    </td>
                    <td className="p-4 text-gray-600">{v.purpose}</td>
                    <td className="p-4 text-gray-600">{v.whom_to_meet || "-"}</td>
                    <td className="p-4 text-gray-500">
                      {new Date(v.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="p-4 text-gray-500">
                      {v.check_out_time ? new Date(v.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-"}
                    </td>
                    <td className="p-4">
                      {v.status === 'checked_in' ? (
                        <button 
                          onClick={() => checkOutMutation.mutate(v.id)}
                          disabled={checkOutMutation.isPending}
                          className="text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-100 transition"
                        >
                          Check Out
                        </button>
                      ) : (
                        <span className="text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-medium">
                          Checked Out
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
