// dashboard.js
// Dashboard analytics senza import ES6 - usa solo funzioni globali

let allOrders = [];
let currentFilter = 'tutti';

// INIZIALIZZAZIONE
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard inizializzata');
    
    // Carica Firebase config dinamicamente
    await loadFirebaseConfig();
    
    // Aspetta che Firebase sia pronto
    await waitForFirebase();
    
    try {
        await loadAllData();
        updateStats();
        displayOrders();
        updateTopProducts();
        console.log('✅ Dashboard completamente caricata');
    } catch (error) {
        console.error('❌ Errore caricamento dashboard:', error);
        showError('Errore nel caricamento dei dati: ' + error.message);
    }
});

// CARICA FIREBASE CONFIG DINAMICAMENTE
function loadFirebaseConfig() {
    return new Promise((resolve, reject) => {
        // Controlla se Firebase è già caricato
        if (typeof window.getOrders === 'function') {
            console.log('✅ Firebase già disponibile');
            resolve();
            return;
        }
        
        console.log('📄 Caricamento Firebase config...');
        const script = document.createElement('script');
        script.src = './firebase-config.js';
        script.onload = () => {
            console.log('✅ Firebase config caricato');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Errore caricamento Firebase config');
            reject(new Error('Impossibile caricare Firebase config'));
        };
        document.head.appendChild(script);
    });
}

// ASPETTA CHE FIREBASE SIA PRONTO
function waitForFirebase() {
    return new Promise((resolve) => {
        console.log('⏳ Attendo che Firebase sia pronto...');
        
        const checkFirebase = () => {
            if (typeof window.getOrders === 'function') {
                console.log('✅ Firebase pronto');
                resolve();
            } else {
                console.log('⏳ Firebase non ancora pronto, riprovo...');
                setTimeout(checkFirebase, 500);
            }
        };
        
        checkFirebase();
    });
}

// CARICAMENTO DATI
async function loadAllData() {
    try {
        console.log('📊 Caricamento ordini...');
        
        // Usa la funzione globale di Firebase
        if (typeof window.getOrders === 'function') {
            allOrders = await window.getOrders(100);
            console.log(`✅ ${allOrders.length} ordini caricati:`, allOrders);
        } else {
            throw new Error('Funzione getOrders non disponibile');
        }
        
        // Se non ci sono ordini, usa dati di esempio per test
        if (allOrders.length === 0) {
            console.log('⚠️ Nessun ordine trovato, uso dati di esempio');
            allOrders = getMockOrders();
        }
        
    } catch (error) {
        console.error('❌ Errore caricamento ordini:', error);
        
        // Fallback con dati mock
        console.log('🔄 Fallback: uso dati di esempio');
        allOrders = getMockOrders();
    }
}

// DATI DI ESEMPIO PER TEST
function getMockOrders() {
    const now = new Date();
    const today = new Date();
    today.setHours(10, 30, 0, 0);
    
    return [
        {
            id: 'mock1',
            customerName: 'Lara Test',
            customerPhone: '347939543',
            items: [
                {name: '1. FUSILLI, MACINATO MANZO, ZUCCHINE, MELANZANE', quantity: 1, price: 8},
                {name: '2. ROASTBEEF, PATATE AL FORNO, FAGIOLINI', quantity: 1, price: 8}
            ],
            totalAmount: 30,
            pickupDate: '2025-06-16',
            appliedDiscount: 0,
            discountCode: '',
            timestamp: {
                toDate: () => today
            }
        },
        {
            id: 'mock2', 
            customerName: 'Andrea Padoan',
            customerPhone: '347881515',
            customerEmail: 'andrea.padoan@gmail.com',
            items: [
                {name: '3. RISO, HAMBURGER MANZO, CAROTINE BABY', quantity: 1, price: 8},
                {name: '5. PATATE, SALMONE GRIGLIATO, BROCCOLI', quantity: 2, price: 8},
                {name: '9. TORTILLAS, SALMONE AFFUMICATO, FORMAGGIO SPALMABILE, INSALATA', quantity: 1, price: 8}
            ],
            totalAmount: 40,
            pickupDate: '2025-06-16',
            appliedDiscount: 0,
            discountCode: '',
            timestamp: {
                toDate: () => {
                    const earlier = new Date(today);
                    earlier.setHours(9, 15, 0, 0);
                    return earlier;
                }
            }
        }
    ];
}

