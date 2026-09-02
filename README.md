# RITS Test & Architecture Graph Workbench (Backend API)

Enterprise platforma pre moderné testovanie, riadenie testovacích behov, exekúciu krokov v reálnom čase, meranie SLA/bottleneckov, inteligentný import z Excelu a prepojenie testov s architektúrnym grafom systémov a rozhraní.

---

## 🏗️ Architektúra Systému

- **Framework**: NestJS 11 (TypeScript, Express)
- **Databáza**: PostgreSQL 16 (Master perzistentné úložisko s Prisma ORM)
- **Real-time & Zámky**: Redis 7 + WebSockets (Socket.io)
- **Úložisko súborov**: MinIO (S3-kompatibilné úložisko pre screenshoty a importy)
- **E-mail / Notifikácie**: Nodemailer (Mailpit v dev, Outlook v prod) + MS Teams Webhooky
- **Dokumentácia API**: Swagger / OpenAPI 3.0

---

## 🚀 Rýchle Spustenie cez Docker Compose

Stack spustí kompletné prostredie (API, PostgreSQL, Redis, MinIO, Mailpit):

```bash
# 1. Spustenie kontajnerov na pozadí
docker compose up -d

# 2. Spustenie migrácie databázy a naplnenie počiatočnými dátami (Seed)
docker compose exec api npm run prisma:deploy
docker compose exec api npm run prisma:seed
```

### Dostupné Služby a Porty:
- **Backend API**: `http://localhost:4000`
- **Swagger API Dokumentácia**: `http://localhost:4000/api/docs`
- **MinIO Console**: `http://localhost:9001` (user: `minio_admin`, pass: `minio_secure_pass`)
- **Mailpit Webmail**: `http://localhost:8025` (prehliadanie odoslaných notifikačných e-mailov)
- **PostgreSQL**: `localhost:5432` (`rits_workbench`)
- **Redis**: `localhost:6379`

---

## 🔑 Predvolené Používateľské Kontá (Seed Dát)

| Meno | Email | Heslo | Rola |
|---|---|---|---|
| **System Administrator** | `admin@rits-workbench.local` | `AdminPassword123!` | `ADMIN` |
| **Elena Vargová** | `lead@rits-workbench.local` | `AdminPassword123!` | `TEST_LEAD` |
| **Peter Kováč** | `peter.kovac@rits-workbench.local` | `TesterPassword123!` | `TESTER` |
| **Martina Horváthová** | `business@rits-workbench.local` | `TesterPassword123!` | `BUSINESS_REVIEWER` |

---

## 📦 Kľúčové Moduly

1. **Autentifikácia & RBAC (`/auth`, `/users`)**:
   - Bezpečné JWT tokeny s bcrypt hashovaním.
   - Role-Based Access Control (`ADMIN`, `TEST_LEAD`, `TESTER`, `BUSINESS_REVIEWER`, `VIEWER`).
2. **Projekty, Epicy a Sady (`/projects`)**:
   - Hierarchická štruktúra zložiek (Test Suites).
   - Členenie do biznisových a integračných Epicov.
3. **Testovacie Scenáre a Kroky (`/projects/:id/test-cases`)**:
   - Detailné kroky s akciou, očakávaným výsledkom a testovacími dátami.
   - Prepojenie na grafové uzly (systémy, rozhrania).
4. **Testovacie Behy a Exekúcia (`/test-runs`)**:
   - Spúšťanie behov pre prostredia (DEV, STAGING, PROD).
   - Priraďovanie jednotlivých krokov testerom.
   - Real-time rollup stavov (PASSED, FAILED, BLOCKED, SKIPPED).
5. **Časovače a Bottleneck SLA (`/timers`)**:
   - Meranie presného času testera na konkrétnom kroku.
   - Admin report: Kto ako dlho robí, na koho sa čaká a zoznam blokovaných krokov.
6. **Prílohy a Screenshoty (`/attachments`)**:
   - Priamy upload screenshotov chýb do MinIO/S3.
   - Automatická aktualizácia času a zodpovednej osoby pri pridaní dôkazu.
7. **Komentáre a @Mentions (`/comments`)**:
   - Komentovanie krokov s podporou `@meno` a automatickým odosielaním upozornení.
8. **Hlásenie Chýb (`/bugs`)**:
   - One-Click vytvorenie defektu priamo z kroku testu.
9. **Excel Import Workbench (`/excel-import`)**:
   - 3-krokový import starých Excelov: Nahratie súboru ➔ Heuristická detekcia stĺpcov ➔ Vizuálny náhľad ➔ Zápis do DB.
10. **Notifikácie & Integrácie (`/notifications`)**:
    - E-mailové notifikácie o pridelení kroku.
    - MS Teams Actionable Card správy.
11. **Real-time Synchronizácia & Zámky (`/realtime`, WebSockets)**:
    - Zamedzenie prepísania kroku dvoma testermi naraz cez Redis lock.
12. **Architektúrny Graf a Pathfinding (`/graph`)**:
    - BFS vyhľadávanie ciest (napr. `DOMS -> SAP PO -> SAP CAR`).
    - Regresná analýza dopadu zmien na testy.
