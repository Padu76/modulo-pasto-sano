
// firebase-config-dashboard.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAWrw1vDEK0JnEbTMv4bF10vYeZnOI7DpY",
  authDomain: "pasto-sano.firebaseapp.com",
  projectId: "pasto-sano",
  storageBucket: "pasto-sano.firebasestorage.app",
  messagingSenderId: "109720925931",
  appId: "1:109720925931:web:6450822431711297d730ae",
  measurementId: "G-5XMDRQL46Z"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// FUNZIONI DATABASE
async function saveOrder(orderData) {
  const docRef = await addDoc(collection(db, "orders"), {
    ...orderData,
    timestamp: Timestamp.fromDate(new Date()),
    status: 'nuovo'
  });
  console.log("Ordine salvato con ID: ", docRef.id);
  return docRef.id;
}

async function getOrders(limit = 50) {
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
}

async function getTodayOrders() {
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
}

async function getOrdersByDateRange(startDate, endDate) {
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
}

// ESPONI LE FUNZIONI NEL WINDOW
window.firebaseDB = db;
window.getOrders = getOrders;
window.getTodayOrders = getTodayOrders;
window.getOrdersByDateRange = getOrdersByDateRange;
window.saveOrder = saveOrder;
