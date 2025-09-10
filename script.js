// DOM elements
const orderForm = document.getElementById('orderForm');
const quantitySelect = document.getElementById('quantity');
const customQuantityGroup = document.getElementById('customQuantityGroup');
const customQuantityInput = document.getElementById('customQuantity');
const successMessage = document.getElementById('successMessage');

// Form validation rules
const validationRules = {
    fullName: {
        required: true,
        minLength: 2,
        pattern: /^[\u0590-\u05FF\s\u0041-\u005A\u0061-\u007A]+$/,
        message: 'נא להזין שם מלא בעברית או באנגלית (לפחות 2 תווים)'
    },
    phone: {
        required: true,
        pattern: /^0\d{1,2}-?\d{7}$|^0\d{9}$/,
        message: 'נא להזין מספר טלפון תקין (לדוגמה: 050-123-4567)'
    },
    email: {
        required: false,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'נא להזין כתובת אימייל תקינה'
    },
    address: {
        required: true,
        minLength: 10,
        message: 'נא להזין כתובת מלאה (לפחות 10 תווים)'
    },
    package: {
        required: true,
        message: 'נא לבחור חבילה'
    },
    quantity: {
        required: true,
        message: 'נא לבחור כמות'
    },
    customQuantity: {
        required: false,
        min: 1,
        max: 50,
        message: 'נא להזין כמות בין 1 ל-50'
    },
    terms: {
        required: true,
        message: 'נא לאשר את תנאי השימוש'
    }
};

// Initialize form functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setupAccessibility();
});

function initializeForm() {
    // Set focus on first input for better accessibility
    const firstInput = orderForm.querySelector('input[type="text"]');
    if (firstInput) {
        firstInput.focus();
    }
    
    // Initialize custom quantity visibility
    toggleCustomQuantity();
}

function setupEventListeners() {
    // Form submission
    orderForm.addEventListener('submit', handleFormSubmit);
    
    // Quantity selection change
    quantitySelect.addEventListener('change', toggleCustomQuantity);
    
    // Real-time validation
    const inputs = orderForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearError(input));
    });
    
    // Package selection validation
    const packageRadios = orderForm.querySelectorAll('input[name="package"]');
    packageRadios.forEach(radio => {
        radio.addEventListener('change', () => validateField(radio));
    });
}

function setupAccessibility() {
    // Add keyboard navigation for radio buttons
    const radioGroups = orderForm.querySelectorAll('input[type="radio"]');
    radioGroups.forEach(radio => {
        radio.addEventListener('keydown', handleRadioKeydown);
    });
    
    // Announce form errors to screen readers
    const errorMessages = orderForm.querySelectorAll('.error-message');
    errorMessages.forEach(error => {
        error.setAttribute('aria-live', 'polite');
    });
}

function handleRadioKeydown(event) {
    const radios = Array.from(orderForm.querySelectorAll(`input[name="${event.target.name}"]`));
    const currentIndex = radios.indexOf(event.target);
    
    switch(event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
            event.preventDefault();
            const nextIndex = (currentIndex + 1) % radios.length;
            radios[nextIndex].focus();
            radios[nextIndex].checked = true;
            break;
        case 'ArrowUp':
        case 'ArrowLeft':
            event.preventDefault();
            const prevIndex = (currentIndex - 1 + radios.length) % radios.length;
            radios[prevIndex].focus();
            radios[prevIndex].checked = true;
            break;
    }
}

function toggleCustomQuantity() {
    const isOther = quantitySelect.value === 'other';
    customQuantityGroup.style.display = isOther ? 'block' : 'none';
    
    if (isOther) {
        customQuantityInput.required = true;
        customQuantityInput.focus();
    } else {
        customQuantityInput.required = false;
        customQuantityInput.value = '';
        clearError(customQuantityInput);
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate entire form
    const isValid = validateForm();
    
    if (isValid) {
        submitForm();
    } else {
        // Focus on first error field
        const firstError = orderForm.querySelector('.error-message:not(:empty)');
        if (firstError) {
            const fieldId = firstError.id.replace('-error', '');
            const field = document.getElementById(fieldId);
            if (field) {
                field.focus();
            }
        }
    }
}

function validateForm() {
    let isValid = true;
    
    // Validate all fields
    const fields = ['fullName', 'phone', 'email', 'address', 'quantity', 'terms'];
    
    fields.forEach(fieldName => {
        const field = document.getElementById(fieldName) || 
                     orderForm.querySelector(`input[name="${fieldName}"]`);
        if (field && !validateField(field)) {
            isValid = false;
        }
    });
    
    // Validate package selection
    const packageField = orderForm.querySelector('input[name="package"]:checked');
    if (!validateField(packageField || orderForm.querySelector('input[name="package"]'))) {
        isValid = false;
    }
    
    // Validate custom quantity if needed
    if (quantitySelect.value === 'other') {
        if (!validateField(customQuantityInput)) {
            isValid = false;
        }
    }
    
    return isValid;
}

function validateField(field) {
    if (!field) return true;
    
    const fieldName = field.name || field.id;
    const rule = validationRules[fieldName];
    
    if (!rule) return true;
    
    const value = field.type === 'checkbox' ? field.checked : 
                  field.type === 'radio' ? orderForm.querySelector(`input[name="${fieldName}"]:checked`)?.value :
                  field.value.trim();
    
    let isValid = true;
    let errorMessage = '';
    
    // Required validation
    if (rule.required) {
        if (field.type === 'checkbox' && !field.checked) {
            isValid = false;
            errorMessage = rule.message;
        } else if (field.type === 'radio' && !value) {
            isValid = false;
            errorMessage = rule.message;
        } else if (!value) {
            isValid = false;
            errorMessage = rule.message;
        }
    }
    
    // Pattern validation
    if (isValid && value && rule.pattern && !rule.pattern.test(value)) {
        isValid = false;
        errorMessage = rule.message;
    }
    
    // Length validation
    if (isValid && value && rule.minLength && value.length < rule.minLength) {
        isValid = false;
        errorMessage = rule.message;
    }
    
    // Number validation
    if (isValid && value && (rule.min !== undefined || rule.max !== undefined)) {
        const numValue = parseInt(value);
        if (isNaN(numValue) || 
            (rule.min !== undefined && numValue < rule.min) ||
            (rule.max !== undefined && numValue > rule.max)) {
            isValid = false;
            errorMessage = rule.message;
        }
    }
    
    // Display error
    const errorElement = document.getElementById(`${fieldName}-error`) ||
                        document.getElementById(`${field.id}-error`);
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : errorMessage;
        errorElement.setAttribute('aria-live', isValid ? 'off' : 'polite');
    }
    
    // Update field styling
    if (field.type !== 'radio') {
        field.classList.toggle('error', !isValid);
        field.setAttribute('aria-invalid', !isValid);
    }
    
    return isValid;
}

