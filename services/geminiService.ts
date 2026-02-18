import { GoogleGenAI, Type } from "@google/genai";
import { GenerationInputs, GenerationResult, MultiFormatContent, CarouselSlide } from "../types";

// ============================================
// MULTI-PROVIDER API KEY MANAGEMENT
// ============================================

interface APIKey {
  key: string;
  provider: 'gemini';
  index: number;
}

// Load all available API keys from environment
function loadAvailableKeys(): APIKey[] {
  const keys: APIKey[] = [];

  // Load Gemini keys (priority provider)
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

  // Mistral fallback removed - package not installed
  // To enable Mistral fallback, install @mistralai/mistralai package

  return keys;
}

// Detect if error is a quota/rate limit error
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

// Provider-agnostic content generation (Gemini only)
async function generateWithProvider(
  provider: 'gemini',
  apiKey: string,
  model: string,
  prompt: string,
  config: any
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config
  });
  return response.text || "";
}

const SYSTEM_INSTRUCTION = `You are MedCopy, a medically grounded content generation engine.

Your job is to generate persona-driven medical or health-tech content that is:
• Factually accurate
• Free of marketing fluff
• Written for a clearly defined audience
• Human, credible, and publication-ready

You will be given:
1. A PERSONA SYSTEM PROMPT (defines voice, expertise, tone, and audience)
2. A TOPIC or RAW THOUGHT
3. A CONTENT FORMAT (e.g., Instagram caption, LinkedIn post, Email)
4. OPTIONAL: VERIFIED MEDICAL CONTEXT retrieved via RAG (textbooks, Medscape, notes)
5. AN AUDIENCE RISK FILTER (defines who is reading and the safety level required)

━━━━━━━━━━━━━━━━━━
CRITICAL RULES
━━━━━━━━━━━━━━━━━━
1. **Medical Accuracy Is Mandatory**
   - Use ONLY the provided retrieved context for medical facts.
   - If a fact is uncertain or missing, say so explicitly.
   - Never invent enzymes, pathways, statistics, or clinical claims.

2. **Persona Fidelity**
   - Write strictly in the voice, tone, and worldview defined by the persona.
   - Do NOT sound like generic AI or marketing copy.
   - Prioritize clarity, credibility, and audience relevance over persuasion.

3. **Human Writing Standard**
   - Vary sentence length.
   - Use natural transitions.
   - Avoid buzzwords, clichés, and hype.
   - Sound like a real clinician, educator, or founder wrote this.

4. **Safety & Ethics (Audience Risk Guardrails)**
   - Adjust technical density and disclaimers based on the AUDIENCE_LEVEL.
   - **Layperson**: Simplify complex terms, add empathy, include "not medical advice" disclaimers. Avoid alarming language.
   - **Student**: Use educational tone, explain mechanisms, standard terminology is okay.
   - **Clinician**: High technical density allowed, assume prior knowledge, focus on evidence/nuance.
   - **Business**: Focus on outcomes/efficiency, low clinical density.

━━━━━━━━━━━━━━━━━━
OUTPUT REQUIREMENTS
━━━━━━━━━━━━━━━━━━
• Produce ONE clean, final draft.
• NO Markdown bolding (**text**), italics (*text*), or special formatting characters.
• Do NOT use asterisks (**) for emphasis. Use CAPITALIZATION if emphasis is absolutely needed, but prefer plain text.
• No explanations, no meta commentary.
• Use medically correct terminology appropriate to the audience.
• Optimize for clarity, trust, and authority.
`;

