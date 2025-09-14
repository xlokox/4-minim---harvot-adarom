// DOM elements
const orderForm = document.getElementById('orderForm');
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
        message: 'נא להזין מספר טלפון תקין (לדוגמה: 052-505-5318)'
    },
    email: {
        required: false,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'נא להזין כתובת אימייל תקינה'
    },
    city: {
        required: true,
        minLength: 2,
        message: 'נא להזין שם עיר (לפחות 2 תווים)'
    },
    address: {
        required: false, // Will be set to true dynamically if shipping is needed
        minLength: 5,
        message: 'נא להזין כתובת מלאה (לפחות 5 תווים)'
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
    },
    contactApproval: {
        required: true,
        message: 'נא לאשר יצירת קשר לאישור ההזמנה'
    }
};

// Initialize form functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setupAccessibility();
    setupShippingCheckbox();
});

function initializeForm() {
    // Initialize form-related functionality
    // Removed auto-focus to prevent automatic scrolling to form

    // Cart system is now initialized
}

function setupEventListeners() {
    // Form submission
    orderForm.addEventListener('submit', handleFormSubmit);
    
    // No longer need quantity selection since we use shopping cart
    
    // Real-time validation
    const inputs = orderForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearError(input));
    });
    
    // No longer need package validation since we use shopping cart
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

function setupShippingCheckbox() {
    const shippingCheckbox = document.getElementById('needsShipping');
    const addressField = document.getElementById('address');
    const addressLabel = document.querySelector('label[for="address"]');

    if (shippingCheckbox && addressField && addressLabel) {
        shippingCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Enable address field and make it required
                addressField.disabled = false;
                addressField.required = true;
                validationRules.address.required = true; // Update validation rules
                addressLabel.innerHTML = 'כתובת מגורים <span class="required-asterisk">*</span>';
                addressLabel.classList.add('required');
            } else {
                // Disable address field and make it optional
                addressField.disabled = true;
                addressField.required = false;
                validationRules.address.required = false; // Update validation rules
                addressField.value = ''; // Clear the field
                addressLabel.innerHTML = 'כתובת מגורים';
                addressLabel.classList.remove('required');
                // Clear any error message
                const errorElement = document.getElementById('address-error');
                if (errorElement) {
                    errorElement.textContent = '';
                }
            }
        });
    }
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

// Function removed - no longer needed with shopping cart system

function handleFormSubmit(event) {
    event.preventDefault();
    console.log('🚀 Form submit started');

    // Validate entire form
    const isValid = validateForm();
    console.log('📋 Form validation result:', isValid);

    if (isValid) {
        console.log('✅ Form is valid, proceeding to submit');
        submitForm();
    } else {
        console.log('❌ Form validation failed');
        // Focus on first error field
        const firstError = orderForm.querySelector('.error-message:not(:empty)');
        if (firstError) {
            console.log('🎯 Focusing on first error:', firstError.textContent);
            const fieldId = firstError.id.replace('-error', '');
            const field = document.getElementById(fieldId);
            if (field) {
                field.focus();
            }
        }
    }
}

function validateForm() {
    console.log('🔍 Starting form validation');
    let isValid = true;

    // Validate basic required fields
    const basicFields = ['fullName', 'phone', 'email', 'city', 'terms', 'contactApproval'];
    console.log('📝 Validating basic fields:', basicFields);

    basicFields.forEach(fieldName => {
        const field = document.getElementById(fieldName) ||
                     orderForm.querySelector(`input[name="${fieldName}"]`);
        if (field) {
            const fieldValid = validateField(field);
            console.log(`  ${fieldName}: ${fieldValid ? '✅' : '❌'}`);
            if (!fieldValid) {
                isValid = false;
            }
        } else {
            console.log(`  ${fieldName}: ❌ Field not found`);
            isValid = false;
        }
    });

    // Validate address only if shipping is needed
    const shippingCheckbox = document.getElementById('needsShipping');
    console.log('📦 Shipping checkbox checked:', shippingCheckbox?.checked);
    if (shippingCheckbox && shippingCheckbox.checked) {
        const addressField = document.getElementById('address');
        if (addressField) {
            const addressValid = validateField(addressField);
            console.log(`  address (shipping required): ${addressValid ? '✅' : '❌'}`);
            if (!addressValid) {
                isValid = false;
            }
        }
    } else {
        console.log('  address: ⏭️ Skipped (shipping not needed)');
    }
    
    // Validate package selection
    const packageField = orderForm.querySelector('input[name="package"]:checked');
    if (!validateField(packageField || orderForm.querySelector('input[name="package"]'))) {
        isValid = false;
    }
    
    // No longer need quantity validation since we use shopping cart
    
    return isValid;
}

