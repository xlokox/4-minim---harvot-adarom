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
  SPREADSHEET_ID: '1Hcei02NWvqrmbUY1pG9KYaB8OD0nCIEsfKPy9eeKE48',
  SHEET_NAME: 'הזמנות',
  HEADERS: [
    // פרטי לקוח
    'תאריך ושעה', 'מספר הזמנה', 'שם מלא', 'טלפון', 'אימייל',
    'עיר מגורים', 'כתובת מגורים', 'משלוח נדרש',

    // סיכום הזמנה
    'מחיר כולל', 'כמות פריטים', 'פירוט מלא הזמנה',

    // סטים
    'סט תימני - כמות', 'סט מרוקאי - כמות', 'סט אשכנזי - כמות',

    // אתרוגים תימניים
    'אתרוג תימני כשר - כמות', 'אתרוג תימני מהודר - כמות', 'אתרוג תימני מהודר א - כמות',

    // אתרוגים מרוקאים
    'אתרוג מרוקאי כשר - כמות', 'אתרוג מרוקאי מהודר - כמות', 'אתרוג מרוקאי מהודר א - כמות',

    // אתרוגים אשכנזיים
    'אתרוג אשכנזי כשר - כמות', 'אתרוג אשכנזי מהודר - כמות', 'אתרוג אשכנזי מהודר א - כמות',

    // פריטים בודדים
    'לולב - כמות', 'הדס - כמות', 'ערבה - כמות',

    // הערות ואישורים
    'הערות לקוח', 'תנאי שימוש', 'אישור יצירת קשר', 'סטטוס הזמנה'
  ]
};

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  // Auto-setup the sheet when first accessed
  setupSheet();

  return ContentService
    .createTextOutput('✅ Google Apps Script is working! Ready to receive form data. Sheet setup completed!')
    .setMimeType(ContentService.MimeType.TEXT);
}

function setupSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    // 1) Create the sheet if it does not exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      console.log('✅ Created new sheet:', CONFIG.SHEET_NAME);
    }

    // 2) Ensure a header row exists WITHOUT clearing existing data
    const hasAnyRows = sheet.getLastRow() > 0;
    const firstCell = hasAnyRows ? String(sheet.getRange(1, 1).getValue() || '') : '';
    const expectedFirstHeader = CONFIG.HEADERS[0];

    // If there are no rows at all, just set the header at row 1
    if (!hasAnyRows) {
      sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
    } else if (firstCell !== expectedFirstHeader) {
      // There is data but no header row -> insert a new row at the top and add headers
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
    } else {
      // Header exists; optionally refresh header text to the latest set without clearing data
      sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
    }

    // 3) Style the header row (idempotent)
    const headerRange = sheet.getRange(1, 1, 1, CONFIG.HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a73e8');
    headerRange.setFontColor('white');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');

    // 4) Ensure sane column widths (non-destructive)
    sheet.setColumnWidth(1, 150);  // תאריך ושעה
    sheet.setColumnWidth(2, 120);  // מספר הזמנה
    sheet.setColumnWidth(3, 120);  // שם מלא
    sheet.setColumnWidth(4, 100);  // טלפון
    sheet.setColumnWidth(5, 150);  // אימייל
    sheet.setColumnWidth(6, 100);  // עיר מגורים
    sheet.setColumnWidth(7, 200);  // כתובת מגורים
    sheet.setColumnWidth(8, 80);   // משלוח נדרש
    sheet.setColumnWidth(9, 80);   // מחיר כולל
    sheet.setColumnWidth(10, 80);  // כמות פריטים
    sheet.setColumnWidth(11, 300); // פירוט מלא הזמנה

    for (let i = 12; i <= CONFIG.HEADERS.length; i++) {
      sheet.setColumnWidth(i, 100);
    }

    // 5) Freeze the header row
    sheet.setFrozenRows(1);

    console.log('✅ Sheet setup completed safely (non-destructive) with', CONFIG.HEADERS.length, 'columns');
    return { success: true };
  } catch (error) {
    console.error('❌ Error setting up sheet:', error);
    return { success: false, error: error.toString() };
  }
}

