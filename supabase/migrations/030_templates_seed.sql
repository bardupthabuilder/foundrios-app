-- Migration 030: Seed standaard templates met variabelen
-- Alle system templates (tenant_id = NULL) zichtbaar voor elke tenant.

INSERT INTO templates (name, type, category, description, is_default, status, content, tenant_id)
SELECT * FROM (VALUES
  -- ===== EMAIL =====
  (
    'Welkom na akkoord',
    'email',
    'onboarding',
    'Direct na ondertekening offerte versturen',
    true,
    'published',
    '{
      "subject": "Welkom — we gaan voor je aan de slag, {{client_name}}",
      "body": "Hé {{client_name}},\n\nFijn dat we voor je aan de slag mogen.\n\nWat nu:\n• Aanbetalingsfactuur volgt vandaag\n• Startdatum bevestig ik morgen\n• Ik blijf je op de hoogte houden via WhatsApp\n\nMocht je tussendoor vragen hebben — bel of app me direct.\n\nGroet,\n{{tenant_name}}",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"tenant_name","label":"Jouw bedrijfsnaam"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Offerte verstuurd',
    'email',
    'sales',
    'Begeleidende mail bij offerte met acceptlink',
    true,
    'published',
    '{
      "subject": "Offerte {{quote_number}} — {{project_name}}",
      "body": "Hé {{client_name}},\n\nHierbij de offerte voor {{project_name}}.\n\nJe kunt de offerte hier bekijken en direct akkoord geven:\n{{quote_url}}\n\nDe offerte is geldig tot {{valid_until}}.\n\nHeb je vragen of wil je iets aanpassen? Laat het me weten.\n\nGroet,\n{{tenant_name}}",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"quote_number","label":"Offertenummer"},
        {"name":"project_name","label":"Projectnaam"},
        {"name":"quote_url","label":"Acceptlink"},
        {"name":"valid_until","label":"Geldig tot"},
        {"name":"tenant_name","label":"Jouw bedrijfsnaam"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Factuur herinnering — 1',
    'email',
    'finance',
    'Vriendelijke herinnering 3 dagen na verloopdatum',
    true,
    'published',
    '{
      "subject": "Factuur {{invoice_number}} — vriendelijke herinnering",
      "body": "Hé {{client_name}},\n\nKleine herinnering: factuur {{invoice_number}} van {{invoice_amount}} is verlopen sinds {{due_date}}.\n\nMisschien is hij in de drukte over het hoofd gezien — geen probleem. Kun je hem op korte termijn betalen?\n\nGroet,\n{{tenant_name}}",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"invoice_number","label":"Factuurnummer"},
        {"name":"invoice_amount","label":"Bedrag"},
        {"name":"due_date","label":"Vervaldatum"},
        {"name":"tenant_name","label":"Jouw bedrijfsnaam"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Factuur herinnering — 2',
    'email',
    'finance',
    'Tweede herinnering, 10 dagen na verloop',
    true,
    'published',
    '{
      "subject": "Factuur {{invoice_number}} — tweede herinnering",
      "body": "Hé {{client_name}},\n\nFactuur {{invoice_number}} van {{invoice_amount}} staat nog open sinds {{due_date}}.\n\nKan je laten weten wanneer betaling volgt? Lopen er problemen? Bel me dan even.\n\n{{tenant_name}}",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"invoice_number","label":"Factuurnummer"},
        {"name":"invoice_amount","label":"Bedrag"},
        {"name":"due_date","label":"Vervaldatum"},
        {"name":"tenant_name","label":"Jouw bedrijfsnaam"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Factuur herinnering — 3',
    'email',
    'finance',
    'Laatste herinnering voor aanmaning',
    true,
    'published',
    '{
      "subject": "Factuur {{invoice_number}} — laatste herinnering",
      "body": "Hé {{client_name}},\n\nDit is mijn laatste herinnering voor factuur {{invoice_number}} ({{invoice_amount}}).\n\nVoldoe deze binnen 7 dagen, anders geef ik de vordering uit handen.\n\nLiever even bellen om afspraken te maken? Dat kan altijd.\n\n{{tenant_name}}",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"invoice_number","label":"Factuurnummer"},
        {"name":"invoice_amount","label":"Bedrag"},
        {"name":"tenant_name","label":"Jouw bedrijfsnaam"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Review-verzoek',
    'email',
    'retention',
    '3 dagen na oplevering — vraag Google review',
    true,
    'published',
    '{
      "subject": "Hoe was het, {{client_name}}?",
      "body": "Hé {{client_name}},\n\nFijn dat we voor je hebben mogen werken aan {{project_name}}.\n\nMag ik je een kleine gunst vragen? Een korte Google review helpt me enorm — andere klanten kijken er namelijk naar voor ze kiezen.\n\n{{review_url}}\n\nKost je 30 seconden. Dank.\n\n{{tenant_name}}",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"project_name","label":"Projectnaam"},
        {"name":"review_url","label":"Google review link"},
        {"name":"tenant_name","label":"Jouw bedrijfsnaam"}
      ]
    }'::jsonb,
    NULL
  ),

  -- ===== WHATSAPP =====
  (
    'Eerste reactie (<5 min)',
    'whatsapp',
    'leads',
    'Reageer binnen 5 minuten op een nieuwe lead',
    true,
    'published',
    '{
      "body": "Hé {{client_name}}, dank voor je aanvraag voor {{project_name}}. Ik ben {{tenant_name}} — wanneer schikt het kort te bellen vandaag of morgen? Dan kunnen we direct kijken wat er nodig is.",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"project_name","label":"Projectnaam"},
        {"name":"tenant_name","label":"Jouw naam/bedrijf"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Afspraak bevestiging',
    'whatsapp',
    'sales',
    'Direct na boeking afspraak',
    true,
    'published',
    '{
      "body": "Hé {{client_name}}, bevestiging: we spreken {{appointment_date}} om {{appointment_time}} op {{project_address}}. Heb je vragen vooraf? App me gerust. — {{tenant_name}}",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"appointment_date","label":"Datum"},
        {"name":"appointment_time","label":"Tijd"},
        {"name":"project_address","label":"Adres"},
        {"name":"tenant_name","label":"Jouw bedrijfsnaam"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Herinnering 24u',
    'whatsapp',
    'sales',
    '24 uur voor afspraak met curiosity hook',
    true,
    'published',
    '{
      "body": "Hé {{client_name}}, morgen {{appointment_time}} spreken we. Ik heb alvast naar de situatie gekeken en heb een paar ideeën die ik je wil laten zien. Tot morgen!",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"appointment_time","label":"Tijd"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'No-show recovery',
    'whatsapp',
    'sales',
    'Na gemiste afspraak',
    true,
    'published',
    '{
      "body": "Hé {{client_name}}, we hadden {{appointment_time}} gepland — ik denk dat we elkaar gemist hebben. Is alles goed? Laat me weten als je wil herplannen.",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"appointment_time","label":"Tijd"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Offerte opvolging dag 2',
    'whatsapp',
    'sales',
    'Korte check 2 dagen na verzenden offerte',
    true,
    'published',
    '{
      "body": "Hé {{client_name}}, offerte voor {{project_name}} goed ontvangen? Vragen? App me gerust. Hier kun je hem direct accepteren: {{quote_url}}",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"project_name","label":"Projectnaam"},
        {"name":"quote_url","label":"Acceptlink"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Onderhoud reminder',
    'whatsapp',
    'retention',
    'Onderhoudsbeurt staat gepland',
    true,
    'published',
    '{
      "body": "Hé {{client_name}}, volgende week is je onderhoudsbeurt voor {{project_name}} ingepland op {{maintenance_date}}. Schikt dat nog?",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"project_name","label":"Projectnaam"},
        {"name":"maintenance_date","label":"Onderhoudsdatum"}
      ]
    }'::jsonb,
    NULL
  ),

  -- ===== CONTENT (LinkedIn / Facebook posts) =====
  (
    'Voor/na transformatie',
    'content',
    'social',
    'LinkedIn/Facebook post bij oplevering',
    true,
    'published',
    '{
      "body": "Voor → na.\n\nKlant in {{project_city}} wilde een tuin waar het hele gezin van geniet. Resultaat: terras, beplanting, verlichting — klaar in {{project_duration}}.\n\nMooi om te zien hoe één goed plan een complete buitenruimte transformeert.\n\n📍 {{project_city}}",
      "variables": [
        {"name":"project_city","label":"Plaats"},
        {"name":"project_duration","label":"Doorlooptijd (bijv. 3 weken)"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Hook: drukke vakman',
    'content',
    'social',
    'Pijn-haakje voor drukke ondernemers',
    true,
    'published',
    '{
      "body": "Veel hoveniersbedrijven die ik spreek lopen tegen hetzelfde aan:\n\n• Aanvragen komen binnen, maar je hebt geen tijd om ze op te volgen\n• Offertes blijven open staan want je bent op locatie\n• Klanten vragen wéér wanneer je komt\n\nHerkenbaar?\n\nEr is een betere manier.",
      "variables": []
    }'::jsonb,
    NULL
  ),
  (
    'Hook: case study',
    'content',
    'social',
    'Resultaat-gedreven post',
    true,
    'published',
    '{
      "body": "{{client_company}} ging van {{before_metric}} naar {{after_metric}} in {{timeframe}}.\n\nWat we deden:\n• {{action_1}}\n• {{action_2}}\n• {{action_3}}\n\nNiet magisch. Gewoon systeem.",
      "variables": [
        {"name":"client_company","label":"Bedrijfsnaam klant"},
        {"name":"before_metric","label":"Beginpunt"},
        {"name":"after_metric","label":"Eindpunt"},
        {"name":"timeframe","label":"Tijdsbestek"},
        {"name":"action_1","label":"Actie 1"},
        {"name":"action_2","label":"Actie 2"},
        {"name":"action_3","label":"Actie 3"}
      ]
    }'::jsonb,
    NULL
  ),

  -- ===== REELS / SCRIPTS =====
  (
    'Reel: dagstart op locatie',
    'reel',
    'social',
    '15-30 seconden script — dagstart in de bus',
    true,
    'published',
    '{
      "body": "[HOOK 0-3s] \"Vandaag rij ik naar {{project_city}} voor {{project_name}}.\"\n\n[SCENE 3-12s] In de bus, materialen tonen: \"In de bus: {{materials_summary}}.\"\n\n[BODY 12-22s] \"De uitdaging hier is {{challenge}}. Onze aanpak: {{approach}}.\"\n\n[CTA 22-28s] \"Volg mee — morgen laat ik de oplevering zien.\"",
      "variables": [
        {"name":"project_city","label":"Plaats"},
        {"name":"project_name","label":"Projectnaam"},
        {"name":"materials_summary","label":"Materialen samenvatting"},
        {"name":"challenge","label":"Uitdaging"},
        {"name":"approach","label":"Aanpak"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Reel: voor/na',
    'reel',
    'social',
    'Transformatie reel',
    true,
    'published',
    '{
      "body": "[HOOK 0-3s] \"Zo zag deze tuin er 3 weken geleden uit.\"\n\n[SCENE 3-8s] Voor-beeld, statisch. Voice-over: \"{{before_description}}\"\n\n[BUILD 8-18s] Snelle montage werk-fragmenten met muziek.\n\n[REVEAL 18-25s] Na-beeld, langzaam in. \"Dit is dezelfde tuin, vandaag.\"\n\n[CTA 25-30s] \"Wil je hetzelfde? Link in bio.\"",
      "variables": [
        {"name":"before_description","label":"Beschrijving voor-situatie"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Reel: klant interview',
    'reel',
    'social',
    'Testimonial met klantvraag',
    true,
    'published',
    '{
      "body": "[VRAAG 1] Wat was je grootste zorg vooraf?\n[VRAAG 2] Wat verraste je positief?\n[VRAAG 3] Wat zou je tegen iemand zeggen die twijfelt?\n\nTip: filmen in liggend, klant zit, neutrale achtergrond, telefoon stil.",
      "variables": []
    }'::jsonb,
    NULL
  ),

  -- ===== OFFERTE / WERKBON content =====
  (
    'Offerte standaard tekst',
    'offerte',
    'sales',
    'Inleidende tekst boven aan offerte',
    true,
    'published',
    '{
      "body": "Hé {{client_name}},\n\nDank voor je interesse. Hierbij de offerte voor {{project_name}} op {{project_address}}.\n\nDe offerte is geldig tot {{valid_until}}. Daarna komt er een herziening met actuele materiaalprijzen.\n\nVragen of aanpassingen? Bel of app me direct.\n\n{{tenant_name}}",
      "variables": [
        {"name":"client_name","label":"Klantnaam"},
        {"name":"project_name","label":"Projectnaam"},
        {"name":"project_address","label":"Adres"},
        {"name":"valid_until","label":"Geldig tot"},
        {"name":"tenant_name","label":"Jouw bedrijfsnaam"}
      ]
    }'::jsonb,
    NULL
  ),
  (
    'Werkbon kop',
    'werkbon',
    'operations',
    'Standaard tekst werkbon',
    true,
    'published',
    '{
      "body": "Werkbon — {{project_name}}\nKlant: {{client_name}}\nAdres: {{project_address}}\nDatum: {{work_date}}\n\nUitgevoerd door: {{worker_name}}\n\nWerkzaamheden:\n{{work_description}}\n\nGebruikt materiaal:\n{{materials}}\n\nGewerkte uren: {{hours}}\n\nKlant akkoord (handtekening):",
      "variables": [
        {"name":"project_name","label":"Projectnaam"},
        {"name":"client_name","label":"Klantnaam"},
        {"name":"project_address","label":"Adres"},
        {"name":"work_date","label":"Datum"},
        {"name":"worker_name","label":"Uitvoerder"},
        {"name":"work_description","label":"Werkomschrijving"},
        {"name":"materials","label":"Materialen"},
        {"name":"hours","label":"Uren"}
      ]
    }'::jsonb,
    NULL
  )
) AS s(name, type, category, description, is_default, status, content, tenant_id)
WHERE NOT EXISTS (
  SELECT 1 FROM templates WHERE templates.name = s.name AND templates.tenant_id IS NULL
);
