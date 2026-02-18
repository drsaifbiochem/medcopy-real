# Google Sheets Integration Guide for MedCopy

MedCopy supports "One-Click Save" to Google Sheets to organize your generated content. 

Because this application runs entirely in the browser (client-side), you must set up a project in the Google Cloud Console to allow the app to talk to your personal Google Sheet.

## Prerequisites
* A Google Account
* A Google Sheet created (keep the ID handy)

---

## Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Create Project**.
3. Name it `MedCopy` (or similar) and click **Create**.

## Step 2: Enable the Google Sheets API
1. In the sidebar, go to **APIs & Services > Library**.
2. Search for `Google Sheets API`.
3. Click **Enable**.

## Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (unless you have a Google Workspace organization, then Internal is easier).
3. Fill in the required fields:
   * **App Name**: MedCopy
   * **User Support Email**: Your email.
   * **Developer Contact Info**: Your email.
4. Click **Save and Continue**.
5. **Scopes**: Click **Add or Remove Scopes**.
   * Search for `spreadsheets`.
   * Select `.../auth/spreadsheets` (See, edit, create, and delete all your Google Sheets spreadsheets).
   * Click **Update** then **Save and Continue**.
6. **Test Users** (Important for External apps):
   * Click **Add Users**.
   * Add your own email address. (Only users listed here can use the app while it's in "Testing" mode).
   * Click **Save and Continue**.

## Step 4: Create Credentials (Client ID)
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. **Application Type**: Select `Web application`.
4. **Name**: `MedCopy Client`.
5. **Authorized JavaScript origins**:
   * Add the URL where you are running the app.
   * If running locally: `http://localhost:3000` (or your specific port).
   * If deployed (e.g., Vercel/Netlify): `https://your-app-name.vercel.app`.
   * **Note:** Do not use trailing slashes (e.g., use `http://localhost:3000`, NOT `http://localhost:3000/`).
6. Click **Create**.
7. Copy the **Client ID** (It looks like `123456789-abcdefg.apps.googleusercontent.com`).

## Step 5: Prepare your Spreadsheet
1. Create a new Google Sheet at [sheets.new](https://sheets.new).
2. Copy the **Spreadsheet ID** from the URL.
   * URL format: `docs.google.com/spreadsheets/d/SPREADSHEET_ID_IS_HERE/edit`
3. (Optional) Create a header row in the first row:
   * A1: Timestamp
   * B1: Persona
   * C1: Topic
   * D1: Format
   * E1: Audience
   * F1: Drift Score
   * G1: Content

## Step 6: Connect in MedCopy
1. Open the MedCopy app.
2. Click the **"Link Sheets"** button (next to the Persona selector) or look for the Table icon.
3. Paste your **Client ID** and **Spreadsheet ID**.
4. Click **Save Config**.

Now, whenever you generate content, a **"Save to Sheets"** button will appear. Clicking it will prompt you to sign in with Google (once per session) and append the content to your sheet.

---

## Advanced: Google Apps Script Integration (Optional)

For advanced use cases like automated workflows, custom formatting, or server-side processing, you can create a Google Apps Script web app.

### When to Use Apps Script

Use Google Apps Script if you need:
- **Custom Data Processing**: Transform or validate data before saving
- **Automated Workflows**: Trigger notifications, emails, or other actions when content is saved
- **Advanced Formatting**: Apply custom styling, formulas, or conditional formatting
- **Integration with Other Services**: Connect to external APIs or databases
- **Batch Operations**: Process multiple entries at once

### Step 1: Create a New Apps Script Project

1. Open your Google Sheet.
2. Click **Extensions > Apps Script**.
3. Delete the default `myFunction()` code.
4. Paste the following starter script:

```javascript
/**
 * MedCopy Advanced Integration Script
 * Handles incoming content from MedCopy with custom processing
 */

function doPost(e) {
  try {
    // Parse incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Prepare row data
    const timestamp = new Date();
    const row = [
      timestamp,
      data.persona || '',
      data.topic || '',
      data.format || '',
      data.audience || '',
      data.driftScore || '',
      data.content || '',
      data.distilledInsight || '',
      data.driftReasoning || ''
    ];
    
    // Append to sheet
    sheet.appendRow(row);
    
    // Optional: Apply custom formatting
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, row.length).setFontSize(10);
    
    // Optional: Color code by drift score
    if (data.driftScore) {
      const scoreCell = sheet.getRange(lastRow, 6);
      if (data.driftScore >= 90) {
        scoreCell.setBackground('#d4edda'); // Green
      } else if (data.driftScore >= 85) {
        scoreCell.setBackground('#d1ecf1'); // Teal
      } else if (data.driftScore >= 70) {
        scoreCell.setBackground('#fff3cd'); // Yellow
      } else {
        scoreCell.setBackground('#f8d7da'); // Red
      }
    }
    
    // Optional: Send notification (uncomment to enable)
    // sendEmailNotification(data);
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'Content saved successfully' })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Email notification function
function sendEmailNotification(data) {
  const recipient = Session.getActiveUser().getEmail();
  const subject = 'New MedCopy Content Generated';
  const body = `
    A new piece of content has been generated:
    
    Topic: ${data.topic}
    Format: ${data.format}
    Persona Match: ${data.driftScore}%
    
    Check your Google Sheet for details.
  `;
  
  MailApp.sendEmail(recipient, subject, body);
}

// Test function (run this to verify your script works)
function testScript() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        persona: 'Test Persona',
        topic: 'Test Topic',
        format: 'LinkedIn Post',
        audience: 'Layperson',
        driftScore: 95,
        content: 'Test content',
        distilledInsight: 'Test insight',
        driftReasoning: 'Test reasoning'
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
```

### Step 2: Set Up Sheet Headers

Before deploying, ensure your sheet has the following headers in row 1:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Timestamp | Persona | Topic | Format | Audience | Drift Score | Content | Distilled Insight | Drift Reasoning |

### Step 3: Deploy as Web App

1. Click **Deploy > New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Configure the deployment:
   - **Description**: `MedCopy Integration v1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` (if using from client-side) or `Only myself` (for server-side)
4. Click **Deploy**.
5. **Authorize** the script when prompted:
   - Click **Authorize access**
   - Select your Google account
   - Click **Advanced** if you see a warning
   - Click **Go to [Project Name] (unsafe)**
   - Click **Allow**
6. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`).

### Step 4: Add to Environment Variables

Add the Apps Script URL to your `.env.local` file:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Step 5: Update Your App (If Needed)

If you want to use the Apps Script endpoint instead of the direct Sheets API, you'll need to modify the `sheetService.ts` to send POST requests to your Apps Script URL.

### Customization Ideas

**1. Add Data Validation**
```javascript
// Validate content length
if (data.content.length < 50) {
  throw new Error('Content too short');
}
```

**2. Create Separate Sheets by Format**
```javascript
// Route to different sheets based on format
const sheetName = data.format.replace(/[^a-zA-Z0-9]/g, '_');
let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
if (!sheet) {
  sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
}
```

**3. Generate Analytics**
```javascript
// Update a summary sheet with statistics
function updateAnalytics(data) {
  const analyticsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Analytics');
  // Count posts by format, average drift score, etc.
}
```

**4. Integrate with External APIs**
```javascript
// Send to Slack, Discord, or other webhooks
function notifySlack(data) {
  const webhookUrl = 'YOUR_SLACK_WEBHOOK_URL';
  const payload = {
    text: `New content generated: ${data.topic}`
  };
  
  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}
```

### Troubleshooting Apps Script

**Issue: "Authorization required"**
- Re-run the deployment and complete the authorization flow
- Make sure "Execute as" is set to "Me"

**Issue: "Script function not found"**
- Ensure your function is named `doPost` (case-sensitive)
- Save your script before deploying

**Issue: "Permission denied"**
- Check that "Who has access" is set correctly
- For client-side apps, use "Anyone"

**Issue: Data not appearing in sheet**
- Run the `testScript()` function to debug
- Check the Apps Script execution logs (View > Logs)
- Verify your sheet headers match the script

### Security Considerations

> **⚠️ Important**: When deploying with "Who has access: Anyone", your script can be called by anyone with the URL. To secure it:
> 
> 1. **Add API Key Validation**:
> ```javascript
> const VALID_API_KEY = 'your-secret-key-here';
> 
> function doPost(e) {
>   const apiKey = e.parameter.apiKey;
>   if (apiKey !== VALID_API_KEY) {
>     return ContentService.createTextOutput(
>       JSON.stringify({ success: false, error: 'Invalid API key' })
>     ).setMimeType(ContentService.MimeType.JSON);
>   }
>   // ... rest of your code
> }
> ```
> 
> 2. **Rate Limiting**: Use Apps Script's Cache Service to limit requests
> 3. **Input Validation**: Always validate and sanitize incoming data
> 4. **Use HTTPS Only**: Apps Script URLs are HTTPS by default

---

## Summary

You now have two integration options:

1. **Basic Integration** (Steps 1-6): Direct OAuth connection for simple "Save to Sheets" functionality
2. **Advanced Integration** (Apps Script): Custom server-side processing, automation, and advanced features

Choose the approach that best fits your needs. Most users will be fine with the basic integration, while power users can leverage Apps Script for advanced workflows.
