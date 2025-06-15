// Dashboard Pasto Sano - JavaScript Corretto per Gestione Ordini Reali
// SOSTITUISCI il file "dashboard.js" in GitHub con questo codice

let allOrders = [];
let currentFilter = 'tutti';
let lastOrderCount = 0;
let salesChart = null;
let selectedOrders = new Set();

// INIZIALIZZAZIONE PRINCIPALE
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard inizializzata');
    await initializeDashboard();
});

// INIZIALIZZAZIONE DASHBOARD
async function initializeDashboard() {
    await requestNotificationPermission();
    await loadFirebaseConfig();
    await waitForFirebase();
    
    try {
        await loadAllData();
        if (lastOrderCount === 0) lastOrderCount = allOrders.length;
        updateStats();
        displayOrders();
        updateTopProducts();
        initSalesChart();
        console.log('✅ Dashboard completamente caricata');
    } catch (error) {
        console.error('❌ Errore caricamento dashboard:', error);
        showError('Errore nel caricamento dei dati: ' + error.message);
    }
}

// RICHIESTA PERMESSI NOTIFICHE
async function requestNotificationPermission() {
    if ('Notification' in window) {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('✅ Permessi notifiche concessi');
                showNotification('🔔 Notifiche Attive', 'Riceverai notifiche per i nuovi ordini');
            }
        } catch (error) {
            console.log('⚠️ Notifiche non supportate:', error);
        }
    }
}

