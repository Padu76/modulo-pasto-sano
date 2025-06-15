// Dati dei prodotti
const products = {
    mainMeals: [
        { id: 1, name: "FUSILLI, MACINATO MANZO, ZUCCHINE, MELANZANE", price: 8, image: "fusilli-macinato-zucchine-melanzane.jpg" },
        { id: 2, name: "ROASTBEEF, PATATE AL FORNO, FAGIOLINI", price: 8, image: "roastbeef-patatealforno-fagiolini.jpg" },
        { id: 3, name: "RISO, HAMBURGER MANZO, CAROTINE BABY", price: 8, image: "risobasmati-hamburgermanzo-carotine.jpg" },
        { id: 4, name: "RISO NERO, GAMBERI, TONNO, PISELLI", price: 8, image: "riso nero-gamberi-tonno-piselli.jpg" },
        { id: 5, name: "PATATE, SALMONE GRIGLIATO, BROCCOLI", price: 8, image: "salmonegrigliato-patatealforno-broccoli.jpg" },
        { id: 6, name: "POLLO GRIGLIATO, PATATE AL FORNO, ZUCCHINE", price: 8, image: "pollogrigliato-patatealforno-zucchine.jpg" },
        { id: 7, name: "ORZO, CECI, FETA, POMODORINI, BASILICO", price: 8, image: "orzo-ceci-feta-pomodorini-basilico.jpg" },
        { id: 8, name: "TORTILLAS, TACCHINO AFFUMICATO, HUMMUS CECI, INSALATA", price: 8, image: "tortillas-tacchinoaffumicato-hummusceci-insalata.jpg" },
        { id: 9, name: "TORTILLAS, SALMONE AFFUMICATO, FORMAGGIO SPALMABILE, INSALATA", price: 8, image: "tortillas-salmoneaffumicato-formaggiospalmabile-insalata.jpg" },
        { id: 10, name: "RISO, POLLO AL CURRY, ZUCCHINE", price: 8, image: "risobasmati-polloalcurry-zucchine.jpg" }
    ],
    breakfastMeals: [
        { id: 11, name: "UOVA STRAPAZZATE, BACON, FRUTTI DI BOSCO", price: 6, image: "uovastrapazzate-bacon-fruttidibosco.jpg" },
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

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartDisplay();
    setMinPickupDate();
    attachEventListeners();
});

// Render dei prodotti
function renderProducts() {
    renderProductSection('main-meals', products.mainMeals);
    renderProductSection('breakfast-meals', products.breakfastMeals);
}

