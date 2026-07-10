import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { Plus, Search, AlertTriangle, Edit2, Trash2 } from "lucide-react";

const CATEGORIES = ["all","lab","computers","sports","uniform","stationery","furniture"];

export default function Inventory() {
  const qc       = useQueryClient();
  const [cat, setCat]       = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm]     = useState(null); // null=closed, {new} or {existing}
  const [deleting, setDeleting] = useState(null);

  const { data: items } = useQuery({
    queryKey: ["inventory", cat],
    queryFn:  () => api.get(`/inventory${cat!=="all"?`?category=${cat}`:""}`).then(r=>r.data.items).catch(()=>[]),
  });

  const filtered = (items||[]).filter(i=>i.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = (items||[]).filter(i=>Number(i.quantity)<10).length;

  const saveMut = useMutation({
    mutationFn: (data) => form?.id
      ? api.patch(`/inventory/${form.id}`, data)
      : api.post("/inventory", data),
    onSuccess: () => { qc.invalidateQueries(["inventory"]); setForm(null); },
  });
  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/inventory/${id}`),
    onSuccess: () => { qc.invalidateQueries(["inventory"]); setDeleting(null); },
  });
  const qtyMut = useMutation({
    mutationFn: ({ id, qty }) => api.patch(`/inventory/${id}`, { quantity: qty }),
    onSuccess: () => qc.invalidateQueries(["inventory"]),
  });

  return (
    <DashboardShell title="Inventory" subtitle="Track all school assets and supplies">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {CATEGORIES.map(c=>(
          <button key={c} onClick={()=>setCat(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${cat===c?"bg-indigo-700 text-white":"bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50"}`}>
            {c}
          </button>
        ))}
        {lowStock > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
            <AlertTriangle size={12}/> {lowStock} item(s) low stock
          </span>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items..." className="form-input pl-9"/>
        </div>
        <button onClick={()=>setForm({name:"",category:cat==="all"?"stationery":cat,quantity:"",unit:"pcs"})} className="btn-accent flex items-center gap-2">
          <Plus size={14}/> Add Item
        </button>
      </div>

      {form && (
        <div className="card p-5 mb-4">
          <p className="font-display text-base text-indigo-700 mb-3">{form.id?"Edit":"Add"} Item</p>
          <div className="grid sm:grid-cols-4 gap-3 mb-3">
            {[["name","Item Name"],["category","Category"],["quantity","Quantity"],["unit","Unit"]].map(([f,l])=>(
              <div key={f}>
                <label className="text-xs text-indigo-500 mb-1 block">{l}</label>
                {f==="category"?(
                  <select value={form[f]||""} onChange={e=>setForm(d=>({...d,[f]:e.target.value}))} className="form-select">
                    {CATEGORIES.filter(c=>c!=="all").map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                ):(
                  <input value={form[f]||""} onChange={e=>setForm(d=>({...d,[f]:e.target.value}))}
                    className="form-input" type={f==="quantity"?"number":"text"}/>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={()=>saveMut.mutate({name:form.name,category:form.category,quantity:Number(form.quantity),unit:form.unit})}
              disabled={!form.name||saveMut.isPending} className="btn-accent">{saveMut.isPending?"Saving...":"Save"}</button>
            <button onClick={()=>setForm(null)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-indigo-50 text-indigo-600 text-left">
            <tr>
              <th className="p-3">Item</th><th className="p-3">Category</th>
              <th className="p-3">Quantity</th><th className="p-3">Unit</th>
              <th className="p-3">Status</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item=>{
              const low = Number(item.quantity) < 10;
              return (
                <tr key={item.id} className="border-t border-indigo-50 hover:bg-paper transition">
                  <td className="p-3 font-medium text-indigo-700">{item.name}</td>
                  <td className="p-3 capitalize text-indigo-400">{item.category}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={()=>qtyMut.mutate({id:item.id,qty:Math.max(0,Number(item.quantity)-1)})}
                        className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center text-sm">−</button>
                      <span className={`font-semibold w-8 text-center ${low?"text-red-600":""}`}>{item.quantity}</span>
                      <button onClick={()=>qtyMut.mutate({id:item.id,qty:Number(item.quantity)+1})}
                        className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center text-sm">+</button>
                    </div>
                  </td>
                  <td className="p-3 text-indigo-400">{item.unit}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${low?"bg-red-100 text-red-600":"bg-green-100 text-green-700"}`}>
                      {low?"Low Stock":"In Stock"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={()=>setForm(item)} className="text-indigo-400 hover:text-indigo-700 transition"><Edit2 size={13}/></button>
                      <button onClick={()=>setDeleting(item.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={6} className="p-8 text-center text-indigo-400">No items found.</td></tr>}
          </tbody>
        </table>
      </div>

      {deleting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="font-display text-lg text-indigo-700 mb-2">Delete item?</p>
            <p className="text-sm text-indigo-400 mb-4">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={()=>delMut.mutate(deleting)} className="btn-primary bg-red-600 hover:bg-red-500">Delete</button>
              <button onClick={()=>setDeleting(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
