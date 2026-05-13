'use client';

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('life_os_auth');
    if (token === process.env.NEXT_PUBLIC_MEMORY_UPDATE_TOKEN) {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_MEMORY_UPDATE_TOKEN) {
      localStorage.setItem('life_os_auth', password);
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid master password.');
      setPassword('');
    }
  };

  if (isChecking) {
    return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-[#c9d1d9]">Loading Core OS...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-[#161b22] p-8 rounded-lg border border-[#30363d] max-w-sm w-full">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#21262d] rounded-full flex items-center justify-center mb-4 border border-[#30363d]">
              <Lock className="w-6 h-6 text-[#8b949e]" />
            </div>
            <h1 className="text-xl font-bold text-[#f0f6fc]">Restricted Access</h1>
            <p className="text-sm text-[#8b949e] text-center mt-2">Enter master password to access Life OS</p>
          </div>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] rounded-md p-3 mb-4 focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
            placeholder="Master Password"
            autoFocus
          />
          
          {error && <p className="text-[#f85149] text-sm mb-4 text-center">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-[#238636] text-[#ffffff] font-semibold py-3 rounded-md hover:bg-[#2ea44f] transition-colors"
          >
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
