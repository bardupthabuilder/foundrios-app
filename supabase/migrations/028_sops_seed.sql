-- Migration 028: SOPs seed function + backfill bestaande tenants
-- Idempotente functie die 10 standaard SOPs aanmaakt per tenant indien nog niet aanwezig.

CREATE OR REPLACE FUNCTION seed_default_sops(p_tenant_id uuid) RETURNS integer AS $$
DECLARE
  inserted_count integer := 0;
  sop_record record;
BEGIN
  FOR sop_record IN
    SELECT * FROM (VALUES
      (
        'Klant onboarding',
        'operations',
        'Stappen na akkoord op offerte tot start uitvoering',
        '[
          {"title":"Akkoord bevestigen","description":"Stuur klant binnen 1u bevestiging van akkoord via WhatsApp/mail."},
          {"title":"Aanbetalingsfactuur sturen","description":"Verstuur aanbetalingsfactuur (25%) zelfde dag."},
          {"title":"Start-datum inplannen","description":"Plan in agenda en deel met klant + voorman."},
          {"title":"Materialen bestellen","description":"Loop materiaallijst door, plaats bestelling bij leverancier."},
          {"title":"Project aanmaken in FoundriOS","description":"Koppel klant, offerte, voorman, planning."},
          {"title":"Voorman briefen","description":"Stuur projectdetails + adres + bijzonderheden naar voorman."}
        ]'::jsonb
      ),
      (
        'Project oplevering',
        'operations',
        'Laatste check voor afsluiten en eindfactuur',
        '[
          {"title":"Eindcheck ter plaatse","description":"Voorman doorloopt eindchecklist (zie SOP Eindcheck werk)."},
          {"title":"Klant rondleiding","description":"Loop het werk met de klant door — vraag akkoord per onderdeel."},
          {"title":"Opleverformulier laten tekenen","description":"Klant tekent voor akkoord. Maak foto van getekend formulier."},
          {"title":"Eindfactuur opmaken","description":"Maak eindfactuur in FoundriOS — koppel aan project."},
          {"title":"Review-verzoek inplannen","description":"Stuur na 3 dagen reviewverzoek (template: review-request)."},
          {"title":"Onderhoudscontract aanbieden","description":"Bij geschikte projecten: stuur voorstel onderhoud."}
        ]'::jsonb
      ),
      (
        'Materialen bestellen',
        'operations',
        'Bestelproces zodat niets vergeten wordt of dubbel besteld',
        '[
          {"title":"Materiaallijst uit offerte halen","description":"Open offerte, exporteer materiaallijst."},
          {"title":"Voorraad checken","description":"Loop magazijn na — wat is al aanwezig?"},
          {"title":"Bestelling plaatsen","description":"Plaats bij vaste leverancier. Vraag leverdatum schriftelijk."},
          {"title":"Leverdatum in agenda","description":"Zet leverdatum + locatie in planning."},
          {"title":"Bevestiging klant","description":"Bij langere levertijd: stel klant op de hoogte van start-datum."}
        ]'::jsonb
      ),
      (
        'Klacht behandelen',
        'sales',
        'Vaste werkwijze om klacht om te zetten naar tevreden klant',
        '[
          {"title":"Binnen 1 uur bellen","description":"Geen mail, geen WhatsApp — gewoon bellen."},
          {"title":"Luisteren zonder verdediging","description":"Laat klant volledig uitspreken. Schrijf mee."},
          {"title":"Direct herstel afspreken","description":"Plan binnen 48u een afspraak om ter plaatse te kijken."},
          {"title":"Oplossing bevestigen via mail","description":"Schriftelijk wat is afgesproken, met datum."},
          {"title":"Uitvoeren + nabellen","description":"Uitvoeren binnen afgesproken termijn. Bel binnen 3 dagen na herstel."}
        ]'::jsonb
      ),
      (
        'Veiligheid op locatie',
        'field_work',
        'Verplichte checks voor elk project waarbij iemand op locatie werkt',
        '[
          {"title":"PBM dragen","description":"Veiligheidsschoenen, gehoorbescherming bij machines, handschoenen bij stenen."},
          {"title":"Werkterrein afzetten","description":"Bij openbaar gebied: hekken/lint. Bij hellingen: markering."},
          {"title":"Machinecheck","description":"Olie, brandstof, snijgereedschap. Geen losse onderdelen."},
          {"title":"EHBO-kit aanwezig","description":"Check in busje voor vertrek."},
          {"title":"Bij incident: direct melden","description":"Bel Bart/voorman, foto van situatie, geen verklaringen tegen derden."}
        ]'::jsonb
      ),
      (
        'Dagstart',
        'field_work',
        'Routine voor elke werkdag — voorkomt vergeten en miscommunicatie',
        '[
          {"title":"06:30 Briefing voorman","description":"Wat doen we vandaag, wie waar, welke materialen."},
          {"title":"06:45 Bus laden","description":"Materialen + gereedschap volgens lijst van gisteravond."},
          {"title":"07:00 Vertrek naar locatie","description":"Voor lange ritten: rekening houden met file."},
          {"title":"07:30 Aankomst en uitleg","description":"Bij klant: aanmelden, korte uitleg dagplan."},
          {"title":"Werk starten","description":"Volg projectplan. Bij twijfel: bellen, niet gokken."}
        ]'::jsonb
      ),
      (
        'Eindcheck werk',
        'field_work',
        'Voor de bus terug naar de zaak rijdt',
        '[
          {"title":"Werk visueel checken","description":"Voldoet het aan de offerte? Foto maken van eindresultaat."},
          {"title":"Werkterrein opruimen","description":"Geen afval, geen losse materialen. Bezem erover."},
          {"title":"Gereedschap inladen","description":"Tel mee — niets achterlaten."},
          {"title":"Klant informeren","description":"Korte update naar klant: \"Klaar voor vandaag, morgen verder met X\"."},
          {"title":"Uren noteren","description":"Voer uren + materiaalverbruik in FoundriOS in vóór huiswaarts."}
        ]'::jsonb
      ),
      (
        'Factuur opmaak',
        'admin',
        'Hoe een factuur correct wordt opgemaakt en verzonden',
        '[
          {"title":"Open project in FoundriOS","description":"Ga naar Projecten → kies project."},
          {"title":"Klik \"Factuur maken\"","description":"Vanuit project of offerte. Vul alleen wijzigingen aan."},
          {"title":"Controleer BTW + IBAN","description":"21% standaard. IBAN moet kloppen — anders trekken klanten zich terug."},
          {"title":"Betaaltermijn checken","description":"Standaard 14 dagen. Pas alleen aan met goede reden."},
          {"title":"Verstuur + log","description":"Versturen via FoundriOS. Status auto naar \"verstuurd\"."}
        ]'::jsonb
      ),
      (
        'Opvolgen offerte',
        'sales',
        'Niet wachten — actief opvolgen van verzonden offertes',
        '[
          {"title":"Dag 2: korte check via WhatsApp","description":"\"Hé [naam], offerte ontvangen? Vragen?\""},
          {"title":"Dag 5: bellen","description":"Persoonlijk gesprek. Vraag wat er nog ontbreekt."},
          {"title":"Dag 7: laatste herinnering","description":"WhatsApp + verwijs naar acceptlink. Noem deadline."},
          {"title":"Bij \"nee\": reden noteren","description":"In FoundriOS bij lead — input voor toekomstige offertes."}
        ]'::jsonb
      ),
      (
        'No-show recovery',
        'sales',
        'Wanneer een afspraak niet doorgaat — terugwinnen, niet afschrijven',
        '[
          {"title":"Wacht 10 minuten","description":"Soms is het verkeer of vergeten — geen direct paniek."},
          {"title":"Bel direct","description":"Niet WhatsApp eerst — bel. Vriendelijke toon."},
          {"title":"Bij geen gehoor: WhatsApp","description":"\"We hadden [tijd] gepland. Alles goed? Laat weten als je wil herplannen.\""},
          {"title":"Max 1x herplannen","description":"Bij 2e no-show: lead naar warm monitoring. Niet blijven achtervolgen."},
          {"title":"Patroon analyseren","description":"Veel no-shows op bepaalde dag/tijd? Pas planning aan."}
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

COMMENT ON FUNCTION seed_default_sops IS 'Idempotente seed van 10 standaard SOPs. Aanroepen vanuit onboarding flow.';

-- Backfill bestaande tenants
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT id FROM tenants LOOP
    PERFORM seed_default_sops(t.id);
  END LOOP;
END $$;