function validateField(field) {
    if (!field) return true;

    const fieldName = field.name || field.id;
    const rule = validationRules[fieldName];

    if (!rule) return true;

    // Special handling for address field - only required if shipping is selected
    if (fieldName === 'address') {
        const shippingCheckbox = document.getElementById('needsShipping');
        if (!shippingCheckbox || !shippingCheckbox.checked) {
            // Clear any error for address field when shipping is not needed
            const errorElement = document.getElementById('address-error');
            if (errorElement) {
                errorElement.textContent = '';
            }
            return true; // Address is not required if shipping is not selected
        }
    }
    
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
    // Check if cart is empty
    if (cart.length === 0) {
        alert('אנא הוסף מוצרים לשקלול לפני שליחת ההזמנה');
        return;
    }

    // Collect form data
    const formData = new FormData(orderForm);
    let data = {};

    // Convert FormData to object - ensure all form fields are captured
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Parse cart data
    if (data.cartData) {
        try {
            data.cartItems = JSON.parse(data.cartData);
        } catch (e) {
            console.error('Error parsing cart data:', e);
            data.cartItems = { items: [], totalItems: 0, totalPrice: 0 };
        }
    }

    // Remove the raw cartData field as we now have cartItems
    delete data.cartData;

    // Ensure all required fields are present (updated for new form structure)
    const basicRequiredFields = ['fullName', 'phone', 'city', 'terms', 'contactApproval'];
    let missingFields = basicRequiredFields.filter(field => !data[field]);

    // Add address to required fields only if shipping is needed
    const shippingCheckbox = document.getElementById('needsShipping');
    if (shippingCheckbox && shippingCheckbox.checked && !data.address) {
        missingFields.push('address');
    }

    if (missingFields.length > 0) {
        console.warn('Missing required fields:', missingFields);
        // Show validation errors for missing fields
        missingFields.forEach(field => {
            const errorElement = document.getElementById(`${field}-error`);
            if (errorElement) {
                errorElement.textContent = 'שדה חובה';
                errorElement.style.display = 'block';
            }
        });
        return; // Don't submit if required fields are missing
    }

    // Add additional data
    data.timestamp = new Date().toLocaleString('he-IL');
    data.totalPrice = data.cartItems ? data.cartItems.totalPrice : 0;

    // Add detailed product breakdown for Google Sheets
    data = addDetailedProductBreakdown(data);

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
            console.log('📤 Data being sent:', JSON.stringify(data, null, 2));
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
    // If we have cart items, use their total
    if (data.cartItems && data.cartItems.totalPrice) {
        return data.cartItems.totalPrice;
    }

    // Fallback for old package-based pricing (if still needed)
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

// Product pricing data for individual items
const productPricing = {
    // Sets
    'set-moroccan': {
        kosher: 125,
        mehadrin: 165,
        mehadrin_plus: 195
    },
    'set-ashkenazi': {
        kosher: 100,
        mehadrin: 120,
        mehadrin_plus: 135
    },
    'set-yemenite': {
        kosher: 115,
        mehadrin: 155,
        mehadrin_plus: 185
    },
    // Individual items
    'etrog-yemenite': {
        kosher: 30,
        mehadrin: 55,
        mehadrin_plus: 80
    },
    'etrog-ashkenazi': {
        kosher: 16,
        mehadrin: 21,
        mehadrin_plus: 26
    },
    'etrog-moroccan': {
        kosher: 40,
        mehadrin: 65,
        mehadrin_plus: 90
    },
    lulav: {
        kosher: 34,
        mehadrin: 60
    },
    hadass: {
        kosher: 15,
        mehadrin: 25
    },
    arava: {
        kosher: 12,
        mehadrin: 20
    }
};

// Update price based on kashrut selection
function updatePrice(kashrutSelect) {
    const product = kashrutSelect.dataset.product;
    const priceDisplay = document.getElementById(`${product}-price`);
    const quantitySelect = document.querySelector(`.quantity-select[data-product="${product}"]`);

    const kashrut = kashrutSelect.value;
    const quantity = quantitySelect ? quantitySelect.value : 1;

    if (kashrut && productPricing[product]) {
        const unitPrice = productPricing[product][kashrut];
        const totalPrice = quantity ? unitPrice * parseInt(quantity) : unitPrice;

        if (quantity && quantity !== "") {
            priceDisplay.innerHTML = `
                <div class="price-breakdown">
                    <div class="unit-price">${unitPrice}₪ ליחידה</div>
                    <div class="final-price">${totalPrice}₪ סה"כ</div>
                </div>
            `;
        } else {
            priceDisplay.innerHTML = `<div class="final-price">${unitPrice}₪</div>`;
        }
    } else {
        priceDisplay.innerHTML = '';
    }
}

// Update price when quantity changes
function updateQuantity(quantitySelect) {
    const product = quantitySelect.dataset.product;
    const kashrutSelect = document.querySelector(`.kashrut-select[data-product="${product}"]`);

    if (kashrutSelect.value) {
        updatePrice(kashrutSelect);
    }
}

// Shopping cart functionality
let cart = [];

// Add event listeners for dropdowns and cart functionality
document.addEventListener('DOMContentLoaded', function() {
    try {
        setupProductEventListeners();
        updateCartDisplay();
        updateOrderSummary();
    } catch (error) {
        console.error('Error initializing cart functionality:', error);
    }
});

function setupProductEventListeners() {
    // Add event listeners for all kashrut and quantity selects
    const kashrutSelects = document.querySelectorAll('.kashrut-select');
    const quantitySelects = document.querySelectorAll('.quantity-select');

    kashrutSelects.forEach(select => {
        select.addEventListener('change', function() {
            updateAddToCartButton(this.dataset.product);
        });
    });

    quantitySelects.forEach(select => {
        select.addEventListener('change', function() {
            updateAddToCartButton(this.dataset.product);
        });
    });
}

function updateAddToCartButton(productId) {
    const kashrutSelect = document.getElementById(`${productId}-kashrut`);
    const quantitySelect = document.getElementById(`${productId}-quantity`);
    const addButton = document.querySelector(`button[onclick*="${productId}"]`);

    if (!kashrutSelect || !quantitySelect || !addButton) {
        console.warn(`Elements not found for product: ${productId}`);
        return;
    }

    if (kashrutSelect.value && quantitySelect.value) {
        addButton.disabled = false;
    } else {
        addButton.disabled = true;
    }
}

function addToCart(productId, productName) {
    const kashrutSelect = document.getElementById(`${productId}-kashrut`);
    const quantitySelect = document.getElementById(`${productId}-quantity`);

    if (!kashrutSelect || !quantitySelect) {
        console.error(`Elements not found for product: ${productId}`);
        alert('שגיאה: לא ניתן למצוא את האלמנטים הנדרשים');
        return;
    }

    const kashrut = kashrutSelect.value;
    const quantity = parseInt(quantitySelect.value);

    if (!kashrut || !quantity) {
        alert('אנא בחר רמת כשרות וכמות');
        return;
    }

    // Get price from productPricing
    const unitPrice = productPricing[productId][kashrut];
    const totalPrice = unitPrice * quantity;

    // Get kashrut display name
    const kashrutText = kashrutSelect.options[kashrutSelect.selectedIndex].text.split(' - ')[0];

    // Create cart item
    const cartItem = {
        id: `${productId}-${kashrut}-${Date.now()}`,
        productId: productId,
        productName: productName,
        kashrut: kashrut,
        kashrutText: kashrutText,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice
    };

    // Add to cart
    cart.push(cartItem);

    // Reset form
    kashrutSelect.value = '';
    quantitySelect.value = '';
    updateAddToCartButton(productId);

    // Update display
    updateCartDisplay();

    // Show success message
    showAddToCartMessage(productName, quantity, kashrutText);
}

function showAddToCartMessage(productName, quantity, kashrut) {
    // Create temporary message
    const message = document.createElement('div');
    message.className = 'cart-success-message';
    message.textContent = `נוסף לשקלול: ${quantity} ${productName} ${kashrut}`;
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 3000);
}