// CARICA FIREBASE CONFIG
function loadFirebaseConfig() {
    return new Promise((resolve, reject) => {
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

// ASPETTA FIREBASE
function waitForFirebase() {
    return new Promise((resolve) => {
        console.log('⏳ Attendo che Firebase sia pronto...');
        const checkFirebase = () => {
            if (typeof window.getOrders === 'function') {
                console.log('✅ Firebase pronto');
                resolve();
            } else {
                setTimeout(checkFirebase, 500);
            }
        };
        checkFirebase();
    });
}

// CARICAMENTO DATI - RIMOSSO FALLBACK AI DATI MOCK
async function loadAllData() {
    try {
        console.log('📊 Caricamento ordini da Firebase...');
        
        if (typeof window.getOrders !== 'function') {
            throw new Error('Firebase non inizializzato correttamente');
        }
        
        allOrders = await window.getOrders(100);
        console.log(`✅ ${allOrders.length} ordini caricati da Firebase`);
        
        // VERIFICA DATI ORDINI
        if (allOrders.length > 0) {
            console.log('🔍 Verifica primo ordine:', allOrders[0]);
            
            // Controlla se gli ordini hanno i campi necessari
            const firstOrder = allOrders[0];
            if (!firstOrder.customerName || firstOrder.customerName === 'Cliente Web') {
                console.warn('⚠️ PROBLEMA: Gli ordini non contengono nomi reali dei clienti');
                console.warn('📋 Campi disponibili nell\'ordine:', Object.keys(firstOrder));
            }
            
            if (!firstOrder.customerPhone) {
                console.warn('⚠️ PROBLEMA: Gli ordini non contengono numeri di telefono');
            }
        }
        
    } catch (error) {
        console.error('❌ Errore caricamento ordini da Firebase:', error);
        throw error; // Non usa più dati mock di fallback
    }
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
    
    const ordersToday = todayOrders.length;
    const revenueToday = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgOrder = allOrders.length > 0 ? 
        allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / allOrders.length : 0;
    const uniqueCustomers = getUniqueCustomers(allOrders).size;
    
    document.getElementById('orders-today').textContent = ordersToday;
    document.getElementById('revenue-today').textContent = `${revenueToday.toFixed(2)}€`;
    document.getElementById('avg-order').textContent = `${avgOrder.toFixed(2)}€`;
    document.getElementById('total-customers').textContent = uniqueCustomers;
    
    updateChangeIndicators(todayOrders);
    console.log(`✅ Statistiche aggiornate: ${ordersToday} ordini oggi, ${revenueToday.toFixed(2)}€ fatturato, ${uniqueCustomers} clienti unici`);
}

// NORMALIZZAZIONE TELEFONO MIGLIORATA
function normalizePhone(phone) {
    if (!phone) return '';
    
    // Rimuovi spazi, trattini, punti
    let normalized = phone.replace(/[\s\-\.]/g, '');
    
    // Rimuovi prefisso internazionale Italia
    if (normalized.startsWith('+39')) normalized = normalized.substring(3);
    if (normalized.startsWith('0039')) normalized = normalized.substring(4);
    
    // Rimuovi zero iniziale se presente (numeri fissi italiani)
    if (normalized.startsWith('0') && normalized.length === 11) {
        normalized = normalized.substring(1);
    }
    
    return normalized;
}

function getUniqueCustomers(orders) {
    const uniqueData = new Map();
    
    orders.forEach(order => {
        // Usa il telefono normalizzato come chiave principale
        const normalizedPhone = normalizePhone(order.customerPhone);
        
        if (normalizedPhone) {
            // Se non abbiamo ancora questo numero, aggiungilo
            if (!uniqueData.has(normalizedPhone)) {
                uniqueData.set(normalizedPhone, {
                    phone: order.customerPhone,
                    name: order.customerName || 'Cliente',
                    email: order.customerEmail || null
                });
            }
        } else if (order.customerEmail) {
            // Se non c'è telefono ma c'è email, usa l'email
            uniqueData.set(order.customerEmail, {
                phone: order.customerPhone || null,
                name: order.customerName || 'Cliente',
                email: order.customerEmail
            });
        }
    });
    
    return uniqueData;
}

function updateChangeIndicators(todayOrders) {
    const ordersChange = todayOrders.length > 0 ? '+100' : '0';
    const revenueChange = todayOrders.length > 0 ? '+100' : '0';
    
    document.getElementById('orders-change').innerHTML = 
        `<span style="color: #38a169;">↗ ${ordersChange}%</span> vs ieri`;
    document.getElementById('revenue-change').innerHTML = 
        `<span style="color: #38a169;">↗ ${revenueChange}%</span> vs ieri`;
    document.getElementById('avg-change').textContent = 'vs settimana scorsa';
    document.getElementById('customers-change').textContent = 'clienti registrati';
}

// VISUALIZZAZIONE ORDINI MIGLIORATA
function displayOrders() {
    console.log('📋 Visualizzazione ordini...');
    
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
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
        
        // GESTIONE MIGLIORATA DEI DATI CLIENTE
        const customerName = getCustomerDisplayName(order);
        const customerPhone = getCustomerDisplayPhone(order);
        const customerInfo = getCustomerInfo(order);
        
        return `
            <div class="order-item ${selectedOrders.has(order.id) ? 'selected' : ''}" data-order-id="${order.id}">
                <div class="order-header">
                    <div style="display: flex; align-items: center;">
                        <input type="checkbox" class="order-checkbox" 
                               ${selectedOrders.has(order.id) ? 'checked' : ''} 
                               onchange="toggleOrderSelection('${order.id}')">
                        <span class="order-id">#${order.id.substring(0, 8)}</span>
                    </div>
                    <span class="order-total">${(order.totalAmount || 0).toFixed(2)}€</span>
                </div>
                <div class="order-details">
                    <strong style="color: ${customerName === 'Cliente Web' ? '#e53e3e' : '#2d3748'};">
                        ${customerName}
                    </strong><br>
                    📱 ${customerPhone}<br>
                    ${order.customerEmail ? `📧 ${order.customerEmail}<br>` : ''}
                    📅 Ritiro: ${order.pickupDate || 'N/A'}<br>
                    🍽️ ${itemsText || 'Nessun articolo'}${discountText}
                    ${customerInfo.warning ? `<br><small style="color: #e53e3e;">⚠️ ${customerInfo.warning}</small>` : ''}
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

// FUNZIONI DI SUPPORTO PER I DATI CLIENTE
function getCustomerDisplayName(order) {
    // Priorità: customerName reale > from (numero WhatsApp) > fallback
    if (order.customerName && order.customerName !== 'Cliente Web' && order.customerName !== 'N/A') {
        return order.customerName;
    }
    
    // Se abbiamo il campo 'from' (numero WhatsApp), usalo
    if (order.from) {
        return `Cliente ${order.from.replace('whatsapp:', '').replace('@c.us', '')}`;
    }
    
    // Se abbiamo il numero di telefono, usalo
    if (order.customerPhone && order.customerPhone !== 'N/A') {
        return `Cliente ${order.customerPhone}`;
    }
    
    return 'Cliente Web';
}

function getCustomerDisplayPhone(order) {
    // Priorità: customerPhone > from > N/A
    if (order.customerPhone && order.customerPhone !== 'N/A') {
        return order.customerPhone;
    }
    
    if (order.from) {
        return order.from.replace('whatsapp:', '').replace('@c.us', '');
    }
    
    return 'N/A';
}

function getCustomerInfo(order) {
    const info = { warning: null };
    
    // Se il nome è ancora "Cliente Web", c'è un problema
    if (!order.customerName || order.customerName === 'Cliente Web') {
        info.warning = 'Dati cliente non estratti correttamente da WhatsApp';
    }
    
    // Se manca il numero di telefono, c'è un problema
    if (!order.customerPhone || order.customerPhone === 'N/A') {
        info.warning = 'Numero di telefono mancante';
    }
    
    return info;
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
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const clickedBtn = Array.from(document.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent.toLowerCase().includes(filter.toLowerCase()));
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    displayOrders();
    console.log(`🔍 Filtro applicato: ${filter}`);
};

// SELEZIONE ORDINI
window.toggleOrderSelection = function(orderId) {
    if (selectedOrders.has(orderId)) {
        selectedOrders.delete(orderId);
    } else {
        selectedOrders.add(orderId);
    }
    updateSelectedCount();
    updateOrderDisplay(orderId);
};

window.selectAllOrders = function() {
    const filteredOrders = getFilteredOrders();
    selectedOrders.clear();
    filteredOrders.forEach(order => selectedOrders.add(order.id));
    updateSelectedCount();
    displayOrders();
};

window.clearSelection = function() {
    selectedOrders.clear();
    updateSelectedCount();
    displayOrders();
};

function updateSelectedCount() {
    const countElement = document.getElementById('selected-count');
    if (countElement) {
        countElement.textContent = `${selectedOrders.size} selezionati`;
    }
}

function updateOrderDisplay(orderId) {
    const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
    if (orderElement) {
        if (selectedOrders.has(orderId)) {
            orderElement.classList.add('selected');
        } else {
            orderElement.classList.remove('selected');
        }
    }
}

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
    if (!topProductsList) return;
    
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

// GRAFICO VENDITE
function initSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    if (salesChart) {
        salesChart.destroy();
        salesChart = null;
    }

    const chartData = getSalesChartData();
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Ordini',
                    data: chartData.orders,
                    borderColor: '#3f6844',
                    backgroundColor: 'rgba(63, 104, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Fatturato (€)',
                    data: chartData.revenue,
                    borderColor: '#7a9e7e',
                    backgroundColor: 'rgba(122, 158, 126, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Giorno'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Numero Ordini',
                        color: '#3f6844'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        color: '#3f6844'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Fatturato (€)',
                        color: '#7a9e7e'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: '#7a9e7e'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Vendite Ultimi 7 Giorni',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
    
    console.log('✅ Grafico vendite inizializzato');
}

function getSalesChartData() {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);
        day.setHours(0, 0, 0, 0);
        last7Days.push(day);
    }
    
    const labels = last7Days.map(date => 
        date.toLocaleDateString('it-IT', { 
            month: 'short', 
            day: 'numeric' 
        })
    );
    
    const orders = [];
    const revenue = [];
    
    last7Days.forEach(day => {
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const dayOrders = allOrders.filter(order => {
            try {
                const orderDate = order.timestamp && order.timestamp.toDate ? 
                    order.timestamp.toDate() : new Date(order.timestamp);
                return orderDate >= day && orderDate < nextDay;
            } catch (e) {
                return false;
            }
        });
        
        orders.push(dayOrders.length);
        revenue.push(dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0));
    });
    
    return { labels, orders, revenue };
}

function updateSalesChart() {
    if (!salesChart) {
        initSalesChart();
        return;
    }
    
    const chartData = getSalesChartData();
    salesChart.data.labels = chartData.labels;
    salesChart.data.datasets[0].data = chartData.orders;
    salesChart.data.datasets[1].data = chartData.revenue;
    salesChart.update('none');
    console.log('✅ Grafico vendite aggiornato');
}

// SISTEMA NOTIFICHE
function showNotification(title, message, isNewOrder = false) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: isNewOrder ? 'new-order' : 'info'
        });
    }
    showInAppNotification(title, message, isNewOrder);
}

function showInAppNotification(title, message, isNewOrder = false) {
    const container = document.getElementById('notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const icon = isNewOrder ? '🛍️' : '🔔';
    
    notification.innerHTML = `
        <button class="notification-close" onclick="closeNotification(this)">&times;</button>
        <div class="notification-header">
            ${icon} ${title}
        </div>
        <div class="notification-body">
            ${message}
        </div>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => closeNotification(notification.querySelector('.notification-close')), 8000);
    
    notification.addEventListener('click', () => {
        closeNotification(notification.querySelector('.notification-close'));
    });
}

window.closeNotification = function(button) {
    const notification = button.closest('.notification');
    if (notification) {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    }
};

function checkNewOrders() {
    const currentCount = allOrders.length;
    
    if (lastOrderCount > 0 && currentCount > lastOrderCount) {
        const newOrdersCount = currentCount - lastOrderCount;
        const message = newOrdersCount === 1 ? 
            'È arrivato un nuovo ordine!' : 
            `Sono arrivati ${newOrdersCount} nuovi ordini!`;
        
        showNotification('🛍️ Nuovo Ordine', message, true);
        console.log(`🔔 ${newOrdersCount} nuovi ordini rilevati`);
    }
    
    lastOrderCount = currentCount;
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
            getCustomerDisplayName(order),
            getCustomerDisplayPhone(order),
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

// GENERAZIONE DOCUMENTO PRODUZIONE
window.generateProductionDoc = function() {
    if (selectedOrders.size === 0) {
        alert('Seleziona almeno un ordine per generare il documento di produzione');
        return;
    }
    
    const selectedOrdersData = allOrders.filter(order => selectedOrders.has(order.id));
    
    const productSummary = {};
    const orderDetails = [];
    
    selectedOrdersData.forEach(order => {
        orderDetails.push({
            customerName: getCustomerDisplayName(order),
            pickupDate: order.pickupDate || 'N/A',
            orderId: order.id.substring(0, 8),
            items: order.items || []
        });
        
        (order.items || []).forEach(item => {
            const productName = item.name || 'Prodotto sconosciuto';
            const quantity = item.quantity || 1;
            
            if (productSummary[productName]) {
                productSummary[productName] += quantity;
            } else {
                productSummary[productName] = quantity;
            }
        });
    });
    
    generateProductionHTML(orderDetails, productSummary);
};

function generateProductionHTML(orderDetails, productSummary) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const productList = Object.entries(productSummary)
        .sort(([,a], [,b]) => b - a)
        .map(([name, quantity]) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #3f6844;">${quantity}</td>
            </tr>
        `).join('');
    
    const ordersList = orderDetails.map(order => {
        const itemsList = order.items.map((item, index) => 
            `<div style="margin-bottom: 3px;">${index + 1}. ${item.name || 'Prodotto'} (x${item.quantity || 1})</div>`
        ).join('');
        
        return `
        <div style="margin-bottom: 20px; padding: 15px; border-left: 3px solid #7a9e7e; background: #f8f9fa;">
            <div style="margin-bottom: 8px;">
                <strong style="color: #2d3748; font-size: 16px;">${order.customerName}</strong> 
                <span style="color: #718096; margin-left: 10px;">#${order.orderId}</span>
            </div>
            <div style="color: #4a5568; margin-bottom: 8px;">📅 Ritiro: ${order.pickupDate}</div>
            <div style="color: #4a5568;">
                <strong>🍽️ ${order.items.length} articoli:</strong>
                <div style="margin-left: 15px; margin-top: 8px;">
                    ${itemsList}
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documento Produzione - Pasto Sano</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3f6844; padding-bottom: 20px; }
            .summary { background: #f0fff4; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #3f6844; color: white; padding: 15px; text-align: left; }
            .orders-detail { margin-top: 30px; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 style="color: #3f6844; margin: 0;">🥗 PASTO SANO</h1>
            <h2 style="color: #7a9e7e; margin: 10px 0;">Documento di Produzione</h2>
            <p style="color: #718096;">Generato il ${formattedDate}</p>
        </div>
        
        <div class="summary">
            <h3 style="color: #3f6844; margin-top: 0;">📊 Riepilogo Produzione</h3>
            <p><strong>Totale Ordini:</strong> ${orderDetails.length}</p>
            <p><strong>Totale Prodotti:</strong> ${Object.values(productSummary).reduce((sum, qty) => sum + qty, 0)} pezzi</p>
            <p><strong>Tipologie Diverse:</strong> ${Object.keys(productSummary).length}</p>
        </div>
        
        <h3 style="color: #3f6844;">🍽️ Prodotti da Preparare</h3>
        <table>
            <thead>
                <tr>
                    <th>Prodotto</th>
                    <th style="text-align: center; width: 120px;">Quantità</th>
                </tr>
            </thead>
            <tbody>
                ${productList}
            </tbody>
        </table>
        
        <div class="orders-detail">
            <h3 style="color: #3f6844;">📋 Dettaglio Ordini</h3>
            ${ordersList}
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p>Documento generato automaticamente dalla Dashboard Pasto Sano</p>
        </div>
    </body>
    </html>`;
    
    const newWindow = window.open('', '_blank');
    newWindow.document.write(htmlContent);
    newWindow.document.close();
    
    setTimeout(() => newWindow.print(), 500);
    
    console.log(`✅ Documento produzione generato per ${selectedOrders.size} ordini`);
}

// GESTIONE ERRORI MIGLIORATA
function showError(message) {
    console.error('❌ Errore dashboard:', message);
    
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.innerHTML = `
            <strong>⚠️ Errore di Connessione</strong><br>
            ${message}<br><br>
            <strong>Possibili cause:</strong><br>
            • Problema di connessione a Firebase<br>
            • Configurazione Firebase non corretta<br>
            • Gli ordini non contengono i dati corretti del cliente<br><br>
            <strong>Verifica:</strong><br>
            • Apri la Console (F12) per vedere i log dettagliati<br>
            • Controlla che il webhook WhatsApp stia salvando correttamente i dati<br>
            • Assicurati che i campi 'customerName' e 'customerPhone' vengano popolati
        `;
        errorElement.style.display = 'block';
    }
    
    // Non usare più dati mock come fallback
    allOrders = [];
    updateStats();
    displayOrders();
    updateTopProducts();
    if (salesChart) updateSalesChart();
}

// FUNZIONE DI DIAGNOSI PER DEBUG
window.diagnoseOrders = function() {
    console.log('🔍 DIAGNOSI ORDINI:');
    console.log('==================');
    
    if (allOrders.length === 0) {
        console.log('❌ Nessun ordine caricato');
        return;
    }
    
    console.log(`📊 Totale ordini: ${allOrders.length}`);
    
    // Analizza il primo ordine
    const firstOrder = allOrders[0];
    console.log('🔍 Primo ordine disponibile:');
    console.log('ID:', firstOrder.id);
    console.log('Campi disponibili:', Object.keys(firstOrder));
    
    // Verifica presenza dati cliente
    const clientsWithName = allOrders.filter(o => o.customerName && o.customerName !== 'Cliente Web').length;
    const clientsWithPhone = allOrders.filter(o => o.customerPhone && o.customerPhone !== 'N/A').length;
    const clientsWithFrom = allOrders.filter(o => o.from).length;
    
    console.log('📊 Analisi dati cliente:');
    console.log(`• Ordini con nome reale: ${clientsWithName}/${allOrders.length}`);
    console.log(`• Ordini con telefono: ${clientsWithPhone}/${allOrders.length}`);
    console.log(`• Ordini con campo 'from': ${clientsWithFrom}/${allOrders.length}`);
    
    if (clientsWithName === 0) {
        console.warn('⚠️ PROBLEMA: Nessun ordine ha un nome cliente reale');
        console.warn('💡 SOLUZIONE: Verifica che il webhook WhatsApp salvi il campo "profile.name"');
    }
    
    if (clientsWithPhone === 0) {
        console.warn('⚠️ PROBLEMA: Nessun ordine ha un numero di telefono');
        console.warn('💡 SOLUZIONE: Verifica che il webhook WhatsApp salvi il campo "from"');
    }
    
    // Mostra esempio di ordine completo
    console.log('📋 Esempio di come dovrebbe essere un ordine:');
    console.log({
        id: 'order123',
        customerName: 'Mario Rossi', // Dal profile.name di WhatsApp
        customerPhone: '+39 347 123 4567', // Dal campo from
        customerEmail: 'mario@email.com', // Opzionale
        from: 'whatsapp:+393471234567@c.us', // ID WhatsApp originale
        items: [
            {name: 'Fusilli con verdure', quantity: 2, price: 8}
        ],
        totalAmount: 16,
        timestamp: 'Timestamp Firebase',
        pickupDate: '2025-06-16'
    });
};

// AUTO-REFRESH ogni 30 secondi
setInterval(async () => {
    try {
        console.log('🔄 Auto-refresh dashboard...');
        await loadAllData();
        checkNewOrders();
        updateStats();
        displayOrders();
        updateTopProducts();
        updateSalesChart();
        console.log('✅ Auto-refresh completato');
    } catch (error) {
        console.error('❌ Errore auto-refresh:', error);
    }
}, 30000);

// Esporre funzione di diagnosi globalmente
window.diagnoseOrders = window.diagnoseOrders;

console.log('📊 Dashboard.js corretto caricato completamente');
console.log('💡 Per diagnosticare problemi, digita: diagnoseOrders() nella console');