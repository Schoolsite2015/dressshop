import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import PublicNavbar from "../../components/PublicNavbar.jsx";
import ScrollCanvas from "../../components/ScrollCanvas.jsx";
import { api } from "../../lib/api.js";
import logoUrl from "../../assets/logo.png";
import bgCinematic from "../../assets/bg-cinematic.png";
import {
  BookOpen, FlaskConical, Bus, Trophy, Monitor, Home as HomeIcon,
  Phone, MapPin, Mail, ArrowRight, Bell,
} from "lucide-react";

const FACILITIES = [
  { icon: BookOpen,    label: "Modern Library",     desc: "5000+ books and digital resources" },
  { icon: FlaskConical,label: "Science Labs",        desc: "Physics, Chemistry & Biology labs" },
  { icon: Monitor,    label: "Computer Lab",        desc: "50 latest computers, high-speed internet" },
  { icon: Trophy,     label: "Sports Ground",       desc: "Cricket, football, athletics & more" },
  { icon: Bus,        label: "School Transport",    desc: "Safe GPS-tracked buses on 6 routes" },
  { icon: HomeIcon,   label: "Hostel Facility",     desc: "Comfortable accommodations for outstation students" },
];

export default function Home() {
  const { data: notices } = useQuery({
    queryKey: ["public-notices"],
    queryFn:  () => api.get("/notices").then((r) => r.data.notices).catch(() => []),
    retry: false,
  });

  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"]
  });

  // Background transition (Canvas -> Cinematic BG)
  const canvasOpacity = useTransform(scrollYProgress, [0.35, 0.45], [1, 0]);
  const cinematicOpacity = useTransform(scrollYProgress, [0.35, 0.45], [0, 1]);

  // Opacity Transforms for 12 Scenes
  // Scene 1 should be visible immediately on load (opacity 1 at progress 0)
  const o1 = useTransform(scrollYProgress, [0.00, 0.05, 0.07], [1, 1, 0]);
  const o2 = useTransform(scrollYProgress, [0.06, 0.09, 0.13, 0.16], [0, 1, 1, 0]);
  const o3 = useTransform(scrollYProgress, [0.15, 0.18, 0.22, 0.25], [0, 1, 1, 0]);
  const o4 = useTransform(scrollYProgress, [0.24, 0.27, 0.31, 0.34], [0, 1, 1, 0]);
  const o5 = useTransform(scrollYProgress, [0.33, 0.36, 0.40, 0.43], [0, 1, 1, 0]);
  const o6 = useTransform(scrollYProgress, [0.42, 0.45, 0.49, 0.52], [0, 1, 1, 0]);
  
  const o7 = useTransform(scrollYProgress, [0.51, 0.54, 0.58, 0.61], [0, 1, 1, 0]); // Stats
  const o8 = useTransform(scrollYProgress, [0.60, 0.63, 0.67, 0.70], [0, 1, 1, 0]); // Mission
  const o9 = useTransform(scrollYProgress, [0.69, 0.72, 0.78, 0.81], [0, 1, 1, 0]); // About
  const o10 = useTransform(scrollYProgress, [0.80, 0.83, 0.89, 0.92], [0, 1, 1, 0]); // Facilities
  const o11 = useTransform(scrollYProgress, [0.91, 0.93, 0.96, 0.98], [0, 1, 1, 0]); // CTA
  const o12 = useTransform(scrollYProgress, [0.97, 0.99, 1.00, 1.00], [0, 1, 1, 1]); // Footer (stays at end)

  // Y Translations for premium floating feel
  const buildY = (start, peak, end) => useTransform(scrollYProgress, [start, peak, end], [100, 0, -100]);
  
  // Scene 1 starts at 0 offset
  const y1 = useTransform(scrollYProgress, [0.00, 0.05, 0.07], [0, 0, -100]);
  const y2 = buildY(0.06, 0.11, 0.16);
  const y3 = buildY(0.15, 0.20, 0.25);
  const y4 = buildY(0.24, 0.29, 0.34);
  const y5 = buildY(0.33, 0.38, 0.43);
  const y6 = buildY(0.42, 0.47, 0.52);
  const y7 = buildY(0.51, 0.56, 0.61);
  const y8 = buildY(0.60, 0.65, 0.70);
  const y9 = buildY(0.69, 0.75, 0.81);
  const y10 = buildY(0.80, 0.86, 0.92);
  const y11 = buildY(0.91, 0.95, 0.98);
  const y12 = useTransform(scrollYProgress, [0.97, 1.0], [50, 0]); // Footer slides in and stops

  return (
    <div className="bg-[#020202] text-white font-sans selection:bg-marigold-500/30 selection:text-marigold-200">
      <PublicNavbar />

      {/* ── Massive Scroll Container ── */}
      <div ref={scrollRef} className="h-[1500vh] relative w-full">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-[#020202]">
          
          {/* Secondary Background (Cinematic Glass) */}
          <motion.div 
            style={{ opacity: cinematicOpacity }} 
            className="absolute inset-0 z-0 bg-cover bg-center"
            // If the image fails to load during dev, fallback to a dark gradient
            style={{ 
              opacity: cinematicOpacity,
              backgroundImage: `url(${bgCinematic})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#020202'
            }}
          />

          {/* Primary Background (Canvas Sequence) */}
          <motion.div style={{ opacity: canvasOpacity }} className="absolute inset-0 z-0">
            <ScrollCanvas scrollYProgress={scrollYProgress} />
          </motion.div>
          
          {/* Subtle gradient overlay to ensure text readability */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80 pointer-events-none" />

          {/* Master Texts overlay container */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 h-full flex flex-col justify-center items-center pointer-events-none">
            
            {/* 1. Welcome */}
            <motion.div style={{ opacity: o1, y: y1 }} className="absolute inset-x-0 flex flex-col items-center justify-center text-center">
              <p className="text-white/60 font-display text-lg sm:text-xl tracking-widest uppercase mb-4">
                Welcome to
              </p>
              <h1 className="text-5xl sm:text-7xl lg:text-[6rem] font-display font-semibold mb-6 tracking-tight bg-gradient-to-r from-marigold-300 via-marigold-500 to-marigold-400 text-transparent bg-clip-text drop-shadow-[0_0_40px_rgba(232,148,15,0.4)]">
                S.N. Public School
              </h1>
              <p className="text-white/80 text-lg sm:text-2xl font-light tracking-wide flex items-center justify-center gap-3">
                <span>Pindra</span> <span className="w-1.5 h-1.5 rounded-full bg-marigold-500"></span> <span>Varanasi</span>
              </p>
              <div className="mt-12 pt-8 border-t border-white/10 w-full max-w-md mx-auto">
                <p className="italic font-display text-xl sm:text-3xl text-indigo-100">
                  "Where Knowledge Meets Character"
                </p>
              </div>
            </motion.div>

            {/* 2. Vision */}
            <motion.div style={{ opacity: o2, y: y2 }} className="absolute inset-x-0 flex flex-col items-center justify-center text-center px-4">
              <div className="glass bg-white/5 backdrop-blur-2xl border border-white/10 p-12 sm:p-20 rounded-[3rem] shadow-2xl max-w-4xl mx-auto">
                <p className="text-2xl sm:text-4xl lg:text-5xl font-light leading-snug sm:leading-tight text-white/90">
                  Established with the vision of nurturing <span className="text-marigold-400 font-medium">excellence</span>, <span className="text-marigold-400 font-medium">discipline</span> and <span className="text-marigold-400 font-medium">lifelong learning</span>.
                </p>
              </div>
            </motion.div>

            {/* 3. Academic Excellence */}
            <motion.div style={{ opacity: o3, y: y3 }} className="absolute inset-x-0 flex flex-col items-center justify-center text-center px-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10 text-lg sm:text-2xl font-display font-medium text-white/90 max-w-4xl mx-auto w-full">
                {["Academic Excellence", "Experienced Faculty", "Modern Classrooms", "Digital Learning", "Safe Campus", "Co-Curricular Activities"].map(item => (
                  <div key={item} className="glass bg-black/40 backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-3xl flex items-center justify-center min-h-[140px] shadow-2xl">
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 4. Motto */}
            <motion.div style={{ opacity: o4, y: y4 }} className="absolute inset-x-0 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-marigold-500/20 blur-[100px] rounded-full"></div>
                <h2 className="text-6xl sm:text-[7rem] font-display text-white mb-6 drop-shadow-2xl relative z-10 font-bold">
                  विद्या ददाति विनयम्
                </h2>
              </div>
              <p className="text-2xl sm:text-4xl font-light tracking-widest text-marigold-400 uppercase mt-4">
                Knowledge Gives Humility
              </p>
            </motion.div>

            {/* 5. Principal */}
            <motion.div style={{ opacity: o5, y: y5 }} className="absolute inset-x-0 flex flex-col items-center justify-center text-center px-4">
              <div className="glass bg-black/50 backdrop-blur-3xl border-t border-white/10 p-12 sm:p-24 rounded-full max-w-4xl mx-auto w-full aspect-square flex flex-col items-center justify-center">
                <p className="text-marigold-400 uppercase tracking-widest text-sm mb-6 font-bold">Principal</p>
                <h3 className="text-4xl sm:text-6xl font-display font-semibold mb-8 text-white">Anjani Kr. Pathak</h3>
                <p className="max-w-xl text-xl sm:text-2xl font-light leading-relaxed text-white/70 mx-auto">
                  Leading with vision, integrity and commitment towards holistic education.
                </p>
              </div>
            </motion.div>

            {/* 6. Location */}
            <motion.div style={{ opacity: o6, y: y6 }} className="absolute inset-x-0 flex flex-col items-center justify-center text-center">
              <div className="glass bg-white/5 backdrop-blur-2xl border border-white/10 p-12 sm:p-20 rounded-[3rem] shadow-2xl">
                <MapPin size={48} className="text-marigold-400 mx-auto mb-8 opacity-80" />
                <p className="text-white/50 uppercase tracking-widest text-sm mb-4">Located on</p>
                <h3 className="text-3xl sm:text-5xl font-display font-medium mb-6 leading-tight text-white">
                  Lucknow–Varanasi Road<br />Pindra, Uttar Pradesh
                </h3>
                <p className="text-xl sm:text-2xl text-marigold-400/90 font-light mt-8 italic">
                  Creating generations of confident learners.
                </p>
              </div>
            </motion.div>

            {/* 7. Stats & Notices */}
            <motion.div style={{ opacity: o7, y: y7 }} className="absolute inset-x-0 flex flex-col items-center justify-center px-4 w-full">
              {(notices || []).length > 0 && (
                <div className="glass bg-white/5 backdrop-blur-xl border border-white/10 py-3 px-8 rounded-full flex items-center gap-4 mb-16 shadow-2xl max-w-4xl w-full">
                  <span className="flex items-center gap-2 text-marigold-400 font-bold text-sm uppercase tracking-wider whitespace-nowrap">
                    <Bell size={16} /> Latest
                  </span>
                  <div className="flex gap-8 overflow-hidden whitespace-nowrap mask-edges">
                    {(notices || []).slice(0, 3).map((n) => (
                      <span key={n.id} className="text-white/80 text-sm font-light tracking-wide">• {n.title}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 w-full max-w-6xl mx-auto">
                {[
                  { v: "1200+", l: "Students" },
                  { v: "80+",   l: "Faculty" },
                  { v: "1985",  l: "Established" },
                  { v: "CBSE",  l: "Affiliated" },
                ].map((s) => (
                  <div key={s.l} className="text-center p-8 sm:p-12 rounded-[2.5rem] glass bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col justify-center">
                    <p className="font-display text-5xl lg:text-7xl text-marigold-400 font-light mb-4">{s.v}</p>
                    <p className="text-white/50 text-xs sm:text-sm uppercase tracking-widest font-semibold">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 8. Our Mission */}
            <motion.div style={{ opacity: o8, y: y8 }} className="absolute inset-x-0 flex flex-col items-center justify-center text-center px-4">
              <div className="relative glass bg-white/5 backdrop-blur-2xl border-y border-white/10 p-16 sm:p-32 rounded-3xl w-full max-w-6xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-marigold-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <p className="text-marigold-500 text-sm font-bold uppercase tracking-widest mb-8">Our Mission</p>
                <h2 className="font-display text-4xl sm:text-6xl text-white font-medium leading-snug mb-10 max-w-4xl mx-auto">
                  "To empower every student with knowledge, character, and the courage to shape a better tomorrow."
                </h2>
                <div className="w-24 h-px bg-marigold-500/50 mx-auto"></div>
              </div>
            </motion.div>

            {/* 9. Heritage & About */}
            <motion.div style={{ opacity: o9, y: y9 }} className="absolute inset-x-0 flex flex-col lg:flex-row items-center justify-center gap-16 px-4 max-w-7xl mx-auto w-full pointer-events-auto">
              <div className="flex-1 text-center lg:text-left">
                <p className="text-marigold-500 text-sm font-bold uppercase tracking-widest mb-6">Heritage & Legacy</p>
                <h2 className="font-display text-5xl sm:text-6xl text-white font-semibold mb-8 leading-tight">
                  Shaping Tomorrow's<br/>Leaders Since 1985
                </h2>
                <div className="space-y-6 text-lg text-white/60 font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  <p>St. S.N. Public School is a premier institution in Pindra, affiliated with the CBSE. We believe in holistic development — academic excellence combined with character, values, and life skills.</p>
                </div>
                <div className="mt-12 flex justify-center lg:justify-start">
                  <Link to="/about" className="glass bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 text-white font-medium px-8 py-4 rounded-full transition-all flex items-center gap-3">
                    Read Our Story <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4 sm:gap-6 w-full">
                {[
                  { n: "A+", l: "CBSE Result Grade" },
                  { n: "30+", l: "Years of Excellence" },
                  { n: "99%", l: "Board Pass Rate" },
                  { n: "50+", l: "Co-curricular Clubs" },
                ].map((c, i) => (
                  <div key={c.l} className={`glass backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center flex flex-col justify-center min-h-[200px] shadow-2xl ${i === 1 ? 'bg-marigold-500/20 border-marigold-500/50' : 'bg-black/40'}`}>
                    <p className={`font-display text-4xl sm:text-5xl font-semibold mb-3 ${i === 1 ? 'text-marigold-400' : 'text-white'}`}>{c.n}</p>
                    <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-white/60">{c.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 10. Infrastructure */}
            <motion.div style={{ opacity: o10, y: y10 }} className="absolute inset-x-0 flex flex-col items-center justify-center px-4 w-full">
              <div className="text-center mb-16">
                <p className="text-marigold-500 text-sm font-bold uppercase tracking-widest mb-4">Infrastructure</p>
                <h2 className="font-display text-5xl sm:text-6xl text-white font-semibold">World-Class Campus</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto w-full">
                {FACILITIES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="glass bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-2xl">
                      <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8">
                        <Icon size={32} className="text-marigold-400" />
                      </div>
                      <h3 className="font-display text-2xl text-white font-medium mb-4">{f.label}</h3>
                      <p className="text-white/50 leading-relaxed font-light">{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* 11. CTA */}
            <motion.div style={{ opacity: o11, y: y11 }} className="absolute inset-x-0 flex flex-col items-center justify-center text-center px-4 pointer-events-auto">
              <div className="glass bg-white/5 backdrop-blur-3xl border border-white/10 p-16 sm:p-24 rounded-[3rem] shadow-2xl max-w-5xl mx-auto w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-marigold-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <h2 className="font-display text-5xl sm:text-7xl font-semibold mb-8 tracking-tight text-white relative z-10">Ready to Join Our Family?</h2>
                <p className="text-white/60 text-xl font-light mb-12 max-w-2xl mx-auto leading-relaxed relative z-10">
                  Applications for the 2026–27 academic year are now open. Apply online and our team
                  will contact you within 48 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                  <Link to="/admissions" className="bg-marigold-500 text-black font-semibold text-lg px-10 py-5 rounded-full hover:bg-marigold-400 transition-all shadow-[0_0_40px_rgba(232,148,15,0.4)] flex items-center justify-center gap-3">
                    Begin Application <ArrowRight size={20} />
                  </Link>
                  <Link to="/contact" className="glass bg-white/10 border border-white/20 text-white font-medium text-lg px-10 py-5 rounded-full hover:bg-white/20 transition-all flex items-center justify-center">
                    Contact Admissions
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* 12. Footer */}
            <motion.div style={{ opacity: o12, y: y12 }} className="absolute inset-x-0 bottom-0 pointer-events-auto w-full bg-black/60 backdrop-blur-3xl border-t border-white/10 pt-16 px-6">
              <div className="max-w-7xl mx-auto grid sm:grid-cols-12 gap-12 sm:gap-8 mb-16">
                <div className="sm:col-span-4 lg:col-span-5">
                  <div className="flex items-center gap-4 mb-6">
                    <img src={logoUrl} alt="logo" className="w-16 h-16 object-contain drop-shadow-md" />
                    <div>
                      <p className="font-display text-2xl font-semibold text-white">St. S.N. Public School</p>
                      <p className="text-marigold-400/80 text-sm tracking-widest uppercase mt-1">Pindra, Varanasi</p>
                    </div>
                  </div>
                  <p className="text-white/50 font-light leading-relaxed max-w-sm text-lg">Affiliated to CBSE, New Delhi. Providing quality, holistic education to nurture future leaders since 1985.</p>
                </div>
                
                <div className="sm:col-span-4 lg:col-span-3">
                  <p className="font-semibold mb-6 text-marigold-500 uppercase tracking-widest text-sm">Quick Links</p>
                  <div className="flex flex-col space-y-4 font-light text-lg">
                    {[["Home", "/"], ["About", "/about"], ["Admissions", "/admissions"], ["Contact", "/contact"], ["Staff / Student Login", "/login"]].map(([l, p]) => (
                      <Link key={l} to={p} className="text-white/60 hover:text-marigold-400 transition-all w-fit">{l}</Link>
                    ))}
                  </div>
                </div>
                
                <div className="sm:col-span-4 lg:col-span-4">
                  <p className="font-semibold mb-6 text-marigold-500 uppercase tracking-widest text-sm">Contact Information</p>
                  <div className="space-y-5 font-light text-white/60 text-lg">
                    <p className="flex items-start gap-4">
                      <MapPin size={24} className="text-marigold-500 mt-1 flex-shrink-0" /> 
                      <span>Lucknow–Varanasi Road, Pindra,<br/>Varanasi — 221206, U.P.</span>
                    </p>
                    <p className="flex items-center gap-4">
                      <Phone size={24} className="text-marigold-500 flex-shrink-0" /> 
                      <span>+91 98765 43210</span>
                    </p>
                    <p className="flex items-center gap-4">
                      <Mail size={24} className="text-marigold-500 flex-shrink-0" /> 
                      <span>info@snpublicschool.edu.in</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="max-w-7xl mx-auto border-t border-white/10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-light text-white/40">
                <p>© {new Date().getFullYear()} St. S.N. Public School, Pindra, Varanasi. All rights reserved.</p>
                <p>Designed for Excellence.</p>
              </div>
            </motion.div>

          </div>
          
          {/* Scroll Down Indicator */}
          <motion.div 
            style={{ opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]) }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50"
          >
            <span className="text-white/50 text-xs tracking-widest uppercase">Scroll to explore</span>
            <div className="w-px h-12 bg-gradient-to-b from-marigold-500 to-transparent animate-pulse" />
          </motion.div>

        </div>
      </div>
    </div>
  );
}
