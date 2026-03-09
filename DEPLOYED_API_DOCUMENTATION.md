# MedCopy Deployed API Documentation

This document reflects the **actual deployed serverless API behavior** from:
- `api/generate.js`
- `api/save.js`

Base URL:
- `https://<your-vercel-domain>.vercel.app`

All endpoints accept CORS and `OPTIONS` preflight.

## Built-In Persona Catalog (From App Presets)

`inputs.persona` accepts any string, but these are the exact built-in personas in the app:

1. `psychiatrist` - Empathetic Psychiatrist
- Destigmatize mental health, warm/validating.

2. `biochem_mentor` - Biochem Gold Medalist
- Energetic, mnemonic-heavy teaching style.

3. `healthtech_saas` - B2B HealthTech Visionary
- Physician-founder, ROI/compliance focused.

4. `ai_tinkerer` - Local AI & Tech Tinkerer
- Doctor-dev, privacy/open-source focused.

5. `polyclinic_owner` - Polyclinic Owner
- Community-oriented, plain-language clinical voice.

6. `cardiologist` - Academic Cardiologist
- Evidence-based, formal, guideline-driven.

7. `healthtech_founder` - Seed-Stage Founder
- Punchy startup tone for healthcare buyers/VCs.

8. `empathetic_gp` - Empathetic GP
- Warm, patient-centered family medicine voice.

Source: `components/PresetSelector.tsx`.

## Settings Catalog (What You Can Send via API)

### `inputs` fields, defaults, and effective behavior

1. `persona` (string, default `""`)
- Used by backend.

2. `format` (string, default `"LinkedIn Post"`)
- Used by backend.
- UI options:
  - `LinkedIn Post`
  - `Twitter/X Thread`
  - `Instagram Caption`
  - `Patient Email Newsletter`
  - `Clinical Blog Post`
  - `Conference Abstract`
  - `Multi-Format Exploder` (shown only when batch/carousel/summarizer/image are off)

3. `topic` (string, default `""`)
- Used by backend.

4. `context` (string, default `""`)
- Used by backend in most modes (standard, batch, carousel, summarizer, poster, reel) as additional medical/RAG context.

5. `audience` (string, default `"Layperson (Patient/Public)"`)
- Used by backend.
- UI options:
  - `Layperson (Patient/Public)`
  - `Medical Student`
  - `Licensed Clinician`
  - `Business Decision-Maker`

6. `includeCitations` (boolean, default `false`)
- Accepted, currently ignored by backend.

7. `enableDistillation` (boolean, default `false`)
- Used by backend only when `topic` is non-empty.

8. `batchMode` (boolean, default `false`)
- Used by backend.

9. `batchCount` (number, default `3`)
- Used by backend only for `batchMode=true`.
- UI slider range: `1` to `5`.

10. `carouselMode` (boolean, default `false`)
- Used by backend.

11. `includeHashtags` (boolean, default `false`)
- Accepted, currently ignored by backend.

12. `summarizerMode` (boolean, default `false`)
- Used by backend. When `true`, switches `/api/generate` into summarizer mode (deep-dive analyzer for long documents).

13. `examSummarizerMode` (boolean, default `false`)
- Used by backend only when `summarizerMode=true`. Enables exam/subtitle-focused summarization (e.g. NEET-PG/USMLE from timestamped captions).

14. `imageMode` (boolean, default `false`)
- Used by backend when true and `image` is present.

15. `image` (string data URL, default `""`)
- Used by backend only for image mode.
- UI accepts image uploads and compresses to JPEG data URL (max dimension 512).

16. `angle` (string, default `""`)
- Used by backend.

17. `posterMode` (boolean, default `false`)
- Used by backend. When `true`, generates a structured poster template instead of plain text.

18. `reelMode` (boolean, default `false`)
- Used by backend. When `true`, generates a structured 120–150 second reel/short script with segments, caption, and hashtags.

19. `advancedAnalysis` (boolean, default `false`)
- Used by backend. When `true`, the server uses `gemini-3.1-flash-lite-preview` for that single request instead of the default `gemma-3-27b-it`.

### UI mode exclusivity rules (what app enforces)

