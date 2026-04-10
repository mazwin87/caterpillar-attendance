# Caterpillar Attendance System

QR-based attendance for 4 kindergarten branches.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# → opens http://localhost:3000

# 3. For HTTPS (required for camera on phone):
npx ngrok http 3000
# → gives you https://xxxx.ngrok.io — open on your phone
```

## Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
# Follow prompts — done in 2 minutes
```

## Project Structure

src/
├── components/
│   ├── Scanner.jsx     → QR camera scanner (teachers use this)
│   ├── Dashboard.jsx   → Daily attendance summary per branch
│   ├── Students.jsx    → Add students, generate & download QR codes
│   ├── Holidays.jsx    → Pre-approve student leave
│   └── Navbar.jsx      → Bottom navigation
├── lib/
│   └── supabase.js     → All DB calls in one place
├── hooks/
│   └── useLanguage.js  → EN/BM translations
└── App.jsx             → Routes

## Pages

| Route        | Purpose                              |
|--------------|--------------------------------------|
| /scanner     | Camera QR scanner for teachers       |
| /dashboard   | Cross-branch attendance overview     |
| /students    | Manage students + download QR codes  |
| /holidays    | Pre-approve leave (marks as HOLIDAY) |

## How the QR scan works

1. Each student has a unique UUID in the database
2. QR code encodes that UUID
3. Teacher scans → app calls `record_scan(uuid)` Supabase function
4. Function returns PRESENT (before 9AM) or LATE (9–10AM)
5. At 10AM, cron auto-marks unscanned students as ABSENT
6. Parents notified via Telegram bot
