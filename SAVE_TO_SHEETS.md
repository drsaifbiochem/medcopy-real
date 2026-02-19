# 📊 Google Sheets Auto-Save (Zero-Config Guide)

MedCopy now features a **"Zero-Config"** seamless auto-save system. All generations are saved in the background to your Google Sheet without requiring any user interaction or browser-side configuration.

## 🚀 How it Works
1.  **Frontend**: Triggers a save request to the server immediately after content generation.
2.  **Server Proxy**: Receives the request, identifies your `GOOGLE_SPREADSHEET_ID` from environment variables, and forwards the data to a background saver.
3.  **Background Saver**: A Google Apps Script web app appends the data to your spreadsheet in under 1 second.

---

## 🛠️ One-Time Setup (Server-Side)

To enable this, you must configure your server (Vercel or local `.env`) with two critical variables:

### 1. The Target Spreadsheet
Add your Spreadsheet ID to your environment:
```env
GOOGLE_SPREADSHEET_ID=your_id_here
```

### 2. The Background Saver (Apps Script)
Deploy a Google Apps Script as a **Web App** with the following settings:
- **Execute as**: `Me`
- **Who has access**: `Anyone`

**Paste this script into the Apps Script editor:**
```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    const row = [
      new Date(),
      data.persona || '',
      data.topic || '',
      data.format || '',
      data.audience || '',
      data.driftScore || '',
      data.content || '',
      data.distilledInsight || '',
      data.driftReasoning || ''
    ];
    
    sheet.appendRow(row);
    
    // Optional: Color code by drift score
    const lastRow = sheet.getLastRow();
    if (data.driftScore) {
      const scoreCell = sheet.getRange(lastRow, 6);
      if (data.driftScore >= 90) scoreCell.setBackground('#d4edda');
      else if (data.driftScore >= 70) scoreCell.setBackground('#fff3cd');
      else scoreCell.setBackground('#f8d7da');
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

Add the resulting URL to your environment:
```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

---

## ✅ Deployment Checklist
- [x] **No VITE_ prefix**: Environment variables must be server-side only for security.
- [x] **Structured Payload**: The system now sends a structured object (Persona, Topic, etc.) instead of a raw array for better script compatibility.
- [x] **Success Indicator**: The "Save to Sheets" button in the UI will glow green briefly when the background save is confirmed.

---

## 🔍 Troubleshooting
- **Nothing is saving**: Check the server logs (Vercel/Terminal). Look for `[Vercel API] Attempting Apps Script save (Background Mode)...`.
- **401 Unauthorized**: This happens if the proxy cannot find an Access Token OR a Background URL. Ensure `GOOGLE_APPS_SCRIPT_URL` is set correctly.
- **Payload Error**: If you see "Payload Error" in logs, ensure your Apps Script is using the `doPost(e)` function as shown above.
