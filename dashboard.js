
console.log("Dashboard.js caricato completamente");

const db = firebase.firestore();
const orderList = document.getElementById("orderList");

function renderOrders(snapshot) {
  if (snapshot.empty) {
    orderList.innerHTML = "<p>Nessun ordine trovato.</p>";
    return;
  }

  let html = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    html += `<div class="card mb-3 p-3">
      <h5>${data.customerName}</h5>
      <p>${data.customerPhone}</p>
      <ul>`;
    data.items.forEach(item => {
      html += `<li>${item.name} (x${item.quantity})</li>`;
    });
    html += `</ul></div>`;
  });

  orderList.innerHTML = html;
}

db.collection("orders").orderBy("timestamp", "desc").onSnapshot(renderOrders, err => {
  console.error("Errore nel recupero ordini:", err);
  orderList.innerHTML = "<p>Errore nel caricamento degli ordini.</p>";
});
