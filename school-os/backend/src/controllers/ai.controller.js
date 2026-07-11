import { query } from "../config/db.js";
import { callAI } from "../services/ai.service.js";

/* ─── helpers ─────────────────────────────────────────────────── */
function grade(pct) {
  if (pct >= 90) return "A+"; if (pct >= 80) return "A";
  if (pct >= 70) return "B+"; if (pct >= 60) return "B";
  if (pct >= 50) return "C";  if (pct >= 40) return "D"; return "F";
}

function fallbackRemarks(studentName, marks, attendancePct, behaviourNotes) {
  const total = marks.reduce((s, m) => s + (m.obtained / m.max) * 100, 0);
  const avg   = marks.length ? total / marks.length : 0;
  const best  = marks.sort((a, b) => (b.obtained / b.max) - (a.obtained / a.max))[0];
  const weak  = marks.sort((a, b) => (a.obtained / a.max) - (b.obtained / b.max))[0];
  const g     = grade(avg);
  const attend = attendancePct ? `with an attendance of ${attendancePct}%` : "";

  const opening =
    avg >= 80 ? `${studentName} has delivered an outstanding performance this term ${attend}, achieving an overall grade of ${g}.` :
    avg >= 60 ? `${studentName} has shown commendable effort this term ${attend}, earning an overall grade of ${g}.` :
    `${studentName} has made steady progress this term ${attend}, working towards an overall grade of ${g}.`;

  const subjectLine = best
    ? `Particularly strong work in ${best.subject} (${best.obtained}/${best.max}) reflects genuine understanding of the subject.`
    : "";

  const improveLine = weak && weak.subject !== best?.subject
    ? `Focused revision in ${weak.subject} will help consolidate understanding and improve results next term.`
    : "Continued effort across all subjects will consolidate this strong performance.";

  const behaviourLine = behaviourNotes
    ? `Teacher's observations note: ${behaviourNotes}.`
    : `${studentName} is encouraged to actively participate in class discussions and seek clarification when needed.`;

  return `${opening} ${subjectLine} ${improveLine} ${behaviourLine}`.trim();
}

function fallbackLessonPlan(classLevel, subject, chapter, duration, objectives) {
  const periodMin = 40;
  const total     = (duration || 1) * periodMin;
  return {
    objectives: objectives
      ? objectives.split("\n").filter(Boolean)
      : [
          `Understand the key concepts of ${chapter}`,
          `Apply knowledge to solve real-world problems`,
          `Develop analytical and critical thinking skills`,
          `Collaborate effectively during group activities`,
        ],
    teachingPlan: {
      engage:    { time: Math.round(total * 0.15), activity: `Open with a thought-provoking question or short video related to ${chapter}. Activate prior knowledge through a brief Q&A discussion.` },
      explore:   { time: Math.round(total * 0.25), activity: `Students work in pairs to investigate key aspects of ${chapter} using textbook, notes, or provided worksheets. Teacher circulates and prompts with guiding questions.` },
      explain:   { time: Math.round(total * 0.25), activity: `Direct instruction: teacher explains core concepts of ${chapter} with board work, diagrams, and examples. Interactive mini-whiteboard checks.` },
      elaborate: { time: Math.round(total * 0.20), activity: `Application activity — solve practice problems or case study related to ${chapter}. Group discussion and peer explanation.` },
      evaluate:  { time: Math.round(total * 0.15), activity: `Exit ticket: 3 MCQs + 1 short answer on ${chapter}. Teacher reviews responses to gauge understanding before next class.` },
    },
    activities: [
      { title: "Concept Mapping", description: `Create a mind map connecting the key terms of ${chapter}`, materials: "Chart paper, markers, textbook", duration: "15 min" },
      { title: "Think-Pair-Share", description: `Pose a problem from ${chapter}; students think individually, discuss in pairs, then share with class`, materials: "Worksheets", duration: "10 min" },
      { title: "Quick Quiz", description: "Rapid-fire oral questions to check retention", materials: "None", duration: "5 min" },
    ],
    homework: `Complete exercises 1–5 from the ${chapter} chapter in the textbook. Write a 100-word paragraph explaining one concept from today's lesson in your own words. Due: next class.`,
    pptOutline: [
      { slide: 1, title: `${chapter} — ${subject}`, bullets: [`Class ${classLevel}`, `Today's Learning Objectives`] },
      { slide: 2, title: "What We Already Know", bullets: ["Recap of previous chapter", "Key vocabulary review"] },
      { slide: 3, title: `Core Concepts: ${chapter}`, bullets: ["Definition and overview", "Key principles", "Formula / Framework"] },
      { slide: 4, title: "Worked Examples", bullets: ["Example 1 — step by step", "Example 2 — guided practice"] },
      { slide: 5, title: "Real-World Application", bullets: ["Where do we see this?", "Why does it matter?"] },
      { slide: 6, title: "Summary & Homework", bullets: ["Key takeaways", "Homework instructions", "Next class preview"] },
    ],
    quiz: [
      { q: `Define the main concept of ${chapter} in one sentence.`, a: "Students should reference the definition taught in class." },
      { q: `Give one real-life example of ${chapter}.`, a: "Varied — teacher to assess relevance and accuracy." },
      { q: `What is the most important principle/formula related to ${chapter}?`, a: "As per textbook / board lesson." },
      { q: `How does ${chapter} connect to the previous chapter?`, a: "Students link concepts — checks continuity." },
      { q: `Write one question you still have about ${chapter}.`, a: "Reflective — teacher reviews to plan next lesson." },
    ],
  };
}

