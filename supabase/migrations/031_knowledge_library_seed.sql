-- Migration 031: FoundriOS Kennisbibliotheek — Content Seeds
-- 10 knowledge_articles (Handboek) | 6 SOPs | 15 templates
-- Idempotent — veilig om meerdere keren uit te voeren.

-- =====================================================
-- FASE 1 — KNOWLEDGE ARTICLES (HANDBOEK)
-- =====================================================

INSERT INTO knowledge_articles (slug, title, content, category, sort_order, status) VALUES

(
  'systemen-dominantie-profiel',
  'Hovenier Dominantie Profiel — het moederdocument',
  E'## Wat is dit?\n\nHet Dominantie Profiel is het eerste document dat je invult bij elke nieuwe klant. Het voedt alle AI-functies: kwalificatie, opvolging, content en rapportage.\n\nZonder dit profiel werkt FoundriOS generiek. Met dit profiel werkt het op maat.\n\n## 1. Bedrijf\n\n- **Naam:** [invullen]\n- **Website:** [invullen]\n- **Werkgebied:** [plaatsen of straal in km]\n- **Teamgrootte:** [aantal medewerkers]\n- **Capaciteit:** [max projecten per week]\n- **Winstgevendste diensten:** [1-2 diensten]\n- **Diensten die we vermijden:** [bijv. kleine klussen, lange ritten]\n- **Minimale projectwaarde:** [bedrag invullen]\n\n## 2. Ideale aanvraag\n\n- **Type klant:** [particulier / VvE / bedrijf]\n- **Type project:** [bijv. herinrichting 80m2+]\n- **Budgetrange:** [van X tot Y]\n- **Goede signalen:** [fotos gestuurd, concrete datum, verwijzing]\n- **Slechte signalen:** [vergelijkt meerdere offertes, buiten werkgebied, spoed zonder budget]\n- **Automatisch afwijzen:** [bijv. budget onder minimale projectwaarde]\n\n## 3. Aanbod\n\n- **Hoofdaanbod:** [beschrijving in 1 zin]\n- **Belofte:** [wat garandeert het bedrijf]\n- **Bewijs:** [reviews, projecten, jaren actief]\n\n## 4. Leadflow\n\n- **Bronnen:** [Meta Ads / Google / verwijzing / website]\n- **Kwalificatieregels:** [wanneer is een lead goed genoeg voor afspraak]\n- **Opvolgfrequentie:** [dag 1 WhatsApp, dag 3 bellen, dag 7 laatste poging]\n\n## 5. Communicatie\n\n- **Tone of voice:** [direct / warm / vakkundig]\n- **WhatsApp stijl:** [kort, persoonlijk, geen lange opsommingen]\n- **Offerte stijl:** [beknopt + visueel / uitgebreid met toelichting]\n\n## 6. Campagne\n\n- **Diensten in focus:** [welke diensten staan centraal in advertenties]\n- **KPI doel:** [bijv. CPL onder 25 euro, 20 leads per maand]\n\n## 7. Backend\n\n- **Pipeline stages actief:** [welke stages zijn relevant]\n- **Reviewflow:** [wanneer vragen, via welk kanaal]\n- **Herhaalflow:** [onderhoud, seizoenscontract, herinrichting na 5 jaar]\n\n## Hoe gebruik je dit profiel?\n\nVul dit profiel in bij onboarding. Update het wanneer de focus van het bedrijf verandert. Alle AI-kwalificatie, opvolging en content trekt automatisch uit dit document.',
  'systemen',
  90,
  'published'
),

(
  'acquisitie-ideale-aanvraag',
  'Ideale Aanvraag Profiel — goed vs slecht',
  E'## Waarom dit belangrijk is\n\nNiet elke aanvraag is de moeite waard. Een goed systeem filtert automatisch. Dit artikel beschrijft de beslisregels achter de kwalificatiescore.\n\n## De 6 factoren\n\n| Factor | Max punten | Hoe beoordelen |\n|---|---|---|\n| Werkgebied match | 20 | Binnen de ingestelde straal? |\n| Budget match | 25 | Passen de verwachtingen bij de projectwaarde? |\n| Projecttype match | 20 | Valt het binnen de aangeboden diensten? |\n| Urgentie | 15 | Realistische start-datum en reden? |\n| Fotos aangeleverd | 10 | Concrete situatiefoto gestuurd? |\n| Duidelijke omschrijving | 10 | Weet de klant wat ze willen? |\n\n## Score-uitkomst\n\n- **80-100:** Direct afspraak plannen\n- **50-79:** Eerst extra vragen stellen via WhatsApp\n- **20-49:** Lage prioriteit, bewaren voor rustiger periode\n- **0-19:** Afwijzen of naar nurture\n\n## Goede signalen\n\n- Fotos meegestuurd bij eerste aanvraag\n- Concrete start-datum of reele tijdsdruk met reden\n- Budget-indicatie gegeven of gevraagd\n- Verwijzing van bestaande klant\n- Project past bij de winstgevendste diensten\n\n## Slechte signalen\n\n- Vergelijkt 5 offertes tegelijk\n- Geen fotos, geen omschrijving\n- Buiten werkgebied\n- Budget duidelijk te laag voor het projecttype\n- Spoed als enig argument, geen concrete reden\n\n## Automatisch afwijzen\n\nStel in FoundriOS de volgende filters in:\n\n- Buiten werkgebied + budget onder minimum: direct afwijzen met standaardbericht\n- Projecttype niet in het aanbod: doorverwijzen\n- Geen reactie op twee follow-ups binnen 7 dagen: naar nurture\n\n## Netjes afwijzen\n\nGebruik altijd een afwijstemplate. Nooit zomaar niet reageren. Een beleefde afwijzing nu is een potentiele verwijzing later.',
  'acquisitie',
  90,
  'published'
),

