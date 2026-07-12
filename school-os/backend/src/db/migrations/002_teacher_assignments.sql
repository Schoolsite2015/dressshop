-- =====================================================================
-- MIGRATION 002 — Teacher ↔ Class/Section/Subject assignments
-- Additive & idempotent: safe to run on an existing seeded database.
-- Run with:  node src/db/run-migration.js 002_teacher_assignments.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id         UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id       UUID REFERENCES sections(id) ON DELETE CASCADE,
  subject_id       UUID REFERENCES subjects(id) ON DELETE SET NULL,
  is_class_teacher BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- one teacher can't hold the exact same class+section+subject twice
  UNIQUE (staff_id, class_id, section_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_staff   ON teacher_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class   ON teacher_assignments(class_id, section_id);
