/**
 * ScrollAnimations.jsx
 * ────────────────────
 * A production-grade scroll animation library for School OS.
 * Uses Framer Motion for performant, GPU-accelerated animations
 * triggered when elements scroll into the viewport.
 *
 * Every component is a thin wrapper — zero layout opinions,
 * so they compose cleanly with any design system.
 */

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useMotionValue,
} from "framer-motion";

/* ────────────────────────────────────────────────────────────
   1. FadeInUp — fades + rises into view
   ──────────────────────────────────────────────────────────── */
export function FadeInUp({
  delay = 0,
  duration = 0.5,
  className = "",
  children,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   2. SlideInLeft — slides from the left edge
   ──────────────────────────────────────────────────────────── */
export function SlideInLeft({
  delay = 0,
  duration = 0.6,
  className = "",
  children,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -60 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   3. SlideInRight — slides from the right edge
   ──────────────────────────────────────────────────────────── */
export function SlideInRight({
  delay = 0,
  duration = 0.6,
  className = "",
  children,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 60 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   4. ScaleIn — scales from 0.8 to 1
   ──────────────────────────────────────────────────────────── */
export function ScaleIn({
  delay = 0,
  duration = 0.5,
  className = "",
  children,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
      }
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   5. StaggerContainer + StaggerItem — orchestrated staggers
   ──────────────────────────────────────────────────────────── */
const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: (staggerDelay) => ({
    opacity: 1,
    transition: { staggerChildren: staggerDelay, delayChildren: 0.1 },
  }),
};

export function StaggerContainer({
  staggerDelay = 0.1,
  className = "",
  children,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      custom={staggerDelay}
      variants={staggerContainerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export function StaggerItem({ className = "", children }) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   6. CountUp — smooth rAF-powered number counter
   ──────────────────────────────────────────────────────────── */
export function CountUp({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    let startTime = null;
    let rafId;
    const durationMs = duration * 1000;

    /** Ease-out cubic for a natural deceleration feel */
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutCubic(progress);
      const currentValue = easedProgress * end;

      setDisplay(currentValue.toFixed(decimals));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, end, duration, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   7. ParallaxSection — scroll-linked parallax offset
   ──────────────────────────────────────────────────────────── */
export function ParallaxSection({
  speed = 0.5,
  className = "",
  children,
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Maps scroll progress [0,1] → a Y offset in px
  const y = useTransform(scrollYProgress, [0, 1], [speed * 80, -speed * 80]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   8. GlowCard — mouse-tracking radial gradient glow
   ──────────────────────────────────────────────────────────── */
export function GlowCard({
  className = "",
  glowColor = "rgba(99, 102, 241, 0.15)",
  children,
}) {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Glow layer — sits behind content */}
      {isHovered && (
        <motion.div
          className="pointer-events-none absolute -inset-px z-0"
          style={{
            background: `radial-gradient(320px circle at ${mouseX.get()}px ${mouseY.get()}px, ${glowColor}, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      {/* Card content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   9. AnimatedProgress — fills a progress bar when visible
   ──────────────────────────────────────────────────────────── */
export function AnimatedProgress({
  value = 0,
  color = "#6366f1",
  className = "",
  height = "8px",
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  return (
    <div
      ref={ref}
      className={`w-full overflow-hidden rounded-full bg-gray-100 ${className}`}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: "0%" }}
        animate={isInView ? { width: `${Math.min(value, 100)}%` } : { width: "0%" }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   10. TypeWriter — types text character by character
   ──────────────────────────────────────────────────────────── */
export function TypeWriter({
  text = "",
  speed = 50,
  className = "",
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!isInView || !text) return;

    setDisplayed(""); // reset on new text
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [isInView, text, speed]);

  return (
    <span ref={ref} className={className}>
      {displayed}
      {/* Blinking cursor while typing */}
      {displayed.length < text.length && isInView && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="inline-block ml-0.5"
        >
          |
        </motion.span>
      )}
    </span>
  );
}
