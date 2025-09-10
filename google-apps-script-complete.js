/**
 * Google Apps Script for handling form submissions
 * This script should be deployed as a Web App in Google Apps Script
 */

// Configuration
const CONFIG = {
  // Spreadsheet ID - your Google Sheets ID
  SPREADSHEET_ID: '1FHqjKrUPKvKwV_OlPpeEZB-N0CUgt__oTCdCZhtvp0g',
  
  // Sheet name for orders
  SHEET_NAME: 'הזמנות',
  
  // Headers for the sheet
  HEADERS: [
    'תאריך ושעה',
    'שם מלא', 
    'טלפון',
    'אימייל',
    'כתובת',
    'חבילה',
    'מחיר חבילה',
    'כמות',
    'מחיר כולל',
    'הערות',
    'תנאים',
    'סטטוס',
    'מספר הזמנה',
    'מקור',
    'User Agent',
    'Referrer'
  ]
};

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

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

    let data;

    // Try to parse as JSON first, then as form data
    try {
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
      } else {
        // Handle form data
        data = e.parameter || {};
      }
    } catch (jsonError) {
      // If JSON parsing fails, use form parameters
      data = e.parameter || {};
    }

    // Validate required fields
    if (!validateData(data)) {
      return createResponse(false, 'נתונים חסרים או לא תקינים');
    }

    // Add the order to the spreadsheet
    const result = addOrderToSheet(data);

    if (result.success) {
      return createResponse(true, 'ההזמנה נשמרה בהצלחה!', result.orderNumber);
    } else {
      return createResponse(false, 'שגיאה בשמירת ההזמנה: ' + result.error);
    }

  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(false, 'שגיאה בעיבוד הבקשה: ' + error.toString());
  }
}

/**
 * Add order to Google Sheets
 * @param {Object} data - Order data
 * @returns {Object} - Result object
 */
function addOrderToSheet(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      // Add headers
      sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
      sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setFontWeight('bold');
    }
    
    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Prepare row data
    const rowData = [
      new Date().toLocaleString('he-IL'),
      data.fullName || '',
      data.phone || '',
      data.email || '',
      data.address || '',
      data.package || '',
      data.packagePrice || '',
      data.quantity || 1,
      data.totalPrice || '',
      data.notes || '',
      data.terms ? 'מאושר' : 'לא מאושר',
      'חדש',
      orderNumber,
      data.source || 'דף נחיתה',
      data.userAgent || '',
      data.referrer || ''
    ];
    
    // Add the row
    sheet.appendRow(rowData);
    
    return {
      success: true,
      orderNumber: orderNumber
    };
    
  } catch (error) {
    console.error('Error adding order to sheet:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Generate unique order number
 * @returns {string} - Order number
 */
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-4);
  
  return `ORD-${year}${month}${day}-${time}`;
}

/**
 * Validate incoming data
 * @param {Object} data - Data to validate
 * @returns {boolean} - Validation result
 */
function validateData(data) {
  if (!data) return false;
  
  // Required fields
  const requiredFields = ['fullName', 'phone', 'package'];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].trim() === '') {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Create standardized response with CORS headers
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {string} orderNumber - Order number (optional)
 * @returns {Object} - Response object
 */
function createResponse(success, message, orderNumber = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };

  if (orderNumber) {
    response.orderNumber = orderNumber;
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Log request for debugging
 * @param {Object} e - Event object
 */
function logRequest(e) {
  try {
    console.log('Request received:', {
      method: e.parameter ? 'GET' : 'POST',
      postData: e.postData ? e.postData.contents : 'No POST data',
      parameters: e.parameter || 'No parameters'
    });
  } catch (error) {
    console.error('Error logging request:', error);
  }
}