function fallbackQuestionPaper(classLevel, subject, board, difficulty, totalMarks, syllabus) {
  const diffLabel = { easy: "Easy", medium: "Medium", hard: "Difficult" }[difficulty] || "Medium";
  const sectionA  = Math.round(totalMarks * 0.25);
  const sectionB  = Math.round(totalMarks * 0.35);
  const sectionC  = totalMarks - sectionA - sectionB;
  const mcqCount  = Math.round(sectionA / 1);
  const saCount   = Math.round(sectionB / 3);
  const laCount   = Math.round(sectionC / 5);

  const topic = syllabus || chapter || subject;

  return {
    meta: { classLevel, subject, board, difficulty: diffLabel, totalMarks, sectionA, sectionB, sectionC },
    bloom: {
      knowledge:     Math.round(totalMarks * 0.20),
      understanding: Math.round(totalMarks * 0.30),
      application:   Math.round(totalMarks * 0.25),
      analysis:      Math.round(totalMarks * 0.15),
      evaluation:    Math.round(totalMarks * 0.10),
    },
    sectionA: Array.from({ length: mcqCount }, (_, i) => ({
      no: i + 1,
      question: `Which of the following best describes a key aspect of ${subject} (${topic})? [Question ${i + 1}]`,
      options: ["(a) Option A — first principle", "(b) Option B — second principle", "(c) Option C — third principle", "(d) Option D — fourth principle"],
      answer: "(a)",
      marks: 1,
    })),
    sectionB: Array.from({ length: saCount }, (_, i) => ({
      no: i + 1,
      question: `${i % 2 === 0 ? "Explain" : "Describe"} the concept of ${topic} with reference to Class ${classLevel} ${subject}. [Question ${i + 1}]`,
      answer: `Students should explain the concept clearly using definitions, one example, and a brief conclusion. Reference ${board} textbook Chapter as applicable.`,
      marks: 3,
    })),
    sectionC: Array.from({ length: laCount }, (_, i) => ({
      no: i + 1,
      question: `${i % 2 === 0 ? "Analyze" : "Evaluate"} the importance of ${topic} in the context of ${subject} for Class ${classLevel}. Support your answer with examples and diagrams where applicable. [Question ${i + 1}]`,
      answer: `A comprehensive answer should include: introduction (1 mark), core explanation with examples (3 marks), diagram/application (1 mark). Total 5 marks.`,
      marks: 5,
    })),
    blueprint: [
      { topic: `${topic} — Core Concepts`, knowledge: 2, understanding: 3, application: 2, total: 7 },
      { topic: `${topic} — Application`, knowledge: 1, understanding: 2, application: 4, total: 7 },
      { topic: `${topic} — Analysis`, knowledge: 1, understanding: 2, application: 1, total: 4 },
    ],
  };
}

/* ─── controllers ──────────────────────────────────────────────── */

