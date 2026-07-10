-- =====================================================================
-- S.N PUBLIC SCHOOL, PINDRA, VARANASI — SCHOOL OS DATABASE SCHEMA
-- Phase 1: full schema for every module. Fully wired modules (API+UI)
-- are marked [ACTIVE]. Everything else is [SCAFFOLDED] — the table
-- exists and is ready, but routes/UI are not built yet in this pass.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- CORE: USERS & ACADEMIC STRUCTURE [ACTIVE]
-- ---------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
  'principal', 'teacher', 'student', 'parent',
  'office', 'hr', 'transport', 'librarian', 'admin'
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE academic_years (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,          -- e.g. '2026-27'
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_current  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE classes (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,                -- 'Class 1' ... 'Class 12'
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE sections (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id  UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,            -- 'A', 'B', 'C'
  UNIQUE(class_id, name)
);

CREATE TABLE subjects (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- STUDENT INFORMATION SYSTEM [ACTIVE]
-- ---------------------------------------------------------------------

CREATE TABLE students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  admission_no    TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  dob             DATE,
  gender          TEXT,
  blood_group     TEXT,
  class_id        UUID REFERENCES classes(id),
  section_id      UUID REFERENCES sections(id),
  parent_user_id  UUID REFERENCES users(id),
  address         TEXT,
  admission_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'active', -- active | left | graduated
  photo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- STAFF / HR & PAYROLL [SCAFFOLDED]
-- ---------------------------------------------------------------------

CREATE TABLE staff (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_id   TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  designation   TEXT,
  department    TEXT,
  joining_date  DATE,
  salary_basic  NUMERIC(10,2),
  photo_url     TEXT
);

CREATE TABLE staff_attendance (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id  UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  status    TEXT NOT NULL, -- present | absent | leave | half_day
  UNIQUE(staff_id, date)
);

CREATE TABLE payroll (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  month         INT NOT NULL,
  year          INT NOT NULL,
  basic         NUMERIC(10,2) NOT NULL DEFAULT 0,
  allowances    NUMERIC(10,2) NOT NULL DEFAULT 0,
  deductions    NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_pay       NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_on       DATE,
  UNIQUE(staff_id, month, year)
);

-- ---------------------------------------------------------------------
-- ATTENDANCE (STUDENTS) [ACTIVE]
-- ---------------------------------------------------------------------

CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      TEXT NOT NULL, -- present | absent | late | half_day
  marked_by   UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- ---------------------------------------------------------------------
-- FEES [ACTIVE]
-- ---------------------------------------------------------------------

CREATE TABLE fee_structure (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        UUID REFERENCES classes(id),
  academic_year   TEXT NOT NULL,
  head            TEXT NOT NULL,     -- 'Tuition', 'Transport', 'Exam', ...
  amount          NUMERIC(10,2) NOT NULL,
  due_date        DATE
);

CREATE TABLE fee_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES fee_structure(id),
  amount        NUMERIC(10,2) NOT NULL,
  payment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  mode          TEXT,               -- cash | online | cheque | upi
  receipt_no    TEXT UNIQUE,
  status        TEXT NOT NULL DEFAULT 'paid' -- paid | pending | overdue
);

-- ---------------------------------------------------------------------
-- ADMISSIONS [ACTIVE]
-- ---------------------------------------------------------------------

CREATE TABLE admissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name    TEXT NOT NULL,
  dob               DATE,
  class_applied_for TEXT NOT NULL,
  parent_name       TEXT NOT NULL,
  phone             TEXT NOT NULL,
  email             TEXT,
  address           TEXT,
  documents         JSONB DEFAULT '[]',
  interview_slot    TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'submitted', -- submitted | shortlisted | interview | offered | admitted | rejected
  applied_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- EXAMS, MARKS & AI-GENERATED REPORT CARDS [ACTIVE]
-- ---------------------------------------------------------------------

CREATE TABLE exams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,        -- 'Term 1', 'Half-Yearly', ...
  class_id      UUID REFERENCES classes(id),
  academic_year TEXT NOT NULL
);

CREATE TABLE exam_subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id     UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES subjects(id),
  max_marks   NUMERIC(5,2) NOT NULL DEFAULT 100
);

CREATE TABLE marks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_subject_id   UUID NOT NULL REFERENCES exam_subjects(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marks_obtained    NUMERIC(5,2),
  UNIQUE(exam_subject_id, student_id)
);

