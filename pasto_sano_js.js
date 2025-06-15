// Webhook WhatsApp per Pasto Sano - Versione Corretta
// SOSTITUISCI il file "pasto_sano_js.js" in GitHub con questo codice

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inizializza Firebase Admin (configura con le tue credenziali)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            // Inserisci qui le tue credenziali Firebase
            "type": "service_account",
            "project_id": "pasto-sano",
            "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
            "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            "client_email": process.env.FIREBASE_CLIENT_EMAIL,
            "client_id": process.env.FIREBASE_CLIENT_ID,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || 'pasto-sano'}.firebaseio.com`
    });
}

const db = admin.firestore();

// ENDPOINT PRINCIPALE per ricevere messaggi WhatsApp
app.post('/webhook', async (req, res) => {
    try {
        console.log('📨 Webhook ricevuto:', JSON.stringify(req.body, null, 2));
        
        const message = req.body;
        
        // Verifica che sia un messaggio valido
        if (!message.From || !message.Body) {
            console.log('⚠️ Messaggio non valido, ignorato');
            return res.status(200).send('OK');
        }
        
        // Estrai dati del cliente dal messaggio WhatsApp
        const customerData = extractCustomerData(message);
        console.log('👤 Dati cliente estratti:', customerData);
        
        // Verifica se il messaggio contiene un ordine
        const orderData = parseOrderFromMessage(message.Body);
        
        if (orderData.isOrder) {
            console.log('🛍️ Ordine rilevato nel messaggio');
            
            // Crea l'ordine completo con dati cliente reali
            const completeOrder = {
                // === DATI CLIENTE (PRIORITÀ MASSIMA) ===
                customerName: customerData.name,
                customerPhone: customerData.phone,
                customerEmail: customerData.email,
                from: customerData.originalFrom, // ID WhatsApp completo
                
                // === DATI ORDINE ===
                ...orderData.order,
                
                // === METADATA ===
                source: 'whatsapp',
                messageId: message.MessageSid || message.SmsMessageSid || null,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                status: 'nuovo',
                
                // === DATI AGGIUNTIVI ===
                processedAt: new Date().toISOString(),
                webhookData: {
                    originalMessage: message.Body,
                    fromWhatsApp: true,
                    twilioData: {
                        accountSid: message.AccountSid,
                        messageSid: message.MessageSid || message.SmsMessageSid
                    }
                }
            };
            
            console.log('💾 Salvando ordine completo:', completeOrder);
            
            // Salva l'ordine su Firebase
            const docRef = await db.collection('orders').add(completeOrder);
            console.log(`✅ Ordine salvato con ID: ${docRef.id}`);
            
            // Invia conferma WhatsApp (opzionale)
            const confirmationMessage = createConfirmationMessage(completeOrder, docRef.id);
            console.log('📤 Conferma preparata:', confirmationMessage);
            
            // Risposta TwiML per WhatsApp
            res.type('text/xml');
            res.send(`
                <?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <Message>${confirmationMessage}</Message>
                </Response>
            `);
            
        } else {
            console.log('💬 Messaggio normale (non ordine)');
            
            // Risposta per messaggi non-ordine
            res.type('text/xml');
            res.send(`
                <?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <Message>Ciao! Per effettuare un ordine, scrivi i piatti che desideri con il numero. Es: "1. FUSILLI, MACINATO MANZO, ZUCCHINE"</Message>
                </Response>
            `);
        }
        
    } catch (error) {
        console.error('❌ Errore webhook:', error);
        res.status(500).send('Errore interno del server');
    }
});

// FUNZIONE: Estrazione dati cliente da messaggio WhatsApp
function extractCustomerData(message) {
    console.log('🔍 Estrazione dati cliente da messaggio Twilio');
    
    // ID WhatsApp originale (es: whatsapp:+393471234567)
    const originalFrom = message.From;
    
    // Estrai numero di telefono pulito
    let phoneNumber = originalFrom;
    if (phoneNumber.startsWith('whatsapp:')) {
        phoneNumber = phoneNumber.replace('whatsapp:', '');
    }
    
    // Formatta numero italiano
    phoneNumber = formatItalianPhone(phoneNumber);
    
    // Estrai nome del cliente
    let customerName = 'Cliente';
    
    // Metodo 1: Dal campo ProfileName (Twilio WhatsApp)
    if (message.ProfileName && message.ProfileName.trim() !== '') {
        customerName = message.ProfileName.trim();
        console.log('✅ Nome trovato in ProfileName:', customerName);
    }
    // Metodo 2: Dal campo Author (alcuni webhook)
    else if (message.Author && message.Author.trim() !== '') {
        customerName = message.Author.trim();
        console.log('✅ Nome trovato in Author:', customerName);
    }
    // Metodo 3: Estrazione dal corpo del messaggio
    else {
        const extractedName = extractNameFromMessage(message.Body);
        if (extractedName) {
            customerName = extractedName;
            console.log('✅ Nome estratto dal messaggio:', customerName);
        } else {
            // Fallback: usa parte del numero di telefono
            const phoneDigits = phoneNumber.replace(/[^\d]/g, '');
            customerName = `Cliente ${phoneDigits.slice(-4)}`;
            console.log('⚠️ Nome non trovato, usando fallback:', customerName);
        }
    }
    
    const result = {
        name: customerName,
        phone: phoneNumber,
        email: null, // Email raramente disponibile via WhatsApp
        originalFrom: originalFrom
    };
    
    console.log('✅ Dati cliente finali:', result);
    return result;
}

// FUNZIONE: Formatta numero telefono italiano
function formatItalianPhone(phone) {
    if (!phone) return 'N/A';
    
    // Rimuovi caratteri non numerici eccetto +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Se inizia con +39, mantienilo
    if (cleaned.startsWith('+39')) {
        return cleaned;
    }
    
    // Se inizia con 39, aggiungi +
    if (cleaned.startsWith('39') && cleaned.length > 10) {
        return '+' + cleaned;
    }
    
    // Se inizia con 0 (numero fisso) o 3 (cellulare), aggiungi +39
    if (cleaned.startsWith('0') || cleaned.startsWith('3')) {
        return '+39' + cleaned;
    }
    
    // Altrimenti, aggiungi +39 assumendo sia un numero italiano
    if (cleaned.length >= 9) {
        return '+39' + cleaned;
    }
    
    return phone; // Ritorna originale se non riesce a formattare
}

// FUNZIONE: Estrai nome dal corpo del messaggio
function extractNameFromMessage(messageBody) {
    if (!messageBody) return null;
    
    // Pattern comuni per nomi nei messaggi
    const namePatterns = [
        /(?:mi chiamo|sono|nome[:\s]+)([A-Za-z\s]{2,30})/i,
        /(?:^|\n)([A-Z][a-z]+\s+[A-Z][a-z]+)/,  // Nome Cognome
        /(?:^|\n)([A-Z][a-z]{2,15})\s*$/m,      // Solo nome
    ];
    
    for (const pattern of namePatterns) {
        const match = messageBody.match(pattern);
        if (match && match[1]) {
            const name = match[1].trim();
            // Verifica che non sia una parola comune
            if (!isCommonWord(name)) {
                return name;
            }
        }
    }
    
    return null;
}

// FUNZIONE: Verifica se è una parola comune (non un nome)
function isCommonWord(word) {
    const commonWords = [
        'buongiorno', 'buonasera', 'ciao', 'salve', 'ordine', 'vorrei',
        'grazie', 'prego', 'bene', 'male', 'oggi', 'domani', 'sera',
        'pranzo', 'cena', 'menu', 'piatto', 'pasta', 'riso', 'fusilli',
        'quinoa', 'patate', 'pollo', 'manzo', 'salmone'
    ];
    return commonWords.includes(word.toLowerCase());
}

// FUNZIONE: Parse ordine dal messaggio
function parseOrderFromMessage(messageBody) {
    console.log('🔍 Parsing ordine da messaggio:', messageBody);
    
    // Verifica se contiene indicatori di ordine
    const orderIndicators = [
        /\d+\.\s*[A-Z]/,  // Formato numerato come "1. FUSILLI"
        /ordino|vorrei|prendo|menu|piatto/i,
        /fusilli|riso|quinoa|patate|pollo|manzo|salmone|roastbeef|hamburger/i
    ];
    
    const isOrder = orderIndicators.some(pattern => pattern.test(messageBody));
    
    if (!isOrder) {
        return { isOrder: false };
    }
    
    // Estrai piatti dall'ordine
    const items = extractItemsFromMessage(messageBody);
    
    // Estrai data di ritiro
    const pickupDate = extractPickupDate(messageBody);
    
    // Calcola totali
    const subtotalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Gestione sconti (se presenti nel messaggio)
    const discount = extractDiscount(messageBody);
    const discountAmount = (subtotalAmount * discount.percentage) / 100;
    const totalAmount = subtotalAmount - discountAmount;
    
    const order = {
        items: items,
        totalItems: totalItems,
        subtotalAmount: subtotalAmount,
        discountPercent: discount.percentage,
        discountCode: discount.code,
        totalAmount: totalAmount,
        pickupDate: pickupDate
    };
    
    console.log('✅ Ordine parsato:', order);
    return { isOrder: true, order };
}

// FUNZIONE: Estrai piatti dal messaggio
function extractItemsFromMessage(messageBody) {
    const items = [];
    
    // Pattern per piatti numerati: "1. FUSILLI, MACINATO MANZO, ZUCCHINE"
    const numberedPattern = /(\d+)\.\s*([A-Z][^0-9]*?)(?=\d+\.|$)/g;
    let match;
    
    while ((match = numberedPattern.exec(messageBody)) !== null) {
        const itemNumber = parseInt(match[1]);
        let itemName = match[2].trim();
        
        // Pulisci il nome del piatto
        itemName = itemName.replace(/[,\s]+$/, ''); // Rimuovi virgole finali
        itemName = itemName.replace(/\n.*$/, ''); // Rimuovi tutto dopo newline
        
        items.push({
            number: itemNumber,
            name: itemName,
            quantity: 1,
            price: 8 // Prezzo standard, modificabile
        });
    }
    
    // Se non trova piatti numerati, cerca pattern alternativi
    if (items.length === 0) {
        const dishKeywords = [
            'fusilli', 'riso', 'quinoa', 'patate', 'pollo', 'manzo', 
            'salmone', 'roastbeef', 'hamburger', 'tortillas'
        ];
        
        dishKeywords.forEach((keyword, index) => {
            const regex = new RegExp(`${keyword}[^.]*`, 'gi');
            const matches = messageBody.match(regex);
            if (matches) {
                matches.forEach(match => {
                    items.push({
                        number: index + 1,
                        name: match.trim().toUpperCase(),
                        quantity: 1,
                        price: 8
                    });
                });
            }
        });
    }
    
    return items;
}

// FUNZIONE: Estrai data di ritiro
function extractPickupDate(messageBody) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Pattern per date
    const datePatterns = [
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/,  // gg/mm/aaaa
        /domani/i,
        /oggi/i,
        /(\d{1,2})\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/i
    ];
    
    for (const pattern of datePatterns) {
        const match = messageBody.match(pattern);
        if (match) {
            if (match[0].toLowerCase().includes('domani')) {
                return tomorrow.toISOString().split('T')[0];
            }
            if (match[0].toLowerCase().includes('oggi')) {
                return today.toISOString().split('T')[0];
            }
            // Gestisci date specifiche...
            if (match[1] && match[2]) {
                const day = parseInt(match[1]);
                const month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
                const year = match[3] ? parseInt(match[3]) : today.getFullYear();
                const parsedDate = new Date(year, month, day);
                return parsedDate.toISOString().split('T')[0];
            }
        }
    }
    
    // Default: domani
    return tomorrow.toISOString().split('T')[0];
}

// FUNZIONE: Estrai informazioni sconto
function extractDiscount(messageBody) {
    const discountPatterns = [
        /sconto\s*(\d+)%?\s*(?:codice[:\s]*([A-Z0-9]+))?/i,
        /codice[:\s]*([A-Z0-9]+)/i
    ];
    
    for (const pattern of discountPatterns) {
        const match = messageBody.match(pattern);
        if (match) {
            return {
                percentage: parseInt(match[1]) || 0,
                code: match[2] || match[1] || ''
            };
        }
    }
    
    return { percentage: 0, code: '' };
}

// FUNZIONE: Crea messaggio di conferma
function createConfirmationMessage(order, orderId) {
    const confirmationMessage = `