// New add to cart functionality for inline quantity inputs
function addProductToCart(productId, productName) {
    try {
        let addedItems = [];

        // Get all quantity inputs for this product
        const quantityInputs = document.querySelectorAll(`input[data-product="${productId}"]`);

        quantityInputs.forEach(input => {
            const quantity = parseInt(input.value) || 0;
            if (quantity > 0) {
                const kashrut = input.dataset.kashrut;
                const unitPrice = parseInt(input.dataset.price);

                // Get kashrut display name
                const kashrutText = kashrut === 'kosher' ? 'כשר' :
                                   kashrut === 'mehadrin' ? 'מהודר' :
                                   kashrut === 'mehadrin_plus' ? 'מהודר א\'' : kashrut;

                const cartItem = {
                    id: `${productId}-${kashrut}-${Date.now()}`,
                    productId: productId,
                    productName: productName,
                    kashrut: kashrut,
                    kashrutText: kashrutText,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    totalPrice: unitPrice * quantity
                };

                // Add to cart
                cart.push(cartItem);
                addedItems.push(`${quantity} ${kashrutText}`);

                // Reset input
                input.value = 0;
            }
        });

        if (addedItems.length > 0) {
            updateCartDisplay();

            // Show success message
            const message = document.createElement('div');
            message.className = 'cart-success-message';
            message.textContent = `נוסף לשקלול: ${productName} - ${addedItems.join(', ')}`;
            message.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;

            document.body.appendChild(message);

            setTimeout(() => {
                message.remove();
            }, 3000);
        } else {
            alert('אנא בחר כמות לפחות עבור רמת כשרות אחת');
        }

    } catch (error) {
        console.error('Error adding product to cart:', error);
        alert('שגיאה בהוספה לשקלול');
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    const emptyCart = document.getElementById('emptyCart');
    const totalPrice = document.getElementById('totalPrice');

    // Check if elements exist
    if (!cartItems || !cartSummary || !totalPrice) {
        console.warn('Cart elements not found');
        return;
    }

    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        cartSummary.style.display = 'none';
        cartItems.innerHTML = '<div class="empty-cart" id="emptyCart"><p>השקלול ריק - בחר מוצרים מהרשימה למעלה</p></div>';
        updateCartDataField();
        updateOrderSummary();
        return;
    }

    if (emptyCart) emptyCart.style.display = 'none';
    cartSummary.style.display = 'flex';

    // Build cart items HTML
    let cartHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.totalPrice;
        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.productName}</div>
                    <div class="cart-item-details">${item.kashrutText} × ${item.quantity} = ${item.totalPrice}₪</div>
                </div>
                <div class="cart-item-price">${item.totalPrice}₪</div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="הסר מהשקלול">×</button>
            </div>
        `;
    });

    cartItems.innerHTML = cartHTML;
    totalPrice.textContent = total;

    // Update hidden form field and order summary
    updateCartDataField();
    updateOrderSummary();
}

function updateCartDataField() {
    const cartDataField = document.getElementById('cartData');
    if (cartDataField) {
        // Create a simplified version of cart data for the form
        const cartSummary = {
            items: cart.map(item => ({
                productName: item.productName,
                kashrut: item.kashrutText,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
            })),
            totalItems: cart.length,
            totalPrice: cart.reduce((sum, item) => sum + item.totalPrice, 0)
        };

        cartDataField.value = JSON.stringify(cartSummary);
    }

    // Update form cart summary display
    updateFormCartSummary();
}

function updateFormCartSummary() {
    const formCartSummary = document.getElementById('formCartSummary');
    const formCartItems = document.getElementById('formCartItems');
    const formTotalPrice = document.getElementById('formTotalPrice');

    if (!formCartSummary || !formCartItems || !formTotalPrice) {
        console.warn('Form cart summary elements not found');
        return;
    }

    if (cart.length === 0) {
        formCartSummary.style.display = 'none';
        updateSubmitButtonPrice(0);
        return;
    }

    formCartSummary.style.display = 'block';

    // Build form cart items HTML
    let formCartHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.totalPrice;
        formCartHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; padding: 0.5rem; background: white; border-radius: 6px;">
                <span>${item.productName} - ${item.kashrutText} × ${item.quantity}</span>
                <strong>${item.totalPrice}₪</strong>
            </div>
        `;
    });

    formCartItems.innerHTML = formCartHTML;
    formTotalPrice.textContent = total;

    // Update submit button with price
    updateSubmitButtonPrice(total);
}

