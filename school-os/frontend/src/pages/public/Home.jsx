import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PublicNavbar from "../../components/PublicNavbar.jsx";
import { api } from "../../lib/api.js";
import logoUrl from "../../assets/logo.png";
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

  return (
    <div className="min-h-screen bg-paper">
      <PublicNavbar />

      {/* ── Hero ── */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center text-white overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1C2340 0%, #2C3670 60%, #1C2340 100%)" }}
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-marigold-500 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-indigo-400 blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto animate-slide-up">
          <img src={logoUrl} alt="St. S.N. Public School" className="w-28 h-28 object-contain mx-auto mb-6 drop-shadow-2xl" />
          <p className="text-marigold-400 text-lg font-display mb-2">|| विद्या ददाति विनयम् ||</p>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-tight mb-3">
            St. S.N. Public School
          </h1>
          <p className="text-indigo-300 text-xl mb-8">Pindra, Varanasi — Nurturing Excellence Since 1985</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/admissions"
              className="bg-marigold-500 text-ink font-semibold px-8 py-4 rounded-2xl hover:bg-marigold-400
                         transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 justify-center"
            >
              Apply for Admission <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="glass text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/20
                         transition-all flex items-center gap-2 justify-center"
            >
              Staff / Student Login
            </Link>
          </div>

          {/* Stats ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16">
            {[
              { v: "1200+", l: "Students" },
              { v: "80+",   l: "Trained Faculty" },
              { v: "Since 1985", l: "Established" },
              { v: "CBSE",  l: "Affiliated" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-2xl p-4 text-center">
                <p className="font-display text-2xl text-marigold-400 font-semibold">{s.v}</p>
                <p className="text-indigo-300 text-xs mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Notice Board ── */}
      {(notices || []).length > 0 && (
        <section className="bg-marigold-500 py-3 overflow-hidden">
          <div className="flex items-center gap-4 px-6">
            <span className="flex items-center gap-1.5 text-ink font-semibold text-sm flex-shrink-0">
              <Bell size={14} /> Latest Notices:
            </span>
            <div className="flex gap-8 overflow-hidden">
              {(notices || []).slice(0, 3).map((n) => (
                <span key={n.id} className="text-ink text-sm whitespace-nowrap">• {n.title}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── About preview ── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-marigold-500 text-sm font-semibold uppercase tracking-wide mb-3">About Us</p>
            <h2 className="font-display text-4xl text-indigo-700 font-semibold mb-6 leading-tight">
              Shaping Tomorrow's Leaders Since 1985
            </h2>
            <p className="text-indigo-500 leading-relaxed mb-4">
              St. S.N. Public School is a premier educational institution in Pindra, Varanasi,
              affiliated with the Central Board of Secondary Education (CBSE). We believe in holistic
              development — academic excellence combined with character, values, and life skills.
            </p>
            <p className="text-indigo-500 leading-relaxed mb-6">
              With state-of-the-art infrastructure, dedicated faculty, and a curriculum designed to
              prepare students for the 21st century, we are committed to nurturing every child's
              potential in a safe, inclusive, and stimulating environment.
            </p>
            <Link to="/about" className="btn-primary inline-flex items-center gap-2">
              Learn More <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "A+", l: "CBSE Result Grade", bg: "bg-indigo-700" },
              { n: "30+", l: "Years of Excellence", bg: "bg-marigold-500" },
              { n: "99%", l: "Board Pass Rate", bg: "bg-green-600" },
              { n: "50+", l: "Co-curricular Clubs", bg: "bg-purple-700" },
            ].map((c) => (
              <div key={c.l} className={`${c.bg} text-white rounded-2xl p-6 text-center`}>
                <p className="font-display text-4xl font-semibold">{c.n}</p>
                <p className="text-white/80 text-sm mt-2">{c.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Facilities ── */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-marigold-500 text-sm font-semibold uppercase tracking-wide text-center mb-3">Infrastructure</p>
          <h2 className="font-display text-4xl text-indigo-700 font-semibold text-center mb-12">World-Class Facilities</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FACILITIES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label}
                  className="border border-indigo-100 rounded-2xl p-6 hover:border-marigold-400
                             hover:shadow-lg transition-all group cursor-default">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4
                                  group-hover:bg-marigold-500 transition-colors">
                    <Icon size={22} className="text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-display text-lg text-indigo-700 font-semibold mb-2">{f.label}</h3>
                  <p className="text-indigo-400 text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6"
        style={{ background: "linear-gradient(135deg, #1C2340, #2C3670)" }}>
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="font-display text-4xl font-semibold mb-4">Ready to Join Our Family?</h2>
          <p className="text-indigo-300 mb-8">
            Applications for the 2026–27 academic year are now open. Apply online and our team
            will contact you within 48 hours.
          </p>
          <Link to="/admissions"
            className="bg-marigold-500 text-ink font-semibold px-10 py-4 rounded-2xl hover:bg-marigold-400
                       transition-all hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2">
            Apply Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-indigo-700 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoUrl} alt="logo" className="w-10 h-10 object-contain" />
              <div>
                <p className="font-display font-semibold">St. S.N. Public School</p>
                <p className="text-indigo-300 text-xs">Pindra, Varanasi</p>
              </div>
            </div>
            <p className="text-indigo-300 text-sm">Affiliated to CBSE, New Delhi. Providing quality education since 1985.</p>
          </div>
          <div>
            <p className="font-semibold mb-3 text-marigold-400">Quick Links</p>
            {[["Home", "/"], ["About", "/about"], ["Admissions", "/admissions"], ["Contact", "/contact"], ["Staff Login", "/login"]].map(([l, p]) => (
              <Link key={l} to={p} className="block text-indigo-300 hover:text-white text-sm mb-2 transition">{l}</Link>
            ))}
          </div>
          <div>
            <p className="font-semibold mb-3 text-marigold-400">Contact</p>
            <div className="space-y-2 text-sm text-indigo-300">
              <p className="flex items-center gap-2"><MapPin size={14} /> Pindra, Varanasi — 221209, U.P.</p>
              <p className="flex items-center gap-2"><Phone size={14} /> +91 98765 43210</p>
              <p className="flex items-center gap-2"><Mail size={14} /> info@snpublicschool.edu.in</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-indigo-400 text-xs">
          © {new Date().getFullYear()} St. S.N. Public School, Pindra, Varanasi. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
