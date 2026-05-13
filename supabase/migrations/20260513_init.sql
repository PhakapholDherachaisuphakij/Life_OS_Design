-- Table: user_identity
CREATE TABLE IF NOT EXISTS user_identity (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name          TEXT,
  role          TEXT,
  scholarship   JSONB,        
  scb_contract  JSONB,        
  kmutt_student JSONB,        
  side_projects JSONB[]       
);

-- Table: long_term_goals
CREATE TABLE IF NOT EXISTS long_term_goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES user_identity(id) ON DELETE CASCADE,
  goal_type     TEXT NOT NULL,
  description   TEXT,
  progress_json JSONB,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_term_goals ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now since it's a personal app, but you can restrict later)
CREATE POLICY "Allow all operations for user_identity" ON user_identity FOR ALL USING (true);
CREATE POLICY "Allow all operations for long_term_goals" ON long_term_goals FOR ALL USING (true);

-- Function to update 'updated_at' column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_identity_modtime
BEFORE UPDATE ON user_identity
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_long_term_goals_modtime
BEFORE UPDATE ON long_term_goals
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
