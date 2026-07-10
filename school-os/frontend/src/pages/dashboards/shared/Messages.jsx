import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";
import { Send, MessageCircle } from "lucide-react";

export default function Messages() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeConv, setActiveConv] = useState(null);
  const [msgText, setMsgText]       = useState("");
  const [contacts, setContacts]     = useState([]);
  const [newToId, setNewToId]       = useState("");
  const bottomRef = useRef();

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn:  () => api.get("/messages/conversations").then(r=>r.data.conversations).catch(()=>[]),
    refetchInterval: 5000,
  });
  const { data: thread } = useQuery({
    queryKey: ["thread", activeConv],
    queryFn:  () => api.get(`/messages/thread/${activeConv}`).then(r=>r.data.messages).catch(()=>[]),
    enabled: !!activeConv,
    refetchInterval: 3000,
  });

  useEffect(()=>{
    api.get("/messages/contacts").then(r=>setContacts(r.data.contacts||[])).catch(()=>{});
  },[]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  },[thread]);

  const sendMut = useMutation({
    mutationFn: ()=>api.post("/messages", { recipientId: activeConv || newToId, body: msgText }),
    onSuccess: ()=>{
      qc.invalidateQueries(["thread","conversations"]);
      if (!activeConv && newToId) setActiveConv(newToId);
      setMsgText("");
    },
  });

  const activeContact = contacts.find(c=>c.id===activeConv) ||
    (conversations||[]).find(c=>c.other_user===activeConv);

  return (
    <DashboardShell title="Messages" subtitle="Communicate with teachers, parents and staff">
      <div className="flex gap-4 h-[70vh]">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 card flex flex-col">
          <div className="p-3 border-b border-indigo-50">
            <p className="font-display text-sm text-indigo-700 mb-2">New Message</p>
            <select value={newToId} onChange={e=>{setNewToId(e.target.value);setActiveConv(e.target.value);}}
              className="form-select text-xs">
              <option value="">Select contact...</option>
              {contacts.map(c=><option key={c.id} value={c.id}>{c.name} ({c.role})</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(conversations||[]).length === 0 && (
              <p className="p-4 text-xs text-indigo-400 text-center">No conversations yet. Start one above.</p>
            )}
            {(conversations||[]).map(c=>(
              <div key={c.other_user}
                onClick={()=>setActiveConv(c.other_user)}
                className={`p-3 cursor-pointer border-b border-indigo-50 hover:bg-indigo-50 transition ${activeConv===c.other_user?"bg-indigo-50":""}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{(c.other_name||"?")[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-indigo-700 truncate">{c.other_name}</p>
                    <p className="text-xs text-indigo-400 truncate">{c.last_msg}</p>
                  </div>
                  {c.unread>0 && (
                    <span className="w-5 h-5 bg-marigold-500 rounded-full text-xs text-ink font-bold flex items-center justify-center flex-shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 card flex flex-col">
          {activeConv ? (
            <>
              <div className="p-4 border-b border-indigo-50 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {(activeContact?.other_name||activeContact?.name||"?")[0]}
                  </span>
                </div>
                <p className="font-semibold text-indigo-700">
                  {activeContact?.other_name || activeContact?.name || "User"}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(thread||[]).map(m=>{
                  const isMine = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${isMine?"justify-end":"justify-start"}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isMine?"bg-indigo-700 text-white rounded-br-sm":"bg-indigo-50 text-indigo-800 rounded-bl-sm"}`}>
                        <p>{m.body}</p>
                        <p className={`text-xs mt-1 ${isMine?"text-indigo-200":"text-indigo-400"}`}>
                          {new Date(m.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(thread||[]).length===0 && (
                  <p className="text-center text-indigo-400 text-sm py-8">No messages yet. Say hello! 👋</p>
                )}
                <div ref={bottomRef}/>
              </div>
              <div className="p-3 border-t border-indigo-50 flex gap-2">
                <input
                  value={msgText} onChange={e=>setMsgText(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),msgText.trim()&&sendMut.mutate())}
                  placeholder="Type a message..." className="form-input flex-1 text-sm"/>
                <button onClick={()=>msgText.trim()&&sendMut.mutate()}
                  disabled={!msgText.trim()||sendMut.isPending}
                  className="btn-primary px-4 flex items-center gap-1">
                  <Send size={14}/>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-indigo-400">
              <MessageCircle size={48} className="mb-3 opacity-30"/>
              <p>Select a conversation or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
