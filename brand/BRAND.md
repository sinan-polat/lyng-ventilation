# Lyng Ventilation

Designsystem og brandbog for **Lyng Ventilation ApS** – installation og indregulering af ventilation for private og erhverv. Systemet er bygget ud fra hjemmesiden (`docs/` i projektet OmarHjemmeside / GitHub `sinan-polat/airplus`) og er den fælles kilde for alt nyt materiale: hjemmeside, tryksager, sociale medier, tilbud og brand-manual.

> **Til den, der skal bygge videre (menneske eller AI):** Læs hele denne side først. Brug kun farver, skrifter, afstande og komponenter herfra. Find aldrig på firmafakta, priser, tal eller kundeudtalelser – skriv en pladsholder i `[firkantede parenteser]` i stedet.

---

## 1. Firmafakta (de eneste fakta, der må bruges)

| | |
|---|---|
| Navn | Lyng Ventilation ApS |
| CVR | 45881016 |
| Adresse | Kildehuset 5, 2670 Greve |
| Telefon | +45 42 71 22 71 (vises som **42 71 22 71**, link `tel:+4542712271`) |
| E-mail | info@lyngventilation.dk *(den gamle side nævner også .com – .dk er valgt)* |
| Web | lyngventilation.dk |
| Sociale medier | facebook.com/lyngventilation · linkedin.com/company/lyngventilation · twitter.com/lyngventilation |
| Speciale | Installation og indregulering af ventilationsanlæg – private og erhverv |
| Ydelser | Professionel rådgivning · Planlægning · Installation · Indregulering |
| Værdier | Ekspertise og erfaring · Skræddersyede løsninger · Bæredygtighed · Kundetilfredshed |
| Løfte | "Vi leverer altid et færdigt resultat, som vi selv kan stå inde for." |
| Mission | At være den foretrukne leverandør af ventilationsløsninger i Danmark. |

**Udfører IKKE:** varmepumper, VVS, el, isolering. Nævn dem aldrig som ydelser.

**Ukendt endnu (altid pladsholder):** åbningstider `[Man–fre 07–16]`, svartid `[1 hverdag]`, serviceområde `[område]`, ejerens navn, antal år/anlæg, Trustpilot-score, priser, kundeudtalelser, billeder.

---

## 2. Brandidé og tone

**Kernebudskab:** *Frisk luft ind. Varmen bliver.* – balanceret ventilation med varmegenvinding: sundt indeklima og lavere energiforbrug.

**Tone of voice:** som en erfaren montør, der taler med kunden i entréen.
- **Klar** – korte sætninger, ét budskab ad gangen.
- **Konkret** – sig hvad der sker, hvornår, og hvad kunden får.
- **Ærlig** – ingen overdrivelser, ingen falske tilbud, intet pres ("Kun i dag!").
- **Hjælpsom** – forklar fagord første gang (fx *indregulering*), slut med næste skridt.

"Du" til private, "I" til virksomheder, "vi" om Lyng. Skriv aldrig "markedets bedste/billigste".

| Sådan | Ikke sådan |
|---|---|
| "Vi kommer ud og ser på det, før vi giver en pris." | "Markedets laveste priser!!!" |
| "Anlægget skifter luften hele døgnet, så fugten forsvinder." | "State-of-the-art HVAC-løsninger." |
| "To klik og dit telefonnummer – så ringer vi dig op." | "Udfyld venligst nedenstående formular." |

---

## 3. Logo

Logoet er håndskrevet **"lyng"** i en penselcirkel (videreført fra det oprindelige Lyng-logo) + ordmærket **LYNG / VENTILATION** i specialtegnede geometriske versaler. Brug altid de færdige filer – tegn aldrig logoet om, og skriv aldrig navnet i en skrifttype som erstatning.

| Opstilling | Brug |
|---|---|
| **Lang** – emblem + LYNG / VENTILATION | Førstevalg: hjemmeside-header, bil, brevpapir, tilbud, e-mailsignatur |
| **Kort** – emblem + VENTILATION under | Kvadratiske/smalle flader: arbejdstøj (ryg), visitkort-forside, skilte |
| **Element** – emblem alene | Favicon, profilbillede, app-ikon, klistermærke, bryst på tøj |

| Farvevariant | Farver | Baggrund |
|---|---|---|
| `primaer` | natblå skrift, orange ring, orange VENTILATION | hvid / lys |
| `negativ` | hvid skrift, orange ring | natblå / mørk |
| `sort` | alt natblå | én-farvetryk på lyst |
| `hvid` | alt hvidt | fotos, farvede flader, folie |

