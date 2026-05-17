import os
import sys
import json
import datetime
import requests

# 1. Parse local .env file if it exists
if os.path.exists(".env"):
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                # Handle possible inline comments
                if " #" in line:
                    line = line.split(" #", 1)[0].strip()
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

# 2. Get environment variables
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
typhoon_api_key = os.environ.get("TYPHOON_API_KEY")
google_client_id = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
google_client_secret = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
google_refresh_token = os.environ.get("GOOGLE_OAUTH_REFRESH_TOKEN")
google_calendar_id = os.environ.get("GOOGLE_CALENDAR_ID")

if not supabase_url or not supabase_key:
    print("Error: Supabase environment variables are missing.")
    sys.exit(1)

if not typhoon_api_key:
    print("Error: TYPHOON_API_KEY environment variable is missing.")
    sys.exit(1)

# 3. Setup Supabase headers
sb_headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}"
}

print("Fetching data from Supabase...")

# 4. Fetch User Identity
try:
    res_identity = requests.get(f"{supabase_url}/rest/v1/user_identity?select=*", headers=sb_headers)
    res_identity.raise_for_status()
    identities = res_identity.json()
    if not identities:
        print("Error: No user identity found in Supabase.")
        sys.exit(1)
    identity = identities[0]
    print(f"Found identity for: {identity.get('name')}")
except Exception as e:
    print(f"Failed to fetch user identity: {e}")
    sys.exit(1)

# 5. Fetch Active Todos (completed = false)
try:
    res_todos = requests.get(f"{supabase_url}/rest/v1/todos?completed=eq.false&select=*", headers=sb_headers)
    res_todos.raise_for_status()
    todos = res_todos.json()
    print(f"Fetched {len(todos)} active todos.")
except Exception as e:
    print(f"Failed to fetch todos: {e}")
    todos = []

# 6. Fetch Today's Google Calendar Events
calendar_events = []
if google_client_id and google_client_secret and google_refresh_token and google_calendar_id:
    print("Fetching today's Google Calendar events...")
    try:
        # Refresh Access Token
        token_url = "https://oauth2.googleapis.com/token"
        token_payload = {
            "client_id": google_client_id,
            "client_secret": google_client_secret,
            "refresh_token": google_refresh_token,
            "grant_type": "refresh_token"
        }
        res_token = requests.post(token_url, data=token_payload)
        res_token.raise_for_status()
        access_token = res_token.json().get("access_token")

        if access_token:
            # Set today's date range
            now = datetime.datetime.utcnow()
            # Start of today (UTC)
            start_of_day = datetime.datetime(now.year, now.month, now.day, 0, 0, 0).isoformat() + "Z"
            # End of today (UTC)
            end_of_day = datetime.datetime(now.year, now.month, now.day, 23, 59, 59).isoformat() + "Z"

            calendar_url = f"https://www.googleapis.com/calendar/v3/calendars/{google_calendar_id}/events"
            params = {
                "timeMin": start_of_day,
                "timeMax": end_of_day,
                "singleEvents": "true",
                "orderBy": "startTime"
            }
            cal_headers = {
                "Authorization": f"Bearer {access_token}"
            }
            res_cal = requests.get(calendar_url, params=params, headers=cal_headers)
            res_cal.raise_for_status()
            calendar_events = res_cal.json().get("items", [])
            print(f"Fetched {len(calendar_events)} calendar events.")
        else:
            print("Warning: Failed to retrieve access token.")
    except Exception as e:
        print(f"Warning: Failed to fetch calendar events: {e}")
else:
    print("Warning: Google OAuth credentials or Calendar ID missing. Skipping Calendar integration.")

