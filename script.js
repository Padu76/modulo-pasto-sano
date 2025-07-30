// SCRIPT.JS - VERSIONE COMPLETA CON NOTIFICHE EMAIL

// Dati dei prodotti completi - 10 pasti + 2 colazioni
const products = {
    mainMeals: [
        { id: 1, name: "FUSILLI, MACINATO MANZO, ZUCCHINE, MELANZANE", price: 8.50, image: "fusilli-macinato-zucchine-melanzane.jpg" },
        { id: 2, name: "ROASTBEEF, PATATE AL FORNO, FAGIOLINI", price: 8.50, image: "roastbeef-patate-fagiolini.jpg" },
        { id: 3, name: "RISO BASMATI, HAMBURGER MANZO, CAROTINE", price: 8.50, image: "riso-hamburger-carotine.jpg" },
        { id: 4, name: "RISO BASMATI, POLLO AL CURRY, ZUCCHINE", price: 8.50, image: "riso-pollo-curry-zucchine.jpg" },
        { id: 5, name: "SALMONE, RISO VENERE, BROCCOLI", price: 8.50, image: "salmone-riso-venere-broccoli.jpg" },
        { id: 6, name: "PENNE, RAGÙ BIANCO, PISELLI", price: 8.50, image: "penne-ragu-bianco-piselli.jpg" },
        { id: 7, name: "POLLO, RISO BASMATI, VERDURE MISTE", price: 8.50, image: "pollo-riso-verdure.jpg" },
        { id: 8, name: "MERLUZZO, PATATE, FAGIOLINI", price: 8.50, image: "merluzzo-patate-fagiolini.jpg" },
        { id: 9, name: "TACCHINO, RISO INTEGRALE, ZUCCHINE", price: 8.50, image: "tacchino-riso-integrale-zucchine.jpg" },
        { id: 10, name: "PASTA, TONNO, POMODORINI", price: 8.50, image: "pasta-tonno-pomodorini.jpg" }
    ],
    breakfast: [
        { id: 11, name: "PANCAKES", price: 6.50, image: "pancakes.jpg" },
        { id: 12, name: "PORRIDGE", price: 6.50, image: "porridge.jpg" }
    ]
};

// Stato dell'applicazione
let cart = [];
let currentDiscount = { code: null, percent: 0, amount: 0 };

// Codici sconto disponibili
const discountCodes = {
    'BETA10': { percent: 10, description: 'Sconto Beta 10%', minOrder: 20, maxUses: 100, active: true },
    'PRIMO5': { percent: 5, description: 'Primo Ordine 5%', minOrder: 15, maxUses: 50, active: true }
};

// INIZIALIZZAZIONE EMAILJS
(function() {
    emailjs.init("ME0ru3KkNko0P6d2Y");
})();

// FUNZIONE INVIO EMAIL NOTIFICATION
function sendEmailNotification(orderData, orderId) {
    console.log('📧 Invio notifica email per ordine:', orderId);
    
    // Prepara i dati per l'email
    const emailData = {
        to_email: 'andrea.padoan@gmail.com',
        order_id: orderId,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        pickup_date: formatDate(orderData.pickupDate),
        total_amount: orderData.totalAmount.toFixed(2),
        payment_method: orderData.paymentMethodName || 'Contanti alla Consegna',
        total_items: orderData.totalItems,
        order_details: orderData.items.map(item => 
            `• ${item.name} x${item.quantity} (${(item.price * item.quantity).toFixed(2)}€)`
        ).join('\n'),
        order_time: new Date().toLocaleString('it-IT'),
        subtotal: orderData.subtotalAmount.toFixed(2),
        discount_info: orderData.discountCode ? 
            `Sconto ${orderData.discountCode}: -${orderData.discountAmount.toFixed(2)}€` : 
            'Nessuno sconto applicato',
        order_source: 'Sito Web',
        payment_status: orderData.status === 'paid' ? 'PAGATO' : 'DA PAGARE'
    };
    
    // Invia email tramite EmailJS
    emailjs.send('service_xiyczlr', 'template_lqxqdze', emailData)
        .then(function(response) {
            console.log('✅ Email inviata con successo:', response.status, response.text);
        })
        .catch(function(error) {
            console.error('❌ Errore invio email:', error);
        });
}

