import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Fetch ALL data from life_logs and user_identity
    const { data: identity, error: identityError } = await supabase
      .from('user_identity')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (identityError) throw identityError;

    // Detect timeframe in query
    const now = new Date();
    let dateFilter = null;
    
    if (/this week|สัปดาห์นี้/i.test(query)) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      dateFilter = startOfWeek.toISOString();
    } else if (/last week|สัปดาห์ที่แล้ว/i.test(query)) {
      const startOfLastWeek = new Date(now);
      startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
      dateFilter = startOfLastWeek.toISOString();
    } else if (/this month|เดือนนี้/i.test(query)) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = startOfMonth.toISOString();
    } else if (/last month|เดือนที่แล้ว/i.test(query)) {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateFilter = startOfLastMonth.toISOString();
    } else if (/this year|ปีนี้/i.test(query)) {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = startOfYear.toISOString();
    }

    let logsQuery = supabase
      .from('life_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (dateFilter) {
      logsQuery = logsQuery.gte('created_at', dateFilter);
    }

    const { data: logs, error: logsError } = await logsQuery;

    if (logsError) throw logsError;

    // Use background from DB
    const backgroundContext = (identity as any)?.background || "";

    // 2. Construct the prompt with full context
    const prompt = `
      You are the user's Personal Memory Assistant (Oracle). Based on the provided background context, life logs, and identity data, answer the user's query.
      
      User Query: "${query}"
      
      Core Identity & Background Context:
      ${backgroundContext || "No background context found in database."}
      
      Current Identity Data (from DB):
      ${JSON.stringify(identity, null, 2)}
      
      Historical Life Logs (from DB):
      ${JSON.stringify(logs, null, 2)}
      
      Instructions:
      - Answer the query accurately based on the Core Identity, DB Identity, and Life Logs.
      - **IMPORTANT**: The Core Identity is your base background. If there is any contradiction between the Core Identity and the data from DB Identity or Life Logs, **always trust and prioritize the most recent information in the database**.
      - **Reporting**: If the user asks for a weekly/monthly/yearly summary or report, clearly group the accomplishments by category (e.g., Siri-Viriya, SCB, Studies). Highlight any major milestones or roadblocks encountered during this period.
      - Format the output EXACTLY as requested by the user (e.g., Markdown table, bullet points, professional email, resume summary).
      - If the user did not specify a format, use a clear, clean layout with bullet points or paragraphs.
      - If the information is not found in the data, say politely that you don't have that record yet.
      - Keep the tone helpful, professional, and honest.
    `;

    // 3. Call Typhoon AI
    const typhoonRes = await fetch('https://api.opentyphoon.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TYPHOON_API_KEY}`
      },
      body: JSON.stringify({
        model: 'typhoon-v2.5-30b-a3b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    if (!typhoonRes.ok) {
      const errorText = await typhoonRes.text();
      console.error("Typhoon API Error Response:", errorText);
      throw new Error(`Typhoon API failed with status ${typhoonRes.status}: ${errorText}`);
    }

    const typhoonData = await typhoonRes.json();
    const answer = typhoonData.choices[0].message.content;

    return NextResponse.json({ answer });

  } catch (error: any) {
    console.error('Memory Query Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
