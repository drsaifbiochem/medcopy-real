const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============================================
// SHARED UTILITIES
// ============================================

function loadAvailableKeys() {
    const keys = [];
    const geminiKeys = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3,
        process.env.GEMINI_API_KEY_4,
        process.env.GEMINI_API_KEY_5
    ];

    geminiKeys.forEach((key, index) => {
        if (key && key.trim() && !key.includes('your_')) {
            keys.push({ key: key.trim(), provider: 'gemini', index: index + 1 });
        }
    });
    return keys;
}

function isQuotaError(error) {
    const errorStr = JSON.stringify(error).toLowerCase();
    return (
        errorStr.includes('quota') ||
        errorStr.includes('rate limit') ||
        errorStr.includes('rate_limit') ||
        errorStr.includes('resource exhausted') ||
        errorStr.includes('429') ||
        errorStr.includes('503') ||
        errorStr.includes('unavailable')
    );
}

function sanitizeError(error) {
    if (!error) return error;
    try {
        const raw = JSON.stringify(error, Object.getOwnPropertyNames(error));
        return JSON.parse(raw.replace(/AIzaSy[A-Za-z0-9_-]{35}/g, '[REDACTED]'));
    } catch (e) {
        return { message: "An error occurred, but details were redacted for security." };
    }
}

// ============================================
// PROMPT TEMPLATES (MIGRATED FROM SERVICE)
// ============================================

const SYSTEM_INSTRUCTION = `You are MedCopy, a medically grounded content generation engine.
Your job is to generate persona-driven medical or health-tech content that is accurate, credible, and publication-ready.
1. Medical Accuracy Is Mandatory.
2. Persona Fidelity is key.
3. No AI fluff, buzzwords, or generic marketing sentences.`;

const ANTI_AI_STYLE = `
WRITING STYLE:
• Use clear, simple language.
• Short, impactful sentences.
• Active voice.
• Practical, actionable insights.
• Address reader as "you".
• NO bolding (**), italics (*), or em-dashes (—).
• AVOID: delve, embark, game-changer, unlock, groundbreaking, world where, navigate, etc.
`;