(
  'acquisitie-dienstenprofiel',
  'Dienstenprofiel — per dienst wat werkt',
  E'## Waarom per dienst documenteren?\n\nElke dienst heeft een ander type klant, andere bezwaren en andere kwalificatiecriteria. Door dit per dienst vast te leggen, weet de AI precies hoe een aanvraag te beoordelen.\n\n## Per dienst vastleggen\n\n| Veld | Invullen |\n|---|---|\n| Voor wie? | Type klant dat deze dienst afneemt |\n| Wanneer interessant? | In welk seizoen of situatie |\n| Gemiddelde projectwaarde | Realistisch gemiddelde |\n| Veelgestelde vragen | Top 3 die je altijd krijgt |\n| Veelvoorkomende bezwaren | En het juiste antwoord |\n| Minimale prijsrange | Onder dit bedrag niet aannemen |\n| Wanneer niet aannemen? | Specifieke situaties om te weigeren |\n\n## De meest voorkomende diensten\n\n**Tuinaanleg**\nHoogste projectwaarde. Klant wil een compleet plan. Langere doorlooptijd, meer voorbereiding. Foto van huidige situatie plus globale wensen is het minimum.\n\n**Tuinonderhoud**\nWederkerende omzet. Filter op: wil de klant een contract of een eenmalige beurt? Contract is waardevoller.\n\n**Bestrating**\nPraktisch, prijsgevoelig. Concrete maten en materiaalwensen bepalen of het interessant is.\n\n**Snoeiwerk**\nVaak onderdeel van groter werk. Als zelfstandige klus: let op grootte en bereikbaarheid.\n\n**Reiniging**\nSnelle klus, lage marge. Alleen interessant als het onderdeel is van ander werk of een onderhoudscontract.\n\n**Overkapping / schutting**\nAfhankelijk van vergunning. Check dit als eerste stap.\n\n**Beplanting**\nVaak als aanvulling op aanleg. Zelden zelfstandig winstgevend.\n\n## Prioritering per dienst\n\nRangschik je diensten van hoogste naar laagste marge. Zet de top 2 centraal in je advertenties. Gebruik de onderste laag alleen als aanvulling.',
  'acquisitie',
  91,
  'published'
),

(
  'acquisitie-lead-score-model',
  'Lead Score Model — 0 tot 100',
  E'## Hoe werkt de score?\n\nElke inkomende lead krijgt automatisch een score van 0 tot 100. De score bepaalt wat het systeem doet: direct afspraak plannen, extra vragen stellen of afwijzen.\n\n## De 6 factoren\n\n| Factor | Punten | Scoringsregel |\n|---|---|---|\n| Werkgebied | 20 | Binnen ingesteld werkgebied: 20. Grens: 10. Buiten: 0. |\n| Budget | 25 | Boven minimale projectwaarde: 25. Onzeker: 15. Onder: 0. |\n| Projecttype | 20 | Hoofddienst: 20. Bijdienst: 10. Buiten aanbod: 0. |\n| Urgentie | 15 | Realistische datum + reden: 15. Vague: 8. Morgen: 0. |\n| Fotos | 10 | Fotos aangeleverd: 10. Geen: 0. |\n| Omschrijving | 10 | Concreet: 10. Globaal: 5. Leeg: 0. |\n\n## Score-uitkomst\n\n| Score | Actie |\n|---|---|\n| 80-100 | Direct afspraak plannen, hoge prioriteit |\n| 50-79 | Extra kwalificatievragen via WhatsApp |\n| 20-49 | Lage prioriteit, terugkeren in rustige periode |\n| 0-19 | Afwijzen met standaardbericht of naar nurture |\n\n## Drempel aanpassen\n\nNa 3 weken data: analyseer de verhouding hoge vs lage scores. Is de drempel te streng? Dan mis je goede leads. Te soepel? Dan verlies je tijd.\n\n**Aanbevolen eerste drempel:** 60+ voor directe afspraak. Pas aan op basis van eigen data.\n\n## Wat de score niet meet\n\n- Badreferenties van de klant\n- Specifieke locatieproblemen\n- Vergunningsplichtige situaties\n\nDeze check blijft handmatig. Gebruik de score als filter, niet als oordeel.',
  'acquisitie',
  92,
  'published'
),

