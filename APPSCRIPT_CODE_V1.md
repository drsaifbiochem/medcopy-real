/**

* MedCopy Advanced Integration Script
* Handles incoming content from MedCopy with custom processing

 */

functiondoPost(e) {

  try {

    // Parse incoming JSON data

    constdata = JSON.parse(e.postData.contents);

    // Get the active spreadsheet

    constsheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Prepare row data

    consttimestamp = newDate();

    constrow = [

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

    constlastRow = sheet.getLastRow();

    sheet.getRange(lastRow, 1, 1, row.length).setFontSize(10);

    // Optional: Color code by drift score

    if (data.driftScore) {

    constscoreCell = sheet.getRange(lastRow, 6);

    if (data.driftScore >= 90) {

    scoreCell.setBackground('#d4edda'); // Green

    } elseif (data.driftScore >= 85) {

    scoreCell.setBackground('#d1ecf1'); // Teal

    } elseif (data.driftScore >= 70) {

    scoreCell.setBackground('#fff3cd'); // Yellow

    } else {

    scoreCell.setBackground('#f8d7da'); // Red

    }

    }

    // Optional: Send notification (uncomment to enable)

    // sendEmailNotification(data);

    returnContentService.createTextOutput(

    JSON.stringify({ success: true, message: 'Content saved successfully' })

    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {

    returnContentService.createTextOutput(

    JSON.stringify({ success: false, error: error.toString() })

    ).setMimeType(ContentService.MimeType.JSON);

  }

}

// Optional: Email notification function

functionsendEmailNotification(data) {

  constrecipient = Session.getActiveUser().getEmail();

  constsubject = 'New MedCopy Content Generated';

  constbody = `

    A new piece of content has been generated:

    Topic: ${data.topic}

    Format: ${data.format}

    Persona Match: ${data.driftScore}%

    Check your Google Sheet for details.

  `;

  MailApp.sendEmail(recipient, subject, body);

}

// Test function (run this to verify your script works)

functiontestScript() {

  consttestData = {

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

  constresult = doPost(testData);

  Logger.log(result.getContent());

}