When enabled in UI:
- `batchMode=true` forces `carouselMode=false`, `summarizerMode=false`, `examSummarizerMode=false`, `imageMode=false`, `posterMode=false`, `reelMode=false`.
- `carouselMode=true` forces `batchMode=false`, `summarizerMode=false`, `examSummarizerMode=false`, `imageMode=false`, `posterMode=false`, `reelMode=false`.
- `summarizerMode=true` forces `batchMode=false`, `carouselMode=false`, `imageMode=false`, `posterMode=false`, `reelMode=false`.
- `imageMode=true` forces `batchMode=false`, `carouselMode=false`, `summarizerMode=false`, `examSummarizerMode=false`, `posterMode=false`, `reelMode=false`.
- `posterMode=true` forces `batchMode=false`, `carouselMode=false`, `summarizerMode=false`, `examSummarizerMode=false`, `imageMode=false`, `reelMode=false`.
- `reelMode=true` forces `batchMode=false`, `carouselMode=false`, `summarizerMode=false`, `examSummarizerMode=false`, `imageMode=false`, `posterMode=false`.

## 1. Endpoint Summary

1. `POST /api/generate`
- Generates medical/health-tech content using `gemma-3-27b-it` by default.
- When `inputs.advancedAnalysis=true`, uses `gemini-3.1-flash-lite-preview` for that request only.
- Supports standard, summarizer, image/vision, batch, carousel, poster, reel, and multi-format modes.

2. `POST /api/save`
- Saves output to Google Sheets.
- Tries Apps Script first (`GOOGLE_APPS_SCRIPT_URL`), then direct Sheets API if OAuth token is provided.

## 2. `POST /api/generate`

### Methods

- `POST`: supported
- `OPTIONS`: returns `200`
- anything else: `405 {"error":"Method Not Allowed"}`

### Headers

- `Content-Type: application/json`

### Request Body

```json
{
  "inputs": {
    "persona": "string",
    "format": "LinkedIn Post | Twitter/X Thread | Instagram Caption | Patient Email Newsletter | Clinical Blog Post | Conference Abstract | Multi-Format Exploder | any string",
    "topic": "string",
    "context": "string",
    "audience": "string",
    "includeCitations": false,
    "enableDistillation": false,
    "batchMode": false,
    "batchCount": 3,
    "carouselMode": false,
    "includeHashtags": false,
    "summarizerMode": false,
    "examSummarizerMode": false,
    "imageMode": false,
    "image": "data:image/jpeg;base64,...",
    "posterMode": false,
    "reelMode": false,
    "advancedAnalysis": false,
    "angle": "string"
  }
}
```

### Important Runtime Behavior (Exact)

- Required top-level key: `inputs`.
- API key rotation: tries `GEMINI_API_KEY` through `_5`.
- Quota-like failures (`429/503/resource exhausted/rate limit`) rotate to next key.
- `enableDistillation=true` with non-empty `topic` adds a first-pass distilled insight.
- `summarizerMode=true` triggers summarizer flow; if `examSummarizerMode=true` it uses the exam/subtitle-optimized prompt.
- `format === "Multi-Format Exploder"` triggers multi-format JSON output.
- `imageMode && image` triggers image generation branch.
- `carouselMode` triggers carousel JSON output.
- `batchMode` triggers array output.
- `posterMode` triggers poster JSON output.
- `reelMode` triggers reel/short-script JSON output.
- `advancedAnalysis=true` switches the underlying model to `gemini-3.1-flash-lite-preview` for this call; otherwise `gemma-3-27b-it` is used.
- `includeCitations` and `includeHashtags` are still accepted but currently ignored by backend logic.
- `image` is parsed as data URL and sent with MIME hardcoded to `image/jpeg`.

### Response Shapes

1. Standard mode
```json
{
  "content": "string",
  "driftScore": 0,
  "driftReasoning": "string",
  "distilledInsight": "string"
}
```

2. Image mode (`imageMode=true` and `image` present)
```json
{
  "content": "string",
  "driftScore": 100,
  "distilledInsight": "string | null"
}
```

3. Carousel mode (`carouselMode=true`)
```json
{
  "carouselOutput": [
    {
      "slideNumber": 1,
      "title": "string",
      "content": "string",
      "visualDescription": "string"
    }
  ],
  "driftScore": 100,
  "distilledInsight": "string | null"
}
```

