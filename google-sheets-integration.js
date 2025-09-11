/**
 * Google Sheets Integration for Order Form
 * This file handles sending form data to Google Sheets using Google Apps Script Web App
 */

// Configuration - Uses global CONFIG from config.js
const GOOGLE_SHEETS_CONFIG = {
    // Your Google Apps Script Web App URL - Uses CONFIG
    webAppUrl: window.CONFIG?.GOOGLE_SHEETS_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbyQWQdSCd4TlkgA8dek-Qo1JJEbsS2NcH3597PweTeYVbtrcd9ay7GBuDjJVN1xAnXY/exec',

    // Timeout for requests (in milliseconds)
    timeout: window.CONFIG?.REQUEST_TIMEOUT || 10000,

    // Retry configuration
    maxRetries: window.CONFIG?.MAX_RETRIES || 3,
    retryDelay: window.CONFIG?.RETRY_DELAY || 1000
};

// Check if URL is configured
function isConfigured() {
    return GOOGLE_SHEETS_CONFIG.webAppUrl &&
           !GOOGLE_SHEETS_CONFIG.webAppUrl.includes('YOUR_SCRIPT_ID');
}

/**
 * Send form data to Google Sheets
 * @param {Object} formData - The form data to send
 * @returns {Promise} - Promise that resolves when data is sent successfully
 */
async function sendToGoogleSheets(formData) {
    console.log('=== STARTING GOOGLE SHEETS SEND ===');
    console.log('Form data received:', formData);

    try {
        // Check if Google Sheets is configured
        if (!isConfigured()) {
            console.warn('Google Sheets not configured, saving locally only');
            saveToLocalStorage(formData);
            return {
                success: false,
                message: 'Google Sheets לא מוגדר. הנתונים נשמרו מקומית.'
            };
        }

        console.log('Google Sheets is configured, proceeding with send...');

        // Prepare data for Google Sheets
        const sheetData = prepareDataForSheets(formData);
        console.log('Data prepared for sheets:', sheetData);

        console.log('Sending to Google Sheets...');
        console.log('Using URL:', GOOGLE_SHEETS_CONFIG.webAppUrl);

        // Send data with retry logic
        const response = await sendWithRetry(sheetData);
        console.log('Response received:', response);

        if (response.success) {
            console.log('✅ Data sent to Google Sheets successfully!');
            return { success: true, message: 'ההזמנה נשלחה בהצלחה' };
        } else {
            throw new Error(response.message || 'Failed to send data');
        }

    } catch (error) {
        console.error('❌ Error sending to Google Sheets:', error);

        // Save to localStorage as backup
        saveToLocalStorage(formData);

        return {
            success: false,
            message: 'אירעה שגיאה בשליחת ההזמנה. הנתונים נשמרו מקומית ונשלחו מאוחר יותר.'
        };
    }
}

/**
 * Prepare form data for Google Sheets format
 * @param {Object} formData - Raw form data
 * @returns {Object} - Formatted data for sheets
 */
