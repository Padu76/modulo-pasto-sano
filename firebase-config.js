
const firebaseConfig = {
  apiKey: "AIzaSyAWrw1vDEKOJnEbTMv4bF10vYeZnOI7DpY",
  authDomain: "pasto-sano.firebaseapp.com",
  projectId: "pasto-sano",
  storageBucket: "pasto-sano.appspot.com",
  messagingSenderId: "109720925931",
  appId: "1:109720925931:web:6450822431711297d730ae",
  measurementId: "G-5XMDRQL46Z"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
