// netlify/functions/stripe-checkout.js
// Netlify Function per gestire Stripe Checkout

exports.handler = async (event, context) => {
    // Solo metodo POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    try {
        // Verifica che la chiave Stripe sia presente
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY non configurata');
        }

        // Inizializza Stripe con la secret key dalle variabili d'ambiente
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        // Parsing dati dalla richiesta
        const data = JSON.parse(event.body);
        
        // Validazione dati
        const { customerName, pickupDate, amount, items } = data;
        
        if (!customerName || !pickupDate || !amount || amount <= 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Dati mancanti o non validi',
                    details: { customerName, pickupDate, amount }
                })
            };
        }

        // Prepara line_items per Stripe
        const lineItems = [];
        
        // Aggiungi ogni prodotto come line item separato
        if (items && Array.isArray(items)) {
            items.forEach(item => {
                if (item.name && item.price && item.quantity && item.quantity > 0) {
                    lineItems.push({
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: item.name,
                                description: `Pasto Sano - Ritiro: ${pickupDate}`
                            },
                            unit_amount: Math.round(item.price * 100), // Stripe usa centesimi
                        },
                        quantity: item.quantity,
                    });
                }
            });
        }

        // Se non ci sono line_items validi, crea un singolo item con il totale
        if (lineItems.length === 0) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Ordine Pasto Sano - ${customerName}`,
                        description: `Ritiro: ${pickupDate}`
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            });
        }

        // URL base per redirect
        const baseUrl = event.headers.origin || 'https://pastosano.netlify.app';

        // Crea Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}&source=stripe`,
            cancel_url: `${baseUrl}/`,
            customer_email: '', // Opzionale: puoi richiedere email nel form
            billing_address_collection: 'auto',
            shipping_address_collection: {
                allowed_countries: ['IT'] // Solo Italia
            },
            metadata: {
                customer_name: customerName,
                pickup_date: pickupDate,
                order_details: JSON.stringify(items || []),
                total_amount: amount.toString(),
                source: 'pasto_sano_website'
            },
            payment_intent_data: {
                metadata: {
                    customer_name: customerName,
                    pickup_date: pickupDate,
                    source: 'pasto_sano_website'
                }
            },
            locale: 'it', // Interfaccia italiana
            automatic_tax: {
                enabled: false
            }
        });

        // Log per debugging
        console.log('✅ Stripe session creata:', session.id);

        // Restituisci session ID e URL
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                id: session.id,
                url: session.url
            })
        };

    } catch (error) {
        console.error('❌ Errore Stripe:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Errore durante la creazione della sessione di pagamento',
                details: error.message
            })
        };
    }
};
