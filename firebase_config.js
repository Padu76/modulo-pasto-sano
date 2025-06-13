// firebase-config.js
// Configurazione Firebase con CDN diretto - Compatibilità massima

// Carica Firebase dal CDN se non è già caricato
if (typeof firebase === 'undefined') {
    // Carica Firebase SDK
    const script1 = document.createElement('script');
    script1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
    script1.onload = loadFirestore;
    document.head.appendChild(script1);
    
    function loadFirestore() {
        const script2 = document.createElement('script');
        script2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';
        script2.onload = initializeFirebaseApp;
        document.head.appendChild(script2);
    }
} else {
    initializeFirebaseApp();
}

// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAWrw1vDEK0JnEbTMv4bF10vYeZnOI7DpY",
    authDomain: "pasto-sano.firebaseapp.com",
    projectId: "pasto-sano",
    storageBucket: "pasto-sano.firebasestorage.app",
    messagingSenderId: "109720925931",
    appId: "1:109720925931:web:6450822431711297d730ae",
    measurementId: "G-5XMDRQL46Z"
};

let db;
let firebaseInitialized = false;

function initializeFirebaseApp() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        firebaseInitialized = true;
        console.log('✅ Firebase inizializzato correttamente');
        
        // Trigger event per notificare che Firebase è pronto
        window.dispatchEvent(new CustomEvent('firebaseReady'));
    } catch (error) {
        console.error('❌ Errore inizializzazione Firebase:', error);
    }
}

// Aspetta che Firebase sia pronto
function waitForFirebase() {
    return new Promise((resolve) => {
        if (firebaseInitialized) {
            resolve();
        } else {
            window.addEventListener('firebaseReady', resolve);
        }
    });
}

// FUNZIONI DATABASE
async function saveOrder(orderData) {
    try {
        await waitForFirebase();
        
        if (!db) {
            throw new Error('Database non inizializzato');
        }
        
        const docRef = await db.collection('orders').add({
            ...orderData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'nuovo'
        });
        
        console.log("✅ Ordine salvato con ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("❌ Errore salvataggio ordine: ", e);
        throw e;
    }
}

async function getOrders(limitCount = 50) {
    try {
        await waitForFirebase();
        
        if (!db) {
            throw new Error('Database non inizializzato');
        }
        
        console.log('🔍 Recupero ordini...');
        
        const querySnapshot = await db.collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(limitCount)
            .get();
        
        const orders = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Converte timestamp Firebase in oggetto Date
            if (data.timestamp && data.timestamp.toDate) {
                data.timestamp = data.timestamp;
            }
            orders.push({
                id: doc.id,
                ...data
            });
        });
        
        console.log(`✅ Recuperati ${orders.length} ordini`);
        return orders;
    } catch (e) {
        console.error("❌ Errore recupero ordini: ", e);
        return [];
    }
}

async function getTodayOrders() {
    try {
        await waitForFirebase();
        
        if (!db) {
            throw new Error('Database non inizializzato');
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const querySnapshot = await db.collection('orders')
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(today))
            .where('timestamp', '<', firebase.firestore.Timestamp.fromDate(tomorrow))
            .orderBy('timestamp', 'desc')
            .get();
        
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Ordini di oggi: ${orders.length}`);
        return orders;
    } catch (e) {
        console.error("❌ Errore recupero ordini oggi: ", e);
        
        // Fallback: prendi tutti gli ordini e filtra localmente
        try {
            const allOrders = await getOrders();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayOrders = allOrders.filter(order => {
                if (order.timestamp && order.timestamp.toDate) {
                    const orderDate = order.timestamp.toDate();
                    return orderDate >= today;
                }
                return false;
            });
            
            console.log(`✅ Ordini di oggi (fallback): ${todayOrders.length}`);
            return todayOrders;
        } catch (fallbackError) {
            console.error("❌ Errore anche nel fallback:", fallbackError);
            return [];
        }
    }
}

async function getOrdersByDateRange(startDate, endDate) {
    try {
        await waitForFirebase();
        
        if (!db) {
            throw new Error('Database non inizializzato');
        }
        
        const querySnapshot = await db.collection('orders')
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
            .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endDate))
            .orderBy('timestamp', 'desc')
            .get();
        
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return orders;
    } catch (e) {
        console.error("❌ Errore recupero ordini per intervallo: ", e);
        return [];
    }
}

// Esporta le funzioni per uso globale
window.saveOrder = saveOrder;
window.getOrders = getOrders;
window.getTodayOrders = getTodayOrders;
window.getOrdersByDateRange = getOrdersByDateRange;

// Per compatibilità con ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveOrder,
        getOrders,
        getTodayOrders,
        getOrdersByDateRange
    };
}