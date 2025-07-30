// SOSTITUISCI la funzione handleCashOrder nel tuo script.js con questa:

// MODIFICATA: Registra utilizzo codice sconto E invia notifica email
function handleCashOrder() {
    if (cart.length === 0) {
        showToast('Aggiungi prodotti al carrello!', 'error');
        return;
    }
    
    const customerName = document.getElementById('customer-name')?.value;
    const customerPhone = document.getElementById('customer-phone')?.value;
    const pickupDate = document.getElementById('pickup-date')?.value;
    
    // Registra utilizzo codice sconto
    if (discountCode && customerName) {
        recordDiscountUsage(discountCode, customerName);
    }
    
    // Prepara dati ordine per email
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * appliedDiscount) / 100; 
    const finalTotal = subtotal - discountAmount;
    
    const orderData = {
        customerName: customerName || 'Cliente',
        customerPhone: customerPhone || 'Non fornito',
        pickupDate: pickupDate || 'Da definire',
        items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        subtotalAmount: subtotal,
        discountCode: discountCode || null,
        discountPercent: appliedDiscount || 0,
        discountAmount: discountAmount || 0,
        totalAmount: finalTotal,
        paymentMethod: 'cash',
        source: 'website_whatsapp'
    };
    
    // Invia notifica email tramite Netlify Function
    sendCashOrderNotification(orderData);
    
    // Genera e invia messaggio WhatsApp
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/393478881515?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Salva anche su Firebase se disponibile
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

// NUOVA FUNZIONE per inviare notifica email ordini contanti
async function sendCashOrderNotification(orderData) {
    try {
        console.log('📧 Invio notifica email ordine contanti...');
        
        const response = await fetch('/.netlify/functions/cash-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Notifica email inviata:', result.message);
        } else {
            const error = await response.json();
            console.error('❌ Errore invio email:', error.error);
        }
        
    } catch (error) {
        console.error('❌ Errore chiamata email API:', error);
        // Non bloccare l'ordine per errori email
    }
}

// AGGIUNGI ANCHE questa funzione per PayPal (da mettere dopo initPayPal)
// Modifica la funzione onApprove di PayPal:

// Dentro la funzione initPayPal, SOSTITUISCI il blocco onApprove con questo:
/*
onApprove: function(data, actions) {
    console.log('PayPal onApprove chiamato:', data);
    
    return actions.order.capture().then(function(details) {
        console.log('Pagamento PayPal completato:', details);
        
        // Prepara dati per webhook (opzionale - il webhook dovrebbe gestire automaticamente)
        const webhookData = {
            event_type: 'PAYMENT.CAPTURE.COMPLETED',
            resource: {
                id: data.orderID,
                amount: {
                    value: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - ((cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * appliedDiscount) / 100),
                    currency_code: 'EUR'
                },
                payer: details.payer,
                supplementary_data: {
                    related_ids: {
                        order_id: data.orderID
                    }
                }
            }
        };
        
        // Invia manualmente al webhook (backup nel caso il webhook PayPal non arrivi)
        sendPayPalWebhookBackup(webhookData);
        
        // Salva dettagli ordine
        const orderDetails = {
            paypal_order_id: data.orderID,
            payer: details.payer,
            amount: details.purchase_units[0].amount.value,
            currency: details.purchase_units[0].amount.currency_code,
            status: details.status
        };
        
        handleSuccessfulPayment('paypal', orderDetails);
    }).catch(function(error) {
        console.error('Errore cattura pagamento:', error);
        showToast('Errore durante la finalizzazione del pagamento', 'error');
    });
},
*/

// NUOVA FUNZIONE backup per webhook PayPal
async function sendPayPalWebhookBackup(webhookData) {
    try {
        console.log('📧 Invio backup webhook PayPal...');
        
        const response = await fetch('/.netlify/functions/paypal-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData)
        });
        
        if (response.ok) {
            console.log('✅ Backup webhook PayPal elaborato');
        } else {
            console.warn('⚠️ Errore backup webhook PayPal');
        }
        
    } catch (error) {
        console.error('❌ Errore backup webhook:', error);
    }
}