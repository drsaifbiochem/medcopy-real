# MedCopy - Medical Intelligence Engine (v2.4)

## Overview

MedCopy is a medically grounded AI content generation engine that creates persona-driven, factually accurate medical and health-tech content. Built with React, Vite, and powered by Google's Gemini API (Gemma 3 27B IT model).

**Key Features (v2.4 "Vision Enabled"):**

- 👁️ **Vision Mode** - Analyze medical images/scans and generate insights using `gemma-3-27b-it`
- 🎭 **8 Pre-built Medical Personas** - From empathetic psychiatrists to B2B HealthTech visionaries
- 🔄 **Multi-Provider API Fallback** - Automatic rotation across 5 Gemini API keys
- 📊 **Google Sheets Integration** - One-click save to spreadsheets with OAuth 2.0 or Apps Script
- 🎨 **Premium Styling** - Glassmorphism UI with custom Cyan-accented Markdown rendering
- 🔍 **Persona Drift Detection** - AI-powered matching score to ensure content stays on-brand
- 🚀 **Batch Mode** - Generate multiple variations with user-controlled counts
- 🎪 **Multi-Format Exploder** - Create content for all platforms simultaneously
- 📱 **Instagram Carousel Generator** - Slide-by-slide content with visual descriptions

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Google AI API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd medcopy-real
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Configure environment variables**

   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit .env and add your API key
   GEMINI_API_KEY=your_google_ai_api_key_here
   ```
4. **Start the development server**

   ```bash
   npm run dev
   ```
5. **Open your browser**

   ```
   http://localhost:3000
   ```

## Environment Configuration

### Required Variables

```env
# Primary Gemini API Key (Required)
GEMINI_API_KEY=your_google_ai_api_key_here
```

### Optional: Multi-Key Fallback

Add up to 5 Gemini API keys for automatic quota management:

```env
GEMINI_API_KEY_2=your_second_key_here
GEMINI_API_KEY_3=your_third_key_here
GEMINI_API_KEY_4=your_fourth_key_here
GEMINI_API_KEY_5=your_fifth_key_here
```

### Optional: Google Sheets Integration

Save generated content directly to Google Sheets:

```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
```

**Setup Guide:** See [GOOGLE_SHEETS_INTEGRATION.md](GOOGLE_SHEETS_INTEGRATION.md) for detailed instructions.

## Recent Updates (2026-02-18/19)

### V2.4 Vision & UI Release ✅

- **Added**: Native Vision Mode for medical image analysis.
- **Added**: "Ultra-Fast" image resizing engine (512px max dimension).
- **Added**: Exponential backoff retry logic for 503/Quota errors.
- **UI**: Complete transition to Glassmorphism (Frosted glass containers).
- **Styling**: Premium Markdown rendering with Cyan accents and Medical Note blockquotes.
- **Fix**: Batch Mode slider functionality and property name synchronization.
- **Fix**: React default export and ESM module resolution in `tsconfig.json`.

### Info Tooltips ✅

- **Added**: Informational tooltips next to key settings (Persona, Format, Audience, Topic, Medical Context)
- **Component**: New `InfoTooltip.tsx` component with hover functionality
- **Styling**: Full light/dark mode support

### Auto-Save Implementation ✅

- **Added**: Automatic saving to Google Sheets when content is generated
- **Implementation**: React `useEffect` hook triggers save automatically
- **Auth Bypass**: Apps Script proxy bypasses OAuth popup for seamless background saves
- **Config**: Auto-loads credentials from `.env` file on startup

### Drift Detection Fix ✅

- **Fixed**: JSON parsing errors no longer crash the application
- **Added**: JSON sanitizer for control characters
- **Added**: Fallback mechanism returns original content if parsing fails

### Carousel Generation Fix ✅

- **Fixed**: Instagram Carousel now uses robust regex-based JSON extraction
- **Removed**: Strict `responseSchema` that caused 400 errors with certain models
- **Added**: Manual JSON parsing with markdown code block support

## Features

### Content Generation Modes

1. **Vision Mode** - Analyze and cross-reference medical images with personas
2. **Standard Mode** - Single piece of content in your chosen format
3. **Batch Mode** - Generate 1-5 variations with a precise slider
4. **Multi-Format Exploder** - Create content for Instagram, LinkedIn, Email, and Twitter at once
5. **Carousel Mode** - Generate Instagram carousel posts with slide-by-slide content
6. **Summarizer Mode** - Condense long medical texts into digestible summaries
7. **Exam Mode** - Create medical exam-style Q&A content

### Available Personas

1. **Empathetic Psychiatrist** - Destigmatize mental health with warm, validating content
2. **Biochem Gold Medalist** - Make complex science viral with energetic, mnemonic-heavy posts
3. **B2B HealthTech Visionary** - Physician-founder selling compliance & efficiency
4. **Local AI & Tech Tinkerer** - Doctor + Dev, geeky and privacy-focused
5. **Polyclinic Owner** - Community pillar with trusted, inviting content
6. **Academic Cardiologist** - Evidence-based, authoritative, slightly formal
7. **Seed-Stage Founder** - Optimistic, punchy, focused on radiology AI outcomes
8. **Empathetic GP** - Warm, relatable, patient-centered general practice

### Content Formats

- LinkedIn Post
- Instagram Caption
- Twitter Thread
- Patient Email
- Blog Post
- Case Study
- Multi-Format Exploder (all platforms at once)

## Google Sheets Integration

### Setup Steps

1. Create a Google Cloud project
2. Enable Google Sheets API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add credentials to `.env` file

**Full guide:** [GOOGLE_SHEETS_INTEGRATION.md](GOOGLE_SHEETS_INTEGRATION.md)

### Usage

1. Click "Link Sheets" button in the app
2. Verify your Client ID and Spreadsheet ID
3. Generate content
4. Click "Save to Sheets" button
5. Authorize with Google (first time only)
6. Content automatically appended to your spreadsheet

## API Key Fallback System

The app automatically rotates through API keys when quota limits are hit:

```
1. GEMINI_API_KEY (primary)
2. GEMINI_API_KEY_2
3. GEMINI_API_KEY_3
4. GEMINI_API_KEY_4
5. GEMINI_API_KEY_5
```

## Development

### Build Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
medcopy-real/
├── .env.example                 # Environment variable template
├── index.html                   # HTML entry point
├── index.tsx                    # React entry point
├── App.tsx                      # Main application component
├── types.ts                     # TypeScript interfaces
├── vite.config.ts               # Build configuration
├── components/
│   ├── Header.tsx               # App header
│   └── PresetSelector.tsx       # Persona dropdown
├── services/
│   ├── geminiService.ts         # AI generation logic
│   └── sheetService.ts          # Google Sheets integration
├── utils/
│   └── security.ts              # Log redaction & sanitization utilities
├── GOOGLE_SHEETS_INTEGRATION.md # Sheets setup guide
├── VISION.md                    # Vision Mode guide
├── GEMMA_3_IMAGE_CONFIG.md      # Image processing specs
├── OUTPUT_FORMATTING.md         # Premium styling guide
├── MASTER.md                    # Configuration reference
└── README.md                    # This file
```

