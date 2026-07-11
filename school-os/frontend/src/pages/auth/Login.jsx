import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Sparkles,
  GraduationCap,
  BookOpen,
  Users,
  Briefcase,
  ChevronRight,
  Zap,
} from "lucide-react";
import { api } from "../../lib/api.js";
import { shopApi } from "../../lib/shopApi.js";
import { useAuthStore } from "../../store/authStore.js";
import logoUrl from "../../assets/logo.png";

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */
const ROLE_HOME = {
  super_admin: "/dashboard/superadmin",
  principal: "/dashboard/principal",
  teacher: "/dashboard/teacher/attendance",
  student: "/dashboard/student",
  parent: "/dashboard/parent",
  office: "/dashboard/office",
  hr: "/dashboard/hr",
  librarian: "/dashboard/library",
  transport: "/dashboard/transport",
};


const STATS = [
  { value: "1200+", label: "Students", icon: Users },
  { value: "80+", label: "Faculty", icon: BookOpen },
  { value: "Est. 1985", label: "Heritage", icon: Sparkles },
];

/* ═══════════════════════════════════════════════════════════════════════════
   PARTICLE CONSTELLATION — Canvas
   ═══════════════════════════════════════════════════════════════════════════ */
function ParticleConstellation() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const initParticles = useCallback((w, h) => {
    const count = Math.min(55, Math.floor((w * h) / 12000));
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = arr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h;

    function resize() {
      const parent = canvas.parentElement;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      initParticles(w, h);
    }

    function onMouse(e) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMouse);

    let time = 0;
    function draw() {
      time += 0.01;
      ctx.clearRect(0, 0, w, h);
      const pts = particlesRef.current;
      const CONNECTION_DIST = 120;
      const MOUSE_DIST = 160;

      // Update & draw particles
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));

        // Mouse repulsion
        const mdx = p.x - mouseRef.current.x;
        const mdy = p.y - mouseRef.current.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < MOUSE_DIST && md > 0) {
          const force = (MOUSE_DIST - md) / MOUSE_DIST * 0.015;
          p.vx += (mdx / md) * force;
          p.vy += (mdy / md) * force;
        }

        // Speed limit
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.8) {
          p.vx = (p.vx / speed) * 0.8;
          p.vy = (p.vy / speed) * 0.8;
        }

        const pulse = Math.sin(time * 2 + p.pulsePhase) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165, 180, 252, ${p.opacity * pulse})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165, 180, 252, ${p.opacity * 0.1 * pulse})`;
        ctx.fill();
      }

      // Connection lines
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.2;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(165, 180, 252, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Mouse connections
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx > 0 && my > 0) {
        for (let i = 0; i < pts.length; i++) {
          const dx = pts[i].x - mx;
          const dy = pts[i].y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_DIST) {
            const alpha = (1 - dist / MOUSE_DIST) * 0.35;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(pts[i].x, pts[i].y);
            ctx.strokeStyle = `rgba(245, 166, 35, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouse);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[1]"
      style={{ pointerEvents: "auto" }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MORPHING GRADIENT ORBS
   ═══════════════════════════════════════════════════════════════════════════ */
function MorphingOrbs() {
  const orbs = [
    {
      color: "rgba(232, 148, 15, 0.15)",
      size: 400,
      initialX: "15%",
      initialY: "10%",
      duration: 22,
    },
    {
      color: "rgba(99, 102, 241, 0.12)",
      size: 350,
      initialX: "70%",
      initialY: "60%",
      duration: 26,
    },
    {
      color: "rgba(129, 140, 248, 0.10)",
      size: 300,
      initialX: "40%",
      initialY: "80%",
      duration: 20,
    },
    {
      color: "rgba(232, 148, 15, 0.08)",
      size: 250,
      initialX: "80%",
      initialY: "20%",
      duration: 30,
    },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: "blur(60px)",
            left: orb.initialX,
            top: orb.initialY,
          }}
          animate={{
            x: [0, 60, -40, 30, 0],
            y: [0, -50, 30, -20, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ORBITAL LOADER
   ═══════════════════════════════════════════════════════════════════════════ */
function OrbitalLoader() {
  return (
    <div className="relative w-5 h-5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-white rounded-full"
          style={{ left: "50%", top: "50%", marginLeft: -3, marginTop: -3 }}
          animate={{
            x: [0, Math.cos((i * 2 * Math.PI) / 3) * 8, 0],
            y: [0, Math.sin((i * 2 * Math.PI) / 3) * 8, 0],
            scale: [1, 1.4, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED TEXT REVEAL
   ═══════════════════════════════════════════════════════════════════════════ */
const letterVariants = {
  hidden: { opacity: 0, y: 30, rotateX: -90 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { delay: 0.8 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function AnimatedTitle({ text, className }) {
  const words = text.split(" ");
  let globalIndex = 0;

  return (
    <span className={className} aria-label={text}>
      {words.map((word, wIdx) => {
        const isLast = wIdx === words.length - 1;
        return (
          <span key={wIdx} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {word.split("").map((char, cIdx) => (
              <motion.span
                key={cIdx}
                custom={globalIndex++}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                style={{ display: "inline-block" }}
              >
                {char}
              </motion.span>
            ))}
            {!isLast && (
              <motion.span
                custom={globalIndex++}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                style={{ display: "inline-block", whiteSpace: "pre" }}
              >
                {" "}
              </motion.span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LOGIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login, shopLogin } = useAuthStore();
  const navigate = useNavigate();

  /* ── Login handler ─────────────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Step 1: Try School OS login
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.accessToken, data.refreshToken, data.user);
      navigate(ROLE_HOME[data.user.role] || "/dashboard/principal");
      return;
    } catch (schoolErr) {
      const status = schoolErr.response?.status;
      if (status !== 401 && status !== 403 && status !== 400) {
        setError(schoolErr.response?.data?.error || "Login failed.");
        setLoading(false);
        return;
      }
    }

    // Step 2: Try Dress Shop login
    try {
      const { data } = await shopApi.post("/auth/login", {
        username: email,
        password,
      });
      shopLogin(data.token, data.user, data.school);
      navigate("/shop");
      return;
    } catch {
      setError(
        "Invalid credentials. Please check your email / username and password."
      );
    }

    setLoading(false);
  }

  function quickLogin(acc) {
    setEmail(acc.email);
    setPassword("Password@123");
    setError(null);
  }

  /* ── Stagger helpers ───────────────────────────────────────────────────── */
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5 },
    },
  };

  /* ══════════════════════════════ RENDER ══════════════════════════════════ */
  return (
    <div className="min-h-screen flex overflow-hidden bg-paper">
      {/* ═══════════════════ LEFT HERO PANEL ════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col items-center justify-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0a0e1a 0%, #0F172A 20%, #1E1B4B 45%, #312E81 60%, #1E1B4B 80%, #0a0e1a 100%)",
        }}
      >
        {/* Morphing orbs */}
        <MorphingOrbs />

        {/* Particle constellation */}
        <ParticleConstellation />

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 z-[2] opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* ── Hero content ─────────────────────────────────────────────── */}
        <motion.div
          className="relative z-10 flex flex-col items-center text-center max-w-lg px-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo with pulsing glow aura */}
          <motion.div className="relative mb-8" variants={itemVariants}>
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full z-0"
              style={{
                background:
                  "radial-gradient(circle, rgba(245,166,35,0.25) 0%, transparent 70%)",
                filter: "blur(25px)",
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Secondary shimmer ring */}
            <motion.div
              className="absolute -inset-4 rounded-full z-0"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, rgba(245,166,35,0.15), transparent, rgba(129,140,248,0.1), transparent)",
                filter: "blur(15px)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.img
              src={logoUrl}
              alt="St. S.N. Public School Logo"
              className="w-32 h-32 object-contain relative z-10 drop-shadow-2xl"
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* School name — animated letter reveal */}
          <motion.div variants={itemVariants} className="mb-1">
            <h1 className="font-display text-4xl xl:text-5xl text-white font-bold leading-tight tracking-tight">
              <AnimatedTitle text="St. S.N. Public School" />
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-indigo-300 text-lg mb-3 font-body"
          >
            Pindra, Varanasi
          </motion.p>

          {/* Sanskrit motto with glow */}
          <motion.div variants={itemVariants} className="relative mb-2">
            <motion.p
              className="text-marigold-400 text-2xl xl:text-3xl font-display tracking-wide relative z-10"
              animate={{
                textShadow: [
                  "0 0 10px rgba(245,166,35,0)",
                  "0 0 20px rgba(245,166,35,0.4)",
                  "0 0 10px rgba(245,166,35,0)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              विद्या ददाति विनयम्
            </motion.p>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-indigo-300/50 text-sm italic mb-12 font-body"
          >
            "Knowledge bestows humility"
          </motion.p>

          {/* Animated stats */}
          <motion.div
            className="grid grid-cols-3 gap-4 w-full"
            variants={containerVariants}
          >
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.8 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        delay: 1.5 + i * 0.2,
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    },
                  }}
                  whileHover={{
                    scale: 1.08,
                    y: -4,
                    transition: { duration: 0.2 },
                  }}
                  className="glass rounded-2xl p-4 text-center cursor-default group"
                >
                  <Icon
                    size={18}
                    className="mx-auto mb-2 text-indigo-300/60 group-hover:text-marigold-400 transition-colors"
                  />
                  <p className="font-display text-xl text-marigold-400 font-bold">
                    {stat.value}
                  </p>
                  <p className="text-indigo-300/60 text-xs mt-1 font-body">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Floating decorative elements */}
          <motion.div
            className="absolute -top-20 -right-10 text-indigo-500/10"
            animate={{ rotate: 360, y: [0, -20, 0] }}
            transition={{ rotate: { duration: 40, repeat: Infinity, ease: "linear" }, y: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
          >
            <Sparkles size={120} />
          </motion.div>
          <motion.div
            className="absolute -bottom-16 -left-8 text-marigold-400/10"
            animate={{ rotate: -360, y: [0, 15, 0] }}
            transition={{ rotate: { duration: 50, repeat: Infinity, ease: "linear" }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
          >
            <GraduationCap size={100} />
          </motion.div>
        </motion.div>

        {/* Bottom edge glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px z-20"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(245,166,35,0.3), rgba(129,140,248,0.3), transparent)",
          }}
        />
      </div>

      {/* ═══════════════════ RIGHT FORM PANEL ══════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-[0.04]"
            style={{
              background:
                "radial-gradient(circle, #2C3670, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full opacity-[0.03]"
            style={{
              background:
                "radial-gradient(circle, #E8940F, transparent 70%)",
            }}
          />
        </div>

        <motion.div
          className="w-full max-w-[400px] relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── Mobile logo (shown < lg) ─────────────────────────────── */}
          <motion.div
            className="lg:hidden flex flex-col items-center mb-8"
            variants={itemVariants}
          >
            <div className="relative mb-3">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(245,166,35,0.2), transparent 70%)",
                  filter: "blur(15px)",
                }}
              />
              <img
                src={logoUrl}
                alt="School logo"
                className="w-20 h-20 object-contain relative z-10"
              />
            </div>
            <p className="font-display text-xl text-indigo-700 font-bold text-center">
              St. S.N. Public School
            </p>
            <p className="text-indigo-400 text-sm">Pindra, Varanasi</p>
          </motion.div>

          {/* ── Heading ──────────────────────────────────────────────── */}
          <motion.div className="mb-8" variants={itemVariants}>
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Zap size={20} className="text-marigold-500" />
              </motion.div>
              <span className="text-xs font-semibold text-marigold-500 uppercase tracking-widest font-body">
                School OS Portal
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #1C2340, #2C3670, #1C2340)",
                }}
              >
                Welcome back
              </span>
            </h2>
            <p className="text-indigo-400/80 text-sm mt-1 font-body">
              Sign in to your School OS portal
            </p>
          </motion.div>

          {/* ── Login form ───────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <motion.div variants={itemVariants}>
              <label className="block text-xs font-semibold text-indigo-600 mb-2 font-body tracking-wide">
                Email / Username
              </label>
              <div className="relative group">
                {/* Neon glow ring */}
                <motion.div
                  className="absolute -inset-0.5 rounded-xl opacity-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, #F5A623, #818CF8, #F5A623)",
                  }}
                  animate={{
                    opacity: focusedField === "email" ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-indigo-300 z-10 pointer-events-none">
                    <Shield size={16} />
                  </div>
                  <input
                    id="login-email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full border border-indigo-100 rounded-xl pl-10 pr-4 py-3 text-sm bg-white relative z-[1]
                               focus:border-transparent focus:ring-2 focus:ring-marigold-400/50 outline-none transition-all
                               placeholder:text-indigo-300/50"
                    placeholder="your@snpublicschool.edu.in"
                  />
                </div>
              </div>
            </motion.div>

            {/* Password field */}
            <motion.div variants={itemVariants}>
              <label className="block text-xs font-semibold text-indigo-600 mb-2 font-body tracking-wide">
                Password
              </label>
              <div className="relative group">
                <motion.div
                  className="absolute -inset-0.5 rounded-xl opacity-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, #818CF8, #F5A623, #818CF8)",
                  }}
                  animate={{
                    opacity: focusedField === "password" ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-indigo-300 z-10 pointer-events-none">
                    <BookOpen size={16} />
                  </div>
                  <input
                    id="login-password"
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full border border-indigo-100 rounded-xl pl-10 pr-12 py-3 text-sm bg-white relative z-[1]
                               focus:border-transparent focus:ring-2 focus:ring-marigold-400/50 outline-none transition-all
                               placeholder:text-indigo-300/50"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-indigo-600 transition-colors p-1 z-10"
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Error message with shake */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    height: "auto",
                    x: [0, -10, 10, -10, 10, -5, 5, 0],
                  }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3 text-sm text-red-600 overflow-hidden"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign In button */}
            <motion.div variants={itemVariants}>
              <motion.button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-white font-bold text-sm
                           shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed
                           relative overflow-hidden group font-body tracking-wide"
                style={{
                  background:
                    "linear-gradient(135deg, #1C2340, #2C3670, #312E81)",
                }}
                whileHover={{
                  scale: 1.02,
                  y: -2,
                  boxShadow:
                    "0 20px 40px -12px rgba(44, 54, 112, 0.4)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Shimmer overlay */}
                <motion.div
                  className="absolute inset-0 z-0"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut",
                  }}
                />
                <span className="relative z-10 flex items-center gap-2.5">
                  {loading ? (
                    <>
                      <OrbitalLoader />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <Shield size={17} />
                      <span>Sign in to Portal</span>
                      <ChevronRight
                        size={16}
                        className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300"
                      />
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.p
            className="text-[10px] text-indigo-300/40 mt-8 text-center font-body"
            variants={itemVariants}
          >
            Powered by School OS · St. S.N. Public School, Pindra
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
