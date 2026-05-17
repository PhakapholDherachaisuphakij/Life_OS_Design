import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      return NextResponse.json({ error: 'Missing GOOGLE_CALENDAR_ID environment variable' }, { status: 500 });
    }

    // ---------- OAuth2 client (Refresh Token) ----------
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json({ error: 'Missing Google OAuth credentials' }, { status: 500 });
    }
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch events for today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startOfDay,
      timeMax: endOfDay,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return NextResponse.json(response.data.items || []);
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
