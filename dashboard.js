        case 'contanti alla consegna': return '💰';
        case 'cash': return '💰';
        default: return '💳';
    }
}

// Esporta clienti in CSV
function exportCustomersToCSV() {
    const customersData = getCustomersData();
    
    const headers = [
        'Nome', 'Telefono', 'Totale Ordini', 'Spesa Totale (€)', 
        'Ultimo Ordine', 'Metodi Pagamento', 'Tipo Cliente'
    ];
    
    const csvData = customersData.map(customer => [
        `"${customer.name}"`,
        `"${customer.phone}"`,
        customer.totalOrders,
        customer.totalSpent.toFixed(2),
        formatDate(customer.lastOrder),
        `"${Object.entries(customer.paymentMethods).map(([method, count]) => `${method} (${count}x)`).join('; ')}"`,
        customer.totalOrders >= 5 ? 'VIP' : 'Nuovo'
    ]);
    
    const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `clienti_pasto_sano_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`📥 Esportati ${customersData.length} clienti in CSV`);
}

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
            
            calculateDynamicStats();
            renderOrders();
            updateTopProducts();
            updateChart();
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

// Update orders from Firestore snapshot
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

// NUOVA FUNZIONE: Filter orders con statistiche dinamiche
function filterOrders(filter) {
    currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Aggiorna tutto in base al filtro
    renderOrders();
    calculateDynamicStats();
    updateChart();
}

// NUOVA FUNZIONE: Calculate dynamic statistics based on current filter
function calculateDynamicStats() {
    const filteredOrders = getFilteredOrders();
    
    // Calcola statistiche per il periodo selezionato
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Clienti unici nel periodo
    const uniqueCustomers = new Set(
        filteredOrders.map(order => `${order.customerName}_${order.customerPhone}`)
    ).size;
    
    // Determina le etichette in base al filtro
    let periodLabel, revenueLabel, ordersLabel;
    
    switch(currentFilter) {
        case 'oggi':
            periodLabel = 'Oggi';
            revenueLabel = 'Fatturato Oggi';
            ordersLabel = 'Ordini Oggi';
            break;
        case 'settimana':
            periodLabel = 'Ultima Settimana';
            revenueLabel = 'Fatturato Settimana';
            ordersLabel = 'Ordini Settimana';
            break;
        case 'mese':
            periodLabel = 'Ultimo Mese';
            revenueLabel = 'Fatturato Mese';
            ordersLabel = 'Ordini Mese';
            break;
        case 'tutti':
        default:
            periodLabel = 'Totale';
            revenueLabel = 'Fatturato Totale';
            ordersLabel = 'Ordini Totali';
            break;
    }
    
    // Aggiorna le etichette delle card
    updateStatLabel('orders-today-label', ordersLabel);
    updateStatLabel('revenue-today-label', revenueLabel);
    
    // Aggiorna i valori
    updateStatElement('orders-today', totalOrders.toString());
    updateStatElement('revenue-today', `${totalRevenue.toFixed(2)}€`);
    updateStatElement('avg-order', `${avgOrder.toFixed(2)}€`);
    updateStatElement('total-customers', uniqueCustomers.toString());
    
    // Aggiorna le descrizioni
    updateStatElement('orders-change', `${totalOrders} ordini ${periodLabel.toLowerCase()}`);
    updateStatElement('revenue-change', `${totalRevenue.toFixed(2)}€ ${periodLabel.toLowerCase()}`);
    updateStatElement('avg-change', `Media ${periodLabel.toLowerCase()}`);
    updateStatElement('customers-change', `${uniqueCustomers} clienti unici`);
    
    console.log(`📊 Statistiche aggiornate per: ${periodLabel}`);
}

// NUOVA FUNZIONE: Update stat labels
function updateStatLabel(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

// Calculate and display statistics - USA QUELLA DINAMICA
function calculateStats() {
    calculateDynamicStats();
}

// Render orders senza status confusi
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
        
        // Status basato solo su pagamento
        const paymentStatus = getPaymentStatus(order);
        
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
                        <span class="payment-status ${paymentStatus.class}">${paymentStatus.text}</span>
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

// Funzione per determinare status pagamento
function getPaymentStatus(order) {
    const paymentMethod = order.paymentMethod?.toLowerCase() || '';
    
    if (paymentMethod === 'cash') {
        return {
            text: '💰 CASH ALLA CONSEGNA',
            class: 'payment-cash'
        };
    } else {
        return {
            text: '💳 PAGATO ONLINE',
            class: 'payment-online'
        };
    }
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

// Update statistic element
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
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
        'Metodo Pagamento', 'Status Pagamento', 'Totale', 'Sconto', 'Articoli', 'Dettagli'
    ];
    
    const csvData = ordersToExport.map(order => [
        order.id,
        `"${order.customerName || ''}"`,
        `"${order.customerPhone || ''}"`,
        formatDateTime(order.timestamp),
        formatDate(order.pickupDate),
        `"${order.paymentMethodName || order.paymentMethod || ''}"`,
        order.paymentMethod === 'cash' ? 'Cash alla Consegna' : 'Pagato Online',
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

// Generate production document - VERSIONE SEMPLIFICATA PER FORNITORE
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
    let totalItems = 0;
    
    ordersToProcess.forEach(order => {
        order.items?.forEach(item => {
            const itemName = item.name;
            const quantity = item.quantity || 1;
            
            if (itemsCount[itemName]) {
                itemsCount[itemName] += quantity;
            } else {
                itemsCount[itemName] = quantity;
            }
            totalItems += quantity;
        });
    });
    
    // Genera documento di produzione SEMPLIFICATO
    let productionDoc = `🍽️ DOCUMENTO PRODUZIONE - PASTO SANO\n`;
    productionDoc += `📅 Data: ${new Date().toLocaleDateString('it-IT')}\n`;
    productionDoc += `📦 Ordini: ${ordersToProcess.length}\n`;
    productionDoc += `🥘 Pezzi totali: ${totalItems}\n\n`;
    
    productionDoc += `📋 RIEPILOGO PRODUZIONE:\n`;
    productionDoc += `${'='.repeat(40)}\n`;
    
    // Ordina per quantità decrescente
    const sortedItems = Object.entries(itemsCount)
        .sort(([,a], [,b]) => b - a);
    
    sortedItems.forEach(([itemName, quantity]) => {
        productionDoc += `• ${itemName}: ${quantity} porzioni\n`;
    });
    
    productionDoc += `\n📅 ORDINI PER DATA RITIRO:\n`;
    productionDoc += `${'='.repeat(40)}\n`;
    
    // Raggruppa ordini per data di ritiro
    const ordersByDate = {};
    ordersToProcess.forEach(order => {
        const pickupDate = order.pickupDate || 'Data non specificata';
        if (!ordersByDate[pickupDate]) {
            ordersByDate[pickupDate] = [];
        }
        ordersByDate[pickupDate].push(order);
    });
    
    // Ordina le date
    const sortedDates = Object.keys(ordersByDate).sort();
    
    sortedDates.forEach(date => {
        const ordersForDate = ordersByDate[date];
        productionDoc += `\n📅 ${formatDate(date)} (${ordersForDate.length} ordini):\n`;
        productionDoc += `${'-'.repeat(30)}\n`;
        
        ordersForDate.forEach(order => {
            productionDoc += `👤 ${order.customerName || 'Cliente'}\n`;
            
            // Solo gli articoli, senza prezzi e telefoni
            order.items?.forEach(item => {
                productionDoc += `   • ${item.name} x${item.quantity || 1}\n`;
            });
            productionDoc += `\n`;
        });
    });
    
    productionDoc += `\n📝 Note:\n`;
    productionDoc += `• Controllare disponibilità ingredienti\n`;
    productionDoc += `• Preparare contenitori per ${totalItems} porzioni\n`;
    productionDoc += `• Verificare date di ritiro\n`;
    
    // Download del documento
    const blob = new Blob([productionDoc], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `produzione_fornitore_${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`📋 Documento produzione fornitore generato per ${ordersToProcess.length} ordini`);
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
    updateChart();
}

