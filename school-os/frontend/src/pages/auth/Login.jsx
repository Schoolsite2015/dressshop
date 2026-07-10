import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { api } from "../../lib/api.js";
import { shopApi } from "../../lib/shopApi.js";
import { useAuthStore } from "../../store/authStore.js";
import logoUrl from "../../assets/logo.png";

const ROLE_HOME = {
  principal: "/dashboard/principal",
  teacher:   "/dashboard/teacher/attendance",
  student:   "/dashboard/student",
  parent:    "/dashboard/parent",
  office:    "/dashboard/office",
  hr:        "/dashboard/hr",
  librarian: "/dashboard/library",
  transport: "/dashboard/transport",
};

const DEMO_ACCOUNTS = [
  { label: "Principal",   email: "principal@snpublicschool.edu.in", icon: "🏫", color: "from-purple-500 to-indigo-600" },
  { label: "Teacher",     email: "teacher@snpublicschool.edu.in",   icon: "👨‍🏫", color: "from-blue-500 to-cyan-500" },
  { label: "Student",     email: "student@snpublicschool.edu.in",   icon: "🎓", color: "from-green-500 to-emerald-500" },
  { label: "Parent",      email: "parent@snpublicschool.edu.in",    icon: "👨‍👩‍👧", color: "from-orange-500 to-amber-500" },
  { label: "Office",      email: "office@snpublicschool.edu.in",    icon: "💼", color: "from-pink-500 to-rose-500" },
];

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  const { login, shopLogin }    = useAuthStore();
  const navigate                = useNavigate();

  useEffect(() => { setMounted(true); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);

    // ── Step 1: Try School OS login (email + password, PostgreSQL) ──────────
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      navigate(ROLE_HOME[data.user.role] || "/dashboard/principal");
      return;
    } catch (schoolErr) {
      const status = schoolErr.response?.status;
      // Only fall through to dress shop if it's an auth failure
      if (status !== 401 && status !== 403 && status !== 400) {
        setError(schoolErr.response?.data?.error || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }
    }

    // ── Step 2: Try Dress Shop login (username + password, SQLite) ──────────
    try {
      const { data } = await shopApi.post("/auth/login", {
        username: email,  // treat the "email" field as username for shop logins
        password,
      });
      shopLogin(data.token, data.user, data.school);
      navigate("/shop");
      return;
    } catch {
      setError("Invalid credentials. Please check your email / username and password.");
    }

    setLoading(false);
  }

  function quickLogin(acc) {
    setEmail(acc.email);
    setPassword("Password@123");
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── Left hero panel with animated gradient ── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col items-center justify-center relative p-12"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 30%, #312E81 50%, #1E1B4B 70%, #0F172A 100%)",
          backgroundSize: "400% 400%",
          animation: "gradientShift 20s ease infinite",
        }}>

        {/* Floating decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] right-[15%] w-72 h-72 rounded-full opacity-[0.08] animate-float"
            style={{ background: "radial-gradient(circle, #E8940F, transparent 70%)" }} />
          <div className="absolute bottom-[15%] left-[10%] w-64 h-64 rounded-full opacity-[0.06] animate-float-slow"
            style={{ background: "radial-gradient(circle, #818CF8, transparent 70%)" }} />
          <div className="absolute top-[50%] left-[50%] w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #E8940F, transparent 60%)", animation: "float 10s ease-in-out infinite reverse" }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        {/* Content */}
        <div className={`relative z-10 flex flex-col items-center text-center max-w-md transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-marigold-400/20 rounded-full blur-3xl scale-150 animate-pulse-glow" />
            <img src={logoUrl} alt="School logo" className="w-36 h-36 object-contain relative z-10 drop-shadow-2xl animate-float" />
          </div>

          <h1 className="font-display text-4xl text-white font-bold leading-tight mb-2 tracking-tight">
            St. S.N. Public School
          </h1>
          <p className="text-indigo-300 text-lg mb-2">Pindra, Varanasi</p>
          <p className="text-marigold-400 text-2xl font-display mb-2 tracking-wide">विद्या ददाति विनयम्</p>
          <p className="text-indigo-300/60 text-sm italic mb-10">"Knowledge bestows humility"</p>

          <div className="grid grid-cols-3 gap-4 w-full">
            {[
              { v: "1200+", l: "Students", delay: 200 },
              { v: "80+",   l: "Faculty",  delay: 400 },
              { v: "Est. 1985", l: "Heritage", delay: 600 },
            ].map((s) => (
              <div key={s.l}
                className={`glass rounded-2xl p-4 text-center transition-all duration-700 hover:scale-105
                  ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${s.delay}ms` }}>
                <p className="font-display text-xl text-marigold-400 font-bold">{s.v}</p>
                <p className="text-indigo-300/70 text-xs mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-paper px-6 py-12">
        <div className={`w-full max-w-sm transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logoUrl} alt="School logo" className="w-14 h-14 object-contain" />
            <div>
              <p className="font-display text-lg text-indigo-700 font-semibold">St. S.N. Public School</p>
              <p className="text-indigo-400 text-xs">Pindra, Varanasi</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl text-indigo-700 font-bold mb-1">Welcome back</h2>
            <p className="text-indigo-400 text-sm">Sign in to your School OS portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-indigo-600 mb-2">
                Email / Username
              </label>
              <input
                id="login-email"
                type="text" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input text-base"
                placeholder="your@snpublicschool.edu.in or username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-600 mb-2">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-10 text-base"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600 transition p-1">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            <button id="login-submit" type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold
                         shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all">
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
              ) : (
                <><Shield size={18} /> Sign in to Portal</>
              )}
            </button>
          </form>

          {/* Quick login buttons */}
          <div className="mt-8">
            <p className="text-xs text-indigo-400 font-semibold mb-3 uppercase tracking-wider">Quick demo access</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc, i) => (
                <button key={acc.label} onClick={() => quickLogin(acc)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-white
                    bg-gradient-to-r ${acc.color} hover:opacity-90 active:scale-95 transition-all
                    ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${800 + i * 100}ms`, transitionDuration: "500ms" }}>
                  <span className="text-sm">{acc.icon}</span> {acc.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-indigo-300 mt-3 text-center">
              All demo accounts use password: <code className="bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600 font-mono">Password@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