## Customization

### Quick Tweaks

- **Change app name**: Edit `Header.tsx` and `index.html`
- **Modify colors**: Search & replace `teal` with your preferred color
- **Add personas**: Edit `components/PresetSelector.tsx`
- **Adjust AI behavior**: Modify `services/geminiService.ts`
- **Change layout**: Edit column spans in `App.tsx`

**Full customization guide:** [MASTER.md](MASTER.md)

## Security Considerations

⚠️ **API Keys in Client**: This is a client-side application. API keys are exposed in the browser bundle.

**Mitigation:**

- Use API key restrictions in Google Cloud Console
- Limit keys to specific domains/IPs
- Monitor usage quotas
- Rotate keys regularly

**Future Enhancement:** Add a backend proxy to keep API keys server-side.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Provider**: Google GenAI (Gemma 3 27B IT)
- **Integration**: Google Sheets API (OAuth 2.0)

## Documentation

- **[MASTER.md](MASTER.md)** - Complete configuration reference
- **[VISION.md](VISION.md)** - Vision Mode & Multimodal guide
- **[OUTPUT_FORMATTING.md](OUTPUT_FORMATTING.md)** - Styling & Markdown tokens
- **[GEMMA_3_IMAGE_CONFIG.md](GEMMA_3_IMAGE_CONFIG.md)** - Technical image specs
- **[GOOGLE_SHEETS_INTEGRATION.md](GOOGLE_SHEETS_INTEGRATION.md)** - Sheets setup guide
- **[.env.example](.env.example)** - Environment variable documentation

## Support

For issues or questions:

1. Check the documentation files listed above
2. Review the [MASTER.md](MASTER.md) troubleshooting section
3. Verify your environment variables are correctly set

## License

[Your License Here]

---

**Built with ❤️ for medical content creators**