// NUOVA FUNZIONE: Update chart based on current filter
function updateChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    let chartData = [];
    let labels = [];
    let chartTitle = 'Fatturato';
    
    switch(currentFilter) {
        case 'oggi':
            // Grafico ore del giorno corrente
            for (let hour = 0; hour < 24; hour += 3) {
                const startHour = hour;
                const endHour = hour + 3;
                
                const revenueInPeriod = allOrders
                    .filter(order => {
                        const orderDate = new Date(order.timestamp);
                        const today = new Date();
                        const orderHour = orderDate.getHours();
                        
                        return orderDate.toDateString() === today.toDateString() &&
                               orderHour >= startHour && orderHour < endHour;
                    })
                    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                
                labels.push(`${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`);
                chartData.push(revenueInPeriod);
            }
            chartTitle = 'Fatturato per Fasce Orarie (Oggi)';
            break;
            
        case 'settimana':
            // Grafico ultimi 7 giorni
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                
                const dayRevenue = allOrders
                    .filter(order => {
                        const orderDate = new Date(order.timestamp);
                        return orderDate.toDateString() === date.toDateString();
                    })
                    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                
                labels.push(date.toLocaleDateString('it-IT', { 
                    day: '2-digit', 
                    month: '2-digit' 
                }));
                chartData.push(dayRevenue);
            }
            chartTitle = 'Fatturato Ultimi 7 Giorni';
            break;
            
        case 'mese':
            // Grafico ultime 4 settimane
            for (let week = 3; week >= 0; week--) {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() - (week * 7));
                const startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 6);
                
                const weekRevenue = allOrders
                    .filter(order => {
                        const orderDate = new Date(order.timestamp);
                        return orderDate >= startDate && orderDate <= endDate;
                    })
                    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                
                labels.push(`${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`);
                chartData.push(weekRevenue);
            }
            chartTitle = 'Fatturato per Settimane (Ultimo Mese)';
            break;
            
        case 'tutti':
        default:
            // Grafico ultimi 6 mesi
            for (let month = 5; month >= 0; month--) {
                const date = new Date();
                date.setMonth(date.getMonth() - month);
                const year = date.getFullYear();
                const monthNum = date.getMonth();
                
                const monthRevenue = allOrders
                    .filter(order => {
                        const orderDate = new Date(order.timestamp);
                        return orderDate.getFullYear() === year && 
                               orderDate.getMonth() === monthNum;
                    })
                    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                
                labels.push(date.toLocaleDateString('it-IT', { 
                    month: 'short',
                    year: '2-digit'
                }));
                chartData.push(monthRevenue);
            }
            chartTitle = 'Fatturato Ultimi 6 Mesi';
            break;
    }
    
    // Distruggi grafico esistente
    if (chart) {
        chart.destroy();
    }
    
    // Crea nuovo grafico
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: chartTitle,
                data: chartData,
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
                },
                title: {
                    display: true,
                    text: chartTitle,
                    color: '#2d3748',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
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

// Load dashboard data - AGGIORNATA CON DEFAULT SU OGGI
async function loadDashboardData() {
    try {
        console.log('📊 Caricamento dati dashboard...');
        
        const snapshot = await firebase.firestore()
            .collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(500)
            .get();
        
        updateOrdersFromSnapshot(snapshot);
        
        // Inizializza con filtro "oggi" di default e bottone attivo
        currentFilter = 'oggi';
        
        // Imposta il bottone "Oggi" come attivo
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const todayButton = Array.from(document.querySelectorAll('.filter-btn'))
            .find(btn => btn.textContent.trim() === 'Oggi');
        if (todayButton) {
            todayButton.classList.add('active');
        }
        
        calculateDynamicStats();
        renderOrders();
        updateTopProducts();
        updateChart();
        
        // Set last notification time to now to avoid showing notifications for existing orders
        lastNotificationTime = Date.now();
        
        console.log('✅ Dati dashboard caricati con filtro default "Oggi"');
        
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

// Aggiungi controllo per i suoni nell'header
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header .container');
    if (header) {
        const soundButton = document.createElement('button');
        soundButton.innerHTML = soundEnabled ? '🔊' : '🔇';
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
        soundButton.addEventListener('click', () => {
            toggleSound();
            soundButton.innerHTML = soundEnabled ? '🔊' : '🔇';
        });
        header.appendChild(soundButton);
    }
});

console.log('🎉 Dashboard script caricato completamente!');
console.log('🔔 Notifiche real-time attivate');
console.log('📱 Supporto telefono clienti integrato');
console.log('👥 Sezione clienti cliccabile attivata');
console.log('💳 Status pagamento semplificati');
console.log('📋 Documento produzione fornitore semplificato');
console.log('📊 Statistiche dinamiche implementate - Default: OGGI');// DASHBOARD.JS - VERSIONE FINALE CON STATISTICHE DINAMICHE

// State management
let allOrders = [];
let selectedOrders = [];
let currentFilter = 'oggi'; // DEFAULT SU OGGI
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
        setupCustomersModal();
        
        console.log('✅ Dashboard inizializzata correttamente');
    } catch (error) {
        console.error('❌ Errore inizializzazione:', error);
        showError('Errore durante il caricamento dei dati: ' + error.message);
    }
});