// Inizializzazione app
function initializeApp() {
    console.log('🚀 Inizializzazione app...');
    
    try {
        loadProducts();
        setupEventListeners();
        updateCartDisplay();
        initializePayPal();
        console.log('✅ App inizializzata correttamente');
    } catch (error) {
        console.error('❌ Errore inizializzazione:', error);
    }
}

// Caricamento prodotti
function loadProducts() {
    console.log('📦 Caricamento prodotti...');
    
    // Carica pasti principali
    const mainMealsContainer = document.getElementById('main-meals');
    if (mainMealsContainer) {
        products.mainMeals.forEach(product => {
            const productElement = createProductElement(product);
            mainMealsContainer.appendChild(productElement);
        });
        console.log('✅ Sezione main-meals caricata con', products.mainMeals.length, 'prodotti');
    }
    
    // Carica colazioni
    const breakfastContainer = document.getElementById('breakfast-meals');
    if (breakfastContainer) {
        products.breakfast.forEach(product => {
            const productElement = createProductElement(product);
            breakfastContainer.appendChild(productElement);
        });
        console.log('✅ Sezione breakfast-meals caricata con', products.breakfast.length, 'prodotti');
    }
    
    console.log('✅ Prodotti caricati');
}

// Creazione elemento prodotto
function createProductElement(product) {
    const productDiv = document.createElement('div');
    productDiv.className = 'product-item';
    productDiv.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='images/placeholder.jpg'">
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">${product.price.toFixed(2)}€</div>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                Aggiungi al Carrello
            </button>
        </div>
    `;
    return productDiv;
}

// Setup event listeners
function setupEventListeners() {
    console.log('🔗 Collegamento event listeners...');
    
    // Bottone carrello
    const floatingCart = document.getElementById('floating-cart');
    if (floatingCart) {
        floatingCart.addEventListener('click', openCartModal);
    }
    
    // Chiudi carrello
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', closeCartModal);
    }
    
    // Click fuori dal modale
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.addEventListener('click', function(event) {
            if (event.target === cartModal) {
                closeCartModal();
            }
        });
    }
    
    // Applica sconto
    const applyPromoBtn = document.getElementById('apply-promo');
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', applyDiscount);
    }
    
    // Svuota carrello
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    // Conferma ordine
    const confirmOrderBtn = document.getElementById('confirm-order');
    if (confirmOrderBtn) {
        confirmOrderBtn.addEventListener('click', confirmOrder);
    }
    
    // Data minima per pickup
    const pickupDateInput = document.getElementById('pickup-date');
    if (pickupDateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        pickupDateInput.min = tomorrow.toISOString().split('T')[0];
    }
    
    // Payment method selection
    setupPaymentMethodSelection();
    
    console.log('✅ Event listeners collegati');
}

// Setup payment method selection
function setupPaymentMethodSelection() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // Remove selected state from all methods
            paymentMethods.forEach(m => {
                m.removeAttribute('data-selected');
                const radio = m.querySelector('input[type="radio"]');
                if (radio) radio.checked = false;
            });
            
            // Add selected state to clicked method
            this.setAttribute('data-selected', 'true');
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            
            // Show/hide PayPal container
            const paypalContainer = document.getElementById('paypal-button-container');
            const confirmButton = document.getElementById('confirm-order');
            
            if (radio && radio.value === 'paypal') {
                paypalContainer.style.display = 'block';
                confirmButton.style.display = 'none';
            } else {
                paypalContainer.style.display = 'none';
                confirmButton.style.display = 'block';
            }
        });
    });
}

// Aggiungi al carrello
function addToCart(productId) {
    const product = findProductById(productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showToast(`${product.name} aggiunto al carrello!`, 'success');
    console.log('🛒 Prodotto aggiunto:', product.name);
}

// Trova prodotto per ID
function findProductById(id) {
    const allProducts = [...products.mainMeals, ...products.breakfast];
    return allProducts.find(product => product.id === id);
}

// Aggiorna visualizzazione carrello
function updateCartDisplay() {
    const cartCounter = document.getElementById('cart-counter');
    const cartTotal = document.getElementById('cart-total');
    const cartItems = document.getElementById('cart-items');
    const modalTotal = document.getElementById('modal-total');
    const totalItems = document.getElementById('total-items');
    const discountDisplay = document.getElementById('discount-display');
    
    // Aggiorna contatore e totale floating
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = calculateTotal();
    
    if (cartCounter) {
        cartCounter.textContent = totalQuantity;
        cartCounter.style.display = totalQuantity > 0 ? 'inline' : 'none';
    }
    
    if (cartTotal) {
        cartTotal.textContent = `${total.toFixed(2)}€`;
    }
    
    // Aggiorna items nel modale
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">Il carrello è vuoto</div>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">${item.price.toFixed(2)}€ cad.</div>
                    </div>
                    <div class="cart-item-controls">
                        <button onclick="updateQuantity(${item.id}, -1)" class="quantity-btn">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)" class="quantity-btn">+</button>
                        <button onclick="removeFromCart(${item.id})" class="remove-btn">🗑️</button>
                    </div>
                    <div class="cart-item-total">${(item.price * item.quantity).toFixed(2)}€</div>
                </div>
            `).join('');
        }
    }
    
    // Aggiorna totali nel modale
    if (modalTotal) modalTotal.textContent = `${total.toFixed(2)}€`;
    if (totalItems) totalItems.textContent = totalQuantity;
    
    // Mostra/nascondi sconto
    if (discountDisplay) {
        if (currentDiscount.amount > 0) {
            const subtotal = calculateSubtotal();
            discountDisplay.innerHTML = `
                <div class="discount-info">
                    <div>Subtotale: ${subtotal.toFixed(2)}€</div>
                    <div class="discount-applied">Sconto ${currentDiscount.code} (-${currentDiscount.percent}%): -${currentDiscount.amount.toFixed(2)}€</div>
                </div>
            `;
            discountDisplay.style.display = 'block';
        } else {
            discountDisplay.style.display = 'none';
        }
    }
}

