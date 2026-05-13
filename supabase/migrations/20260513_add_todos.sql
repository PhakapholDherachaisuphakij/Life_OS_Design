-- Migration to create the todos table with due_date
CREATE TABLE IF NOT EXISTS todos (
  id bigint primary key generated always as identity,
  title text not null,
  priority text,
  suggested_time text,
  reason text,
  completed boolean default false,
  due_date text,
  created_at timestamp default now()
);

-- Allow public access for now so the dashboard can interact with it
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
