// DASHBOARD.JS - VERSIONE MIGLIORATA

// State management
let allOrders = [];
let selectedOrders = [];
let currentFilter = 'tutti';
let chart = null;
let soundEnabled = true;
let lastNotificationTime = 0;

// Real-time listener
let ordersListener = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inizializzazione Dashboard...');
    
    if (typeof firebase === 'undefined') {
        showError('Firebase non caricato correttamente');
        return;
    }

    try {
        await initializeFirestore();
        await loadDashboardData();
        setupRealTimeListener();
        initializeChart();
        
        console.log('✅ Dashboard inizializzata correttamente');
    } catch (error) {
        console.error('❌ Errore inizializzazione:', error);
        showError('Errore durante il caricamento dei dati: ' + error.message);
    }
});

// Setup Firestore real-time listener con notifiche migliorate
function setupRealTimeListener() {
    console.log('🔄 Configurazione listener real-time...');
    
    if (ordersListener) {
        ordersListener();
    }

    ordersListener = firebase.firestore()
        .collection('orders')
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            console.log('📡 Aggiornamento real-time ricevuto');
            
            let hasNewOrders = false;
            let newOrdersCount = 0;
            let newOrdersData = [];
            
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const orderData = change.doc.data();
                    const orderTime = orderData.timestamp?.toDate?.()?.getTime() || Date.now();
                    
                    // Considera "nuovo" solo se aggiunto negli ultimi 30 secondi
                    if (orderTime > lastNotificationTime && (Date.now() - orderTime) < 30000) {
                        hasNewOrders = true;
                        newOrdersCount++;
                        newOrdersData.push({
                            id: change.doc.id,
                            ...orderData
                        });
                    }
                }
            });

            // Aggiorna i dati
            updateOrdersFromSnapshot(snapshot);
            
            // Mostra notifiche solo per ordini veramente nuovi
            if (hasNewOrders && newOrdersCount > 0) {
                console.log(`🆕 ${newOrdersCount} nuovo/i ordine/i rilevato/i`);
                showNewOrderNotification(newOrdersCount, newOrdersData);
                playNotificationSound();
                lastNotificationTime = Date.now();
            }
            
            calculateStats();
            renderOrders();
            updateTopProducts();
        }, (error) => {
            console.error('❌ Errore listener:', error);
            showError('Errore connessione real-time: ' + error.message);
        });
}

// Funzione migliorata per notifiche ordini nuovi
function showNewOrderNotification(count, orders) {
    const container = document.getElementById('notifications');
    if (!container) return;

    // Crea notifica principale
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const mainOrder = orders[0];
    const customerName = mainOrder.customerName || 'Cliente Sconosciuto';
    const total = mainOrder.totalAmount || 0;
    const paymentMethod = mainOrder.paymentMethodName || mainOrder.paymentMethod || 'Non specificato';
    const pickupDate = mainOrder.pickupDate || 'Data non specificata';
    
    notification.innerHTML = `
        <button class="notification-close">&times;</button>
        <div class="notification-header">
            <span>🆕</span>
            ${count === 1 ? 'Nuovo Ordine!' : `${count} Nuovi Ordini!`}
        </div>
        <div class="notification-body">
            <strong>${customerName}</strong><br>
            💰 ${total.toFixed(2)}€ - ${paymentMethod}<br>
            📅 Ritiro: ${formatDate(pickupDate)}<br>
            📱 Tel: ${mainOrder.customerPhone || 'Non fornito'}
            ${count > 1 ? `<br><small>+ altri ${count-1} ordini</small>` : ''}
        </div>
    `;

    // Event listeners
    notification.querySelector('.notification-close').addEventListener('click', (e) => {
        e.stopPropagation();
        hideNotification(notification);
    });

    notification.addEventListener('click', () => {
        hideNotification(notification);
        // Scroll to the new order in the list
        const orderElement = document.querySelector(`[data-order-id="${mainOrder.id}"]`);
        if (orderElement) {
            orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            orderElement.style.backgroundColor = '#fffbeb';
            setTimeout(() => {
                orderElement.style.backgroundColor = '';
            }, 3000);
        }
    });

    container.appendChild(notification);

    // Show with animation
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-hide after 8 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            hideNotification(notification);
        }
    }, 8000);
}

