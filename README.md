# Resonant Voice

**Real-time sign language translator powered by Gemma 3 Vision AI.**

An empathetic assistive communication platform that bridges the gap between sign language users and those who don't know sign language. Point your camera at someone signing, and Gemma 3 Vision AI translates their gestures into text and speech in real-time.

## Features

### Sign Language Translation
- **Real-time camera translation** — Point camera at a signer, get instant English text
- **Gemma 3 27B Vision** — Google's multimodal AI interprets sign language from video frames
- **Multi-language support** — ASL, ISL, BSL, or auto-detect
- **Conversation mode** — Rolling context builds coherent sentences across frames
- **Multi-person detection** — Identifies when multiple people are signing

### Two-Way Communication
- **Sign-to-speech** — Translates signs and speaks them aloud via text-to-speech
- **Reply input** — Hearing person types a reply, displayed as large text on screen for the deaf person to read
- **Speech-to-text** — Mic button transcribes spoken words into the sentence builder

### Hand Tracking
- **MediaPipe skeleton overlay** — Real-time hand landmark visualization on the camera feed
- **Hand count detection** — Shows how many hands are being tracked
- **Offline fallback** — Basic gesture recognition via MediaPipe when internet is unavailable

### Learning Mode (`/learn`)
- **12 common signs** across 3 categories (Greetings, Responses, Needs)
- **Practice with camera** — Perform a sign and get AI feedback on correctness
- **Score tracking** — Track your learning progress per session

### Communication Dashboard (`/speak`)
- **Tile-based phrase builder** — Tap tiles to build sentences visually
- **Predictive suggestions** — Common phrases suggested as chips
- **Text-to-speech** — "Translate & Speak" reads your built sentence aloud
- **Voice input** — Mic button for speech-to-text

### Additional Features
- **Conversation history** (`/history`) — Filter by date, replay, copy, with communication insights
- **Phrase library** (`/library`) — Manage saved phrases, daily needs, social phrases, custom signs
- **Emergency board** (`/emergency`) — One-tap HELP, YES/NO, medical needs, emergency contact dial
- **Dark mode** — Toggle via the top bar
- **Export conversations** — Download translation history as text file
- **PWA support** — Installable on mobile devices

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| AI | Gemma 3 27B Vision via Google AI Studio |
| Hand Tracking | MediaPipe Tasks Vision |
| Speech | Web Speech API (TTS + STT) |
| Database | Prisma + SQLite |
| State | Zustand + SWR |
| Styling | Tailwind CSS + Material Design 3 color system |
| Font | Lexend (designed to reduce visual stress) |

## Getting Started

### Prerequisites
- Node.js 20+
- A Google AI Studio API key ([get one free](https://aistudio.google.com/apikey))

### Setup

```bash
# Clone the repo
git clone https://github.com/adityailab/resonant-voice.git
cd resonant-voice

# Install dependencies
npm install

# Set up your API key
echo "GOOGLE_AI_API_KEY=your_key_here" > .env.local

# Set up the database
npx prisma generate
npx prisma migrate dev --name init
npm run seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```
GOOGLE_AI_API_KEY=your_google_ai_studio_api_key
```

## Architecture

```
Camera Frame --> /api/translate --> Gemma 3 27B Vision --> JSON response --> UI
                                                                           |
MediaPipe --> Hand landmarks --> SVG skeleton overlay                  TTS/Speech
                             --> Offline gesture fallback
```

## Pages

| Route | Description |
|-------|-------------|
| `/speak` | Communication dashboard with tile-based phrase builder |
| `/gesture` | Real-time sign language translation with camera |
| `/learn` | Interactive sign language learning with AI feedback |
| `/history` | Conversation history with filters and insights |
| `/library` | Phrase and gesture library management |
| `/emergency` | Emergency quick-access communication board |

## Design Philosophy

Built on **"The Resonant Architecture"** — rejecting clinical, hospital-grade aesthetics in favor of intentional, empathetic, and dignified design:
- No borders — boundaries through tonal background shifts
- Lexend typeface — designed to reduce visual stress
- Max 6 tiles per view — prevents cognitive overload
- User output is always the hero — largest typography on screen

## License

MIT

---

Built for the Google AI Challenge. Powered by Gemma 3 Vision.