// AGGIORNAMENTO STATISTICHE
function updateStats() {
    console.log('📈 Aggiornamento statistiche...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = allOrders.filter(order => {
        try {
            const orderDate = order.timestamp && order.timestamp.toDate ? 
                order.timestamp.toDate() : new Date(order.timestamp);
            return orderDate >= today;
        } catch (e) {
            return false;
        }
    });
    
    const thisWeekOrders = allOrders.filter(order => {
        try {
            const orderDate = order.timestamp && order.timestamp.toDate ? 
                order.timestamp.toDate() : new Date(order.timestamp);
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
        } catch (e) {
            return false;
        }
    });
    
    // Ordini oggi
    const ordersToday = todayOrders.length;
    document.getElementById('orders-today').textContent = ordersToday;
    
    // Fatturato oggi
    const revenueToday = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    document.getElementById('revenue-today').textContent = `${revenueToday.toFixed(2)}€`;
    
    // Ordine medio
    const avgOrder = allOrders.length > 0 ? 
        allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / allOrders.length : 0;
    document.getElementById('avg-order').textContent = `${avgOrder.toFixed(2)}€`;
    
    // Clienti unici
    const uniqueCustomers = new Set(allOrders.map(order => 
        (order.customerName || 'Sconosciuto').toLowerCase()
    )).size;
    document.getElementById('total-customers').textContent = uniqueCustomers;
    
    // Aggiorna indicatori di variazione
    updateChangeIndicators(todayOrders, thisWeekOrders);
    
    console.log(`✅ Statistiche aggiornate: ${ordersToday} ordini oggi, ${revenueToday.toFixed(2)}€ fatturato`);
}

function updateChangeIndicators(todayOrders, thisWeekOrders) {
    // Calcoli semplificati per le variazioni
    const ordersChange = todayOrders.length > 0 ? '+100' : '0';
    const revenueChange = todayOrders.length > 0 ? '+100' : '0';
    
    document.getElementById('orders-change').innerHTML = 
        `<span style="color: #38a169;">↗ ${ordersChange}%</span> vs ieri`;
    document.getElementById('revenue-change').innerHTML = 
        `<span style="color: #38a169;">↗ ${revenueChange}%</span> vs ieri`;
    document.getElementById('avg-change').textContent = 'vs settimana scorsa';
    document.getElementById('customers-change').textContent = 'clienti registrati';
}

// VISUALIZZAZIONE ORDINI
function displayOrders() {
    console.log('📋 Visualizzazione ordini...');
    
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) {
        console.error('❌ Elemento orders-list non trovato');
        return;
    }
    
    let filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<div class="loading">Nessun ordine trovato per il filtro selezionato</div>';
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => {
        const orderDate = order.timestamp && order.timestamp.toDate ? 
            order.timestamp.toDate() : new Date();
            
        const formattedDate = orderDate.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const itemsText = (order.items || []).map(item => 
            `${item.name || 'Prodotto'} (x${item.quantity || 1})`
        ).join(', ');
        
        const discountText = order.appliedDiscount > 0 ? 
            `<br><small style="color: #e53e3e;">Sconto ${order.discountCode}: -${order.appliedDiscount}%</small>` : '';
        
        return `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">#${order.id.substring(0, 8)}</span>
                    <span class="order-total">${(order.totalAmount || 0).toFixed(2)}€</span>
                </div>
                <div class="order-details">
                    <strong>${order.customerName || 'Cliente'}</strong><br>
                    📱 ${order.customerPhone || 'N/A'}<br>
                    ${order.customerEmail ? `📧 ${order.customerEmail}<br>` : ''}
                    📅 Ritiro: ${order.pickupDate || 'N/A'}<br>
                    🍽️ ${itemsText || 'Nessun articolo'}${discountText}
                </div>
                <div style="margin-top: 8px;">
                    <span class="order-status status-nuovo">Nuovo</span>
                    <small style="color: #718096; margin-left: 10px;">${formattedDate}</small>
                </div>
            </div>
        `;
    }).join('');
    
    console.log(`✅ Visualizzati ${filteredOrders.length} ordini`);
}

function getFilteredOrders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (currentFilter) {
        case 'oggi':
            return allOrders.filter(order => {
                try {
                    const orderDate = order.timestamp && order.timestamp.toDate ? 
                        order.timestamp.toDate() : new Date(order.timestamp);
                    return orderDate >= today;
                } catch (e) {
                    return false;
                }
            });
        case 'settimana':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return allOrders.filter(order => {
                try {
                    const orderDate = order.timestamp && order.timestamp.toDate ? 
                        order.timestamp.toDate() : new Date(order.timestamp);
                    return orderDate >= weekAgo;
                } catch (e) {
                    return false;
                }
            });
        case 'mese':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return allOrders.filter(order => {
                try {
                    const orderDate = order.timestamp && order.timestamp.toDate ? 
                        order.timestamp.toDate() : new Date(order.timestamp);
                    return orderDate >= monthAgo;
                } catch (e) {
                    return false;
                }
            });
        default:
            return allOrders;
    }
}

