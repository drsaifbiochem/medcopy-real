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
| `GEMINI_API_KEY` | Primary Gemini API Key |
| `GEMINI_API_KEY_2` | Backup Key (Optional for rotation) |
| `GEMINI_API_KEY_3` | Backup Key (Optional for rotation) |
| `GOOGLE_SPREADSHEET_ID` | The ID of your target Google Sheet |
| `GOOGLE_APPS_SCRIPT_URL` | Optional: Deployment URL for Sheets Apps Script |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID for Google Sheets authentication |

> [!IMPORTANT]
> Do NOT prefix AI keys with `VITE_`. Only public keys like `VITE_GOOGLE_CLIENT_ID` should have the prefix to be accessible in the browser.

## 3. Deployment Flow
1. **Push to Main**: Vercel will automatically detect the `api/` directory and deploy the serverless functions.
2. **Build Settings**: 
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework Preset: `Vite`

## 4. Local Development
To test the serverless functions locally:
1. Install the Vercel CLI: `npm install -g vercel`
2. Run: `vercel dev`
3. This will launch the frontend on port 3000 and the serverless functions on port 3001 (automatically proxied).

## 5. Security Verification
Once deployed, verify:
- [ ] No API keys are visible in the browser's Network tab for initialization.
- [ ] API calls are routed to `/api/generate`.
- [ ] Logs do not contain sensitive data.
