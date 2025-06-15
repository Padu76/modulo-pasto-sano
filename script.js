// Dati dei prodotti completi - 10 pasti + 2 colazioni
const products = {
    mainMeals: [
        { id: 1, name: "FUSILLI, MACINATO MANZO, ZUCCHINE, MELANZANE", price: 8, image: "fusilli-macinato-zucchine-melanzane.jpg" },
        { id: 2, name: "ROASTBEEF, PATATE AL FORNO, FAGIOLINI", price: 8, image: "roastbeef-patatealforno-fagiolini.jpg" },
        { id: 3, name: "RISO BASMATI, HAMBURGER MANZO, CAROTINE", price: 8, image: "risobasmati-hamburgermanzo-carotine.jpg" },
        { id: 4, name: "RISO NERO, GAMBERI, TONNO, PISELLI", price: 8, image: "riso nero-gamberi-tonno-piselli.jpg" },
        { id: 5, name: "SALMONE GRIGLIATO, PATATE AL FORNO, BROCCOLI", price: 8, image: "salmonegrigliato-patatealforno-broccoli.jpg" },
        { id: 6, name: "POLLO GRIGLIATO, PATATE AL FORNO, ZUCCHINE", price: 8, image: "pollogrigliato-patatealforno-zucchine.jpg" },
        { id: 7, name: "RISO BASMATI, POLLO AL CURRY, ZUCCHINE", price: 8, image: "risobasmati-polloalcurry-zucchine.jpg" },
        { id: 8, name: "ORZO, CECI, FETA, POMODORINI, BASILICO", price: 8, image: "orzo-ceci-feta-pomodorini-basilico.jpg" },
        { id: 9, name: "TORTILLAS, TACCHINO AFFUMICATO, HUMMUS CECI", price: 8, image: "pollogrigliato-patatealforno-zucchine.jpg" },
        { id: 10, name: "TORTILLAS, SALMONE AFFUMICATO, FORMAGGIO SPALMABILE", price: 8, image: "salmonegrigliato-patatealforno-broccoli.jpg" }
    ],
    breakfastMeals: [
        { id: 11, name: "UOVA STRAPAZZATE, BACON, FRUTTI DI BOSCO", price: 6, image: "pancakes.jpg" },
        { id: 12, name: "PANCAKES", price: 6, image: "pancakes.jpg" }
    ]
};

// Codici promozionali
const promoCodes = {
    'PRIMAVERA10': 10,
    'ESTATE15': 15,
    'BENVENUTO5': 5,
    'SCONTO20': 20
};

// Stato dell'applicazione
let cart = JSON.parse(localStorage.getItem('pastoSanoCart')) || [];
let appliedDiscount = 0;
let discountCode = '';
let quantities = {};

// Elementi DOM
const floatingCart = document.getElementById('floating-cart');
const cartModal = document.getElementById('cart-modal');
const cartCounter = document.getElementById('cart-counter');
const cartTotal = document.getElementById('cart-total');
const modalTotal = document.getElementById('modal-total');
const totalItems = document.getElementById('total-items');
const cartItems = document.getElementById('cart-items');
const discountDisplay = document.getElementById('discount-display');
const toast = document.getElementById('toast');

// Stripe
const stripe = window.Stripe ? Stripe('pk_live_51Mc3WmIYsn5WJ3XKwrOx7N6Q6mIFgJ3yrFrN0bV1d6kThEiHoBnJGzC8VU6zZrJL4gEjwlR3C1iBvmLJUhKVnlNE00HfJVQBFO') : null;

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inizializzazione app...');
    renderProducts();
    updateCartDisplay();
    setMinPickupDate();
    attachEventListeners();
    console.log('✅ App inizializzata correttamente');
});

// Render dei prodotti
function renderProducts() {
    console.log('📦 Caricamento prodotti...');
    renderProductSection('main-meals', products.mainMeals);
    renderProductSection('breakfast-meals', products.breakfastMeals);
    console.log('✅ Prodotti caricati');
}

function renderProductSection(containerId, productList) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('❌ Container non trovato:', containerId);
        return;
    }
    
    container.innerHTML = productList.map(product => `
        <div class="product-card fade-in">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="product-image" style="display: none;">🍽️</div>
                <div class="price-overlay">${product.price}€</div>
            </div>
            <div class="product-content">
                <h3 class="product-name">${product.name}</h3>
                <div class="quantity-controls">
                    <button class="quantity-btn minus-btn" data-id="${product.id}">−</button>
                    <span class="quantity-display" id="qty-${product.id}">0</span>
                    <button class="quantity-btn plus-btn" data-id="${product.id}">+</button>
                </div>
                <button class="add-button" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                    Aggiungi al Carrello
                </button>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ Sezione ${containerId} caricata con ${productList.length} prodotti`);
}

