// SOSTITUISCI la funzione processOrder nel tuo pasto_sano_js.js
// TROVA questa parte e sostituiscila:

async function processOrder() {
    const totalQuantity = parseInt(totalItemsSpan.textContent);
    const pickupDate = pickupDateInput.value;
    const customerName = document.getElementById('customer-name').value.trim(); // NUOVO!

    // Validazione nome cliente
    if (!customerName) {
        orderMessage.style.display = 'block';
        orderMessage.style.backgroundColor = '#f8d7da';
        orderMessage.style.color = '#721c24';
        orderMessage.textContent = 'Errore: Inserisci il tuo nome.';
        const existingWhatsappButton = orderMessage.querySelector('.whatsapp-send-button');
        if (existingWhatsappButton) {
            existingWhatsappButton.remove();
        }
        return;
    }

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
    
    // SALVATAGGIO IN FIREBASE CORRETTO CON NOME REALE
    try {
        // Usa il nome inserito dall'utente
        const customerInfo = {
            customerName: customerName, // NOME REALE dall'input!
            customerPhone: 'Da WhatsApp', // Verrà dal numero WhatsApp
            from: 'web-order'
        };
        
        // Preparazione dati ordine per Firebase
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = (subtotal * appliedDiscount) / 100;
        const totalAmount = subtotal - discountAmount;
        
        const orderData = {
            // DATI CLIENTE CON NOME REALE
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
            source: 'web',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'nuovo',
            
            // DATI AGGIUNTIVI
            processedAt: new Date().toISOString(),
            webhookData: {
                originalMessage: `Ordine web da ${customerName}`,
                fromWhatsApp: false
            }
        };
        
        // Salva su Firebase
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            await db.collection('orders').add(orderData);
            console.log('✅ Ordine salvato su Firebase con nome:', customerName);
        } else {
            console.log('⚠️ Firebase non disponibile, ordine non salvato');
        }
        
    } catch (error) {
        console.error('❌ Errore salvataggio Firebase:', error);
    }
    
    // Costruisci messaggio WhatsApp CON NOME
    let orderDetails = `🎉 Nuovo Ordine Pasto Sano! 🎉\n\n`;
    orderDetails += `👤 Cliente: ${customerName}\n`; // NOME REALE!
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

    orderMessage.innerHTML = `Ordine preparato con successo!<br>Cliente: <strong>${customerName}</strong><br>Totale: ${totalPriceSpan.textContent}<br>Data di ritiro: ${pickupDate}<br><br>`;
    
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
    document.getElementById('customer-name').value = ''; // PULISCI ANCHE IL NOME
    updateCartDisplay();
    pickupDateInput.value = '';
    document.querySelectorAll('.quantity-display').forEach(display => display.textContent = '0');
}