(
  'systemen-pipeline-handboek',
  'Pipeline Handboek — 13 stages en acties',
  E'## Waarom een vaste pipeline?\n\nEen vaste pipeline zorgt dat elke lead hetzelfde traject doorloopt. Geen leads die verdwijnen. Geen offertes zonder opvolging. Alles heeft een volgende actie.\n\n## De 13 stages\n\n| Stage | Wanneer | Automatische actie | Menselijke actie |\n|---|---|---|---|\n| Nieuwe aanvraag | Lead komt binnen | Score berekenen, WhatsApp sturen | Score beoordelen |\n| Contact opgenomen | Eerste bericht gestuurd | Wachtstatus zetten | 24u geen reactie: bellen |\n| Wacht op reactie | Na follow-up | Reminder na 3 dagen | Bij stilte: volgende stap |\n| Fotos ontvangen | Fotos binnen | Score verhogen | Beoordelen, afspraak plannen |\n| Gekwalificeerd | Score 60+ | Agenda-link klaarzetten | Afspraak aanbieden |\n| Afspraak gepland | Afspraak bevestigd | Herinneringen plannen | 24u voor afspraak nabellen |\n| Offerte maken | Na afspraak | Calculatie openen | Offerte uitwerken |\n| Offerte verstuurd | Offerte verstuurd | Dag 2 follow-up inplannen | Dag 5 bellen |\n| Offerte opvolgen | Geen reactie na 2 dagen | Herinneringen sturen | Dag 7 laatste poging |\n| Gewonnen | Klant zegt ja | Onboarding starten, factuur sturen | Contract laten tekenen |\n| Verloren | Klant zegt nee | Reden noteren, nurture tag | Analyse: waarom verloren? |\n| Review vragen | 3 dagen na oplevering | Review-verzoek sturen | Nabellen bij hoge waarde |\n| Herhaalopvolging | Na 6 maanden | Herinnering onderhoud sturen | Aanbod onderhoud doen |\n\n## Regels voor een gezonde pipeline\n\n- Elke lead heeft een status\n- Elke lead heeft een volgende actie\n- Geen lead zonder eigenaar\n- Geen offerte zonder opvolgdatum\n- Geen afgerond project zonder reviewflow\n\n## Wekelijkse pipeline check\n\nEvery maandag: doorloop open offertes, leads zonder actie en verloren deals. Maximal 15 minuten. Alles met een volgende actie kan wachten.',
  'systemen',
  91,
  'published'
),

(
  'acquisitie-whatsapp-library',
  'WhatsApp Follow-up Library — overzicht',
  E'## Waarom een vaste bibliotheek?\n\nVariatie in berichten kost tijd en leidt tot inconsistentie. Met een vaste bibliotheek kies je het juiste template voor het juiste moment.\n\n## De 10 kernberichten\n\n| Template | Moment | Doel |\n|---|---|---|\n| Nieuwe aanvraag ontvangen | Binnen 60 seconden | Bevestigen, vragen stellen |\n| Fotos opvragen | Na eerste reactie | Kwalificatie verbeteren |\n| Budgetindicatie vragen | Wanneer budget onduidelijk | Kwalificatiecheck |\n| Afspraak voorstellen | Lead score 60+ | Agenda vullen |\n| Geen reactie dag 3 | 3 dagen na eerste bericht | Opvolgen zonder te pushen |\n| Na telefoontje | Direct na gesprek | Samenvatten en volgende stap |\n| Na offerte verstuurd | Direct na verzenden | Bevestigen en verwachting managen |\n| Bezwaar: te duur | Klant zegt te duur | Waarde uitleggen |\n| Bezwaar: later starten | Klant wil later | Warm houden |\n| Afwijzen: buiten werkgebied | Lead buiten werkgebied | Netjes weigeren |\n\n## Wanneer WhatsApp, wanneer bellen?\n\n- **WhatsApp:** eerste contact, follow-up, bevestigingen, reminders\n- **Bellen:** na 2 berichten zonder reactie, bij complexe situaties, na offerte > 2.500 euro\n\n## Toonregels\n\n- Kort: max 4 zinnen per bericht\n- Persoonlijk: gebruik altijd de naam\n- Een CTA per bericht: nooit twee acties vragen\n- Geen hype: direct en nuchter\n\n## Reactietijd\n\nHet eerste bericht gaat binnen 5 minuten na binnenkomst van de aanvraag. Dit is de heilige regel. Na 5 minuten daalt de kans op conversie met 80 procent.',
  'acquisitie',
  93,
  'published'
),

(
  'systemen-ai-telefoniste',
  'AI Telefoniste — gespreksstructuur inbound',
  E'## Wat doet de AI Telefoniste?\n\nDe AI Telefoniste neemt inkomende gesprekken aan wanneer de eigenaar niet beschikbaar is. Het doel is niet alleen opnemen, maar kwalificeren en direct doorsturen naar de agenda.\n\n## Gespreksstructuur\n\n**Stap 1 — Openen (0-30 sec)**\n\n"Goed om je te spreken. Je hebt [bedrijfsnaam] gebeld. Mijn naam is [naam]. Waarmee kan ik je helpen?"\n\nLuisteren, samenvatten, niet onderbreken.\n\n**Stap 2 — Kwalificatie (1-3 min)**\n\nStel maximaal 4 vragen:\n- Wat is de situatie in de tuin?\n- Wat wil je veranderen of laten doen?\n- In welke omgeving woon je? [voor werkgebied check]\n- Heb je al een indicatie van het budget?\n\nNoteer de antwoorden. Bereken de score intern.\n\n**Stap 3 — Routing**\n\n| Score | Actie |\n|---|---|\n| 60+ | Direct afspraak aanbieden: "Ik kijk even in de agenda..." |\n| 30-59 | Fotos opvragen via WhatsApp voor nadere beoordeling |\n| 0-29 | Vriendelijk afwijzen of naar website verwijzen |\n\n**Stap 4 — Afsluiten**\n\n- Bij afspraak: datum en tijd bevestigen, naam en nummer noteren\n- Bij follow-up: verwachting managen: "Je ontvangt binnen X minuten een WhatsApp"\n- Bij afwijzing: vriendelijk, concreet, geen valse hoop\n\n## Wat de AI niet doet\n\n- Geen offertebedragen noemen\n- Geen toezeggingen over beschikbaarheid of startdatum\n- Geen oordeel over klantgedrag\n\n## Escalatie\n\nBij twijfel, agressie of complexe situatie: "Ik verbind je direct door met de eigenaar" of "Ik laat de eigenaar je zo snel mogelijk terugbellen."',
  'systemen',
  92,
  'published'
),

