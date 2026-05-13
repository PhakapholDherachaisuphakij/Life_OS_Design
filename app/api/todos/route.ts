import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      // If table doesn't exist yet, return an empty array
      return NextResponse.json([]);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const task = await req.json();
    
    // 1. Save to Supabase
    const { data, error } = await supabase
      .from('todos')
      .insert([task])
      .select()
      .single();

    if (error) throw error;

    // 2. Add to Google Calendar if there is a due date
    if (task.due_date) {
      const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
      const calendarId = process.env.GOOGLE_CALENDAR_ID;

      if (clientId && clientSecret && refreshToken && calendarId) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        const isAllDay = datePattern.test(task.due_date);

        const event: any = {
          summary: `[Deadline] ${task.title}`,
          description: `Automatically created from Life OS.\n${task.reason || ''}`,
        };

        if (isAllDay) {
          event.start = { date: task.due_date };
          event.end = { date: task.due_date };
        } else {
          // If it has a time component
          event.start = { dateTime: new Date(task.due_date).toISOString() };
          event.end = { dateTime: new Date(new Date(task.due_date).getTime() + 60 * 60 * 1000).toISOString() }; // +1 hour
        }

        try {
          await calendar.events.insert({
            calendarId: calendarId,
            requestBody: event,
          });
          console.log('Added deadline to calendar:', event.summary);
        } catch (calError) {
          console.error('Failed to add calendar event:', calError);
        }
      }
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error adding todo:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, completed } = await req.json();
    const { data, error } = await supabase
      .from('todos')
      .update({ completed })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Support updating entire list (for prioritization)
export async function PUT(req: Request) {
  try {
    const tasks = await req.json();
    for (const task of tasks) {
      if (task.id) {
        await supabase
          .from('todos')
          .update({ 
            priority: task.priority,
            suggested_time: task.suggested_time,
            reason: task.reason
          })
          .eq('id', task.id);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
