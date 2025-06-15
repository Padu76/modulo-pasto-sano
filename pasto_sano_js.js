// Funzione per estrarre dati cliente da WhatsApp
function extractCustomerDataFromWhatsApp(webhookData) {
    console.log('🔍 Estrazione dati cliente da webhook:', webhookData);
    
    let customerName = 'Cliente';
    let customerPhone = 'N/A';
    let from = null;
    
    // Estrai numero di telefono
    if (webhookData.From) {
        from = webhookData.From;
        customerPhone = webhookData.From.replace('whatsapp:', '').replace('@c.us', '');
        
        // Formatta numero italiano
        if (customerPhone.startsWith('+39')) {
            // Già formattato
        } else if (customerPhone.startsWith('39')) {
            customerPhone = '+' + customerPhone;
        } else if (customerPhone.startsWith('3') || customerPhone.startsWith('0')) {
            customerPhone = '+39' + customerPhone;
        }
    }
    
    // Estrai nome cliente
    if (webhookData.ProfileName && webhookData.ProfileName.trim() !== '') {
        customerName = webhookData.ProfileName.trim();
        console.log('✅ Nome trovato in ProfileName:', customerName);
    } else if (webhookData.Author && webhookData.Author.trim() !== '') {
        customerName = webhookData.Author.trim();
        console.log('✅ Nome trovato in Author:', customerName);
    } else {
        // Fallback: usa ultime cifre del telefono
        const phoneDigits = customerPhone.replace(/[^\d]/g, '');
        if (phoneDigits.length >= 4) {
            customerName = `Cliente ${phoneDigits.slice(-4)}`;
        }
        console.log('⚠️ Nome non trovato, usando fallback:', customerName);
    }
    
    console.log('✅ Dati estratti:', { customerName, customerPhone, from });
    
    return {
        customerName,
        customerPhone,
        from
    };
}

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

    document.getElementById('summary-popup').addEventListener('click', (e) => {
        if (e.target.id === 'summary-popup') {
            document.getElementById('summary-popup').style.display = 'none';
        }
    });

    // CONFERMA ORDINE DAL POPUP
    document.getElementById('confirm-order').addEventListener('click', () => {
        document.getElementById('summary-popup').style.display = 'none';
        processOrder();
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

    // PROCESSAMENTO ORDINE CON FIREBASE CORRETTO
    async function processOrder() {
        const totalQuantity = parseInt(totalItemsSpan.textContent);
        const pickupDate = pickupDateInput.value;

        if (totalQuantity < 4) {
            orderMessage.style.display = 'block';
            orderMessage.style.backgroundColor = '#f8d7da';
            orderMessage.style.color = '#721c24';
            orderMessage.textContent = 'Errore: Il minimo d\'ordine è 4 pezzi a scelta.';
            const existingWhatsappButton = orderMessage.querySelector('.whatsapp-send-button');
            if (existingWhatsappButton) {
                existingWhatsappButton.remove();
            }
            return;
        }

        if (!pickupDate) {
            orderMessage.style.display = 'block';
            orderMessage.style.backgroundColor = '#f8d7da';
            orderMessage.style.color = '#721c24';
            orderMessage.textContent = 'Errore: Seleziona una data di ritiro.';
            const existingWhatsappButton = orderMessage.querySelector('.whatsapp-send-button');
            if (existingWhatsappButton) {
                existingWhatsappButton.remove();
            }
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
            const existingWhatsappButton = orderMessage.querySelector('.whatsapp-send-button');
            if (existingWhatsappButton) {
                existingWhatsappButton.remove();
            }
            return;
        }

        orderMessage.style.display = 'block';
        orderMessage.style.backgroundColor = '#d4edda';
        orderMessage.style.color = '#155724';
        
        // SALVATAGGIO IN FIREBASE CORRETTO
        try {
            // Simula dati webhook per il salvataggio (da sostituire con dati reali quando arriva via WhatsApp)
            const simulatedWebhookData = {
                From: 'whatsapp:+393471234567', // Questo sarà popolato dal webhook reale
                ProfileName: 'Cliente Web', // Questo sarà popolato dal webhook reale
                Body: 'Ordine da web',
                MessageSid: 'web-' + Date.now()
            };
            
            // Estrai dati cliente (quando è un ordine web, usa dati di default)
            const customerInfo = {
                customerName: 'Cliente Web',
                customerPhone: 'N/A',
                from: 'web-order'
            };
            
            // Preparazione dati ordine per Firebase
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const discountAmount = (subtotal * appliedDiscount) / 100;
            const totalAmount = subtotal - discountAmount;
            
            const orderData = {
                // DATI CLIENTE CORRETTI (saranno reali quando arriva da WhatsApp)
                customerName: customerInfo.customerName,
                customerPhone: customerInfo.customerPhone,
                from: customerInfo.from,
                customerEmail: null,
                
                // DATI ORDINE
                items: cart.filter(item => item.quantity > 0),
                totalItems: totalQuantity,
                subtotalAmount: subtotal,
                appliedDiscount: appliedDiscount,
                discountCode: discountCode,
                totalAmount: totalAmount,
                pickupDate: pickupDate,
                
                // METADATA
                source: 'web', // Cambia in 'whatsapp' quando arriva da WhatsApp
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'nuovo',
                
                // DATI AGGIUNTIVI
                processedAt: new Date().toISOString(),
                webhookData: {
                    originalMessage: 'Ordine da web',
                    fromWhatsApp: false
                }
            };
            
            // Salva su Firebase
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                await db.collection('orders').add(orderData);
                console.log('✅ Ordine salvato su Firebase');
            } else {
                console.log('⚠️ Firebase non disponibile, ordine non salvato');
            }
            
        } catch (error) {
            console.error('❌ Errore salvataggio Firebase:', error);
        }
        
        // Costruisci messaggio WhatsApp
        let orderDetails = "🎉 Nuovo Ordine Pasto Sano! 🎉\n\n";
        orderDetails += "Dettagli dell'Ordine:\n";
        orderDetails += "-----------------------------------\n";
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        cart.forEach(item => {
            if (item.quantity > 0) {
                orderDetails += `• ${item.name}\n  Quantità: ${item.quantity}\n  Costo: ${(item.price * item.quantity).toFixed(2)}€\n`;
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
            orderDetails += `💰 Totale Ordine: ${totalPriceSpan.textContent}\n`;
        }
        
        orderDetails += `🗓️ Data di Ritiro Prevista: ${pickupDate}\n`;
        orderDetails += "-----------------------------------\n";
        orderDetails += "Si prega di confermare la disponibilità. Grazie!";

        const encodedMessage = encodeURIComponent(orderDetails);
        const phoneNumber = "+393478881515"; // CAMBIA CON IL TUO NUMERO
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        orderMessage.innerHTML = `Ordine preparato con successo!<br>Totale: ${totalPriceSpan.textContent}<br>Data di ritiro: ${pickupDate}<br><br>`;
        
        const whatsappButton = document.createElement('a');
        whatsappButton.href = whatsappLink;
        whatsappButton.target = "_blank";
        whatsappButton.className = "whatsapp-send-button"; 
        whatsappButton.textContent = "📱 Invia Ordine su WhatsApp";
        
        // Aggiungi evento click per notifica
        whatsappButton.addEventListener('click', () => {
            setTimeout(() => {
                showNotification('✅ Ordine inviato con successo!');
            }, 500);
        });
        
        orderMessage.appendChild(whatsappButton);

        // Svuota carrello dopo l'ordine
        cart = [];
        appliedDiscount = 0;
        discountCode = '';
        document.getElementById('promo-code').value = '';
        document.getElementById('promo-message').innerHTML = '';
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

// WEBHOOK HANDLER (per quando arrivano ordini da WhatsApp)
// Questa funzione sarà chiamata dal tuo sistema di webhook
function handleWhatsAppOrder(webhookData, orderData) {
    console.log('📨 Gestione ordine WhatsApp:', webhookData);
    
    try {
        // Estrai dati cliente reali dal webhook
        const customerInfo = extractCustomerDataFromWhatsApp(webhookData);
        
        // Preparazione dati ordine completo per Firebase
        const completeOrderData = {
            // DATI CLIENTE REALI
            customerName: customerInfo.customerName,
            customerPhone: customerInfo.customerPhone,
            from: customerInfo.from,
            customerEmail: null,
            
            // DATI ORDINE
            items: orderData.items,
            totalItems: orderData.totalItems,
            subtotalAmount: orderData.subtotalAmount,
            appliedDiscount: orderData.appliedDiscount || 0,
            discountCode: orderData.discountCode || '',
            totalAmount: orderData.totalAmount,
            pickupDate: orderData.pickupDate,
            
            // METADATA
            source: 'whatsapp',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'nuovo',
            
            // DATI AGGIUNTIVI
            processedAt: new Date().toISOString(),
            webhookData: {
                originalMessage: webhookData.Body,
                messageId: webhookData.MessageSid,
                fromWhatsApp: true
            }
        };
        
        // Salva su Firebase
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            db.collection('orders').add(completeOrderData)
                .then(docRef => {
                    console.log('✅ Ordine WhatsApp salvato con ID:', docRef.id);
                })
                .catch(error => {
                    console.error('❌ Errore salvataggio ordine WhatsApp:', error);
                });
        }
        
    } catch (error) {
        console.error('❌ Errore gestione ordine WhatsApp:', error);
    }
}