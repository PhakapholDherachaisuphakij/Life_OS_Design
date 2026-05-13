# Life OS Dashboard 🧠

An intelligent personal dashboard designed to manage your life, prioritize tasks, and synchronize your memory using AI. Powered by Typhoon AI, Supabase, and Google Calendar.

---

## 🚀 Core Features

- **AI Memory Oracle**: Query your life data, achievements, and logs. Ask AI questions and get formatted reports (tables, bullet points, etc.) based on your rich history.
- **Smart Memory Sync**: Log your daily updates (Brain Dump). The AI extracts tasks, categories, and logs them into your historical record automatically.
- **Time-Aware Querying**: Ask for weekly, monthly, or yearly summaries, and the system will automatically filter data to generate focused reports.
- **Dynamic To-Do List**: Manage tasks with due dates. Urgent tasks (due within 24 hours) feature a **Neon Red Glow** visual alert.
- **Google Calendar Automation**: Automatically creates calendar events and deadlines when tasks are added with a due date.
- **AI Prioritization**: Tasks are prioritized by AI based on upcoming deadlines and your specific life goals (e.g., Scholarships, Career).
- **Aesthetic UI**: A sleek, programmer-friendly dark interface inspired by GitHub Dark Minimal with a high-end feel.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI Engine**: Typhoon AI (OpenTyphoon API)
- **Integration**: Google Calendar API

## ⚙️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/PhakapholDherachaisuphakij/Life_OS_Design.git
cd Life_OS_Design
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory and fill in your credentials (DO NOT push this file to GitHub):

```env
# AI Configuration
TYPHOON_API_KEY="your_typhoon_api_key"

# Google Calendar OAuth
GOOGLE_OAUTH_CLIENT_ID="your_client_id"
GOOGLE_OAUTH_CLIENT_SECRET="your_client_secret"
GOOGLE_OAUTH_REFRESH_TOKEN="your_refresh_token"
GOOGLE_CALENDAR_ID="your_gmail_or_calendar_id"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Security
NEXT_PUBLIC_MEMORY_UPDATE_TOKEN="your_secret_token_for_auth_guard"
```

### 4. Database Setup (Supabase)
Run the following SQL commands in your Supabase SQL Editor to create the required tables and disable RLS for easy access:

```sql
-- Create Todos Table
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
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;

-- Add Background column to user_identity if missing
ALTER TABLE user_identity ADD COLUMN IF NOT EXISTS background text;
```

### 5. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## ☁️ Deployment on Vercel

To deploy this project on Vercel:
1. Push your clean repository to GitHub.
2. Import the project in Vercel.
3. Add all environment variables from your `.env` file to the Vercel project settings.
4. Since the system uses a Refresh Token for Google Calendar, you do not need to configure redirect URIs as long as the token is valid!

## 🔒 Security Note
Sensitive files such as `.env` and Google key files are excluded from Git via `.gitignore` to protect your privacy. Always ensure your API keys are kept secret.