4. Batch mode (`batchMode=true`)
```json
{
  "batchOutput": ["string", "string"],
  "driftScore": 100,
  "distilledInsight": "string | null"
}
```

5. Multi-format mode (`format="Multi-Format Exploder"`)
```json
{
  "multiFormatOutput": {
    "linkedin": "string",
    "instagram": "string",
    "twitter": "string",
    "email": "string"
  },
  "driftScore": 100,
  "distilledInsight": "string | null"
}
```

6. Poster mode (`posterMode=true`)
```json
{
  "posterOutput": {
    "headline": "string",
    "subheadline": "string",
    "keyPoints": ["string", "string"],
    "callToAction": "string",
    "visualSuggestions": "string",
    "footerInfo": "string"
  },
  "content": "Poster Template Generated.",
  "driftScore": 100,
  "distilledInsight": "string | null"
}
```

7. Reel mode (`reelMode=true`)
```json
{
  "reelOutput": {
    "hook": "string",
    "script": [
      { "time": "0-5s", "visual": "string", "audio": "string" }
    ],
    "caption": "string",
    "hashtags": ["string", "string"]
  },
  "content": "Reel Script Generated.",
  "driftScore": 100,
  "distilledInsight": "string | null"
}
```

### Error Responses

- `400`: `{"error":"Missing inputs in request body."}`
- `405`: `{"error":"Method Not Allowed"}`
- `429`: `{"error":"All keys exhausted. Last error: ..."}`
- `500`: 
  - `{"error":"No Gemini API keys found in server environment variables."}`
  - or sanitized error object/string
  - or `{"error":"A critical server error occurred.","details":...}`

### cURL Examples

1. Standard generation
```bash
curl -X POST "https://<your-vercel-domain>.vercel.app/api/generate" ^
  -H "Content-Type: application/json" ^
  -d "{\"inputs\":{\"persona\":\"You are an empathetic GP.\",\"format\":\"LinkedIn Post\",\"topic\":\"Prediabetes lifestyle changes\",\"context\":\"\",\"audience\":\"Layperson (Patient/Public)\",\"includeCitations\":false,\"enableDistillation\":true,\"batchMode\":false,\"batchCount\":3,\"carouselMode\":false,\"includeHashtags\":false,\"summarizerMode\":false,\"examSummarizerMode\":false,\"imageMode\":false,\"angle\":\"Practical 7-day starter plan\"}}"
```

2. Multi-format exploder
```bash
curl -X POST "https://<your-vercel-domain>.vercel.app/api/generate" ^
  -H "Content-Type: application/json" ^
  -d "{\"inputs\":{\"persona\":\"You are a healthtech founder.\",\"format\":\"Multi-Format Exploder\",\"topic\":\"AI triage in OPD\",\"context\":\"\",\"audience\":\"Business Decision-Maker\",\"includeCitations\":false,\"enableDistillation\":false,\"batchMode\":false,\"batchCount\":3,\"carouselMode\":false,\"includeHashtags\":false,\"summarizerMode\":false,\"examSummarizerMode\":false,\"imageMode\":false,\"angle\":\"ROI + patient safety\"}}"
```

3. Carousel mode
```bash
curl -X POST "https://<your-vercel-domain>.vercel.app/api/generate" ^
  -H "Content-Type: application/json" ^
  -d "{\"inputs\":{\"persona\":\"You are a biochem mentor.\",\"format\":\"Instagram Caption\",\"topic\":\"Thyroid function tests\",\"context\":\"\",\"audience\":\"Medical Student\",\"includeCitations\":false,\"enableDistillation\":false,\"batchMode\":false,\"batchCount\":3,\"carouselMode\":true,\"includeHashtags\":false,\"summarizerMode\":false,\"examSummarizerMode\":false,\"imageMode\":false,\"angle\":\"Common mistakes interns make\"}}"
```

