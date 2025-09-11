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
    'תאריך ושעה', 'שם מלא', 'טלפון', 'אימייל', 'עיר מגורים', 
    'כתובת מגורים', 'פריטים בהזמנה', 'מחיר כולל', 'הערות', 
    'תנאי שימוש', 'אישור יצירת קשר', 'סטטוס', 'מספר הזמנה'
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
    }
    
    const orderNumber = generateOrderNumber();
    
    // Parse cart items
    let cartItemsText = '';
    if (data.cartItems) {
      try {
        const cartItems = typeof data.cartItems === 'string' ? JSON.parse(data.cartItems) : data.cartItems;
        if (cartItems && cartItems.items && Array.isArray(cartItems.items)) {
          cartItemsText = cartItems.items.map(item => 
            `${item.name} (${item.kashrut}) - כמות: ${item.quantity} - מחיר: ${item.price}₪`
          ).join('\n');
        }
      } catch (e) {
        cartItemsText = data.cartItems.toString();
      }
    }
    
    const rowData = [
      new Date().toLocaleString('he-IL'),
      data.fullName || '',
      data.phone || '',
      data.email || '',
      data.city || '',
      data.address || '',
      cartItemsText,
      data.totalPrice || '0',
      data.notes || '',
      data.terms === 'on' ? 'מאושר' : 'לא מאושר',
      data.contactApproval === 'on' ? 'מאושר' : 'לא מאושר',
      'חדש',
      orderNumber
    ];
    
    sheet.appendRow(rowData);
    console.log('✅ Order added successfully:', orderNumber);
    
    return { success: true, orderNumber: orderNumber };
    
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