- Filnavne: `lyng-logo-<lang|kort|element>-<primaer|negativ|sort|hvid>.<svg|png|jpg>` i `brand/logo/<opstilling>/`. PNG har gennemsigtig baggrund; JPG har hvid (primaer/sort) eller natblå (negativ/hvid) baggrund.
- **Frizone:** X = ¼ af emblemets højde på alle sider. **Mindste størrelse:** lang 140 px / 35 mm bred; kort 90 px / 22 mm; element 32 px / 10 mm (favicon 16 px undtaget). Den tynde håndskrift må ikke blive mindre.
- **Forbudt:** strække, dreje, skifte farver, skygge/glød/konturer, orange-på-orange, flytte rundt på delene.
- Logoet er genereret af scriptet `lyng.py` (penselring = 9 strøg med fast tilfældighedsfrø 7; håndskrift = én sammenhængende monoline-sti skrået −12°; ordmærke = centerlinje-bogstaver, stregtykkelse 12 i LYNG og 16 i VENTILATION).

---

## 4. Farver

Natblå er grundfarven og bærer det meste. **Orange** = handling og varme (knapper, vigtige detaljer, logoets ring). **Luftblå** = frisk luft og bruges sparsomt, mest på natblå.

| Token | Hex | Brug |
|---|---|---|
| `ink` | #0B1B2B | Mørke sektioner, header, tekst på lyst |
| `ink-2` | #0F2438 | Paneler/kort på natblå |
| `ink-3` | #13304A | Hævede flader på natblå, aktive faner |
| `ink-4` | #1C3A57 | Bjælker, kanaler i illustrationer |
| `line-dark` | #22405C | Kanter på natblå |
| `accent` | #FF7A2F | Primærknapper (med natblå tekst), logo-ring, nøgleord |
| `air` | #2EC4F0 | Luftblå accent på natblå (labels, flow-linjer, fokusring) |
| `air-text` | #0A6A93 | Luftblå til tekst/links på lys baggrund |
| `air-tint` | #E3F6FD | Valgt tilstand i formularer |
| `paper` | #F3F5F7 | Lyse sektioner (sidebaggrund) |
| `white` | #FFFFFF | Kort, formularer |
| `line` | #DDE3E7 | Kanter på lyst |
| `muted` | #4B5B6B | Brødtekst på lyst |
| `soft-dark` | #C5D3DF | Brødtekst på natblå |
| `muted-dark` | #A9BCCD | Labels på natblå |

**Kontrast-regler:** Orange er **aldrig** tekstfarve på hvid (for lav kontrast) – brug det som flade med natblå tekst. Luftblå `air` kun på natblå; på lyst bruges `air-text`. Fordeling på en typisk flade: ~45 % natblå, ~40 % hvid/papir, resten orange + luftblå.

Tryk (vejledende CMYK): natblå 74·37·0·83 · orange 0·52·82·0 · luftblå 81·18·0·6. Pantone aftales med trykkeriet.

---

## 5. Typografi

Tre gratis Google Fonts:

| Rolle | Skrift | Detaljer |
|---|---|---|
| Overskrifter | **Archivo** (variabel, bredde 112–125 %) | ExtraBold/Black. Store overskrifter i VERSALER med `font-stretch: 118%`, `letter-spacing: -0.02em`, `line-height ≈ 0.96` |
| Brødtekst | **Public Sans** | 400 tekst, 600–800 knapper og fremhævning; 17 px / 1.55 på web |
| Labels/tal | **JetBrains Mono** | 12–13 px VERSALER, `letter-spacing: 0.08–0.1em`; kickers starter med "→ " |

Google Fonts-link: `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@500;600&family=Public+Sans:wght@400;500;600;700&display=swap`

I Word/PowerPoint uden skrifterne: Arial Black (overskrifter) og Arial (tekst).

---

## 6. Layout, form og bevægelse

- **Container** 1280 px, sidemargin 24 px (16 px på mobil). **Sektioner** har 104 px luft lodret (72 px på mobil) og skifter mellem lys (`paper`/`white`) og mørk (`ink`).
- **Tegningsgitter:** mørke sektioner kan have et 48 px gitter i luftblå på 7 % (`.blueprint`).
- **Former:** knapper og chips er **piller** (`radius-pill`); kort 16–22 px; felter og fliser 10–12 px; tags 6 px.
- **Ikoner:** stregikoner, 2 px streg, runde ender (Lucide-stil). Aldrig emojis.
- **Bevægelse:** stiplede flow-linjer (luftblå = frisk luft ind, orange = brugt luft ud) der løber; pulserende statusprik; knapper løfter sig 2 px ved hover. Al bevægelse slås fra ved `prefers-reduced-motion`.
- **Billeder:** egne fotos af rigtige opgaver og montører, naturligt lys, ryddeligt. Ingen stockfotos med modeller. Indtil fotos findes: grå pladsholdere med motiv + filnavn.

---

## 7. Komponenter (fra hjemmesiden)

