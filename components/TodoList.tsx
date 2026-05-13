'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: number;
  title: string;
  priority?: string;
  suggested_time?: string;
  reason?: string;
  completed: boolean;
  due_date?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Fetch Calendar Events on load
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const response = await fetch('/api/calendar');
        if (!response.ok) throw new Error('Failed to fetch calendar');
        const data = await response.json();
        setCalendarEvents(data);
      } catch (err: any) {
        setCalendarError(err.message || 'Error fetching calendar');
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchCalendar();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/todos');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) setTasks(data);
        }
      } catch (err) {
        console.error('Failed to load tasks', err);
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    const tempTask: Task = { id: Date.now(), title: newTask, completed: false, due_date: newDueDate || undefined };
    setTasks(prev => [...prev, tempTask]);
    
    const titleToSave = newTask;
    const dateToSave = newDueDate;
    
    setNewTask('');
    setNewDueDate('');

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleToSave, due_date: dateToSave || null })
      });
      if (res.ok) {
        const saved = await res.json();
        setTasks(prev => prev.map(t => t.id === tempTask.id ? saved : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComplete = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    
    try {
      await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !task.completed })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const prioritizeTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, calendarEvents }),
      });
      
      if (!response.ok) throw new Error('Failed to prioritize');
      
      const prioritized = await response.json();
      setTasks(prioritized);
      
      // Save prioritized fields
      await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prioritized),
      });
    } catch (error) {
      console.error(error);
      alert('Failed to prioritize tasks. Check if Typhoon API is working.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      {/* Calendar Section */}
      <div className="bg-[#161b22] p-6 rounded-lg border border-[#30363d]">
        <h2 className="text-xl font-semibold text-[#f0f6fc] mb-4 border-b border-[#30363d] pb-2 flex items-center">
          <span className="mr-2">📅</span> Today's Schedule
        </h2>
        
        {calendarLoading ? (
          <div className="text-[#8b949e] animate-pulse">Loading schedule...</div>
        ) : calendarError ? (
          <div className="text-[#f85149] text-sm">
            Error: {calendarError}
            <br />
            <span className="text-[#8b949e] text-xs">Make sure you shared your calendar with the service account email.</span>
          </div>
        ) : calendarEvents.length === 0 ? (
          <div className="text-[#8b949e] italic">No events scheduled for today.</div>
        ) : (
          <ul className="space-y-2">
            {calendarEvents.map((event) => (
              <li key={event.id} className="flex justify-between items-center bg-[#0d1117] p-3 rounded-md border border-[#30363d]">
                <span className="text-[#c9d1d9]">{event.summary}</span>
                <span className="text-[#238636] text-sm font-mono">
                  {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* To-Do List Section */}
      <div className="bg-[#161b22] p-6 rounded-lg border border-[#30363d]">
        <h2 className="text-xl font-semibold text-[#f0f6fc] mb-4 border-b border-[#30363d] pb-2">
          Core OS To-Do List
        </h2>
        
        {/* Add Task */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Enter a new task..."
            className="flex-1 bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] rounded-md p-2 focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] placeholder:text-[#484f58]"
          />
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] rounded-md p-2 focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] w-full sm:w-auto text-[#8b949e]"
          />
          <button
            onClick={addTask}
            className="bg-[#238636] text-[#ffffff] font-semibold px-6 py-2 rounded-md hover:bg-[#2ea44f] transition-colors w-full sm:w-auto"
          >
            Add
          </button>
        </div>

        {/* Task List */}
        <ul className="space-y-3 mb-4">
          {tasksLoading ? (
            <li className="text-[#8b949e] animate-pulse">Loading tasks...</li>
          ) : tasks.length === 0 ? (
            <li className="text-[#8b949e] italic">No tasks pending.</li>
          ) : tasks.map((task) => {
            let dueSoon = false;
            let isOverdue = false;
            if (task.due_date && !task.completed) {
              const due = new Date(task.due_date).getTime();
              const now = new Date().getTime();
              const diffHours = (due - now) / (1000 * 60 * 60);
              if (diffHours < 0) isOverdue = true;
              else if (diffHours <= 24) dueSoon = true;
            }

            return (
              <li key={task.id} className={`border p-3 rounded-md bg-[#0d1117] transition-all ${
                dueSoon ? 'border-[#ff003c] shadow-[0_0_8px_rgba(255,0,60,0.6)] text-[#ff3366]' :
                isOverdue ? 'border-[#d29922] opacity-70' : 'border-[#30363d]'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-start sm:items-center gap-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id)}
                      className="accent-[#238636] mt-1 sm:mt-0"
                    />
                    <div className="flex flex-col">
                      <span className={`${dueSoon ? 'text-[#ff3366] font-bold tracking-wide' : 'text-[#c9d1d9]'} ${task.completed ? 'line-through text-[#8b949e] font-normal' : ''}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {task.due_date && (
                          <span className={`text-xs font-mono px-1.5 rounded bg-[#21262d] ${dueSoon ? 'text-[#ff003c]' : 'text-[#8b949e]'}`}>
                            📅 Due: {task.due_date}
                          </span>
                        )}
                        {task.suggested_time && (
                          <span className="text-[#58a6ff] text-xs font-semibold font-mono">
                            ⏰ {task.suggested_time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {task.priority && (
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      task.priority === 'High' ? 'border-[#f85149] text-[#f85149] bg-[#f851491a]' :
                      task.priority === 'Medium' ? 'border-[#d29922] text-[#d29922] bg-[#d299221a]' :
                      'border-[#3fb950] text-[#3fb950] bg-[#3fb9501a]'
                    }`}>
                      {task.priority}
                    </span>
                  )}
                </div>
                {task.reason && (
                  <p className="text-xs text-[#8b949e] mt-2 ml-6">{task.reason}</p>
                )}
              </li>
            );
          })}
        </ul>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={prioritizeTasks}
            disabled={loading}
            className={`bg-[#21262d] text-[#c9d1d9] border border-[#30363d] font-semibold px-4 py-2 rounded-md hover:bg-[#30363d] flex items-center gap-2 transition-colors ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'Analyzing...' : '⚡ Prioritize with Typhoon'}
          </button>
          
          <span className="text-sm text-[#8b949e] italic">
            Prioritization enforces Core Identity rules and schedule.
          </span>
        </div>
      </div>
    </div>
  );
}