4. Image mode
```bash
curl -X POST "https://<your-vercel-domain>.vercel.app/api/generate" ^
  -H "Content-Type: application/json" ^
  -d "{\"inputs\":{\"persona\":\"You are an academic cardiologist.\",\"format\":\"Clinical Blog Post\",\"topic\":\"ECG interpretation\",\"context\":\"\",\"audience\":\"Licensed Clinician\",\"includeCitations\":false,\"enableDistillation\":false,\"batchMode\":false,\"batchCount\":3,\"carouselMode\":false,\"includeHashtags\":false,\"summarizerMode\":false,\"examSummarizerMode\":false,\"imageMode\":true,\"image\":\"data:image/jpeg;base64,<BASE64>\",\"angle\":\"Red flags\"}}"
```

## 3. `POST /api/save`

### Methods

- `POST`: supported
- `OPTIONS`: returns `200`
- anything else: `405 {"error":"Method Not Allowed"}`

### Headers

- `Content-Type: application/json`

### Request Body

```json
{
  "data": [
    ["timestamp", "persona", "topic", "format", "audience", "driftScore", "content"]
  ],
  "accessToken": "ya29....",
  "payload": {
    "persona": "string",
    "topic": "string",
    "format": "string",
    "audience": "string",
    "driftScore": 0,
    "driftReasoning": "string",
    "distilledInsight": "string",
    "content": "string"
  }
}
```

### Save Flow (Exact)

1. Requires env `GOOGLE_SPREADSHEET_ID`, else `500`.
2. If `GOOGLE_APPS_SCRIPT_URL` exists:
- sends `payload || data` to Apps Script URL.
- if Apps Script returns `2xx`: `{"success":true,"method":"apps-script"}`.
3. If Apps Script missing/fails:
- requires `accessToken`, else `401`.
- appends `data` to `A1` via Sheets API append.
- success: `{"success":true,"method":"direct-api"}`.

### Error Responses

- `401`:
```json
{
  "error": "Authentication required.",
  "details": "No OAuth token provided and background saver is not responding."
}
```

- `500` examples:
```json
{"error":"GOOGLE_SPREADSHEET_ID not configured on server."}
```
```json
{"error":"Sheets API proxy failed.","details":"..."}
```

### cURL Example (Apps Script or token fallback)

```bash
curl -X POST "https://<your-vercel-domain>.vercel.app/api/save" ^
  -H "Content-Type: application/json" ^
  -d "{\"data\":[[\"2026-03-08 10:00\",\"Empathetic GP\",\"Prediabetes\",\"LinkedIn Post\",\"Layperson\",\"92%\",\"...content...\"]],\"accessToken\":\"<OPTIONAL_OAUTH_TOKEN>\",\"payload\":{\"persona\":\"Empathetic GP\",\"topic\":\"Prediabetes\",\"format\":\"LinkedIn Post\",\"audience\":\"Layperson\",\"driftScore\":92,\"driftReasoning\":\"Strong persona tone\",\"distilledInsight\":\"Small daily wins prevent progression\",\"content\":\"...content...\"}}"
```

## 4. Environment Variables Required for Deployment

1. For `/api/generate`
- `GEMINI_API_KEY` (required)
- `GEMINI_API_KEY_2..5` (optional fallback)

2. For `/api/save`
- `GOOGLE_SPREADSHEET_ID` (required)
- `GOOGLE_APPS_SCRIPT_URL` (optional but recommended)
- `GOOGLE_CLIENT_ID` (frontend OAuth usage)

## 5. Agent Tool Integration Templates

### A. Tool schema for generation

```json
{
  "name": "medcopy_generate",
  "description": "Generate persona-driven medical content through deployed MedCopy API.",
  "input_schema": {
    "type": "object",
    "properties": {
      "inputs": { "type": "object" }
    },
    "required": ["inputs"]
  }
}
```

### B. Tool invocation contract

- URL: `POST https://<your-vercel-domain>.vercel.app/api/generate`
- body: `{"inputs": ... }`
- parse by priority:
1. `multiFormatOutput`
2. `carouselOutput`
3. `batchOutput`
4. `content`

### C. Tool schema for save

```json
{
  "name": "medcopy_save",
  "description": "Persist generated output via MedCopy /api/save.",
  "input_schema": {
    "type": "object",
    "properties": {
      "data": { "type": "array" },
      "accessToken": { "type": "string" },
      "payload": { "type": "object" }
    },
    "required": ["data"]
  }
}
```