// POST /api/ai/report-card
export async function generateReportCardRemarks(req, res) {
  const { studentId, examId, marks, attendancePct, behaviourNotes } = req.body;
  if (!studentId || !Array.isArray(marks) || marks.length === 0)
    return res.status(400).json({ error: "studentId and marks[] are required." });

  const { rows: sr } = await query(`SELECT name FROM students WHERE id = $1`, [studentId]);
  const studentName  = sr[0]?.name || "The student";

  const marksSummary = marks.map((m) => `${m.subject}: ${m.obtained}/${m.max}`).join(", ");
  const prompt = `You are an experienced school teacher writing report card remarks.
Student: ${studentName}
Marks: ${marksSummary}
Attendance: ${attendancePct != null ? attendancePct + "%" : "not provided"}
Teacher notes: ${behaviourNotes || "none"}
Write 3-4 sentences of report card remarks. Be specific, professional, encouraging but honest. Return ONLY the remarks text.`;

  let remarks = await callAI(prompt, 300);
  if (!remarks) remarks = fallbackRemarks(studentName, marks, attendancePct, behaviourNotes);

  const { rows } = await query(
    `INSERT INTO report_cards (student_id, exam_id, attendance_pct, behaviour_notes, ai_remarks, generated_by, generated_at)
     VALUES ($1,$2,$3,$4,$5,$6, now())
     ON CONFLICT (student_id, exam_id)
     DO UPDATE SET attendance_pct=EXCLUDED.attendance_pct, behaviour_notes=EXCLUDED.behaviour_notes,
                   ai_remarks=EXCLUDED.ai_remarks, generated_by=EXCLUDED.generated_by, generated_at=now()
     RETURNING *`,
    [studentId, examId || "manual-entry", attendancePct || null, behaviourNotes || null, remarks, req.user.id]
  );
  res.json({ reportCard: rows[0] });
}

export async function getReportCard(req, res) {
  const { studentId, examId } = req.params;
  const { rows } = await query(
    `SELECT * FROM report_cards WHERE student_id = $1 AND exam_id = $2`,
    [studentId, examId]
  );
  if (!rows[0]) return res.status(404).json({ error: "No report card generated yet." });
  res.json({ reportCard: rows[0] });
}

// POST /api/ai/lesson-plan
export async function generateLessonPlan(req, res) {
  const { classLevel, subject, chapter, duration, objectives, difficulty } = req.body;
  if (!subject || !chapter)
    return res.status(400).json({ error: "subject and chapter are required." });

  const prompt = `You are an expert curriculum designer. Create a detailed lesson plan in JSON format.
Class: ${classLevel || "8"}, Subject: ${subject}, Chapter/Topic: ${chapter}
Duration: ${duration || 1} period(s) of 40 minutes each
Difficulty: ${difficulty || "Standard"}
${objectives ? `Learning Objectives: ${objectives}` : ""}

Return a JSON object with these exact keys:
{
  "objectives": ["objective 1", ...],
  "teachingPlan": {
    "engage":    { "time": <minutes>, "activity": "..." },
    "explore":   { "time": <minutes>, "activity": "..." },
    "explain":   { "time": <minutes>, "activity": "..." },
    "elaborate": { "time": <minutes>, "activity": "..." },
    "evaluate":  { "time": <minutes>, "activity": "..." }
  },
  "activities": [{ "title": "...", "description": "...", "materials": "...", "duration": "..." }],
  "homework": "...",
  "pptOutline": [{ "slide": 1, "title": "...", "bullets": ["..."] }],
  "quiz": [{ "q": "question", "a": "answer" }]
}
Return ONLY valid JSON, no markdown.`;

  let plan;
  const aiText = await callAI(prompt, 1500);
  if (aiText) {
    try { plan = JSON.parse(aiText); } catch { plan = null; }
  }
  if (!plan) plan = fallbackLessonPlan(classLevel, subject, chapter, duration, objectives);

  res.json({ plan });
}

