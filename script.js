// Sistema carrello completo
let cart = [];
let cartTotal = 0;

function getTotalAmount() {
    return cartTotal;
}

function getCartItems() {
    return cart;
}

function updateCartDisplay() {
    const cartCounter = document.getElementById('cart-counter');
    const cartTotalElement = document.getElementById('cart-total');
    const modalTotal = document.getElementById('modal-total');
    const totalItems = document.getElementById('total-items');
    const cartItemsContainer = document.getElementById('cart-items');

    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCounter.textContent = itemCount;
    cartTotalElement.textContent = cartTotal.toFixed(2) + '€';
    modalTotal.textContent = cartTotal.toFixed(2) + '€';
    totalItems.textContent = itemCount;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 2rem;">Il carrello è vuoto</div>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
                <div>
                    <div style="font-weight: 600; color: #2d5a2d;">${item.name}</div>
                    <div style="color: #6c757d; font-size: 0.9rem;">${item.price}€ x ${item.quantity} = ${(item.price * item.quantity).toFixed(2)}€</div>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button onclick="updateQuantity('${item.id}', -1)" style="background: #dc3545; color: white; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer;">-</button>
                    <span style="font-weight: 600;">${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', 1)" style="background: #7a9e7e; color: white; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer;">+</button>
                </div>
            </div>
        `).join('');
    }
}

function addToCart(name, price) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    updateCartDisplay();
    showToast(`${name} aggiunto al carrello!`);
}

function updateQuantity(itemId, change) {
    const item = cart.find(item => item.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(item => item.id !== itemId);
        }
    }
    
    cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    updateCartDisplay();
}

function clearCart() {
    cart = [];
    cartTotal = 0;
    updateCartDisplay();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.background = '#7a9e7e';
    toast.style.color = 'white';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function generateProducts() {
    const products = [
        { 
            name: "FUSILLI, MACINATO MANZO, ZUCCHINE, MELANZANE", 
            price: 8,
            image: "fusilli-macinato-zucchine-melanzane.jpg"
        },
        { 
            name: "ROASTBEEF, PATATE AL FORNO, FAGIOLINI", 
            price: 8,
            image: "roastbeef-patatealforno-fagiolini.jpg"
        },
        { 
            name: "RISO, HAMBURGER MANZO, CAROTINE BABY", 
            price: 8,
            image: "risobasmati-hamburgermanzo-carotine.jpg"
        },
        { 
            name: "RISO NERO, GAMBERI, TONNO, PISELLI", 
            price: 8,
            image: "riso nero-gamberi-tonno-piselli.jpg"
        },
        { 
            name: "PATATE, SALMONE GRIGLIATO, BROCCOLI", 
            price: 8,
            image: "salmonegrigliato-patatealforno-broccoli.jpg"
        },
        { 
            name: "POLLO GRIGLIATO, PATATE AL FORNO, ZUCCHINE", 
            price: 8,
            image: "pollogrigliato-patatealforno-zucchine.jpg"
        }
    ];

    const breakfastProducts = [
        { 
            name: "ORZO, CECI, FETA, POMODORINI, BASILICO", 
            price: 6,
            image: "orzo-ceci-feta-pomodorini-basilico.jpg"
        },
        { 
            name: "PANCAKES", 
            price: 6,
            image: "pancakes.jpg"
        }
    ];

    const container = document.getElementById('main-meals');
    if (container) {
        container.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" 
                         style="width: 100%; height: 200px; object-fit: cover;"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='🍽️'; this.parentElement.style.display='flex'; this.parentElement.style.alignItems='center'; this.parentElement.style.justifyContent='center'; this.parentElement.style.fontSize='3rem';">
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-footer">
                        <span class="product-price">${product.price}€</span>
                        <button onclick="addToCart('${product.name}', ${product.price})" class="add-to-cart-btn">Aggiungi al Carrello</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Genera colazioni
    const breakfastContainer = document.getElementById('breakfast-meals');
    if (breakfastContainer) {
        breakfastContainer.innerHTML = breakfastProducts.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" 
                         style="width: 100%; height: 200px; object-fit: cover;"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='☕'; this.parentElement.style.display='flex'; this.parentElement.style.alignItems='center'; this.parentElement.style.justifyContent='center'; this.parentElement.style.fontSize='3rem';">
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-footer">
                        <span class="product-price">${product.price}€</span>
                        <button onclick="addToCart('${product.name}', ${product.price})" class="add-to-cart-btn">Aggiungi al Carrello</button>
                    </div>
                </div>
            </div>
        `).join('');
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
            const total = getTotalAmount();
            console.log('Creando ordine PayPal per:', total);
            
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
            alert('Errore durante il pagamento PayPal.');
        }
    }).render('#paypal-button-container').then(() => {
        console.log('✅ Bottoni PayPal renderizzati!');
        container.style.display = 'block';
    });
}

