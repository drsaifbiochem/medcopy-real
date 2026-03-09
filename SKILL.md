---
name: medcopy-deployed-api-tool
description: Use this skill when an AI agent needs to call the deployed MedCopy API endpoints (/api/generate and /api/save) with exact payload formats, mode selection, and response parsing behavior.
---

# MedCopy Deployed API Tool Skill

Use this skill to connect an AI agent (including OpenClaw-style tool runners) to MedCopy in production.

## Built-In Personas You Can Use Immediately

`inputs.persona` supports free text. These are the exact built-in app personas:

1. `psychiatrist` - Empathetic Psychiatrist
2. `biochem_mentor` - Biochem Gold Medalist
3. `healthtech_saas` - B2B HealthTech Visionary
4. `ai_tinkerer` - Local AI & Tech Tinkerer
5. `polyclinic_owner` - Polyclinic Owner
6. `cardiologist` - Academic Cardiologist
7. `healthtech_founder` - Seed-Stage Founder
8. `empathetic_gp` - Empathetic GP

If you need exact prompt bodies, load `components/PresetSelector.tsx`.

## Supported Settings Catalog (No Guesswork)

Use this exact `inputs` schema and defaults:

1. `persona: string` (default `""`) - used
2. `format: string` (default `"LinkedIn Post"`) - used
3. `topic: string` (default `""`) - used
4. `context: string` (default `""`) - used across most modes (standard, batch, carousel, summarizer, poster, reel) as additional medical/RAG context
5. `audience: string` (default `"Layperson (Patient/Public)"`) - used
6. `includeCitations: boolean` (default `false`) - accepted, currently ignored by backend
7. `enableDistillation: boolean` (default `false`) - used
8. `batchMode: boolean` (default `false`) - used
9. `batchCount: number` (default `3`, UI range `1..5`) - used in batch mode
10. `carouselMode: boolean` (default `false`) - used
11. `includeHashtags: boolean` (default `false`) - accepted, currently ignored by backend
12. `summarizerMode: boolean` (default `false`) - used; when `true` switches server to summarizer mode
13. `examSummarizerMode: boolean` (default `false`) - used only when `summarizerMode=true` (exam/subtitle summarizer)
14. `imageMode: boolean` (default `false`) - used
15. `image: string` (default `""`, data URL) - used for vision mode
16. `angle: string` (default `""`) - used
17. `posterMode: boolean` (default `false`) - used; when `true` generates a structured poster template
18. `reelMode: boolean` (default `false`) - used; when `true` generates a structured 120–150s reel script
19. `advancedAnalysis: boolean` (default `false`) - used; when `true` switches the underlying model to `gemini-3.1-flash-lite-preview` for that call

### Format options in app UI

1. `LinkedIn Post`
2. `Twitter/X Thread`
3. `Instagram Caption`
4. `Patient Email Newsletter`
5. `Clinical Blog Post`
6. `Conference Abstract`
7. `Multi-Format Exploder` (available only when non-exclusive modes are off)

### Audience options in app UI

1. `Layperson (Patient/Public)`
2. `Medical Student`
3. `Licensed Clinician`
4. `Business Decision-Maker`

### Mode exclusivity rules enforced by UI

1. Enabling `batchMode` disables `carouselMode`, `summarizerMode`, `examSummarizerMode`, `imageMode`, `posterMode`, `reelMode`.
2. Enabling `carouselMode` disables `batchMode`, `summarizerMode`, `examSummarizerMode`, `imageMode`, `posterMode`, `reelMode`.
3. Enabling `summarizerMode` disables `batchMode`, `carouselMode`, `imageMode`, `posterMode`, `reelMode`.
4. Enabling `imageMode` disables `batchMode`, `carouselMode`, `summarizerMode`, `examSummarizerMode`, `posterMode`, `reelMode`.
5. Enabling `posterMode` disables `batchMode`, `carouselMode`, `summarizerMode`, `examSummarizerMode`, `imageMode`, `reelMode`.
6. Enabling `reelMode` disables `batchMode`, `carouselMode`, `summarizerMode`, `examSummarizerMode`, `imageMode`, `posterMode`.

## Inputs You Need First

1. `base_url`
- Example: `https://your-app.vercel.app`

2. Generation inputs (`inputs` object)
- Use exact structure from this skill.

3. Save inputs (`data`, optional `accessToken`, optional `payload`)
- Needed only if saving to Sheets via `/api/save`.

## Endpoint Contracts

1. `POST {base_url}/api/generate`
- Body must be:
```json
{ "inputs": { ... } }
```

2. `POST {base_url}/api/save`
- Body must be:
```json
{
  "data": [["timestamp","persona","topic","format","audience","driftScore","content"]],
  "accessToken": "optional-oauth-token",
  "payload": { "optional": "structured save object" }
}
```

3. `OPTIONS` is supported on both endpoints.
4. Non-`POST` methods return `405`.

## Canonical `inputs` Payload

