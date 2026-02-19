# MASTER.md - MedCopy Quick Configuration Guide

> **Last Updated:** 2026-02-18/19 (v2.4: Vision Mode, 512px Resizing, Cyan Styling)  
> **Purpose:** Quick reference for modifying UI, backend, prompts, and configuration without breaking functionality

---

## Recent Fixes (2026-02-05)

### 1. Info Tooltips
- **Added**: Informational tooltips next to key UI elements (Persona, Content Format, Audience Risk Filter, Topic, Medical Context)
- **Component**: `components/InfoTooltip.tsx`
- **Styling**: Supports both light and dark modes with hover functionality

### 2. Carousel JSON Parsing Fix
- **Fixed**: Instagram Carousel generation now uses robust regex-based JSON extraction
- **Issue**: Previous strict schema parsing caused 400 errors with certain Gemini models
- **Solution**: Manual JSON extraction from markdown code blocks with fallback handling

### 3. Drift Detection Crash Fix
- **Fixed**: JSON parsing errors in Drift Detection phase no longer crash the app
- **Added**: JSON sanitizer to clean control characters before parsing
- **Added**: Try-catch block with fallback to original content (Drift Score 100) if parsing fails
- **File**: `services/geminiService.ts`

### 4. Auto-Save Implementation
- **Added**: True auto-save functionality - content automatically saves to Google Sheets after generation
- **Implementation**: React `useEffect` hook triggers save when `generatedResult` updates
- **Auth Fix**: Bypasses client-side OAuth popup when Apps Script URL is configured
- **Config Loading**: Automatically loads Sheet ID and Client ID from `.env` file
- **Debug Logging**: Console logs show auto-save trigger conditions

### 6. Backend Proxy & Vercel Migration (2026-02-19)
- **Hardening**: Moved all API keys and Sheets secrets to server-side/serverless logic.
- **Proxy**: Implemented an Express proxy server (`server.js`) for local development.
- **Vercel**: Migrated backend logic to individual serverless functions in `api/` directory.
- **Security**: Prevented API key exposure in client-side bundles by refactoring `vite.config.ts`.
- **Docs**: Created `VERCEL_DEPLOYMENT.md` and `SECURITY_AUDIT.md`.

---

## Table of Contents

