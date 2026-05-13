import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { tasks, calendarEvents } = await request.json();
    
    // Load core identity from Supabase
    const { data: identity, error: fetchError } = await supabase
      .from('user_identity')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const apiKey = process.env.TYPHOON_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TYPHOON_API_KEY is not set' }, { status: 500 });
    }

    const systemPrompt = `
You are the "Core OS" for PK. Your job is to prioritize a list of tasks and schedule them based on his core identity, priorities, and today's schedule.

Core Identity:
${JSON.stringify(identity, null, 2)}

Today's Schedule (Calendar Events):
${JSON.stringify(calendarEvents, null, 2)}

Rules:
1. Enforce the Priority rule strictly. Prioritize tasks that are approaching their deadline (Due Date). If a task is for the Siri-Viriya scholarship or SCB work and is due soon, it MUST be ranked as 'High Priority' and placed at the top.
2. Analyze the tasks and assign them to specific free time slots available in today's schedule.
3. The user works best after 20:00. If there are high-priority tasks pending in the evening (especially Scholarship or SCB tasks), actively warn the user to avoid their main distraction (gaming) tonight.
4. Give a brief reason for each task's priority and suggested time slot.

Output your response in valid JSON format only, matching this structure:
[
  {
    "id": 1,
    "title": "Task title",
    "priority": "High/Medium/Low",
    "suggested_time": "HH:MM - HH:MM",
    "reason": "Reason based on identity, schedule, and due date"
  }
]
`;

    const response = await fetch('https://api.opentyphoon.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'typhoon-v2.5-30b-a3b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Prioritize these tasks: ${JSON.stringify(tasks)}` }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Typhoon API error: ${errorText}` }, { status: response.status });
    }

    const result = await response.json();
    let content = result.choices[0].message.content.trim();

    // Clean up markdown if present
    if (content.startsWith('```json')) content = content.slice(7);
    if (content.endsWith('```')) content = content.slice(0, -3);
    content = content.trim();

    const prioritizedTasks = JSON.parse(content);
    return NextResponse.json(prioritizedTasks);

  } catch (error: any) {
    console.error('Error in prioritize API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
