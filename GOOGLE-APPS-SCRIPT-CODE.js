/**
 * 📋 Google Apps Script for 4 Minim Order Form
 * 
 * INSTRUCTIONS:
 * 1. Copy this entire code
 * 2. Go to script.google.com
 * 3. Create new project
 * 4. Paste this code
 * 5. Save project
 * 6. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy the Web App URL
 * 8. Update config.js with the new URL
 */

// Configuration
const CONFIG = {
  SPREADSHEET_ID: '1FHqjKrUPKvKwV_OlPpeEZB-N0CUgt__oTCdCZhtvp0g',
  SHEET_NAME: 'הזמנות',
  HEADERS: [
    'תאריך ושעה', 'מספר הזמנה', 'שם מלא', 'טלפון', 'אימייל',
    'עיר מגורים', 'כתובת מגורים', 'משלוח נדרש', 'מחיר כולל',
    'כמות פריטים', 'פירוט מלא', 'סטים שהוזמנו', 'אתרוגים שהוזמנו',
    'פריטים בודדים', 'סט תימני', 'סט מרוקאי', 'סט אשכנזי',
    'אתרוגים', 'לולב', 'הדס', 'ערבה', 'הערות',
    'תנאי שימוש', 'אישור יצירת קשר', 'סטטוס'
  ]
};

function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  return ContentService
    .createTextOutput('✅ Google Apps Script is working! Ready to receive form data.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    logRequest(e);
    let data = e.parameter || {};
    
    console.log('📦 Received data:', data);
    
    if (!validateData(data)) {
      return createResponse(false, 'נתונים חסרים או לא תקינים');
    }
    
    const result = addOrderToSheet(data);
    
    if (result.success) {
      return createResponse(true, 'ההזמנה נשמרה בהצלחה!', result.orderNumber);
    } else {
      return createResponse(false, 'שגיאה בשמירת ההזמנה: ' + result.error);
    }
    
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    return createResponse(false, 'שגיאה בעיבוד הבקשה: ' + error.toString());
  }
}

function addOrderToSheet(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
      sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setFontWeight('bold');
      // Auto-resize columns
      sheet.autoResizeColumns(1, CONFIG.HEADERS.length);
    }

    const rowData = [
      new Date().toLocaleString('he-IL'),                    // תאריך ושעה
      data.orderNumber || generateOrderNumber(),             // מספר הזמנה
      data.fullName || '',                                   // שם מלא
      data.phone || '',                                      // טלפון
      data.email || '',                                      // אימייל
      data.city || '',                                       // עיר מגורים
      data.address || '',                                    // כתובת מגורים
      data.needsShipping || 'לא',                           // משלוח נדרש
      data.totalPrice || '0',                               // מחיר כולל
      data.totalItems || '0',                               // כמות פריטים
      data.detailedOrderSummary || '',                      // פירוט מלא
      data.setsOrdered || '',                               // סטים שהוזמנו
      data.etrogimOrdered || '',                            // אתרוגים שהוזמנו
      data.individualItemsOrdered || '',                    // פריטים בודדים
      data.hasTimaniSet || 'לא',                           // סט תימני
      data.hasMoroccanSet || 'לא',                         // סט מרוקאי
      data.hasAshkenaziSet || 'לא',                        // סט אשכנזי
      data.hasEtrogim || 'לא',                             // אתרוגים
      data.hasLulav || 'לא',                               // לולב
      data.hasHadas || 'לא',                               // הדס
      data.hasArava || 'לא',                               // ערבה
      data.notes || '',                                     // הערות
      data.terms || 'לא מאושר',                           // תנאי שימוש
      data.contactApproval || 'לא מאושר',                 // אישור יצירת קשר
      'חדש'                                                 // סטטוס
    ];

    sheet.appendRow(rowData);
    console.log('✅ Order added successfully:', data.orderNumber || 'NEW');

    return { success: true, orderNumber: data.orderNumber || generateOrderNumber() };

  } catch (error) {
    console.error('❌ Error adding order to sheet:', error);
    return { success: false, error: error.toString() };
  }
}

function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-4);
  return `4MIN-${year}${month}${day}-${time}`;
}

function validateData(data) {
  if (!data) return false;
  const requiredFields = ['fullName', 'phone', 'city', 'address', 'terms', 'contactApproval'];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      console.error(`❌ Missing required field: ${field}`);
      return false;
    }
  }
  return true;
}

function createResponse(success, message, orderNumber = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (orderNumber) response.orderNumber = orderNumber;
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function logRequest(e) {
  try {
    console.log('📨 Request received:', {
      method: e.parameter ? 'GET' : 'POST',
      parameters: e.parameter || 'No parameters'
    });
  } catch (error) {
    console.error('❌ Error logging request:', error);
  }
}
