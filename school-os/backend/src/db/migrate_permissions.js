import { query } from "../config/db.js";

async function run() {
  console.log("Starting safe migration...");

  try {
    console.log("Adding qr_code to students table...");
    await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;`);
    console.log("qr_code column added.");

    console.log("Creating teacher_class_assignments table...");
    await query(`
      CREATE TABLE IF NOT EXISTS teacher_class_assignments (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id       UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        class_id         UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        section_id       UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
        is_class_teacher BOOLEAN NOT NULL DEFAULT FALSE,
        UNIQUE(teacher_id, class_id, section_id)
      );
    `);
    console.log("teacher_class_assignments created.");

    console.log("Creating teacher_subject_assignments table...");
    await query(`
      CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id       UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        class_id         UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        section_id       UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
        subject_id       UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        UNIQUE(teacher_id, class_id, section_id, subject_id)
      );
    `);
    console.log("teacher_subject_assignments created.");

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
