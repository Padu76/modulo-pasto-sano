// script-enhanced.js
// Importa Firebase functions
import { saveOrder } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const mealItems = document.querySelectorAll('.meal-item');
    const cartItemsList = document.getElementById('cart-items');
    const totalPriceSpan = document.getElementById('total-price');
    const totalItemsSpan = document.getElementById('total-items');
    const submitOrderButton = document.getElementById('submit-order');
    const pickupDateInput = document.getElementById('pickup-date');
    const orderMessage = document.getElementById('order-message');

    let cart = [];
    let appliedDiscount = 0;
    let discountCode = '';

    // CODICI PROMOZIONALI
    const promoCodes = {
        'PRIMAVERA10': 10,
        'ESTATE15': 15,
        'BENVENUTO5': 5,
        'SCONTO20': 20
    };

    function updateCartDisplay() {
        cartItemsList.innerHTML = '';
        let subtotal = 0;
        let totalQuantity = 0;

        cart.forEach(item => {
            if (item.quantity > 0) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${item.name} (x${item.quantity})</span>
                    <span>${(item.price * item.quantity).toFixed(2)}€</span>
                `;
                cartItemsList.appendChild(li);
                subtotal += item.price * item.quantity;
                totalQuantity += item.quantity;
            }
        });

        // Applica sconto
        const discountAmount = (subtotal * appliedDiscount) / 100;
        const total = subtotal - discountAmount;

        if (appliedDiscount > 0) {
            document.getElementById('discount-line').style.display = 'block';
            document.getElementById('discount-line').textContent = `Sconto ${discountCode} (-${appliedDiscount}%): -${discountAmount.toFixed(2)}€`;
        } else {
            document.getElementById('discount-line').style.display = 'none';
        }

        totalPriceSpan.textContent = `${total.toFixed(2)}€`;
        totalItemsSpan.textContent = totalQuantity;
    }

    // GESTIONE PULSANTI +/-
    mealItems.forEach(item => {
        const minusBtn = item.querySelector('.minus-btn');
        const plusBtn = item.querySelector('.plus-btn');
        const quantityDisplay = item.querySelector('.quantity-display');
        const addButton = item.querySelector('.add-to-cart');
        let quantity = 0;

        minusBtn.addEventListener('click', () => {
            if (quantity > 0) {
                quantity--;
                quantityDisplay.textContent = quantity;
            }
        });

        plusBtn.addEventListener('click', () => {
            quantity++;
            quantityDisplay.textContent = quantity;
        });

        addButton.addEventListener('click', () => {
            if (quantity > 0) {
                const id = item.dataset.id;
                const name = item.querySelector('h3').textContent;
                const price = parseFloat(item.dataset.price);

                const existingItemIndex = cart.findIndex(cartItem => cartItem.id === id);

                if (existingItemIndex > -1) {
                    cart[existingItemIndex].quantity += quantity;
                } else {
                    cart.push({ id, name, price, quantity });
                }
                
                updateCartDisplay();
                quantity = 0;
                quantityDisplay.textContent = quantity;
            } else {
                alert('Seleziona una quantità prima di aggiungere al carrello.');
            }
        });
    });

    // GESTIONE CODICI PROMOZIONALI
    document.getElementById('apply-promo').addEventListener('click', () => {
        const code = document.getElementById('promo-code').value.toUpperCase().trim();
        const messageDiv = document.getElementById('promo-message');
        
        if (promoCodes[code]) {
            appliedDiscount = promoCodes[code];
            discountCode = code;
            messageDiv.innerHTML = `<div class="promo-success">✅ Codice applicato! Sconto del ${appliedDiscount}%</div>`;
            updateCartDisplay();
        } else if (code === '') {
            messageDiv.innerHTML = `<div class="promo-error">Inserisci un codice promozionale</div>`;
        } else {
            messageDiv.innerHTML = `<div class="promo-error">❌ Codice non valido</div>`;
        }
    });

    function setMinPickupDate() {
        const today = new Date();
        today.setDate(today.getDate() + 2);

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        pickupDateInput.min = `${year}-${month}-${day}`;
    }
    setMinPickupDate();

    // SVUOTA CARRELLO
    const clearCartButton = document.getElementById('clear-cart');
    clearCartButton.addEventListener('click', () => {
        cart = [];
        appliedDiscount = 0;
        discountCode = '';
        document.getElementById('promo-code').value = '';
        document.getElementById('promo-message').innerHTML = '';
        updateCartDisplay();
        pickupDateInput.value = '';
        orderMessage.style.display = 'none';

        // Reset quantità nei controlli
        document.querySelectorAll('.quantity-display').forEach(display => display.textContent = '0');
    });

    // POPUP DATI CLIENTE
    function showCustomerForm() {
        const popup = document.getElementById('customer-popup');
        popup.style.display = 'block';
    }

    // POPUP RIEPILOGATIVO
    function showSummaryPopup() {
        const popup = document.getElementById('summary-popup');
        const popupItems = document.getElementById('popup-items');
        const popupTotal = document.getElementById('popup-total');
        
        popupItems.innerHTML = '';
        
        cart.forEach((item, index) => {
            if (item.quantity > 0) {
                const popupItem = document.createElement('div');
                popupItem.className = 'popup-item';
                popupItem.innerHTML = `
                    <div class="popup-item-name">${item.name}</div>
                    <div class="popup-quantity-controls">
                        <button class="quantity-btn popup-minus" data-index="${index}">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn popup-plus" data-index="${index}">+</button>
                    </div>
                    <div>${(item.price * item.quantity).toFixed(2)}€</div>
                `;
                popupItems.appendChild(popupItem);
            }
        });

        // Calcola totale con sconto
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = (subtotal * appliedDiscount) / 100;
        const total = subtotal - discountAmount;

        let totalText = `Totale: ${total.toFixed(2)}€`;
        if (appliedDiscount > 0) {
            totalText = `Subtotale: ${subtotal.toFixed(2)}€<br>Sconto ${discountCode} (-${appliedDiscount}%): -${discountAmount.toFixed(2)}€<br><strong>Totale: ${total.toFixed(2)}€</strong>`;
        }
        popupTotal.innerHTML = totalText;

        popup.style.display = 'block';
    }

    // GESTIONE POPUP QUANTITÀ
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup-minus')) {
            const index = parseInt(e.target.dataset.index);
            if (cart[index].quantity > 0) {
                cart[index].quantity--;
                updateCartDisplay();
                showSummaryPopup();
            }
        }
        
        if (e.target.classList.contains('popup-plus')) {
            const index = parseInt(e.target.dataset.index);
            cart[index].quantity++;
            updateCartDisplay();
            showSummaryPopup();
        }
    });

    // CHIUDI POPUP
    document.getElementById('close-popup').addEventListener('click', () => {
        document.getElementById('summary-popup').style.display = 'none';
    });

    document.getElementById('close-customer-popup').addEventListener('click', () => {
        document.getElementById('customer-popup').style.display = 'none';
    });

    document.getElementById('summary-popup').addEventListener('click', (e) => {
        if (e.target.id === 'summary-popup') {
            document.getElementById('summary-popup').style.display = 'none';
        }
    });

    document.getElementById('customer-popup').addEventListener('click', (e) => {
        if (e.target.id === 'customer-popup') {
            document.getElementById('customer-popup').style.display = 'none';
        }
    });

    // CONFERMA ORDINE DAL POPUP
    document.getElementById('confirm-order').addEventListener('click', () => {
        document.getElementById('summary-popup').style.display = 'none';
        showCustomerForm();
    });

    // CONFERMA DATI CLIENTE
    document.getElementById('confirm-customer').addEventListener('click', async () => {
        const customerName = document.getElementById('customer-name').value.trim();
        const customerPhone = document.getElementById('customer-phone').value.trim();
        const customerEmail = document.getElementById('customer-email').value.trim();
        const orderNotes = document.getElementById('order-notes').value.trim();

        if (!customerName || !customerPhone) {
            alert('Nome e telefono sono obbligatori');
            return;
        }

        document.getElementById('customer-popup').style.display = 'none';
        await processOrderWithCustomerData(customerName, customerPhone, customerEmail, orderNotes);
    });

    // NOTIFICA
    function showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // PROCESSAMENTO ORDINE CON DATI CLIENTE
    async function processOrderWithCustomerData(customerName, customerPhone, customerEmail, orderNotes) {
        const totalQuantity = parseInt(totalItemsSpan.textContent);
        const pickupDate = pickupDateInput.value;

        if (totalQuantity < 4) {
            orderMessage.style.display = 'block';
            orderMessage.style.backgroundColor = '#f8d7da';
            orderMessage.style.color = '#721c24';
            orderMessage.textContent = 'Errore: Il minimo d\'ordine è 4 pezzi a scelta.';
            return;
        }

        if (!pickupDate) {
            orderMessage.style.display = 'block';
            orderMessage.style.backgroundColor = '#f8d7da';
            orderMessage.style.color = '#721c24';
            orderMessage.textContent = 'Errore: Seleziona una data di ritiro.';
            return;
        }

        const selectedDate = new Date(pickupDate);
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 2);

        selectedDate.setHours(0,0,0,0);
        minDate.setHours(0,0,0,0);

        if (selectedDate < minDate) {
            orderMessage.style.display = 'block';
            orderMessage.style.backgroundColor = '#f8d7da';
            orderMessage.style.color = '#721c24';
            orderMessage.textContent = 'Errore: La data di ritiro deve essere almeno due giorni dopo la data odierna.';
            return;
        }

        orderMessage.style.display = 'block';
        orderMessage.style.backgroundColor = '#d4edda';
        orderMessage.style.color = '#155724';
        
        // Calcola totali
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = (subtotal * appliedDiscount) / 100;
        const total = subtotal - discountAmount;

        // SALVATAGGIO IN FIREBASE
        try {
            const orderData = {
                customerName: customerName,
                customerPhone: customerPhone,
                customerEmail: customerEmail,
                items: cart.filter(item => item.quantity > 0),
                totalItems: totalQuantity,
                subtotal: subtotal,
                appliedDiscount: appliedDiscount,
                discountCode: discountCode,
                totalAmount: total,
                pickupDate: pickupDate,
                orderNotes: orderNotes
            };

            const orderId = await saveOrder(orderData);
            console.log('✅ Ordine salvato in Firebase:', orderId);
            
        } catch (error) {
            console.error('❌ Errore salvataggio Firebase:', error);
            // Continua comunque con WhatsApp
        }
        
        // Costruisci messaggio WhatsApp
        let orderDetails = "🎉 Nuovo Ordine Pasto Sano! 🎉\n\n";
        orderDetails += "👤 DATI CLIENTE:\n";
        orderDetails += `Nome: ${customerName}\n`;
        orderDetails += `Telefono: ${customerPhone}\n`;
        if (customerEmail) orderDetails += `Email: ${customerEmail}\n`;
        orderDetails += "\n📦 DETTAGLI ORDINE:\n";
        orderDetails += "-----------------------------------\n";
        
        cart.forEach(item => {
            if (item.quantity > 0) {
                orderDetails += `• ${item.name}\n  Quantità: ${item.quantity}\n  Costo: ${(item.price * item.quantity).toFixed(2)}€\n`;
            }
        });
        
        orderDetails += "-----------------------------------\n";
        orderDetails += `📦 Totale Articoli: ${totalQuantity}\n`;
        
        if (appliedDiscount > 0) {
            orderDetails += `💰 Subtotale: ${subtotal.toFixed(2)}€\n`;
            orderDetails += `🎁 Sconto ${discountCode} (-${appliedDiscount}%): -${discountAmount.toFixed(2)}€\n`;
            orderDetails += `💰 Totale Finale: ${total.toFixed(2)}€\n`;
        } else {
            orderDetails += `💰 Totale Ordine: ${total.toFixed(2)}€\n`;
        }
        
        orderDetails += `🗓️ Data di Ritiro: ${pickupDate}\n`;
        
        if (orderNotes) {
            orderDetails += `📝 Note: ${orderNotes}\n`;
        }
        
        orderDetails += "-----------------------------------\n";
        orderDetails += "Si prega di confermare la disponibilità. Grazie!";

        const encodedMessage = encodeURIComponent(orderDetails);
        const phoneNumber = "+393478881515"; // CAMBIA CON IL TUO NUMERO
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        orderMessage.innerHTML = `Ordine preparato con successo!<br><strong>${customerName}</strong><br>Totale: ${total.toFixed(2)}€<br>Data di ritiro: ${pickupDate}<br><br>`;
        
        const whatsappButton = document.createElement('a');
        whatsappButton.href = whatsappLink;
        whatsappButton.target = "_blank";
        whatsappButton.className = "whatsapp-send-button"; 
        whatsappButton.textContent = "📱 Invia Ordine su WhatsApp";
        
        // Aggiungi evento click per notifica
        whatsappButton.addEventListener('click', () => {
            setTimeout(() => {
                showNotification('✅ Ordine inviato con successo! Salvato in database.');
            }, 500);
        });
        
        orderMessage.appendChild(whatsappButton);

        // Svuota carrello e form dopo l'ordine
        cart = [];
        appliedDiscount = 0;
        discountCode = '';
        document.getElementById('promo-code').value = '';
        document.getElementById('promo-message').innerHTML = '';
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('customer-email').value = '';
        document.getElementById('order-notes').value = '';
        updateCartDisplay();
        pickupDateInput.value = '';
        document.querySelectorAll('.quantity-display').forEach(display => display.textContent = '0');
    }

    // PULSANTE PROCEDI ALL'ORDINE (mostra popup)
    submitOrderButton.addEventListener('click', () => {
        const totalQuantity = parseInt(totalItemsSpan.textContent);
        
        if (totalQuantity === 0) {
            alert('Aggiungi almeno un prodotto al carrello prima di procedere.');
            return;
        }
        
        showSummaryPopup();
    });
});