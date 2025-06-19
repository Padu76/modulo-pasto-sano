// ✅ FILE 1: script.js - Aggiorna i prezzi nell'oggetto products:

const products = {
    mainMeals: [
        { id: 1, name: "FUSILLI, MACINATO MANZO, ZUCCHINE, MELANZANE", price: 8.50, image: "fusilli-macinato-zucchine-melanzane.jpg" },
        { id: 2, name: "ROASTBEEF, PATATE AL FORNO, FAGIOLINI", price: 8.50, image: "roastbeef-patatealforno-fagiolini.jpg" },
        { id: 3, name: "RISO BASMATI, HAMBURGER MANZO, CAROTINE", price: 8.50, image: "risobasmati-hamburgermanzo-carotine.jpg" },
        { id: 4, name: "RISO NERO, GAMBERI, TONNO, PISELLI", price: 8.50, image: "riso nero-gamberi-tonno-piselli.jpg" },
        { id: 5, name: "SALMONE GRIGLIATO, PATATE AL FORNO, BROCCOLI", price: 8.50, image: "salmonegrigliato-patatealforno-broccoli.jpg" },
        { id: 6, name: "POLLO GRIGLIATO, PATATE AL FORNO, ZUCCHINE", price: 8.50, image: "pollogrigliato-patatealforno-zucchine.jpg" },
        { id: 7, name: "RISO BASMATI, POLLO AL CURRY, ZUCCHINE", price: 8.50, image: "risobasmati-polloalcurry-zucchine.jpg" },
        { id: 8, name: "ORZO, CECI, FETA, POMODORINI, BASILICO", price: 8.50, image: "orzo-ceci-feta-pomodorini-basilico.jpg" },
        { id: 9, name: "TORTILLAS, TACCHINO AFFUMICATO, HUMMUS CECI", price: 8.50, image: "tortillas-tacchinoaffumicato-hummusceci-insalata.jpg" },
        { id: 10, name: "TORTILLAS, SALMONE AFFUMICATO, FORMAGGIO SPALMABILE", price: 8.50, image: "tortillas-salmoneaffumicato-formaggiospalmabile-insalata.jpg" }
    ],
    breakfastMeals: [
        { id: 11, name: "UOVA STRAPAZZATE, BACON, FRUTTI DI BOSCO", price: 6.50, image: "uovastrapazzate-bacon-fruttidibosco.jpg" },
        { id: 12, name: "PANCAKES", price: 6.50, image: "pancakes.jpg" }
    ]
};

// 📝 CAMBIA TUTTI I "price: 8" in "price: 8.50" per i pasti
// 📝 CAMBIA TUTTI I "price: 6" in "price: 6.50" per le colazioni