export const generateMedicalCopy = async (inputs: GenerationInputs): Promise<GenerationResult> => {
  const availableKeys = loadAvailableKeys();

  if (availableKeys.length === 0) {
    throw new Error("No API keys configured. Please add at least one GEMINI_API_KEY or MISTRAL_API_KEY to your .env.local file.");
  }

  let lastError: any = null;
  let currentKeyIndex = 0;

  // Try each available key in order
  while (currentKeyIndex < availableKeys.length) {
    const currentKey = availableKeys[currentKeyIndex];

    try {
      console.log(`[API Key Rotation] Trying ${currentKey.provider.toUpperCase()} key #${currentKey.index}`);

      // Use the current key for generation
      const ai = currentKey.provider === 'gemini'
        ? new GoogleGenAI({ apiKey: currentKey.key })
        : null;

      // For Mistral, we'll handle it differently in each generation call
      // For now, set process.env.API_KEY for backward compatibility
      process.env.API_KEY = currentKey.key;
      process.env.CURRENT_PROVIDER = currentKey.provider;

      console.log(`[MedCopy] Generating with ${currentKey.provider} (Key #${currentKey.index}) | Carousel: ${inputs.carouselMode}`);

      const citationInstruction = inputs.includeCitations
        ? `
━━━━━━━━━━━━━━━━━━
CITATION INJECTION ENGINE
━━━━━━━━━━━━━━━━━━
Where a medical claim is made, attach a citation if available based on the provided RETRIEVED_MEDICAL_CONTEXT.
• Use numbered references inline (e.g. "Sleep deprivation is a known trigger for postpartum psychosis¹").
• Append a "References" section at the end if citations are used.
• Do not fabricate sources. Only cite what is explicitly in the context provided below.
`
        : "";

      const hashtagInstruction = inputs.includeHashtags
        ? `
━━━━━━━━━━━━━━━━━━
HASHTAG OPTIMIZATION
━━━━━━━━━━━━━━━━━━
Generate 3-5 high-quality, engagement-boosting, SEO-optimized hashtags.
• Place them at the very bottom of the content.
• Ensure they are relevant to the niche (Medical/HealthTech) and the specific topic.
• Mix broad (e.g., #MedEd) and specific (e.g., #CardiologyPearls) tags.
`
        : "";

      const antiAiStyleInstruction = `
━━━━━━━━━━━━━━━━━━
THE AI HUMANISER PROMPT (ANTI-AI FINGERPRINT REWRITER)
━━━━━━━━━━━━━━━━━━
FOLLOW THIS WRITING STYLE:

• SHOULD use clear, simple language.
• SHOULD be spartan and informative.
• SHOULD use short, impactful sentences.
• SHOULD use active voice; avoid passive voice.
• SHOULD focus on practical, actionable insights.
• SHOULD use bullet point lists in social media posts.
• SHOULD use data and examples to support claims when possible.
• SHOULD use “you” and “your” to directly address the reader.
• AVOID bolding (**text**) entirely. Use plain text.
• AVOID using em dashes (—) anywhere in your response. Use only commas, periods, or other standard punctuation. If you need to connect ideas, use a period or a semicolon, but never an em dash.
• AVOID constructions like “…not just this, but also this”.
• AVOID metaphors and clichés.
• AVOID generalizations.
• AVOID common setup language in any sentence, including: in conclusion, in closing, etc.
• AVOID output warnings or notes, just the output requested.
• AVOID unnecessary adjectives and adverbs.
• AVOID staccato stop start sentences.
• AVOID rhetorical questions.
• AVOID hashtags (unless requested).
• AVOID semicolons.
• AVOID markdown.
• AVOID asterisks.
• AVOID these words:

“can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving”
`;

      try {
        let currentTopic = inputs.topic;
        let distilledInsightStr: string | undefined;

        // Step 0: Thought Distillation (Optional)
        if (inputs.enableDistillation) {
          const distillationPrompt = `
You are a Thought Distiller. 
Your goal is to transform messy clinician thoughts into sharp, opinionated insights before writing.

RAW NOTES:
"${inputs.topic}"

INSTRUCTIONS:
Distill the raw thoughts into one clear, opinionated core insight.
Do not write the final content yet. 
Output ONLY the insight.
`;
          const distillationResult = await ai.models.generateContent({
            model: 'gemma-3-27b-it',
            contents: distillationPrompt,
            config: { temperature: 0.5 }
          });

          distilledInsightStr = distillationResult.text?.trim();

          if (distilledInsightStr) {
            // Use the refined insight to drive the generation
            currentTopic = `CORE INSIGHT: "${distilledInsightStr}"\n\n(Derived from original raw notes: ${inputs.topic})`;
          }
        }

        // Step 1: Handling "Summarizer Mode"
        if (inputs.summarizerMode) {
          let summaryPrompt = "";

          if (inputs.examSummarizerMode) {
            // Special Prompt for Subtitle/Exam Mode
            summaryPrompt = `
━━━━━━━━━━━━━━━━━━
CLINICAL BIOCHEMISTRY / EXAM STRATEGIST MODE (NEET-PG / USMLE)
━━━━━━━━━━━━━━━━━━
You are an expert Clinical Biochemistry educator and medical exam strategist, specialized in converting lecture subtitle captions with timestamps into high-yield, exam-oriented study summaries for NEET-PG, USMLE, and other competitive medical exams.

Your task is to analyze timestamped captions from a Clinical Biochemistry video session and generate a concise, structured, and high-retention summary.

SOURCE CAPTIONS:
${inputs.context}

OUTPUT REQUIREMENTS:
1. Topic-Wise Class Summary (with Timestamps)
   - Divide the lecture into clear biochemistry topics (e.g., Glycolysis Regulation, Urea Cycle Disorders).
   - Each topic must include an accurate timestamp range based on the source text.
   - **STRICT FORMATTING**: Timestamps MUST be enclosed in square brackets (e.g., [14:10–22:45]).
   - HEADINGS must be CAPITALIZED (e.g. GLYCOLYSIS REGULATION [12:00-14:00]).

2. High-Yield Learning Notes
   - Focus strictly on: Pathways, reactions, enzymes, cofactors, Rate-limiting steps, Regulatory mechanisms.
   - Convert spoken explanations into exam-ready bullet points.

3. Exam-Focused Clinical Correlations
   - Explicitly highlight: Diseases & deficiencies, Lab findings, Biochemical basis of symptoms.

4. Competitive Exam Takeaways
   - Add a dedicated section per topic (or at the end) labeled: “EXAM PEARLS / HIGH-YIELD POINTS”.
   - Include: One-liner facts, Common traps, Comparisons.

FORMATTING RULES:
- NO BOLDING (**). NO ITALICS (*). NO SPECIAL CHARACTERS.
- Use standard bullet points (-) or numbered lists (1.).
- Use CAPITALIZATION for headings to distinguish sections without using Markdown.
- No filler, no storytelling, no meta-commentary.

${antiAiStyleInstruction}
`;
          } else {
            // Standard Deep Dive Analyzer
            summaryPrompt = `
━━━━━━━━━━━━━━━━━━
DEEP DIVE ANALYZER & INSIGHT SYNTHESIZER
━━━━━━━━━━━━━━━━━━
You are an expert analyst acting strictly as the Persona defined below.
Your task is to transform the provided SOURCE TEXT (transcript, notes, or paper) into a high-value, structured summary.

TARGET AUDIENCE: ${inputs.audience}
SUMMARY GOAL: "${currentTopic || "Identify the most critical medical concepts, explain them clearly, and structure them logically."}"

CRITICAL INSTRUCTIONS:
1. **Synthesize, Don't Transcribe**: Do NOT list facts in chronological order (e.g. 1-30). You MUST group related concepts into thematic sections.
2. **Filter Noise**: Completely ignore timestamps (e.g., 00:11:06), speaker labels, and conversational filler. Extract only the signal.
3. **Persona Voice**: Analyze the content *through the lens* of the persona. Add the persona's wisdom to the raw facts.
4. **Required Structure**:
   • **THE CORE THESIS**: A 1-2 sentence hook summarizing the entire text.
   • **KEY MEDICAL INSIGHTS**: 3-7 deep, distinct sections or bullet points.
   • **CLINICAL/PRACTICAL IMPLICATION**: Why this matters for the specific audience.
5. **Formatting**: 
   - DO NOT USE BOLDING (**). 
   - DO NOT USE ITALICS (*).
   - Use CAPITALIZED HEADINGS for sections.
   - Use standard bullet points (-).

SOURCE TEXT:
${inputs.context}

PERSONA DEFINITION:
${inputs.persona}

${antiAiStyleInstruction}
${citationInstruction}
${hashtagInstruction}
`;
          }

          const response = await ai.models.generateContent({
            model: 'gemma-3-27b-it',
            contents: `${SYSTEM_INSTRUCTION}\n\n${summaryPrompt}`,
            config: {
              temperature: 0.5, // Lower temperature for accurate summarization
            },
          });

          const draftContent = response.text || "No summary generated.";

          return {
            content: draftContent,
            distilledInsight: distilledInsightStr,
            driftScore: 95, // Assume high alignment for direct summary tasks
            driftReasoning: inputs.examSummarizerMode
              ? "Exam/Subtitle Mode active. Content structured for NEET-PG/USMLE retention."
              : "Summarizer mode active. Content derived directly from source text."
          };
        }

        // Step 2: Handling "Instagram Carousel Mode"
        if (inputs.carouselMode) {

          const carouselPrompt = `
━━━━━━━━━━━━━━━━━━
INSTAGRAM CAROUSEL GENERATOR
━━━━━━━━━━━━━━━━━━
Using the Persona defined below, generate a structured, slide-by-slide Instagram Carousel based on the Topic.
Total Slides: 5 to 10.

OUTPUT FORMAT RULES:
1. You MUST return a VALID JSON array.
2. The JSON must be enclosed in markdown code blocks: \`\`\`json [ ... ] \`\`\`.
3. Use this exact schema for each slide:
   {
     "slideNumber": number,
     "title": "string",
     "content": "string",
     "visualDescription": "string"
   }

STRUCTURE:
1. Slide 1: The Hook (Viral, scroll-stopping title).
2. Middle Slides: Educational value, broken down into digestible points. One main idea per slide.
3. Final Slide: Call to Action (CTA) and engagement prompt.

INSTRUCTIONS:
- For each slide, provide a 'Visual Description' (what the image/graphic should look like).
- Keep text on slides minimal and punchy (no walls of text).
- Ensure medical accuracy.
${inputs.includeHashtags ? "- IMPORTANT: Include your generated hashtags in the 'content' field of the FINAL slide." : ""}

INPUTS:
PERSONA: ${inputs.persona}
TOPIC: ${currentTopic}
CONTEXT: ${inputs.context || "No specific context."}
AUDIENCE: ${inputs.audience}

${antiAiStyleInstruction}
${citationInstruction}
${hashtagInstruction}
`;

          const response = await ai.models.generateContent({
            model: 'gemma-3-27b-it',
            contents: `${SYSTEM_INSTRUCTION}\n\n${carouselPrompt}`,
            config: {
              temperature: 0.7,
              // Removed strict schema parsing to avoid 400 errors with Gemma 2/3 models on some endpoints
            },
          });

          // Parse JSON - extract from markdown code blocks if present
          let jsonText = response.text || "[]";
          const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || jsonText.match(/```\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }

          let carouselOutput: CarouselSlide[] = [];
          try {
            carouselOutput = JSON.parse(jsonText.trim()) as CarouselSlide[];
          } catch (e) {
            console.error("Failed to parse Carousel JSON:", jsonText);
            // Fallback: Try to find a list if the JSON failed
            if (jsonText.includes('[') && jsonText.includes(']')) {
              try {
                const startRaw = jsonText.indexOf('[');
                const endRaw = jsonText.lastIndexOf(']');
                carouselOutput = JSON.parse(jsonText.substring(startRaw, endRaw + 1));
              } catch (innerE) {
                carouselOutput = [];
              }
            }
          }

          return {
            content: "Carousel Generated.",
            distilledInsight: distilledInsightStr,
            carouselOutput: carouselOutput,
            driftScore: 100, // Bypass drift for structural generation
            driftReasoning: "Carousel mode enabled. Structural JSON generation active."
          };
        }

        // Step 3: Handling "Batch Mode" (Random Posts)
        if (inputs.batchMode) {
          const batchPrompt = `
━━━━━━━━━━━━━━━━━━
RANDOM CONTENT BATCH GENERATOR
━━━━━━━━━━━━━━━━━━
Using the Persona defined below, generate ${inputs.batchCount} UNIQUE and DISTINCT content pieces in the format of "${inputs.format}".
Based on the Keywords/Theme: "${currentTopic}"

INSTRUCTIONS:
1. Each post must be completely different in angle, hook, and structure.
2. Adhere to the medical accuracy of the Context provided.
3. Be creative and varied. Randomize the approach for each post.
4. Return strict JSON array of strings.

INPUTS:
PERSONA: ${inputs.persona}
CONTEXT: ${inputs.context || "No specific context."}
AUDIENCE: ${inputs.audience}

${antiAiStyleInstruction}
${citationInstruction}
${hashtagInstruction}
`;

          const response = await ai.models.generateContent({
            model: 'gemma-3-27b-it',
            contents: `${SYSTEM_INSTRUCTION}\n\n${batchPrompt}`,
            config: {
              temperature: 0.9 // Higher temperature for randomness
            },
          });

          // Parse JSON - extract from markdown code blocks if present
          let jsonText = response.text || "[]";
          const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || jsonText.match(/```\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }
          const batchOutput = JSON.parse(jsonText.trim()) as string[];

          return {
            content: "Batch Generated.",
            distilledInsight: distilledInsightStr,
            batchOutput: batchOutput,
            driftScore: 100, // Bypass drift for batch
            driftReasoning: "Batch mode enabled. Diversity prioritized."
          };
        }

        // Step 4: Handling "Multi-Format Exploder"
        const isMultiFormat = inputs.format === 'Multi-Format Exploder';

        if (isMultiFormat) {
          const multiFormatPrompt = `
━━━━━━━━━━━━━━━━━━
MULTI-FORMAT CONTENT EXPLODER
━━━━━━━━━━━━━━━━━━
Using the same verified medical facts and Persona defined below, generate content for ALL of the following platforms.
Do not add new claims. Adapt the style for each platform while keeping the core medical truth identical.

PLATFORMS REQUIRED:
1. Instagram Carousel (Slide-by-slide text, visual descriptions)
2. LinkedIn Post (Professional, engaging, spacing for readability)
3. Patient Email (Warm, informative, subject line included)
4. Tweet Thread (Series of short, punchy tweets)

INPUTS:
PERSONA: ${inputs.persona}
TOPIC: ${currentTopic}
CONTEXT: ${inputs.context || "No specific context."}
AUDIENCE: ${inputs.audience}

${antiAiStyleInstruction}
${citationInstruction}
${hashtagInstruction}
`;

          const response = await ai.models.generateContent({
            model: 'gemma-3-27b-it',
            contents: `${SYSTEM_INSTRUCTION}\n\n${multiFormatPrompt}`,
            config: {
              temperature: 0.7
            },
          });

          // Parse JSON - extract from markdown code blocks if present
          let jsonText = response.text || "{}";
          const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || jsonText.match(/```\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }
          const multiContent = JSON.parse(jsonText.trim()) as MultiFormatContent;

          return {
            content: "Multi-Format Content Generated. Please check the tabs below.",
            distilledInsight: distilledInsightStr,
            multiFormatOutput: multiContent,
            // Drift detection is skipped for multi-format to preserve JSON structure integrity
            driftScore: 100,
            driftReasoning: "Drift detection bypassed for Multi-Format Exploder mode."
          };
        }

        // Standard Single Format Generation
        const prompt = `
━━━━━━━━━━━━━━━━━━
INPUTS
━━━━━━━━━━━━━━━━━━
PERSONA_SYSTEM_PROMPT:
${inputs.persona}

CONTENT_FORMAT:
${inputs.format}

TOPIC_OR_RAW_THOUGHT:
${currentTopic}

RETRIEVED_MEDICAL_CONTEXT (if provided):
${inputs.context || "No specific medical context provided. Use general medical knowledge cautiously, avoiding specific statistical claims unless generally known."}

━━━━━━━━━━━━━━━━━━
AUDIENCE RISK FILTER (REGULATORY + ETHICAL GUARDRAIL)
━━━━━━━━━━━━━━━━━━
AUDIENCE_LEVEL: ${inputs.audience}

INSTRUCTIONS FOR RISK FILTER:
Review the generated content for audience safety based on the level above.
1. If Audience is 'Layperson': Remove jargon or explain it immediately. Soften absolute claims. Ensure "Not Medical Advice" tone.
2. If Audience is 'Student': Maintain accuracy but explain the 'Why'.
3. If Audience is 'Licensed Clinician': Respect their expertise; do not over-simplify.
4. If Audience is 'Business Decision-Maker': Focus on strategic value, minimize clinical minutiae.

Remove or soften any statements that could cause harm or misinterpretation given this specific audience.

${antiAiStyleInstruction}

${citationInstruction}

${hashtagInstruction}
`;

        // Step 1: Generate Initial Draft
        const response = await ai.models.generateContent({
          model: 'gemma-3-27b-it',
          contents: `${SYSTEM_INSTRUCTION}\n\n${prompt}`,
          config: {
            temperature: 0.7,
          },
        });

        const draftContent = response.text || "No content generated.";

        // Step 2: Persona Drift Detector
        const driftPrompt = `
You are a Persona Drift Detector.
Your task is to evaluate the provided content against the defined Persona.

━━━━━━━━━━━━━━━━━━
PERSONA DEFINITION
━━━━━━━━━━━━━━━━━━
${inputs.persona}

━━━━━━━━━━━━━━━━━━
GENERATED DRAFT
━━━━━━━━━━━━━━━━━━
${draftContent}

━━━━━━━━━━━━━━━━━━
INSTRUCTIONS
━━━━━━━━━━━━━━━━━━
1. Analyze Tone, Vocabulary, Worldview, and Audience Framing.
2. Assign an alignment score from 0-100.
3. If the score is below 85, rewrite the content to perfectly match the persona while maintaining the medical facts.
4. If the score is 85 or above, return the content as is.
6. **FORMATTING**: RETURN PURE MINIFIED JSON. Do not use unescaped newlines inside strings.

Return your response in this JSON format:
{
  "score": number,
  "reasoning": "string",
  "finalContent": "string"
}
`;

        const driftResponse = await ai.models.generateContent({
          model: 'gemma-3-27b-it',
          contents: driftPrompt,
          config: {
            temperature: 0.7
          },
        });

        // Parse JSON - extract from markdown code blocks if present
        let driftJsonText = driftResponse.text || "{}";
        const driftJsonMatch = driftJsonText.match(/```json\s*([\s\S]*?)\s*```/) || driftJsonText.match(/```\s*([\s\S]*?)\s*```/);
        if (driftJsonMatch) {
          driftJsonText = driftJsonMatch[1];
        }

        let driftResult;
        try {
          // Basic sanitization for control characters (often causes SyntaxError)
          const sanitizedJson = driftJsonText.replace(/[\x00-\x1F\x7F-\x9F]/g, (char) => {
            if (char === '\n') return '\\n';
            if (char === '\r') return '';
            if (char === '\t') return '\\t';
            return '';
          });
          driftResult = JSON.parse(sanitizedJson);
        } catch (parseError) {
          console.warn("[Drift Detection] JSON Parsing Failed:", parseError);
          console.warn("[Drift Detection] Raw Text:", driftJsonText);

          // FALLBACK: Return original content if validation fails
          driftResult = {
            finalContent: draftContent,
            score: 100,
            reasoning: "Validation JSON parsing failed. Returned original draft."
          };
        }

        // Success! Log and return
        console.log(`[API Key Rotation] ✓ Success with ${currentKey.provider.toUpperCase()} key #${currentKey.index}`);

        return {
          content: driftResult.finalContent || draftContent,
          driftScore: driftResult.score,
          driftReasoning: driftResult.reasoning,
          distilledInsight: distilledInsightStr
        };

      } catch (innerError) {
        // This is the inner try-catch for the generation logic
        console.error(`[API Key Rotation] ✗ Error with ${currentKey.provider.toUpperCase()} key #${currentKey.index}:`, innerError);
        throw innerError;
      }

    } catch (error) {
      // Outer try-catch for key rotation
      lastError = error;

      // Check if this is a quota error
      if (isQuotaError(error)) {
        console.warn(`[API Key Rotation] Quota exceeded for ${currentKey.provider.toUpperCase()} key #${currentKey.index}. Trying next key...`);
        currentKeyIndex++;
        continue;
      }

      // If it's not a quota error, throw immediately
      console.error(`[API Key Rotation] Non-quota error encountered:`, error);
      throw error;
    }
  }

  // If we've exhausted all keys, throw a comprehensive error
  const geminiCount = availableKeys.filter(k => k.provider === 'gemini').length;

  throw new Error(
    `All API keys exhausted (${geminiCount} Gemini keys tried, ${availableKeys.length} total). ` +
    `All keys have hit quota limits. Please wait for quota reset or add more API keys. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
};