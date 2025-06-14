
console.log("Dashboard.js caricato completamente");

document.addEventListener("DOMContentLoaded", async () => {
  const content = document.getElementById("content");
  try {
    const snapshot = await db.collection("orders").get();
    if (snapshot.empty) {
      content.innerText = "Nessun ordine trovato.";
    } else {
      content.innerText = "Ordini trovati: " + snapshot.size;
    }
  } catch (error) {
    console.error("Errore nel recupero dati Firestore:", error);
    content.innerText = "Errore nel caricamento ordini.";
  }
});