// ============================================
// AI GENERATION ENDPOINT
// ============================================
// 1. AI Generation Route
app.post('/api/generate', async (req, res) => {
    const { inputs } = req.body;
    const availableKeys = loadAvailableKeys();

    if (availableKeys.length === 0) {
        return res.status(500).json({ error: "No Gemini API keys found in server .env files." });
    }

    let lastError = null;
    let currentKeyIndex = 0;

    while (currentKeyIndex < availableKeys.length) {
        const currentKey = availableKeys[currentKeyIndex];

        try {
            const genAI = new GoogleGenerativeAI(currentKey.key);
            const model = genAI.getGenerativeModel({
                model: 'gemma-3-27b-it'
            });

            const PREPEND_PROMPT = `${SYSTEM_INSTRUCTION}\n${ANTI_AI_STYLE}\n\n`;

            let currentTopic = inputs.topic;
            let distilledInsight = null;

            // 1. Optional Distillation
            if (inputs.enableDistillation) {
                const dResult = await model.generateContent(`${PREPEND_PROMPT}RAW NOTES: "${inputs.topic}"\n\nDistill into ONE clear, opinionated medical insight. Output ONLY the insight.`);
                distilledInsight = dResult.response.text().trim();
                currentTopic = `INSIGHT: "${distilledInsight}"\n(Source: ${inputs.topic})`;
            }

            // 2. Generation Logic
            let result;

            if (inputs.imageMode && inputs.image) {
                const base64Data = inputs.image.split(',')[1];
                const prompt = `${PREPEND_PROMPT}VISION ANALYSIS: ${inputs.persona}\nTOPIC: ${currentTopic}\nAUDIENCE: ${inputs.audience}`;
                result = await model.generateContent([
                    prompt,
                    { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                ]);
                return res.json({ content: result.response.text(), driftScore: 100, distilledInsight });
            }

            if (inputs.carouselMode) {
                const prompt = `${PREPEND_PROMPT}GENERATE INSTAGRAM CAROUSEL JSON (5-10 slides).\nPERSONA: ${inputs.persona}\nTOPIC: ${currentTopic}\nAUDIENCE: ${inputs.audience}\nSCHEMA: [{slideNumber, title, content, visualDescription}]`;
                result = await model.generateContent(prompt);
                const text = result.response.text();
                const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
                return res.json({ carouselOutput: JSON.parse(jsonMatch[1].trim()), driftScore: 100, distilledInsight });
            }

            if (inputs.batchMode) {
                const prompt = `${PREPEND_PROMPT}GENERATE ${inputs.batchCount} UNIQUE VARIATIONS AS JSON ARRAY.\nPERSONA: ${inputs.persona}\nTOPIC: ${currentTopic}\nFORMAT: ${inputs.format}`;
                result = await model.generateContent(prompt);
                const text = result.response.text();
                const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
                return res.json({ batchOutput: JSON.parse(jsonMatch[1].trim()), driftScore: 100, distilledInsight });
            }

            if (inputs.format === 'Multi-Format Exploder') {
                const prompt = `${PREPEND_PROMPT}GENERATE MULTI-PLATFORM CONTENT JSON.\nPERSONA: ${inputs.persona}\nTOPIC: ${currentTopic}\nPLATFORMS: linkedin, instagram, twitter, email`;
                result = await model.generateContent(prompt);
                const text = result.response.text();
                const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
                return res.json({ multiFormatOutput: JSON.parse(jsonMatch[1].trim()), driftScore: 100, distilledInsight });
            }

            // Standard Content + Drift Detection
            const mainPrompt = `${PREPEND_PROMPT}PERSONA: ${inputs.persona}\nFORMAT: ${inputs.format}\nTOPIC: ${currentTopic}\nCONTEXT: ${inputs.context}\nAUDIENCE: ${inputs.audience}`;
            result = await model.generateContent(mainPrompt);
            const draftContent = result.response.text();

            const driftPrompt = `${PREPEND_PROMPT}Evaluate persona alignment: "${inputs.persona}"\nCONTENT:\n${draftContent}\n\nReturn JSON: {score: 0-100, reasoning: string, finalContent: string}`;
            const driftResult = await model.generateContent(driftPrompt);
            const driftText = driftResult.response.text();
            const driftMatch = driftText.match(/```json\s*([\s\S]*?)\s*```/) || [null, driftText];
            const parsedDrift = JSON.parse(driftMatch[1].trim());

            return res.json({
                content: parsedDrift.finalContent || draftContent,
                driftScore: parsedDrift.score,
                driftReasoning: parsedDrift.reasoning,
                distilledInsight
            });

        } catch (error) {
            lastError = error;
            if (isQuotaError(error)) {
                currentKeyIndex++;
                continue;
            }
            return res.status(500).json({ error: sanitizeError(error) });
        }
    }

    res.status(429).json({ error: "All keys exhausted. last error: " + (lastError?.message || "Quota") });
});

// ============================================
// GOOGLE SHEETS PROXY ENDPOINT
// ============================================
// 2. Google Sheets Proxy Route
app.post('/api/save', async (req, res) => {
    const { data, accessToken } = req.body;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) return res.status(500).json({ error: "GOOGLE_SPREADSHEET_ID not configured on server." });

    // If using Apps Script fallback
    if (process.env.GOOGLE_APPS_SCRIPT_URL) {
        try {
            const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            return res.json({ success: response.ok });
        } catch (e) {
            return res.status(500).json({ error: "Apps Script proxy failed." });
        }
    }

    // Direct Sheets API via OAuth token passed from frontend
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ values: data }),
            }
        );
        res.json({ success: response.ok });
    } catch (error) {
        res.status(500).json({ error: "Sheets API proxy failed." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`MedCopy Security Proxy v2.5 live at http://localhost:${PORT}`);
});
