import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import TodoList from '../components/TodoList';
import MemorySync from '../components/MemorySync';
import MemoryQuery from '../components/MemoryQuery';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DailyData {
  markdown_content: string;
  prime_directive: string;
  action_items: string[];
  stakeholder_intel: {
    SCB: string;
    Professors: string;
    Friends: string;
  };
}

async function getDailyData() {
  try {
    const { data, error } = await supabase
      .from('user_identity')
      .select('daily_data')
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    if (data?.daily_data) {
      return data.daily_data as DailyData;
    }
  } catch (e) {
    console.error('Failed to fetch from Supabase, falling back to local file', e);
  }

  // Fallback to local file
  const localPath = path.join(process.cwd(), 'daily_data.json');
  if (fs.existsSync(localPath)) {
    try {
      const fileContent = fs.readFileSync(localPath, 'utf8');
      return JSON.parse(fileContent) as DailyData;
    } catch (e) {
      console.error('Failed to read local daily_data.json', e);
    }
  }

  return null;
}

export default async function Home() {
  let data: DailyData | null = null;
  let error: string | null = null;

  try {
    data = await getDailyData();
  } catch (err: any) {
    error = err.message || 'An error occurred';
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a0f1a] flex items-center justify-center text-red-500">
        <div className="text-2xl font-bold font-serif text-center p-8 border-2 border-red-500 rounded-lg">
          [ SYSTEM ERROR ]<br />
          {error}
          <div className="text-sm mt-4 text-gray-400">
            Please check if daily_data.json exists locally or GITHUB_PAT is set.
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9] p-6 font-sans">
      <div className="max-w-5xl mx-auto border border-[#30363d] p-8 rounded-lg bg-[#0d1117]">
        
        {/* Header */}
        <header className="text-left mb-10 border-b border-[#30363d] pb-6">
          <h1 className="text-3xl font-bold text-[#f0f6fc] mb-2">
            PK's Core OS Dashboard
          </h1>
          <p className="text-[#8b949e]">
            Daily Strategy & Priority Enforcement
          </p>
        </header>

        {/* AI Oracle Query Section */}
        <MemoryQuery />

        {/* Core Memory Sync Section */}
        <MemorySync />

        {/* Prime Directive */}
        <section className="mt-8 mb-10 bg-[#161b22] p-6 rounded-lg border border-[#30363d]">
          <h2 className="text-xl font-semibold text-[#f0f6fc] mb-3 flex items-center">
            <span className="mr-2 text-[#238636]">⚡</span> Prime Directive
          </h2>
          <p className="text-lg text-[#c9d1d9]">
            {data?.prime_directive || "No directive set for today."}
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Action Items */}
          <section className="bg-[#161b22] p-6 rounded-lg border border-[#30363d]">
            <h2 className="text-xl font-semibold text-[#f0f6fc] mb-4 border-b border-[#30363d] pb-2">
              Action Items
            </h2>
            <ul className="space-y-3">
              {data?.action_items.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-[#238636] mr-2">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Stakeholder Intel */}
          <section className="bg-[#161b22] p-6 rounded-lg border border-[#30363d]">
            <h2 className="text-xl font-semibold text-[#f0f6fc] mb-4 border-b border-[#30363d] pb-2">
              Stakeholder Intel
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-[#f0f6fc]">SCB</h3>
                <p className="text-[#8b949e]">{data?.stakeholder_intel.SCB}</p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#f0f6fc]">Professors</h3>
                <p className="text-[#8b949e]">{data?.stakeholder_intel.Professors}</p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#f0f6fc]">Friends</h3>
                <p className="text-[#8b949e]">{data?.stakeholder_intel.Friends}</p>
              </div>
            </div>
          </section>
        </div>
        {/* To-Do List Section */}
        <TodoList />
        {/* Full Strategy */}
        <section className="mt-10 bg-[#161b22] p-6 rounded-lg border border-[#30363d]">
          <h2 className="text-xl font-semibold text-[#f0f6fc] mb-4 border-b border-[#30363d] pb-2">
            Full Strategy Log
          </h2>
          <div className="prose prose-invert max-w-none text-[#c9d1d9]">
            <pre className="whitespace-pre-wrap font-mono text-sm text-[#8b949e]">
              {data?.markdown_content}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