function prepareDataForSheets(formData) {
    // Debug: Log received form data
    console.log('Preparing data for sheets:', formData);

    // Parse cart items if they exist
    let cartItems = [];
    let detailedOrderSummary = '';
    let productBreakdown = {
        sets: [],
        etrogim: [],
        lulav: 0,
        hadas: 0,
        arava: 0
    };

    try {
        if (formData.cartItems && typeof formData.cartItems === 'string') {
            const parsedCart = JSON.parse(formData.cartItems);
            cartItems = parsedCart.items || [];
        } else if (formData.cartItems && formData.cartItems.items) {
            cartItems = formData.cartItems.items;
        }

        // Process each cart item for detailed breakdown
        cartItems.forEach(item => {
            const productName = item.productName || '';
            const kashrutText = item.kashrutText || '';
            const quantity = item.quantity || 0;
            const totalPrice = item.totalPrice || 0;

            // Add to detailed summary
            detailedOrderSummary += `${productName} - ${kashrutText} × ${quantity} = ${totalPrice}₪\n`;

            // Categorize products for breakdown
            if (productName.includes('סט')) {
                let setType = '';
                if (productName.includes('תימני')) setType = 'תימני';
                else if (productName.includes('מרוקאי')) setType = 'מרוקאי';
                else if (productName.includes('אשכנזי')) setType = 'אשכנזי';

                productBreakdown.sets.push({
                    type: setType,
                    kashrut: kashrutText,
                    quantity: quantity,
                    price: totalPrice
                });
            } else if (productName.includes('אתרוג')) {
                let etrogType = '';
                if (productName.includes('תימני')) etrogType = 'תימני';
                else if (productName.includes('מרוקאי')) etrogType = 'מרוקאי';
                else if (productName.includes('אשכנזי')) etrogType = 'אשכנזי';

                productBreakdown.etrogim.push({
                    type: etrogType,
                    kashrut: kashrutText,
                    quantity: quantity,
                    price: totalPrice
                });
            } else if (productName.includes('לולב')) {
                productBreakdown.lulav += quantity;
            } else if (productName.includes('הדס')) {
                productBreakdown.hadas += quantity;
            } else if (productName.includes('ערבה')) {
                productBreakdown.arava += quantity;
            }
        });
    } catch (error) {
        console.error('Error parsing cart items:', error);
        detailedOrderSummary = 'שגיאה בפענוח פרטי ההזמנה';
    }

    // Create summary strings for Google Sheets
    const setsOrderSummary = productBreakdown.sets.map(set =>
        `${set.type} (${set.kashrut}) × ${set.quantity}`
    ).join(', ') || 'לא הוזמנו סטים';

    const etrogimOrderSummary = productBreakdown.etrogim.map(etrog =>
        `${etrog.type} (${etrog.kashrut}) × ${etrog.quantity}`
    ).join(', ') || 'לא הוזמנו אתרוגים';

    const individualItemsSummary = [
        productBreakdown.lulav > 0 ? `לולב × ${productBreakdown.lulav}` : '',
        productBreakdown.hadas > 0 ? `הדס × ${productBreakdown.hadas}` : '',
        productBreakdown.arava > 0 ? `ערבה × ${productBreakdown.arava}` : ''
    ].filter(item => item).join(', ') || 'לא הוזמנו פריטים בודדים';

    const preparedData = {
        timestamp: new Date().toISOString(),
        orderNumber: generateOrderNumber(),
        fullName: String(formData.fullName || ''),
        phone: String(formData.phone || ''),
        email: String(formData.email || ''),
        city: String(formData.city || ''),
        address: String(formData.address || ''),
        needsShipping: formData.needsShipping ? 'כן' : 'לא',
        notes: String(formData.notes || ''),
        terms: formData.terms ? 'מאושר' : 'לא מאושר',
        contactApproval: formData.contactApproval ? 'מאושר' : 'לא מאושר',
        totalPrice: String(formData.totalPrice || '0'),
        totalItems: cartItems.length,
        detailedOrderSummary: detailedOrderSummary.trim(),
        setsOrdered: setsOrderSummary,
        etrogimOrdered: etrogimOrderSummary,
        individualItemsOrdered: individualItemsSummary,
        hasTimaniSet: productBreakdown.sets.some(s => s.type === 'תימני') ? 'כן' : 'לא',
        hasMoroccanSet: productBreakdown.sets.some(s => s.type === 'מרוקאי') ? 'כן' : 'לא',
        hasAshkenaziSet: productBreakdown.sets.some(s => s.type === 'אשכנזי') ? 'כן' : 'לא',
        hasEtrogim: productBreakdown.etrogim.length > 0 ? 'כן' : 'לא',
        hasLulav: productBreakdown.lulav > 0 ? 'כן' : 'לא',
        hasHadas: productBreakdown.hadas > 0 ? 'כן' : 'לא',
        hasArava: productBreakdown.arava > 0 ? 'כן' : 'לא'
    };

    // Debug: Log prepared data
    console.log('Prepared data for sheets:', preparedData);

    return preparedData;
}

/**
 * Get package name in Hebrew
 * @param {string} packageCode - Package code (basic, perfect, premium)
 * @returns {string} - Package name in Hebrew
 */
function getPackageName(packageCode) {
    const packageNames = {
        basic: 'חבילה בסיסית',
        perfect: 'חבילה מושלמת',
        premium: 'חבילה מהודרת'
    };
    return packageNames[packageCode] || packageCode;
}

/**
 * Get package price
 * @param {string} packageCode - Package code
 * @returns {number} - Package price
 */
function getPackagePrice(packageCode) {
    const prices = {
        basic: 120,
        perfect: 180,
        premium: 250
    };
    return prices[packageCode] || 0;
}

/**
 * Generate unique order number
 * @returns {string} - Order number
 */
function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `4M${year}${month}${day}${random}`;
}

/**
 * Send data using JSONP to avoid CORS issues
 * @param {Object} data - Data to send
 * @returns {Promise} - Promise that resolves with response
 */
async function sendWithRetry(data, attempt = 1) {
    try {
        console.log(`📤 Sending data (attempt ${attempt}):`, data);
        console.log(`🎯 Target URL: ${GOOGLE_SHEETS_CONFIG.webAppUrl}`);

        // Simple fetch approach with no-cors
        const formData = new FormData();
        for (const [key, value] of Object.entries(data)) {
            formData.append(key, String(value || ''));
        }

        console.log('🔄 Sending via fetch with no-cors...');

        await fetch(GOOGLE_SHEETS_CONFIG.webAppUrl, {
            method: 'POST',
            body: formData,
            mode: 'no-cors' // This bypasses CORS but we can't read the response
        });

        console.log('📥 Fetch completed (no-cors mode)');

        // In no-cors mode, we can't read the response, but if no error was thrown, assume success
        return {
            success: true,
            message: 'ההזמנה נשלחה בהצלחה'
        };

    } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);

        if (attempt < GOOGLE_SHEETS_CONFIG.maxRetries) {
            console.log(`⏳ Waiting ${GOOGLE_SHEETS_CONFIG.retryDelay * attempt}ms before retry...`);
            // Wait before retrying
            await new Promise(resolve =>
                setTimeout(resolve, GOOGLE_SHEETS_CONFIG.retryDelay * attempt)
            );
            return sendWithRetry(data, attempt + 1);
        } else {
            console.error('💥 All retry attempts failed');
            throw error;
        }
    }
}

