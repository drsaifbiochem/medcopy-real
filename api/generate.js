const { GoogleGenAI } = require('@google/genai');

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
// SERVERLESS HANDLER
// ============================================

module.exports = async (req, res) => {
    // Add CORS headers for serverless
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { inputs } = req.body;
    const availableKeys = loadAvailableKeys();

    if (availableKeys.length === 0) {
        return res.status(500).json({ error: "No Gemini API keys found in server environment variables." });
    }

    let lastError = null;
    let currentKeyIndex = 0;

    while (currentKeyIndex < availableKeys.length) {
        const currentKey = availableKeys[currentKeyIndex];

        try {
            const genAI = new GoogleGenAI(currentKey.key);
            const model = genAI.getGenerativeModel({
                model: 'gemma-3-27b-it',
                systemInstruction: SYSTEM_INSTRUCTION
            });

            let currentTopic = inputs.topic;
            let distilledInsight = null;

            // 1. Distillation
            if (inputs.enableDistillation) {
                const dResult = await model.generateContent(`RAW NOTES: "${inputs.topic}"\n\nDistill into ONE clear, opinionated medical insight. Output ONLY the insight.`);
                distilledInsight = dResult.response.text().trim();
                currentTopic = `INSIGHT: "${distilledInsight}"\n(Source: ${inputs.topic})`;
            }

            // 2. Main Logic
            let result;
            if (inputs.imageMode && inputs.image) {
                const base64Data = inputs.image.split(',')[1];
                const prompt = `VISION ANALYSIS: ${inputs.persona}\nTOPIC: ${currentTopic}\nAUDIENCE: ${inputs.audience}\n\n${ANTI_AI_STYLE}`;
                result = await model.generateContent([
                    prompt,
                    { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                ]);
                return res.status(200).json({ content: result.response.text(), driftScore: 100, distilledInsight });
            }

            if (inputs.carouselMode) {
                const prompt = `GENERATE INSTAGRAM CAROUSEL JSON (5-10 slides).\nPERSONA: ${inputs.persona}\nTOPIC: ${currentTopic}\nAUDIENCE: ${inputs.audience}\nSCHEMA: [{slideNumber, title, content, visualDescription}]\n\n${ANTI_AI_STYLE}`;
                result = await model.generateContent(prompt);
                const text = result.response.text();
                const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
                return res.status(200).json({ carouselOutput: JSON.parse(jsonMatch[1].trim()), driftScore: 100, distilledInsight });
            }

            if (inputs.batchMode) {
                const prompt = `GENERATE ${inputs.batchCount} UNIQUE VARIATIONS AS JSON ARRAY.\nPERSONA: ${inputs.persona}\nTOPIC: ${currentTopic}\nFORMAT: ${inputs.format}\n\n${ANTI_AI_STYLE}`;
                result = await model.generateContent(prompt);
                const text = result.response.text();
                const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
                return res.status(200).json({ batchOutput: JSON.parse(jsonMatch[1].trim()), driftScore: 100, distilledInsight });
            }

            if (inputs.format === 'Multi-Format Exploder') {
                const prompt = `GENERATE MULTI-PLATFORM CONTENT JSON.\nPERSONA: ${inputs.persona}\nTOPIC: ${currentTopic}\nPLATFORMS: linkedin, instagram, twitter, email\n\n${ANTI_AI_STYLE}`;
                result = await model.generateContent(prompt);
                const text = result.response.text();
                const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
                return res.status(200).json({ multiFormatOutput: JSON.parse(jsonMatch[1].trim()), driftScore: 100, distilledInsight });
            }

            // Standard
            const mainPrompt = `PERSONA: ${inputs.persona}\nFORMAT: ${inputs.format}\nTOPIC: ${currentTopic}\nCONTEXT: ${inputs.context}\nAUDIENCE: ${inputs.audience}\n\n${ANTI_AI_STYLE}`;
            result = await model.generateContent(mainPrompt);
            const draftContent = result.response.text();

            const driftPrompt = `Evaluate persona alignment: "${inputs.persona}"\nCONTENT:\n${draftContent}\n\nReturn JSON: {score: 0-100, reasoning: string, finalContent: string}`;
            const driftResult = await model.generateContent(driftPrompt);
            const driftText = driftResult.response.text();
            const driftMatch = driftText.match(/```json\s*([\s\S]*?)\s*```/) || [null, driftText];
            const parsedDrift = JSON.parse(driftMatch[1].trim());

            return res.status(200).json({
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

    res.status(429).json({ error: "All keys exhausted. Last error: " + (lastError?.message || "Quota") });
};
