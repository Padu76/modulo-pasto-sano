// Configurazione Firebase per Pasto Sano
// IMPORTANTE: Sostituisci con le tue credenziali Firebase

const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com", 
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Inizializza Firebase solo se le credenziali sono configurate
if (firebaseConfig.apiKey !== "your-api-key-here") {
    try {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase inizializzato correttamente');
        
        // Inizializza Firestore
        const db = firebase.firestore();
        
        // Test connessione
        db.enableNetwork().then(() => {
            console.log('✅ Firestore connesso');
        }).catch(error => {
            console.warn('⚠️ Errore connessione Firestore:', error);
        });
        
    } catch (error) {
        console.error('❌ Errore inizializzazione Firebase:', error);
    }
} else {
    console.warn('⚠️ Firebase non configurato - usando modalità offline');
    
    // Mock Firebase per sviluppo locale
    window.firebase = {
        firestore: () => ({
            collection: () => ({
                add: (data) => {
                    console.log('📦 Mock Firebase - Ordine salvato:', data);
                    return Promise.resolve({ id: 'mock-' + Date.now() });
                }
            }),
            FieldValue: {
                serverTimestamp: () => new Date()
            }
        })
    };
}

// Funzione helper per verificare se Firebase è disponibile
window.isFirebaseAvailable = () => {
    return typeof firebase !== 'undefined' && 
           firebase.apps && 
           firebase.apps.length > 0;
};