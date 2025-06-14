// Firebase v9 compat (senza import)
const firebaseConfig = {
  apiKey: "AIzaSyAWrw1vDEKOJnEbTMv4bF10vYeZnOI7DpY",
  authDomain: "pasto-sano.firebaseapp.com",
  projectId: "pasto-sano",
  storageBucket: "pasto-sano.appspot.com",
  messagingSenderId: "109720925931",
  appId: "1:109720925931:web:6450822431711297d730ae",
  measurementId: "G-5XMDRQL46Z"
};

document.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.src = "https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js";
  script.onload = () => {
    firebase.initializeApp(firebaseConfig);

    const scriptDb = document.createElement('script');
    scriptDb.src = "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js";
    scriptDb.onload = () => {
      console.log("✅ Firebase compat pronto");
      window.firestore = firebase.firestore();
      window.firestoreReady = true;
    };
    document.head.appendChild(scriptDb);
  };
  document.head.appendChild(script);
});
