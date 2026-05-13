-- Seed data for user_identity
INSERT INTO user_identity (name, role, scholarship, scb_contract, kmutt_student, side_projects)
VALUES (
  'John Doe',
  'Full-Stack Engineer',
  '{"name":"Scholarship Name", "volunteer_hours": 0, "hours_needed": 20, "expense_reports_submitted": false}',
  '{"title":"QA Engineer", "project":"Project Name", "milestones": []}',
  '{"year":2, "focus":"Computer Science"}',
  ARRAY[
    '{"name":"Project A", "role":"Lead", "status":"active"}'::jsonb,
    '{"name":"Project B", "role":"Contributor", "status":"planned"}'::jsonb
  ]
) ON CONFLICT DO NOTHING;
