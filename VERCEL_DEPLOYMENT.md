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

## 3. Deployment Flow
1. **Push to Main**: Vercel will automatically detect the `api/` directory and deploy the serverless functions.
2. **Build Settings**: 
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework Preset: `Vite`

## 4. Local Development
To test the serverless functions locally:
1. Install the Vercel CLI: `npm install -g vercel`
2. Run: `npm run vercel-dev` (orchestrated command)
3. This will launch the frontend and simulated serverless environment.

## 5. Security Verification
Once deployed, verify:
- [x] No API keys are visible in the browser's Network tab for initialization.
- [x] API calls are routed to `/api/generate` and `/api/save`.
- [x] Logs do not contain sensitive data.