function doPost(e) {
  try {
    logRequest(e);

    // Handle both parameter and postData
    let data = {};
    if (e.parameter) {
      data = e.parameter;
    } else if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
        return createResponse(false, 'שגיאה בפענוח הנתונים');
      }
    }

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
      setupSheet(); // Use the setup function to create properly formatted sheet
      sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    }

    // Parse cart items for detailed breakdown
    let cartSummary = '';
    let totalPrice = 0;
    let totalItems = 0;

    // Initialize product counters
    let productCounts = {
      // סטים
      setTimani: 0,
      setMoroccan: 0,
      setAshkenazi: 0,

      // אתרוגים תימניים
      etrogTimaniKasher: 0,
      etrogTimaniMehudar: 0,
      etrogTimaniMehudarA: 0,

      // אתרוגים מרוקאים
      etrogMoroccanKasher: 0,
      etrogMoroccanMehudar: 0,
      etrogMoroccanMehudarA: 0,

      // אתרוגים אשכנזיים
      etrogAshkenaziKasher: 0,
      etrogAshkenaziMehudar: 0,
      etrogAshkenaziMehudarA: 0,

      // פריטים בודדים
      lulav: 0,
      hadas: 0,
      arava: 0
    };

    if (data.cartItems) {
      try {
        const cart = typeof data.cartItems === 'string' ? JSON.parse(data.cartItems) : data.cartItems;
        if (cart.items && Array.isArray(cart.items)) {
          cartSummary = cart.items.map(item =>
            `${item.productName || item.name} - ${item.kashrutText || item.kashrut} × ${item.quantity} = ₪${item.totalPrice || (item.unitPrice * item.quantity)}`
          ).join('\n');

          totalPrice = cart.totalPrice || cart.items.reduce((sum, item) => sum + (item.totalPrice || (item.unitPrice * item.quantity)), 0);
          totalItems = cart.totalItems || cart.items.reduce((sum, item) => sum + item.quantity, 0);

          console.log('📦 Processing cart items:', cart.items);

          // Count specific products with detailed categorization
          cart.items.forEach(item => {
            const productName = (item.productName || item.name || '').toLowerCase();
            const kashrutText = (item.kashrutText || item.kashrut || '').toLowerCase();
            const quantity = item.quantity || 0;

            console.log('🔍 Processing item:', { productName, kashrutText, quantity });

            // סטים
            if (productName.includes('סט תימני')) productCounts.setTimani += quantity;
            else if (productName.includes('סט מרוקאי')) productCounts.setMoroccan += quantity;
            else if (productName.includes('סט אשכנזי')) productCounts.setAshkenazi += quantity;

            // אתרוגים תימניים
            else if (productName.includes('אתרוג תימני')) {
              if (kashrutText.includes('מהודר א')) productCounts.etrogTimaniMehudarA += quantity;
              else if (kashrutText.includes('מהודר')) productCounts.etrogTimaniMehudar += quantity;
              else if (kashrutText.includes('כשר')) productCounts.etrogTimaniKasher += quantity;
            }

            // אתרוגים מרוקאים
            else if (productName.includes('אתרוג מרוקאי')) {
              if (kashrutText.includes('מהודר א')) productCounts.etrogMoroccanMehudarA += quantity;
              else if (kashrutText.includes('מהודר')) productCounts.etrogMoroccanMehudar += quantity;
              else if (kashrutText.includes('כשר')) productCounts.etrogMoroccanKasher += quantity;
            }

            // אתרוגים אשכנזיים
            else if (productName.includes('אתרוג אשכנזי')) {
              if (kashrutText.includes('מהודר א')) productCounts.etrogAshkenaziMehudarA += quantity;
              else if (kashrutText.includes('מהודר')) productCounts.etrogAshkenaziMehudar += quantity;
              else if (kashrutText.includes('כשר')) productCounts.etrogAshkenaziKasher += quantity;
            }

            // פריטים בודדים
            else if (productName.includes('לולב')) productCounts.lulav += quantity;
            else if (productName.includes('הדס')) productCounts.hadas += quantity;
            else if (productName.includes('ערבה')) productCounts.arava += quantity;
          });
        }
      } catch (e) {
        console.error('Error parsing cart items:', e);
        cartSummary = data.detailedOrderSummary || 'שגיאה בפענוח פרטי ההזמנה';
      }
    }

    const rowData = [
      // פרטי לקוח
      new Date().toLocaleString('he-IL'),                    // תאריך ושעה
      data.orderNumber || generateOrderNumber(),             // מספר הזמנה
      data.fullName || '',                                   // שם מלא
      data.phone || '',                                      // טלפון
      data.email || '',                                      // אימייל
      data.city || '',                                       // עיר מגורים
      data.address || '',                                    // כתובת מגורים
      data.needsShipping === 'on' ? 'כן' : 'לא',           // משלוח נדרש

      // סיכום הזמנה
      `₪${totalPrice}`,                                     // מחיר כולל
      totalItems,                                           // כמות פריטים
      cartSummary || data.detailedOrderSummary || '',       // פירוט מלא הזמנה

      // סטים
      productCounts.setTimani || 0,                         // סט תימני - כמות
      productCounts.setMoroccan || 0,                       // סט מרוקאי - כמות
      productCounts.setAshkenazi || 0,                      // סט אשכנזי - כמות

      // אתרוגים תימניים
      productCounts.etrogTimaniKasher || 0,                 // אתרוג תימני כשר - כמות
      productCounts.etrogTimaniMehudar || 0,                // אתרוג תימני מהודר - כמות
      productCounts.etrogTimaniMehudarA || 0,               // אתרוג תימני מהודר א - כמות

      // אתרוגים מרוקאים
      productCounts.etrogMoroccanKasher || 0,               // אתרוג מרוקאי כשר - כמות
      productCounts.etrogMoroccanMehudar || 0,              // אתרוג מרוקאי מהודר - כמות
      productCounts.etrogMoroccanMehudarA || 0,             // אתרוג מרוקאי מהודר א - כמות

      // אתרוגים אשכנזיים
      productCounts.etrogAshkenaziKasher || 0,              // אתרוג אשכנזי כשר - כמות
      productCounts.etrogAshkenaziMehudar || 0,             // אתרוג אשכנזי מהודר - כמות
      productCounts.etrogAshkenaziMehudarA || 0,            // אתרוג אשכנזי מהודר א - כמות

      // פריטים בודדים
      productCounts.lulav || 0,                             // לולב - כמות
      productCounts.hadas || 0,                             // הדס - כמות
      productCounts.arava || 0,                             // ערבה - כמות

      // הערות ואישורים
      data.notes || '',                                     // הערות לקוח
      data.terms === 'on' ? 'מאושר' : 'לא מאושר',         // תנאי שימוש
      data.contactApproval === 'on' ? 'מאושר' : 'לא מאושר', // אישור יצירת קשר
      'חדש'                                                 // סטטוס הזמנה
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

  // Basic required fields
  const basicRequiredFields = ['fullName', 'phone', 'city', 'terms', 'contactApproval'];

  for (const field of basicRequiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      console.error(`❌ Missing required field: ${field}`);
      return false;
    }
  }

  // Address is only required if shipping is needed
  if (data.needsShipping === 'on' && (!data.address || data.address.toString().trim() === '')) {
    console.error(`❌ Address is required when shipping is needed`);
    return false;
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
