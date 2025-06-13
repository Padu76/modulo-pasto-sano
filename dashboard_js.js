// dashboard.js
// Dashboard analytics senza import ES6 (usa funzioni globali)

let allOrders = [];
let currentFilter = 'tutti';

// INIZIALIZZAZIONE
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inizializzazione dashboard...');
    
    // Carica Firebase config
    const script = document.createElement('script');
    script.src = './firebase-config.js';
    script.onload = async () => {
        console.log('📄 Firebase config caricato');
        
        // Aspetta che Firebase sia pronto
        await waitForFirebaseReady();
        
        try {
            await loadAllData();
            updateStats();
            displayOrders();
            updateTopProducts();
        } catch (error) {
            showError('Errore nel caricamento dei dati: ' + error.message);
        }
    };
    document.head.appendChild(script);
});

function waitForFirebaseReady() {
    return new Promise((resolve) => {
        if (typeof window.getOrders === 'function') {
            resolve();
        } else {
            window.addEventListener('firebaseReady', resolve);
        }
    });
}

// CARICAMENTO DATI
async function loadAllData() {
    try {
        console.log('📊 Caricamento dati ordini...');
        allOrders = await window.getOrders(100); // Ultimi 100 ordini
        console.log('✅ Ordini caricati:', allOrders.length);
    } catch (error) {
        console.error('❌ Errore caricamento ordini:', error);
        throw error;
    }
}

// AGGIORNAMENTO STATISTICHE
function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = allOrders.filter(order => {
        const orderDate = order.timestamp.toDate();
        return orderDate >= today;
    });
    
    const thisWeekOrders = allOrders.filter(order => {
        const orderDate = order.timestamp.toDate();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo;
    });
    
    const lastWeekOrders = allOrders.filter(order => {
        const orderDate = order.timestamp.toDate();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        return orderDate >= twoWeeksAgo && orderDate < weekAgo;
    });
    
    // Ordini oggi
    document.getElementById('orders-today').textContent = todayOrders.length;
    
    // Fatturato oggi
    const revenueToday = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    document.getElementById('revenue-today').textContent = `${revenueToday.toFixed(2)}€`;
    
    // Ordine medio
    const avgOrder = allOrders.length > 0 ? 
        allOrders.reduce((sum, order) => sum + order.totalAmount, 0) / allOrders.length : 0;
    document.getElementById('avg-order').textContent = `${avgOrder.toFixed(2)}€`;
    
    // Clienti unici
    const uniqueCustomers = new Set(allOrders.map(order => order.customerName.toLowerCase())).size;
    document.getElementById('total-customers').textContent = uniqueCustomers;
    
    // Calcolo variazioni settimanali
    const thisWeekRevenue = thisWeekOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const lastWeekRevenue = lastWeekOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const revenueChange = lastWeekRevenue > 0 ? 
        ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100) : 0;
    
    const ordersChange = lastWeekOrders.length > 0 ? 
        ((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length * 100) : 0;
    
    updateChangeIndicator('orders-change', ordersChange, 'ordini');
    updateChangeIndicator('revenue-change', revenueChange, 'fatturato');
    
    // Placeholder per altri indicatori
    document.getElementById('avg-change').textContent = 'vs settimana scorsa';
    document.getElementById('customers-change').textContent = 'clienti registrati';
}

function updateChangeIndicator(elementId, change, type) {
    const element = document.getElementById(elementId);
    const changeFormatted = Math.abs(change).toFixed(1);
    
    if (change > 0) {
        element.innerHTML = `<span style="color: #38a169;">↗ +${changeFormatted}%</span> vs settimana scorsa`;
        element.className = 'stat-change positive';
    } else if (change < 0) {
        element.innerHTML = `<span style="color: #e53e3e;">↘ -${changeFormatted}%</span> vs settimana scorsa`;
        element.className = 'stat-change negative';
    } else {
        element.innerHTML = `<span style="color: #718096;">→ 0%</span> vs settimana scorsa`;
        element.className = 'stat-change neutral';
    }
}

