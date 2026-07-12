/**
 * useRealTimeData.js
 * ──────────────────
 * Custom hooks that power School OS dashboards with realistic,
 * animated, and auto-refreshing data. Designed for demo/preview
 * environments — swap the generators for real API calls in production.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   1. useAnimatedValue
   Smoothly interpolates a number from its previous value to a
   new target using requestAnimationFrame + ease-out cubic.
   ═══════════════════════════════════════════════════════════════ */
export function useAnimatedValue(targetValue, duration = 800) {
  const [current, setCurrent] = useState(targetValue);
  const prevRef = useRef(targetValue);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = targetValue;
    const diff = to - from;

    // No animation needed for identical values
    if (Math.abs(diff) < 0.001) {
      setCurrent(to);
      prevRef.current = to;
      return;
    }

    let start = null;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      if (!start) start = now;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = from + diff * easeOut(progress);

      setCurrent(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, duration]);

  return current;
}

/* ═══════════════════════════════════════════════════════════════
   2. useChartData
   Returns static-but-realistic demo data for various chart types.
   Data is memoised — regenerated only when `type` changes.
   ═══════════════════════════════════════════════════════════════ */

/** Seeded pseudo-random so charts are deterministic per session */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateAttendanceTrend(rand) {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const label = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    // Base attendance with realistic patterns
    let base = 85 + rand() * 8;
    if (dayOfWeek === 1) base -= 5 + rand() * 4; // Monday dip
    if (dayOfWeek === 6) base -= 8 + rand() * 5; // Saturday lower
    if (dayOfWeek === 0) base = 0; // Sunday = no school

    data.push({
      date: label,
      attendance: dayOfWeek === 0 ? null : Math.round(Math.min(98, Math.max(70, base)) * 10) / 10,
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek],
    });
  }
  return data;
}

function generateFeeCollection(rand) {
  const months = [
    "Apr", "May", "Jun", "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
  ];
  // Higher collections in admission months (Apr, Jul, Oct)
  const seasonalMultiplier = [1.6, 0.9, 0.7, 1.4, 0.8, 0.85, 1.3, 0.75, 0.65, 1.1, 0.8, 0.9];

  return months.map((month, i) => ({
    month,
    collected: Math.round((350000 + rand() * 150000) * seasonalMultiplier[i]),
    target: Math.round(500000 * seasonalMultiplier[i]),
  }));
}

function generateClassPerformance(rand) {
  const subjects = ["Math", "Science", "English", "Hindi", "Social", "Computer"];
  const classes = ["VI", "VII", "VIII", "IX", "X"];

  return classes.map((cls) => {
    const entry = { class: cls };
    subjects.forEach((sub) => {
      entry[sub] = Math.round(55 + rand() * 35);
    });
    return entry;
  });
}

function generateEnrollmentTrend(rand) {
  const months = [
    "Apr", "May", "Jun", "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
  ];
  let cumulative = 380;
  return months.map((month, i) => {
    // Big admission pushes in Apr and Jul
    const newAdmissions =
      i === 0 ? 45 + Math.round(rand() * 20) :
      i === 3 ? 30 + Math.round(rand() * 15) :
      Math.round(rand() * 8);
    cumulative += newAdmissions;
    return { month, students: cumulative, newAdmissions };
  });
}

function generateDailyRevenue(rand) {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const label = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    // No collections on Sunday
    const amount =
      dayOfWeek === 0 ? 0 : Math.round((15000 + rand() * 45000) / 100) * 100;

    data.push({ date: label, amount, day: dayOfWeek });
  }
  return data;
}

export function useChartData(type) {
  return useMemo(() => {
    const rand = seededRandom(type.length * 7 + 42);

    switch (type) {
      case "attendance-trend":
        return generateAttendanceTrend(rand);
      case "fee-collection":
        return generateFeeCollection(rand);
      case "class-performance":
        return generateClassPerformance(rand);
      case "enrollment-trend":
        return generateEnrollmentTrend(rand);
      case "daily-revenue":
        return generateDailyRevenue(rand);
      default:
        console.warn(`[useChartData] Unknown type "${type}"`);
        return [];
    }
  }, [type]);
}

/* ═══════════════════════════════════════════════════════════════
   3. useLiveFeed
   Returns an auto-refreshing array of activity feed items.
   New events are prepended every 5 seconds.
   ═══════════════════════════════════════════════════════════════ */

