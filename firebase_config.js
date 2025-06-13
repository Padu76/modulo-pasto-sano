// firebase-config.js
// Configurazione Firebase per Pasto Sano

// Import Firebase v9+ modular SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    where, 
    Timestamp,
    limit as firestoreLimit
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Configurazione Firebase con le tue chiavi
const firebaseConfig = {
  apiKey: "AIzaSyAWrw1vDEK0JnEbTMv4bF10vYeZnOI7DpY",
  authDomain: "pasto-sano.firebaseapp.com",
  projectId: "pasto-sano",
  storageBucket: "pasto-sano.firebasestorage.app",
  messagingSenderId: "109720925931",
  appId: "1:109720925931:web:6450822431711297d730ae",
  measurementId: "G-5XMDRQL46Z"
};

// Inizializza Firebase
let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('✅ Firebase inizializzato correttamente');
} catch (error) {
    console.error('❌ Errore inizializzazione Firebase:', error);
}

// FUNZIONI DATABASE
export async function saveOrder(orderData) {
    try {
        if (!db) {
            throw new Error('Database non inizializzato');
        }
        
        const docRef = await addDoc(collection(db, "orders"), {
            ...orderData,
            timestamp: Timestamp.fromDate(new Date()),
            status: 'nuovo'
        });
        console.log("✅ Ordine salvato con ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("❌ Errore salvataggio ordine: ", e);
        throw e;
    }
}

export async function getOrders(limitCount = 50) {
    try {
        if (!db) {
            throw new Error('Database non inizializzato');
        }
        
        console.log('🔍 Recupero ordini...');
        
        const q = query(
            collection(db, "orders"), 
            orderBy("timestamp", "desc"),
            firestoreLimit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const orders = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
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

export async function getTodayOrders() {
    try {
        if (!db) {
            throw new Error('Database non inizializzato');
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const q = query(
            collection(db, "orders"),
            where("timestamp", ">=", Timestamp.fromDate(today)),
            where("timestamp", "<", Timestamp.fromDate(tomorrow)),
            orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(q);
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
        return [];
    }
}

export async function getOrdersByDateRange(startDate, endDate) {
    try {
        if (!db) {
            throw new Error('Database non inizializzato');
        }
        
        const q = query(
            collection(db, "orders"),
            where("timestamp", ">=", Timestamp.fromDate(startDate)),
            where("timestamp", "<=", Timestamp.fromDate(endDate)),
            orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(q);
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

export { db, Timestamp };