'use client';

import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function MemoryQuery() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const quickCommands = [
    "Summarize my scholarship progress in a table",
    "List all my SCB milestones as bullet points",
    "Draft a professional summary for my resume"
  ];

  const handleQuery = async (searchQuery: string) => {
    const textToSearch = searchQuery || query;
    if (!textToSearch.trim()) return;
    
    setLoading(true);
    setAnswer('');
    try {
      const res = await fetch('/api/query-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSearch })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to query memory');
      
      setAnswer(data.answer);
    } catch (error: any) {
      console.error(error);
      setAnswer(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-6 bg-[#161b22] rounded-lg border border-[#30363d] mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#238636]" />
        <h2 className="text-xl font-semibold text-[#f0f6fc]">AI Memory Oracle</h2>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-[#484f58]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery(query)}
            placeholder="Ask AI about your life, achievements, or schedules..."
            className="w-full bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] rounded-md p-2 pl-10 focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] placeholder:text-[#484f58]"
          />
        </div>
        <button
          onClick={() => handleQuery(query)}
          disabled={loading}
          className="bg-[#238636] text-[#ffffff] font-semibold px-6 py-2.5 rounded-md hover:bg-[#2ea44f] transition-colors disabled:opacity-50 w-full sm:w-auto shrink-0"
        >
          {loading ? 'Querying...' : 'Ask Oracle'}
        </button>
      </div>

      {/* Quick Commands */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickCommands.map((cmd, index) => (
          <button
            key={index}
            onClick={() => {
              setQuery(cmd);
              handleQuery(cmd);
            }}
            className="text-xs bg-[#21262d] text-[#c9d1d9] border border-[#30363d] px-3 py-1.5 rounded-full hover:bg-[#30363d] transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* AI Response */}
      {answer && (
        <div className="mt-4 p-4 bg-[#0d1117] rounded-md border border-[#30363d]">
          <div className="prose prose-invert max-w-none text-[#c9d1d9] prose-headings:text-[#f0f6fc] prose-a:text-[#58a6ff] prose-strong:text-[#f0f6fc]">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        </div>
      )}
    </section>
  );
}
