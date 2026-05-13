'use client';

import { useState, useRef } from 'react';
import { Send, FileText } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MemorySync() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [msg, setMsg] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTemplate = () => {
    const template = `Task: \nDue: \nDetail: \nLearning/Skill: `;
    const prevLength = text.length;
    setText(prev => prev + template);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(prevLength + 6, prevLength + 6);
      }
    }, 0);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/update-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      
      setMsg('Memory updated successfully!');
      setStatus('success');
      setText('');
      
      // Clear message after 3 seconds
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error updating memory');
      setStatus('error');
    }
  };

  return (
    <section className="p-6 bg-[#161b22] rounded-lg border border-[#30363d] mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⚙️</span>
        <h2 className="text-xl font-semibold text-[#f0f6fc]">Core Memory Sync</h2>
      </div>
      
      <textarea
        ref={textareaRef}
        className="w-full h-32 p-4 bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] rounded-md focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] placeholder:text-[#484f58] resize-none transition-all"
        placeholder="Log your progress... (e.g., Finished Jenkins script, or completed 2 hrs of volunteer work)"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      
      <div className="mt-2 flex justify-start">
        <button
          type="button"
          onClick={insertTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8b949e] bg-[#21262d] border border-[#30363d] rounded-md hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          📝 Task Template
        </button>
      </div>
      
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className={cn(
          "text-sm font-mono transition-opacity",
          status === 'success' ? "text-[#3fb950]" : status === 'error' ? "text-[#f85149]" : "text-transparent"
        )}>
          {msg || '...'}
        </p>
        
        <button
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-2.5 rounded-md font-semibold transition-colors w-full sm:w-auto",
            "bg-[#21262d] text-[#c9d1d9] border border-[#30363d]",
            "hover:bg-[#30363d]",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
          onClick={handleSubmit}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <span className="animate-pulse">Syncing...</span>
          ) : (
            <>
              Inject Data <Send className="w-4 h-4"/>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
