# KEYRUSH Frontend ⚡

The ultra-responsive frontend web client for **KEYRUSH** — Global Multiplayer Typing Esports & Competition Platform.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Socket.IO Client**.

---

## 🚀 Features

- 🏎️ **Real-Time Multiplayer Race Track**: Visual progress bars, real-time WPM, rank updates, and spectator viewing.
- ⌨️ **Dynamic Virtual Keyboard Heatmap**: Live key highlights, finger position guidance, and miss indicators.
- 📈 **Live Analytics & Charts**: Live WPM & accuracy graphs, telemetry charts, and post-match performance breakdowns.
- 🏆 **Global & Organization Leaderboards**: Daily, weekly, and all-time rankings with Tier badges (Iron to Grandmaster).
- 🏢 **Organization & Tournament Hubs**: Corporate/university hubs, invite codes, and bracket-based tournaments.
- 🎨 **Visual Themes & Mechanical Audio FX**: Cyberpunk, Retro Terminal, Midnight Blue, and authentic switch audio clicks (Blue, Brown, Red switches) + celebration confetti.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Neon/Glow Design System
- **Real-Time Networking**: Socket.IO Client
- **Audio & FX**: Web Audio API Sound Generator & Synthesizer, Canvas-Confetti
- **Icons**: Lucide React
- **Deployment**: Vercel, Netlify, Railway, Docker

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18.x or v20.x recommended)
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and configure your backend URLs:
```bash
cp .env.example .env.local
```

Config variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME="KEYRUSH"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🐳 Docker Support

Build and run using Docker:
```bash
docker build -t keyrush-frontend .
docker run -p 3000:3000 keyrush-frontend
```

---

## 📄 License
MIT License.
