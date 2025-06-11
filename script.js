document.addEventListener('DOMContentLoaded', () => {
    const mealItems = document.querySelectorAll('.meal-item');
    const cartItemsList = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const totalItemsSpan = document.getElementById('total-items');
    const checkoutButton = document.getElementById('checkout-button');
    const pickupDateInput = document.getElementById('pickup-date');
    const orderMessage = document.getElementById('order-message');

    let cart = []; // Array per memorizzare gli articoli nel carrello

    // Funzione per aggiornare il carrello nell'interfaccia
    function updateCartDisplay() {
        cartItemsList.innerHTML = ''; // Pulisce il carrello attuale
        let total = 0;
        let totalQuantity = 0;

        cart.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <span>${(item.price * item.quantity).toFixed(2)}€</span>
            `;
            cartItemsList.appendChild(li);
            total += item.price * item.quantity;
            totalQuantity += item.quantity;
        });

        cartTotalSpan.textContent = `${total.toFixed(2)}€`;
        totalItemsSpan.textContent = totalQuantity;
    }

    // Aggiungi evento ai bottoni "Aggiungi"
    mealItems.forEach(item => {
        const addButton = item.querySelector('.add-to-cart');
        const quantityInput = item.querySelector('.quantity-input');

        addButton.addEventListener('click', () => {
            const id = item.dataset.id;
            const name = item.querySelector('h3').textContent;
            const price = parseFloat(item.dataset.price);
            const quantity = parseInt(quantityInput.value);

            if (quantity > 0) {
                const existingItemIndex = cart.findIndex(cartItem => cartItem.id === id);

                if (existingItemIndex > -1) {
                    // Se l'articolo esiste già, aggiorna la quantità
                    cart[existingItemIndex].quantity += quantity;
                } else {
                    // Altrimenti aggiungi un nuovo articolo
                    cart.push({ id, name, price, quantity });
                }
                updateCartDisplay();
                quantityInput.value = 0; // Reset della quantità nell'input
            } else {
                alert('Seleziona una quantità valida per aggiungere al carrello.');
            }
        });
    });

    // Imposta la data minima per il ritiro (oggi + 2 giorni)
    function setMinPickupDate() {
        const today = new Date();
        today.setDate(today.getDate() + 2); // Oggi + 2 giorni per la preparazione

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        pickupDateInput.min = `${year}-${month}-${day}`;
    }
    setMinPickupDate();

    // Gestione del checkout
    checkoutButton.addEventListener('click', () => {
        const totalQuantity = parseInt(totalItemsSpan.textContent);
        const pickupDate = pickupDateInput.value;

        if (totalQuantity < 4) {
            orderMessage.style.display = 'block';
            orderMessage.style.backgroundColor = '#f8d7da';
            orderMessage.style.color = '#721c24';
            orderMessage.textContent = 'Errore: Il minimo d\'ordine è 4 pezzi a scelta.';
            // Rimuovi eventuali bottoni WhatsApp precedenti in caso di errore
            const existingWhatsappButton = orderMessage.querySelector('.whatsapp-send-button');
            if (existingWhatsappButton) {
                existingWhatsappButton.remove();
            }
            return;
        }

        if (!pickupDate) {
            orderMessage.style.display = 'block';
            orderMessage.style.backgroundColor = '#f8d7da';
            orderMessage.style.color = '#721c24';
            orderMessage.textContent = 'Errore: Seleziona una data di ritiro.';
            // Rimuovi eventuali bottoni WhatsApp precedenti in caso di errore
            const existingWhatsappButton = orderMessage.querySelector('.whatsapp-send-button');
            if (existingWhatsappButton) {
                existingWhatsappButton.remove();
            }
            return;
        }

        // Verifica che la data di ritiro sia valida (minimo oggi + 2 giorni)
        const selectedDate = new Date(pickupDate);
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 2); // Data minima consentita per il ritiro

        // Per confrontare solo le date, senza l'ora
        selectedDate.setHours(0,0,0,0);
        minDate.setHours(0,0,0,0);

        if (selectedDate < minDate) {
            orderMessage.style.display = 'block';
            orderMessage.style.backgroundColor = '#f8d7da';
            orderMessage.style.color = '#721c24';
            orderMessage.textContent = 'Errore: La data di ritiro deve essere almeno due giorni dopo la data odierna.';
            // Rimuovi eventuali bottoni WhatsApp precedenti in caso di errore
            const existingWhatsappButton = orderMessage.querySelector('.whatsapp-send-button');
            if (existingWhatsappButton) {
                existingWhatsappButton.remove();
            }
            return;
        }

        // Se tutto è ok, mostra il messaggio di successo e genera il link WhatsApp
        orderMessage.style.display = 'block';
        orderMessage.style.backgroundColor = '#d4edda';
        orderMessage.style.color = '#155724';
        
        // Costruisci il messaggio dell'ordine per WhatsApp
        let orderDetails = "🎉 Nuovo Ordine Pasti Sani! 🎉\n\n";
        orderDetails += "Dettagli dell'Ordine:\n";
        orderDetails += "-----------------------------------\n";
        cart.forEach(item => {
            orderDetails += `• ${item.name}\n  Quantità: ${item.quantity}\n  Costo: ${(item.price * item.quantity).toFixed(2)}€\n`;
        });
        orderDetails += "-----------------------------------\n";
        orderDetails += `📦 Totale Articoli: ${totalQuantity}\n`;
        orderDetails += `💰 Totale Ordine: ${cartTotalSpan.textContent}\n`;
        orderDetails += `🗓️ Data di Ritiro Prevista: ${pickupDate}\n`;
        orderDetails += "-----------------------------------\n";
        orderDetails += "Si prega di confermare la disponibilità. Grazie!";

        // Codifica l'URI per renderlo sicuro per l'URL
        const encodedMessage = encodeURIComponent(orderDetails);

        // Il tuo numero di telefono con prefisso internazionale: +39 per l'Italia
        const phoneNumber = "+393478881515"; // NUMERO DI TELEFONO INSERITO QUI!

        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        // Aggiorna il messaggio di successo e aggiungi il pulsante WhatsApp
        orderMessage.innerHTML = `Ordine inviato con successo!<br>Totale: ${cartTotalSpan.textContent}<br>Data di ritiro: ${pickupDate}<br><br>`;
        
        const whatsappButton = document.createElement('a');
        whatsappButton.href = whatsappLink;
        whatsappButton.target = "_blank"; // Apre il link in una nuova scheda
        whatsappButton.className = "whatsapp-send-button"; 
        whatsappButton.textContent = "Invia Ordine su WhatsApp";
        
        // Aggiungi il bottone al messaggio di ordine
        orderMessage.appendChild(whatsappButton);

        // Svuota il carrello dopo l'ordine
        cart = [];
        updateCartDisplay();
        pickupDateInput.value = ''; // Resetta la data selezionata
    });
});