import { query } from "../config/db.js";

const DAYS = [1, 2, 3, 4, 5, 6]; // Mon-Sat
const PERIODS_PER_DAY = 6;

// GET /timetable?classId=&sectionId=
export async function getTimetable(req, res) {
  const { classId, sectionId } = req.query;
  if (!classId || !sectionId) return res.status(400).json({ error: "classId and sectionId are required." });

  const { rows } = await query(
    `SELECT t.day_of_week, t.period_no, t.room, s.name AS subject_name, st.name AS teacher_name
     FROM timetable_slots t
     LEFT JOIN subjects s ON s.id = t.subject_id
     LEFT JOIN staff st ON st.id = t.teacher_id
     WHERE t.class_id = $1 AND t.section_id = $2
     ORDER BY t.day_of_week, t.period_no`,
    [classId, sectionId]
  );

  // Shape into a day -> period grid for the UI
  const grid = {};
  DAYS.forEach((d) => { grid[d] = Array.from({ length: PERIODS_PER_DAY }, () => null); });
  rows.forEach((r) => { grid[r.day_of_week][r.period_no - 1] = r; });

  res.json({ days: DAYS, periodsPerDay: PERIODS_PER_DAY, grid });
}

// A teacher's personal timetable across all classes — used by the Teacher dashboard.
export async function getTeacherTimetable(req, res) {
  const { teacherId } = req.params;
  const { rows } = await query(
    `SELECT t.day_of_week, t.period_no, t.room, s.name AS subject_name,
            c.name AS class_name, sec.name AS section_name
     FROM timetable_slots t
     LEFT JOIN subjects s ON s.id = t.subject_id
     LEFT JOIN classes c ON c.id = t.class_id
     LEFT JOIN sections sec ON sec.id = t.section_id
     WHERE t.teacher_id = $1
     ORDER BY t.day_of_week, t.period_no`,
    [teacherId]
  );
  res.json({ slots: rows });
}

// POST /timetable/generate
// body: { classId, sectionId, subjects: [{ subjectId, teacherId, periodsPerWeek }] }
// Greedy generator: expands subjects by their weekly period count, then
// fills the Mon-Sat x 6-period grid, skipping a slot for a subject if its
// teacher is already booked elsewhere at that exact day/period (checked
// against the live DB, so it respects every other class already generated).
export async function generateTimetable(req, res) {
  const { classId, sectionId, subjects } = req.body;
  if (!classId || !sectionId || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ error: "classId, sectionId and subjects[] are required." });
  }

  // Expand into a queue: one entry per period needed, subjects interleaved
  // (round-robin) rather than blocked, so a day isn't all-Maths.
  const queues = subjects.map((s) => ({ ...s, remaining: s.periodsPerWeek }));
  const expanded = [];
  let anyLeft = true;
  while (anyLeft) {
    anyLeft = false;
    for (const q of queues) {
      if (q.remaining > 0) {
        expanded.push({ subjectId: q.subjectId, teacherId: q.teacherId });
        q.remaining -= 1;
        anyLeft = anyLeft || q.remaining > 0;
      }
    }
  }

  const totalSlots = DAYS.length * PERIODS_PER_DAY;
  if (expanded.length > totalSlots) {
    return res.status(400).json({ error: `Requested ${expanded.length} periods/week but only ${totalSlots} slots exist in the week.` });
  }

  // Clear any existing timetable for this class/section before regenerating.
  await query(`DELETE FROM timetable_slots WHERE class_id = $1 AND section_id = $2`, [classId, sectionId]);

  const placed = [];
  const unplaced = [];
  let cursor = 0;

  for (const day of DAYS) {
    for (let period = 1; period <= PERIODS_PER_DAY; period++) {
      if (cursor >= expanded.length) break;

      // find the next queued item whose teacher is free at this day/period
      let idx = cursor;
      let found = null;
      for (let tries = 0; tries < expanded.length - cursor; tries++) {
        const candidate = expanded[idx];
        if (!candidate) break;
        if (candidate.teacherId) {
          const { rows: conflict } = await query(
            `SELECT 1 FROM timetable_slots WHERE teacher_id = $1 AND day_of_week = $2 AND period_no = $3`,
            [candidate.teacherId, day, period]
          );
          if (conflict.length > 0) { idx += 1; continue; }
        }
        found = candidate;
        expanded.splice(idx, 1);
        break;
      }

      if (!found) { continue; } // leave this slot free for now

      const { rows } = await query(
        `INSERT INTO timetable_slots (class_id, section_id, day_of_week, period_no, subject_id, teacher_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [classId, sectionId, day, period, found.subjectId, found.teacherId || null]
      );
      placed.push(rows[0]);
    }
  }

  if (expanded.length > 0) {
    unplaced.push(...expanded); // couldn't place due to teacher conflicts
  }

  res.json({ placed: placed.length, unplaced: unplaced.length, unplacedDetail: unplaced });
}