// Funzione helper per nascondere notifiche
function hideNotification(notification) {
    notification.classList.add('hide');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Migliorata: Update orders from Firestore snapshot
function updateOrdersFromSnapshot(snapshot) {
    allOrders = [];
    
    snapshot.forEach((doc) => {
        const data = doc.data();
        const order = {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date()
        };
        allOrders.push(order);
    });
    
    console.log(`📦 ${allOrders.length} ordini caricati`);
}

// Migliorata: Render orders con più informazioni
function renderOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;

    const filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #a0aec0;">
                <p>📭 Nessun ordine trovato per il filtro selezionato</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredOrders.map(order => {
        const isSelected = selectedOrders.includes(order.id);
        const formattedDate = formatDateTime(order.timestamp);
        const statusClass = getStatusClass(order.status);
        const statusText = getStatusText(order.status);
        
        // Calcola numero totale articoli
        const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        
        return `
            <div class="order-item ${isSelected ? 'selected' : ''}" data-order-id="${order.id}">
                <div class="order-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" class="order-checkbox" 
                               ${isSelected ? 'checked' : ''} 
                               onchange="toggleOrderSelection('${order.id}')">
                        <span class="order-id">#${order.id.substring(0, 8)}</span>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <span class="order-total">${(order.totalAmount || 0).toFixed(2)}€</span>
                </div>
                
                <div class="order-details">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                        <div>
                            <strong>👤 ${order.customerName || 'Nome non disponibile'}</strong><br>
                            📱 <a href="tel:${order.customerPhone || ''}" style="color: #7a9e7e; text-decoration: none;">
                                ${order.customerPhone || 'Telefono non fornito'}
                            </a>
                        </div>
                        <div>
                            📅 <strong>Ritiro:</strong> ${formatDate(order.pickupDate)}<br>
                            💳 <strong>Pagamento:</strong> ${order.paymentMethodName || order.paymentMethod || 'Non specificato'}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 8px;">
                        <strong>📋 Ordine (${totalItems} pezzi):</strong><br>
                        ${order.items?.map(item => 
                            `• ${item.name} x${item.quantity || 1} (${((item.price || 0) * (item.quantity || 1)).toFixed(2)}€)`
                        ).join('<br>') || 'Dettagli non disponibili'}
                    </div>
                    
                    ${order.discountCode ? `
                        <div style="color: #dc3545; font-weight: 600; margin-bottom: 8px;">
                            🎁 Sconto ${order.discountCode} (-${order.discountPercent || 0}%): 
                            -${(order.discountAmount || 0).toFixed(2)}€
                        </div>
                    ` : ''}
                    
                    <small style="color: #6c757d;">
                        🕒 Ordinato il ${formattedDate} • 
                        ${order.source === 'website' ? '🌐 Sito Web' : '📱 App'} •
                        ID: ${order.id}
                    </small>
                </div>
            </div>
        `;
    }).join('');

    updateSelectedCount();
}

// Funzione helper per formattare data e ora
function formatDateTime(date) {
    if (!date) return 'Data non disponibile';
    
    const options = {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Date(date).toLocaleDateString('it-IT', options);
}

// Funzione helper per formattare solo la data
function formatDate(dateString) {
    if (!dateString) return 'Non specificata';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// Play notification sound
function playNotificationSound() {
    if (!soundEnabled) return;
    
    try {
        // Crea un suono semplice usando AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        console.log('🔊 Suono notifica riprodotto');
    } catch (error) {
        console.log('🔇 Impossibile riprodurre suono:', error.message);
    }
}

// Toggle order selection
function toggleOrderSelection(orderId) {
    const index = selectedOrders.indexOf(orderId);
    
    if (index > -1) {
        selectedOrders.splice(index, 1);
    } else {
        selectedOrders.push(orderId);
    }
    
    renderOrders();
}

// Select all orders
function selectAllOrders() {
    const filteredOrders = getFilteredOrders();
    selectedOrders = filteredOrders.map(order => order.id);
    renderOrders();
}

// Clear selection
function clearSelection() {
    selectedOrders = [];
    renderOrders();
}

// Update selected count
function updateSelectedCount() {
    const countElement = document.getElementById('selected-count');
    if (countElement) {
        countElement.textContent = `${selectedOrders.length} selezionati`;
    }
}

// Get filtered orders based on current filter
function getFilteredOrders() {
    const now = new Date();
    
    return allOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        
        switch (currentFilter) {
            case 'oggi':
                return orderDate.toDateString() === now.toDateString();
            case 'settimana':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return orderDate >= weekAgo;
            case 'mese':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return orderDate >= monthAgo;
            default:
                return true;
        }
    });
}

// Filter orders
function filterOrders(filter) {
    currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderOrders();
    calculateStats();
}