// Setup modal clienti
function setupCustomersModal() {
    const customersCard = document.getElementById('total-customers');
    if (customersCard) {
        customersCard.style.cursor = 'pointer';
        customersCard.addEventListener('click', showCustomersModal);
    }
}

// Mostra modal con elenco clienti
function showCustomersModal() {
    const customersData = getCustomersData();
    
    // Crea modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 20px;
            width: 100%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 30px;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e2e8f0;
            ">
                <h2 style="color: #2d3748; font-size: 24px; margin: 0;">
                    👥 Elenco Clienti (${customersData.length})
                </h2>
                <button onclick="this.closest('.customers-modal').remove()" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #6c757d;
                    padding: 5px;
                    border-radius: 50%;
                    transition: all 0.2s;
                ">×</button>
            </div>
            
            <div style="display: grid; gap: 15px;">
                ${customersData.map(customer => `
                    <div style="
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 20px;
                        border-left: 4px solid #7a9e7e;
                        transition: all 0.2s;
                        hover: box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    ">
                        <div style="
                            display: grid;
                            grid-template-columns: 1fr auto;
                            gap: 20px;
                            align-items: start;
                        ">
                            <div>
                                <h3 style="
                                    color: #2d3748;
                                    font-size: 18px;
                                    margin: 0 0 8px 0;
                                    font-weight: 600;
                                ">
                                    👤 ${customer.name}
                                </h3>
                                <p style="
                                    color: #4a5568;
                                    margin: 0 0 12px 0;
                                    font-size: 16px;
                                ">
                                    📱 <a href="tel:${customer.phone}" style="
                                        color: #7a9e7e;
                                        text-decoration: none;
                                        font-weight: 500;
                                    ">${customer.phone}</a>
                                </p>
                                
                                <div style="
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                                    gap: 10px;
                                    margin-top: 15px;
                                ">
                                    <div style="
                                        background: white;
                                        padding: 8px 12px;
                                        border-radius: 8px;
                                        text-align: center;
                                        border: 1px solid #e2e8f0;
                                    ">
                                        <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600;">Ordini</div>
                                        <div style="font-size: 16px; color: #2d3748; font-weight: 700;">${customer.totalOrders}</div>
                                    </div>
                                    <div style="
                                        background: white;
                                        padding: 8px 12px;
                                        border-radius: 8px;
                                        text-align: center;
                                        border: 1px solid #e2e8f0;
                                    ">
                                        <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600;">Spesa Totale</div>
                                        <div style="font-size: 16px; color: #7a9e7e; font-weight: 700;">€${customer.totalSpent.toFixed(2)}</div>
                                    </div>
                                    <div style="
                                        background: white;
                                        padding: 8px 12px;
                                        border-radius: 8px;
                                        text-align: center;
                                        border: 1px solid #e2e8f0;
                                    ">
                                        <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600;">Ultimo Ordine</div>
                                        <div style="font-size: 14px; color: #2d3748; font-weight: 600;">${formatDate(customer.lastOrder)}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="text-align: right;">
                                <div style="
                                    background: ${customer.totalOrders >= 5 ? '#c6f6d5' : '#fed7d7'};
                                    color: ${customer.totalOrders >= 5 ? '#276749' : '#c53030'};
                                    padding: 6px 12px;
                                    border-radius: 20px;
                                    font-size: 12px;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    display: inline-block;
                                ">
                                    ${customer.totalOrders >= 5 ? '⭐ VIP' : '🆕 Nuovo'}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Metodi di pagamento preferiti -->
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                            <small style="color: #6c757d; font-size: 13px;">
                                <strong>Metodi pagamento:</strong> 
                                ${Object.entries(customer.paymentMethods).map(([method, count]) => 
                                    `${getPaymentIcon(method)} ${method} (${count}x)`
                                ).join(' • ')}
                            </small>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="
                margin-top: 25px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
            ">
                <button onclick="exportCustomersToCSV()" style="
                    background: #7a9e7e;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    margin-right: 10px;
                ">📥 Esporta Clienti CSV</button>
                
                <button onclick="this.closest('.customers-modal').remove()" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Chiudi</button>
            </div>
        </div>
    `;
    
    modal.className = 'customers-modal';
    document.body.appendChild(modal);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Calcola dati clienti
function getCustomersData() {
    const customerMap = {};
    
    allOrders.forEach(order => {
        const name = order.customerName || 'Cliente Sconosciuto';
        const phone = order.customerPhone || 'Non fornito';
        const key = `${name}_${phone}`;
        
        if (!customerMap[key]) {
            customerMap[key] = {
                name: name,
                phone: phone,
                totalOrders: 0,
                totalSpent: 0,
                lastOrder: null,
                paymentMethods: {}
            };
        }
        
        customerMap[key].totalOrders++;
        customerMap[key].totalSpent += order.totalAmount || 0;
        
        // Ultimo ordine
        const orderDate = new Date(order.timestamp);
        if (!customerMap[key].lastOrder || orderDate > new Date(customerMap[key].lastOrder)) {
            customerMap[key].lastOrder = orderDate;
        }
        
        // Metodi di pagamento
        const paymentMethod = order.paymentMethodName || order.paymentMethod || 'Non specificato';
        customerMap[key].paymentMethods[paymentMethod] = (customerMap[key].paymentMethods[paymentMethod] || 0) + 1;
    });
    
    // Converti in array e ordina per spesa totale
    return Object.values(customerMap)
        .sort((a, b) => b.totalSpent - a.totalSpent);
}

// Icone metodi di pagamento
function getPaymentIcon(method) {
    switch(method.toLowerCase()) {
        case 'paypal': return '🅿️';
        case 'carta di credito/debito': return '💳';
        case 'stripe': return '💳';
        case 'contanti alla consegna': return '💰';
        case 'cash': return '💰';