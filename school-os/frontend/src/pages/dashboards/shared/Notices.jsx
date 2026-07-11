import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pin, Bell, ChevronDown, ChevronUp, Plus, Filter, X, Users, GraduationCap, BookOpen, Home } from "lucide-react";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { api } from "../../../lib/api.js";
import { useAuthStore } from "../../../store/authStore.js";

const AUDIENCE_CONFIG = {
  all: { label: "Everyone", icon: Home, bg: "bg-indigo-700", text: "text-white" },
  parents: { label: "Parents", icon: Users, bg: "bg-purple-100", text: "text-purple-700" },
  teachers: { label: "Teachers", icon: BookOpen, bg: "bg-emerald-100", text: "text-emerald-700" },
  students: { label: "Students", icon: GraduationCap, bg: "bg-amber-100", text: "text-amber-700" },
};

function AudienceBadge({ audience }) {
  const cfg = AUDIENCE_CONFIG[audience] || AUDIENCE_CONFIG.all;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

function NoticeCard({ notice, canPin, defaultPinned }) {
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(defaultPinned || notice.pinned);

  return (
    <div className={`bg-white border rounded-2xl p-5 transition-all shadow-sm hover:shadow-md ${pinned ? "border-marigold-500/40" : "border-indigo-100"}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {pinned && <Pin size={13} className="text-marigold-500 flex-shrink-0" fill="#E8940F" />}
          <p className="font-display text-lg text-ink leading-snug">{notice.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <AudienceBadge audience={notice.audience} />
          {canPin && (
            <button
              onClick={() => setPinned((v) => !v)}
              title={pinned ? "Unpin" : "Pin notice"}
              className={`p-1.5 rounded-lg transition ${pinned ? "text-marigold-500 bg-marigold-500/10" : "text-indigo-300 hover:text-marigold-500 hover:bg-marigold-500/10"}`}
            >
              <Pin size={14} />
            </button>
          )}
        </div>
      </div>

      <p className={`text-sm text-indigo-500 leading-relaxed ${!expanded && notice.body?.length > 180 ? "line-clamp-3" : ""}`}>
        {notice.body}
      </p>

      {notice.body?.length > 180 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition font-medium"
        >
          {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
        </button>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-indigo-50">
        <p className="text-xs text-indigo-300">
          {new Date(notice.created_at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
        </p>
        {notice.posted_by_name && (
          <p className="text-xs text-indigo-300">· Posted by {notice.posted_by_name}</p>
        )}
      </div>
    </div>
  );
}

export default function Notices() {
  const { user } = useAuthStore();
  const canPost = ["principal", "office", "admin"].includes(user?.role);
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const { data: notices, isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: () => api.get("/notices").then((r) => r.data.notices),
  });

  const mutation = useMutation({
    mutationFn: () => api.post("/notices", { title, body, audience }),
    onSuccess: () => { setTitle(""); setBody(""); setShowForm(false); qc.invalidateQueries({ queryKey: ["notices"] }); },
  });

  const displayed = (notices || [])
    .filter((n) => filterAudience === "all" || n.audience === filterAudience)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const inputCls = "w-full border border-indigo-100 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-ink placeholder-indigo-300";

  return (
    <DashboardShell
      title="Notice Board"
      subtitle="Official school circulars and announcements"
    >
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-indigo-100 rounded-xl px-3 py-2">
          <Filter size={14} className="text-indigo-400" />
          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="text-sm text-ink bg-transparent outline-none"
          >
            <option value="all">All audiences</option>
            <option value="parents">Parents only</option>
            <option value="teachers">Teachers only</option>
            <option value="students">Students only</option>
          </select>
        </div>
        <span className="text-xs text-indigo-300">{displayed.length} notice{displayed.length !== 1 ? "s" : ""}</span>
        {canPost && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="ml-auto flex items-center gap-2 bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-600 transition"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Cancel" : "Post Notice"}
          </button>
        )}
      </div>

      {/* POST FORM */}
      {canPost && showForm && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 mb-6 shadow-sm">
          <p className="font-display text-xl text-ink mb-4">Post a New Notice</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-indigo-400 block mb-1">Notice Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. School Holiday Announcement" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-indigo-400 block mb-1">Details *</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the full notice content here…" rows={4} className={inputCls} />
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs font-medium text-indigo-400 block mb-1">Target Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} className={inputCls}>
                  <option value="all">Everyone</option>
                  <option value="parents">Parents only</option>
                  <option value="teachers">Teachers only</option>
                  <option value="students">Students only</option>
                </select>
              </div>
              <button
                onClick={() => mutation.mutate()}
                disabled={!title.trim() || !body.trim() || mutation.isPending}
                className="bg-marigold-500 text-ink font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 hover:bg-marigold-400 transition text-sm flex items-center gap-2"
              >
                <Bell size={16} />
                {mutation.isPending ? "Posting…" : "Publish Notice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTICE LIST */}
      {isLoading ? (
        <div className="text-center py-16 text-indigo-300">
          <Bell size={36} className="mx-auto mb-2 opacity-30 animate-pulse" />
          <p className="text-sm">Loading notices…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-indigo-300 bg-white border border-indigo-50 rounded-2xl">
          <Bell size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-display text-xl text-indigo-400">No notices to show</p>
          <p className="text-sm mt-1">
            {filterAudience !== "all" ? "Try changing the audience filter." : canPost ? "Use the button above to post the first notice." : "Check back soon."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((n) => (
            <NoticeCard key={n.id} notice={n} canPin={canPost} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
