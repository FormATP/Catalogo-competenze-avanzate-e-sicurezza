# Form&ATP — Catalogo Formativo Interattivo 2026

Catalogo formativo web-based per Form&ATP Consulenza e Formazione.  
Funziona offline (doppio click su `index.html`) oppure hostato su GitHub Pages.

## Struttura

```
├── index.html               ← Landing: selezione catalogo
├── avanzato.html            ← Catalogo Competenze Avanzate (Avviso Fondimpresa 4/2026)
├── sicurezza.html           ← Catalogo Sicurezza (da aggiungere)
├── assets/
│   ├── css/
│   │   ├── shared.css       ← Stili comuni a tutti i cataloghi
│   │   └── avanzato.css     ← Stili specifici catalogo avanzato
│   ├── js/
│   │   └── avanzato.js      ← Logica catalogo avanzato
│   ├── data/
│   │   └── data-avanzato.json  ← Dati corsi (da aggiornare ad ogni export)
│   └── img/
│       └── logo.png
├── .nojekyll                ← Necessario per GitHub Pages
└── README.md
```

## Aggiornare il catalogo

Quando arriva un nuovo Excel dal gestionale:

1. Esegui lo script di estrazione (Python):
   ```
   python tools/extract.py NuovoExport.xls
   ```
   Questo sovrascrive `assets/data/data-avanzato.json`.

2. Commit e push — il sito si aggiorna automaticamente.

## Deploy su GitHub Pages

1. Crea un repository GitHub (es. `form-atp/catalogo`).
2. Carica tutti i file in questo ZIP nella root del repo.
3. Vai in **Settings → Pages → Source: Deploy from branch → main / root**.
4. Il catalogo sarà disponibile a `https://<tuo-account>.github.io/catalogo/`.

## Aggiungere il Catalogo Sicurezza

1. Aggiungi `assets/data/data-sicurezza.json` (stessa struttura di `data-avanzato.json` con campi: `titolo`, `durata`, `aula`, `action_learning`, `affiancamento`, `fad`, `obiettivi`, `contenuti`, `destinatari`, `modalita`, `certificazione`).
2. Crea `assets/css/sicurezza.css` e `assets/js/sicurezza.js` (template già pronti nella branch `sicurezza`).
3. Rimuovi `pointer-events:none` e il badge "in arrivo" dalla tile sicurezza in `index.html`.
