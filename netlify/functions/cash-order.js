// netlify/functions/cash-order.js
// Funzione per notificare ordini in contanti con EmailJS

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
        const orderData = JSON.parse(event.body);
        
        // Validazione dati
        const { customerName, customerPhone, pickupDate, items, totalAmount } = orderData;
        
        if (!customerName || !pickupDate || !items || !totalAmount) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Dati ordine mancanti',
                    required: ['customerName', 'pickupDate', 'items', 'totalAmount']
                })
            };
        }

        console.log('💰 Ordine contanti ricevuto:', {
            customer: customerName,
            phone: customerPhone,
            total: totalAmount
        });

        // Invia email tramite EmailJS
        if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_PRIVATE_KEY) {
            await sendCashOrderEmailJS(orderData);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Ordine registrato e email inviata'
                })
            };
        } else {
            console.warn('⚠️ EmailJS non configurato');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Ordine registrato (email non configurata)'
                })
            };
        }

    } catch (error) {
        console.error('❌ Errore processing ordine contanti:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Errore processing ordine',
                details: error.message
            })
        };
    }
};

// FUNZIONE INVIO EMAIL CONTANTI CON EMAILJS
async function sendCashOrderEmailJS(orderData) {
    try {
        const { 
            customerName, 
            customerPhone, 
            pickupDate, 
            items, 
            totalAmount,
            subtotalAmount,
            discountCode,
            discountPercent,
            discountAmount
        } = orderData;
        
        // Calcola totale articoli
        const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        // Genera lista prodotti per email
        const itemsList = items.map(item => 
            `• ${item.name} x${item.quantity} = €${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');

        // Dati per il template EmailJS
        const templateParams = {
            to_email: process.env.NOTIFICATION_EMAIL || 'ordini@pastosano.it',
            subject: `💰 Ordine Contanti: ${customerName} - €${totalAmount.toFixed(2)}`,
            
            // Dati per il template
            order_type: 'ORDINE CONTANTI',
            customer_name: customerName,
            customer_phone: customerPhone || 'Non fornito',
            customer_email: 'Da WhatsApp/Sito',
            pickup_date: pickupDate,
            payment_method: 'Contanti alla Consegna',
            payment_status: 'DA RISCUOTERE',
            
            // Dettagli ordine
            total_amount: `€${totalAmount.toFixed(2)}`,
            subtotal_amount: subtotalAmount ? `€${subtotalAmount.toFixed(2)}` : `€${totalAmount.toFixed(2)}`,
            
            // Lista articoli
            items_list: itemsList,
            total_items: totalItems,
            
            // Sconto (se applicato)
            discount_info: discountCode ? 
                `🎁 Sconto ${discountCode} (-${discountPercent}%) = -€${(discountAmount || 0).toFixed(2)}` : 
                'Nessuno sconto applicato',
            
            // Note speciali
            special_notes: `⚠️ PAGAMENTO IN CONTANTI: Il cliente pagherà €${totalAmount.toFixed(2)} al momento del ritiro. Assicurati di avere il resto disponibile.`,
            
            // Timestamp
            order_date: new Date().toLocaleDateString('it-IT'),
            order_time: new Date().toLocaleTimeString('it-IT'),
            
            // Colori per il template
            header_color: '#28a745',
            status_color: '#dc3545'
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
            console.log('✅ Email ordine contanti inviata tramite EmailJS per:', customerName);
        } else {
            const errorText = await response.text();
            throw new Error(`EmailJS error: ${response.status} - ${errorText}`);
        }

    } catch (emailError) {
        console.error('❌ Errore invio email ordine contanti:', emailError.message);
        throw emailError;
    }
}