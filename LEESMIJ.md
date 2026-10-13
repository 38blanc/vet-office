# VET Office

Facturatie en administratie van Van Eyen Technics, werkt samen met VET Heat, VET Work en (later) VET Secretaris.
Webapp (Mac, Windows, iPhone, Android) en desktop-app (.dmg / .exe).

## 1. Online zetten (GitHub Pages)
1. Maak op GitHub een nieuwe **publieke** repository `vet-office`.
2. Sleep alle bestanden van deze map erin (Add file › Upload files). Alles staat in één map, zonder submappen.
3. Settings › Pages › Deploy from branch › `main` / root.
4. Na 1–2 minuten: **https://38blanc.github.io/vet-office/**
5. Openen in Chrome/Edge/Safari › "App installeren" (of Deel › Zet op beginscherm).

## 2. Eerste keer
- Instellingen › Cloud: log in met **hetzelfde account** als in VET Heat en VET Work.
  Werkbonnen, attesten en klanten komen dan vanzelf binnen.
- Instellingen › Bedrijf: controleer je gegevens (staan al ingevuld zoals op je Dexxter-facturen).
- Instellingen › Documenten: vul bij "Laatst gebruikt nr" je laatste nummers uit Dexxter in.
- **Dexxter-modus staat AAN**: Dexxter blijft officieel. Zet hem pas uit (Instellingen › Dexxter) als een kwartaal lang alles klopt.