// Event listeners
function attachEventListeners() {
    console.log('🔗 Collegamento event listeners...');
    
    // Pulsanti quantità
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('minus-btn')) {
            changeQuantity(e.target.dataset.id, -1);
            addHapticFeedback();
        } else if (e.target.classList.contains('plus-btn')) {
            changeQuantity(e.target.dataset.id, 1);
            addHapticFeedback();
        } else if (e.target.classList.contains('add-button')) {
            addToCart(e.target);
        }
    });

    // Carrello floating
    if (floatingCart) {
        floatingCart.addEventListener('click', () => {
            cartModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            renderCartItems();
        });
    }

    // Chiudi modal
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', closeCartModal);
    }
    
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) closeCartModal();
        });
    }

    // Codice promozionale
    const applyPromo = document.getElementById('apply-promo');
    if (applyPromo) {
        applyPromo.addEventListener('click', applyPromoCode);
    }

    // Azioni carrello
    const confirmOrder = document.getElementById('confirm-order');
    if (confirmOrder) {
        confirmOrder.addEventListener('click', confirmOrder);
    }
    
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }

    // Date picker
    const dateInput = document.getElementById('pickup-date');
    const dateWrapper = dateInput?.closest('.date-input-wrapper');
    
    if (dateWrapper) {
        dateWrapper.addEventListener('click', function(e) {
            if (e.target === dateWrapper) {
                if (dateInput.showPicker) {
                    try {
                        dateInput.showPicker();
                    } catch (error) {
                        dateInput.focus();
                    }
                } else {
                    dateInput.focus();
                }
            }
        });
    }

    if (dateInput) {
        dateInput.addEventListener('change', function() {
            const placeholder = document.getElementById('date-placeholder');
            if (placeholder) {
                placeholder.style.opacity = this.value ? '0' : '1';
            }
        });
    }

    // Gestione metodi di pagamento
    const paymentMethods = document.querySelectorAll('.payment-method');
    const orderButton = document.getElementById('confirm-order');
    const orderButtonText = document.getElementById('order-button-text');
    const paypalContainer = document.getElementById('paypal-button-container');
    let currentPaymentMethod = 'cash';
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethods.forEach(m => m.removeAttribute('data-selected'));
            this.setAttribute('data-selected', 'true');
            
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                currentPaymentMethod = radio.value;
            }
            
            if (paypalContainer) paypalContainer.style.display = 'none';
            
            if (orderButtonText) {
                switch(currentPaymentMethod) {
                    case 'stripe':
                        orderButtonText.textContent = '💳 Paga con Carta';
                        break;
                    case 'paypal':
                        orderButtonText.textContent = '🅿️ Seleziona PayPal qui sotto';
                        if (paypalContainer) {
                            paypalContainer.style.display = 'block';
                            setTimeout(() => {
                                if (!paypalContainer.hasChildNodes() || paypalContainer.children.length === 0) {
                                    initPayPal();
                                }
                            }, 500);
                        }
                        break;
                    case 'cash':
                        orderButtonText.textContent = '📱 Invia su WhatsApp';
                        break;
                }
            }
        });
    });

    // Gestione quantità nel modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-minus')) {
            const index = parseInt(e.target.dataset.index);
            if (cart[index] && cart[index].quantity > 0) {
                cart[index].quantity--;
                if (cart[index].quantity === 0) {
                    cart.splice(index, 1);
                }
                saveCart();
                updateCartDisplay();
                renderCartItems();
            }
        } else if (e.target.classList.contains('modal-plus')) {
            const index = parseInt(e.target.dataset.index);
            if (cart[index]) {
                cart[index].quantity++;
                saveCart();
                updateCartDisplay();
                renderCartItems();
            }
        }
    });

    console.log('✅ Event listeners collegati');
}

function changeQuantity(productId, change) {
    if (!quantities[productId]) quantities[productId] = 0;
    quantities[productId] = Math.max(0, quantities[productId] + change);
    const qtyDisplay = document.getElementById(`qty-${productId}`);
    if (qtyDisplay) {
        qtyDisplay.textContent = quantities[productId];
    }
}

