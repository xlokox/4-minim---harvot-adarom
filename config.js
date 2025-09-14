/**
 * Site Configuration
 * Update these values for your specific setup
 */

const CONFIG = {
    // Google Apps Script Web App URL - UPDATED!
    GOOGLE_SHEETS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycby9FjEUROvE3StSvcMRTVI9pk9Q3vKhxq9WyMdt7fgYPOK57VOru_FLmGKPuty-X0h9/exec',

    // Site Information
    SITE_NAME: 'יהודה אבורוס - 4 המינים',
    CONTACT_EMAIL: 'danielknafel@gmail.com',
    CONTACT_PHONE: '050-123-4567',
    
    // Google Sheets Settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    REQUEST_TIMEOUT: 10000,
    
    // Environment
    ENVIRONMENT: 'production'
};

// Make config available globally
window.CONFIG = CONFIG;
