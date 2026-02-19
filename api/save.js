// ============================================
// SERVERLESS HANDLER: GOOGLE SHEETS
// ============================================

module.exports = async (req, res) => {
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
        try {
            const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            return res.status(200).json({ success: response.ok });
        } catch (e) {
            // Fallback to direct API if Apps Script fails
            console.warn("[Serverless] Apps Script proxy failed, falling back to direct API.");
        }
    }

    // 2. Direct Sheets API via OAuth token
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
        return res.status(200).json({ success: response.ok });
    } catch (error) {
        return res.status(500).json({ error: "Sheets API proxy failed.", details: error.message });
    }
};
