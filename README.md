# Conversational AI Frontend

This is a [Next.js](https://nextjs.org) project with a conversational AI interface that connects to a FastAPI backend.

## Backend Configuration

The frontend automatically detects and connects to your backend using the following priority:

1. **Vite Environment Variable** (if set)
2. **Localhost Fallback** (default: `http://localhost:8006`)

### Environment Setup

Create a `.env.local` file in your project root:

```bash
# Backend URL Configuration (same as other files in the project)
NEXT_PUBLIC_API_URL=http://your-backend-url.com

# Examples:
# NEXT_PUBLIC_API_URL=https://your-production-backend.com
# NEXT_PUBLIC_API_URL=http://localhost:8006
# NEXT_PUBLIC_API_URL=http://192.168.1.100:8006
```

### Backend URL Priority

- **If `NEXT_PUBLIC_API_URL` is set**: Uses that URL
- **If not set**: Falls back to `http://localhost:8006`
- **WebSocket**: Automatically converts HTTP/HTTPS to WS/WSS

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Features

- 🎤 **Voice Recording**: Real-time speech recognition
- 🤖 **AI Conversation**: Connects to OpenAI and ElevenLabs
- 🔊 **Text-to-Speech**: Plays AI responses as audio
- 🔄 **Continuous Conversation**: Automatic recording restart
- 🛡️ **Echo Prevention**: Prevents AI from transcribing itself
- 📱 **Responsive Design**: Works on desktop and mobile

## Backend Requirements

Your FastAPI backend should provide:

- **WebSocket Endpoint**: `/conversational-ai/ws/voice`
- **Health Check**: `/conversational-ai/`
- **Request Types**: `final_transcript`, `final_audio`
- **Response Types**: `transcription`, `response`, `audio`, `error`

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
