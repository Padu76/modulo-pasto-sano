
console.log("Dashboard.js caricato completamente");

function caricaOrdini() {
  const output = document.getElementById("output");
  output.innerText = "Caricamento ordini da Firebase...";
  db.collection("ordini").get().then(snapshot => {
    if (snapshot.empty) {
      output.innerText = "Nessun ordine trovato.";
      return;
    }
    let html = "<ul>";
    snapshot.forEach(doc => {
      const d = doc.data();
      html += `<li><strong>${d.nome}</strong>: ${d.prodotti}</li>`;
    });
    html += "</ul>";
    output.innerHTML = html;
  }).catch(err => {
    output.innerText = "Errore durante il caricamento: " + err.message;
    console.error(err);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  caricaOrdini();
});
