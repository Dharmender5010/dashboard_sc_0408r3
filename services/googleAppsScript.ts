
// --- CONSOLIDATED GOOGLE APPS SCRIPT (Code.gs) ---
// This single script handles all backend functionality: OTP Login, Help Desk, Login History, and Maintenance Mode.
//
// --- INSTRUCTIONS ---
// 1. CREATE SHEETS: In your Google Sheet ("1JiwnMWCok3HumvYQA3IduXSFbAkkbGC0aBFFNK6Lti8"), ensure you have the following sheets with the exact names:
//    - "Need_Help": Headers: TicketID, Timestamp, UserEmail, UserName, Issue, ScreenshotLink, Status, LastUpdated, ResolvedBy
//    - "OTP_Log": No headers needed.
//    - "Web_Permissions": Headers: userType, email, name, loginCount
//    - "Login_History": Headers: Timestamp, Email, Name, Activity, Login Source
//
// 2. SET UP MAINTENANCE: In the "Web_Permissions" sheet, add a row with userType='Maintenance', email='status', and name='OFF' (or 'ON').
//
// 3. PASTE SCRIPT: Open script.google.com, create a new project, and paste this entire script, replacing any default code.
//
// 4. CONFIGURE SCRIPT: Update the DRIVE_FOLDER_ID and BACKEND_SECRET_KEY variables below with your own values.
//
// 5. DEPLOY WEB APP:
//    - Click "Deploy" > "New deployment".
//    - Set "Execute as" to "Me".
//    - Set "Who has access" to "Anyone".
//    - Click "Deploy" and authorize the script.
//    - Copy the generated Web App URL.
//
// 6. UPDATE FRONTEND: Paste the copied URL into the `WEB_APP_URL` constant in `services/config.ts`.
//
// --- MAINTENANCE FAILSAFE ---
// If you are locked out, you can force maintenance mode OFF by visiting a special URL.
// 1. Set a strong `BACKEND_SECRET_KEY` below.
// 2. Deploy the script.
// 3. To use the failsafe, visit: YOUR_WEB_APP_URL?action=turnOffMaintenance&key=YOUR_SECRET_KEY
//    (e.g., https://script.google.com/macros/s/..../exec?action=turnOffMaintenance&key=MySuperSecret123)