function clearError(field) {
    const fieldName = field.name || field.id;
    const errorElement = document.getElementById(`${fieldName}-error`) ||
                        document.getElementById(`${field.id}-error`);
    
    if (errorElement && errorElement.textContent) {
        errorElement.textContent = '';
        errorElement.setAttribute('aria-live', 'off');
        field.classList.remove('error');
        field.setAttribute('aria-invalid', 'false');
    }
}

async function submitForm() {
    // Collect form data
    const formData = new FormData(orderForm);
    const data = {};

    // Convert FormData to object - ensure all form fields are captured
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Ensure all required fields are present
    const requiredFields = ['fullName', 'phone', 'address', 'package', 'quantity', 'terms'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
        console.warn('Missing required fields:', missingFields);
    }

    // Handle custom quantity if selected
    if (quantitySelect.value === 'other') {
        data.quantity = customQuantityInput.value;
    }

    // Add additional data
    data.timestamp = new Date().toLocaleString('he-IL');
    data.totalPrice = calculateTotalPrice(data);

    // Debug: Log all collected data with detailed info
    console.log('=== FORM DATA DEBUG ===');
    console.log('Collected form data:', data);
    console.log('All form fields:', Object.keys(data));
    console.log('Form field details:');
    Object.entries(data).forEach(([key, value]) => {
        console.log(`  ${key}: "${value}" (type: ${typeof value})`);
    });
    console.log('=== END DEBUG ===');

    // Show loading state
    const submitBtn = orderForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'שולח...';
    submitBtn.disabled = true;

    try {
        // Send data to Google Sheets first
        let sheetsResult = { success: false, message: 'Google Sheets integration not available' };

        if (window.GoogleSheetsIntegration) {
            console.log('🚀 Sending to Google Sheets...');
            sheetsResult = await window.GoogleSheetsIntegration.sendToGoogleSheets(data);
            console.log('📊 Google Sheets result:', sheetsResult);
        } else {
            console.warn('⚠️ Google Sheets integration not loaded');
        }

        // Show success message
        orderForm.style.display = 'none';
        successMessage.style.display = 'block';

        // Update success message based on sheets result
        const successTitle = successMessage.querySelector('h3');
        const successText = successMessage.querySelector('p');

        if (sheetsResult.success) {
            console.log('✅ SUCCESS: Order sent to Google Sheets!');
            successTitle.textContent = '🎉 תודה על ההזמנה!';
            successText.textContent = 'ההזמנה נשלחה בהצלחה! קיבלנו את פרטיכם ונחזור אליכם בהקדם לאישור ההזמנה.';
        } else {
            console.log('⚠️ WARNING: Failed to send to Google Sheets:', sheetsResult.message);
            successTitle.textContent = 'ההזמנה התקבלה!';
            successText.textContent = 'פרטיכם נשמרו מקומית. אנא צרו קשר טלפוני לאישור ההזמנה.';
            console.warn('Failed to send to Google Sheets:', sheetsResult.message);
        }

        successMessage.focus();
        successMessage.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error submitting form:', error);

        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // Show error message
        alert('אירעה שגיאה בשליחת ההזמנה. אנא נסו שוב או צרו קשר טלפוני.');
    }
}

function calculateTotalPrice(data) {
    const prices = {
        basic: 120,
        perfect: 180,
        premium: 250
    };
    
    const basePrice = prices[data.package] || 0;
    const quantity = parseInt(data.quantity) || 1;
    
    return basePrice * quantity;
}

// Function to send data to Google Sheets (to be implemented)
function sendToGoogleSheets(data) {
    // This function will be implemented when setting up the Google Sheets integration
    // For now, it's a placeholder
    console.log('Sending to Google Sheets:', data);
}

// Utility function for smooth scrolling (fallback for older browsers)
function smoothScrollTo(element) {
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Error handling for the entire script
window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);
    // You might want to send this error to your analytics or error tracking service
});

// Ensure form works even if JavaScript fails partially
window.addEventListener('beforeunload', function() {
    // Save form data to localStorage as backup
    const formData = new FormData(orderForm);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    localStorage.setItem('orderFormBackup', JSON.stringify(data));
});