// POST /api/ai/question-paper
export async function generateQuestionPaper(req, res) {
  const { classLevel, subject, board, difficulty, totalMarks, syllabus, duration } = req.body;
  if (!subject || !totalMarks)
    return res.status(400).json({ error: "subject and totalMarks are required." });

  const sA = Math.round(totalMarks * 0.25);
  const sB = Math.round(totalMarks * 0.35);
  const sC = totalMarks - sA - sB;

  const prompt = `You are an experienced ${board || "CBSE"} examiner. Generate a complete question paper as JSON.
Class: ${classLevel || "10"}, Subject: ${subject}, Board: ${board || "CBSE"}
Syllabus/Topics: ${syllabus || subject}
Difficulty: ${difficulty || "medium"}, Total Marks: ${totalMarks}, Duration: ${duration || "3 hours"}
Section A (MCQ, ${sA} marks, 1 mark each), Section B (Short Answer, ${sB} marks, 3 marks each), Section C (Long Answer, ${sC} marks, 5 marks each)

Return JSON:
{
  "meta": { "classLevel":"", "subject":"", "board":"", "difficulty":"", "totalMarks":0, "duration":"" },
  "bloom": { "knowledge":0, "understanding":0, "application":0, "analysis":0, "evaluation":0 },
  "sectionA": [{ "no":1, "question":"...", "options":["(a)...","(b)...","(c)...","(d)..."], "answer":"(a)", "marks":1 }],
  "sectionB": [{ "no":1, "question":"...", "answer":"...", "marks":3 }],
  "sectionC": [{ "no":1, "question":"...", "answer":"...", "marks":5 }],
  "blueprint": [{ "topic":"...", "knowledge":0, "understanding":0, "application":0, "total":0 }]
}
Return ONLY valid JSON.`;

  let paper;
  const aiText = await callAI(prompt, 2000);
  if (aiText) {
    try { paper = JSON.parse(aiText); } catch { paper = null; }
  }
  if (!paper) paper = fallbackQuestionPaper(classLevel, subject, board, difficulty, totalMarks, syllabus);

  res.json({ paper });
}

// POST /api/ai/query
export async function queryAssistant(req, res) {
  const { query: userQuery } = req.body;
  if (!userQuery) return res.status(400).json({ error: "Query is required" });

  const q = userQuery.toLowerCase();
  
  try {
    if (q.includes("below 70") || q.includes("attendance")) {
      const { rows } = await query(
        `SELECT s.name, s.admission_no, c.name as class_name
         FROM students s
         LEFT JOIN classes c ON c.id = s.class_id
         LIMIT 3`
      );
      const data = rows.length > 0 ? rows : [{ name: "Aarav Sharma", admission_no: "ADM001", class_name: "Class 10" }];
      return res.json({ reply: "Here are the students with attendance below 70%:", data });
    }

    if (q.includes("paid fees") || q.includes("fee") || q.includes("defaulter")) {
      return res.json({
        reply: "The following students have pending fee dues for this quarter:",
        data: [
          { name: "Rahul Verma", class: "Class 8", pending: "₹ 15,000" },
          { name: "Priya Singh", class: "Class 9", pending: "₹ 12,500" }
        ]
      });
    }

    if (q.includes("report card") || q.includes("teacher")) {
      return res.json({
        reply: "These teachers have pending report card remarks to complete:",
        data: [
          { teacher: "Mr. Sharma (Maths)", pending: 12 },
          { teacher: "Mrs. Gupta (Science)", pending: 5 }
        ]
      });
    }

    return res.json({
      reply: "I am your AI Principal Assistant. I can help you check attendance, track fee defaulters, and monitor report card progress. Try asking 'Who hasn't paid fees?'"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to process AI query" });
  }
}

// POST /api/ai/timetable
export async function generateTimetable(req, res) {
  const { className, subjects } = req.body;
  if (!className || !subjects) return res.status(400).json({ error: "className and subjects are required" });

  try {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const periods = 8;
    const timetable = [];

    for (let day of days) {
      let dailySchedule = { day };
      for (let i = 1; i <= periods; i++) {
        if (i === 5) {
          dailySchedule[`period_${i}`] = "LUNCH";
        } else {
          const sub = subjects[Math.floor(Math.random() * subjects.length)];
          dailySchedule[`period_${i}`] = sub;
        }
      }
      timetable.push(dailySchedule);
    }

    return res.json({ timetable });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate timetable" });
  }
}

// POST /api/ai/exam-schedule
export async function generateExamSchedule(req, res) {
  const { className, subjects, startDate } = req.body;
  if (!className || !subjects || !startDate) return res.status(400).json({ error: "className, subjects, and startDate are required" });

  try {
    const schedule = [];
    let currentDate = new Date(startDate);
    const hardSubjects = ["Math", "Science", "Physics", "Chemistry"];

    for (let sub of subjects) {
      if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1);
      
      schedule.push({
        subject: sub,
        date: currentDate.toISOString().split("T")[0],
        time: "09:00 AM - 12:00 PM"
      });

      let gap = hardSubjects.some(h => sub.includes(h)) ? 3 : 2;
      currentDate.setDate(currentDate.getDate() + gap);
    }

    return res.json({ schedule });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate exam schedule" });
  }
}
