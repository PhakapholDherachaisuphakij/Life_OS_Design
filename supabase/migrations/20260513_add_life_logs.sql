-- Migration to add life_logs table for historical records
CREATE TABLE IF NOT EXISTS life_logs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamp default now(),
  content       text,
  category      text,
  raw_text      text
);
