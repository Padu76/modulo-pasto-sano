console.log("📊 Dashboard.js caricato completamente");

const waitForFirestore = () => {
  return new Promise((resolve) => {
    const check = () => {
      if (window.firestoreReady) return resolve();
      console.log("⏳ Firebase non ancora pronto, riprovo...");
      setTimeout(check, 500);
    };
    check();
  });
};

const loadOrders = async () => {
  const container = document.getElementById("orders-container");
  try {
    const snapshot = await window.firestore.collection("orders").get();
    if (snapshot.empty) {
      container.innerHTML = "<p>Nessun ordine trovato.</p>";
      return;
    }

    container.innerHTML = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "card my-2 p-3";
      div.innerHTML = `
        <strong>${data.customerName}</strong><br>
        <small>${data.customerPhone}</small>
        <ul>
          ${data.items.map(item => `<li>${item.name} (x${item.quantity})</li>`).join("")}
        </ul>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error("Errore nel caricamento ordini:", error);
    container.innerHTML = "<p>Errore nel caricamento ordini.</p>";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await waitForFirestore();
  loadOrders();
});
