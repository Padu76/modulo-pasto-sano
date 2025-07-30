// TROVA questa sezione nel tuo script.js (intorno alla riga 600-700)
// SOSTITUISCI la funzione PayPal con questa versione corretta:

// PayPal configuration
paypal.Buttons({
    createOrder: function(data, actions) {
        // ⚠️ VALIDAZIONE PRIMA DI PAYPAL - AGGIUNTA
        const customerName = document.getElementById('customer-name').value.trim();
        const customerPhone = document.getElementById('customer-phone').value.trim();
        const pickupDate = document.getElementById('pickup-date').value;
        
        // Controlla campi obbligatori
        if (!customerName || customerName === 'Cliente') {
            showToast('❌ Inserisci il tuo nome completo', 'error');
            return Promise.reject('Nome mancante');
        }
        
        if (!customerPhone || customerPhone === 'Non fornito') {
            showToast('❌ Inserisci il tuo numero di telefono', 'error');
            return Promise.reject('Telefono mancante');
        }
        
        if (!pickupDate) {
            showToast('❌ Seleziona la data di ritiro', 'error');
            return Promise.reject('Data mancante');
        }
        
        // Validazione data (almeno 2 giorni di anticipo)
        const pickup = new Date(pickupDate);
        const today = new Date();
        const diffDays = Math.ceil((pickup - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 2) {
            showToast('❌ La data di ritiro deve essere almeno 2 giorni in anticipo', 'error');
            return Promise.reject('Data troppo vicina');
        }
        
        // Validazione carrello
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity < 4) {
            showToast('❌ Il minimo d\'ordine è 4 pezzi a scelta', 'error');
            return Promise.reject('Quantità insufficiente');
        }
        
        if (cart.length === 0) {
            showToast('❌ Aggiungi prodotti al carrello', 'error');
            return Promise.reject('Carrello vuoto');
        }
        
        // Se tutto OK, procedi con PayPal
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
            
            // ✅ USA I DATI DEL FORM (non PayPal) per il cliente
            const customerName = document.getElementById('customer-name').value.trim();
            const customerPhone = document.getElementById('customer-phone').value.trim();
            const pickupDate = document.getElementById('pickup-date').value;
            
            // Salva ordine con dati corretti
            const orderData = {
                customerName: customerName, // ← DAL FORM
                customerPhone: customerPhone, // ← DAL FORM  
                pickupDate: pickupDate, // ← DAL FORM
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
                    console.log('✅ Ordine salvato:', docRef.id);
                    
                    // Invia notifica WhatsApp
                    sendWhatsAppNotificationForPaidOrder(orderData, docRef.id);
                    
                    // Reset e ringraziamento
                    cart = [];
                    updateCartDisplay();
                    showToast('✅ Pagamento completato! Ordine inviato.', 'success');
                    
                    // Chiudi modal
                    document.getElementById('order-modal').style.display = 'none';
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