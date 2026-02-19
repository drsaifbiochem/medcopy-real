import { GoogleGenerativeAI } from '@google/generative-ai';

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

/**
 * Deeply ensures that the target value is a string.
 * If given an object (that isn't an array we're processing), it flattens it.
 */
function ensureString(val) {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return '';
    if (typeof val === 'object' && !Array.isArray(val)) {
        try {
            // Smarter flattening: detect title/post or title/content
            const title = val.title || val.header || val.headline || "";
            const body = val.post || val.content || val.body || val.text || "";

            if (title && body) {
                return `## ${title}\n\n${body}`;
            }

            // Fallback: join other entries nicely
            return Object.entries(val)
                .map(([k, v]) => `**${k.toUpperCase()}**: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                .join('\n\n');
        } catch (e) {
            return String(val);
        }
    }
    return String(val);
}

const SYSTEM_INSTRUCTION = `You are MedCopy, a medically grounded content generation engine.
Your job is to generate persona-driven medical or health-tech content that is accurate, credible, and publication-ready.
1. Medical Accuracy Is Mandatory.
2. Persona Fidelity is key: Adopt the voice, vocabulary, and perspective of the selected persona.
3. No AI fluff, buzzwords, or generic marketing sentences.
4. PRIORITY: If a TOPIC IS MISSING, generate a "High-Yield Health Hack" or "Clinical Pearl" relevant to your persona's field.
5. FORMAT ADHERENCE: Strictly follow the requested format (LinkedIn, Instagram, etc.). If the persona's teaching style conflicts with the format, the FORMAT wins.`;

const ANTI_AI_STYLE = `
WRITING STYLE:
• Use clear, simple language.
• Short, impactful sentences.
• Active voice.
• Practical, actionable insights.
• Address reader as "you".
• AVOID: delve, embark, game-changer, unlock, groundbreaking, world where, navigate, etc.
`;

const CTA_VARIANTS = [
    "Follow for more distilled health insights.",
    "What has your experience been with this? Let's discuss below.",
    "Save this post for your next clinical rotation.",
    "Share this with a colleague or friend who needs to hear this today.",
    "Drop a '❤️' if this resonated with you.",
    "DM me if you want to see a deeper dive on this topic.",
    "Tag someone who would find this helpful."
];

const DISCLAIMER_VARIANTS = [
    "Educational purposes only. Not medical advice.",
    "Always consult your own physician for health concerns.",
    "Informational only. Clinical judgment should be individualized.",
    "Based on current evidence-based guidelines as of 2024.",
    "This is for knowledge sharing and does not create a doctor-patient relationship."
];

// Vercel Config
export const config = {
    maxDuration: 60, // Increase timeout to 60s for Vision analysis
};

export default async function handler(req, res) {
    try {
        console.log(`[Vercel API] Incoming request: ${req.method} /api/generate`);

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
        if (!inputs) {
            return res.status(400).json({ error: "Missing inputs in request body." });
        }

        const availableKeys = loadAvailableKeys();
        if (availableKeys.length === 0) {
            return res.status(500).json({ error: "No Gemini API keys found in server environment variables." });
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

                let currentTopic = inputs.topic || "GENERIC_HIGH_YIELD_INSIGHT";
                let currentAngle = inputs.angle || "Most helpful clinical perspective";
                let distilledInsight = null;

                // 1. Distillation
                if (inputs.enableDistillation && inputs.topic) {
                    const dResult = await model.generateContent(`${PREPEND_PROMPT}RAW NOTES: "${inputs.topic}"\n\nDistill into ONE clear, opinionated medical insight. Output ONLY the insight.`);
                    distilledInsight = dResult.response.text().trim();
                    currentTopic = `INSIGHT: "${distilledInsight}"\n(Source context: ${inputs.topic})`;
                }

                // 2. Main Logic
                const buildStructuredPrompt = (base) => {
                    const cta = CTA_VARIANTS[Math.floor(Math.random() * CTA_VARIANTS.length)];
                    const disclaimer = DISCLAIMER_VARIANTS[Math.floor(Math.random() * DISCLAIMER_VARIANTS.length)];

                    return `${PREPEND_PROMPT}
### TASK: ${base}
### IDENTITY/VOICE: 
${inputs.persona}

### TOPIC: 
${currentTopic}

### ANGLE/VARIATION SIGNAL: 
${currentAngle}

### AUDIENCE: 
${inputs.audience || "Layperson"}

### FINAL CONSTRAINTS:
1. End with this CTA: "${cta}"
2. Footer: "${disclaimer}"
3. Format specifically for: ${inputs.format}`;
                };

                let result;
                if (inputs.imageMode && inputs.image) {
                    const base64Data = inputs.image.split(',')[1];
                    const prompt = buildStructuredPrompt("Perform a VISION ANALYSIS based on the provided image and topic.");
                    result = await model.generateContent([
                        prompt,
                        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                    ]);
                    return res.status(200).json({ content: result.response.text(), driftScore: 100, distilledInsight });
                }

                if (inputs.carouselMode) {
                    const prompt = buildStructuredPrompt("GENERATE INSTAGRAM CAROUSEL JSON (5-10 slides). Use the ANGLE provided for the hook of Slide 1. SCHEMA: [{slideNumber, title, content, visualDescription}]");
                    result = await model.generateContent(prompt);
                    const text = result.response.text();
                    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
                    let carouselOutput = JSON.parse(jsonMatch[1].trim());

                    // Deep Hardening
                    if (Array.isArray(carouselOutput)) {
                        carouselOutput = carouselOutput.map(slide => ({
                            ...slide,
                            title: ensureString(slide.title),
                            content: ensureString(slide.content),
                            visualDescription: ensureString(slide.visualDescription)
                        }));
                    }

                    return res.status(200).json({ carouselOutput, driftScore: 100, distilledInsight });
                }

                if (inputs.batchMode) {
                    const prompt = buildStructuredPrompt(`GENERATE ${inputs.batchCount} UNIQUE VARIATIONS AS JSON ARRAY. 
IMPORTANT: Each variation MUST strictly follow the ANGLE "${currentAngle}" but be phrased uniquely. No two variations should start or end with the same sentence.`);
                    result = await model.generateContent(prompt);
                    const text = result.response.text();
                    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
                    let batchOutput = JSON.parse(jsonMatch[1].trim());

                    // Deep Hardening
                    if (Array.isArray(batchOutput)) {
                        batchOutput = batchOutput.map(item => ensureString(item));
                    }

                    return res.status(200).json({ batchOutput, driftScore: 100, distilledInsight });
                }

                if (inputs.format === 'Multi-Format Exploder') {
                    const prompt = buildStructuredPrompt("GENERATE MULTI-PLATFORM CONTENT JSON. PLATFORMS: linkedin, instagram, twitter, email. Ensure the ANGLE is woven into all platforms differently.");
                    result = await model.generateContent(prompt);
                    const text = result.response.text();
                    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
                    let multiFormatOutput = JSON.parse(jsonMatch[1].trim());

                    // Deep Hardening
                    if (typeof multiFormatOutput === 'object' && multiFormatOutput !== null) {
                        Object.keys(multiFormatOutput).forEach(key => {
                            multiFormatOutput[key] = ensureString(multiFormatOutput[key]);
                        });
                    }

                    return res.status(200).json({ multiFormatOutput, driftScore: 100, distilledInsight });
                }

                // Standard
                const mainPrompt = buildStructuredPrompt("Generate a single high-fidelity piece of content.");
                result = await model.generateContent(mainPrompt);
                const draftContent = result.response.text();

                const driftPrompt = `${PREPEND_PROMPT}Evaluate persona alignment: "${inputs.persona}"\nCONTENT:\n${draftContent}\n\nReturn JSON: {score: 0-100, reasoning: string, finalContent: string}. Ensure finalContent includes the requested CTA and Disclaimer.`;
                const driftResult = await model.generateContent(driftPrompt);
                const driftText = driftResult.response.text();
                const driftMatch = driftText.match(/```json\s*([\s\S]*?)\s*```/) || [null, driftText];
                const parsedDrift = JSON.parse(driftMatch[1].trim());

                let finalContent = ensureString(parsedDrift.finalContent || draftContent);
                let reasoning = ensureString(parsedDrift.reasoning);

                return res.status(200).json({
                    content: finalContent,
                    driftScore: parsedDrift.score || 0,
                    driftReasoning: reasoning,
                    distilledInsight: ensureString(distilledInsight)
                });

            } catch (error) {
                lastError = error;
                if (isQuotaError(error)) {
                    currentKeyIndex++;
                    continue;
                }
                console.error(`[Vercel API] Error with key ${currentKeyIndex + 1}:`, error);
                return res.status(500).json({ error: sanitizeError(error) });
            }
        }

        return res.status(429).json({ error: "All keys exhausted. Last error: " + (lastError?.message || "Quota") });

    } catch (globalError) {
        console.error("[Vercel API] CRITICAL UNHANDLED ERROR:", globalError);
        return res.status(500).json({
            error: "A critical server error occurred.",
            details: sanitizeError(globalError)
        });
    }
}