function updateSubmitButtonPrice(total) {
    const submitPrice = document.getElementById('submitPrice');

    if (!submitPrice) {
        console.warn('Submit price element not found');
        return;
    }

    if (total > 0) {
        submitPrice.textContent = `${total}₪`;
        submitPrice.style.display = 'inline-block';
    } else {
        submitPrice.style.display = 'none';
    }
}

function removeFromCart(itemId) {
    try {
        cart = cart.filter(item => item.id !== itemId);
        updateCartDisplay();
    } catch (error) {
        console.error('Error removing item from cart:', error);
    }
}

function clearCart() {
    if (confirm('האם אתה בטוח שברצונך לרוקן את השקלול?')) {
        cart = [];
        updateCartDisplay();
        updateOrderSummary();
    }
}

// Order Summary Functions
function updateOrderSummary() {
    const orderSummarySection = document.getElementById('orderSummary');
    const summaryItems = document.getElementById('summaryItems');
    const summaryTotalItems = document.getElementById('summaryTotalItems');
    const summaryTotalPrice = document.getElementById('summaryTotalPrice');

    if (!orderSummarySection || !summaryItems || !summaryTotalItems || !summaryTotalPrice) {
        console.warn('Order summary elements not found');
        return;
    }

    if (cart.length === 0) {
        orderSummarySection.style.display = 'none';
        return;
    }

    orderSummarySection.style.display = 'block';

    // Build summary items HTML
    let summaryHTML = '';
    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach(item => {
        totalItems += item.quantity;
        totalPrice += item.totalPrice;
        summaryHTML += `
            <div class="summary-item">
                <div class="summary-item-info">
                    <div class="summary-item-name">${item.productName}</div>
                    <div class="summary-item-details">${item.kashrutText} × ${item.quantity} יחידות</div>
                </div>
                <div class="summary-item-price">${item.totalPrice}₪</div>
                <button class="summary-item-remove" onclick="removeFromCart('${item.id}')" title="הסר פריט">×</button>
            </div>
        `;
    });

    summaryItems.innerHTML = summaryHTML;
    summaryTotalItems.textContent = totalItems;
    summaryTotalPrice.textContent = `${totalPrice}₪`;
}

