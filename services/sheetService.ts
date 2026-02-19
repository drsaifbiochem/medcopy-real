import { GenerationInputs, GenerationResult } from "../types";
import { sanitizeError } from "../utils/security";

/**
 * MedCopy Google Sheets Service
 * 
 * SECURITY NOTE: Spreadsheet IDs and Apps Script URLs are now handled exclusively
 * by the server-side proxy. The frontend only handles the OAuth flow.
 */

export interface SheetConfig {
  clientId: string;
  spreadsheetId: string;
}

let tokenClient: any;
let accessToken: string | null = null;

export const initGoogleAuth = (clientId: string) => {
  // @ts-ignore
  if (!window.google || !window.google.accounts) {
    console.error("Google Identity Services script not loaded");
    return;
  }

  // @ts-ignore
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    callback: (tokenResponse: any) => {
      accessToken = tokenResponse.access_token;
      console.log("Google Auth Success: Token received");
    },
  });
};

export const triggerAuth = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  } else {
    console.error("Token client not initialized.");
    alert("Please check your Google Client ID in the configuration.");
  }
};

export const saveToSheet = async (
  _spreadsheetId: string, // Kept for signature compatibility but ignored (server-side ID used)
  inputs: GenerationInputs,
  result: GenerationResult,
  activeFormat?: string
): Promise<boolean> => {

  if (!accessToken && !process.env.GOOGLE_APPS_SCRIPT_URL) {
    triggerAuth();
    return false;
  }

  const timestamp = new Date().toLocaleString();
  let finalContent = "";
  let finalFormat = inputs.format;

  if (result.multiFormatOutput && activeFormat) {
    finalContent = (result.multiFormatOutput as any)[activeFormat];
    finalFormat = `${inputs.format} (${activeFormat})`;
  } else if (result.carouselOutput) {
    finalContent = result.carouselOutput.map(s => `[Slide ${s.slideNumber}] ${s.title}: ${s.content}`).join("\n");
    finalFormat = "Instagram Carousel";
  } else if (result.batchOutput) {
    finalContent = result.batchOutput.join("\n\n---\n\n");
    finalFormat = `Batch (${inputs.batchCount})`;
  } else {
    finalContent = result.content;
  }

  const values = [
    timestamp,
    inputs.persona.substring(0, 100) + "...",
    inputs.topic,
    finalFormat,
    inputs.audience,
    result.driftScore ? `${result.driftScore}%` : "N/A",
    finalContent
  ];

  try {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [values],
        accessToken: accessToken
      })
    });

    const resData = await response.json();
    return resData.success === true;

  } catch (error) {
    console.error("Save to Sheets via proxy failed", sanitizeError(error));
    throw error;
  }
};

export const isAuthorized = () => !!accessToken;