// Aggiorna quantità
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartDisplay();
        recalculateDiscount();
    }
}

// Rimuovi dal carrello
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    recalculateDiscount();
    showToast('Prodotto rimosso dal carrello', 'info');
}

// Calcola subtotale
function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Calcola totale con sconto
function calculateTotal() {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - currentDiscount.amount);
}

// Applica codice sconto
function applyDiscount() {
    const discountInput = document.getElementById('promo-code');
    const promoMessage = document.getElementById('promo-message');
    
    if (!discountInput) return;
    
    const code = discountInput.value.trim().toUpperCase();
    
    if (!code) {
        if (promoMessage) promoMessage.innerHTML = '<div class="promo-error">Inserisci un codice promozionale</div>';
        return;
    }
    
    const discount = discountCodes[code];
    
    if (!discount) {
        if (promoMessage) promoMessage.innerHTML = '<div class="promo-error">❌ Codice non valido</div>';
        return;
    }
    
    if (!discount.active) {
        if (promoMessage) promoMessage.innerHTML = '<div class="promo-error">❌ Codice non più attivo</div>';
        return;
    }
    
    const subtotal = calculateSubtotal();
    
    if (subtotal < discount.minOrder) {
        if (promoMessage) promoMessage.innerHTML = `<div class="promo-error">Ordine minimo per questo sconto: ${discount.minOrder}€</div>`;
        return;
    }
    
    // Applica sconto
    currentDiscount = {
        code: code,
        percent: discount.percent,
        amount: (subtotal * discount.percent) / 100
    };
    
    updateCartDisplay();
    if (promoMessage) promoMessage.innerHTML = `<div class="promo-success">✅ Sconto ${discount.percent}% applicato!</div>`;
    discountInput.value = '';
}

