import { useEffect, useState, useRef } from 'react';
import api from '../../lib/shopApi';
import { useShopAuth } from '../../context/ShopAuthContext';
import { Trash2, DatabaseBackup, Building2, Upload, X, Check } from 'lucide-react';

export default function ShopAdmin() {
  const { school: activeSchool } = useShopAuth();
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'staff' });
  const [schoolForm, setSchoolForm] = useState({ name: '', address: '', phone: '', email: '', logoPath: '' });
  const [logoPreview, setLogoPreview] = useState('');
  const [msg, setMsg] = useState('');
  const [schoolMsg, setSchoolMsg] = useState('');
  const fileInputRef = useRef(null);

  function load() {
    api.get('/admin/users').then((r) => setUsers(r.data));
    api.get('/admin/schools').then((r) => setSchools(r.data));
  }

  useEffect(load, []);

  async function addUser() {
    setMsg('');
    if (!form.username || !form.password) return;
    try {
      await api.post('/admin/users', form);
      setForm({ username: '', password: '', role: 'staff' });
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to add user');
    }
  }

  async function deleteUser(id) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    await api.delete(`/admin/users/${id}`);
    load();
  }

  async function backupNow() {
    setMsg('Backing up…');
    try {
      const r = await api.post('/admin/backup');
      setMsg(`Backup saved: ${r.data.file}`);
    } catch {
      setMsg('Backup failed');
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result;
        const res = await api.post('/admin/upload-logo', { logo: base64Data });
        setSchoolForm((prev) => ({ ...prev, logoPath: res.data.url }));
        setLogoPreview(res.data.url);
        setSchoolMsg('');
      } catch {
        setSchoolMsg('Logo upload failed');
      }
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setSchoolForm((prev) => ({ ...prev, logoPath: '' }));
    setLogoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function addSchool() {
    setSchoolMsg('');
    if (!schoolForm.name) { setSchoolMsg('School name is required'); return; }
    try {
      await api.post('/admin/schools', schoolForm);
      setSchoolForm({ name: '', address: '', phone: '', email: '', logoPath: '' });
      setLogoPreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err) {
      setSchoolMsg(err.response?.data?.error || 'Failed to add school');
    }
  }

  async function switchSchool(id) {
    try {
      const res = await api.post(`/admin/schools/${id}/switch`);
      // Update the shop session with new token + school
      const { useAuthStore } = await import('../../store/authStore.js');
      const { data } = res;
      useAuthStore.getState().shopLogin(data.token, data.user, data.school);
      window.location.reload();
    } catch (err) {
      alert('Failed to switch school: ' + (err.response?.data?.error || err.message));
    }
  }

  async function deleteSchool(id, name) {
    const ok = window.confirm(
      `WARNING: Delete school "${name}"?\n\nThis will PERMANENTLY erase all stock, bills, customers, and users for this school. Irreversible!`
    );
    if (!ok) return;
    try {
      await api.delete(`/admin/schools/${id}`);
      load();
    } catch (err) {
      alert('Failed to delete school: ' + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div className="max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <h1 className="font-display text-2xl">Admin Panel</h1>

        {/* Schools */}
        <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
          <h2 className="font-medium mb-4 flex items-center gap-2">
            <Building2 className="text-black/50" size={20} /> School List
          </h2>
          <div className="space-y-4">
            {schools.map((s) => (
              <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between border border-black/5 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4 min-w-0">
                  {s.logo_path ? (
                    <img src={s.logo_path.startsWith('/logos') ? s.logo_path.replace('/logos', '/shop-logos') : s.logo_path} alt={s.name} className="w-12 h-12 rounded-full object-cover border bg-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-black/40">
                      <Building2 size={24} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs text-black/50 space-y-0.5 mt-0.5">
                      {s.address && <div>Address: {s.address}</div>}
                      {(s.phone || s.email) && (
                        <div>
                          {s.phone && <span className="mr-3">Phone: {s.phone}</span>}
                          {s.email && <span>Email: {s.email}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
                  {s.id === activeSchool?.id ? (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                      <Check size={12} /> Active School
                    </span>
                  ) : (
                    <>
                      <button onClick={() => switchSchool(s.id)}
                        className="px-3 py-1.5 rounded-md text-white text-xs font-medium hover:opacity-90 transition-opacity"
                        style={{ background: 'var(--color-navy)' }}>
                        Switch
                      </button>
                      <button onClick={() => deleteSchool(s.id, s.name)}
                        className="p-1.5 rounded-md border border-black/10 hover:bg-red-50 hover:border-red-200 text-red-600 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
          <h2 className="font-medium mb-3">Users (Active School)</h2>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-black/40 text-xs uppercase">
                <th className="pb-2">Username</th><th className="pb-2">Role</th><th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-black/5">
                  <td className="py-2.5">{u.username}</td>
                  <td className="py-2.5 capitalize">{u.role}</td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => deleteUser(u.id)}>
                      <Trash2 size={15} className="text-black/30 hover:text-[var(--color-maroon)] transition-colors" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="border border-black/10 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-maroon)]" />
            <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="border border-black/10 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-maroon)]" />
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="border border-black/10 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-maroon)]">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={addUser} className="mt-3 w-full py-2 rounded-md text-white text-sm font-medium hover:opacity-95 transition-opacity" style={{ background: 'var(--color-maroon)' }}>
            Add User
          </button>
          {msg && <p className="text-xs text-emerald-700 mt-2 break-all font-medium">{msg}</p>}
        </div>
      </div>

      <div className="space-y-6">
        {/* Add School */}
        <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
          <h2 className="font-medium mb-4">Add New School</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-black/50">School Name</label>
              <input value={schoolForm.name} onChange={(e) => setSchoolForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Doon School"
                className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-maroon)]" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-black/50">Address</label>
              <input value={schoolForm.address} onChange={(e) => setSchoolForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="e.g. Dehradun, Uttarakhand"
                className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-maroon)]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-black/50">Phone</label>
                <input value={schoolForm.phone} onChange={(e) => setSchoolForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91-..."
                  className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-maroon)]" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-black/50">Email</label>
                <input value={schoolForm.email} type="email" onChange={(e) => setSchoolForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="info@school.com"
                  className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-maroon)]" />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-black/50 block mb-1">School Logo</label>
              {logoPreview ? (
                <div className="border border-black/5 rounded-md p-3 flex items-center justify-between bg-black/[0.01]">
                  <div className="flex items-center gap-3">
                    <img src={logoPreview} alt="Preview" className="w-12 h-12 rounded-full object-cover border bg-white" />
                    <span className="text-xs text-black/40 truncate max-w-[120px]">Logo uploaded</span>
                  </div>
                  <button type="button" onClick={removeLogo} className="p-1 rounded-full hover:bg-black/5 text-black/60 hover:text-black transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-black/20 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-black/[0.01] transition-colors">
                  <Upload className="text-black/30 mb-2" size={20} />
                  <span className="text-xs font-medium text-black/60">Browse Image File</span>
                  <span className="text-[10px] text-black/30 mt-0.5">PNG, JPG or SVG</span>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </label>
              )}
            </div>
            {schoolMsg && <p className="text-xs text-red-600 font-medium">{schoolMsg}</p>}
            <button onClick={addSchool} className="w-full py-2.5 rounded-md text-white text-sm font-medium hover:opacity-95 transition-opacity" style={{ background: 'var(--color-maroon)' }}>
              Add School
            </button>
          </div>
        </div>

        {/* Backup */}
        <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Backup</h2>
            <button onClick={backupNow} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-white text-sm font-medium hover:opacity-90 transition-opacity" style={{ background: 'var(--color-navy)' }}>
              <DatabaseBackup size={15} /> Backup Now
            </button>
          </div>
          <p className="text-sm text-black/50">An automatic backup also runs every night at 2 AM.</p>
          {msg && <p className="text-xs text-emerald-700 mt-2 break-all font-medium">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
