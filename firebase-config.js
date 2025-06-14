// Firebase Configuration per Pasto Sano
// Inizializzazione Firebase e funzioni per la dashboard

// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBpnpG3x8oHfhQTSc_vGy-7K1uFj9XzRnA",
    authDomain: "pasto-sano.firebaseapp.com",
    projectId: "pasto-sano",
    storageBucket: "pasto-sano.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log('🔥 Firebase inizializzato per Pasto Sano');

// FUNZIONI GLOBALI PER LA DASHBOARD

// Funzione per ottenere gli ordini
window.getOrders = async function(limit = 100) {
    try {
        console.log(`📊 Caricamento ultimi ${limit} ordini...`);
        
        const ordersRef = db.collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(limit);
        
        const snapshot = await ordersRef.get();
        const orders = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            orders.push({
                id: doc.id,
                ...data
            });
        });
        
        console.log(`✅ ${orders.length} ordini caricati da Firebase`);
        return orders;
        
    } catch (error) {
        console.error('❌ Errore caricamento ordini:', error);
        throw error;
    }
};

// Funzione per ottenere statistiche
window.getStats = async function() {
    try {
        console.log('📈 Caricamento statistiche...');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Ordini di oggi
        const todayOrdersRef = db.collection('orders')
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(today));
        
        const todaySnapshot = await todayOrdersRef.get();
        const todayOrders = [];
        let todayRevenue = 0;
        
        todaySnapshot.forEach(doc => {
            const data = doc.data();
            todayOrders.push({ id: doc.id, ...data });
            todayRevenue += data.totalAmount || 0;
        });
        
        // Ordini totali (ultimi 30 giorni)
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const allOrdersRef = db.collection('orders')
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(thirtyDaysAgo));
        
        const allSnapshot = await allOrdersRef.get();
        const allOrders = [];
        let totalRevenue = 0;
        
        allSnapshot.forEach(doc => {
            const data = doc.data();
            allOrders.push({ id: doc.id, ...data });
            totalRevenue += data.totalAmount || 0;
        });
        
        const stats = {
            ordersToday: todayOrders.length,
            revenueToday: todayRevenue,
            totalOrders: allOrders.length,
            totalRevenue: totalRevenue,
            averageOrder: allOrders.length > 0 ? totalRevenue / allOrders.length : 0,
            orders: allOrders
        };
        
        console.log('✅ Statistiche caricate:', stats);
        return stats;
        
    } catch (error) {
        console.error('❌ Errore caricamento statistiche:', error);
        throw error;
    }
};

// Funzione per ottenere ordini per data
window.getOrdersByDate = async function(date) {
    try {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        const ordersRef = db.collection('orders')
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
            .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endDate))
            .orderBy('timestamp', 'desc');
        
        const snapshot = await ordersRef.get();
        const orders = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            orders.push({
                id: doc.id,
                ...data
            });
        });
        
        console.log(`✅ ${orders.length} ordini trovati per ${date}`);
        return orders;
        
    } catch (error) {
        console.error('❌ Errore caricamento ordini per data:', error);
        throw error;
    }
};

// Funzione per ottenere ordini per range di date
window.getOrdersByDateRange = async function(startDate, endDate) {
    try {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const ordersRef = db.collection('orders')
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(start))
            .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(end))
            .orderBy('timestamp', 'desc');
        
        const snapshot = await ordersRef.get();
        const orders = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            orders.push({
                id: doc.id,
                ...data
            });
        });
        
        console.log(`✅ ${orders.length} ordini trovati dal ${startDate} al ${endDate}`);
        return orders;
        
    } catch (error) {
        console.error('❌ Errore caricamento ordini per range:', error);
        throw error;
    }
};

// Funzione per aggiornare stato ordine (per future implementazioni)
window.updateOrderStatus = async function(orderId, status) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Stato ordine ${orderId} aggiornato a: ${status}`);
        return true;
        
    } catch (error) {
        console.error('❌ Errore aggiornamento stato ordine:', error);
        throw error;
    }
};

// Funzione per ottenere prodotti più venduti
window.getTopProducts = async function(limit = 10, days = 30) {
    try {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);
        
        const ordersRef = db.collection('orders')
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(daysAgo));
        
        const snapshot = await ordersRef.get();
        const productSales = {};
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.items) {
                data.items.forEach(item => {
                    const productName = item.name || 'Prodotto sconosciuto';
                    const quantity = item.quantity || 1;
                    
                    if (productSales[productName]) {
                        productSales[productName] += quantity;
                    } else {
                        productSales[productName] = quantity;
                    }
                });
            }
        });
        
        const sortedProducts = Object.entries(productSales)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([name, sales]) => ({ name, sales }));
        
        console.log(`✅ Top ${limit} prodotti degli ultimi ${days} giorni:`, sortedProducts);
        return sortedProducts;
        
    } catch (error) {
        console.error('❌ Errore caricamento top products:', error);
        throw error;
    }
};

// Funzione per monitorare nuovi ordini in tempo reale
window.listenForNewOrders = function(callback) {
    try {
        console.log('👂 Avvio listener per nuovi ordini...');
        
        const ordersRef = db.collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(1);
        
        const unsubscribe = ordersRef.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const newOrder = {
                        id: change.doc.id,
                        ...change.doc.data()
                    };
                    
                    console.log('🔔 Nuovo ordine rilevato:', newOrder);
                    if (callback) callback(newOrder);
                }
            });
        });
        
        return unsubscribe;
        
    } catch (error) {
        console.error('❌ Errore listener ordini:', error);
        throw error;
    }
};

// Funzione per ottenere clienti unici
window.getUniqueCustomers = async function(days = 365) {
    try {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);
        
        const ordersRef = db.collection('orders')
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(daysAgo));
        
        const snapshot = await ordersRef.get();
        const customers = new Set();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.customerPhone) {
                // Normalizza il telefono per evitare duplicati
                const normalizedPhone = data.customerPhone
                    .replace(/[\s\-\.]/g, '')
                    .replace(/^\+39/, '')
                    .replace(/^0039/, '')
                    .replace(/^0/, '');
                
                customers.add(normalizedPhone);
            }
        });
        
        console.log(`✅ ${customers.size} clienti unici trovati negli ultimi ${days} giorni`);
        return Array.from(customers);
        
    } catch (error) {
        console.error('❌ Errore caricamento clienti unici:', error);
        throw error;
    }
};

// Utility per formattare date
window.formatDate = function(timestamp) {
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data non valida';
    }
};

// Inizializzazione completata
console.log('✅ Firebase config caricato - Tutte le funzioni disponibili');

// Esporta funzioni per uso diretto (opzionale)
window.Firebase = {
    getOrders,
    getStats,
    getOrdersByDate,
    getOrdersByDateRange,
    updateOrderStatus,
    getTopProducts,
    listenForNewOrders,
    getUniqueCustomers,
    formatDate
};