(
  'systemen-ai-booking-agent',
  'AI Booking Agent — DM naar afspraak',
  E'## Wat doet de AI Booking Agent?\n\nDe Booking Agent converteert inkomende DMs, WhatsApp-berichten en formulieren naar geplande afspraken. Zonder handmatige tussenkomst.\n\n## De gesprekflow\n\n**Bericht 1 — Ontvangst (binnen 60 sec)**\n\n"Hoi [naam], bedankt voor je aanvraag. Ik ben [naam] van [bedrijf]. Even kort: om goed te kunnen beoordelen of we je kunnen helpen, heb ik een paar vragen. Is dat goed?"\n\n**Bericht 2 — Kwalificatievragen**\n\nStel maximaal 3 vragen in 1 bericht:\n1. Wat wil je laten doen in de tuin?\n2. In welke gemeente of stad woon je?\n3. Heb je al een idee van het budget?\n\n**Bericht 3 — Fotos opvragen (indien relevant)**\n\n"Super, dank. Kun je ook 2-3 fotos sturen van de huidige situatie? Dan kan ik direct iets zinvols zeggen."\n\n**Bericht 4 — Score beoordelen**\n\n| Score | Bericht |\n|---|---|\n| 60+ | "Op basis van wat je beschrijft lijkt dit iets voor ons. Ik stel voor dat we even kort bellen of langskomen. Wanneer komt dat uit?" |\n| 30-59 | "Ik heb de informatie ontvangen. We beoordelen je aanvraag en komen zo snel mogelijk terug." |\n| 0-29 | Gebruik afwijstemplate |\n\n**Bericht 5 — Afspraak bevestigen**\n\n"Top, dan plannen we [datum] om [tijd]. Je ontvangt een bevestiging. Nog vragen? App me gerust."\n\n## Regels\n\n- Nooit meer dan 4 berichten voor afspraak\n- Altijd dezelfde toon als het bedrijf gebruikt\n- Geen toezeggingen over prijs\n- Bij twijfel: doorsturen naar eigenaar',
  'systemen',
  93,
  'published'
),

(
  'delivery-offerte-opvolging',
  'Offerte Opvolging Systeem',
  E'## Waarom structurele opvolging?\n\n80 procent van offertes wordt verloren door geen opvolging. Niet door prijs. Een gestructureerd systeem voorkomt dit.\n\n## Het tijdschema\n\n| Moment | Kanaal | Actie |\n|---|---|---|\n| Direct na verzenden | WhatsApp | "Offerte is verstuurd. Vragen? App me gerust." |\n| Dag 2 | WhatsApp | Korte check: ontvangen? Vragen? |\n| Dag 5 | Bellen | Persoonlijk gesprek. Wat ontbreekt? |\n| Dag 7 | WhatsApp | Laatste herinnering + verwijzing naar acceptlink |\n| Dag 14 | Status: verloren | Reden noteren, tag toevoegen, naar nurture |\n\n## Beslisregels\n\n- **Offerte boven 2.500 euro:** dag 2 en dag 5 zijn verplicht. Dag 7 is handmatig, niet geautomatiseerd.\n- **Offerte onder 2.500 euro:** dag 2 en dag 7 automatisch. Geen belronde.\n- **Acceptlink geopend maar niet getekend:** extra bellen op dag 3. Er is interesse maar iets blokkeert.\n\n## Bij bezwaar op prijs\n\nGebruik de template "Bezwaar: te duur". Verlaag de prijs nooit in de eerste reactie. Vraag eerst: "Wat verwacht je te betalen?" Daarna pas aanpassen indien relevant.\n\n## Na verlies\n\n- Noteer de reden in FoundriOS\n- Voeg tag toe: prijs / timing / concurrent / geen reactie\n- Plan herhaalopvolging na 3 maanden voor warme verloren deals\n\n## Wat je meet\n\n- Offerteconversieratio: doel boven 40 procent\n- Gemiddelde doorlooptijd van offerte naar akkoord\n- Meest voorkomende reden van verlies',
  'delivery',
  90,
  'published'
),

(
  'delivery-review-herhaalwerk',
  'Review & Herhaalwerk Systeem',
  E'## Waarom dit het meest waardevolle systeem is\n\nEen review zorgt voor sociale bewijskracht die nieuwe leads converteert. Herhaalwerk is de goedkoopste omzet die bestaat. Beide worden systematisch ondergepresteerd.\n\n## Reviewflow\n\n| Moment | Kanaal | Template |\n|---|---|---|\n| Dag 3 na oplevering | WhatsApp | Review-verzoek WhatsApp |\n| Dag 6 (geen reactie) | E-mail | Review-verzoek e-mail |\n| Dag 10 (geen reactie) | Bellen | Persoonlijk nabellen |\n\n**Maximaal 2 pogingen.** Bij geen reactie: lead naar archief.\n\n## Waar reviews naartoe?\n\nPrioriteit:\n1. Google Business Profile — meeste impact op lokale SEO\n2. Facebook — voor sociaal bewijs bij advertenties\n3. Screenshot voor website en offertes\n\n## Herhaalwerkflow\n\n| Dienst | Herhaalmoment | Bericht |\n|---|---|---|\n| Tuinonderhoud | Na elk seizoen | Onderhoudsherinnering template |\n| Tuinaanleg | Na 12 maanden | Check-in: hoe staat de tuin erbij? |\n| Bestrating | Na 24 maanden | Herinnering voor hervoegen of reinigen |\n| Snoeiwerk | Na 6 maanden | Seizoensherinnering |\n\n## Onderhoudscontract aanbieden\n\nNa elk afgerond aanlegproject: stuur binnen 7 dagen een aanbod voor een onderhoudscontract. Gebruik template "Onderhoudscontract na project".\n\n**Conversieratio doel:** 30 procent van aanlegklanten naar onderhoud.\n\n## Wat je meet\n\n- Percentage klanten dat een review geeft: doel boven 40 procent\n- Percentage herhaalaankopen: doel boven 25 procent per jaar\n- Gemiddelde LTV per klant over 24 maanden',
  'delivery',
  91,
  'published'
)