// Ricalcola sconto quando cambia il carrello
function recalculateDiscount() {
    if (currentDiscount.code) {
        const subtotal = calculateSubtotal();
        currentDiscount.amount = (subtotal * currentDiscount.percent) / 100;
        updateCartDisplay();
    }
}

// Apri modale carrello
function openCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'block';
        updateCartDisplay();
    }
}

// Chiudi modale carrello
function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Svuota carrello
function clearCart() {
    cart = [];
    currentDiscount = { code: null, percent: 0, amount: 0 };
    updateCartDisplay();
    
    // Reset form
    const promoCode = document.getElementById('promo-code');
    const promoMessage = document.getElementById('promo-message');
    if (promoCode) promoCode.value = '';
    if (promoMessage) promoMessage.innerHTML = '';
    
    showToast('Carrello svuotato', 'info');
}

// Conferma ordine
function confirmOrder() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    
    if (!paymentMethod) {
        showToast('Seleziona un metodo di pagamento', 'error');
        return;
    }
    
    // Validazione campi
    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const pickupDate = document.getElementById('pickup-date').value;
    
    if (!customerName || !customerPhone || !pickupDate) {
        showToast('Compila tutti i campi obbligatori', 'error');
        return;
    }
    
    // Validazione telefono
    if (!/^(\+39|0039|39)?[\s\-]?3[0-9]{2}[\s\-]?[0-9]{6,7}$/.test(customerPhone.replace(/\s/g, ''))) {
        showToast('Inserisci un numero di telefono valido', 'error');
        return;
    }
    
    // Validazione quantità
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity < 4) {
        showToast('Il minimo d\'ordine è 4 pezzi a scelta', 'error');
        return;
    }
    
    // Validazione data
    const pickup = new Date(pickupDate);
    const today = new Date();
    const diffDays = Math.ceil((pickup - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 2) {
        showToast('La data di ritiro deve essere almeno 2 giorni in anticipo', 'error');
        return;
    }
    
    // Procedi in base al metodo di pagamento
    switch (paymentMethod.value) {
        case 'cash':
            handleCashOrder();
            break;
        case 'stripe':
            processStripePayment();
            break;
        case 'paypal':
            // PayPal gestito dai suoi bottoni
            showToast('Clicca sul pulsante PayPal per pagare', 'info');
            break;
        default:
            showToast('Metodo di pagamento non valido', 'error');
    }
}