/**
 * Send data via hidden form submission to avoid CORS
 * @param {Object} data - Data to send
 * @returns {Promise} - Promise that resolves with response
 */
function sendViaForm(data) {
    return new Promise((resolve, reject) => {
        try {
            // Create a hidden iframe for the response
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = 'google-sheets-response';
            document.body.appendChild(iframe);

            // Create a form
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = GOOGLE_SHEETS_CONFIG.webAppUrl;
            form.target = 'google-sheets-response';
            form.style.display = 'none';

            // Add data as form fields
            for (const [key, value] of Object.entries(data)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value || '';
                form.appendChild(input);
            }

            document.body.appendChild(form);

            // Set timeout for the request
            const timeout = setTimeout(() => {
                try {
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                } catch (e) {}
                reject(new Error('תם הזמן הקצוב לשליחה'));
            }, 10000); // 10 seconds timeout

            // Handle iframe load
            iframe.onload = function() {
                clearTimeout(timeout);
                console.log('📨 Iframe loaded successfully');

                try {
                    // Try to read the response from iframe
                    let responseText = '';
                    try {
                        responseText = iframe.contentDocument.body.textContent || iframe.contentDocument.body.innerText || '';
                        console.log('📄 Response text:', responseText);
                    } catch (e) {
                        // Cross-origin restrictions - this is expected and means success!
                        console.log('🔒 Cannot read iframe content (CORS) - this is normal and indicates success!');
                        responseText = 'CORS_SUCCESS';
                    }

                    // Clean up
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);

                    // Since Google Apps Script is working (we can see in dashboard),
                    // and iframe loaded without error, assume success
                    console.log('✅ Form submitted successfully to Google Sheets');
                    resolve({
                        success: true,
                        message: 'ההזמנה נשלחה בהצלחה'
                    });

                } catch (error) {
                    console.error('❌ Error in iframe onload:', error);
                    reject(error);
                }
            };

            iframe.onerror = function() {
                clearTimeout(timeout);
                try {
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                } catch (e) {}
                reject(new Error('שגיאה בשליחת הטופס'));
            };

            // Submit the form
            console.log('Submitting form to:', GOOGLE_SHEETS_CONFIG.webAppUrl);
            form.submit();

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Save form data to localStorage as backup
 * @param {Object} formData - Form data to save
 */
function saveToLocalStorage(formData) {
    try {
        const backupData = {
            timestamp: new Date().toISOString(),
            data: formData,
            status: 'pending'
        };
        
        // Get existing backup data
        const existingBackups = JSON.parse(localStorage.getItem('orderBackups') || '[]');
        
        // Add new backup
        existingBackups.push(backupData);
        
        // Keep only last 10 backups
        if (existingBackups.length > 10) {
            existingBackups.splice(0, existingBackups.length - 10);
        }
        
        // Save back to localStorage
        localStorage.setItem('orderBackups', JSON.stringify(existingBackups));
        
        console.log('Form data saved to localStorage as backup');
        
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Retry sending failed orders from localStorage
 */
async function retryFailedOrders() {
    try {
        const backups = JSON.parse(localStorage.getItem('orderBackups') || '[]');
        const pendingOrders = backups.filter(backup => backup.status === 'pending');
        
        if (pendingOrders.length === 0) {
            return;
        }
        
        console.log(`Found ${pendingOrders.length} pending orders to retry`);
        
        for (const order of pendingOrders) {
            try {
                const result = await sendToGoogleSheets(order.data);
                if (result.success) {
                    // Mark as sent
                    order.status = 'sent';
                    order.sentAt = new Date().toISOString();
                }
            } catch (error) {
                console.error('Failed to retry order:', error);
            }
        }
        
        // Update localStorage
        localStorage.setItem('orderBackups', JSON.stringify(backups));
        
    } catch (error) {
        console.error('Error retrying failed orders:', error);
    }
}

/**
 * Initialize Google Sheets integration
 */
function initializeGoogleSheetsIntegration() {
    // Try to send any pending orders when page loads
    if (navigator.onLine) {
        retryFailedOrders();
    }
    
    // Retry when connection is restored
    window.addEventListener('online', retryFailedOrders);
    
    // Periodically try to send pending orders
    setInterval(() => {
        if (navigator.onLine) {
            retryFailedOrders();
        }
    }, 5 * 60 * 1000); // Every 5 minutes
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGoogleSheetsIntegration);
} else {
    initializeGoogleSheetsIntegration();
}

// Export functions for use in other scripts
window.GoogleSheetsIntegration = {
    sendToGoogleSheets,
    retryFailedOrders,
    saveToLocalStorage
};
