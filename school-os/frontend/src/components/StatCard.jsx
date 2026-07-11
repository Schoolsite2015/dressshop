import { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ─── helpers ──────────────────────────────────────────── */
function parseNumeric(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const n = parseFloat(value.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatLike(original, num) {
  if (typeof original === "number") return Math.round(num);
  if (typeof original !== "string") return num;
  // preserve prefix/suffix (₹, k, %, etc.)
  const match = original.match(/^([^0-9.\-]*)([\d,.\-]+)(.*)$/);
  if (!match) return original;
  const [, prefix, , suffix] = match;
  const formatted = num % 1 !== 0 ? num.toFixed(1) : Math.round(num).toLocaleString("en-IN");
  return `${prefix}${formatted}${suffix}`;
}

/* ─── sparkline svg ──────────────────────────────────── */
function Sparkline({ data, color = "#6366f1", width = 64, height = 24 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* glow dot on the last value */}
      {(() => {
        const last = data[data.length - 1];
        const lx = width;
        const ly = height - ((last - min) / range) * (height - 4) - 2;
        return <circle cx={lx - 1} cy={ly} r="2" fill={color} />;
      })()}
    </svg>
  );
}

/* ─── main component ─────────────────────────────────── */
export default function StatCard({
  label,
  value,
  sub,
  trend,
  trendVal,
  color = "default",
  icon: Icon,
  sparkData,
  animate = true,
}) {
  /* ── color scheme ── */
  const colors = {
    default: "bg-white border-indigo-100",
    success: "bg-green-50 border-green-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
    accent: "bg-indigo-700 border-indigo-700 text-white",
  };
  const isAccent = color === "accent";

  /* ── count-up animation ── */
  const [display, setDisplay] = useState(animate ? formatLike(value, 0) : value);
  const targetNum = parseNumeric(value);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!animate || targetNum === null) {
      setDisplay(value ?? "—");
      return;
    }
    let start = 0;
    const duration = 900; // ms
    const t0 = performance.now();
    const step = (now) => {
      const progress = Math.min((now - t0) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = ease * targetNum;
      setDisplay(formatLike(value, current));
      if (progress < 1) animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [value, animate, targetNum]);

  /* ── mouse glow ── */
  const cardRef = useRef(null);
  const [glow, setGlow] = useState({ x: 50, y: 50, active: false });

  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setGlow((g) => ({ ...g, active: false }));
  }, []);

  /* ── sparkline color based on palette ── */
  const sparkColor = isAccent
    ? "#E8940F"
    : color === "success"
    ? "#10b981"
    : color === "warning"
    ? "#f59e0b"
    : color === "danger"
    ? "#ef4444"
    : "#6366f1";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative border rounded-2xl p-5 flex flex-col gap-2 shadow-sm
        transition-all duration-300 ease-out overflow-hidden cursor-default
        hover:shadow-lg hover:-translate-y-1
        ${colors[color] || colors.default}`}
    >
      {/* Mouse-tracking radial glow */}
      {glow.active && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(320px circle at ${glow.x}% ${glow.y}%, ${
              isAccent ? "rgba(232,148,15,0.12)" : "rgba(99,102,241,0.08)"
            }, transparent 70%)`,
          }}
        />
      )}

      {/* header row */}
      <div className="flex items-start justify-between relative z-[1]">
        <p
          className={`text-xs font-medium uppercase tracking-wide ${
            isAccent ? "text-indigo-200" : "text-indigo-400"
          }`}
        >
          {label}
        </p>
        {Icon && (
          <div
            className={`p-2 rounded-xl transition-transform duration-300 ${
              isAccent ? "bg-white/10" : "bg-indigo-50"
            } ${glow.active ? "scale-110" : ""}`}
          >
            <Icon
              size={16}
              className={isAccent ? "text-white" : "text-indigo-500"}
            />
          </div>
        )}
      </div>

      {/* value + sparkline row */}
      <div className="flex items-end justify-between gap-2 relative z-[1]">
        <p
          className={`font-display text-2xl font-semibold ${
            isAccent ? "text-white" : "text-ink"
          }`}
        >
          {display ?? "—"}
        </p>
        {sparkData && (
          <Sparkline data={sparkData} color={sparkColor} />
        )}
      </div>

      {/* bottom row: sub text & trend */}
      <div className="flex items-center justify-between gap-2 relative z-[1]">
        {sub && (
          <p
            className={`text-xs ${
              isAccent ? "text-indigo-200" : "text-indigo-400"
            } truncate`}
          >
            {sub}
          </p>
        )}
        {trend && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold flex-shrink-0 transition-transform duration-500 ${
              trend === "up"
                ? "text-green-600"
                : trend === "down"
                ? "text-red-500"
                : "text-indigo-400"
            }`}
          >
            {trend === "up" && (
              <TrendingUp
                size={12}
                className="animate-bounce"
                style={{ animationDuration: "2s" }}
              />
            )}
            {trend === "down" && (
              <TrendingDown
                size={12}
                className="animate-bounce"
                style={{ animationDuration: "2s" }}
              />
            )}
            {trend === "flat" && <Minus size={12} />}
            {trendVal && <span>{trendVal}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
