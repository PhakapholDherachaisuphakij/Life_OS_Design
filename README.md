# Life OS Dashboard

ระบบ Dashboard อัจฉริยะสำหรับจัดการชีวิตส่วนตัว จัดลำดับความสำคัญของงาน และเชื่อมต่อความจำด้วย AI (Typhoon AI) พร้อมระบบ Sync กับ Google Calendar และ Supabase แบบ Real-time

## 🚀 ฟีเจอร์หลัก (Core Features)
- **AI Memory Oracle**: ระบบสืบค้นความจำอัจฉริยะ สามารถถาม AI เกี่ยวกับข้อมูลชีวิต ประวัติการทำงาน หรือตารางงาน และสั่งให้สรุปเป็นตารางหรือ Bullet points ได้
- **AI Memory Sync (Life Logs)**: บันทึกความคืบหน้าของชีวิต (Brain Dump) โดย AI จะแยกหมวดหมู่และบันทึกลงประวัติศาสตร์ชีวิต (Life Logs) พร้อมอัปเดต Profile และสร้างกิจกรรมลงปฏิทินให้อัตโนมัติ
- **2-Way Google Calendar Integration**: ดึงตารางงานวันนี้มาแสดง และสามารถสั่งสร้างกิจกรรมใหม่ลงปฏิทินจริงได้
- **Context-Aware Prioritization**: จัดลำดับความสำคัญของ To-Do List อิงจากตารางงานในปฏิทินและสถานะตัวตนปัจจุบัน
- **Behavioral Coaching**: ระบบดุ/เตือนไม่ให้เล่นเกมหากมีงานสำคัญค้างอยู่ในช่วงเย็น (ช่วง Peak Performance หลัง 20:00 น.)
- **GitHub Dark Minimal Theme**: หน้าตาเว็บสไตล์โปรแกรมเมอร์ เรียบหรู สบายตา

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI Engine**: Typhoon AI (OpenTyphoon API)
- **Integration**: Google Calendar API

## ⚙️ การตั้งค่าระบบ (Setup)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables (`.env`)
สร้างไฟล์ `.env` ที่รูทของโปรเจคและใส่ค่าดังนี้:

```env
# AI
TYPHOON_API_KEY="your_typhoon_api_key"

# Google Calendar OAuth
GOOGLE_OAUTH_CLIENT_ID="your_client_id"
GOOGLE_OAUTH_CLIENT_SECRET="your_client_secret"
GOOGLE_OAUTH_REFRESH_TOKEN="your_refresh_token"
GOOGLE_CALENDAR_ID="your_gmail_or_calendar_id"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Security
NEXT_PUBLIC_MEMORY_UPDATE_TOKEN="your_secret_token"
```

### 3. รันระบบในเครื่อง (Local Development)
```bash
npm run dev
```
เปิดเว็บที่ [http://localhost:3000](http://localhost:3000)

## ☁️ การ Deploy บน Vercel

หากต้องการนำระบบขึ้น Vercel เพื่อใช้งานจริง:

1.  **นำตัวแปรใน `.env` ทั้งหมด** ไปใส่ในส่วนของ Environment Variables ในหน้าตั้งค่าโปรเจคบน Vercel
2.  **เรื่อง Google Calendar API (สำคัญ):** 
    *   เนื่องจากปัจจุบันระบบใช้ **Desktop App Client ID** และคุณมี `GOOGLE_OAUTH_REFRESH_TOKEN` อยู่แล้วใน `.env` **คุณจึงไม่จำเป็นต้องไปตั้งค่า Path หรือ Redirect URL ใดๆ ใน Google Console เลยครับ!** 
    *   ระบบจะใช้ Refresh Token นั้นในการดึงและสร้างกิจกรรมได้ทันทีบน Vercel ตราบใดที่สิทธิ์ยังไม่หมดอายุ
    *   *หมายเหตุ: หากในอนาคตต้องการเปลี่ยนเป็นแบบ Web Login เต็มรูปแบบ คุณจะต้องไปสร้าง "Web Application" Client ID ใน Google Console และเพิ่ม URL ของ Vercel เข้าไปในช่อง "Authorized redirect URIs"*

## 🔒 ความปลอดภัย (Security)
ไฟล์ที่มีความลับต่อไปนี้ถูกตั้งค่าไม่ให้ Push ขึ้น GitHub:
- `.env`
- ไฟล์ JSON คีย์ของ Google (`client_secret_*.json`, `personalos-*.json`)
- สคริปต์สำหรับขอสิทธิ์ (`get-refresh-token.js`, `seed-scholarship-dates.js`)
