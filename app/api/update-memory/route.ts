import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    // 1. Fetch current identity from Supabase
    const { data: currentIdentity, error: fetchError } = await supabase
      .from('user_identity')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!currentIdentity) {
      return NextResponse.json({ error: 'No user identity found in database. Please run the seed SQL script first.' }, { status: 400 });
    }

    // 2. Call Typhoon AI to extract updates, calendar events, and life logs
    const now = new Date();
    const todayStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const prompt = `
      You are an Information Extractor, Event Scheduler, and Life Logger. Analyze the user's free-form update and compare it against the current identity (provided as JSON).
      
      Today's Date & Context:
      - Today is: ${todayStr}
      - ISO Timestamp: ${now.toISOString()}
      - Current Year: ${now.getFullYear()}
      
      You must return a JSON object with THREE keys:
      1. "db_updates": Fields in user_identity that need to be updated (Current State).
      2. "calendar_events": An array of events to schedule if the user implies a future task, deadline, or shift.
      3. "life_log": An object representing a historical record of this update. It must contain:
         - "category": A string categorizing the event (e.g., "Competition", "Self-Improvement", "Career", "Health", "Social").
         - "content": A short, clear summary of what happened.
      
      Rules:
      - Top Priorities are Scholarship deadlines (specifically tracking activity reports) and job shifts.
      - Active Projects are ONLY [Project A] and [Project B]. Do NOT include, mention, or track any other external projects.
      - If the user mentions scholarship reports or job work, proactively suggest scheduling blocks in "calendar_events".
      - ALWAYS generate a "life_log" entry for every meaningful update.
      
      Example output structure:
      {
        "db_updates": { "scholarship": { "volunteer_hours": 10 } },
        "calendar_events": [
          {
            "summary": "Draft Siri-Viriya Activity Report",
            "start_time": "2026-05-20T20:00:00+07:00",
            "end_time": "2026-05-20T22:00:00+07:00",
            "description": "Scholarship requirement tracking."
          }
        ],
        "life_log": {
          "category": "Competition",
          "content": "Joined Samsung X KBTG competition"
        }
      }
      
      User input: "${text}"
      Current identity: ${JSON.stringify(currentIdentity)}
    `;

    const typhoonRes = await fetch('https://api.opentyphoon.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TYPHOON_API_KEY}`
      },
      body: JSON.stringify({
        model: 'typhoon-v2.5-30b-a3b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });

    if (!typhoonRes.ok) {
      const errorText = await typhoonRes.text();
      console.error("Typhoon API Error Response:", errorText);
      throw new Error(`Typhoon API failed with status ${typhoonRes.status}: ${errorText}`);
    }

    const typhoonData = await typhoonRes.json();
    
    if (!typhoonData.choices || !typhoonData.choices[0]) {
      console.error("Typhoon invalid response:", typhoonData);
      throw new Error("Typhoon API did not return valid choices");
    }
    
    const aiResponseText = typhoonData.choices[0].message.content;
    
    // Attempt to parse AI JSON response
    let extractedUpdates: any = {};
    try {
        const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
        extractedUpdates = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
        console.error("Failed to parse Typhoon JSON", aiResponseText);
        throw new Error("Invalid AI response format");
    }

    const dbUpdates = extractedUpdates.db_updates || {};
    const calendarEvents = extractedUpdates.calendar_events || [];

    // 3. Merge updates and save back to Supabase
    let updatedData = currentIdentity;
    if (Object.keys(dbUpdates).length > 0) {
      const updatedIdentity = { ...currentIdentity, ...dbUpdates, updated_at: new Date().toISOString() };
      
      const { error: updateError } = await supabase
        .from('user_identity')
        .update(updatedIdentity)
        .eq('id', currentIdentity.id);

      if (updateError) throw updateError;
      updatedData = updatedIdentity;
    }

    // 3.5 Insert into life_logs if present
    if (extractedUpdates.life_log) {
      const { error: logError } = await supabase
        .from('life_logs')
        .insert({
          content: extractedUpdates.life_log.content,
          category: extractedUpdates.life_log.category,
          raw_text: text
        });

      if (logError) {
        console.error("Failed to insert life log:", logError);
      }
    }

    // 4. Handle Calendar Events
    const insertedEvents = [];
    if (calendarEvents.length > 0) {
      const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
      const calendarId = process.env.GOOGLE_CALENDAR_ID;

      if (!clientId || !clientSecret || !refreshToken || !calendarId) {
        console.warn('Missing Google Calendar credentials for event creation');
      } else {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        for (const event of calendarEvents) {
          try {
            const response = await calendar.events.insert({
              calendarId: calendarId,
              requestBody: {
                summary: event.summary,
                description: event.description,
                start: { dateTime: event.start_time },
                end: { dateTime: event.end_time },
              },
            });
            insertedEvents.push(response.data);
          } catch (calError: any) {
            console.error('Failed to insert calendar event:', calError);
            // Don't throw, just log so DB updates still succeed
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      updatedData: updatedData,
      calendarEventsScheduled: insertedEvents.length
    });

  } catch (error: any) {
    console.error('Memory Update Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
