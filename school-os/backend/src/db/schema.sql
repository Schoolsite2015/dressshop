-- =====================================================================
-- S.N PUBLIC SCHOOL, PINDRA, VARANASI — SCHOOL OS DATABASE SCHEMA
-- Phase 1: full schema for every module. Fully wired modules (API+UI)
-- are marked [ACTIVE]. Everything else is [SCAFFOLDED] — the table
-- exists and is ready, but routes/UI are not built yet in this pass.
-- =====================================================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active'
);
 -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- CORE: USERS & ACADEMIC STRUCTURE [ACTIVE]
-- ---------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
  'principal', 'teacher', 'student', 'parent',
  'office', 'hr', 'transport', 'librarian', 'admin', 'super_admin'
);

CREATE TABLE users (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email TEXT NOT NULL,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE academic_years (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,          -- e.g. '2026-27'
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_current  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE classes (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,                -- 'Class 1' ... 'Class 12'
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE sections (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id  UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,            -- 'A', 'B', 'C'
  UNIQUE(class_id, name)
);

CREATE TABLE subjects (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- STUDENT INFORMATION SYSTEM [ACTIVE]
-- ---------------------------------------------------------------------

CREATE TABLE students (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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

CREATE TABLE teacher_assignments (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  is_class_teacher BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (staff_id, class_id, section_id, subject_id)
);

CREATE TABLE staff_attendance (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id  UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  status    TEXT NOT NULL, -- present | absent | leave | half_day
  UNIQUE(staff_id, date)
);

CREATE TABLE payroll (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        UUID REFERENCES classes(id),
  academic_year   TEXT NOT NULL,
  head            TEXT NOT NULL,     -- 'Tuition', 'Transport', 'Exam', ...
  amount          NUMERIC(10,2) NOT NULL,
  due_date        DATE
);

CREATE TABLE fee_payments (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,        -- 'Term 1', 'Half-Yearly', ...
  class_id      UUID REFERENCES classes(id),
  academic_year TEXT NOT NULL
);

CREATE TABLE exam_subjects (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id     UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES subjects(id),
  max_marks   NUMERIC(5,2) NOT NULL DEFAULT 100
);

CREATE TABLE marks (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_subject_id   UUID NOT NULL REFERENCES exam_subjects(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marks_obtained    NUMERIC(5,2),
  UNIQUE(exam_subject_id, student_id)
);

CREATE TABLE report_cards (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL
);

CREATE TABLE buses (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id      UUID REFERENCES transport_routes(id),
  number_plate  TEXT NOT NULL,
  driver_name   TEXT,
  driver_phone  TEXT,
  gps_device_id TEXT UNIQUE,
  last_lat      NUMERIC(9,6),
  last_lng      NUMERIC(9,6),
  last_ping_at  TIMESTAMPTZ
);

CREATE TABLE student_transport (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  bus_id      UUID REFERENCES buses(id),
  pickup_point TEXT
);

-- ---------------------------------------------------------------------
-- LIBRARY [SCAFFOLDED]
-- ---------------------------------------------------------------------

CREATE TABLE library_books (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  author            TEXT,
  isbn              TEXT,
  barcode           TEXT UNIQUE,
  total_copies      INT NOT NULL DEFAULT 1,
  available_copies  INT NOT NULL DEFAULT 1
);

CREATE TABLE library_issues (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_no   TEXT UNIQUE NOT NULL,
  capacity  INT NOT NULL
);

CREATE TABLE hostel_allocations (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES hostel_rooms(id),
  student_id  UUID NOT NULL REFERENCES students(id),
  allocated_on DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ---------------------------------------------------------------------
-- INVENTORY [SCAFFOLDED]
-- ---------------------------------------------------------------------

CREATE TABLE inventory_items (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  audience    TEXT NOT NULL DEFAULT 'all', -- all | teachers | parents | students
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  venue       TEXT
);

CREATE TABLE certificates (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
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

-- ---------------------------------------------------------------------
-- VISITOR MANAGEMENT [ACTIVE]
-- ---------------------------------------------------------------------

CREATE TABLE visitors (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL,
  whom_to_meet TEXT,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'checked_in'
);

-- ---------------------------------------------------------------------
-- MOBILE & SECURITY [ACTIVE]
-- ---------------------------------------------------------------------

CREATE TABLE refresh_tokens (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- MULTI-TENANCY RLS POLICIES & CONSTRAINTS
-- ==========================================

ALTER TABLE users ADD CONSTRAINT users_email_tenant_unique UNIQUE (email, tenant_id);

-- ENABLING ROW LEVEL SECURITY --
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON users;
CREATE POLICY tenant_isolation ON users USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON academic_years;
CREATE POLICY tenant_isolation ON academic_years USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON classes;
CREATE POLICY tenant_isolation ON classes USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON sections;
CREATE POLICY tenant_isolation ON sections USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON subjects;
CREATE POLICY tenant_isolation ON subjects USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON students;
CREATE POLICY tenant_isolation ON students USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON staff;
CREATE POLICY tenant_isolation ON staff USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON staff_attendance;
CREATE POLICY tenant_isolation ON staff_attendance USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON payroll;
CREATE POLICY tenant_isolation ON payroll USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON attendance;
CREATE POLICY tenant_isolation ON attendance USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE fee_structure ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON fee_structure;
CREATE POLICY tenant_isolation ON fee_structure USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON fee_payments;
CREATE POLICY tenant_isolation ON fee_payments USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON admissions;
CREATE POLICY tenant_isolation ON admissions USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON exams;
CREATE POLICY tenant_isolation ON exams USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE exam_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON exam_subjects;
CREATE POLICY tenant_isolation ON exam_subjects USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON marks;
CREATE POLICY tenant_isolation ON marks USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON report_cards;
CREATE POLICY tenant_isolation ON report_cards USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON timetable_slots;
CREATE POLICY tenant_isolation ON timetable_slots USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON homework;
CREATE POLICY tenant_isolation ON homework USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON transport_routes;
CREATE POLICY tenant_isolation ON transport_routes USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON buses;
CREATE POLICY tenant_isolation ON buses USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE student_transport ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON student_transport;
CREATE POLICY tenant_isolation ON student_transport USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON library_books;
CREATE POLICY tenant_isolation ON library_books USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE library_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON library_issues;
CREATE POLICY tenant_isolation ON library_issues USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE hostel_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON hostel_rooms;
CREATE POLICY tenant_isolation ON hostel_rooms USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE hostel_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON hostel_allocations;
CREATE POLICY tenant_isolation ON hostel_allocations USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON inventory_items;
CREATE POLICY tenant_isolation ON inventory_items USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON notices;
CREATE POLICY tenant_isolation ON notices USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON events;
CREATE POLICY tenant_isolation ON events USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON certificates;
CREATE POLICY tenant_isolation ON certificates USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE admission_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON admission_payments;
CREATE POLICY tenant_isolation ON admission_payments USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON visitors;
CREATE POLICY tenant_isolation ON visitors USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON refresh_tokens;
CREATE POLICY tenant_isolation ON refresh_tokens USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON audit_logs;
CREATE POLICY tenant_isolation ON audit_logs USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON teacher_assignments;
CREATE POLICY tenant_isolation ON teacher_assignments USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);


