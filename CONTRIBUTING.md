# Mitwirken

Danke für dein Interesse am Einsatzrechner! Fehlermeldungen, Verbesserungsvorschläge und Pull Requests sind willkommen.

## Fehler melden oder Ideen einbringen

- **Rechenfehler:** Bitte ein [Issue „Rechenfehler“](../../issues/new?template=rechenfehler.yml) anlegen – am besten mit dem Monat als Datei (Erfassen → Menü „…“ → *Monat als Datei (JSON)*) und dem erwarteten Wert laut echtem Lohnzettel. **Vorher persönliche Daten wie Namen entfernen.**
- **Neue Funktion:** [Issue „Funktionswunsch“](../../issues/new?template=funktionswunsch.yml) anlegen.

## Lokal entwickeln

Der Rechner besteht aus einer einzigen Datei: [`index.html`](index.html). Zum Ausprobieren genügt es, sie im Browser zu öffnen.

```bash
npm install
npm run check   # Syntax, Datenschutz, keine Emojis
npm test        # Rechen-Tests
```

## Richtlinien

- **Eine Datei, keine Abhängigkeiten:** Keine externen Skripte, Schriften oder Frameworks in `index.html`.
- **Rechenwerte mit Quelle:** Neue oder geänderte gesetzliche Werte (SV, Lohnsteuer, Taggeld …) bitte mit Quelle im Pull Request angeben und im Objekt `WERTE` (je Steuerjahr) bzw. `TAGGELD_FREI` pflegen.
- **Tests:** Änderungen an der Berechnung brauchen einen passenden Test in [`tests/rechnung.test.mjs`](tests/rechnung.test.mjs). Ändern sich Werte 2026 bewusst, die Referenzwerte in `tests/fixtures/referenz-v1.json` anpassen.
- **Design:** nach dem PRH Design Kit – nur `--pr-`-Farbwerte, Dunkelrot als einziger Akzent, Hell- und Dunkelmodus prüfen, keine Emojis.
- **Datenschutz:** Der Block `embedded-settings` in `index.html` muss im Repository immer `{}` bleiben.
- **Changelog:** Nennenswerte Änderungen unter *Unreleased* in [`CHANGELOG.md`](CHANGELOG.md) eintragen.
- **Bibliotheken:** Tesseract.js und PDF.js liegen in `vendor/`. Version in `package.json` ändern, `npm install` und `npm run vendor` ausführen, `vendor/` mitcommitten.
- **Lohnzettel-Zuordnung:** Regeln in `lohnzettel/konfiguration.mjs` nur anhand echter, geschwärzter Lohnzettel ändern – keine Bezeichnungen oder Koordinaten erfinden. Jede Änderung braucht einen Test in `tests/lohnzettel.test.mjs`.
- **Release:** Version in `index.html` (`APP_VERSION`) und `package.json` erhöhen, Abschnitt in `CHANGELOG.md` anlegen, dann Tag `vX.Y.Z` pushen oder unter *Actions → Release → Run workflow* starten – der Workflow erstellt das Release mit `einsatzrechner.html`.
