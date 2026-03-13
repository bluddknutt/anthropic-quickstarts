# Veo 3 Video Generator

A Next.js quickstart that combines **Claude** (Anthropic) for intelligent prompt enhancement with **Google Veo 3** for state-of-the-art AI video generation.

## How it works

1. **You describe a scene** — in plain language, however brief or vague.
2. **Claude enhances your prompt** — using `claude-sonnet-4-6`, the app rewrites your description into a detailed, cinematographic Veo 3 prompt (camera angles, lighting, motion, audio cues, and more).
3. **Veo 3 generates your video** — the enhanced prompt is sent to Google's `veo-3.0-generate-preview` model via the Gemini API.
4. **Watch the result** — the generated video is displayed directly in the browser with playback controls.

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- A [Google AI Studio API key](https://aistudio.google.com/apikey) with access to Veo 3 (`veo-3.0-generate-preview`)

> **Note:** Veo 3 access via the Google AI Studio API (`generativelanguage.googleapis.com`) may require enrollment in a preview program or a paid tier. Check the [Google AI documentation](https://ai.google.dev/gemini-api/docs/video) for current availability.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env.local` file in this directory:

   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   GOOGLE_API_KEY=your_google_ai_studio_api_key_here
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Enter a video description (e.g. *"a fox running through autumn leaves"*)
- Choose an aspect ratio and duration
- Click **Generate Video** and wait ~1–3 minutes for Veo 3 to render

## Project structure

```
veo3-video-generator/
├── app/
│   ├── api/
│   │   ├── generate/route.ts        # Claude enhancement + Veo 3 job start
│   │   └── status/[operationId]/    # Long-running operation polling
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── VideoGenerator.tsx           # Main UI with prompt input and controls
│   └── VideoResult.tsx              # Video player component
├── lib/
│   ├── utils.ts
│   └── veo3.ts                      # Google Veo 3 API client
└── types/
    └── video.ts                     # Shared TypeScript types
```

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
