// netlify/functions/paypal-webhook.js
// Webhook PayPal con notifiche EmailJS

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        console.log('📧 Webhook PayPal ricevuto');
        
        const webhookData = JSON.parse(event.body);
        
        // Verifica che sia un pagamento completato
        if (webhookData.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
            const paymentData = webhookData.resource;
            
            const amount = parseFloat(paymentData.amount?.value || 0);
            const currency = paymentData.amount?.currency_code || 'EUR';
            const paypalOrderId = paymentData.supplementary_data?.related_ids?.order_id || paymentData.id;
            const payerInfo = paymentData.payer || {};
            
            console.log('💳 Pagamento PayPal completato:', {
                amount,
                currency,
                orderId: paypalOrderId
            });

            // Invia email tramite EmailJS
            if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PRIVATE_KEY) {
                await sendPayPalEmailJS({
                    amount,
                    currency,
                    paypalOrderId,
                    payerInfo
                });
            } else {
                console.warn('⚠️ EmailJS non configurato - email non inviata');
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Webhook processato e email inviata' 
                })
            };
        }

        console.log('ℹ️ Webhook PayPal ignorato - tipo:', webhookData.event_type);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Webhook ricevuto ma non processato' 
            })
        };

    } catch (error) {
        console.error('❌ Errore processing webhook PayPal:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Errore processing webhook',
                details: error.message
            })
        };
    }
};

// FUNZIONE INVIO EMAIL CON EMAILJS
async function sendPayPalEmailJS(paymentData) {
    try {
        const { amount, currency, paypalOrderId, payerInfo } = paymentData;
        
        // Dati del pagatore
        const payerName = payerInfo.name ? 
            `${payerInfo.name.given_name || ''} ${payerInfo.name.surname || ''}`.trim() : 
            'Cliente PayPal';
        const payerEmail = payerInfo.email_address || 'Non fornito';

        // Dati per il template EmailJS
        const templateParams = {
            to_email: process.env.NOTIFICATION_EMAIL || 'ordini@pastosano.it',
            subject: `🅿️ Pagamento PayPal: ${payerName} - ${amount.toFixed(2)} ${currency}`,
            
            // Dati per il template
            order_type: 'PAGAMENTO PAYPAL',
            customer_name: payerName,
            customer_phone: 'Da PayPal',
            customer_email: payerEmail,
            pickup_date: 'DA CONFERMARE',
            payment_method: 'PayPal',
            payment_status: 'PAGATO',
            
            // Dettagli pagamento
            total_amount: `${amount.toFixed(2)} ${currency}`,
            paypal_order_id: paypalOrderId,
            
            // Lista articoli (non disponibile da webhook)
            items_list: 'DETTAGLI NON DISPONIBILI - Contattare il cliente',
            total_items: 'N/A',
            
            // Note speciali
            special_notes: '⚠️ ATTENZIONE: Questo ordine è stato pagato tramite PayPal ma potrebbe non contenere i dettagli del ritiro. Contatta il cliente per confermare data di ritiro e dettagli prodotti.',
            
            // Timestamp
            order_date: new Date().toLocaleDateString('it-IT'),
            order_time: new Date().toLocaleTimeString('it-IT'),
            
            // Colori per il template
            header_color: '#0070ba',
            status_color: '#28a745'
        };

        // Chiamata API EmailJS
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_PUBLIC_KEY,
                accessToken: process.env.EMAILJS_PRIVATE_KEY,
                template_params: templateParams
            })
        });

        if (response.ok) {
            console.log('✅ Email PayPal inviata tramite EmailJS');
        } else {
            const errorText = await response.text();
            throw new Error(`EmailJS error: ${response.status} - ${errorText}`);
        }

    } catch (emailError) {
        console.error('❌ Errore invio email PayPal:', emailError.message);
        throw emailError;
    }
}