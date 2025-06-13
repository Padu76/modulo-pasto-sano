// firebase-config.js
// ISTRUZIONI SETUP:
// 1. Vai su https://console.firebase.google.com/
// 2. Crea nuovo progetto "pasto-sano"
// 3. Vai su "Firestore Database" → Crea database (modalità test)
// 4. Vai su Impostazioni progetto → Le tue app → Aggiungi app web
// 5. Sostituisci i valori qui sotto con i tuoi

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// SOSTITUISCI QUESTI VALORI CON I TUOI DA FIREBASE CONSOLE
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// FUNZIONI DATABASE
export async function saveOrder(orderData) {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      timestamp: Timestamp.fromDate(new Date()),
      status: 'nuovo' // nuovo, confermato, in_preparazione, pronto, consegnato
    });
    console.log("Ordine salvato con ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Errore salvataggio ordine: ", e);
    throw e;
  }
}

export async function getOrders(limit = 50) {
  try {
    const q = query(
      collection(db, "orders"), 
      orderBy("timestamp", "desc"),
      limit ? limit : undefined
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
    console.error("Errore recupero ordini: ", e);
    return [];
  }
}

export async function getTodayOrders() {
  try {
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
    return orders;
  } catch (e) {
    console.error("Errore recupero ordini oggi: ", e);
    return [];
  }
}

export async function getOrdersByDateRange(startDate, endDate) {
  try {
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
    console.error("Errore recupero ordini per intervallo: ", e);
    return [];
  }
}

export { db };