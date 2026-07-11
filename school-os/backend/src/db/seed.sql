-- Sample seed data for S.N Public School, Pindra, Varanasi
-- Password for every seeded user is: Password@123
-- (bcrypt hash below is generated at insert time by seed.js instead —
--  this .sql file seeds structural/reference data; user accounts are
--  created by seed.js so passwords are hashed properly.)

INSERT INTO academic_years (label, start_date, end_date, is_current)
VALUES ('2026-27', '2026-04-01', '2027-03-31', TRUE);

INSERT INTO classes (name, sort_order) VALUES
('PG', 0), ('LKG', 1), ('UKG', 2),
('Class 1', 3), ('Class 2', 4), ('Class 3', 5), ('Class 4', 6), ('Class 5', 7),
('Class 6', 8), ('Class 8', 10), ('Class 9', 11), ('Class 10', 12);

INSERT INTO sections (class_id, name)
SELECT id, unnest(ARRAY['A','B'])
FROM classes WHERE name IN ('PG', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 6');

INSERT INTO subjects (name) VALUES
('Hindi'), ('English'), ('Mathematics'), ('Science'), ('Social Science'),
('Sanskrit'), ('Computer Science'), ('Physical Education'), ('Art');

INSERT INTO fee_structure (class_id, academic_year, head, amount, due_date)
SELECT id, '2026-27', 'Tuition Fee (Quarterly)', 6500, '2026-07-15'
FROM classes WHERE name = 'Class 8';

INSERT INTO notices (title, body, audience) VALUES
('Summer Vacation Notice', 'School will remain closed from 1 June to 15 June 2026 for summer break.', 'all'),
('PTM Scheduled', 'Parent-Teacher Meeting for Classes 6-10 on 20 July 2026, 10 AM onwards.', 'parents');

INSERT INTO events (title, description, event_date, venue) VALUES
('Annual Sports Day', 'Inter-house athletics and games competition.', '2026-12-15', 'School Ground'),
('Independence Day Celebration', 'Flag hoisting and cultural programme.', '2026-08-15', 'Main Hall');
