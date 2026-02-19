# 🎭 Persona Makeover: Prompt Engineering v2.6

## The Problem: The "Generic AI" Loop
Before this overhaul, MedCopy personas suffered from several critical issues:
1. **Hardcoded CTAs**: Every post ended with the exact same "DM me for a demo," leading to repetitive, "salesy" content.
2. **Formulaic Hooks**: Personas were forced into specific opening sentences (e.g., "Everything you learned about..."), causing rapid content fatigue.
3. **Format Ignoring**: If a persona was defined as a "Professor," it would often output a lecture-style essay even when asked for a punchy "LinkedIn Post."
4. **Identity/Instruction Blur**: The AI was confused between *who* it was (Persona) and *what* it was supposed to do (Format/Rules).

---

## The Solution: The "Decoupled Architecture"

We have separated **Voice** from **Execution**. Identity is now what the AI *thinks like*, while the Backend handles the *structure*.

### 1. Unified Persona Structure
Every preset in `PresetSelector.tsx` now follows a clean, 4-tier hierarchy:
*   **IDENTITY**: Core background and professional authority.
*   **AUDIENCE**: Who is being spoken to (defines vocabulary level).
*   **TONE & VOICE**: The emotional frequency (e.g., Warm, Cynical, Academic).
*   **STYLE GUIDELINES**: Granular "Dos and Don'ts" (e.g., "Use metaphors," "No fluff words").

### 2. Variation Signals (The "Angle")
We introduced the **Specific Angle / Hook** input. This acts as a "Variation Signal" that the AI prioritizes to ensure that two posts on the same topic (e.g., *Diabetes*) sound completely different.
*   **Angle: "Controversial"** → "Why your sugar-free snacks are lying to you."
*   **Angle: "Scientific Deep Dive"** → "Pathophysiology of insulin resistance simplified."

### 3. Dynamic Injection System
CTAs and Disclaimers are no longer part of the persona prompt. They are randomly injected by the backend (`api/generate.js` or `server.js`) at the moment of generation.
*   **CTA Pool**: Rotates through 7+ variants like "Drop a ❤️," "Save this post," or "Tag a colleague."
*   **Disclaimer Pool**: Rotates through medical disclaimers to ensure compliance without being repetitive.

### 4. The Format Supremacy Rule
We implemented a hard systemic constraint: **FORMAT ALWAYS WINS.**
If a persona (e.g., Cardiologist) naturally wants to write long explanations, but the user selects "Twitter (X)", the backend overwrites the persona’s natural length with Twitter-specific constraints.

---

## Technical Implementation Guide

### Adding a New Persona
When adding a persona to `PRESETS`, **DO NOT** include CTAs or specific formatting instructions. Focus only on the "Vibe":

```javascript
{
  id: 'new-id',
  name: 'Expert Name',
  personaPrompt: `### IDENTITY
    You are...
    
    ### AUDIENCE
    Spoken to...
    
    ### TONE & VOICE
    Warm, punchy...
    
    ### STYLE GUIDELINES
    1. AVOID...
    2. USE...`
}
```

### Prompt Construction Flow
1. **System Instruction**: Medical safety + Anti-AI style.
2. **Task**: What we are building (JSON, Carousel, etc.).
3. **Identity/Voice**: Selected persona preset.
4. **Topic/Angle**: User inputs.
5. **Final Constraints**: Randomized CTA + Disclaimer + Format rules.

---

## Impact
*   **Zero Convergence**: Content no longer sounds "the same" after 3 generations.
*   **Higher CTR**: Varied CTAs feel more human and less robotic.
*   **True Multimodal**: Personas now adapt perfectly to Carousels, Batch mode, and Image analysis without breaking.
