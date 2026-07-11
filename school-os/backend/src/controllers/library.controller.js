import { query } from "../config/db.js";

export async function listBooks(req, res) {
  const { search } = req.query;
  const { rows } = await query(
    `SELECT b.*, (b.total_copies - b.available_copies) AS issued_copies
     FROM library_books b
     WHERE ($1::text IS NULL OR b.title ILIKE $1 OR b.author ILIKE $1 OR b.barcode ILIKE $1)
     ORDER BY b.title`,
    [search ? `%${search}%` : null]
  );
  res.json({ books: rows });
}

export async function addBook(req, res) {
  const { title, author, isbn, barcode, totalCopies } = req.body;
  if (!title) return res.status(400).json({ error: "title is required." });
  const { rows } = await query(
    `INSERT INTO library_books (title, author, isbn, barcode, total_copies, available_copies)
     VALUES ($1,$2,$3,$4,$5,$5) RETURNING *`,
    [title, author || null, isbn || null, barcode || null, totalCopies || 1]
  );
  res.status(201).json({ book: rows[0] });
}

export async function issueBook(req, res) {
  const { bookId, studentId, dueDays } = req.body;
  if (!bookId || !studentId) return res.status(400).json({ error: "bookId and studentId are required." });

  const { rows: bk } = await query(`SELECT * FROM library_books WHERE id = $1`, [bookId]);
  if (!bk[0]) return res.status(404).json({ error: "Book not found." });
  if (bk[0].available_copies < 1) return res.status(409).json({ error: "No copies available." });

  const due = new Date();
  due.setDate(due.getDate() + (dueDays || 14));

  await query(`UPDATE library_books SET available_copies = available_copies - 1 WHERE id = $1`, [bookId]);
  const { rows } = await query(
    `INSERT INTO library_issues (book_id, student_id, due_date) VALUES ($1,$2,$3) RETURNING *`,
    [bookId, studentId, due.toISOString().slice(0, 10)]
  );
  res.status(201).json({ issue: rows[0] });
}

export async function returnBook(req, res) {
  const { issueId } = req.body;
  const { rows: issue } = await query(`SELECT * FROM library_issues WHERE id = $1`, [issueId]);
  if (!issue[0]) return res.status(404).json({ error: "Issue record not found." });
  if (issue[0].return_date) return res.status(409).json({ error: "Book already returned." });

  const today    = new Date();
  const due      = new Date(issue[0].due_date);
  const overdue  = Math.max(0, Math.ceil((today - due) / 86400000));
  const fine     = overdue * 2; // ₹2/day

  await query(`UPDATE library_books SET available_copies = available_copies + 1 WHERE id = $1`, [issue[0].book_id]);
  const { rows } = await query(
    `UPDATE library_issues SET return_date = CURRENT_DATE, fine = $1 WHERE id = $2 RETURNING *`,
    [fine, issueId]
  );
  res.json({ issue: rows[0], fine, overdueDays: overdue });
}

export async function listIssues(req, res) {
  const { studentId, returned } = req.query;
  const conditions = [];
  const params = [];

  if (studentId) { params.push(studentId); conditions.push(`li.student_id = $${params.length}`); }
  if (returned === "false") conditions.push(`li.return_date IS NULL`);
  if (returned === "true")  conditions.push(`li.return_date IS NOT NULL`);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await query(
    `SELECT li.*, lb.title, lb.barcode, s.name AS student_name, s.admission_no
     FROM library_issues li
     JOIN library_books lb ON lb.id = li.book_id
     JOIN students s ON s.id = li.student_id
     ${where}
     ORDER BY li.issue_date DESC`,
    params
  );
  res.json({ issues: rows });
}