function scrollToCart() {
    try {
        const cartSection = document.getElementById('cart');
        if (cartSection) {
            cartSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.warn('Cart section not found');
        }
    } catch (error) {
        console.error('Error scrolling to cart:', error);
    }
}

function proceedToForm() {
    try {
        const orderForm = document.querySelector('.order-form');
        if (orderForm) {
            orderForm.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.warn('Order form not found');
        }
    } catch (error) {
        console.error('Error scrolling to form:', error);
    }
}

// Terms Modal Functions
function openTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');

        // Focus on the close button for accessibility
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.focus();
        }

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';

        // Add escape key listener
        document.addEventListener('keydown', handleModalEscape);

        // Add click outside to close
        modal.addEventListener('click', handleModalOutsideClick);
    }
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');

        // Restore body scroll
        document.body.style.overflow = '';

        // Remove event listeners
        document.removeEventListener('keydown', handleModalEscape);
        modal.removeEventListener('click', handleModalOutsideClick);

        // Return focus to the terms link
        const termsLink = document.querySelector('.terms-link');
        if (termsLink) {
            termsLink.focus();
        }
    }
}

function handleModalEscape(event) {
    if (event.key === 'Escape') {
        closeTermsModal();
    }
}

function handleModalOutsideClick(event) {
    const modal = document.getElementById('termsModal');
    if (event.target === modal) {
        closeTermsModal();
    }
}

