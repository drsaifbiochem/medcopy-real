# 🚀 MedCopy Vercel Deployment Guide

This guide ensures a secure, hardened deployment of MedCopy on Vercel using Serverless Functions.

## 1. Project Prerequisites
- A **Vercel Account** connected to your repository.
- **Google Gemini API Keys** (at least one).
- **Google Sheets Spreadsheet ID** (for data export).
- **Google Apps Script URL** (Optional, for secondary backup).

## 2. Setting Environment Variables
Add the following secrets to your **Vercel Dashboard > Settings > Environment Variables**:

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Primary Gemini API Key (Server-side only) |
| `GEMINI_API_KEY_2` | Backup Key (Optional for rotation) |
| `GEMINI_API_KEY_3` | Backup Key (Optional for rotation) |
| `GOOGLE_SPREADSHEET_ID` | The ID of your target Google Sheet (Server-side) |
| `GOOGLE_APPS_SCRIPT_URL` | Optional: Deployment URL for Sheets Apps Script |
| `GOOGLE_CLIENT_ID` | OAuth Client ID for Google Sheets authentication |

> [!IMPORTANT]
> Do NOT prefix AI keys or Spreadsheet IDs with `VITE_`. Only the public `GOOGLE_CLIENT_ID` is exposed to the browser via the `define` block in `vite.config.ts`.

## 3. Architecture Details
- **Module System**: This project uses **ES Modules** (`"type": "module"` in `package.json`).
- **Function Structure**: Functions in the `api/` directory must use `export default` syntax.
- **SDK Requirement**: Use `@google/generative-ai` (Stable) instead of `@google/genai` (Preview).
- **Prompt Pattern**: Use the **Prepend Prompt Pattern** (joining instructions to the prompt) instead of the `systemInstruction` parameter to ensure compatibility with models like `gemma-3-27b-it`.
- **Runtime**: Node.js 18+ is recommended.

## 4. Performance & Timeouts
The `api/generate.js` function is configured with a `maxDuration: 60`. 
- **Hobby Plan**: Vercel's free tier has a **10s** execution limit. Complex Vision sessions might time out. 
- **Pro Plan**: Supports the configured duration (up to 300s). 

## 5. Local Development
To test the serverless functions locally:
1. Install the Vercel CLI: `npm install -g vercel`
2. Run: `npm run vercel-dev` (orchestrated command)
3. This will launch the frontend and simulated serverless environment.

## 6. Security Verification & Troubleshooting
- [x] **Key Isolation**: No API keys are visible in the browser's Network tab.
- [x] **Routing**: API calls go to `/api/generate` and `/api/save`.
- [ ] **500 Errors**: If you encounter 500 errors after adding new files to `api/`, ensure they use `import` instead of `require`.
- [ ] **Instruction Errors**: If you see `systemInstruction is not enabled for models/...`, ensure you are using the **Prepend Prompt Pattern** in your `model.generateContent` calls.
- [ ] **Logs**: Check Vercel Dashboard logs for detailed error tracebacks.