```json
{
  "persona": "You are an empathetic GP...",
  "format": "LinkedIn Post",
  "topic": "Prediabetes lifestyle changes",
  "context": "",
  "audience": "Layperson (Patient/Public)",
  "includeCitations": false,
  "enableDistillation": true,
  "batchMode": false,
  "batchCount": 3,
  "carouselMode": false,
  "includeHashtags": false,
  "summarizerMode": false,
  "examSummarizerMode": false,
  "imageMode": false,
  "image": "",
  "posterMode": false,
  "reelMode": false,
  "advancedAnalysis": false,
  "angle": "Practical 7-day starter plan"
}
```

## Mode Selection Rules

Choose one primary generation mode per call:

1. Standard mode
- `batchMode=false`, `carouselMode=false`, `imageMode=false`, `posterMode=false`, `reelMode=false`, `format != "Multi-Format Exploder"`
- Parse response from `content`.

2. Multi-format mode
- `format="Multi-Format Exploder"`
- Parse response from `multiFormatOutput`.

3. Batch mode
- `batchMode=true`
- Parse response from `batchOutput`.

4. Carousel mode
- `carouselMode=true`
- Parse response from `carouselOutput`.

5. Vision mode
- `imageMode=true` and `image="data:image/jpeg;base64,..."`
- Parse response from `content`.

6. Poster mode
- `posterMode=true`
- Prefer `posterOutput`; `content` is a generic description string.

7. Reel mode
- `reelMode=true`
- Prefer `reelOutput`; `content` is a generic description string.

## Response Parsing Priority

Always parse in this order:

1. If `multiFormatOutput` exists, use it.
2. Else if `carouselOutput` exists, use it.
3. Else if `batchOutput` exists, use it.
4. Else use `content`.

Then read optional metadata:
- `driftScore`
- `driftReasoning`
- `distilledInsight`

## Error Handling Rules

1. `400`: bad payload (usually missing `inputs`).
2. `405`: wrong HTTP method.
3. `429`: all Gemini keys exhausted.
4. `500`: server/config/model error.
5. `/api/save` may return `401` when Apps Script fallback fails and no `accessToken` is provided.

On non-2xx:
- Surface `error` and `details` directly to caller.
- Do not assume response shape beyond JSON error fields.

## Fields Accepted but Not Fully Used by Backend Logic

These fields are accepted in `inputs` but currently **do not change generation logic directly** (they may be incorporated later):
- `includeCitations`
- `includeHashtags`

## OpenClaw-Style Tool Definitions

Use two tools.

### Tool 1: Generate

```json
{
  "name": "medcopy_generate",
  "description": "Generate medical content through deployed MedCopy API.",
  "input_schema": {
    "type": "object",
    "properties": {
      "base_url": { "type": "string" },
      "inputs": { "type": "object" }
    },
    "required": ["base_url", "inputs"]
  }
}
```

Execution:
- `POST {base_url}/api/generate`
- Body: `{"inputs": <inputs>}`

### Tool 2: Save

```json
{
  "name": "medcopy_save",
  "description": "Save MedCopy output to Sheets through deployed proxy.",
  "input_schema": {
    "type": "object",
    "properties": {
      "base_url": { "type": "string" },
      "data": { "type": "array" },
      "accessToken": { "type": "string" },
      "payload": { "type": "object" }
    },
    "required": ["base_url", "data"]
  }
}
```

Execution:
- `POST {base_url}/api/save`
- Body: `{"data": ..., "accessToken": "...", "payload": {...}}`

## Working Examples

### Example A: Standard LinkedIn Post

Request body:
```json
{
  "inputs": {
    "persona": "You are an empathetic GP.",
    "format": "LinkedIn Post",
    "topic": "Prediabetes lifestyle changes",
    "context": "",
    "audience": "Layperson (Patient/Public)",
    "includeCitations": false,
    "enableDistillation": true,
    "batchMode": false,
    "batchCount": 3,
    "carouselMode": false,
    "includeHashtags": false,
    "summarizerMode": false,
    "examSummarizerMode": false,
    "imageMode": false,
    "angle": "Actionable 7-day plan"
  }
}
```

Response fields used:
- `content`
- `driftScore`
- `driftReasoning`
- `distilledInsight`

### Example B: Multi-Format Exploder

Set:
- `format: "Multi-Format Exploder"`

Response field used:
- `multiFormatOutput.linkedin`
- `multiFormatOutput.instagram`
- `multiFormatOutput.twitter`
- `multiFormatOutput.email`

### Example C: Save Output

Request body:
```json
{
  "data": [
    [
      "2026-03-08 10:00",
      "Empathetic GP",
      "Prediabetes lifestyle changes",
      "LinkedIn Post",
      "Layperson (Patient/Public)",
      "92%",
      "Generated content here..."
    ]
  ],
  "accessToken": "optional",
  "payload": {
    "persona": "Empathetic GP",
    "topic": "Prediabetes lifestyle changes",
    "format": "LinkedIn Post",
    "audience": "Layperson (Patient/Public)",
    "driftScore": 92,
    "driftReasoning": "Strong alignment",
    "distilledInsight": "Small daily habits delay progression",
    "content": "Generated content here..."
  }
}
```

Success response:
```json
{ "success": true, "method": "apps-script" }
```
or
```json
{ "success": true, "method": "direct-api" }
```
