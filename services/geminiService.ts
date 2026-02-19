import { GenerationInputs, GenerationResult } from "../types";
import { sanitizeError } from "../utils/security";

/**
 * MedCopy AI Generation Service (Client Library)
 * 
 * SECURITY NOTE: This service now routes all requests through the /api/ai/generate proxy.
 * No API keys are stored or handled on the frontend.
 */

export const generateMedicalCopy = async (inputs: GenerationInputs): Promise<GenerationResult> => {
  try {
    console.log(`[MedCopy Client] Generating content via secure proxy... Mode: ${inputs.imageMode ? 'Vision' : 'Text'}`);

    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || errorData.error || "Generation failed at proxy.");
    }

    const result = await response.json();
    return result as GenerationResult;

  } catch (error) {
    console.error("[MedCopy Client] Secure generation failed:", sanitizeError(error));
    throw error;
  }
};