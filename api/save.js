// Vercel Config
export const config = {
    maxDuration: 30, // 30s is more than enough for Sheets save
};

/**
 * MedCopy Sheets Save Proxy (ESM)
 */
export default async function handler(req, res) {
    try {
        console.log(`[Vercel API] Incoming request: ${req.method} /api/save`);

        // Add CORS headers
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

        const { data, accessToken } = req.body;
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        if (!spreadsheetId) {
            return res.status(500).json({ error: "GOOGLE_SPREADSHEET_ID not configured on server." });
        }

        // 1. Try Apps Script Proxy first if configured
        if (process.env.GOOGLE_APPS_SCRIPT_URL) {
            console.log("[Vercel API] Attempting Apps Script save...");
            try {
                const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    console.log("[Vercel API] Apps Script save successful.");
                    return res.status(200).json({ success: true, method: 'apps-script' });
                } else {
                    const errorText = await response.text();
                    console.error(`[Vercel API] Apps Script returned error: ${response.status} ${errorText}`);
                }
            } catch (e) {
                console.error("[Vercel API] Apps Script connection failed:", e.message);
            }
        }

        // 2. Direct Sheets API via OAuth token
        console.log("[Vercel API] Attempting direct Sheets API save...");
        if (!accessToken) {
            console.warn("[Vercel API] No access token provided and Apps Script failed/not configured.");
            return res.status(401).json({
                error: "Authentication required.",
                details: "No OAuth token provided and background saver is not responding."
            });
        }

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

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Vercel API] Direct Sheets API failed: ${response.status} ${errText}`);
            throw new Error(`Google Sheets API error: ${errText}`);
        }

        console.log("[Vercel API] Direct Sheets API save successful.");
        return res.status(200).json({ success: true, method: 'direct-api' });

    } catch (globalError) {
        console.error("[Vercel API] CRITICAL SAVE FAILURE:", globalError);
        return res.status(500).json({
            error: "Sheets API proxy failed.",
            details: globalError.message
        });
    }
}