## 3. Wat zit erin
| Onderdeel | Wat |
|---|---|
| Facturen, voorschotfacturen, offertes, creditnota's | Dexxter-layout (PT Sans, logo, QR-betaalcode, opmerkingen, algemene voorwaarden), doorlopende nummering, gestructureerde mededeling, "FACTUUR IS AL BETAALD"-stempel |
| Wettelijke vermeldingen | 6%-tekst, verlegging van heffing (onderaanneming), intracommunautair, kleine onderneming, creditnota-verwijzing – automatisch |
| Definitief = vergrendeld | Na definitief maken kan een factuur niet meer wijzigen; PDF + UBL worden gearchiveerd (10 jaar bewaren) |
| Peppol | UBL (BIS Billing 3.0) met PDF-bijlage, versturen en ontvangen via Recommand (zie 4) |
| Uitgaven | Foto/PDF van het bonnetje, roosters 81/82/83, verlegd (87/56), EU-diensten (88/55), aftrekbaar %, afschrijvingen |
| Bank | CSV/CODA-import (alle Belgische banken) of automatische koppeling via Enable Banking (zie 5); automatisch koppelen aan facturen via de gestructureerde mededeling |
| Btw-aangifte | Roosters per kwartaal + **XML-bestand voor Intervat** (gevalideerd tegen het officiële XSD-schema) + klantenlisting-XML |
| Belastingen & RSZ | Kwartaalbijdragen, voorafbetalingen, raming personenbelasting (of vennootschapsbelasting bij BV/NV) → nog te betalen / terug |
| Rechtsvorm | Eenmanszaak / BV / NV / CV / VOF / CommV: documenten, belastingmodule en boekhouder-uitleg passen zich aan |
| VET-apps | Werkbonnen → factuur in 1 klik (uren + materiaal), attesten → factuur/offerte, onderhoud-binnenkort-lijst, aanvragen van VET Secretaris |
| Boekhouder | Alleen-lezen toegang + export (zip met PDF's, UBL, CSV en btw-roosters per kwartaal) |

## 3b. Nieuw in versie 2
- Logo van Heat/Work linksboven, en bij elke stap een knop "Openen ↗" naar de juiste website.
- **Kosten** met de 72 kostencategorieën van Dexxter (eigen categorieën toevoegen kan), voorbeeldje van elke PDF/foto, **Ticket fotograferen** (camera) of uit galerij.
- **Afschrijvingen** (pro rata per dag zoals Dexxter), **Auto's** (aftrekbaarheid volgens CO₂ en aankoopdatum), **Verzekeringen**.
- **Personenbelasting & RSZ** zoals Dexxter: sociale bijdragen op geproratiseerde winst (+3,05% beheerskosten Xerius), voorafbetalingen per kwartaal, inschatting belasting, **aangiftehulp Tax-on-web** (codes 1600/1606/1632/1617 + PDF).
- **IC-aangifte** (XML voor Intervat), **Rapporten** (inkomsten & uitgaven, per maand, klanten, openstaand), **Tijdlijn** die vanzelf meeschuift.
- **VEKA-meldingen** vanuit Office; "gemeld" synchroniseert met VET Heat.
- **Te factureren**: werkbon (VET Work) + attesten (VET Heat) samen → 1 factuur met werkbon en attesten als bijlage (mail en Peppol).
- **Artikels** gedeeld met VET Work.

## 3c. Nieuw in versie 3
- **Aanvraag → werkbon**: bij een aanvraag van VET Secretaris maakt "🔧 Werkbon in VET Work" meteen een werkbon met klant, adres, toestel en probleem (Work geeft het nummer). Nieuwe klanten worden automatisch aangemaakt.
- **Betalingsherinneringen**: bij een vervallen factuur staat de knop "⏰ Herinnering" en daarna "⏰ Aanmaning".
  - Particulier: de eerste herinnering is gratis, met 14 dagen termijn (per post + 3 werkdagen). Daarna komen het schadebeding (€ 20 / € 30 + 10% / € 65 + 5%, max. € 2.000) en interest, zoals in je algemene voorwaarden en binnen het wettelijke maximum (Boek XIX WER).
  - Bedrijf: van rechtswege interest vanaf de vervaldag + forfait € 40 (wet 2 augustus 2002).
  - Rentevoet: 10,5% (1e semester 2026). Controleer elk semester via FOD Financiën en pas zo nodig `RL.herinnering` aan in `office-v3.js`.
- **Onderhoudsherinnering**: Attesten › Onderhoud binnenkort toont klanten van wie het volgende onderhoud binnen 60 dagen valt. Stuur ze in één klik een mail (tekst aanpasbaar). Het overzicht toont hoeveel klanten nog geen herinnering kregen.
- **Automatische back-up**: elke maand een zip in je cloudopslag met de volledige administratie, alle facturen (PDF + UBL), aankopen en btw-roosters. Bewaard worden de laatste 12 maanden + per jaar de laatste. Downloaden kan via Instellingen › Cloud & back-up.

## 4. Peppol (wanneer je Dexxter loslaat)
Je Peppol-ID (0208:1034973271) kan maar bij één toegangspunt tegelijk staan. Zolang Dexxter je facturen verstuurt, laat je het daar.
1. Account op **recommand.eu** (gratis tot 25 documenten/maand) › bedrijf toevoegen › Peppol-registratie verhuizen van Dexxter (migratiesleutel).
2. API-sleutel maken (type *basic*).
3. Supabase › Edge Functions › Secrets: `RECOMMAND_KEY`, `RECOMMAND_SECRET`, `RECOMMAND_COMPANY` (bedrijfs-id, begint met `c_`).
   Voor automatische ontvangst: kies zelf een lang geheim woord, zet het als secret `PEPPOL_HOOK_KEY` en voeg in Recommand › Webhooks de URL toe:
   `https://pfxxzzdyzitcuhfrxaiq.supabase.co/functions/v1/vet-peppol-hook?k=<jouw geheim>`
   Nieuwe aankoopfacturen komen dan vanzelf bij je kosten, en je krijgt een mail (zie 4b).
   Aanrader: ook `OWNER_ID` = `28087b70-9800-43f9-8c56-8a7c461ab711` (enkel jij mag versturen, niet je boekhouder).
4. VET Office › Instellingen › Peppol › Test verbinding.
De edge function `vet-peppol` staat al online.

## 4b. Mail (Resend)
1. Gratis account op resend.com › Domains › `vaneyentechnics.be` toevoegen › DNS-records zetten bij je domeinbeheerder.
2. API key maken.
3. Supabase-secrets: `RESEND_API_KEY`, `MAIL_FROM` = `Van Eyen Technics <info@vaneyentechnics.be>`, `MAIL_NOTIFY` = `info@vaneyentechnics.be`.
4. VET Office › Instellingen › Mail › Testmail.
Daarna kan je facturen met alle bijlagen rechtstreeks mailen, en krijg je een mail bij elke Peppol-factuur.

## 5. Bank koppelen
1. Account op **enablebanking.com** › Production-app registreren, redirect-URL `https://38blanc.github.io/vet-office/index.html`.
2. In Enable Banking je eigen rekening linken (gratis voor eigen rekeningen).
3. Supabase › Edge Functions › Secrets: `EB_APP_ID` en `EB_PRIVATE_KEY` (inhoud van het .pem-bestand).
4. VET Office › Instellingen › Bank › Koppelen. Toestemming is 180 dagen geldig, daarna opnieuw bevestigen.
Zonder koppeling: in je bankapp een CSV of CODA exporteren en op de pagina Bank importeren.
De edge function `vet-bank` staat al online.

## 6. Boekhouder
1. Supabase › Authentication › Users › Add user (e-mail van je boekhouder).
2. VET Office › Instellingen › Boekhouder › e-mail invullen › Toegang geven.
3. De boekhouder logt in op VET Office en kiest jouw administratie (alleen lezen).

## 7. Desktop (.dmg en .exe)
0. Eenmalig: GitHub › repo `vet-office` › Actions › New workflow › "set up a workflow yourself" › naam `desktop.yml` › plak de inhoud van `desktop-workflow.yml` › Commit.
1. Actions › **VET Office desktop** › Run workflow.
2. Na ± 10 minuten: onderaan bij *Artifacts* staan `VET-Office-macOS` (.dmg) en `VET-Office-Windows` (.exe).
3. Niet ondertekend: Mac › rechtsklik › Open (eerste keer); Windows › "Meer info" › "Toch uitvoeren".
De desktop-app opent altijd de nieuwste webversie en werkt ook offline.

## 8. Regels veranderen?
- Alle tarieven, teksten, roosters en jaarparameters staan in **`rules.js`** (met bron en datum).
- Kleine wijzigingen (gemeentebelasting, beheerskosten, vermeerdering…) kan je in **Instellingen › Regels** aanpassen zonder update.
- Nieuw jaar: kopieer het blok `2026` in `rules.js` naar `2027` en pas de bedragen aan.

## 9. VET Secretaris
VET Office leest aanvragen uit de cloud-tabel `docs` met `app = 'secretaris'`, `kind = 'aanvraag'`.
Office is het admin-programma:
- **Verwijderen** (per aanvraag of "Verwijder alle afgehandelde") zet `deleted = true`. Office onthoudt dat zelf, dus de aanvraag komt nooit terug in Office.
- **Afhandelen**: de status klant, afgehandeld of afgewezen zet `data.status = "afgehandeld"` en `data.statusDoor = "office"`.
- De secretaris-gsm neemt dit over vanaf **VET Secretaris 2.1**, de versie die ook uit de cloud ophaalt.

## Bestanden
`index.html` (scherm) · `office-app.js` (documenten, klanten) · `office-views.js` (overige schermen) · `office-core.js` (berekeningen, XML, UBL) · `office-pdf.js` (PDF-opmaak) · `office-cloud.js` (cloud, Peppol, bank, boekhouder) · `rules.js` (wetgeving) · `vet-sync.js` (gedeeld met Heat/Work) · `desktop-*` (Mac/Windows) · `office-extra.js` (versie 2: kosten, belastingen, rapporten, tijdlijn, VEKA, dossiers) · `office-start.js` · `pdfjs*.js` (PDF-voorbeelden) · `supabase-*` (edge functions en SQL, ter info – staan al online)