function renderProductSection(containerId, productList) {
    const container = document.getElementById(containerId);
    container.innerHTML = productList.map(product => `
        <div class="product-card fade-in">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="product-image" style="display: none;">Immagine non disponibile</div>
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
}

// Event listeners
function attachEventListeners() {
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
    floatingCart.addEventListener('click', () => {
        cartModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        renderCartItems();
    });

    // Chiudi modal
    document.getElementById('close-cart').addEventListener('click', closeCartModal);
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) closeCartModal();
    });

    // Codice promozionale
    document.getElementById('apply-promo').addEventListener('click', applyPromoCode);

    // Azioni carrello
    document.getElementById('confirm-order').addEventListener('click', confirmOrder);
    document.getElementById('clear-cart').addEventListener('click', clearCart);

    // Gestione quantità nel modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-minus')) {
            const index = parseInt(e.target.dataset.index);
            if (cart[index].quantity > 0) {
                cart[index].quantity--;
                saveCart();
                updateCartDisplay();
                renderCartItems();
            }
        } else if (e.target.classList.contains('modal-plus')) {
            const index = parseInt(e.target.dataset.index);
            cart[index].quantity++;
            saveCart();
            updateCartDisplay();
            renderCartItems();
        }
    });
}

function changeQuantity(productId, change) {
    if (!quantities[productId]) quantities[productId] = 0;
    quantities[productId] = Math.max(0, quantities[productId] + change);
    document.getElementById(`qty-${productId}`).textContent = quantities[productId];
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
    document.getElementById(`qty-${productId}`).textContent = '0';

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
    cartCounter.textContent = totalQuantity;
    totalItems.textContent = totalQuantity;
    cartTotal.textContent = `${total.toFixed(2)}€`;
    modalTotal.textContent = `${total.toFixed(2)}€`;

    // Mostra/nascondi carrello floating
    if (totalQuantity > 0) {
        floatingCart.classList.add('visible');
    } else {
        floatingCart.classList.remove('visible');
    }

    // Aggiorna display sconto
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

function renderCartItems() {
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
    const code = document.getElementById('promo-code').value.toUpperCase().trim();
    const messageDiv = document.getElementById('promo-message');

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
    const today = new Date();
    today.setDate(today.getDate() + 2);
    const minDate = today.toISOString().split('T')[0];
    document.getElementById('pickup-date').min = minDate;
}

function confirmOrder() {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const pickupDate = document.getElementById('pickup-date').value;
    const confirmButton = document.getElementById('confirm-order');
    const spinner = document.getElementById('loading-spinner');

    // Validazioni
    if (totalQuantity < 4) {
        showToast('Errore: Il minimo d\'ordine è 4 pezzi a scelta', 'error');
        return;
    }

    if (!pickupDate) {
        showToast('Errore: Seleziona una data di ritiro', 'error');
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
    confirmButton.classList.add('loading');
    spinner.style.display = 'block';

    // Simula processo ordine
    setTimeout(() => {
        processWhatsAppOrder(pickupDate);
        confirmButton.classList.remove('loading');
        spinner.style.display = 'none';
    }, 1500);
}

function processWhatsAppOrder(pickupDate) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

    let orderDetails = "🎉 Nuovo Ordine Pasto Sano! 🎉\n\n";
    orderDetails += "Dettagli dell'Ordine:\n";
    orderDetails += "-----------------------------------\n";

    cart.forEach(item => {
        if (item.quantity > 0) {
            orderDetails += `• ${item.name}\n  Quantità: ${item.quantity}\n  Costo: ${(item.price * item.quantity).toFixed(2)}€\n\n`;
        }
    });

    orderDetails += "-----------------------------------\n";
    orderDetails += `📦 Totale Articoli: ${totalQuantity}\n`;

    if (appliedDiscount > 0) {
        const discountAmount = (subtotal * appliedDiscount) / 100;
        orderDetails += `💰 Subtotale: ${subtotal.toFixed(2)}€\n`;
        orderDetails += `🎁 Sconto ${discountCode} (-${appliedDiscount}%): -${discountAmount.toFixed(2)}€\n`;
        orderDetails += `💰 Totale Finale: ${(subtotal - discountAmount).toFixed(2)}€\n`;
    } else {
        orderDetails += `💰 Totale Ordine: ${subtotal.toFixed(2)}€\n`;
    }

    orderDetails += `🗓️ Data di Ritiro Prevista: ${pickupDate}\n`;
    orderDetails += "-----------------------------------\n";
    orderDetails += "Si prega di confermare la disponibilità. Grazie!";

    const encodedMessage = encodeURIComponent(orderDetails);
    const phoneNumber = "+393478881515"; // CAMBIA CON IL TUO NUMERO
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Apri WhatsApp
    window.open(whatsappLink, '_blank');

    // Reset dopo invio
    setTimeout(() => {
        clearCart();
        closeCartModal();
        showToast('✅ Ordine inviato con successo!');
    }, 1000);
}

function clearCart() {
    cart = [];
    appliedDiscount = 0;
    discountCode = '';
    quantities = {};
    
    // Reset input promozionale
    document.getElementById('promo-code').value = '';
    document.getElementById('promo-message').innerHTML = '';
    document.getElementById('pickup-date').value = '';

    // Reset quantità prodotti
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
    cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function saveCart() {
    localStorage.setItem('pastoSanoCart', JSON.stringify(cart));
}

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast');
    toastEl.textContent = message;
    toastEl.style.background = type === 'error' ? '#dc3545' : '#28a745';
    toastEl.classList.add('show');

    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

function addHapticFeedback() {
    // Vibrazione per dispositivi mobili
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

// Aggiorna carrello quando la pagina viene caricata
window.addEventListener('load', () => {
    renderCartItems();
});

// Auto-save quando l'utente lascia la pagina
window.addEventListener('beforeunload', () => {
    saveCart();
});

// Gestione responsive per floating cart
function updateFloatingCartPosition() {
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