function handleSuccessfulPayment(method, details) {
    alert(`Pagamento ${method} completato con successo!`);
    document.getElementById('cart-modal').style.display = 'none';
    clearCart();
    showToast(`Pagamento completato! 🎉`);
}

function handleCashOrder() {
    if (cart.length === 0) {
        alert('Aggiungi prodotti al carrello!');
        return;
    }
    
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/393478881515?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => {
        document.getElementById('cart-modal').style.display = 'none';
        showToast('Ordine inviato su WhatsApp! 📱');
        if (confirm('Ordine inviato! Vuoi svuotare il carrello?')) {
            clearCart();
        }
    }, 1000);
}

function generateWhatsAppMessage() {
    const customerName = document.getElementById('customer-name')?.value || 'Cliente';
    const pickupDate = document.getElementById('pickup-date')?.value || 'Da definire';
    
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
        message += `💰 *Totale Ordine: ${cartTotal.toFixed(2)}€*\n\n`;
    }
    
    message += `📱 Grazie per il tuo ordine!\nTi ricontatteremo per confermare i dettagli.`;
    return message;
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    generateProducts();
    
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
    
    if (orderButton) {
        orderButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const customerName = document.getElementById('customer-name')?.value;
            const pickupDate = document.getElementById('pickup-date')?.value;
            
            if (!customerName || !pickupDate) {
                alert('Compila tutti i campi obbligatori');
                return;
            }
            
            if (cart.length === 0) {
                alert('Aggiungi almeno un prodotto al carrello');
                return;
            }
            
            const spinner = document.getElementById('loading-spinner');
            if (spinner) spinner.style.display = 'inline-block';
            orderButton.disabled = true;
            
            try {
                switch(currentPaymentMethod) {
                    case 'paypal':
                        alert('Usa il bottone PayPal qui sopra per completare il pagamento');
                        break;
                    case 'cash':
                        handleCashOrder();
                        break;
                }
            } catch (error) {
                console.error('Errore:', error);
                alert('Errore durante il pagamento. Riprova.');
            } finally {
                if (spinner) spinner.style.display = 'none';
                orderButton.disabled = false;
            }
        });
    }
    
    // Gestione carrello floating
    const floatingCart = document.getElementById('floating-cart');
    const cartModal = document.getElementById('cart-modal');
    const closeCart = document.getElementById('close-cart');
    const clearCartBtn = document.getElementById('clear-cart');
    
    if (floatingCart && cartModal) {
        floatingCart.addEventListener('click', function() {
            cartModal.style.display = 'flex';
        });
    }
    
    if (closeCart && cartModal) {
        closeCart.addEventListener('click', function() {
            cartModal.style.display = 'none';
        });
    }
    
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('Sei sicuro di voler svuotare il carrello?')) {
                clearCart();
            }
        });
    }
    
    if (cartModal) {
        cartModal.addEventListener('click', function(e) {
            if (e.target === cartModal) {
                cartModal.style.display = 'none';
            }
        });
    }
});