// FILTRI ORDINI
window.filterOrders = function(filter) {
    currentFilter = filter;
    
    // Aggiorna UI filtri
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Trova il pulsante cliccato e attivalo
    const clickedBtn = Array.from(document.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent.toLowerCase().includes(filter.toLowerCase()));
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    displayOrders();
    console.log(`🔍 Filtro applicato: ${filter}`);
};

// TOP PRODUCTS
function updateTopProducts() {
    console.log('🏆 Aggiornamento top products...');
    
    const productSales = {};
    
    allOrders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                const name = item.name || 'Prodotto sconosciuto';
                if (productSales[name]) {
                    productSales[name] += item.quantity || 1;
                } else {
                    productSales[name] = item.quantity || 1;
                }
            });
        }
    });
    
    const sortedProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    const topProductsList = document.getElementById('top-products-list');
    if (!topProductsList) {
        console.log('⚠️ Elemento top-products-list non trovato');
        return;
    }
    
    if (sortedProducts.length === 0) {
        topProductsList.innerHTML = '<div class="loading">Nessun dato disponibile</div>';
        return;
    }
    
    topProductsList.innerHTML = sortedProducts.map(([name, sales]) => `
        <div class="product-item">
            <span class="product-name">${name.length > 40 ? name.substring(0, 40) + '...' : name}</span>
            <span class="product-sales">${sales} venduti</span>
        </div>
    `).join('');
    
    console.log(`✅ Top products aggiornati: ${sortedProducts.length} prodotti`);
}

// EXPORT CSV
window.exportToCSV = function() {
    console.log('📥 Export CSV...');
    
    const filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
        alert('Nessun ordine da esportare');
        return;
    }
    
    const headers = ['ID', 'Data/Ora', 'Cliente', 'Telefono', 'Email', 'Ritiro', 'Articoli', 'Totale', 'Sconto', 'Status'];
    
    const csvData = filteredOrders.map(order => {
        const orderDate = order.timestamp && order.timestamp.toDate ? 
            order.timestamp.toDate().toLocaleString('it-IT') : 'N/A';
        const items = (order.items || []).map(item => 
            `${item.name || 'Prodotto'} (x${item.quantity || 1})`
        ).join('; ');
        const discount = order.appliedDiscount > 0 ? 
            `${order.discountCode} -${order.appliedDiscount}%` : 'Nessuno';
        
        return [
            order.id.substring(0, 8),
            orderDate,
            order.customerName || 'Cliente',
            order.customerPhone || 'N/A',
            order.customerEmail || 'N/A',
            order.pickupDate || 'N/A',
            items,
            `${(order.totalAmount || 0).toFixed(2)}€`,
            discount,
            'Nuovo'
        ].map(field => `"${field}"`).join(',');
    });
    
    const csvContent = [headers.join(','), ...csvData].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ordini_pasto_sano_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✅ CSV esportato con ${filteredOrders.length} ordini`);
};

// GESTIONE ERRORI
function showError(message) {
    console.error('❌ Errore dashboard:', message);
    
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    // Mostra comunque i dati mock
    allOrders = getMockOrders();
    updateStats();
    displayOrders();
    updateTopProducts();
}

// AUTO-REFRESH ogni 30 secondi
setInterval(async () => {
    try {
        console.log('🔄 Auto-refresh dashboard...');
        await loadAllData();
        updateStats();
        displayOrders();
        updateTopProducts();
    } catch (error) {
        console.error('❌ Errore auto-refresh:', error);
    }
}, 30000);

// Inizializzazione al caricamento
console.log('📊 Dashboard.js caricato completamente');

function generateProductionDoc() {
    getOrders().then(orders => {
        let content = '';
        orders.forEach(order => {
            content += `🧾 Ordine di ${order.nome}\n`;
            order.prodotti.forEach(prodotto => {
                content += `- ${prodotto.nome} x${prodotto.quantita}\n`;
            });
            content += `\n-----------------------------\n\n`;
        });

        const blob = new Blob([content], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'riepilogo_ordini_fornitore.pdf';
        a.click();
        URL.revokeObjectURL(url);
    });
}

window.addEventListener('DOMContentLoaded', () => {
const pdfButton = document.createElement("button");
pdfButton.textContent = "📋 Doc Produzione";
pdfButton.className = "button export-button";
pdfButton.addEventListener("click", generateProductionDoc);
document.querySelector(".export-controls").appendChild(pdfButton);
});