// Calculate and display statistics
function calculateStats() {
    const now = new Date();
    const today = now.toDateString();
    
    // Ordini oggi
    const todayOrders = allOrders.filter(order => 
        new Date(order.timestamp).toDateString() === today
    );
    
    // Fatturato oggi
    const todayRevenue = todayOrders.reduce((sum, order) => 
        sum + (order.totalAmount || 0), 0
    );
    
    // Ordine medio
    const avgOrder = allOrders.length > 0 ? 
        allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / allOrders.length : 0;
    
    // Clienti unici
    const uniqueCustomers = new Set(allOrders.map(order => order.customerName)).size;
    
    // Update DOM
    updateStatElement('orders-today', todayOrders.length.toString());
    updateStatElement('revenue-today', `${todayRevenue.toFixed(2)}€`);
    updateStatElement('avg-order', `${avgOrder.toFixed(2)}€`);
    updateStatElement('total-customers', uniqueCustomers.toString());
    
    // Update changes (simplified)
    updateStatElement('orders-change', `${todayOrders.length} ordini oggi`);
    updateStatElement('revenue-change', `${todayRevenue.toFixed(2)}€ oggi`);
    updateStatElement('avg-change', `Media generale`);
    updateStatElement('customers-change', `${uniqueCustomers} clienti unici`);
}

// Update statistic element
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Get status class for styling
function getStatusClass(status) {
    switch (status?.toLowerCase()) {
        case 'pending': return 'status-nuovo';
        case 'confirmed': return 'status-confermato';
        case 'ready': return 'status-pronto';
        case 'paid': return 'status-confermato';
        default: return 'status-nuovo';
    }
}

// Get status text
function getStatusText(status) {
    switch (status?.toLowerCase()) {
        case 'pending': return 'Da Confermare';
        case 'confirmed': return 'Confermato';
        case 'ready': return 'Pronto';
        case 'paid': return 'Pagato';
        default: return 'Nuovo';
    }
}

// Export to CSV
function exportToCSV() {
    const ordersToExport = selectedOrders.length > 0 ? 
        allOrders.filter(order => selectedOrders.includes(order.id)) : 
        getFilteredOrders();
    
    if (ordersToExport.length === 0) {
        alert('Nessun ordine da esportare');
        return;
    }
    
    const headers = [
        'ID Ordine', 'Cliente', 'Telefono', 'Data Ordine', 'Data Ritiro', 
        'Metodo Pagamento', 'Status', 'Totale', 'Sconto', 'Articoli', 'Dettagli'
    ];
    
    const csvData = ordersToExport.map(order => [
        order.id,
        `"${order.customerName || ''}"`,
        `"${order.customerPhone || ''}"`,
        formatDateTime(order.timestamp),
        formatDate(order.pickupDate),
        `"${order.paymentMethodName || order.paymentMethod || ''}"`,
        getStatusText(order.status),
        (order.totalAmount || 0).toFixed(2),
        order.discountCode || '',
        order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
        `"${order.items?.map(item => `${item.name} x${item.quantity || 1}`).join('; ') || ''}"`
    ]);
    
    const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ordini_pasto_sano_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`📥 Esportati ${ordersToExport.length} ordini in CSV`);
}