// VISUALIZZAZIONE ORDINI
function displayOrders() {
    const ordersList = document.getElementById('orders-list');
    let filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<div class="loading">Nessun ordine trovato per il filtro selezionato</div>';
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => {
        const orderDate = order.timestamp.toDate();
        const formattedDate = orderDate.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const itemsText = order.items.map(item => 
            `${item.name} (x${item.quantity})`
        ).join(', ');
        
        const discountText = order.appliedDiscount > 0 ? 
            `<br><small style="color: #e53e3e;">Sconto ${order.discountCode}: -${order.appliedDiscount}%</small>` : '';
        
        return `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">#${order.id.substring(0, 8)}</span>
                    <span class="order-total">${order.totalAmount.toFixed(2)}€</span>
                </div>
                <div class="order-details">
                    <strong>${order.customerName}</strong><br>
                    📱 ${order.customerPhone}<br>
                    📅 Ritiro: ${order.pickupDate}<br>
                    🍽️ ${itemsText}${discountText}
                </div>
                <div style="margin-top: 8px;">
                    <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                    <small style="color: #718096; margin-left: 10px;">${formattedDate}</small>
                </div>
            </div>
        `;
    }).join('');
}

function getFilteredOrders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (currentFilter) {
        case 'oggi':
            return allOrders.filter(order => {
                const orderDate = order.timestamp.toDate();
                return orderDate >= today;
            });
        case 'settimana':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return allOrders.filter(order => {
                const orderDate = order.timestamp.toDate();
                return orderDate >= weekAgo;
            });
        case 'mese':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return allOrders.filter(order => {
                const orderDate = order.timestamp.toDate();
                return orderDate >= monthAgo;
            });
        default:
            return allOrders;
    }
}

function getStatusText(status) {
    const statusMap = {
        'nuovo': 'Nuovo',
        'confermato': 'Confermato',
        'in_preparazione': 'In Prep.',
        'pronto': 'Pronto',
        'consegnato': 'Consegnato'
    };
    return statusMap[status] || status;
}

// FILTRI ORDINI
window.filterOrders = function(filter) {
    currentFilter = filter;
    
    // Aggiorna UI filtri
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayOrders();
};

// TOP PRODUCTS
function updateTopProducts() {
    const productSales = {};
    
    allOrders.forEach(order => {
        order.items.forEach(item => {
            if (productSales[item.name]) {
                productSales[item.name] += item.quantity;
            } else {
                productSales[item.name] = item.quantity;
            }
        });
    });
    
    const sortedProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    const topProductsList = document.getElementById('top-products-list');
    
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
}

// EXPORT CSV
window.exportToCSV = function() {
    const filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
        alert('Nessun ordine da esportare');
        return;
    }
    
    const headers = ['ID', 'Data/Ora', 'Cliente', 'Telefono', 'Ritiro', 'Articoli', 'Totale', 'Sconto', 'Status'];
    
    const csvData = filteredOrders.map(order => {
        const orderDate = order.timestamp.toDate().toLocaleString('it-IT');
        const items = order.items.map(item => `${item.name} (x${item.quantity})`).join('; ');
        const discount = order.appliedDiscount > 0 ? `${order.discountCode} -${order.appliedDiscount}%` : 'Nessuno';
        
        return [
            order.id.substring(0, 8),
            orderDate,
            order.customerName,
            order.customerPhone,
            order.pickupDate,
            items,
            `${order.totalAmount.toFixed(2)}€`,
            discount,
            getStatusText(order.status)
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
};

// GESTIONE ERRORI
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// AUTO-REFRESH ogni 30 secondi
setInterval(async () => {
    try {
        await loadAllData();
        updateStats();
        displayOrders();
        updateTopProducts();
    } catch (error) {
        console.error('Errore auto-refresh:', error);
    }
}, 30000);