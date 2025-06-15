// Script migliorato mobile-first per Pasto Sano
import { saveOrder } from './firebase-config.js';

// Variabili globali
let cart = [];
let appliedDiscount = 0;
let discountCode = '';

// Codici promozionali
const promoCodes = {
    'PRIMAVERA10': 10,
    'ESTATE15': 15,
    'BENVENUTO5': 5,
    'SCONTO20': 20,
    'FIRSTORDER': 10
};

// Elementi DOM
const cartFloating = document.getElementById('cart-floating');
const cartItemsCount = document.getElementById('cart-items-count');
const cartTotalFloating = document.getElementById('cart-total-floating');
const cartItemsList = document.getElementById('cart-items');
const totalPriceSpan = document.getElementById('total-price');
const totalItemsSpan = document.getElementById('total-items');

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Pasto Sano App inizializzata');
    
    initializeEventListeners();
    setMinPickupDate();
    loadCartFromStorage();
    updateCartDisplay();
    
    // Mostra animazione di caricamento completato
    document.body.classList.add('loaded');
});

// INIZIALIZZAZIONE EVENT LISTENERS
function initializeEventListeners() {
    // Event listeners per controlli quantità
    document.addEventListener('click', handleQuantityControls);
    
    // Event listeners per pulsanti aggiungi
    document.addEventListener('click', handleAddToCart);
    
    // Carrello floating click
    cartFloating?.addEventListener('click', () => {
        if (isMobile()) {
            showCartPopup();
        }
    });
    
    // Altri event listeners
    setupFormEventListeners();
    setupPopupEventListeners();
    setupPromoEventListeners();
}

// GESTIONE CONTROLLI QUANTITÀ
function handleQuantityControls(e) {
    if (!e.target.closest('.qty-btn')) return;
    
    const btn = e.target.closest('.qty-btn');
    const mealCard = btn.closest('.meal-card');
    const quantityDisplay = mealCard.querySelector('.quantity-display');
    const action = btn.dataset.action;
    
    let currentQuantity = parseInt(quantityDisplay.textContent);
    
    // Animazione feedback
    btn.classList.add('animate');
    setTimeout(() => btn.classList.remove('animate'), 150);
    
    // Aggiorna quantità
    if (action === 'plus') {
        currentQuantity++;
        // Vibrazione leggera su mobile
        if (navigator.vibrate) navigator.vibrate(10);
    } else if (action === 'minus' && currentQuantity > 0) {
        currentQuantity--;
        if (navigator.vibrate) navigator.vibrate(10);
    }
    
    quantityDisplay.textContent = currentQuantity;
    
    // Aggiorna stile visual
    updateQuantityVisual(mealCard, currentQuantity);
}

// GESTIONE AGGIUNGI AL CARRELLO
function handleAddToCart(e) {
    if (!e.target.closest('.add-to-cart-btn')) return;
    
    const btn = e.target.closest('.add-to-cart-btn');
    const mealCard = btn.closest('.meal-card');
    const quantity = parseInt(mealCard.querySelector('.quantity-display').textContent);
    
    if (quantity === 0) {
        showFeedback('Seleziona una quantità prima di aggiungere', 'warning');
        // Animazione shake per feedback visivo
        mealCard.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => mealCard.style.animation = '', 500);
        return;
    }
    
    const mealId = mealCard.dataset.id;
    const mealName = mealCard.querySelector('h3').textContent;
    const mealPrice = parseFloat(mealCard.dataset.price);
    
    // Aggiungi al carrello
    addToCart(mealId, mealName, mealPrice, quantity);
    
    // Reset quantità e feedback visivo
    mealCard.querySelector('.quantity-display').textContent = '0';
    updateQuantityVisual(mealCard, 0);
    
    // Animazioni feedback
    btn.classList.add('animate');
    mealCard.classList.add('added');
    setTimeout(() => {
        btn.classList.remove('animate');
        mealCard.classList.remove('added');
    }, 500);
    
    // Vibrazione successo
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    
    showFeedback(`${mealName} aggiunto al carrello!`, 'success');
}

// AGGIUNTA AL CARRELLO
function addToCart(id, name, price, quantity) {
    const existingItemIndex = cart.findIndex(item => item.id === id);
    
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({ id, name, price, quantity });
    }
    
    saveCartToStorage();
    updateCartDisplay();
    updateFloatingCart();
}