ON CONFLICT (slug) DO NOTHING;


-- =====================================================
-- FASE 2 — EXTRA SOPs
-- =====================================================

CREATE OR REPLACE FUNCTION seed_extra_sops(p_tenant_id uuid) RETURNS integer AS $$
DECLARE
  inserted_count integer := 0;
  sop_record record;
BEGIN
  FOR sop_record IN
    SELECT * FROM (VALUES
      (
        'Nieuwe Lead Intake',
        'sales',
        'Wat er binnen 60 seconden na binnenkomst van een lead gebeurt',
        '[
          {"title":"Binnen 60 sec: bevestig ontvangst","description":"Stuur direct WhatsApp via template ''Nieuwe aanvraag ontvangen''. Geen reactie na 60 sec = leads die wegvallen."},
          {"title":"Score beoordelen","description":"Controleer de automatisch berekende score. Score onder 30? Direct naar afwijsstap."},
          {"title":"Kwalificatievragen stellen","description":"Ontbrekende info opvragen via template ''Fotos opvragen'' of ''Budgetindicatie vragen''. Max 2 vragen per bericht."},
          {"title":"Routing bepalen","description":"Score 60+: afspraak aanbieden. Score 30-59: extra vragen. Score 0-29: afwijzen of parkeren."},
          {"title":"Lead taggen","description":"Voeg relevante tags toe: projecttype, bron, urgentie, werkgebied. Essentieel voor latere analyse."},
          {"title":"Volgende actie inplannen","description":"Zet een herinnering voor dag 3 als er geen reactie is. Geen lead zonder geplande volgende actie."}
        ]'::jsonb
      ),
      (
        'Lead Kwalificatie',
        'sales',
        'De 7 kwalificatiepunten die bepalen of een lead een afspraak waard is',
        '[
          {"title":"Werkgebied check","description":"Valt de locatie binnen het ingestelde werkgebied? Buiten: score -20. Grens: score -10."},
          {"title":"Budget check","description":"Is het budget realistisch voor het projecttype? Vraag altijd een indicatie als het ontbreekt."},
          {"title":"Projecttype check","description":"Valt de aanvraag binnen de aangeboden diensten? Buiten het aanbod: direct doorverwijzen."},
          {"title":"Urgentie check","description":"Heeft de klant een realistische start-datum en een echte reden? Spoed zonder context is een slecht signaal."},
          {"title":"Fotos check","description":"Zijn er fotos van de huidige situatie? Zonder fotos geen goede inschatting mogelijk."},
          {"title":"Beslisser check","description":"Spreek je met de eigenaar of beslisser? Bij twijfel: vraag wie de beslissing neemt."},
          {"title":"Capaciteit check","description":"Is er plek in de agenda voor dit project? Zo niet: eerlijk communiceren over doorlooptijd."}
        ]'::jsonb
      ),
      (
        'Niet-Gekwalificeerd Afwijzen',
        'sales',
        'Hoe je een lead netjes afwijst zonder de deur dicht te gooien',
        '[
          {"title":"Bepaal de reden","description":"Werkgebied? Budget? Projecttype? Capaciteit? De reden bepaalt de toon en het template."},
          {"title":"Stuur het juiste afwijstemplate","description":"Gebruik altijd een template. Nooit zomaar niet reageren. Een goede afwijzing nu is een potentiele verwijzing later."},
          {"title":"Voeg de juiste tags toe","description":"Tag de lead met: afgewezen + reden. Bijv: buiten-werkgebied / budget-te-laag / capaciteit-vol."},
          {"title":"Beslissen: nurture of definitief sluiten","description":"Budget te laag nu maar potentie? Naar nurture met tag. Definitief niet geschikt? Sluiten en documenteren."},
          {"title":"Noteer in FoundriOS","description":"Korte notitie: waarom afgewezen, wanneer, wat klant zei. Input voor toekomstige kwalificatieregels."}
        ]'::jsonb
      ),
      (
        'Project Intake',
        'operations',
        'Wat een klant moet aanleveren voor een goede projectstart',
        '[
          {"title":"Bevestiging akkoord","description":"Controleer of de aanbetaling binnen is. Geen start zonder aanbetaling."},
          {"title":"Projectdocumentatie ophalen","description":"Fotos van de huidige situatie, schetsen of moodboard als klant die heeft, en exacte adresgegevens."},
          {"title":"Intakevragen stellen","description":"Toegang tot de tuin: hek, code, sleutel. Vergunningplichtig? Buren informeren? Tijdvenster voor werkzaamheden."},
          {"title":"Prioriteit bepalen","description":"Wanneer moet het af? Hard deadline (huwelijk, verbouwing, verkoop) of flexibel? Pas planning aan."},
          {"title":"Schouw inplannen","description":"Bij projecten boven 5.000 euro: altijd een schouw voor start. Meten, controleren, beoordelen."},
          {"title":"Projectkaart aanmaken","description":"Alle info in FoundriOS: klant, adres, dienst, team, startdatum, materialen, bijzonderheden."}
        ]'::jsonb
      ),
      (
        'Planning & Capaciteit',
        'operations',
        'Hoe je teams plant zonder overboekingen of stilstand',
        '[
          {"title":"Weekplanning op maandag","description":"Plan de week op maandagochtend. Wie doet wat, waar, met welke materialen. Alle info naar de voorman."},
          {"title":"Regenbuffer inbouwen","description":"Plan nooit meer dan 80 procent van de beschikbare uren. De overige 20 procent is buffer voor weer, herstelwerk en spoedklussen."},
          {"title":"Spoedaanvragen beoordelen","description":"Spoed heeft een meerprijs of gaat ten koste van een ander project. Communiceer dit altijd eerlijk met beide klanten."},
          {"title":"Capaciteitslimiet bewaken","description":"Wanneer de agenda vol is: stop met nieuwe afspraken inboeken. Eerlijk zijn over wachttijden is beter dan overal half werk leveren."},
          {"title":"Capaciteit koppelen aan verkoop","description":"Als de agenda vol is: verhoog de minimale projectwaarde in de advertenties. Meer budget per project = meer marge, minder projecten nodig."}
        ]'::jsonb
      ),
      (
        'Review & Herhaalwerk',
        'admin',
        'Hoe je systematisch reviews verzamelt en herhaalwerk genereert',
        '[
          {"title":"Dag 3 na oplevering: WhatsApp review-verzoek","description":"Stuur template ''Review-verzoek WhatsApp'' binnen 3 dagen na oplevering. Dit is het moment van hoogste tevredenheid."},
          {"title":"Dag 6 zonder reactie: e-mail","description":"Nog geen reactie? Stuur de e-mail variant. Andere klanten checken e-mail vaker dan WhatsApp."},
          {"title":"Dag 10 zonder reactie: bellen","description":"Bij hoge projectwaarden: bel persoonlijk. Vraag ook direct of ze iemand kennen die interesse heeft."},
          {"title":"Review ontvangen: verwerken","description":"Sla de review op in FoundriOS. Goede reviews: gebruik in advertenties en op de website. Bedank de klant persoonlijk."},
          {"title":"Herhaalopvolging inplannen","description":"Direct na afsluiting: plan herhaalcontact op het juiste moment. Onderhoud na seizoen. Aanleg na 12 maanden. Bestrating na 24 maanden."},
          {"title":"Onderhoudscontract aanbieden","description":"Na elk aanlegproject: stuur binnen 7 dagen een aanbod voor een jaarcontract onderhoud. Doel: 30 procent conversie van aanlegklanten naar onderhoud."}
        ]'::jsonb
      )
    ) AS s(title, category, description, steps)
  LOOP
    INSERT INTO sops (tenant_id, title, category, description, steps, source, status, version)
    SELECT p_tenant_id, sop_record.title, sop_record.category, sop_record.description, sop_record.steps, 'foundri_seed', 'active', 1
    WHERE NOT EXISTS (
      SELECT 1 FROM sops WHERE tenant_id = p_tenant_id AND title = sop_record.title
    );

    IF FOUND THEN
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_extra_sops IS 'Idempotente seed van 6 extra SOPs (Kennisbibliotheek). Aanroepen vanuit onboarding flow naast seed_default_sops.';

