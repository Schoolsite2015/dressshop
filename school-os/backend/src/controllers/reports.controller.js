import { query } from "../config/db.js";

export async function getReportsHubData(req, res) {
  try {
    // 1. Total Students and Sections
    const { rows: studentRows } = await query(`SELECT COUNT(*) as count FROM students`);
    const totalStudents = parseInt(studentRows[0].count, 10);
    
    const { rows: sectionRows } = await query(`SELECT COUNT(*) as count FROM sections`);
    const totalSections = parseInt(sectionRows[0].count, 10);

    // 2. Avg Attendance (Current Month)
    const { rows: attRows } = await query(`
      SELECT 
        COUNT(*) as total, 
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance
      WHERE date >= date_trunc('month', current_date)
    `);
    
    let avgAttendance = 0;
    if (attRows[0].total > 0) {
      avgAttendance = (parseInt(attRows[0].present, 10) / parseInt(attRows[0].total, 10)) * 100;
    }

    // 3. Pass Percentage
    const { rows: passRows } = await query(`
      SELECT 
        COUNT(*) as total_marks,
        SUM(CASE WHEN (m.marks_obtained / NULLIF(es.max_marks, 0)) >= 0.33 THEN 1 ELSE 0 END) as passed_marks
      FROM marks m
      JOIN exam_subjects es ON m.exam_subject_id = es.id
    `);
    
    let passPercentage = 0;
    if (passRows[0].total_marks > 0) {
      passPercentage = (parseInt(passRows[0].passed_marks, 10) / parseInt(passRows[0].total_marks, 10)) * 100;
    }

    // 4. Fee Collection
    const { rows: feeCollected } = await query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments WHERE status = 'paid'
    `);
    const { rows: feeExpected } = await query(`
      SELECT COALESCE(SUM(fs.amount), 0) as total 
      FROM fee_structure fs
      JOIN students s ON s.class_id = fs.class_id
    `);
    
    let feeCollectionRate = 0;
    const collected = parseFloat(feeCollected[0].total) || 0;
    const expected = parseFloat(feeExpected[0].total) || 0;
    
    if (expected > 0) {
      feeCollectionRate = (collected / expected) * 100;
    } else if (collected > 0) {
      feeCollectionRate = 100;
    }

    // 5. Class-wise Attendance
    const { rows: classAttRows } = await query(`
      SELECT c.name as class_name, 
             SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
             SUM(CASE WHEN a.status != 'present' THEN 1 ELSE 0 END) as absent_count
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.sort_order
    `);

    const classAttendance = classAttRows.map(row => {
      const p = parseInt(row.present_count, 10) || 0;
      const a = parseInt(row.absent_count, 10) || 0;
      const t = p + a;
      return {
        class: row.class_name,
        present: t > 0 ? Math.round((p / t) * 100) : 0,
        absent: t > 0 ? Math.round((a / t) * 100) : 0
      };
    });

    // 6. Grade Distribution
    const { rows: marksRows } = await query(`
      SELECT m.marks_obtained, es.max_marks
      FROM marks m
      JOIN exam_subjects es ON m.exam_subject_id = es.id
    `);
    
    const grades = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    marksRows.forEach(row => {
      const score = parseFloat(row.marks_obtained);
      const max = parseFloat(row.max_marks);
      if (max > 0) {
        const pct = (score / max) * 100;
        if (pct >= 90) grades['A+']++;
        else if (pct >= 80) grades['A']++;
        else if (pct >= 70) grades['B+']++;
        else if (pct >= 60) grades['B']++;
        else if (pct >= 50) grades['C']++;
        else if (pct >= 33) grades['D']++;
        else grades['F']++;
      }
    });

    const gradeDistribution = Object.keys(grades).map(k => ({ grade: k, count: grades[k] }));

    // 7. Average Subject Performance
    const { rows: subjectAvgRows } = await query(`
      SELECT sub.name as subject, 
             AVG((m.marks_obtained / NULLIF(es.max_marks, 0)) * 100) as avg_pct
      FROM marks m
      JOIN exam_subjects es ON m.exam_subject_id = es.id
      JOIN subjects sub ON es.subject_id = sub.id
      GROUP BY sub.id, sub.name
    `);

    const subjectPerformance = subjectAvgRows.map(row => ({
      subject: row.subject,
      score: Math.round(parseFloat(row.avg_pct)) || 0,
      fullMark: 100
    }));

    res.json({
      overview: {
        totalStudents,
        totalSections,
        avgAttendance: avgAttendance.toFixed(1),
        passPercentage: passPercentage.toFixed(1),
        feeCollectionRate: feeCollectionRate.toFixed(1)
      },
      charts: {
        attendanceData: classAttendance,
        gradeData: gradeDistribution,
        subjectAvgData: subjectPerformance
      }
    });

  } catch (err) {
    console.error("getReportsHubData error:", err);
    res.status(500).json({ error: "Failed to fetch reports hub data." });
  }
}
