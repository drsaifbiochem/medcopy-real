# GEMMA_3_IMAGE_CONFIG.md

> **Status:** Active
> **Model:** gemma-3-27b-it
> **Encoder:** SigLIP (S-14)
> **Native Resolution:** 512x512 (Ultra-Fast Mode)

---

## 1. Overview
This document outlines the strict configuration required to successfully use `gemma-3-27b-it` for vision tasks within the MedCopy ecosystem. Due to the experimental nature of the model and its specific vision encoder architecture, precise adherence to these parameters is required to avoid `503 Service Unavailable` and `Deadline Exceeded` errors.

## 2. Image Processing Pipeline

### 2.1 Native Resolution (Critical)
The Gemma 3 vision encoder (SigLIP) is optimized for a specific resolution. Sending images larger than this resolution forces server-side resizing, which adds significant latency and is the primary cause of timeouts.

*   **Target Resolution:** **512x512 pixels** (Optimized for Speed/Reliability)
*   **Implementation:** Client-side resizing in `App.tsx` via HTML5 Canvas.
*   **Aspect Ratio:** Maintained. The largest dimension is scaled to 512px.

```typescript
// App.tsx Image Logic
const MAX_WIDTH = 512;  // Ultra-Fast Mode
const MAX_HEIGHT = 512; 
// Resizing logic ensures largest dimension <= 512 while preserving aspect ratio
```

### 2.2 Format & Compression
*   **Format:** JPEG (Standard)
*   **Quality:** 0.8 (80%)
*   **Encoding:** Base64 Data URI
*   **Max Payload Size:** ~200KB - 500KB (Result of 896px + 0.8 quality).

## 3. API Configuration

### 3.1 Model Definition
The model must be explicitly defined. Do not use aliases or general "gemini-pro-vision" tags.

```typescript
model: 'gemma-3-27b-it'
```

### 3.2 Timeout Settings
Vision tasks on this 27B parameter model are compute-intensive. Standard timeouts (30s - 60s) are insufficient.

*   **Minimum Timeout:** 120,000ms (120s)
*   **Recommended Timeout:** **300,000ms (300s)**

### 3.3 Prompt Structure
The prompt structure strictly follows the specific multimodal format required by the Google GenAI SDK for custom models.

```typescript
contents: [
  {
    role: 'user', 
    parts: [
      { text: `${SYSTEM_INSTRUCTION}\n\n${visionPrompt}` },
      { inlineData: { mimeType: mimeType, data: base64Data } }
    ]
  }
]
```

### 3.4 Reliability Strategy (New)
*   **Smart Query Retry**: Automatically detects 503/Quota errors.
*   **Exponential Backoff**: Implemented delays between retries (1s, 2s, 4s, etc.) to prevent thundering herd effects on the API during outages.

## 4. Fallback Strategy
**Current Status: DISABLED** (User enforced strict model adherence).

Previously, a fallback to `gemini-2.0-flash` was implemented. This has been removed to force all generation through `gemma-3-27b-it`. If the model fails despite the 896px optimization and 300s timeout, the request will error out.

## 5. Troubleshooting Matrix

| Error | Cause | Fix |
| :--- | :--- | :--- |
| `503 Service Unavailable` | Model Overload / Image too large | Ensure image is resized to max 896px side. Retry. |
| `Deadline Exceeded` | Timeout too short | Increase timeout to 300s+ in `geminiService.ts`. |
| `400 Invalid Argument` | Wrong model or prompt format | Verify model name is `gemma-3-27b-it`. |
| `Inaccurate/Low Res Analysis` | Image compressed too heavily | 896px is a trade-off. Ensure source image is high contrast. |