# 7. Call Typhoon AI to generate Daily Strategy
print("Invoking Typhoon AI...")
system_prompt = f"""
You are the "Core OS" for PK (Phakaphol). Your job is to analyze his core identity, active todos, and today's calendar schedule to generate a comprehensive Daily Strategy.

Core Identity:
{json.dumps(identity, indent=2, ensure_ascii=False)}

Today's Schedule (Calendar Events):
{json.dumps(calendar_events, indent=2, ensure_ascii=False)}

Active Todos:
{json.dumps(todos, indent=2, ensure_ascii=False)}

Rules to Enforce:
1. ENFORCE PRIORITIES STRICTLY: Tasks approaching due dates or related to the Siri-Viriya scholarship (especially activity reporting) or SCB QA work must be prioritized.
2. SCHEDULING: Suggest productive time slots for tasks based on his calendar events (avoid conflicts).
3. NIGHT PRODUCTIVITY: The user works best after 20:00. If there are high-priority tasks pending, add a clear warning to avoid his main distraction (gaming) tonight.
4. OUTCOME EXPECTED: Generate a Prime Directive, Action Items, Stakeholder Intel, and a beautiful markdown strategy report in Thai.

You must output a valid JSON object matching the following structure:
{{
  "prime_directive": "A single core motivating priority sentence for today (in Thai).",
  "action_items": [
    "Action item 1 (in Thai)",
    "Action item 2 (in Thai)",
    "Action item 3 (in Thai)"
  ],
  "stakeholder_intel": {{
    "SCB": "Strategy or update regarding SCB tasks/contract (in Thai).",
    "Professors": "Strategy or update regarding University/Professors (in Thai).",
    "Friends": "Social focus or update regarding friends (in Thai)."
  }},
  "markdown_content": "A beautifully styled markdown report in Thai, containing a header, today's focus, prioritized schedule, priority rules enforced, and custom warning boxes or highlights to motivate him."
}}
"""

try:
    typhoon_url = "https://api.opentyphoon.ai/v1/chat/completions"
    payload = {
        "model": "typhoon-v2.5-30b-a3b-instruct",
        "messages": [
            {"role": "user", "content": system_prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 2048,
        "response_format": {"type": "json_object"}
    }
    tf_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {typhoon_api_key}"
    }
    
    res_tf = requests.post(typhoon_url, json=payload, headers=tf_headers)
    res_tf.raise_for_status()
    tf_res_json = res_tf.json()
    
    ai_content = tf_res_json["choices"][0]["message"]["content"].strip()
    
    # Strip markdown code blocks if AI returned them
    if ai_content.startswith("```json"):
        ai_content = ai_content[7:]
    if ai_content.endswith("```"):
        ai_content = ai_content[:-3]
    ai_content = ai_content.strip()
    
    try:
        strategy_data = json.loads(ai_content)
        print("Successfully generated daily strategy via Typhoon AI!")
    except json.JSONDecodeError as jde:
        print(f"JSON Parsing Error: {jde}")
        print("Raw AI response content was:")
        print(ai_content)
        sys.exit(1)
except Exception as e:
    print(f"Failed to generate strategy from Typhoon AI: {e}")
    sys.exit(1)

# 8. Save results
print("Saving strategy results...")

# A. Save locally to daily_data.json
try:
    with open("daily_data.json", "w", encoding="utf-8") as f:
        json.dump(strategy_data, f, indent=2, ensure_ascii=False)
    print("Saved daily_data.json")
except Exception as e:
    print(f"Failed to save daily_data.json: {e}")

# B. Save locally to Priority_Daily.md
try:
    with open("Priority_Daily.md", "w", encoding="utf-8") as f:
        f.write(strategy_data.get("markdown_content", "# Daily Strategy"))
    print("Saved Priority_Daily.md")
except Exception as e:
    print(f"Failed to save Priority_Daily.md: {e}")

# C. Save to Supabase
try:
    update_url = f"{supabase_url}/rest/v1/user_identity?id=eq.{identity['id']}"
    update_headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    update_payload = {
        "daily_data": strategy_data
    }
    res_update = requests.patch(update_url, json=update_payload, headers=update_headers)
    res_update.raise_for_status()
    print("Successfully updated user_identity.daily_data in Supabase!")
except Exception as e:
    print(f"Warning: Failed to update Supabase record: {e}")

print("Daily strategy processing completed successfully!")
