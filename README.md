# Lyng Ventilation ApS – hjemmeside og chatbot

Hjemmeside for Lyng Ventilation ApS (CVR 45881016, Kildehuset 5, 2670 Greve, tlf. +45 42 71 22 71) med indbygget AI-chatbot, indeklima-tjek og tilbudsformular.

## Indhold

```
OmarHjemmeside/
├── docs/                ← selve hjemmesiden (GitHub Pages læser herfra)
│   ├── index.html       ← al tekst og struktur
│   ├── css/style.css    ← design (farver, skrift, layout)
│   ├── js/main.js       ← indeklima-tjek, faner, filtre, slider, FAQ, tilbudsformular
│   ├── js/chat.js       ← chatbotten (boblen nederst til højre)
│   └── billeder/        ← læg billeder her (se billeder/README.txt)
├── brand/logo/          ← alle logofiler (lang, kort, element × 4 farver × SVG/PNG/JPG)
├── server.js            ← lille server: viser siden + chatbot + modtager formularer
├── prompt.js            ← chatbottens instruktioner og viden om firmaet
├── .env.example         ← skabelon til indstillinger (API-nøgle m.m.)
└── package.json
```

## 1. Se siden med det samme (uden chatbot)

Dobbeltklik på `docs/index.html`. Hele designet og al interaktivitet virker –
men chatbotten og tilbudsformularen kræver serveren (punkt 2) og viser ellers en
besked om at ringe på 42 71 22 71.

## 2. Kør hele løsningen lokalt (med chatbot)

1. Installér **Node.js 20.6 eller nyere** fra <https://nodejs.org> (vælg "LTS").
2. Opret en API-nøgle på <https://console.anthropic.com> (Settings → API Keys).
   Chatbotten betales pr. brug på den konto.
3. Kopiér `.env.example` til en ny fil, der hedder `.env`, og indsæt nøglen:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Åbn en terminal i mappen (`OmarHjemmeside`) og kør:
   ```
   npm start
   ```
5. Åbn <http://localhost:3000> i browseren.

Der skal ikke installeres nogen pakker – serveren bruger kun det, der følger med Node.js.

## 3. Tilbudsformularen

Forespørgsler gemmes i `data/henvendelser.jsonl` (én linje pr. henvendelse) og
skrives i terminalen. **Før siden går live** bør de også sendes som e-mail til
firmaet – se `TODO` i `handleContact` i `server.js` (fx med pakken `nodemailer`
eller en tjeneste som Resend/Postmark).

## 4. Tilpas chatbotten

Alt chatbotten ved om firmaet står i `prompt.js`. Når I har adresse, åbningstider,
serviceområde, autorisationer og evt. vejledende priser, så skriv dem ind dér –
så svarer den på dem. Genstart serveren bagefter.

Model og grænser ændres i `.env`:

| Indstilling        | Betydning                                                  |
|--------------------|------------------------------------------------------------|
| `CLAUDE_MODEL`     | `claude-haiku-5-5` (hurtig/billig) eller `claude-sonnet-5-5` (grundigere) |
| `CLAUDE_MAX_TOKENS`| Maks. længde på et svar                                    |
| `CHAT_RATE_LIMIT`  | Maks. beskeder pr. besøgende pr. 10 minutter (mod misbrug) |

API-nøglen ligger kun på serveren og sendes aldrig til browseren.

## 5. Pladsholdere der skal udfyldes

Søg efter `[` i `docs/index.html` – alt i firkantede parenteser er pladsholdere:

- Serviceområde og åbningstider
- Antal års erfaring, installerede anlæg, Trustpilot-score
- Ejerens navn
- Kundeudtalelser (brug kun rigtige!)
- FAQ-svar markeret med [Tilpas]
- Links til privatlivspolitik og cookies
- Billeder (se `docs/billeder/README.txt`)

Åbningstiderne, som "Åbent nu / Lukket nu" bruger, rettes øverst i `docs/js/main.js`.

## 6. Sæt siden online

### GitHub Pages (kun hjemmesiden)
Repositoriet er sat op til GitHub Pages fra mappen `/docs` på `main`.
Siden ligger på <https://sinan-polat.github.io/airplus/> (adressen skifter, hvis repositoriet omdøbes).

GitHub Pages kan kun vise filer – den kan ikke køre `server.js`. Derfor virker
**chatbotten og tilbudsformularen ikke** på GitHub Pages; de viser i stedet en
besked om at ringe på 42 71 22 71. Det er fint til at vise designet frem.

### Med chatbot og formular
Læg hele repositoriet hos en udbyder, der kan køre Node.js, fx Render, Railway,
Fly.io eller en lille VPS. Sæt `ANTHROPIC_API_KEY` som miljøvariabel hos
udbyderen (læg aldrig `.env` op offentligt), og brug startkommandoen
`node server.js`.
