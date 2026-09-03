# 🚀 RITS QA Workbench - Aktuálny Stav & Architektúra

Posledná aktualizácia: **03. 09. 2026**

## 1. Prehľad Prostredia a Bezpečnosti
- **Produkčný Server:** `82.38.65.67` (HOSTKEY VPS)
- **SSH Bezpečnosť:** Iba ED25519 kryptovaný kľúč (`gallytimotej@gmail.com`). Heslové prihlásenie je zakázané. Fail2ban a UFW firewall sú aktívne.
- **Docker Bezpečnosť:** Kontajnery bežia pod neprivilegovaným používateľom `USER node` (UID 1000) s `no-new-privileges:true` a CPU limitom `0.6` / `0.8`.
- **Projekt Untold hry & FirstAid:** Bežia v plnom zdraví (HTTP 200 OK na `https://projectuntold.eu`, `https://api.projectuntold.eu` a port `3002`).

## 2. Kľúčové Moduly Platformy
1. **Ochranný Auth Múr (`AuthGuard`):** Neprihlásení používatelia sú smerovaní výhradne na prihlásenie a registráciu.
2. **Registrácia a Schvaľovanie:** Podpora pre **Slovnaft ID / Číslo karty**, telefónne číslo a schvaľovanie administrátorom v `/admin/users`.
3. **Povinná Fotografia (Proof Required):** Admin prepínač na testovacích krokoch, blokovanie stavu `PASSED` bez fotky a podpora `Ctrl+V` priameho vkladania screenshotov zo schránky do lokálneho MinIO S3 úložiska.
4. **Confluence Dokumentácia (`/docs`):** Neobmedzený strom stránok, Word/Markdown editor, Callout boxy a podpora interaktívnych **Mermaid UML diagramov** (sekvenčné diagramy, vývojové diagramy, stavové automaty).
5. **Rozšírené UI (75% Šírka):** Plátno rozšírené na `max-w-[1680px]` a moderné sub-groupované menu v navigácii.
6. **Dashboard s Rozpadom Epicov:** Prehľad projektov, epicov (WET, POS, SSR, SAP) a percentuálny rozpad úspešnosti.

## 3. Prístupové Porty
- Frontend Web: `http://82.38.65.67:3005`
- Backend API & Swagger: `http://82.38.65.67:4000/api/docs`
- MinIO S3 Konzola: `http://82.38.65.67:9011`