CREATE TABLE report_cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id       UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  attendance_pct NUMERIC(5,2),
  behaviour_notes TEXT,              -- raw teacher input, fed to AI
  ai_remarks    TEXT,                -- AI-generated remarks
  generated_by  UUID REFERENCES users(id),
  generated_at  TIMESTAMPTZ,
  UNIQUE(student_id, exam_id)
);

-- ---------------------------------------------------------------------
-- TIMETABLE & HOMEWORK [SCAFFOLDED]
-- ---------------------------------------------------------------------

CREATE TABLE timetable_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES classes(id),
  section_id  UUID NOT NULL REFERENCES sections(id),
  day_of_week INT NOT NULL,          -- 1=Mon ... 6=Sat
  period_no   INT NOT NULL,
  subject_id  UUID REFERENCES subjects(id),
  teacher_id  UUID REFERENCES staff(id),
  room        TEXT
);

CREATE TABLE homework (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES classes(id),
  section_id  UUID REFERENCES sections(id),
  subject_id  UUID REFERENCES subjects(id),
  teacher_id  UUID REFERENCES staff(id),
  description TEXT NOT NULL,
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- TRANSPORT [SCAFFOLDED]
-- ---------------------------------------------------------------------

CREATE TABLE transport_routes (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL
);

CREATE TABLE buses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id      UUID REFERENCES transport_routes(id),
  number_plate  TEXT NOT NULL,
  driver_name   TEXT,
  driver_phone  TEXT,
  last_lat      NUMERIC(9,6),
  last_lng      NUMERIC(9,6),
  last_ping_at  TIMESTAMPTZ
);

CREATE TABLE student_transport (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  bus_id      UUID REFERENCES buses(id),
  pickup_point TEXT
);

-- ---------------------------------------------------------------------
-- LIBRARY [SCAFFOLDED]
-- ---------------------------------------------------------------------

CREATE TABLE library_books (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  author            TEXT,
  isbn              TEXT,
  barcode           TEXT UNIQUE,
  total_copies      INT NOT NULL DEFAULT 1,
  available_copies  INT NOT NULL DEFAULT 1
);

CREATE TABLE library_issues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     UUID NOT NULL REFERENCES library_books(id),
  student_id  UUID NOT NULL REFERENCES students(id),
  issue_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date    DATE NOT NULL,
  return_date DATE,
  fine        NUMERIC(6,2) DEFAULT 0
);

-- ---------------------------------------------------------------------
-- HOSTEL [SCAFFOLDED]
-- ---------------------------------------------------------------------

CREATE TABLE hostel_rooms (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_no   TEXT UNIQUE NOT NULL,
  capacity  INT NOT NULL
);

CREATE TABLE hostel_allocations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES hostel_rooms(id),
  student_id  UUID NOT NULL REFERENCES students(id),
  allocated_on DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ---------------------------------------------------------------------
-- INVENTORY [SCAFFOLDED]
-- ---------------------------------------------------------------------

CREATE TABLE inventory_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category  TEXT NOT NULL,   -- uniform | furniture | lab | sports | stationery | computers
  name      TEXT NOT NULL,
  quantity  INT NOT NULL DEFAULT 0,
  unit      TEXT DEFAULT 'pcs'
);

-- ---------------------------------------------------------------------
-- NOTICES, EVENTS, CERTIFICATES [SCAFFOLDED]
-- ---------------------------------------------------------------------

CREATE TABLE notices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  audience    TEXT NOT NULL DEFAULT 'all', -- all | teachers | parents | students
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  venue       TEXT
);

CREATE TABLE certificates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id),
  type          TEXT NOT NULL, -- bonafide | transfer | character | participation | merit
  issued_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  qr_code       TEXT,
  issued_by     UUID REFERENCES users(id)
);

-- ---------------------------------------------------------------------
-- ADMISSIONS APPLICATION -> ONLINE PORTAL PAYMENT LOG [SCAFFOLDED]
-- ---------------------------------------------------------------------
CREATE TABLE admission_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id    UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL,
  payment_ref     TEXT,
  paid_at         TIMESTAMPTZ
);

-- Indexes for common lookups
CREATE INDEX idx_students_class_section ON students(class_id, section_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_marks_student ON marks(student_id);