const EVENT_TEMPLATES = [
  {
    type: "fee_payment",
    templates: [
      "₹{amount} fee paid by {name} (Class {cls})",
      "{name} (Class {cls}) paid ₹{amount} online",
      "Cash payment of ₹{amount} received from {name}",
    ],
    icon: "💰",
    color: "text-green-600",
  },
  {
    type: "attendance",
    templates: [
      "Class {cls} attendance marked — {pct}% present",
      "{teacher} marked attendance for Class {cls}",
      "Late arrival recorded: {name} (Class {cls})",
    ],
    icon: "✅",
    color: "text-blue-600",
  },
  {
    type: "admission",
    templates: [
      "New admission: {name} enrolled in Class {cls}",
      "Admission form submitted for {name}",
      "Transfer certificate verified for {name}",
    ],
    icon: "🎓",
    color: "text-indigo-600",
  },
  {
    type: "library",
    templates: [
      "{name} issued '{book}' from library",
      "Book '{book}' returned by {name}",
      "Overdue notice sent to {name} for '{book}'",
    ],
    icon: "📚",
    color: "text-amber-600",
  },
  {
    type: "notice",
    templates: [
      "New circular: {notice}",
      "Staff notice published: {notice}",
      "Parent notification sent: {notice}",
    ],
    icon: "📢",
    color: "text-rose-600",
  },
];

const NAMES = [
  "Aarav Sharma", "Priya Patel", "Riya Singh", "Arjun Kumar",
  "Diya Gupta", "Kabir Mehta", "Ananya Reddy", "Vivaan Joshi",
  "Ishaan Nair", "Saanvi Verma", "Aditya Rao", "Mira Iyer",
  "Rohan Bhatt", "Tanvi Desai", "Kian Malhotra", "Zara Khan",
];

const TEACHERS = [
  "Mrs. Sharma", "Mr. Verma", "Ms. Pillai", "Mr. Reddy",
  "Mrs. Iyer", "Mr. Singh", "Ms. Gupta", "Mrs. Nair",
];

const BOOKS = [
  "The Jungle Book", "Huckleberry Finn", "A Brief History of Time",
  "Wings of Fire", "Discovery of India", "The White Tiger",
  "Malgudi Days", "The Guide", "Train to Pakistan",
];

const NOTICES = [
  "Annual Day preparations begin next week",
  "PTM scheduled for Saturday",
  "Holiday on account of Republic Day",
  "Sports Day trials from Monday",
  "Fee deadline extended to 15th",
  "Science exhibition entries open",
];

const CLASSES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEvent() {
  const category = pick(EVENT_TEMPLATES);
  let message = pick(category.templates);

  message = message
    .replace("{name}", pick(NAMES))
    .replace("{cls}", pick(CLASSES))
    .replace("{amount}", (Math.round((1000 + Math.random() * 25000) / 100) * 100).toLocaleString("en-IN"))
    .replace("{pct}", String(Math.round(75 + Math.random() * 23)))
    .replace("{teacher}", pick(TEACHERS))
    .replace("{book}", pick(BOOKS))
    .replace("{notice}", pick(NOTICES));

  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: category.type,
    message,
    timestamp: new Date(),
    icon: category.icon,
    color: category.color,
  };
}

/** Seed the feed with a few initial events */
function seedFeed(count = 6) {
  const items = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const evt = generateEvent();
    evt.timestamp = new Date(now - i * 30000); // 30s apart
    items.push(evt);
  }
  return items;
}

export function useLiveFeed() {
  const [feed, setFeed] = useState(() => seedFeed(6));

  useEffect(() => {
    const interval = setInterval(() => {
      setFeed((prev) => {
        const newEvent = generateEvent();
        // Keep only the latest 30 events to avoid memory creep
        return [newEvent, ...prev].slice(0, 30);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return feed;
}

/* ═══════════════════════════════════════════════════════════════
   4. useRealtimeStats
   Dashboard headline numbers that fluctuate every 10s
   to simulate a live data stream.
   ═══════════════════════════════════════════════════════════════ */

function baseStats() {
  return {
    totalStudents: 1247,
    totalTeachers: 68,
    totalStaff: 42,
    feesCollected: 3845000,
    feesPending: 1265000,
    attendanceToday: 1134,
    attendanceRate: 90.9,
  };
}

function jitter(value, range) {
  return value + Math.round((Math.random() - 0.5) * 2 * range);
}

export function useRealtimeStats() {
  const [stats, setStats] = useState(baseStats);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        totalStudents: prev.totalStudents, // enrolment doesn't fluctuate
        totalTeachers: prev.totalTeachers,
        totalStaff: prev.totalStaff,
        feesCollected: jitter(prev.feesCollected, 15000),
        feesPending: jitter(prev.feesPending, 10000),
        attendanceToday: Math.max(
          1050,
          Math.min(1247, jitter(prev.attendanceToday, 8))
        ),
        attendanceRate: Math.round(
          (Math.max(1050, Math.min(1247, jitter(prev.attendanceToday, 8))) /
            1247) *
            1000
        ) / 10,
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