function addToCart(button) {
    const productId = button.dataset.id;
    const quantity = quantities[productId] || 0;

    if (quantity === 0) {
        showToast('Seleziona una quantità prima di aggiungere al carrello', 'error');
        return;
    }

    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: button.dataset.name,
            price: parseFloat(button.dataset.price),
            quantity: quantity
        });
    }

    // Reset quantità locale
    quantities[productId] = 0;
    const qtyDisplay = document.getElementById(`qty-${productId}`);
    if (qtyDisplay) {
        qtyDisplay.textContent = '0';
    }

    // Effetto visivo
    button.classList.add('pulse');
    setTimeout(() => button.classList.remove('pulse'), 600);

    saveCart();
    updateCartDisplay();
    showToast(`${button.dataset.name} aggiunto al carrello!`);
}

function updateCartDisplay() {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * appliedDiscount) / 100;
    const total = subtotal - discountAmount;

    // Aggiorna contatori
    if (cartCounter) cartCounter.textContent = totalQuantity;
    if (totalItems) totalItems.textContent = totalQuantity;
    if (cartTotal) cartTotal.textContent = `${total.toFixed(2)}€`;
    if (modalTotal) modalTotal.textContent = `${total.toFixed(2)}€`;

    // Mostra/nascondi carrello floating
    if (floatingCart) {
        if (totalQuantity > 0) {
            floatingCart.classList.add('visible');
        } else {
            floatingCart.classList.remove('visible');
        }
    }

    // Aggiorna display sconto
    if (discountDisplay) {
        if (appliedDiscount > 0) {
            discountDisplay.innerHTML = `
                <div class="discount-line">
                    Sconto ${discountCode} (-${appliedDiscount}%): -${discountAmount.toFixed(2)}€
                </div>
            `;
        } else {
            discountDisplay.innerHTML = '';
        }
    }
}

function renderCartItems() {
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 2rem;">Il carrello è vuoto</div>';
        return;
    }

    cartItems.innerHTML = cart.map((item, index) => {
        if (item.quantity === 0) return '';
        return `
            <div class="cart-item">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${item.price}€ × ${item.quantity} = ${(item.price * item.quantity).toFixed(2)}€</div>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn modal-minus" data-index="${index}">−</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn modal-plus" data-index="${index}">+</button>
                </div>
            </div>
        `;
    }).join('');
}

function applyPromoCode() {
    const promoInput = document.getElementById('promo-code');
    const messageDiv = document.getElementById('promo-message');
    
    if (!promoInput || !messageDiv) return;
    
    const code = promoInput.value.toUpperCase().trim();

    if (!code) {
        messageDiv.innerHTML = '<div class="promo-error">Inserisci un codice promozionale</div>';
        return;
    }

    if (promoCodes[code]) {
        appliedDiscount = promoCodes[code];
        discountCode = code;
        messageDiv.innerHTML = `<div class="promo-success">✅ Codice applicato! Sconto del ${appliedDiscount}%</div>`;
        updateCartDisplay();
        showToast(`Sconto del ${appliedDiscount}% applicato!`);
    } else {
        messageDiv.innerHTML = '<div class="promo-error">❌ Codice non valido</div>';
        showToast('Codice promozionale non valido', 'error');
    }
}

function setMinPickupDate() {
    const dateInput = document.getElementById('pickup-date');
    if (!dateInput) return;
    
    const today = new Date();
    today.setDate(today.getDate() + 2);
    const minDate = today.toISOString().split('T')[0];
    dateInput.min = minDate;
}

function confirmOrder() {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const pickupDate = document.getElementById('pickup-date')?.value;
    const customerName = document.getElementById('customer-name')?.value;
    const confirmButton = document.getElementById('confirm-order');
    const spinner = document.getElementById('loading-spinner');

    // Validazioni
    if (totalQuantity < 4) {
        showToast('Errore: Il minimo d\'ordine è 4 pezzi a scelta', 'error');
        return;
    }

    if (!customerName || !pickupDate) {
        showToast('Errore: Compila tutti i campi obbligatori', 'error');
        return;
    }

    const selectedDate = new Date(pickupDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2);

    if (selectedDate < minDate) {
        showToast('Errore: La data di ritiro deve essere almeno due giorni dopo oggi', 'error');
        return;
    }

    // Loading state
    if (confirmButton) confirmButton.classList.add('loading');
    if (spinner) spinner.style.display = 'block';

    // Ottieni il metodo di pagamento corrente
    const currentPaymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'cash';

    // Simula processo ordine
    setTimeout(() => {
        switch(currentPaymentMethod) {
            case 'stripe':
                processStripePayment();
                break;
            case 'paypal':
                showToast('Usa il bottone PayPal qui sopra per completare il pagamento', 'error');
                break;
            case 'cash':
                handleCashOrder();
                break;
        }
        if (confirmButton) confirmButton.classList.remove('loading');
        if (spinner) spinner.style.display = 'none';
    }, 1500);
}