- **Button** – pille. *Primær:* `accent` med `ink` tekst, 800. *Sekundær:* omrids i hvid (på mørkt) eller natblå (på lyst). Én primærhandling pr. sektion.
- **Kicker** – mono-label i versaler "→ YDELSER" over hver H2.
- **Tile** – valgflise i formularen (titel + undertekst); valgt = natblå kant + `air-tint`.
- **Chip** – rund afkrydsningsknap i indeklima-tjekket; valgt = natblå fyld + luftblå prik.
- **Panel** – natblå kort med 1 px `line-dark` kant og 22 px radius (anbefalinger, ydelsesfaner).
- **TrustLine** – "✓ Uforpligtende ✓ Svar inden for [1 hverdag] ✓ Ingen binding" under CTA'er.
- **PhoneCard** – stort telefonnummer med orange rund ikonplade og åbent/lukket-prik.

---

## 8. Konvertering – regler for CTA'er (vedtaget 20.10.2026)

1. Én hovedhandling: **"Få et uforpligtende tilbud"** (orange). Sekundært: **"Ring 42 71 22 71"**.
2. Tilbudsformularen har **2 trin**: klik på ydelse (går selv videre) → navn + telefon. Alt andet er valgfrit under "Tilføj detaljer". Genvej: **"Bliv bare ringet op"**.
3. En CTA må aldrig ende i en fejl: kan formularen ikke sende, åbnes en færdigudfyldt e-mail.
4. På mobil: fast bundbjælke [Ring nu] [Få et tilbud], skjult ved formularen.
5. Tryghed ved hver CTA (TrustLine). Telefonnummeret står altid synligt som tekst.
6. Svar fra indeklima-tjek og chat føres automatisk ind i formularens besked.
7. Klik måles i `window.dataLayer` (`cta_click`, `phone_click`, `form_step`, `lead_submit`, `lead_fallback`).

---

## 9. Hvor tingene ligger (projektet OmarHjemmeside)

```
docs/index.html, docs/css/style.css, docs/js/main.js, docs/js/chat.js   ← hjemmesiden (GitHub Pages)
docs/billeder/logo/                                                       ← logoer brugt på siden
brand/logo/<lang|kort|element>/                                           ← alle logofiler (SVG/PNG/JPG)
brand/BRAND.md                                                             ← denne brandbog som fil
brand/tryk/                                                                ← e-mailsignatur m.m.
server.js, prompt.js                                                       ← server + chatbot ("Lyng Assistent")
```

Relaterede dokumenter: *Lyng Ventilation brand-manual* (A4-sider til kunden) og *Lyng Ventilation tryksager* (flyer, dørhænger, visitkort, opslag).

## 10. Tjekliste før noget nyt leveres

- [ ] Kun tokens herfra – ingen nye farver eller skrifter.
- [ ] Rigtige firmafakta; alt ukendt som `[pladsholder]`.
- [ ] Én tydelig orange hovedknap + telefonnummer synligt.
- [ ] Logo i rigtig variant til baggrunden, med frizone.
- [ ] Tekst følger tonen: klar, konkret, ærlig, hjælpsom.
- [ ] Virker på mobil (390 px) og har god kontrast.

---

## 11. Til næste gang: sådan briefer du Claude

Start en ny samtale med fx: *"Læs brand/BRAND.md (eller designsystemet 'Lyng Ventilation') og lav [opgave] i samme stil som hjemmesiden."* Vedhæft filen eller peg på designsystemet – så bruges farver, skrifter, tone, logoregler og CTA-regler herfra automatisk.

| Dokument | Hvad | Hvor |
|---|---|---|
| Designsystem "Lyng Ventilation" | Tokens, komponenter og denne brandbog (kilden for AI) | https://claude.ai/artifact/2jwyfGourG5QvzsrCPV9kz |
| Lyng Ventilation brand-manual | 12 A4-sider til kunden (eksport: Share › Export › PDF) | https://claude.ai/artifact/96xwbm3tcSS6rDLEnLPBb3 |
| Lyng Ventilation tryksager | Flyer A5, dørhænger, visitkort, 2 SoMe-opslag, Facebook-cover | https://claude.ai/artifact/8KW1xyrcVfYkpggRnLUM9S |
| E-mailsignatur | Kopiér-klar HTML | brand/tryk/email-signatur.html |

Tryksager – formater: Flyer A5 148×210 mm (559×794 px) · Dørhænger 100×210 mm med Ø 30 mm hul (stanselinje aftales med trykkeriet) · Visitkort 85×55 mm · Opslag 1080×1080 px · Facebook-cover 1640×624 px. Trykkeriet lægger normalt 3 mm beskæring til – spørg efter deres skabelon. QR-koder er pladsholdere: generér en QR til lyngventilation.dk og læg den ind før tryk.
