import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatCard({ label, value, sub, trend, trendVal, color = "default", icon: Icon }) {
  const colors = {
    default: "bg-white border-indigo-100",
    success: "bg-green-50 border-green-200",
    warning: "bg-amber-50 border-amber-200",
    danger:  "bg-red-50 border-red-200",
    accent:  "bg-indigo-700 border-indigo-700 text-white",
  };
  const isAccent = color === "accent";

  return (
    <div className={`border rounded-2xl p-5 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow ${colors[color] || colors.default}`}>
      <div className="flex items-start justify-between">
        <p className={`text-xs font-medium uppercase tracking-wide ${isAccent ? "text-indigo-200" : "text-indigo-400"}`}>
          {label}
        </p>
        {Icon && (
          <div className={`p-2 rounded-xl ${isAccent ? "bg-white/10" : "bg-indigo-50"}`}>
            <Icon size={16} className={isAccent ? "text-white" : "text-indigo-500"} />
          </div>
        )}
      </div>

      <p className={`font-display text-2xl font-semibold ${isAccent ? "text-white" : "text-ink"}`}>
        {value ?? "—"}
      </p>

      <div className="flex items-center justify-between gap-2">
        {sub && (
          <p className={`text-xs ${isAccent ? "text-indigo-200" : "text-indigo-400"} truncate`}>{sub}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold flex-shrink-0 ${
            trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-indigo-400"
          }`}>
            {trend === "up" && <TrendingUp size={12} />}
            {trend === "down" && <TrendingDown size={12} />}
            {trend === "flat" && <Minus size={12} />}
            {trendVal && <span>{trendVal}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