// Gestisci ordine contanti
function handleCashOrder() {
    const orderData = {
        customerName: document.getElementById('customer-name').value.trim(),
        customerPhone: document.getElementById('customer-phone').value.trim(),
        pickupDate: document.getElementById('pickup-date').value,
        items: cart,
        totalAmount: calculateTotal(),
        subtotalAmount: calculateSubtotal(),
        discountAmount: currentDiscount.amount,
        discountPercent: currentDiscount.percent,
        discountCode: currentDiscount.code,
        totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: 'cash',
        paymentMethodName: 'Contanti alla Consegna',
        status: 'pending',
        timestamp: new Date(),
        source: 'website'
    };

    // Salva in Firebase
    firebase.firestore()
        .collection('orders')
        .add(orderData)
        .then(docRef => {
            console.log('✅ Ordine cash salvato:', docRef.id);
            
            // INVIA EMAIL NOTIFICATION
            sendEmailNotification(orderData, docRef.id);
            
            // Genera messaggio WhatsApp
            const message = generateWhatsAppMessage();
            const whatsappUrl = `https://wa.me/393478881515?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            
            // Reset carrello
            cart = [];
            currentDiscount = { code: null, percent: 0, amount: 0 };
            updateCartDisplay();
            closeCartModal();
            
            showToast('Ordine inviato! Ti contatteremo presto.', 'success');
        })
        .catch(error => {
            console.error('❌ Errore salvataggio ordine cash:', error);
            showToast('❌ Errore nel salvataggio ordine', 'error');
        });
}

// Genera messaggio WhatsApp
function generateWhatsAppMessage() {
    let message = `🍽️ *NUOVO ORDINE PASTO SANO*\n\n`;
    
    // Info cliente
    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const pickupDate = document.getElementById('pickup-date').value;
    
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📱 *Telefono:* ${customerPhone}\n`;
    message += `📅 *Ritiro:* ${formatDate(pickupDate)}\n\n`;
    
    // Prodotti
    if (cart.length > 0) {
        message += `📋 *Dettagli Ordine:*\n`;
        cart.forEach(item => {
            const itemTotal = (item.quantity * item.price).toFixed(2);
            message += `• ${item.name}\n`;
            message += `  Quantità: ${item.quantity} - Prezzo: ${itemTotal}€\n\n`;
        });
    }
    
    // Totali
    const subtotal = calculateSubtotal();
    const total = calculateTotal();
    
    message += `💰 *Riepilogo:*\n`;
    message += `Subtotale: ${subtotal.toFixed(2)}€\n`;
    
    if (currentDiscount.amount > 0) {
        message += `Sconto ${currentDiscount.code}: -${currentDiscount.amount.toFixed(2)}€\n`;
    }
    
    message += `*TOTALE: ${total.toFixed(2)}€*\n\n`;
    message += `💳 *Pagamento:* Contanti alla Consegna\n`;
    message += `🌐 *Canale:* Sito Web\n`;
    message += `⏰ *Ordinato:* ${new Date().toLocaleString('it-IT')}`;
    
    return message;
}

// Formatta data
function formatDate(dateString) {
    if (!dateString) return 'Non specificata';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Processa pagamento Stripe
function processStripePayment() {
    const orderData = {
        customerName: document.getElementById('customer-name').value.trim(),
        customerPhone: document.getElementById('customer-phone').value.trim(),
        pickupDate: document.getElementById('pickup-date').value,
        amount: calculateTotal(),
        items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        success_url: window.location.origin + '/success.html',
        cancel_url: window.location.href
    };

    fetch('/.netlify/functions/stripe-checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(session => {
        return stripe.redirectToCheckout({ sessionId: session.id });
    })
    .then(result => {
        if (result.error) {
            showToast(result.error.message, 'error');
        }
    })
    .catch(error => {
        console.error('Errore Stripe:', error);
        showToast('Errore durante il pagamento', 'error');
    });
}

// Inizializza PayPal
function initializePayPal() {
    if (typeof paypal === 'undefined') {
        console.log('⏳ PayPal SDK non ancora caricato');
        return;
    }
    
    console.log('Inizializzando PayPal...');
    
    try {
        paypal.Buttons({
            createOrder: function(data, actions) {
                // Validazione prima di PayPal
                const customerName = document.getElementById('customer-name').value.trim();
                const customerPhone = document.getElementById('customer-phone').value.trim();
                const pickupDate = document.getElementById('pickup-date').value;
                
                if (!customerName) {
                    showToast('❌ Inserisci il tuo nome completo', 'error');
                    return Promise.reject('Nome mancante');
                }
                
                if (!customerPhone) {
                    showToast('❌ Inserisci il tuo numero di telefono', 'error');
                    return Promise.reject('Telefono mancante');
                }
                
                if (!pickupDate) {
                    showToast('❌ Seleziona la data di ritiro', 'error');
                    return Promise.reject('Data mancante');
                }
                
                const pickup = new Date(pickupDate);
                const today = new Date();
                const diffDays = Math.ceil((pickup - today) / (1000 * 60 * 60 * 24));
                
                if (diffDays < 2) {
                    showToast('❌ La data di ritiro deve essere almeno 2 giorni in anticipo', 'error');
                    return Promise.reject('Data troppo vicina');
                }
                
                const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
                if (totalQuantity < 4) {
                    showToast('❌ Il minimo d\'ordine è 4 pezzi a scelta', 'error');
                    return Promise.reject('Quantità insufficiente');
                }
                
                if (cart.length === 0) {
                    showToast('❌ Aggiungi prodotti al carrello', 'error');
                    return Promise.reject('Carrello vuoto');
                }
                
                const total = calculateTotal();
                
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: total.toFixed(2)
                        },
                        description: `Ordine Pasto Sano - ${totalQuantity} pezzi`
                    }]
                });
            },
            
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    console.log('💰 Pagamento PayPal completato:', details);
                    
                    // Usa i dati del form (non PayPal) per il cliente
                    const customerName = document.getElementById('customer-name').value.trim();
                    const customerPhone = document.getElementById('customer-phone').value.trim();
                    const pickupDate = document.getElementById('pickup-date').value;
                    
                    const orderData = {
                        customerName: customerName,
                        customerPhone: customerPhone,
                        pickupDate: pickupDate,
                        items: cart,
                        totalAmount: calculateTotal(),
                        subtotalAmount: calculateSubtotal(),
                        discountAmount: currentDiscount.amount,
                        discountPercent: currentDiscount.percent,
                        discountCode: currentDiscount.code,
                        totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
                        paymentMethod: 'paypal',
                        paymentMethodName: 'PayPal',
                        paymentDetails: details,
                        status: 'paid',
                        timestamp: new Date(),
                        source: 'website'
                    };
                    
                    // Salva in Firebase
                    firebase.firestore()
                        .collection('orders')
                        .add(orderData)
                        .then(docRef => {
                            console.log('✅ Ordine PayPal salvato:', docRef.id);
                            
                            // INVIA EMAIL NOTIFICATION
                            sendEmailNotification(orderData, docRef.id);
                            
                            // Invia notifica WhatsApp
                            sendWhatsAppNotificationForPaidOrder(orderData, docRef.id);
                            
                            // Reset e ringraziamento
                            cart = [];
                            currentDiscount = { code: null, percent: 0, amount: 0 };
                            updateCartDisplay();
                            showToast('✅ Pagamento completato! Ordine inviato.', 'success');
                            
                            // Chiudi modal
                            closeCartModal();
                        })
                        .catch(error => {
                            console.error('❌ Errore salvataggio:', error);
                            showToast('❌ Errore nel salvataggio ordine', 'error');
                        });
                });
            },
            
            onError: function(err) {
                console.error('❌ Errore PayPal:', err);
                showToast('❌ Errore durante il pagamento', 'error');
            }
        }).render('#paypal-button-container');
        
        console.log('✅ Bottoni PayPal renderizzati!');
        
    } catch (error) {
        console.error('❌ Errore inizializzazione PayPal:', error);
    }
}