1. [UI Components & Styling](#1-ui-components--styling)
2. [Colors & Theme](#2-colors--theme)
3. [Component Sizes & Dimensions](#3-component-sizes--dimensions)
4. [UI Text & Labels](#4-ui-text--labels)
5. [AI System Prompts](#5-ai-system-prompts)
6. [Persona Presets](#6-persona-presets)
7. [Environment Variables](#7-environment-variables)
8. [API Routes & Security](#8-api-routes--security)
9. [Payment & Cost Settings](#9-payment--cost-settings)
10. [Quick Tweaks Checklist](#10-quick-tweaks-checklist)
11. [Vision & Multimodal Features](#11-vision--multimodal-features)

---

## 1. UI Components & Styling

### Main Application Layout
**File:** `App.tsx`

```typescript
// Grid Layout (Line 288)
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
  // Left Column: Inputs (5 columns on large screens)
  <div className="lg:col-span-5 flex flex-col h-full">
  
  // Right Column: Output (7 columns on large screens)
  <div className="lg:col-span-7 flex flex-col h-full">
```

**Quick Tweaks:**
- Change column ratio: Modify `lg:col-span-5` and `lg:col-span-7` (must sum to 12)
- Adjust gap between columns: Change `gap-8` (options: gap-4, gap-6, gap-8, gap-10)
- Container max width: Line 287 - `max-w-7xl` (options: max-w-6xl, max-w-7xl, max-w-full)

### Card Components
**Styling Pattern:**
```typescript
className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
```

**Quick Tweaks:**
- Border radius: `rounded-xl` → `rounded-lg`, `rounded-2xl`
- Padding: `p-6` → `p-4`, `p-8`
- Shadow: `shadow-sm` → `shadow`, `shadow-md`, `shadow-lg`

---

## 2. Colors & Theme

### Primary Brand Color: **Teal**
**File:** `index.css`, `App.tsx`, `Header.tsx`, `PresetSelector.tsx`

**Color Palette:**
```css
/* Teal (Primary) */
bg-teal-50 dark:bg-teal-900/30    /* Light background */
bg-teal-100 dark:bg-teal-900      /* Medium background */
bg-teal-600                        /* Primary buttons/icons */
text-teal-600 dark:text-teal-400  /* Text */
border-teal-500                    /* Borders/accents */

/* Slate (Neutral) */
bg-slate-50 dark:bg-slate-950     /* Page background */
bg-slate-900 dark:bg-slate-900    /* Card background */
text-slate-900 dark:text-slate-50 /* Primary text */
text-slate-500 dark:text-slate-400 /* Secondary text */
```

### Drift Score Colors
**File:** `App.tsx` (Line 246-251)

```typescript
function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
  if (score >= 85) return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800';
  if (score >= 70) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
}
```

**Quick Tweaks:**
- Adjust score thresholds: Change 90, 85, 70 values
- Change colors: Replace `green`, `teal`, `amber`, `red` with other Tailwind colors

### Scrollbar Styling
**File:** `index.html` (Lines 19-42)

```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #f1f5f9; }  /* Light mode */
.dark ::-webkit-scrollbar-track { background: #0f172a; }  /* Dark mode */
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
```

---

## 3. Component Sizes & Dimensions

### Header
**File:** `Header.tsx` (Line 8)

```typescript
<div className="flex justify-between items-center h-16">  // Header height
  <div className="bg-teal-600 p-2 rounded-lg text-white">
    <Stethoscope size={24} strokeWidth={2.5} />  // Logo icon size
  </div>
  <h1 className="text-xl font-bold">  // Title size
```

**Quick Tweaks:**
- Header height: `h-16` → `h-12`, `h-20`
- Logo size: `size={24}` → `size={20}`, `size={28}`
- Title size: `text-xl` → `text-lg`, `text-2xl`

### Buttons
**Standard Button Pattern:**
```typescript
className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
```

**Quick Tweaks:**
- Padding: `px-4 py-2` → `px-3 py-1.5` (smaller), `px-6 py-3` (larger)
- Border radius: `rounded-lg` → `rounded-md`, `rounded-xl`
- Font weight: `font-medium` → `font-normal`, `font-semibold`, `font-bold`

### Input Fields
**Standard Input Pattern:**
```typescript
className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg"
```

**Quick Tweaks:**
- Height: `py-2` → `py-1.5`, `py-3`
- Border radius: `rounded-lg` → `rounded-md`, `rounded-xl`

### Dropdown (PresetSelector)
**File:** `PresetSelector.tsx` (Line 191)

```typescript
className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto"
```

**Quick Tweaks:**
- Max height: `max-h-80` → `max-h-60`, `max-h-96`
- Shadow: `shadow-xl` → `shadow-lg`, `shadow-2xl`

---

## 4. UI Text & Labels

### Application Title & Branding
**File:** `Header.tsx` (Lines 14-17)

```typescript
<h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
  MedCopy <span className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full border border-teal-100 dark:border-teal-800">BETA</span>
</h1>
<p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Medical Intelligence Engine</p>
```

**Quick Tweaks:**
- App name: Change `MedCopy`
- Badge text: Change `BETA` to `PRO`, `v2.0`, etc.
- Tagline: Change `Medical Intelligence Engine`

### Page Title
**File:** `index.html` (Line 6)

```html
<title>MedCopy</title>
```

### Status Badge
**File:** `Header.tsx` (Lines 21-24)

```typescript
<div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-100 dark:border-slate-700">
  <Activity size={14} className="text-teal-500" />
  <span>RAG Context Enabled</span>
</div>
```

**Quick Tweaks:**
- Change badge text: Modify `RAG Context Enabled`
- Hide/show on mobile: Remove `hidden md:flex` to show on all screens

### Format Options
**File:** `App.tsx` (Search for "LinkedIn Post", "Instagram Caption", etc.)

**Available Formats:**
- LinkedIn Post
- Instagram Caption
- Twitter Thread
- Patient Email
- Blog Post
- Case Study

**To add new format:** Add to the format dropdown options in `App.tsx`

### Audience Levels
**File:** `App.tsx`

**Available Audiences:**
- Layperson (Patient/Public)
- Student (Medical/Nursing)
- Clinician (MD/DO/Advanced Practice)
- Business (Hospital Admin/Investors)

---

## 5. AI System Prompts

### Main System Instruction
**File:** `services/geminiService.ts` (Lines 98-146)

```typescript
const SYSTEM_INSTRUCTION = `You are MedCopy, a medically grounded content generation engine.

Your job is to generate persona-driven medical or health-tech content that is:
• Factually accurate
• Free of marketing fluff
• Written for a clearly defined audience
• Human, credible, and publication-ready
...
```typescript
const SYSTEM_INSTRUCTION = `You are MedCopy, a medically grounded content generation engine...`;
```

**Note:** The system instruction is now prepended to the user prompt content to ensure compatibility with all Gemini models (including `gemma-3-27b-it`) which may not support the dedicated `systemInstruction` parameter.

**Carousel Mode Note:** Carousel generation now uses robust Regex-based JSON extraction instead of strict `responseSchema` to prevent 400 errors with certain models.

**Key Sections:**
1. **Identity & Purpose** (Lines 98-104)
2. **Critical Rules** (Lines 107-136)
   - Medical Accuracy
   - Persona Fidelity
   - Human Writing Standard
   - Safety & Ethics
3. **Output Requirements** (Lines 137-146)

**Quick Tweaks:**
- Modify tone: Adjust the voice description
- Add/remove rules: Edit the bullet points
- Change safety level: Modify audience risk guardrails

### Anti-AI Style Prompt
**File:** `services/geminiService.ts` (Lines 199-230)

```typescript
const antiAiStyleInstruction = `
THE AI HUMANISER PROMPT (ANTI-AI FINGERPRINT REWRITER)
...
• AVOID these words:
"can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving"
```

**Quick Tweaks:**
- Add banned words: Append to the list
- Remove banned words: Delete from the list
- Adjust writing style rules: Modify the SHOULD/AVOID bullets

### Citation Instruction
**File:** `services/geminiService.ts` (Lines 175-185)

```typescript
const citationInstruction = inputs.includeCitations 
  ? `
CITATION INJECTION ENGINE
Where a medical claim is made, attach a citation if available based on the provided RETRIEVED_MEDICAL_CONTEXT.
• Use numbered references inline (e.g. "Sleep deprivation is a known trigger for postpartum psychosis¹").
• Append a "References" section at the end if citations are used.
• Do not fabricate sources. Only cite what is explicitly in the context provided below.
`
  : "";
```

### Hashtag Instruction
**File:** `services/geminiService.ts` (Lines 187-197)

```typescript
const hashtagInstruction = inputs.includeHashtags
  ? `
HASHTAG OPTIMIZATION
Generate 3-5 high-quality, engagement-boosting, SEO-optimized hashtags.
• Place them at the very bottom of the content.
• Ensure they are relevant to the niche (Medical/HealthTech) and the specific topic.
• Mix broad (e.g., #MedEd) and specific (e.g., #CardiologyPearls) tags.
`
  : "";
```

**Quick Tweaks:**
- Change hashtag count: Modify `3-5` to desired range
- Adjust hashtag style: Modify the guidance

---

## 6. Persona Presets

**File:** `components/PresetSelector.tsx` (Lines 10-134)

### Current Presets

#### 1. Empathetic Psychiatrist
```typescript
{
  id: 'psychiatrist',
  name: 'Empathetic Psychiatrist',
  description: 'Destigmatize mental health. Warm, validating, non-judgmental.',
  personaPrompt: `...`
}
```

#### 2. Biochem Gold Medalist
```typescript
{
  id: 'biochem_mentor',
  name: 'Biochem Gold Medalist',
  description: 'Make complex science viral. Energetic, sharp, mnemonic-heavy.',
  personaPrompt: `...`
}
```

#### 3. B2B HealthTech Visionary
```typescript
{
  id: 'healthtech_saas',
  name: 'B2B HealthTech Visionary',
  description: 'Physician-Founder selling compliance & efficiency. Direct & data-driven.',
  personaPrompt: `...`
}
```

#### 4. Local AI & Tech Tinkerer
```typescript
{
  id: 'ai_tinkerer',
  name: 'Local AI & Tech Tinkerer',
  description: 'Doctor + Dev. Geeky, privacy-focused, open-source advocate.',
  personaPrompt: `...`
}
```

#### 5. Polyclinic Owner
```typescript
{
  id: 'polyclinic_owner',
  name: 'Polyclinic Owner',
  description: 'Community pillar. Trusted, inviting, service-oriented.',
  personaPrompt: `...`
}
```

#### 6. Academic Cardiologist
```typescript
{
  id: 'cardiologist',
  name: 'Academic Cardiologist',
  description: 'Evidence-based, authoritative, slightly formal.',
  personaPrompt: '...'
}
```

#### 7. Seed-Stage Founder
```typescript
{
  id: 'healthtech_founder',
  name: 'Seed-Stage Founder',
  description: 'Optimistic, punchy, focused on radiology AI outcomes.',
  personaPrompt: '...'
}
```

#### 8. Empathetic GP
```typescript
{
  id: 'empathetic_gp',
  name: 'Empathetic GP',
  description: 'Warm, relatable, patient-centered (General).',
  personaPrompt: '...'
}
```

### Adding a New Preset

1. Add to `PRESETS` array in `PresetSelector.tsx`:

```typescript
{
  id: 'your_preset_id',  // Unique identifier (lowercase, underscores)
  name: 'Display Name',  // Shown in UI
  description: 'Short description for dropdown',  // 1-2 sentences
  personaPrompt: `
### IDENTITY
[Who they are, credentials, expertise]

### AUDIENCE
[Who they're writing for]

### TONE & VOICE
* [Key characteristic 1]
* [Key characteristic 2]

### STYLE GUIDELINES
1. [Guideline 1]
2. [Guideline 2]

### MANDATORY SAFETY
* [Any required disclaimers]
  `
}
```

2. Add icon mapping in `getIcon()` function (Line 153-164):

```typescript
case 'your_preset_id': return <YourIcon className={className} />;
```

---

## 7. Environment Variables

**File:** `.env.example` → Copy to `.env.local`

### API Keys (Multi-Provider Fallback)

#### Gemini API Keys (Primary Provider)
```env
# Required - Primary key
GEMINI_API_KEY=your_google_ai_api_key_here

# Optional - Fallback keys for quota management
GEMINI_API_KEY_2=your_second_google_ai_api_key_here
GEMINI_API_KEY_3=your_third_google_ai_api_key_here
GEMINI_API_KEY_4=your_fourth_google_ai_api_key_here
GEMINI_API_KEY_5=your_fifth_google_ai_api_key_here
```

**Get keys from:** https://aistudio.google.com/app/apikey

#### Mistral API Keys (Cross-Provider Fallback)
```env
# Optional - Cross-provider fallback when all Gemini keys exhausted
MISTRAL_API_KEY=your_mistral_ai_api_key_here
MISTRAL_API_KEY_2=your_second_mistral_ai_api_key_here
MISTRAL_API_KEY_3=your_third_mistral_ai_api_key_here
MISTRAL_API_KEY_4=your_fourth_mistral_ai_api_key_here
MISTRAL_API_KEY_5=your_fifth_mistral_ai_api_key_here
```

**Get keys from:** https://console.mistral.ai/api-keys/

### Google Sheets Integration
```env
# OAuth 2.0 Client ID (Exposed to frontend)
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here

# Target Spreadsheet ID (SERVER-SIDE ONLY)
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here

# Optional: Apps Script Web App URL (SERVER-SIDE ONLY)
GOOGLE_APPS_SCRIPT_URL=your_apps_script_url_here
```

**⚠️ Important:** Only the public `GOOGLE_CLIENT_ID` is exposed in `vite.config.ts`:
```typescript
'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID)
```
AI keys and Spreadsheet IDs are kept strictly on the server/serverless layer.

### Auto-Save Feature (Apps Script)
- If `GOOGLE_APPS_SCRIPT_URL` is set, the "Save to Sheets" button will use the Apps Script Web App for a seamless server-side save (bypassing the client-side OAuth popup for frequent saves).
- If not set, it falls back to the direct Google Sheets API (requires OAuth popup).

**Save to Sheets Button:**
- Available in all modes: Standard, Batch, Multi-Format, and Carousel
- For batch mode, button appears below all variations
- First click triggers OAuth authorization
- Subsequent clicks save content directly to the configured spreadsheet

### Fallback Hierarchy
```
1. GEMINI_API_KEY (primary)
2. GEMINI_API_KEY_2
3. GEMINI_API_KEY_3
4. GEMINI_API_KEY_4
5. GEMINI_API_KEY_5
6. MISTRAL_API_KEY (cross-provider fallback)
7. MISTRAL_API_KEY_2
8. MISTRAL_API_KEY_3
9. MISTRAL_API_KEY_4
10. MISTRAL_API_KEY_5
```

**File:** `services/geminiService.ts` (Lines 15-50)

---

## 8. API Routes & Security

#### External API Integrations (Routed via Proxy)

| Service | Purpose | Security Level | Implementation |
|---------|---------|----------------|----------------|
| **Google GenAI API** | AI content generation | 🔒 **High** | Routed via `/api/generate` |
| **Google Sheets API** | Store data | 🔒 **High** | Routed via `/api/save` |
| **Google Identity** | Frontend Auth | 🔒 **Medium** | Client-side (Public ID) |

### Security Architecture
1. **Backend Proxy**: AI keys are never sent to the browser.
2. **Path Sanitization**: Error messages are redacted to prevent leakage.
3. **Vercel Serverless**: Logic is decoupled into edge-ready functions.

### Security Considerations

#### ⚠️ API Keys Exposed in Client
**Risk:** API keys are embedded in the client-side JavaScript bundle.

**Mitigation:**
- Use API key restrictions in Google Cloud Console
- Limit keys to specific domains/IPs
- Monitor usage quotas
- Rotate keys regularly

**File:** `vite.config.ts` (Lines 13-26)

```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY_2': JSON.stringify(env.GEMINI_API_KEY_2),
  'process.env.GEMINI_API_KEY_3': JSON.stringify(env.GEMINI_API_KEY_3),
  'process.env.GEMINI_API_KEY_4': JSON.stringify(env.GEMINI_API_KEY_4),
  'process.env.GEMINI_API_KEY_5': JSON.stringify(env.GEMINI_API_KEY_5),
  'process.env.MISTRAL_API_KEY': JSON.stringify(env.MISTRAL_API_KEY),
  'process.env.MISTRAL_API_KEY_2': JSON.stringify(env.MISTRAL_API_KEY_2),
  'process.env.MISTRAL_API_KEY_3': JSON.stringify(env.MISTRAL_API_KEY_3),
  'process.env.MISTRAL_API_KEY_4': JSON.stringify(env.MISTRAL_API_KEY_4),
  'process.env.MISTRAL_API_KEY_5': JSON.stringify(env.MISTRAL_API_KEY_5),
  'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID),
  'process.env.GOOGLE_SPREADSHEET_ID': JSON.stringify(env.GOOGLE_SPREADSHEET_ID)
}
```

#### 🔒 Google Sheets OAuth
**Security Level:** High - Uses OAuth 2.0 flow

**Implementation:** `services/sheetService.ts`

**Best Practices:**
- OAuth tokens stored in browser session
- User must authorize access
- Tokens expire automatically
- No server-side storage

#### 🔐 Recommended Security Enhancements

1. **Add Backend Proxy** (Future Enhancement)
   - Create API proxy server
   - Store API keys server-side
   - Client calls proxy, proxy calls AI services
   - Prevents key exposure

2. **Rate Limiting** (Future Enhancement)
   - Implement client-side rate limiting
   - Track requests per session
   - Prevent abuse

3. **Domain Restrictions**
   - Configure in Google Cloud Console
   - Restrict API keys to production domain
   - Separate keys for dev/staging/prod

---

## 9. Payment & Cost Settings

### Current Status: **No Payment Integration**

This application currently has **no payment gateway** or monetization features.

### Cost Considerations

#### API Usage Costs

| Provider | Model | Pricing (Approx.) | Notes |
|----------|-------|-------------------|-------|
| **Google AI** | Gemma 3 27B IT | Free tier available | Check current pricing at ai.google.dev |
| **Mistral AI** | Mistral Large | Pay-per-token | Check pricing at mistral.ai/pricing |

#### Quota Management
**File:** `services/geminiService.ts` (Lines 52-62)

```typescript
function isQuotaError(error: any): boolean {
  const errorStr = JSON.stringify(error).toLowerCase();
  return (
    errorStr.includes('quota') ||
    errorStr.includes('rate limit') ||
    errorStr.includes('rate_limit') ||
    errorStr.includes('resource exhausted') ||
    errorStr.includes('429') ||
    (error.status && error.status === 429)
  );
}
```

### Adding Payment Integration (Future)

**Recommended Approach:**

1. **Choose Payment Provider:**
   - Stripe (Recommended for SaaS)
   - Razorpay (India)
   - PayPal

2. **Implementation Points:**
   - Add subscription tiers in `types.ts`
   - Create pricing page component
   - Add payment gateway integration
   - Implement usage tracking
   - Add billing dashboard

3. **Pricing Tiers (Example):**
   ```typescript
   const PRICING_TIERS = [
     { id: 'free', name: 'Free', price: 0, generations: 10 },
     { id: 'pro', name: 'Pro', price: 29, generations: 500 },
     { id: 'enterprise', name: 'Enterprise', price: 99, generations: -1 }
   ];
   ```

---

## 10. Quick Tweaks Checklist

### ✅ Common Customizations

#### Change App Name
- [ ] `Header.tsx` (Line 14) - Update `MedCopy`
- [ ] `index.html` (Line 6) - Update `<title>`
- [ ] `README.md` - Update documentation

#### Change Primary Color
- [ ] Search & replace `teal` with your color across all files
- [ ] Update `Header.tsx` logo background (Line 10)
- [ ] Update button hover states in `App.tsx`

#### Adjust Layout Proportions
- [ ] `App.tsx` (Line 291) - Change `lg:col-span-5` (input column)
- [ ] `App.tsx` (Line 292) - Change `lg:col-span-7` (output column)

#### Add New Persona
- [ ] `PresetSelector.tsx` - Add to `PRESETS` array
- [ ] Add icon import and mapping
- [ ] Test persona prompt quality

#### Modify AI Behavior
- [ ] `geminiService.ts` - Edit `SYSTEM_INSTRUCTION`
- [ ] `geminiService.ts` - Edit `antiAiStyleInstruction`
- [ ] Adjust temperature/config parameters

#### Change Drift Score Thresholds
- [ ] `App.tsx` (Lines 246-251) - Modify `getScoreColor()` function

#### Add API Key
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add `GEMINI_API_KEY`
- [ ] Optional: Add fallback keys

#### Enable Google Sheets
- [ ] Follow `GOOGLE_SHEETS_INTEGRATION.md`
- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_SPREADSHEET_ID`
- [ ] Test save functionality

---

## 📁 File Structure Reference

```
medcopy-real/
├── .env.example                 # Environment variable template
├── .env.local                   # Your actual environment variables (gitignored)
├── index.html                   # HTML entry point, Tailwind config, fonts
├── index.tsx                    # React entry point
├── App.tsx                      # Main application component
├── types.ts                     # TypeScript interfaces
├── vite.config.ts               # Build configuration, env variable exposure
├── package.json                 # Dependencies
├── components/
│   ├── Header.tsx               # App header with branding
│   └── PresetSelector.tsx       # Persona dropdown with 8 presets
├── services/
│   ├── geminiService.ts         # AI generation logic, multi-provider fallback
│   └── sheetService.ts          # Google Sheets integration
├── utils/
│   └── security.ts              # Log redaction & sanitization utilities
├── GOOGLE_SHEETS_INTEGRATION.md # Sheets setup guide
├── VISION.md                    # Vision Mode & Multimodal guide
├── GEMMA_3_IMAGE_CONFIG.md      # Image processing specs
├── OUTPUT_FORMATTING.md         # Premium styling guide
└── README.md                    # Project documentation
```

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development (Vite only - Frontend only)
npm run dev

# Start development (Vercel Serverless Mimic - LOCAL)
npm run vercel-dev

# Start development (Legacy Proxy + Vite)
npm run dev:proxy

# Build for production
npm run build
```

---

## 📝 Notes

- **Dark Mode:** Automatically enabled via `class="dark"` in `index.html`
- **Font:** Inter (Google Fonts) loaded in `index.html`
- **Icons:** Lucide React (imported via ESM)
- **Styling:** Tailwind CSS v3.4 (Local Installation, not CDN)
- **Build Tool:** Vite
- **State Management:** React useState (no external state library)

---

## 🚨 Breaking Changes to Avoid

1. **Don't remove** the `process.env.API_KEY` fallback in `geminiService.ts` - needed for backward compatibility
2. **Don't change** the `GenerationInputs` interface in `types.ts` without updating all usages
3. **Don't modify** the Google Sheets API scopes without updating OAuth consent screen
4. **Don't remove** the dark mode classes - many components depend on them
5. **Don't change** preset IDs in `PresetSelector.tsx` - may break saved user preferences

---

## 📞 Support

For detailed setup instructions, see:
- `README.md` - General overview
- `GOOGLE_SHEETS_INTEGRATION.md` - Sheets integration guide
- `.env.example` - Environment variable documentation

---


---

## 11. Vision & Multimodal Features

> **See [VISION.md](VISION.md) and [GEMMA_3_IMAGE_CONFIG.md](GEMMA_3_IMAGE_CONFIG.md) for full details.**

### Enabling Vision Mode
**File:** `App.tsx` (Line ~580)
- **Toggle**: Mutually exclusive with Batch, Carousel, and Summarizer modes.
- **Model**: `gemma-3-27b-it` (No fallback for Vision).

### Image Processing (Ultra-Fast Mode)
- **Resizing**: `App.tsx` resizes to **512px** max dimension on upload.
- **Timeout**: `geminiService.ts` uses a **300s** timeout for Vision calls.
- **Retries**: exponential backoff (2s, 4s, 8...) for 503 errors.

### Output Styling
- **Renderer**: `react-markdown` with Tailwind `@tailwindcss/typography`.
- **Tokens**: Cyan accents for emphasis, circle dots for lists, cyan borders for blockquotes.
- **Documentation**: See [OUTPUT_FORMATTING.md](OUTPUT_FORMATTING.md).

### Quick Tweaks
- **Change Resolution**: Update `MAX_WIDTH`/`MAX_HEIGHT` in `App.tsx` (Line 170).
- **Change Accent**: Replace `cyan` classes in `MarkdownComponents` in `App.tsx`.

---

**End of MASTER.md**