// Cookie Management Functions
function showCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    const consent = localStorage.getItem('cookieConsent');

    if (!consent && banner) {
        banner.style.display = 'block';
        banner.setAttribute('aria-hidden', 'false');
    }
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    hideCookieBanner();

    // Initialize Google Analytics or other tracking
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
    }

    console.log('Cookies accepted');
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    hideCookieBanner();

    // Disable Google Analytics or other tracking
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'denied'
        });
    }

    console.log('Cookies declined');
}

function hideCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        banner.style.display = 'none';
        banner.setAttribute('aria-hidden', 'true');
    }
}

// Initialize cookie banner on page load
document.addEventListener('DOMContentLoaded', function() {
    // Show cookie banner after a short delay
    setTimeout(showCookieBanner, 1000);
});

// Hero Section Navigation Functions
function scrollToProducts() {
    const productsSection = document.querySelector('.products');
    if (productsSection) {
        productsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function scrollToForm() {
    const formSection = document.querySelector('.order-form');
    if (formSection) {
        formSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Function to add detailed product breakdown
function addDetailedProductBreakdown(data) {
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
        if (data.cartItems && data.cartItems.items) {
            cartItems = data.cartItems.items;
        }

        // Process each cart item for detailed breakdown
        cartItems.forEach(item => {
            const productName = item.productName || '';
            const kashrutText = item.kashrutText || '';
            const quantity = item.quantity || 0;
            const totalPrice = item.totalPrice || 0;

            console.log('Processing cart item:', { productName, kashrutText, quantity, totalPrice });

            // Add to detailed summary
            detailedOrderSummary += `${productName} - ${kashrutText} × ${quantity} = ${totalPrice}₪\n`;

            // Categorize products for breakdown
            if (productName.includes('סט')) {
                let setType = '';
                if (productName.includes('תימני')) setType = 'תימני';
                else if (productName.includes('מרוקאי')) setType = 'מרוקאי';
                else if (productName.includes('אשכנזי')) setType = 'אשכנזי';

                console.log('Adding set:', { setType, kashrutText, quantity, totalPrice });
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

                console.log('Adding etrog:', { etrogType, kashrutText, quantity, totalPrice });
                productBreakdown.etrogim.push({
                    type: etrogType,
                    kashrut: kashrutText,
                    quantity: quantity,
                    price: totalPrice
                });
            } else if (productName.includes('לולב')) {
                console.log('Adding lulav:', quantity);
                productBreakdown.lulav += quantity;
            } else if (productName.includes('הדס')) {
                console.log('Adding hadas:', quantity);
                productBreakdown.hadas += quantity;
            } else if (productName.includes('ערבה')) {
                console.log('Adding arava:', quantity);
                productBreakdown.arava += quantity;
            } else {
                console.log('Unknown product type:', productName);
            }
        });
    } catch (error) {
        console.error('Error processing cart items for breakdown:', error);
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

    // Add all the detailed data to the data object
    data.orderNumber = generateOrderNumber();
    data.totalItems = cartItems.length;
    data.detailedOrderSummary = detailedOrderSummary.trim();
    data.setsOrdered = setsOrderSummary;
    data.etrogimOrdered = etrogimOrderSummary;
    data.individualItemsOrdered = individualItemsSummary;
    data.hasTimaniSet = productBreakdown.sets.some(s => s.type === 'תימני') ? 'כן' : 'לא';
    data.hasMoroccanSet = productBreakdown.sets.some(s => s.type === 'מרוקאי') ? 'כן' : 'לא';
    data.hasAshkenaziSet = productBreakdown.sets.some(s => s.type === 'אשכנזי') ? 'כן' : 'לא';
    data.hasEtrogim = productBreakdown.etrogim.length > 0 ? 'כן' : 'לא';
    data.hasLulav = productBreakdown.lulav > 0 ? 'כן' : 'לא';
    data.hasHadas = productBreakdown.hadas > 0 ? 'כן' : 'לא';
    data.hasArava = productBreakdown.arava > 0 ? 'כן' : 'לא';

    return data;
}

function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    return `4M${year}${month}${day}${random}`;
}

// Make functions globally available
window.openTermsModal = openTermsModal;
window.closeTermsModal = closeTermsModal;
window.acceptCookies = acceptCookies;
window.declineCookies = declineCookies;
window.scrollToProducts = scrollToProducts;
window.scrollToForm = scrollToForm;