// Funzione per gestire pagamento Stripe
async function processStripePayment() {
    if (!stripe) {
        showToast('Errore: Sistema di pagamento non disponibile', 'error');
        return;
    }

    const customerName = document.getElementById('customer-name')?.value;
    const pickupDate = document.getElementById('pickup-date')?.value;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * appliedDiscount) / 100;
    const finalTotal = subtotal - discountAmount;

    try {
        const orderData = {
            customerName: customerName,
            pickupDate: pickupDate,
            amount: finalTotal,
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            success_url: window.location.origin + '/success.html',
            cancel_url: window.location.href
        };

        const response = await fetch('stripe-checkout.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        const session = await response.json();

        if (response.ok && session.id) {
            const result = await stripe.redirectToCheckout({
                sessionId: session.id
            });

            if (result.error) {
                showToast('Errore durante il pagamento: ' + result.error.message, 'error');
            }
        } else {
            throw new Error(session.error || 'Errore durante la creazione della sessione di pagamento');
        }

    } catch (error) {
        console.error('Errore Stripe:', error);
        showToast('Errore durante il pagamento. Riprova o scegli un altro metodo.', 'error');
    }
}

// Inizializza PayPal
function initPayPal() {
    console.log('Inizializzando PayPal...');
    const container = document.getElementById('paypal-button-container');
    
    if (!container || typeof paypal === 'undefined') {
        console.error('PayPal non disponibile');
        return;
    }
    
    container.innerHTML = '';
    
    paypal.Buttons({
        style: {
            color: 'blue',
            shape: 'rect',
            height: 40
        },
        createOrder: function(data, actions) {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const discountAmount = (subtotal * appliedDiscount) / 100;
            const total = subtotal - discountAmount;
            
            if (total <= 0) {
                alert('Carrello vuoto!');
                return Promise.reject('Carrello vuoto');
            }
            
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: total.toFixed(2),
                        currency_code: 'EUR'
                    },
                    description: 'Ordine Pasto Sano'
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                console.log('Pagamento PayPal completato:', details);
                handleSuccessfulPayment('paypal', details);
            });
        },
        onError: function(err) {
            console.error('Errore PayPal:', err);
            showToast('Errore durante il pagamento PayPal.', 'error');
        }
    }).render('#paypal-button-container').then(() => {
        console.log('✅ Bottoni PayPal renderizzati!');
        container.style.display = 'block';
    });
}

function handleSuccessfulPayment(method, details) {
    showToast(`Pagamento ${method} completato con successo! 🎉`);
    
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        saveOrderToFirebase(method, details);
    }
    
    setTimeout(() => {
        clearCart();
        closeCartModal();
        window.location.href = 'success.html';
    }, 2000);
}

function handleCashOrder() {
    if (cart.length === 0) {
        showToast('Aggiungi prodotti al carrello!', 'error');
        return;
    }
    
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/393478881515?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        saveOrderToFirebase('cash');
    }
    
    setTimeout(() => {
        closeCartModal();
        showToast('Ordine inviato su WhatsApp! 📱');
        if (confirm('Ordine inviato! Vuoi svuotare il carrello?')) {
            clearCart();
        }
    }, 1000);
}