✅ *Ordine Confermato!*

🆔 *ID:* ${orderId.substring(0, 8)}
👤 *Cliente:* ${order.customerName}
📅 *Ritiro:* ${order.pickupDate}
🍽️ *Piatti:* ${order.totalItems}
💰 *Totale:* ${order.totalAmount.toFixed(2)}€

📋 *Dettagli:*
${order.items.map((item, i) => `${i+1}. ${item.name} (x${item.quantity})`).join('\n')}

Grazie per aver scelto Pasto Sano! 🥗

_Risposta automatica - Ordine registrato_
    `.trim();
    
    return confirmationMessage;
}

// ENDPOINT per verifica webhook (Twilio)
app.get('/webhook', (req, res) => {
    console.log('✅ Webhook GET - Verifica Twilio');
    res.status(200).send('Webhook Pasto Sano attivo');
});

// ENDPOINT di test per creare ordini di prova
app.post('/test/order', async (req, res) => {
    try {
        const testOrder = {
            customerName: 'Test Cliente',
            customerPhone: '+39 347 123 4567',
            from: 'whatsapp:+393471234567',
            customerEmail: null,
            items: [
                {
                    number: 1,
                    name: 'FUSILLI, MACINATO MANZO, ZUCCHINE, MELANZANE',
                    quantity: 1,
                    price: 8
                }
            ],
            totalItems: 1,
            subtotalAmount: 8,
            discountPercent: 0,
            discountCode: '',
            totalAmount: 8,
            pickupDate: '2025-06-16',
            source: 'test',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'nuovo'
        };
        
        const docRef = await db.collection('orders').add(testOrder);
        console.log('✅ Ordine test salvato:', docRef.id);
        
        res.json({ 
            success: true, 
            orderId: docRef.id,
            message: 'Ordine test creato con successo',
            order: testOrder
        });
        
    } catch (error) {
        console.error('❌ Errore test:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ENDPOINT di test per simulare messaggio WhatsApp
app.post('/test/message', async (req, res) => {
    try {
        const testMessage = {
            From: 'whatsapp:+393471234567',
            Body: req.body.message || '1. FUSILLI, MACINATO MANZO, ZUCCHINE, MELANZANE\n2. RISO, HAMBURGER MANZO, CAROTINE BABY',
            ProfileName: req.body.name || 'Test User',
            MessageSid: 'test-' + Date.now(),
            AccountSid: 'test-account'
        };
        
        console.log('🧪 Simulazione messaggio WhatsApp:', testMessage);
        
        // Simula il processo del webhook
        const customerData = extractCustomerData(testMessage);
        const orderData = parseOrderFromMessage(testMessage.Body);
        
        if (orderData.isOrder) {
            const completeOrder = {
                customerName: customerData.name,
                customerPhone: customerData.phone,
                customerEmail: customerData.email,
                from: customerData.originalFrom,
                ...orderData.order,
                source: 'test-message',
                messageId: testMessage.MessageSid,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                status: 'nuovo',
                processedAt: new Date().toISOString()
            };
            
            const docRef = await db.collection('orders').add(completeOrder);
            console.log('✅ Ordine da messaggio test salvato:', docRef.id);
            
            res.json({
                success: true,
                orderId: docRef.id,
                message: 'Messaggio elaborato e ordine creato',
                customerData: customerData,
                orderData: orderData,
                savedOrder: completeOrder
            });
        } else {
            res.json({
                success: false,
                message: 'Messaggio non riconosciuto come ordine',
                customerData: customerData,
                orderData: orderData
            });
        }
        
    } catch (error) {
        console.error('❌ Errore test messaggio:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ENDPOINT per controllare stato Firebase
app.get('/test/firebase', async (req, res) => {
    try {
        // Test connessione Firebase
        const testDoc = await db.collection('test').add({
            message: 'Test connessione',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Test lettura ordini
        const ordersSnapshot = await db.collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();
        
        const orders = [];
        ordersSnapshot.forEach(doc => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json({
            success: true,
            message: 'Firebase connesso correttamente',
            testDocId: testDoc.id,
            totalOrders: ordersSnapshot.size,
            lastOrders: orders.map(o => ({
                id: o.id,
                customerName: o.customerName,
                customerPhone: o.customerPhone,
                from: o.from,
                totalAmount: o.totalAmount,
                source: o.source
            }))
        });
        
    } catch (error) {
        console.error('❌ Errore test Firebase:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            message: 'Errore connessione Firebase'
        });
    }
});

// ENDPOINT per debug: mostra ultimo ordine salvato
app.get('/debug/last-order', async (req, res) => {
    try {
        const snapshot = await db.collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            return res.json({
                success: false,
                message: 'Nessun ordine trovato'
            });
        }
        
        const lastOrder = snapshot.docs[0];
        const orderData = { id: lastOrder.id, ...lastOrder.data() };
        
        res.json({
            success: true,
            message: 'Ultimo ordine trovato',
            order: orderData,
            analysis: {
                hasCustomerName: !!orderData.customerName && orderData.customerName !== 'Cliente Web',
                hasCustomerPhone: !!orderData.customerPhone && orderData.customerPhone !== 'N/A',
                hasFromField: !!orderData.from,
                fieldsAvailable: Object.keys(orderData)
            }
        });
        
    } catch (error) {
        console.error('❌ Errore debug:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ENDPOINT per simulare diversi tipi di messaggi WhatsApp
app.post('/test/scenarios', async (req, res) => {
    try {
        const scenarios = [
            {
                name: 'Ordine Completo',
                message: {
                    From: 'whatsapp:+393471234567',
                    Body: '1. FUSILLI, MACINATO MANZO, ZUCCHINE, MELANZANE\n2. RISO, HAMBURGER MANZO, CAROTINE BABY\nRitiro domani',
                    ProfileName: 'Mario Rossi',
                    MessageSid: 'test-complete-' + Date.now()
                }
            },
            {
                name: 'Ordine Senza Nome',
                message: {
                    From: 'whatsapp:+393481234567',
                    Body: '1. QUINOA, POLLO GRIGLIATO, VERDURE MISTE',
                    ProfileName: '', // Nome vuoto
                    MessageSid: 'test-noname-' + Date.now()
                }
            },
            {
                name: 'Messaggio Non-Ordine',
                message: {
                    From: 'whatsapp:+393491234567',
                    Body: 'Ciao, a che ora aprite oggi?',
                    ProfileName: 'Luca Bianchi',
                    MessageSid: 'test-notorder-' + Date.now()
                }
            }
        ];
        
        const results = [];
        
        for (const scenario of scenarios) {
            const customerData = extractCustomerData(scenario.message);
            const orderData = parseOrderFromMessage(scenario.message.Body);
            
            let savedOrder = null;
            if (orderData.isOrder) {
                const completeOrder = {
                    customerName: customerData.name,
                    customerPhone: customerData.phone,
                    from: customerData.originalFrom,
                    ...orderData.order,
                    source: 'test-scenario',
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'nuovo'
                };
                
                const docRef = await db.collection('orders').add(completeOrder);
                savedOrder = { id: docRef.id, ...completeOrder };
            }
            
            results.push({
                scenario: scenario.name,
                customerData: customerData,
                orderData: orderData,
                savedOrder: savedOrder
            });
        }
        
        res.json({
            success: true,
            message: 'Test scenari completato',
            results: results
        });
        
    } catch (error) {
        console.error('❌ Errore test scenari:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Gestione errori globale
app.use((error, req, res, next) => {
    console.error('❌ Errore non gestito:', error);
    res.status(500).json({
        success: false,
        error: 'Errore interno del server',
        message: error.message
    });
});

// Homepage per verificare che il webhook sia attivo
app.get('/', (req, res) => {
    res.json({
        service: 'Webhook Pasto Sano',
        status: 'Attivo',
        version: '2.0',
        endpoints: {
            webhook: '/webhook (POST)',
            test: '/test/order (POST)',
            testMessage: '/test/message (POST)',
            testFirebase: '/test/firebase (GET)',
            debug: '/debug/last-order (GET)',
            scenarios: '/test/scenarios (POST)'
        },
        lastUpdate: new Date().toISOString()
    });
});

// Avvia il server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Webhook Pasto Sano avviato sulla porta ${PORT}`);
    console.log(`📱 Endpoint principale: /webhook`);
    console.log(`🧪 Endpoint test: /test/order, /test/message, /test/firebase`);
    console.log(`🔍 Debug: /debug/last-order`);
    console.log(`📊 Scenarios: /test/scenarios`);
    console.log(`🌐 Homepage: http://localhost:${PORT}`);
});

// Export per utilizzo come modulo
module.exports = app;