// Invia notifica WhatsApp per ordini pagati
function sendWhatsAppNotificationForPaidOrder(orderData, orderId) {
    let message = `🍽️ *NUOVO ORDINE PAGATO - PASTO SANO*\n\n`;
    
    message += `👤 *Cliente:* ${orderData.customerName}\n`;
    message += `📱 *Telefono:* ${orderData.customerPhone}\n`;
    message += `📅 *Ritiro:* ${formatDate(orderData.pickupDate)}\n`;
    message += `💳 *Pagamento:* ${orderData.paymentMethodName} ✅ PAGATO\n\n`;
    
    message += `📋 *Prodotti (${orderData.totalItems} pezzi):*\n`;
    orderData.items.forEach(item => {
        message += `• ${item.name} x${item.quantity} (${(item.price * item.quantity).toFixed(2)}€)\n`;
    });
    
    message += `\n💰 *Totale: ${orderData.totalAmount.toFixed(2)}€*\n`;
    message += `🆔 *ID Ordine:* ${orderId}\n`;
    message += `⏰ *Ordinato:* ${new Date().toLocaleString('it-IT')}`;
    
    const whatsappUrl = `https://wa.me/393478881515?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Log di inizializzazione
console.log('🎉 Script caricato completamente!');
console.log('✅ Sistema codici sconto integrato!');  
console.log('📱 Campo telefono aggiunto!');
console.log('🔔 Notifiche WhatsApp per tutti i pagamenti!');
console.log('📧 Notifiche EMAIL integrate!');
console.log('💡 Per vedere le statistiche: showDiscountStats()');