-- Backfill bestaande tenants
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT id FROM tenants LOOP
    PERFORM seed_extra_sops(t.id);
  END LOOP;
END $$;


-- =====================================================
-- FASE 3 — TEMPLATES
-- =====================================================

INSERT INTO templates (name, type, category, description, is_default, status, content, tenant_id)
SELECT * FROM (VALUES

  -- ===== WHATSAPP — KWALIFICATIE =====
  (
    'Nieuwe aanvraag ontvangen',
    'whatsapp',
    'leads',
    'Eerste reactie binnen 60 seconden op een nieuwe aanvraag',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, dank voor je aanvraag. Ik ben {{tenant_name}}. Om goed te kunnen beoordelen of we je kunnen helpen: kun je kort omschrijven wat je wil laten doen en in welke gemeente je woont?",
      "variables": [
        {"name":"client_name","label":"Naam klant"},
        {"name":"tenant_name","label":"Jouw naam of bedrijf"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Fotos opvragen',
    'whatsapp',
    'leads',
    'Fotos van de huidige situatie opvragen voor betere inschatting',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, om goed in te schatten of we kunnen helpen: kun je 2-3 fotos sturen van de huidige situatie? Dan kan ik direct iets zinvols zeggen.",
      "variables": [
        {"name":"client_name","label":"Naam klant"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Budgetindicatie vragen',
    'whatsapp',
    'leads',
    'Budget ophalen wanneer dit ontbreekt bij de aanvraag',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, een korte vraag: heb je al een indicatie van het budget dat je voor dit project in gedachten hebt? Dat helpt mij om te beoordelen of we een goede match zijn.",
      "variables": [
        {"name":"client_name","label":"Naam klant"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Afspraak voorstellen',
    'whatsapp',
    'sales',
    'Afsprak inplannen nadat lead gekwalificeerd is',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, op basis van wat je beschrijft lijkt dit iets voor ons. Ik stel voor dat we even langskomen om de situatie te bekijken. Wanneer komt dat uit? Ik heb ruimte op {{available_dates}}.",
      "variables": [
        {"name":"client_name","label":"Naam klant"},
        {"name":"available_dates","label":"Beschikbare dagen"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Geen reactie — dag 3',
    'whatsapp',
    'leads',
    'Follow-up 3 dagen na eerste bericht zonder reactie',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, ik had je eerder een bericht gestuurd over je aanvraag voor {{project_type}}. Is er nog interesse of zijn de plannen veranderd? Laat het gerust weten.",
      "variables": [
        {"name":"client_name","label":"Naam klant"},
        {"name":"project_type","label":"Type project"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Na telefoontje follow-up',
    'whatsapp',
    'sales',
    'Samenvatting sturen direct na een telefoongesprek',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, goed gesproken. Even een korte samenvatting: {{summary}}. De volgende stap is {{next_step}}. Vragen? App me gerust.",
      "variables": [
        {"name":"client_name","label":"Naam klant"},
        {"name":"summary","label":"Samenvatting gesprek"},
        {"name":"next_step","label":"Volgende stap"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Na offerte verstuurd',
    'whatsapp',
    'sales',
    'Bevestiging direct na het versturen van een offerte',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, ik heb zojuist de offerte voor {{project_name}} naar je verstuurd. Je kunt hem bekijken via de link in de mail. Vragen of iets onduidelijk? Stuur me een berichtje.",
      "variables": [
        {"name":"client_name","label":"Naam klant"},
        {"name":"project_name","label":"Projectnaam"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Bezwaar: te duur',
    'whatsapp',
    'sales',
    'Reactie wanneer klant aangeeft dat de prijs te hoog is',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, ik snap dat. Mag ik vragen wat je verwacht te betalen? Dan kijk ik of er een oplossing is die binnen je budget past — of ik eerlijk zeg dat het niet lukt.",
      "variables": [
        {"name":"client_name","label":"Naam klant"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Bezwaar: later starten',
    'whatsapp',
    'sales',
    'Reactie wanneer klant wil wachten met starten',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, geen probleem. Wanneer zou je dan willen starten? Dan zet ik je alvast in de planning voor die periode. Zo hoef je straks niet te wachten.",
      "variables": [
        {"name":"client_name","label":"Naam klant"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Afwijzen: buiten werkgebied',
    'whatsapp',
    'leads',
    'Nette afwijzing wanneer de locatie buiten het werkgebied valt',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, bedankt voor je aanvraag. Helaas werken we op dit moment niet in {{location}} — ons werkgebied is beperkt tot {{service_area}}. Ik hoop dat je een goede hovenier vindt in jouw regio.",
      "variables": [
        {"name":"client_name","label":"Naam klant"},
        {"name":"location","label":"Locatie klant"},
        {"name":"service_area","label":"Jouw werkgebied"}
      ]
    }'::jsonb,
    NULL::uuid
  ),

  -- ===== SOP — AI SCRIPTS =====
  (
    'AI Telefoniste — inbound kwalificatie',
    'sop',
    'leads',
    'Gespreksscript voor inbound telefoongesprekken met nieuwe leads',
    true,
    'published',
    '{
      "body": "OPENING (0-30 sec)\n\"Goed om je te spreken. Je hebt {{company_name}} gebeld. Mijn naam is {{agent_name}}. Waarmee kan ik je helpen?\"\n\nLuisteren, samenvatten, niet onderbreken.\n\n---\n\nKWALIFICATIEVRAGEN (1-3 min)\nStel maximaal 4 vragen:\n1. \"Wat is de situatie in de tuin?\"\n2. \"Wat wil je veranderen of laten doen?\"\n3. \"In welke gemeente of stad woon je?\"\n4. \"Heb je al een indicatie van het budget?\"\n\n---\n\nROUTING\nScore 60+: \"Ik kijk even in de agenda of we een afspraak kunnen inplannen...\"\nScore 30-59: \"Ik vraag je om 2-3 fotos via WhatsApp te sturen zodat we het goed kunnen beoordelen.\"\nScore 0-29: \"Ik ben eerlijk: dit past niet bij wat we momenteel doen. Ik wil je geen valse hoop geven.\"\n\n---\n\nAFSLUITEN\nBij afspraak: datum en tijd bevestigen, naam en nummer noteren.\nBij follow-up: \"Je ontvangt binnen X minuten een WhatsApp van me.\"\nBij afwijzing: vriendelijk en concreet, geen valse hoop.\n\n---\n\nWAT DE AI NIET DOET\n- Geen offertebedragen noemen\n- Geen toezeggingen over startdatum\n- Bij twijfel: doorverbinden naar eigenaar",
      "variables": [
        {"name":"company_name","label":"Bedrijfsnaam"},
        {"name":"agent_name","label":"Naam van agent"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'AI Booking Agent — DM naar afspraak',
    'sop',
    'leads',
    'Conversatiescript voor het converteren van DMs en WhatsApp-berichten naar afspraken',
    true,
    'published',
    '{
      "body": "BERICHT 1 — ONTVANGST (binnen 60 sec)\n\"Hoi {{client_name}}, bedankt voor je aanvraag. Ik ben {{tenant_name}}. Even kort: om goed te beoordelen of we je kunnen helpen, heb ik een paar vragen. Is dat goed?\"\n\n---\n\nBERICHT 2 — KWALIFICATIE\nMax 3 vragen in 1 bericht:\n\"1. Wat wil je laten doen in de tuin?\"\n\"2. In welke gemeente of stad woon je?\"\n\"3. Heb je al een idee van het budget?\"\n\n---\n\nBERICHT 3 — FOTOS (indien relevant)\n\"Super, dank. Kun je ook 2-3 fotos sturen van de huidige situatie? Dan kan ik direct iets zinvols zeggen.\"\n\n---\n\nBERICHT 4 — ROUTING\nScore 60+: \"Op basis van wat je beschrijft lijkt dit iets voor ons. Wanneer kunnen we langskomen of bellen?\"\nScore 30-59: \"Ik heb de informatie ontvangen. We beoordelen je aanvraag en komen zo snel mogelijk terug.\"\nScore 0-29: Gebruik afwijstemplate.\n\n---\n\nBERICHT 5 — BEVESTIGING\n\"Top, dan plannen we {{appointment_date}} om {{appointment_time}}. Je ontvangt een bevestiging. Nog vragen? App me gerust.\"\n\n---\n\nREGELS\n- Nooit meer dan 5 berichten voor afspraak\n- Geen prijzen of offertebedragen noemen\n- Bij complexe situaties: doorsturen naar eigenaar",
      "variables": [
        {"name":"client_name","label":"Naam klant"},
        {"name":"tenant_name","label":"Jouw naam"},
        {"name":"appointment_date","label":"Datum afspraak"},
        {"name":"appointment_time","label":"Tijd afspraak"}
      ]
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Hovenier Dominantie Profiel',
    'sop',
    'onboarding',
    'Invulformulier voor het aanmaken van een compleet klantprofiel in FoundriOS',
    true,
    'published',
    '{
      "body": "BEDRIJF\nNaam: [invullen]\nWebsite: [invullen]\nWerkgebied: [plaatsen of straal in km]\nTeamgrootte: [aantal]\nCapaciteit: [max projecten per week]\nWinstgevendste diensten: [1-2 invullen]\nDiensten die we vermijden: [invullen]\nMinimale projectwaarde: [bedrag]\n\n---\n\nIDEALE AANVRAAG\nType klant: [particulier / VvE / bedrijf]\nType project: [omschrijven]\nBudgetrange: [van X tot Y]\nGoede signalen: [invullen]\nSlechte signalen: [invullen]\nAutomatisch afwijzen: [criteria]\n\n---\n\nAANBOD\nHoofdaanbod: [1 zin]\nBelofte: [invullen]\nBewijs: [reviews, projecten, jaren]\n\n---\n\nLEADFLOW\nBronnen: [invullen]\nKwalificatieregels: [invullen]\nOpvolgfrequentie: [invullen]\n\n---\n\nCOMMUNICATIE\nTone of voice: [invullen]\nWhatsApp stijl: [invullen]\nOfferte stijl: [invullen]\n\n---\n\nCAMPAGNE\nDiensten in advertenties: [invullen]\nKPI doel: [invullen]\n\n---\n\nBACKEND\nPipeline stages actief: [invullen]\nReviewflow: [invullen]\nHerhaalflow: [invullen]",
      "variables": []
    }'::jsonb,
    NULL::uuid
  ),

  -- ===== CAMPAGNE — AD COPY =====
  (
    'Creative brief — Meta Ads standaard',
    'campagne',
    'advertising',
    'Standaard invulformulier voor een Meta Ads creative brief',
    true,
    'published',
    '{
      "body": "CREATIVE BRIEF\n\nDoel: [leads genereren / bewustzijn / herhaalbezoek]\nDienst: [invullen]\nRegio: [gemeente of straal]\n\n---\n\nHOOK (eerste 3 seconden)\n[De openingszin of visual die direct de aandacht trekt]\n\nBELOFTE\n[Wat krijgt de kijker als ze reageren?]\n\nBEWIJS\n[Review, resultaat of getal dat de belofte onderbouwt]\n\nCTA\n[Wat moet de kijker doen? Bijvoorbeeld: Vraag een gratis schouw aan.]\n\n---\n\nBEELD\nType: [before/after / UGC / talking head / resultaat]\nSfeer: [donker/druk vs helder/overzichtelijk]\nLocatie: [tuin klant / eigen tuin / animatie]\n\n---\n\nUITSLUITINGEN\n[Wat willen we NIET tonen of aanspreken?]\n\nGEWENSTE LEADKWALITEIT\nMin. projectwaarde: [bedrag]\nProjecttype: [invullen]\nRegio: [invullen]",
      "variables": []
    }'::jsonb,
    NULL::uuid
  ),
  (
    'Wat kost dit — reactie template',
    'whatsapp',
    'leads',
    'Reactie op de meest gestelde vraag: wat kost het?',
    true,
    'published',
    '{
      "body": "Hoi {{client_name}}, goede vraag. De kosten hangen af van de grootte, de materialen en de situatie ter plaatse. Voor een eerste indicatie: kunnen we even bellen of langskomen? Dan kan ik je in 10 minuten een eerlijk beeld geven.",
      "variables": [
        {"name":"client_name","label":"Naam klant"}
      ]
    }'::jsonb,
    NULL::uuid
  )

) AS s(name, type, category, description, is_default, status, content, tenant_id)
WHERE NOT EXISTS (
  SELECT 1 FROM templates WHERE templates.name = s.name AND templates.tenant_id IS NULL
);