/*
// --- SCRIPT START ---

// --- CONFIGURATION ---
const PERMISSIONS_SPREADSHEET_ID = '1JiwnMWCok3HumvYQA3IduXSFbAkkbGC0aBFFNK6Lti8';
const TASKS_SPREADSHEET_ID = '1lpb27xNoG6eTeskB1ATT36zxjgV2QLKQjNWruhhmDhY';

const HELP_TICKETS_SHEET_NAME = 'Need_Help';
const OTP_LOG_SHEET_NAME = 'OTP_Log';
const PERMISSIONS_SHEET_NAME = 'Web_Permissions';
const LOGIN_HISTORY_SHEET_NAME = 'Login_History';
const PERFORMANCE_DATA_SHEET_NAME = 'Web_App_Data';
const PENDING_TASKS_SHEET_NAME = 'WebApp_Pending_Task';
const TODAYS_TASKS_SHEET_NAME = 'All_Completed_Task';

const DEVELOPER_EMAIL = "mis@bonhoeffermachines.in";

// IMPORTANT: Paste the ID of your Google Drive folder for screenshots here.
const DRIVE_FOLDER_ID = '1r4_tT807APYOq0XRUEkJLNbAAJgbmf41';
// IMPORTANT: Set your own secret key here for the failsafe. This is critical for security.
const BACKEND_SECRET_KEY = "CHANGE_ME_TO_A_STRONG_SECRET";


// Helper function to get a sheet and throw a specific error if not found.
function getSheet(spreadsheetId, name) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error(`Sheet with name "${name}" was not found in the spreadsheet (ID: ${spreadsheetId}). Please ensure it exists and the name is spelled correctly.`);
  }
  return sheet;
}

// Handles GET requests (for failsafe actions)
function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    const secretKey = params.key;

    if (secretKey !== BACKEND_SECRET_KEY) {
      throw new Error("Unauthorized: Invalid secret key.");
    }

    if (action === 'turnOffMaintenance') {
      const sheet = getSheet(PERMISSIONS_SPREADSHEET_ID, PERMISSIONS_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      
      for (let i = 0; i < data.length; i++) {
        const userType = String(data[i][0]).trim();
        const email = String(data[i][1]).trim();
        if (userType === 'Maintenance' && email === 'status') {
          sheet.getRange(i + 1, 3).setValue('OFF');
          return ContentService.createTextOutput("SUCCESS: Maintenance mode has been turned OFF.").setMimeType(ContentService.MimeType.TEXT);
        }
      }
      // If not found, append it as OFF
      sheet.appendRow(['Maintenance', 'status', 'OFF']);
      return ContentService.createTextOutput("SUCCESS: Maintenance mode flag created and set to OFF.").setMimeType(ContentService.MimeType.TEXT);
    } else {
      throw new Error("Invalid action specified for GET request.");
    }
  } catch (error) {
    Logger.log(error.toString());
    return ContentService.createTextOutput(`ERROR: ${error.toString()}`).setMimeType(ContentService.MimeType.TEXT);
  }
}

// Handles POST requests (from the web app)
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    let result;
    switch(action) {
      case 'get_dashboard_data': result = handleGetDashboardData(); break;
      case 'send_otp': result = handleSendOtp(payload); break;
      case 'verify_otp': result = handleVerifyOtp(payload); break;
      case 'send_help_request': result = handleSendHelpRequest(payload); break;
      case 'get_help_tickets': result = handleGetHelpTickets(payload); break;
      case 'update_ticket_status': result = handleUpdateTicketStatus(payload); break;
      case 'set_maintenance_mode': result = handleSetMaintenanceMode(payload); break;
      case 'log_user_activity': result = handleLogUserActivity(payload); break;
      default: throw new Error("Invalid action specified.");
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true, ...result })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log(error.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// --- CONSOLIDATED DATA FETCHER ---
function handleGetDashboardData() {
  const pendingTasks = _fetchPendingTasks();
  const userPermissions = _fetchUserPermissions();
  const performanceData = _fetchPerformanceData();
  const todaysTasks = _fetchTodaysTasks();
  
  return {
    data: {
      pendingTasks,
      userPermissions,
      performanceData,
      todaysTasks,
    }
  };
}

function _fetchPendingTasks() {
    const sheet = getSheet(TASKS_SPREADSHEET_ID, PENDING_TASKS_SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    const data = sheet.getRange('A2:T' + lastRow).getDisplayValues();

    return data.map(row => ({
        leadId: String(row[0] || '').trim(),
        personName: String(row[1] || '').trim(),
        mobile: row[2] ? Number(String(row[2]).replace(/[^0-9]/g, '')) : null,
        state: String(row[3] || '').trim(),
        requirement: String(row[4] || '').trim(),
        salesPerson: String(row[5] || '').trim(),
        stepName: String(row[6] || '').trim(),
        stepCode: String(row[7] || '').trim(),
        daysOfFollowUp: row[8] ? Number(row[8]) : null,
        numberOfFollowUps: row[9] ? Number(row[9]) : null,
        planned: String(row[10] || '').trim(),
        actual: String(row[11] || '').trim(),
        lastStatus: String(row[12] || '').trim(),
        remark: String(row[13] || '').trim(),
        link: String(row[14] || '').trim(),
        scEmail: String(row[15] || '').trim(),
        doer: String(row[18] || '').trim(),
        lastPlannedDcDoor: String(row[17] || '').trim(),
    }));
}

function _fetchUserPermissions() {
    const sheet = getSheet(PERMISSIONS_SPREADSHEET_ID, PERMISSIONS_SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    const data = sheet.getRange('A2:D' + lastRow).getDisplayValues();

    return data.map(row => ({
        userType: String(row[0] || '').trim(),
        email: String(row[1] || '').trim(),
        name: String(row[2] || '').trim(),
        loginCount: Number(row[3] || 0),
    })).filter(p => p.email && p.userType);
}

function _fetchPerformanceData() {
    const sheet = getSheet(PERMISSIONS_SPREADSHEET_ID, PERFORMANCE_DATA_SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    const data = sheet.getRange('A2:I' + lastRow).getValues();

    return data.map(row => ({
        scEmail: String(row[0] || '').trim(),
        sc: String(row[1] || '').trim(),
        leadsAssign: Number(row[2] || 0),
        callsMade: Number(row[3] || 0),
        meetingFixed: Number(row[4] || 0),
        onFollowUps: Number(row[5] || 0),
        followUpsDone: Number(row[6] || 0),
        connectedCallsMade: Number(row[7] || 0),
        connectedFollowUpsDone: Number(row[8] || 0),
    })).filter(p => p.scEmail);
}

function _fetchTodaysTasks() {
    const sheet = getSheet(TASKS_SPREADSHEET_ID, TODAYS_TASKS_SHEET_NAME);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    const data = sheet.getRange('A2:L' + lastRow).getDisplayValues();

    return data.map(row => ({
        leadId: String(row[0] || '').trim(),
        personName: String(row[1] || '').trim(),
        mobile: row[2] ? Number(String(row[2]).replace(/[^0-9]/g, '')) : null,
        stepCode: String(row[3] || '').trim(),
        planned: String(row[4] || '').trim(),
        actual: String(row[5] || '').trim(),
        status: String(row[6] || '').trim(),
        remark: String(row[7] || '').trim(),
        scEmail: String(row[8] || '').trim(),
        lastActual: String(row[9] || '').trim(),
        category: String(row[10] || '').trim(),
        doer: String(row[11] || '').trim(),
    }));
}


// --- LOGIN HISTORY ---
function handleLogUserActivity(payload) {
  const { email, name, activity, loginMethod } = payload;
  if (!email || !name || !activity) {
    throw new Error("Missing required parameters for logging activity (email, name, activity).");
  }
  const sheet = getSheet(PERMISSIONS_SPREADSHEET_ID, LOGIN_HISTORY_SHEET_NAME);
  const timestamp = new Date();

  if(sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Email', 'Name', 'Activity', 'Login Source']);
  }

  sheet.appendRow([timestamp, email, name, activity, loginMethod || 'N/A']);
  
  // New logic to increment login count
  if (activity === 'Login') {
    try {
      const permissionsSheet = getSheet(PERMISSIONS_SPREADSHEET_ID, PERMISSIONS_SHEET_NAME);
      const data = permissionsSheet.getRange('B:B').getValues(); // Get all emails from column B
      const lowercasedEmail = email.toLowerCase().trim();

      for (let i = 0; i < data.length; i++) {
        if (data[i][0] && String(data[i][0]).toLowerCase().trim() === lowercasedEmail) {
          const rowNumber = i + 1;
          const countCell = permissionsSheet.getRange(rowNumber, 4); // Column D
          const currentCount = Number(countCell.getValue() || 0);
          countCell.setValue(currentCount + 1);
          break; // Exit after finding and updating the user
        }
      }
    } catch (e) {
      // Log error but don't fail the entire request, as logging is secondary
      Logger.log(`Failed to increment login count for ${email}: ${e.toString()}`);
    }
  }

  return { message: "Activity logged successfully." };
}

// --- MAINTENANCE MODE ---
function handleSetMaintenanceMode(payload) {
  const { status, userEmail } = payload;
  if (!userEmail || userEmail.toLowerCase() !== DEVELOPER_EMAIL.toLowerCase()) {
    throw new Error("Unauthorized: Only the developer can change maintenance mode.");
  }
  if (status !== 'ON' && status !== 'OFF') {
    throw new Error("Invalid status. Must be 'ON' or 'OFF'.");
  }

  const sheet = getSheet(PERMISSIONS_SPREADSHEET_ID, PERMISSIONS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 0; i < data.length; i++) {
    const userType = String(data[i][0]).trim();
    const email = String(data[i][1]).trim();
    if (userType === 'Maintenance' && email === 'status') {
      sheet.getRange(i + 1, 3).setValue(status);
      return { message: `Maintenance mode set to ${status}.` };
    }
  }
  sheet.appendRow(['Maintenance', 'status', status]);
  return { message: `Maintenance mode flag created and set to ${status}.` };
}

// --- HELP DESK ---
function handleSendHelpRequest(payload) {
  const { email, issue, screenshot, userName } = payload;
  const sheet = getSheet(PERMISSIONS_SPREADSHEET_ID, HELP_TICKETS_SHEET_NAME);
  const timestamp = new Date();
  const ticketId = "TID-" + timestamp.getTime();
  let screenshotLink = '';

  if (screenshot && screenshot.base64) {
    if (!DRIVE_FOLDER_ID) throw new Error("Google Drive Folder ID is not set in the Apps Script.");
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(screenshot.base64), screenshot.mimeType, screenshot.fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    screenshotLink = file.getUrl();
  }
  
  if(sheet.getLastRow() === 0) {
      sheet.appendRow(['TicketID', 'Timestamp', 'UserEmail', 'UserName', 'Issue', 'ScreenshotLink', 'Status', 'LastUpdated', 'ResolvedBy']);
  }

  sheet.appendRow([ticketId, timestamp, email, userName || 'N/A', issue, screenshotLink, 'Pending', timestamp, '']);
  
  const subject = `New Help Ticket: ${ticketId} from ${email}`;
  const body = `A new help ticket has been submitted.\n\nUser: ${email}\nName: ${userName || 'N/A'}\nIssue: ${issue}\n\nScreenshot: ${screenshotLink || 'Not provided'}`;
  MailApp.sendEmail(DEVELOPER_EMAIL, subject, body);

  return { message: "Help request submitted successfully.", ticketId: ticketId };
}

function handleGetHelpTickets(payload) {
  const { userEmail, userRole } = payload;
  const sheet = getSheet(PERMISSIONS_SPREADSHEET_ID, HELP_TICKETS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { tickets: [] };
  
  const headers = data.shift().map(h => {
      const trimmedHeader = String(h || '').trim();
      if (!trimmedHeader) return '';
      if (trimmedHeader.toUpperCase() === 'TICKETID') return 'ticketId';
      return trimmedHeader.charAt(0).toLowerCase() + trimmedHeader.slice(1);
  });

  const tickets = data.map(row => {
    let ticket = {};
    headers.forEach((header, i) => {
      if (header) {
        const value = row[i];
        ticket[header] = (value !== null && value !== undefined) ? String(value).trim() : value;
        if (header === 'timestamp' || header === 'lastUpdated') {
          const date = new Date(ticket[header]);
          if (!isNaN(date.getTime())) {
            ticket[header] = date.toISOString();
          }
        }
      }
    });
    return ticket;
  }).reverse();

  if (userRole === 'User' && userEmail.toLowerCase() !== DEVELOPER_EMAIL.toLowerCase()) {
    return { tickets: tickets.filter(t => t.userEmail && t.userEmail.toLowerCase() === userEmail.toLowerCase()) };
  } else {
    return { tickets: tickets };
  }
}

function handleUpdateTicketStatus(payload) {
  const { ticketId, status, userEmail, userName } = payload;
  const sheet = getSheet(PERMISSIONS_SPREADSHEET_ID, HELP_TICKETS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) throw new Error("Ticket not found or sheet is empty.");
  
  const headers = data[0].map(h => String(h || '').trim());
  const ticketIdCol = headers.indexOf('TicketID');
  const statusCol = headers.indexOf('Status');
  const lastUpdatedCol = headers.indexOf('LastUpdated');
  const resolvedByCol = headers.indexOf('ResolvedBy');
  const userEmailCol = headers.indexOf('UserEmail');
  
  if (ticketIdCol === -1 || statusCol === -1 || lastUpdatedCol === -1 || resolvedByCol === -1) {
    throw new Error("One or more required columns (TicketID, Status, LastUpdated, ResolvedBy) are missing from the Need_Help sheet.");
  }

  for (let i = 1; i < data.length; i++) {
    const sheetTicketId = data[i][ticketIdCol] ? String(data[i][ticketIdCol]).trim() : '';
    
    if (sheetTicketId && sheetTicketId === ticketId) {
      const ticketOwnerEmail = data[i][userEmailCol];
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      sheet.getRange(i + 1, lastUpdatedCol + 1).setValue(new Date());

      let notificationSubject = `Your Help Ticket ${ticketId} has been updated`;
      let notificationBody = `Hello,\n\nThe status of your help ticket (${ticketId}) has been updated to: ${status}.\n\n`;

      if (status === 'Resolved' || status === 'Cancelled by Dev') {
        sheet.getRange(i + 1, resolvedByCol + 1).setValue(userEmail);
        notificationBody += `This action was performed by our support team.`
      }
      if(status === 'Cancelled by User') {
        notificationBody += `This ticket was cancelled by you.`
      }
      
      if (ticketOwnerEmail) MailApp.sendEmail(ticketOwnerEmail, notificationSubject, notificationBody);
      
      if (status === 'Cancelled by User') {
         MailApp.sendEmail(DEVELOPER_EMAIL, `Ticket Cancelled by User: ${ticketId}`, `User ${userEmail} (${userName}) has cancelled their ticket.`);
      }
      return { message: "Ticket status updated successfully." };
    }
  }
  throw new Error("Ticket not found.");
}

// --- OTP LOGIN ---
function handleSendOtp(payload) {
  const { email } = payload;
  const permissionsSheet = getSheet(PERMISSIONS_SPREADSHEET_ID, PERMISSIONS_SHEET_NAME);
  const data = permissionsSheet.getDataRange().getValues();
  const emails = data.map(row => row[1] ? String(row[1]).toLowerCase().trim() : '');
  if (!emails.includes(email.toLowerCase().trim())) {
    throw new Error("This email is not registered for OTP login.");
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const timestamp = new Date();
  const logSheet = getSheet(PERMISSIONS_SPREADSHEET_ID, OTP_LOG_SHEET_NAME);
  logSheet.appendRow([email, otp, timestamp, false]);
  const otp_subject = "SC-Dashboard Login OTP"
  const otp_body =  `
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
      <h2>SC-Dashboard Login</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f0f0f0; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</p>
      <p>This code is valid for 3 minutes.</p>
      <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
      <br><br><hr>
      <p style="font-size: 15px; color: #999;">** This is a system-generated email. Please do not reply. **</p>
    </div>
  `;
  
  MailApp.sendEmail({ to: email, subject: otp_subject, htmlBody: otp_body, noReply: true });
  return { message: "OTP sent successfully." };
}

function handleVerifyOtp(payload) {
  const { email, otp } = payload;
  const logSheet = getSheet(PERMISSIONS_SPREADSHEET_ID, OTP_LOG_SHEET_NAME);
  const data = logSheet.getDataRange().getValues();
  for (let i = data.length - 1; i > 0; i--) {
    const row = data[i];
    if (String(row[0]).toLowerCase() === email.toLowerCase() && String(row[1]) === otp && !row[3]) {
      if ((new Date().getTime() - new Date(row[2]).getTime()) <= 300000) { // 5-minute validity
        logSheet.getRange(i + 1, 4).setValue(true);
        return { verified: true };
      } else {
        throw new Error("OTP has expired. Please request a new one.");
      }
    }
  }
  throw new Error("Invalid or expired OTP. Please try again.");
}

// --- SCRIPT END ---
*/