// AGGIORNAMENTO DISPLAY CARRELLO
function updateCartDisplay() {
    if (!cartItemsList) return;
    
    cartItemsList.innerHTML = '';
    let subtotal = 0;
    let totalQuantity = 0;

    cart.forEach((item, index) => {
        if (item.quantity > 0) {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-quantity">x${item.quantity}</span>
                <span class="cart-item-price">${(item.price * item.quantity).toFixed(2)}€</span>
            `;
            cartItemsList.appendChild(cartItem);
            
            subtotal += item.price * item.quantity;
            totalQuantity += item.quantity;
        }
    });

    // Calcola totale con sconto
    const discountAmount = (subtotal * appliedDiscount) / 100;
    const total = subtotal - discountAmount;

    // Aggiorna display sconto
    const discountLine = document.getElementById('discount-line');
    if (appliedDiscount > 0 && discountLine) {
        discountLine.style.display = 'block';
        discountLine.textContent = `Sconto ${discountCode} (-${appliedDiscount}%): -${discountAmount.toFixed(2)}€`;
    } else if (discountLine) {
        discountLine.style.display = 'none';
    }

    // Aggiorna totali
    if (totalPriceSpan) totalPriceSpan.textContent = `${total.toFixed(2)}€`;
    if (totalItemsSpan) totalItemsSpan.textContent = totalQuantity;
    
    updateFloatingCart();
}

// AGGIORNAMENTO CARRELLO FLOATING
function updateFloatingCart() {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * appliedDiscount) / 100;
    const total = subtotal - discountAmount;
    
    if (cartItemsCount) cartItemsCount.textContent = totalQuantity;
    if (cartTotalFloating) cartTotalFloating.textContent = `${total.toFixed(2)}€`;
    
    // Mostra/nascondi carrello floating
    if (totalQuantity > 0) {
        cartFloating?.classList.add('show');
    } else {
        cartFloating?.classList.remove('show');
    }
}

// VISUAL FEEDBACK QUANTITÀ
function updateQuantityVisual(mealCard, quantity) {
    const quantityControl = mealCard.querySelector('.quantity-control');
    const addBtn = mealCard.querySelector('.add-to-cart-btn');
    
    if (quantity > 0) {
        quantityControl.style.borderColor = '#7a9e7e';
        quantityControl.style.backgroundColor = '#f0fff4';
        addBtn.style.transform = 'scale(1.02)';
    } else {
        quantityControl.style.borderColor = '#e2e8f0';
        quantityControl.style.backgroundColor = '#f7fafc';
        addBtn.style.transform = 'scale(1)';
    }
}

// GESTIONE CODICI PROMOZIONALI
function setupPromoEventListeners() {
    const applyPromoBtn = document.getElementById('apply-promo');
    const promoCodeInput = document.getElementById('promo-code');
    
    applyPromoBtn?.addEventListener('click', applyPromoCode);
    
    promoCodeInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyPromoCode();
        }
    });
}

function applyPromoCode() {
    const code = document.getElementById('promo-code')?.value.toUpperCase().trim();
    const messageDiv = document.getElementById('promo-message');
    
    if (!code) {
        showPromoMessage('Inserisci un codice promozionale', 'error');
        return;
    }
    
    if (promoCodes[code]) {
        appliedDiscount = promoCodes[code];
        discountCode = code;
        showPromoMessage(`✅ Codice applicato! Sconto del ${appliedDiscount}%`, 'success');
        updateCartDisplay();
        
        // Vibrazione successo
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    } else {
        showPromoMessage('❌ Codice non valido', 'error');
        
        // Vibrazione errore
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
}

function showPromoMessage(message, type) {
    const messageDiv = document.getElementById('promo-message');
    if (!messageDiv) return;
    
    const className = type === 'success' ? 'promo-success' : 'promo-error';
    messageDiv.innerHTML = `<div class="${className}">${message}</div>`;
    
    // Auto-hide dopo 3 secondi
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 3000);
}

// SETUP FORM EVENT LISTENERS
function setupFormEventListeners() {
    // Submit order
    document.getElementById('submit-order')?.addEventListener('click', handleSubmitOrder);
    
    // Clear cart
    document.getElementById('clear-cart')?.addEventListener('click', clearCart);
    
    // Customer form
    document.getElementById('confirm-customer')?.addEventListener('click', handleCustomerConfirm);
}

// SETUP POPUP EVENT LISTENERS
function setupPopupEventListeners() {
    // Close buttons
    document.getElementById('close-popup')?.addEventListener('click', () => {
        hidePopup('summary-popup');
    });
    
    document.getElementById('close-customer-popup')?.addEventListener('click', () => {
        hidePopup('customer-popup');
    });
    
    // Confirm order
    document.getElementById('confirm-order')?.addEventListener('click', () => {
        hidePopup('summary-popup');
        showPopup('customer-popup');
    });
    
    // Close on overlay click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup-overlay')) {
            hideAllPopups();
        }
    });
    
    // ESC key to close popups
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideAllPopups();
        }
    });
}

// GESTIONE SUBMIT ORDINE
function handleSubmitOrder() {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalQuantity === 0) {
        showFeedback('Aggiungi almeno un prodotto al carrello', 'warning');
        return;
    }
    
    if (totalQuantity < 4) {
        showFeedback('Minimo 4 prodotti per effettuare l\'ordine', 'warning');
        return;
    }
    
    showSummaryPopup();
}

// POPUP RIEPILOGATIVO
function showSummaryPopup() {
    const popupItems = document.getElementById('popup-items');
    const popupTotal = document.getElementById('popup-total');
    
    if (!popupItems || !popupTotal) return;
    
    // Genera items
    popupItems.innerHTML = '';
    cart.forEach(item => {
        if (item.quantity > 0) {
            const popupItem = document.createElement('div');
            popupItem.className = 'popup-item';
            popupItem.innerHTML = `
                <div class="popup-item-name">${item.name}</div>
                <div>x${item.quantity} - ${(item.price * item.quantity).toFixed(2)}€</div>
            `;
            popupItems.appendChild(popupItem);
        }
    });
    
    // Calcola totale
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * appliedDiscount) / 100;
    const total = subtotal - discountAmount;
    
    let totalText = `Totale: ${total.toFixed(2)}€`;
    if (appliedDiscount > 0) {
        totalText = `
            Subtotale: ${subtotal.toFixed(2)}€<br>
            Sconto ${discountCode} (-${appliedDiscount}%): -${discountAmount.toFixed(2)}€<br>
            <strong>Totale: ${total.toFixed(2)}€</strong>
        `;
    }
    popupTotal.innerHTML = totalText;
    
    showPopup('summary-popup');
}

// CONFERMA DATI CLIENTE
async function handleCustomerConfirm() {
    const customerName = document.getElementById('customer-name')?.value.trim();
    const customerPhone = document.getElementById('customer-phone')?.value.trim();
    const customerEmail = document.getElementById('customer-email')?.value.trim();
    const orderNotes = document.getElementById('order-notes')?.value.trim();
    const pickupDate = document.getElementById('pickup-date')?.value;
    
    // Validazioni
    if (!customerName || !customerPhone) {
        showFeedback('Nome e telefono sono obbligatori', 'error');
        return;
    }
    
    if (!pickupDate) {
        showFeedback('Seleziona una data di ritiro', 'error');
        return;
    }
    
    // Verifica data ritiro
    if (!validatePickupDate(pickupDate)) {
        showFeedback('La data di ritiro deve essere almeno 2 giorni in anticipo', 'error');
        return;
    }
    
    hidePopup('customer-popup');
    
    // Processa ordine
    await processOrderWithCustomerData({
        customerName,
        customerPhone,
        customerEmail,
        orderNotes,
        pickupDate
    });
}

// PROCESSAMENTO ORDINE
async function processOrderWithCustomerData(customerData) {
    const loadingMessage = showFeedback('Preparazione ordine in corso...', 'loading');
    
    try {
        // Calcola totali
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = (subtotal * appliedDiscount) / 100;
        const total = subtotal - discountAmount;
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Prepara dati ordine
        const orderData = {
            customerName: customerData.customerName,
            customerPhone: customerData.customerPhone,
            customerEmail: customerData.customerEmail,
            items: cart.filter(item => item.quantity > 0),
            totalItems: totalQuantity,
            subtotal: subtotal,
            appliedDiscount: appliedDiscount,
            discountCode: discountCode,
            totalAmount: total,
            pickupDate: customerData.pickupDate,
            orderNotes: customerData.orderNotes
        };
        
        // Salva in Firebase
        try {
            const orderId = await saveOrder(orderData);
            console.log('✅ Ordine salvato in Firebase:', orderId);
        } catch (error) {
            console.error('❌ Errore salvataggio Firebase:', error);
            // Continua comunque con WhatsApp
        }
        
        // Genera messaggio WhatsApp
        const whatsappMessage = generateWhatsAppMessage(orderData);
        const whatsappUrl = generateWhatsAppUrl(whatsappMessage);
        
        // Nascondi loading
        hideLoadingMessage(loadingMessage);
        
        // Mostra risultato
        showOrderResult(orderData, whatsappUrl);
        
        // Reset form e carrello
        resetAfterOrder();
        
    } catch (error) {
        hideLoadingMessage(loadingMessage);
        console.error('❌ Errore processamento ordine:', error);
        showFeedback('Errore durante la preparazione dell\'ordine', 'error');
    }
}

// GENERAZIONE MESSAGGIO WHATSAPP
function generateWhatsAppMessage(orderData) {
    let message = "🎉 Nuovo Ordine Pasto Sano! 🎉\n\n";
    message += "👤 DATI CLIENTE:\n";
    message += `Nome: ${orderData.customerName}\n`;
    message += `Telefono: ${orderData.customerPhone}\n`;
    if (orderData.customerEmail) message += `Email: ${orderData.customerEmail}\n`;
    
    message += "\n📦 DETTAGLI ORDINE:\n";
    message += "-----------------------------------\n";
    
    orderData.items.forEach(item => {
        message += `• ${item.name}\n  Quantità: ${item.quantity}\n  Costo: ${(item.price * item.quantity).toFixed(2)}€\n\n`;
    });
    
    message += "-----------------------------------\n";
    message += `📦 Totale Articoli: ${orderData.totalItems}\n`;
    
    if (orderData.appliedDiscount > 0) {
        message += `💰 Subtotale: ${orderData.subtotal.toFixed(2)}€\n`;
        message += `🎁 Sconto ${orderData.discountCode} (-${orderData.appliedDiscount}%): -${(orderData.subtotal * orderData.appliedDiscount / 100).toFixed(2)}€\n`;
        message += `💰 Totale Finale: ${orderData.totalAmount.toFixed(2)}€\n`;
    } else {
        message += `💰 Totale Ordine: ${orderData.totalAmount.toFixed(2)}€\n`;
    }
    
    message += `🗓️ Data di Ritiro: ${orderData.pickupDate}\n`;
    
    if (orderData.orderNotes) {
        message += `📝 Note: ${orderData.orderNotes}\n`;
    }
    
    message += "-----------------------------------\n";
    message += "Si prega di confermare la disponibilità. Grazie!";
    
    return message;
}

function generateWhatsAppUrl(message) {
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = "+393478881515"; // Il tuo numero WhatsApp
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

// MOSTRA RISULTATO ORDINE
function showOrderResult(orderData, whatsappUrl) {
    const orderMessage = document.getElementById('order-message');
    if (!orderMessage) return;
    
    orderMessage.style.display = 'block';
    orderMessage.style.backgroundColor = '#d4edda';
    orderMessage.style.color = '#155724';
    
    orderMessage.innerHTML = `
        <div style="margin-bottom: 16px;">
            <strong>✅ Ordine preparato con successo!</strong><br>
            Cliente: ${orderData.customerName}<br>
            Totale: ${orderData.totalAmount.toFixed(2)}€<br>
            Data di ritiro: ${orderData.pickupDate}
        </div>
    `;
    
    const whatsappButton = document.createElement('a');
    whatsappButton.href = whatsappUrl;
    whatsappButton.target = "_blank";
    whatsappButton.className = "confirm-btn whatsapp-btn";
    whatsappButton.style.marginTop = "16px";
    whatsappButton.style.display = "inline-block";
    whatsappButton.style.textDecoration = "none";
    whatsappButton.textContent = "📱 Invia Ordine su WhatsApp";
    
    whatsappButton.addEventListener('click', () => {
        setTimeout(() => {
            showNotification('✅ Ordine inviato con successo!');
        }, 500);
    });
    
    orderMessage.appendChild(whatsappButton);
    
    // Scroll verso il messaggio
    orderMessage.scrollIntoView({ behavior: 'smooth' });
}

// UTILITY FUNCTIONS
function isMobile() {
    return window.innerWidth < 768;
}

function showPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function hidePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function hideAllPopups() {
    document.querySelectorAll('.popup-overlay').forEach(popup => {
        popup.style.display = 'none';
    });
    document.body.style.overflow = '';
}

function showFeedback(message, type = 'info') {
    // Crea elemento feedback temporaneo
    const feedback = document.createElement('div');
    feedback.className = `feedback feedback-${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 3000;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(feedback);
    
    if (type !== 'loading') {
        setTimeout(() => {
            feedback.remove();
        }, 3000);
    }
    
    return feedback;
}

function hideLoadingMessage(loadingElement) {
    if (loadingElement) {
        loadingElement.remove();
    }
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

function clearCart() {
    cart = [];
    appliedDiscount = 0;
    discountCode = '';
    
    // Reset UI
    document.getElementById('promo-code').value = '';
    document.getElementById('promo-message').innerHTML = '';
    document.querySelectorAll('.quantity-display').forEach(display => {
        display.textContent = '0';
    });
    document.querySelectorAll('.meal-card').forEach(card => {
        updateQuantityVisual(card, 0);
    });
    
    // Reset date
    document.getElementById('pickup-date').value = '';
    
    // Hide order message
    const orderMessage = document.getElementById('order-message');
    if (orderMessage) orderMessage.style.display = 'none';
    
    saveCartToStorage();
    updateCartDisplay();
    
    showFeedback('Carrello svuotato', 'info');
}

function resetAfterOrder() {
    clearCart();
    
    // Reset customer form
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-email').value = '';
    document.getElementById('order-notes').value = '';
}

// DATA VALIDATION
function setMinPickupDate() {
    const today = new Date();
    today.setDate(today.getDate() + 2);
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const pickupDateInput = document.getElementById('pickup-date');
    if (pickupDateInput) {
        pickupDateInput.min = `${year}-${month}-${day}`;
    }
}

function validatePickupDate(pickupDate) {
    const selectedDate = new Date(pickupDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);
    
    selectedDate.setHours(0, 0, 0, 0);
    minDate.setHours(0, 0, 0, 0);
    
    return selectedDate >= minDate;
}

// LOCAL STORAGE
function saveCartToStorage() {
    try {
        localStorage.setItem('pastoSanoCart', JSON.stringify({
            cart,
            appliedDiscount,
            discountCode
        }));
    } catch (error) {
        console.warn('Impossibile salvare carrello in localStorage:', error);
    }
}

function loadCartFromStorage() {
    try {
        const saved = localStorage.getItem('pastoSanoCart');
        if (saved) {
            const data = JSON.parse(saved);
            cart = data.cart || [];
            appliedDiscount = data.appliedDiscount || 0;
            discountCode = data.discountCode || '';
            
            // Aggiorna UI se c'è discount
            if (discountCode) {
                const promoCodeInput = document.getElementById('promo-code');
                if (promoCodeInput) promoCodeInput.value = discountCode;
                showPromoMessage(`Codice ${discountCode} applicato (${appliedDiscount}%)`, 'success');
            }
        }
    } catch (error) {
        console.warn('Impossibile caricare carrello da localStorage:', error);
    }
}

// POPUP CARRELLO MOBILE
function showCartPopup() {
    if (cart.length === 0) {
        showFeedback('Il carrello è vuoto', 'info');
        return;
    }
    
    // Per ora apre il popup di riepilogo
    showSummaryPopup();
}

// CSS ANIMATIONS
const style = document.createElement('style');
style.textContent = `
@keyframes slideDown {
    from { transform: translate(-50%, -100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.feedback {
    animation: slideDown 0.3s ease;
}
`;
document.head.appendChild(style);

console.log('✅ Script Pasto Sano caricato completamente');