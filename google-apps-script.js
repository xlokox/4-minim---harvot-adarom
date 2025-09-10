/**
 * Google Apps Script for handling form submissions
 * This script should be deployed as a Web App in Google Apps Script
 * 
 * Instructions:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Paste this code
 * 4. Deploy as Web App with execute permissions for "Anyone"
 * 5. Copy the Web App URL to google-sheets-integration.js
 */

// Configuration
const CONFIG = {
  // Spreadsheet ID - your Google Sheets ID
  SPREADSHEET_ID: '1M9IUUrgP0w12VDyrqT6KxQieVSmRN4K717hGxiTOx6Q',
  
  // Sheet name for orders
  ORDERS_SHEET_NAME: 'הזמנות',
  
  // Sheet name for logs
  LOGS_SHEET_NAME: 'לוגים',
  
  // Email notifications (optional)
  NOTIFICATION_EMAIL: 'your-email@example.com',
  SEND_EMAIL_NOTIFICATIONS: false
};

/**
 * Handle GET requests - for testing if the Web App is accessible
 */
function doGet(e) {
  return ContentService
    .createTextOutput('Google Apps Script is working! Ready to receive form data.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Main function to handle POST requests
 * @param {Object} e - Event object containing request data
 * @returns {Object} - Response object
 */
function doPost(e) {
  try {
    // Log the request
    logRequest(e);
    
    // Parse the request data
    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    const validation = validateData(data);
    if (!validation.isValid) {
      return createResponse(false, validation.message);
    }
    
    // Save to spreadsheet
    const result = saveToSpreadsheet(data);
    
    if (result.success) {
      // Send email notification if enabled
      if (CONFIG.SEND_EMAIL_NOTIFICATIONS) {
        sendEmailNotification(data);
      }
      
      return createResponse(true, 'ההזמנה נשמרה בהצלחה', result.rowNumber);
    } else {
      return createResponse(false, result.message);
    }
    
  } catch (error) {
    console.error('Error in doPost:', error);
    logError(error, e);
    return createResponse(false, 'אירעה שגיאה בשמירת ההזמנה');
  }
}

/**
 * Handle GET requests (for testing)
 * @param {Object} e - Event object
 * @returns {Object} - Response object
 */
function doGet(e) {
  return createResponse(true, 'Google Apps Script is working correctly');
}

/**
 * Validate incoming data
 * @param {Object} data - Data to validate
 * @returns {Object} - Validation result
 */
function validateData(data) {
  const requiredFields = ['fullName', 'phone', 'address', 'package', 'quantity'];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      return {
        isValid: false,
        message: `שדה חובה חסר: ${field}`
      };
    }
  }
  
  // Validate phone number
  const phonePattern = /^0\d{1,2}-?\d{7}$|^0\d{9}$/;
  if (!phonePattern.test(data.phone)) {
    return {
      isValid: false,
      message: 'מספר טלפון לא תקין'
    };
  }
  
  // Validate email if provided
  if (data.email && data.email.trim() !== '') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
      return {
        isValid: false,
        message: 'כתובת אימייל לא תקינה'
      };
    }
  }
  
  // Validate quantity
  const quantity = parseInt(data.quantity);
  if (isNaN(quantity) || quantity < 1 || quantity > 50) {
    return {
      isValid: false,
      message: 'כמות לא תקינה'
    };
  }
  
  return { isValid: true };
}

/**
 * Save data to Google Spreadsheet
 * @param {Object} data - Data to save
 * @returns {Object} - Save result
 */
function saveToSpreadsheet(data) {
  try {
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Get or create the orders sheet
    let ordersSheet = spreadsheet.getSheetByName(CONFIG.ORDERS_SHEET_NAME);
    if (!ordersSheet) {
      ordersSheet = createOrdersSheet(spreadsheet);
    }
    
    // Log received data for debugging
    console.log('Received data:', JSON.stringify(data, null, 2));

    // Prepare row data - ensure all fields are included
    const rowData = [
      data.timestamp || new Date().toLocaleString('he-IL'),
      data.orderNumber || '',
      data.fullName || '',
      data.phone || '',
      data.email || '',
      data.address || '',
      data.package || '',
      data.packagePrice || 0,
      data.quantity || 1,
      data.totalPrice || 0,
      data.notes || '',
      data.termsAccepted || 'לא צוין',
      data.status || 'חדש',
      data.source || 'דף נחיתה',
      data.referrer || '',
      data.userAgent || '',
      new Date(), // Created timestamp
      data.rawFormData || '' // Raw form data for debugging
    ];

    console.log('Prepared row data:', rowData);
    
    // Add the row
    const rowNumber = ordersSheet.getLastRow() + 1;
    ordersSheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
    
    // Format the new row
    formatOrderRow(ordersSheet, rowNumber);
    
    console.log(`Order saved successfully to row ${rowNumber}`);
    
    return {
      success: true,
      rowNumber: rowNumber,
      message: 'ההזמנה נשמרה בהצלחה'
    };
    
  } catch (error) {
    console.error('Error saving to spreadsheet:', error);
    return {
      success: false,
      message: 'שגיאה בשמירת ההזמנה: ' + error.message
    };
  }
}

/**
 * Create orders sheet with headers
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @returns {Sheet} - The created sheet
 */
function createOrdersSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(CONFIG.ORDERS_SHEET_NAME);
  
  // Set headers - include all fields
  const headers = [
    'תאריך הזמנה',
    'מספר הזמנה',
    'שם מלא',
    'טלפון',
    'אימייל',
    'כתובת',
    'חבילה',
    'מחיר חבילה',
    'כמות',
    'מחיר כולל',
    'הערות',
    'אישור תנאים',
    'סטטוס',
    'מקור',
    'הפניה',
    'דפדפן',
    'נוצר בתאריך',
    'נתונים גולמיים'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4a7c59');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Set column widths for all columns
  sheet.setColumnWidth(1, 120); // Date
  sheet.setColumnWidth(2, 100); // Order number
  sheet.setColumnWidth(3, 150); // Name
  sheet.setColumnWidth(4, 120); // Phone
  sheet.setColumnWidth(5, 200); // Email
  sheet.setColumnWidth(6, 250); // Address
  sheet.setColumnWidth(7, 120); // Package
  sheet.setColumnWidth(8, 80);  // Package price
  sheet.setColumnWidth(9, 60);  // Quantity
  sheet.setColumnWidth(10, 80); // Total price
  sheet.setColumnWidth(11, 200); // Notes
  sheet.setColumnWidth(12, 80);  // Terms accepted
  sheet.setColumnWidth(13, 80);  // Status
  sheet.setColumnWidth(14, 100); // Source
  sheet.setColumnWidth(15, 100); // Referrer
  sheet.setColumnWidth(16, 150); // User agent
  sheet.setColumnWidth(17, 120); // Created
  sheet.setColumnWidth(18, 200); // Raw data
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Format a new order row
 * @param {Sheet} sheet - The sheet object
 * @param {number} rowNumber - Row number to format
 */
function formatOrderRow(sheet, rowNumber) {
  const range = sheet.getRange(rowNumber, 1, 1, 18); // Updated to 18 columns

  // Alternate row colors
  if (rowNumber % 2 === 0) {
    range.setBackground('#f8f9fa');
  }

  // Format currency columns
  sheet.getRange(rowNumber, 8).setNumberFormat('₪#,##0');  // Package price
  sheet.getRange(rowNumber, 10).setNumberFormat('₪#,##0'); // Total price

  // Format date columns
  sheet.getRange(rowNumber, 1).setNumberFormat('dd/mm/yyyy hh:mm');  // Order date
  sheet.getRange(rowNumber, 17).setNumberFormat('dd/mm/yyyy hh:mm'); // Created date

  // Center align certain columns
  sheet.getRange(rowNumber, 2).setHorizontalAlignment('center');  // Order number
  sheet.getRange(rowNumber, 9).setHorizontalAlignment('center');  // Quantity
  sheet.getRange(rowNumber, 12).setHorizontalAlignment('center'); // Terms accepted
  sheet.getRange(rowNumber, 13).setHorizontalAlignment('center'); // Status

  // Wrap text for long content columns
  sheet.getRange(rowNumber, 6).setWrap(true);  // Address
  sheet.getRange(rowNumber, 11).setWrap(true); // Notes
  sheet.getRange(rowNumber, 16).setWrap(true); // User agent
  sheet.getRange(rowNumber, 18).setWrap(true); // Raw data
}

/**
 * Send email notification for new order
 * @param {Object} data - Order data
 */
function sendEmailNotification(data) {
  try {
    const subject = `הזמנה חדשה - ${data.orderNumber || 'ללא מספר'}`;
    
    const body = `
הזמנה חדשה התקבלה:

פרטי הלקוח:
שם: ${data.fullName}
טלפון: ${data.phone}
אימייל: ${data.email || 'לא צוין'}
כתובת: ${data.address}

פרטי ההזמנה:
חבילה: ${data.package}
כמות: ${data.quantity}
מחיר כולל: ₪${data.totalPrice}

הערות: ${data.notes || 'אין'}

תאריך הזמנה: ${data.timestamp}
מספר הזמנה: ${data.orderNumber}
    `;
    
    MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
    
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

/**
 * Log request for debugging
 * @param {Object} e - Event object
 */
function logRequest(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let logsSheet = spreadsheet.getSheetByName(CONFIG.LOGS_SHEET_NAME);
    
    if (!logsSheet) {
      logsSheet = spreadsheet.insertSheet(CONFIG.LOGS_SHEET_NAME);
      logsSheet.getRange(1, 1, 1, 4).setValues([['Timestamp', 'Method', 'Content', 'User Agent']]);
    }
    
    const logData = [
      new Date(),
      e.parameter ? 'GET' : 'POST',
      e.postData ? e.postData.contents.substring(0, 1000) : 'No content',
      e.parameter ? JSON.stringify(e.parameter) : 'No parameters'
    ];
    
    logsSheet.appendRow(logData);
    
  } catch (error) {
    console.error('Error logging request:', error);
  }
}

/**
 * Log errors
 * @param {Error} error - Error object
 * @param {Object} e - Event object
 */
function logError(error, e) {
  try {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      request: e.postData ? e.postData.contents : 'No post data'
    });
  } catch (logError) {
    console.error('Error logging error:', logError);
  }
}

/**
 * Create standardized response
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {*} data - Additional data
 * @returns {TextOutput} - JSON response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