function generateWhatsAppMessage() {
    const customerName = document.getElementById('customer-name')?.value || 'Cliente';
    const pickupDate = document.getElementById('pickup-date')?.value || 'Da definire';
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const discountAmount = (subtotal * appliedDiscount) / 100;
    const finalTotal = subtotal - discountAmount;
    
    let message = `🍽️ *Nuovo Ordine Pasto Sano*\n\n`;
    message += `👤 Nome: ${customerName}\n`;
    message += `📅 Data ritiro: ${pickupDate}\n`;
    message += `💵 Pagamento: Contanti alla consegna\n\n`;
    
    if (cart.length > 0) {
        message += `📋 *Dettagli Ordine:*\n`;
        cart.forEach(item => {
            const itemTotal = (item.quantity * item.price).toFixed(2);
            message += `• ${item.name}\n`;
            message += `  Quantità: ${item.quantity} x ${item.price}€ = ${itemTotal}€\n\n`;
        });
        
        message += `📦 Totale Articoli: ${totalQuantity}\n`;
        
        if (appliedDiscount > 0) {
            message += `💰 Subtotale: ${subtotal.toFixed(2)}€\n`;
            message += `🎁 Sconto ${discountCode} (-${appliedDiscount}%): -${discountAmount.toFixed(2)}€\n`;
            message += `💰 Totale Finale: ${finalTotal.toFixed(2)}€\n\n`;
        } else {
            message += `💰 Totale Ordine: ${subtotal.toFixed(2)}€\n\n`;
        }
    }
    
    message += `📱 Grazie per il tuo ordine!\nTi ricontatteremo per confermare i dettagli.`;
    return message;
}

async function saveOrderToFirebase(paymentMethod, paymentDetails = null) {
    try {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.log('Firebase non disponibile');
            return;
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        const discountAmount = (subtotal * appliedDiscount) / 100;
        const finalTotal = subtotal - discountAmount;

        const orderData = {
            customerName: document.getElementById('customer-name')?.value || 'Cliente',
            pickupDate: document.getElementById('pickup-date')?.value,
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            })),
            totalItems: totalQuantity,
            subtotalAmount: subtotal,
            discountCode: discountCode || null,
            discountPercent: appliedDiscount || 0,
            discountAmount: discountAmount || 0,
            totalAmount: finalTotal,
            paymentMethod: paymentMethod,
            paymentDetails: paymentDetails,
            status: paymentMethod === 'cash' ? 'pending' : 'paid',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            source: 'website'
        };

        const docRef = await firebase.firestore().collection('orders').add(orderData);
        console.log('✅ Ordine salvato su Firebase con ID:', docRef.id);
        
    } catch (error) {
        console.error('❌ Errore salvataggio Firebase:', error);
    }
}

function clearCart() {
    cart = [];
    appliedDiscount = 0;
    discountCode = '';
    quantities = {};
    
    const promoInput = document.getElementById('promo-code');
    const promoMessage = document.getElementById('promo-message');
    const pickupDate = document.getElementById('pickup-date');
    const customerName = document.getElementById('customer-name');
    
    if (promoInput) promoInput.value = '';
    if (promoMessage) promoMessage.innerHTML = '';
    if (pickupDate) pickupDate.value = '';
    if (customerName) customerName.value = '';

    document.querySelectorAll('.quantity-display').forEach(display => {
        if (display.id && display.id.startsWith('qty-')) {
            display.textContent = '0';
        }
    });

    saveCart();
    updateCartDisplay();
    renderCartItems();
    showToast('Carrello svuotato');
}

function closeCartModal() {
    if (cartModal) cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function saveCart() {
    localStorage.setItem('pastoSanoCart', JSON.stringify(cart));
}

function showToast(message, type = 'success') {
    if (!toast) return;
    
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#dc3545' : '#28a745';
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function addHapticFeedback() {
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

window.addEventListener('beforeunload', () => {
    saveCart();
});

function updateFloatingCartPosition() {
    if (!floatingCart) return;
    
    const isMobile = window.innerWidth <= 480;
    if (isMobile && cart.length > 0) {
        floatingCart.style.position = 'fixed';
        floatingCart.style.bottom = '0';
        floatingCart.style.left = '0';
        floatingCart.style.right = '0';
        floatingCart.style.borderRadius = '20px 20px 0 0';
    } else {
        floatingCart.style.position = 'fixed';
        floatingCart.style.bottom = '2rem';
        floatingCart.style.right = '2rem';
        floatingCart.style.left = 'auto';
        floatingCart.style.borderRadius = '50px';
    }
}

window.addEventListener('resize', updateFloatingCartPosition);
updateFloatingCartPosition();

// Lazy loading per le immagini
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.add('fade-in');
            observer.unobserve(img);
        }
    });
});

// Osserva tutte le immagini quando vengono caricate
setTimeout(() => {
    document.querySelectorAll('.product-image').forEach(img => {
        imageObserver.observe(img);
    });
}, 100);

console.log('🎉 Script caricato completamente!');