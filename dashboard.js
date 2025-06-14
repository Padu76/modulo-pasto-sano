document.addEventListener('DOMContentLoaded', async () => {
    // STATO GLOBALE E DATI MOCK
    let allOrders = []; // Array per tutti gli ordini, caricati o mock
    let lastOrderCount = 0; // Per tenere traccia del numero di ordini per le notifiche
    let topProductsData = [];
    let salesChart = null; // Chart.js instance

    // Funzione per generare un ID univoco (semplice, per mock)
    function generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    // Funzione per generare ordini mock
    function getMockOrders() {
        const mockOrders = [
            {
                id: generateUniqueId(),
                customer: 'Mario Rossi',
                time: '12:30',
                status: 'Consegnato',
                items: [{ name: 'Spaghetti al Ragù', quantity: 1, price: 12.50 }],
                total: 12.50
            },
            {
                id: generateUniqueId(),
                customer: 'Giulia Bianchi',
                time: '13:00',
                status: 'In preparazione',
                items: [
                    { name: 'Pizza Margherita', quantity: 1, price: 8.00 },
                    { name: 'Coca-Cola', quantity: 1, price: 3.00 }
                ],
                total: 11.00
            },
            {
                id: generateUniqueId(),
                customer: 'Luca Verdi',
                time: '13:15',
                status: 'In transito',
                items: [{ name: 'Insalata Greca', quantity: 1, price: 9.50 }],
                total: 9.50
            },
            {
                id: generateUniqueId(),
                customer: 'Anna Neri',
                time: '13:30',
                status: 'Consegnato',
                items: [
                    { name: 'Lasagne al Forno', quantity: 1, price: 13.00 },
                    { name: 'Acqua Naturale', quantity: 1, price: 2.00 }
                ],
                total: 15.00
            },
            {
                id: generateUniqueId(),
                customer: 'Marco Gialli',
                time: '14:00',
                status: 'In preparazione',
                items: [{ name: 'Ravioli di Zucca', quantity: 1, price: 14.00 }],
                total: 14.00
            },
            {
                id: generateUniqueId(),
                customer: 'Sara Blu',
                time: '14:15',
                status: 'Consegnato',
                items: [
                    { name: 'Cotoletta alla Milanese', quantity: 1, price: 16.00 },
                    { name: 'Patatine Fritte', quantity: 1, price: 4.00 }
                ],
                total: 20.00
            },
            {
                id: generateUniqueId(),
                customer: 'Paolo Rossi',
                time: '14:30',
                status: 'In preparazione',
                items: [{ name: 'Pizza Diavola', quantity: 1, price: 9.00 }],
                total: 9.00
            },
            {
                id: generateUniqueId(),
                customer: 'Chiara Bianchi',
                time: '15:00',
                status: 'Annullato',
                items: [{ name: 'Risotto ai Funghi', quantity: 1, price: 13.50 }],
                total: 13.50
            },
            {
                id: generateUniqueId(),
                customer: 'Davide Verdi',
                time: '15:15',
                status: 'Consegnato',
                items: [{ name: 'Hamburger XL', quantity: 1, price: 11.00 }],
                total: 11.00
            },
            {
                id: generateUniqueId(),
                customer: 'Elena Neri',
                time: '15:30',
                status: 'In transito',
                items: [
                    { name: 'Kebab Completo', quantity: 1, price: 7.50 },
                    { name: 'Tiramisù', quantity: 1, price: 5.00 }
                ],
                total: 12.50
            },
            {
                id: generateUniqueId(),
                customer: 'Federico Gialli',
                time: '16:00',
                status: 'In preparazione',
                items: [{ name: 'Sushi Misto (12pz)', quantity: 1, price: 22.00 }],
                total: 22.00
            },
            {
                id: generateUniqueId(),
                customer: 'Giorgia Blu',
                time: '16:15',
                status: 'Consegnato',
                items: [{ name: 'Poke Bowl Salmone', quantity: 1, price: 15.00 }],
                total: 15.00
            }
        ];
        return mockOrders;
    }

    // Funzione per simulare il caricamento dei dati (potrebbe essere una fetch API reale in futuro)
    async function loadAllData() {
        console.log('⏳ Caricamento dati...');
        try {
            // Qui in futuro ci sarebbe la chiamata API reale
            // const response = await fetch('/api/orders');
            // if (!response.ok) throw new Error('Errore nel caricamento degli ordini');
            // allOrders = await response.json();
            allOrders = getMockOrders(); // Usiamo i mock per ora
            lastOrderCount = allOrders.length; // Inizializza contatore
            console.log('✅ Dati caricati:', allOrders);
        } catch (error) {
            showError(`Impossibile caricare i dati: ${error.message}. Caricamento dati mock.`);
            allOrders = getMockOrders(); // Carica i dati mock in caso di errore
            lastOrderCount = allOrders.length; // Inizializza contatore
        }
    }

    // AGGIORNA STATISTICHE (Overview Tab)
    function updateStats() {
        const todayOrders = allOrders.filter(order => order.status !== 'Annullato').length;
        const todayRevenue = allOrders.filter(order => order.status !== 'Annullato').reduce((sum, order) => sum + order.total, 0);
        const pendingOrders = allOrders.filter(order => order.status === 'In preparazione' || order.status === 'In transito').length;

        document.getElementById('today-orders').textContent = todayOrders;
        document.getElementById('today-revenue').textContent = `€${todayRevenue.toFixed(2)}`;
        document.getElementById('pending-orders').textContent = pendingOrders;
        document.getElementById('customer-satisfaction').textContent = '4.8 / 5'; // Placeholder
    }

    // VISUALIZZA ORDINI (Orders Tab)
    function displayOrders() {
        const ordersTableBody = document.getElementById('orders-table-body');
        if (!ordersTableBody) {
            console.error('Elemento orders-table-body non trovato.');
            return;
        }
        ordersTableBody.innerHTML = ''; // Pulisci la tabella

        allOrders.forEach(order => {
            const row = ordersTableBody.insertRow();
            row.className = 'border-b hover:bg-gray-50';

            row.insertCell().textContent = order.customer;
            row.insertCell().textContent = order.time;
            const statusCell = row.insertCell();
            statusCell.textContent = order.status;
            statusCell.className = getStatusClass(order.status); // Applica classe CSS per colore

            row.insertCell().textContent = `€${order.total.toFixed(2)}`;

            const actionsCell = row.insertCell();
            const viewButton = document.createElement('button');
            viewButton.textContent = 'Dettagli';
            viewButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm mr-2';
            viewButton.onclick = () => showOrderDetails(order);
            actionsCell.appendChild(viewButton);

            const productionButton = document.createElement('button');
            productionButton.textContent = 'Produzione';
            productionButton.className = 'bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm';
            productionButton.onclick = () => generateProductionDocument([order]); // Passa un array con un solo ordine
            actionsCell.appendChild(productionButton);
        });
    }

    function getStatusClass(status) {
        switch (status) {
            case 'Consegnato':
                return 'text-green-600 font-semibold';
            case 'In preparazione':
                return 'text-yellow-600 font-semibold';
            case 'In transito':
                return 'text-blue-600 font-semibold';
            case 'Annullato':
                return 'text-red-600 font-semibold';
            default:
                return '';
        }
    }

    // MOSTRA DETTAGLI ORDINE (MODAL)
    function showOrderDetails(order) {
        document.getElementById('modal-customer-name').textContent = order.customer;
        document.getElementById('modal-order-time').textContent = order.time;
        document.getElementById('modal-order-status').textContent = order.status;
        document.getElementById('modal-order-status').className = getStatusClass(order.status);

        const modalItemsList = document.getElementById('modal-order-items');
        modalItemsList.innerHTML = '';
        order.items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'flex justify-between text-gray-700';
            li.innerHTML = `<span>${item.name} x${item.quantity}</span><span>€${(item.price * item.quantity).toFixed(2)}</span>`;
            modalItemsList.appendChild(li);
        });

        document.getElementById('modal-order-total').textContent = `€${order.total.toFixed(2)}`;

        document.getElementById('order-details-modal').classList.remove('hidden');
    }

    document.getElementById('close-order-modal').onclick = () => {
        document.getElementById('order-details-modal').classList.add('hidden');
    };

    // AGGIORNA I PRODOTTI PIÙ VENDUTI (Products Tab)
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

        topProductsData = Object.entries(productSales)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5); // Prendi i primi 5

        const topProductsList = document.getElementById('top-products-list');
        if (!topProductsList) {
            console.error('Elemento top-products-list non trovato.');
            return;
        }
        topProductsList.innerHTML = '';
        topProductsData.forEach(([product, count]) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between py-2 border-b last:border-b-0';
            li.innerHTML = `<span>${product}</span><span class="font-semibold">${count} vendite</span>`;
            topProductsList.appendChild(li);
        });
    }

    // GESTIONE CHART (Sales Tab)
    function updateSalesChart() {
        const dailySales = {};
        allOrders.forEach(order => {
            if (order.status !== 'Annullato') {
                const date = new Date().toLocaleDateString('it-IT'); // Per demo, usiamo sempre oggi
                if (dailySales[date]) {
                    dailySales[date] += order.total;
                } else {
                    dailySales[date] = order.total;
                }
            }
        });

        const chartData = Object.entries(dailySales).map(([date, revenue]) => ({
            date: date,
            revenue: revenue
        })).sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordina per data

        const ctx = document.getElementById('salesChart').getContext('2d');

        // Se esiste già un'istanza del grafico, distruggila per aggiornare
        if (salesChart) {
            salesChart.destroy();
        }

        salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.date),
                datasets: [{
                    label: 'Fatturato Giornaliero (€)',
                    data: chartData.map(d => d.revenue),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Fatturato (€)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Data'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            }
        });
    }


    // GESTIONE TAB
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.target;

            // Rimuovi 'active' da tutti i tab e nascondi tutti i contenuti
            tabs.forEach(t => t.classList.remove('active', 'bg-green-600', 'text-white'));
            tabContents.forEach(tc => tc.classList.add('hidden'));

            // Aggiungi 'active' al tab cliccato e mostra il contenuto target
            tab.classList.add('active', 'bg-green-600', 'text-white');
            document.getElementById(target).classList.remove('hidden');

            // Aggiorna i grafici quando la tab vendite è attiva
            if (target === 'sales') {
                updateSalesChart();
            }
        });
    });

    // Imposta la tab di default su 'overview' e mostra il contenuto
    document.querySelector('.tab-button[data-target="overview"]').classList.add('active', 'bg-green-600', 'text-white');
    document.getElementById('overview').classList.remove('hidden');


    // NOTIFICHE (SIMULATE)
    function showNotification(message) {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.classList.remove('hidden');
            notification.classList.add('animate-fadeInOut'); // Aggiungi classe per l'animazione

            setTimeout(() => {
                notification.classList.remove('animate-fadeInOut');
                notification.classList.add('hidden');
            }, 5000); // Nasconde dopo 5 secondi
        }
    }

    function checkNewOrders() {
        const currentOrderCount = allOrders.length;
        if (currentOrderCount > lastOrderCount) {
            const newOrdersCount = currentOrderCount - lastOrderCount;
            showNotification(`🔔 ${newOrdersCount} nuovo/i ordine/i!`);
            lastOrderCount = currentOrderCount; // Aggiorna il contatore
        }
    }


    // FUNZIONI DI UTILITÀ PER PDF

    // Funzione per formattare i dati degli ordini per il PDF
    function formatOrdersForPdf(ordersToPrint) {
        let content = '';
        ordersToPrint.forEach(order => {
            content += `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background-color: #f9f9f9;">
                    <h3 style="margin-top: 0; color: #333; font-size: 1.2em;">Ordine #${order.id.substring(1, 6)} - Cliente: ${order.customer}</h3>
                    <p style="margin-bottom: 5px; color: #555;">Orario: ${order.time} | Stato: ${order.status}</p>
                    <h4 style="margin-top: 10px; margin-bottom: 5px; color: #444; font-size: 1em;">Articoli:</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
            `;
            order.items.forEach(item => {
                content += `
                        <li style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #eee;">
                            <span>${item.name} x${item.quantity}</span>
                            <span>€${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                `;
            });
            content += `
                    </ul>
                    <div style="text-align: right; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                        <strong style="font-size: 1.1em;">Totale Ordine: €${order.total.toFixed(2)}</strong>
                    </div>
                </div>
            `;
        });
        return content;
    }

    // Funzione per generare il documento di produzione (simula stampa)
    const generateProductionDocument = (selectedOrders) => {
        if (!selectedOrders || selectedOrders.length === 0) {
            alert('Seleziona almeno un ordine per generare il documento di produzione.');
            return;
        }

        const formattedOrdersHtml = formatOrdersForPdf(selectedOrders);

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Documento di Produzione Ordini</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20mm; }
                    h1 { text-align: center; color: #333; margin-bottom: 30px; }
                    .order-section {
                        margin-bottom: 25px;
                        padding: 15px;
                        border: 1px solid #eee;
                        border-radius: 5px;
                        background-color: #fff;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                    }
                    .order-section h3 {
                        color: #2c3e50;
                        margin-bottom: 10px;
                        border-bottom: 2px solid #4CAF50;
                        padding-bottom: 5px;
                    }
                    .order-section p { margin-bottom: 5px; color: #555; }
                    .order-section ul { list-style: none; padding: 0; margin: 0; }
                    .order-section li {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 0;
                        border-bottom: 1px dotted #ccc;
                    }
                    .order-section li:last-child { border-bottom: none; }
                    .total {
                        text-align: right;
                        margin-top: 15px;
                        font-size: 1.1em;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    @media print {
                        body { margin: 10mm; }
                        .order-section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <h1>Documento di Produzione Ordini</h1>
                ${formattedOrdersHtml}
            </body>
            </html>
        `;

        const newWindow = window.open('', '_blank');
        newWindow.document.write(htmlContent);
        newWindow.document.close();

        // Auto-stampa dopo mezzo secondo
        setTimeout(() => {
            newWindow.print();
        }, 500);

        console.log(`✅ Documento produzione generato per ${selectedOrders.length} ordini`);
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
        lastOrderCount = allOrders.length; // Inizializza contatore
        updateStats();
        displayOrders();
        updateTopProducts();
        if (salesChart) {
            updateSalesChart();
        }
    }

    // AUTO-REFRESH CON CONTROLLO NOTIFICHE ogni 30 secondi
    setInterval(async () => {
        try {
            console.log('🔄 Auto-refresh dashboard...');
            await loadAllData();

            // Controlla nuovi ordini PRIMA di aggiornare
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


    // Inizializzazione della dashboard al caricamento della pagina
    await loadAllData();
    updateStats();
    displayOrders();
    updateTopProducts();
    // Non chiamare updateSalesChart qui inizialmente se la tab sales non è quella predefinita,
    // altrimenti Chart.js potrebbe avere problemi con un canvas nascosto.
    // Viene chiamato quando si seleziona la tab "Vendite".
});