// Generate production document
function generateProductionDoc() {
    const ordersToProcess = selectedOrders.length > 0 ? 
        allOrders.filter(order => selectedOrders.includes(order.id)) : 
        getFilteredOrders();
    
    if (ordersToProcess.length === 0) {
        alert('Nessun ordine selezionato per la produzione');
        return;
    }
    
    // Raggruppa gli articoli per nome
    const itemsCount = {};
    let totalRevenue = 0;
    
    ordersToProcess.forEach(order => {
        totalRevenue += order.totalAmount || 0;
        
        order.items?.forEach(item => {
            const itemName = item.name;
            const quantity = item.quantity || 1;
            
            if (itemsCount[itemName]) {
                itemsCount[itemName] += quantity;
            } else {
                itemsCount[itemName] = quantity;
            }
        });
    });
    
    // Genera documento di produzione
    let productionDoc = `📋 DOCUMENTO DI PRODUZIONE - PASTO SANO\n`;
    productionDoc += `📅 Generato il: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}\n`;
    productionDoc += `📦 Ordini da processare: ${ordersToProcess.length}\n`;
    productionDoc += `💰 Fatturato totale: €${totalRevenue.toFixed(2)}\n\n`;
    
    productionDoc += `🍽️ RIEPILOGO PRODUZIONE:\n`;
    productionDoc += `${'='.repeat(50)}\n`;
    
    // Ordina per quantità decrescente
    const sortedItems = Object.entries(itemsCount)
        .sort(([,a], [,b]) => b - a);
    
    sortedItems.forEach(([itemName, quantity]) => {
        productionDoc += `• ${itemName}: ${quantity} porzioni\n`;
    });
    
    productionDoc += `\n📋 DETTAGLI ORDINI PER CLIENTE:\n`;
    productionDoc += `${'='.repeat(50)}\n`;
    
    ordersToProcess
        .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate))
        .forEach(order => {
            productionDoc += `\n👤 ${order.customerName || 'Cliente'} - Tel: ${order.customerPhone || 'N/A'}\n`;
            productionDoc += `📅 Ritiro: ${formatDate(order.pickupDate)} - ${order.paymentMethodName || order.paymentMethod}\n`;
            productionDoc += `💰 Totale: €${(order.totalAmount || 0).toFixed(2)}\n`;
            
            if (order.discountCode) {
                productionDoc += `🎁 Sconto: ${order.discountCode} (-${order.discountPercent}%)\n`;
            }
            
            productionDoc += `📋 Articoli:\n`;
            order.items?.forEach(item => {
                productionDoc += `   • ${item.name} x${item.quantity || 1}\n`;
            });
            productionDoc += `${'─'.repeat(30)}\n`;
        });
    
    // Download del documento
    const blob = new Blob([productionDoc], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `produzione_${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`📋 Documento di produzione generato per ${ordersToProcess.length} ordini`);
}

// Update top products
function updateTopProducts() {
    const container = document.getElementById('top-products-list');
    if (!container) return;
    
    // Calcola i prodotti più venduti
    const productCounts = {};
    
    allOrders.forEach(order => {
        order.items?.forEach(item => {
            const name = item.name;
            const quantity = item.quantity || 1;
            
            if (productCounts[name]) {
                productCounts[name] += quantity;
            } else {
                productCounts[name] = quantity;
            }
        });
    });
    
    // Ordina per quantità
    const sortedProducts = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Top 10
    
    if (sortedProducts.length === 0) {
        container.innerHTML = '<div class="loading">Nessun dato disponibile</div>';
        return;
    }
    
    container.innerHTML = sortedProducts.map(([name, count]) => `
        <div class="product-item">
            <div class="product-name">${name}</div>
            <div class="product-sales">${count} venduti</div>
        </div>
    `).join('');
}

// Initialize chart
function initializeChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    // Dati demo per il grafico
    const last7Days = [];
    const revenues = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dayRevenue = allOrders
            .filter(order => {
                const orderDate = new Date(order.timestamp);
                return orderDate.toDateString() === date.toDateString();
            })
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        last7Days.push(date.toLocaleDateString('it-IT', { 
            day: '2-digit', 
            month: '2-digit' 
        }));
        revenues.push(dayRevenue);
    }
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Fatturato (€)',
                data: revenues,
                borderColor: '#7a9e7e',
                backgroundColor: 'rgba(122, 158, 126, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#7a9e7e',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '€' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#7a9e7e'
                }
            }
        }
    });
}

// Load dashboard data
async function loadDashboardData() {
    try {
        console.log('📊 Caricamento dati dashboard...');
        
        const snapshot = await firebase.firestore()
            .collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(500)
            .get();
        
        updateOrdersFromSnapshot(snapshot);
        calculateStats();
        renderOrders();
        updateTopProducts();
        
        // Set last notification time to now to avoid showing notifications for existing orders
        lastNotificationTime = Date.now();
        
        console.log('✅ Dati dashboard caricati');
        
    } catch (error) {
        console.error('❌ Errore caricamento dati:', error);
        throw error;
    }
}

// Initialize Firestore
async function initializeFirestore() {
    if (!firebase.apps.length) {
        throw new Error('Firebase non inizializzato');
    }
    
    console.log('🔥 Firebase collegato correttamente');
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    console.error('❌', message);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (ordersListener) {
        ordersListener();
    }
    if (chart) {
        chart.destroy();
    }
});

// Toggle sound notifications
function toggleSound() {
    soundEnabled = !soundEnabled;
    console.log(`🔊 Suoni notifiche: ${soundEnabled ? 'attivati' : 'disattivati'}`);
}

// Aggiungi controllo per i suoni nell'header (opzionale)
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header .container');
    if (header) {
        const soundButton = document.createElement('button');
        soundButton.innerHTML = '🔊';
        soundButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 24px;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        soundButton.title = 'Toggle notifiche sonore';
        soundButton.addEventListener('click', toggleSound);
        header.appendChild(soundButton);
    }
});

console.log('🎉 Dashboard script caricato completamente!');
console.log('🔔 Notifiche real-time attivate');
console.log('📱 Supporto telefono clienti integrato');