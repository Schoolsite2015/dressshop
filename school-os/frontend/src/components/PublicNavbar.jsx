import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logoUrl from "../assets/logo.png";

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${
        scrolled 
          ? "bg-[#020202]/70 backdrop-blur-md border-b border-white/10 shadow-lg" 
          : "bg-gradient-to-b from-black/80 to-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <img src={logoUrl} alt="logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(232,148,15,0.3)]"/>
          <div>
            <p className="font-display text-base sm:text-lg font-semibold text-white leading-tight tracking-wide">
              St. S.N. Public School
            </p>
            <p className="text-marigold-400 text-[10px] sm:text-xs tracking-widest uppercase mt-0.5">
              Pindra, Varanasi
            </p>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm">
          {[["Home","/"],["About","/about"],["Admissions","/admissions"]].map(([l,p])=>(
            <Link 
              key={l} 
              to={p} 
              className="text-white/80 hover:text-marigold-400 font-medium tracking-wide transition-colors"
            >
              {l}
            </Link>
          ))}
          <Link 
            to="/login" 
            className="ml-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95"
          >
            Staff / Student Login
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
