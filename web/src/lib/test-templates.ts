export interface TestTemplate {
  id: string;
  category: 'HARDWARE' | 'SOFTWARE' | 'FISCAL' | 'SAP' | 'STATION' | 'PAYMENT';
  nameSk: string;
  nameEn: string;
  descriptionSk: string;
  descriptionEn: string;
  actionSk: string;
  actionEn: string;
  expectedResultSk: string;
  expectedResultEn: string;
  payloadTemplate: string;
  confluenceDescriptionSk: string;
  confluenceDescriptionEn: string;
}

export const TEST_TEMPLATES: TestTemplate[] = [
  {
    id: 'hw-pos-failure',
    category: 'HARDWARE',
    nameSk: '🔧 Hardvérová chyba POS / Terminálu',
    nameEn: '🔧 POS Hardware / Terminal Failure',
    descriptionSk: 'Šablóna pre zlyhanie fyzických periférií, pokladnice, displeja alebo napájania.',
    descriptionEn: 'Template for peripheral, register, customer display or power issues.',
    actionSk: '1. Vizuálna kontrola zapojenia káblov (COM/USB/Ethernet) a napájania 24V.\n2. Overenie stavu napájacieho zdroja UPS.\n3. Reštart hardvérového klientského modulu (HW Agent).\n4. Kontrola chybových kódov na servisnom displeji.',
    actionEn: '1. Visual inspection of cabling (COM/USB/Ethernet) and 24V power.\n2. Verify UPS power unit status.\n3. Restart hardware client module (HW Agent).\n4. Check error codes on technician service display.',
    expectedResultSk: 'Zariadenie detegované v systéme Windows POS so zeleným indikátorom v stave READY. Chybový kód odstránený.',
    expectedResultEn: 'Device detected in Windows POS with green READY indicator. Error code cleared.',
    payloadTemplate: JSON.stringify(
      {
        hardwareType: 'POS_TERMINAL',
        model: 'Diebold Nixdorf Beetle / A10',
        serialNumber: 'SN-POS-849102-BA',
        comPort: 'COM3',
        baudRate: 9600,
        firmwareVersion: 'v4.18.2-prod',
        powerSupplyStatus: 'OK_MAINS',
      },
      null,
      2
    ),
    confluenceDescriptionSk: `### 🔧 Hardvérová Kontrola POS Terminálu
| Parameter | Požadovaná hodnota |
| :--- | :--- |
| **Model** | Diebold Nixdorf Beetle A10 |
| **Rozhranie** | RS-232 / USB 3.0 |
| **Napájanie** | 24V DC cez dedikovaný adaptér |

#### Kontrolný zoznam (Checklist):
- [ ] Všetky COM/USB konektory sú zaistené skrutkami
- [ ] Zákaznícky displej zobrazuje úvodnú obrazovku Slovnaft
- [ ] Dotyková plocha kalibrovaná na 10 bodov
- [ ] Tlačiareň bločkov má vloženú termo pásku a senzor hlási OK`,
    confluenceDescriptionEn: `### 🔧 POS Terminal Hardware Verification
| Parameter | Expected Value |
| :--- | :--- |
| **Model** | Diebold Nixdorf Beetle A10 |
| **Interface** | RS-232 / USB 3.0 |
| **Power** | 24V DC via dedicated PSU |

#### Checklist:
- [ ] All COM/USB connectors secured with screws
- [ ] Customer display shows Slovnaft welcome screen
- [ ] Touch digitizer calibrated to 10 points
- [ ] Thermal receipt printer loaded with paper, sensor OK`,
  },
  {
    id: 'sw-pos-bug',
    category: 'SOFTWARE',
    nameSk: '💻 Softvérová chyba POS / Blokácia aplikácie',
    nameEn: '💻 Software POS Bug / Application Freeze',
    descriptionSk: 'Šablóna pre zlyhanie aplikačnej logiky pokladne, výnimky a deadlocky.',
    descriptionEn: 'Template for POS app crashes, unhandled exceptions and freezes.',
    actionSk: '1. Spustenie pokladničnej aplikácie v predajnom režime.\n2. Pridanie položky do košíka a aplikácia zľavovej karty Slovnaft Move.\n3. Pokus o storno položky a prechod do platobného dialógu.\n4. Zaznamenanie zlyhania aplikácie a zber crashdump logov.',
    actionEn: '1. Launch POS application in sales mode.\n2. Add item to cart and swipe Slovnaft Move loyalty card.\n3. Attempt line void and proceed to tender dialog.\n4. Capture crash/freeze and gather client crashdump logs.',
    expectedResultSk: 'Aplikácia bez zamrznutia prepočíta zľavu, umožní korektné storno a odošle transakciu do databázy bez chybového dialógu.',
    expectedResultEn: 'Application recalculates discount without freezing, executes line void, and persists transaction to DB.',
    payloadTemplate: JSON.stringify(
      {
        transactionType: 'SALE_VOID_RETRY',
        cartItems: [
          { sku: 'SKU_COFFEE_ESPRESSO', qty: 1, price: 1.99 },
          { sku: 'SKU_FUEL_EVO_95', litres: 35.4, pricePerLitre: 1.629 },
        ],
        loyaltyCard: '9820010099882211',
        currency: 'EUR',
        crashException: 'NullReferenceException at PosSaleEngine.RecalculatePromotions()',
      },
      null,
      2
    ),
    confluenceDescriptionSk: `### 💻 Softvérová Chyba Aplikácie POS
- **Verzia SW**: RITS POS Client v6.1.4
- **Komponent**: Promo Engine & Storno manažér
- **Chybový stav**: Neošetrená výnimka pri kombinácii zľavy a storna

#### Postup reprodukcie:
1. Zoskenovať tovar z predajne
2. Načítať zákaznícku kartu
3. Vybrať riadok a stlačiť tlačidlo **STORNO RIADKU**
4. Zlyhanie: Dialóg zamrzne na 45 sekúnd s chybou spojenia`,
    confluenceDescriptionEn: `### 💻 Software POS Application Defect
- **SW Version**: RITS POS Client v6.1.4
- **Component**: Promotion Engine & Void Manager
- **Defect State**: Unhandled exception on discount combined with line void

#### Reproduction Steps:
1. Scan shop item
2. Swipe loyalty card
3. Select line and click **VOID LINE**
4. Failure: UI hangs for 45s with connection timeout error`,
  },
  {
    id: 'fuel-doms-dispenser',
    category: 'STATION',
    nameSk: '⛽ Fyzický test výdajného stojanu & DOMS 5000',
    nameEn: '⛽ Fuel Dispenser & DOMS 5000 Physical Test',
    descriptionSk: 'Šablóna pre tankovanie, zvesenie pištole, autorizáciu čerpadla a núdzový stop.',
    descriptionEn: 'Template for fueling, nozzle lift, pump authorization and emergency stop.',
    actionSk: '1. Zvesenie tankovacej pištole EVO 95 na stojane č. 3.\n2. Overenie odoslania správy "Calling" do DOMS 5000 riadiacej jednotky.\n3. Autorizácia čerpadla z POS pokladne (predautorizácia).\n4. Odčerpanie 10 litrov paliva a zavesenie pištole.\n5. Overenie zaevidovania transakcie s presným objemom v DOMS aj na POS.',
    actionEn: '1. Lift EVO 95 fueling nozzle on dispenser #3.\n2. Verify "Calling" event received by DOMS 5000 controller.\n3. Authorize pump from POS terminal (pre-authorization).\n4. Dispense 10.00 litres and hang nozzle.\n5. Confirm transaction recorded with matching volume in both DOMS and POS.',
    expectedResultSk: 'Stojan začne čerpať až po autorizácii. Po zavesení sa transakcia uzamkne a presunie do POS fronty s presnou sumou.',
    expectedResultEn: 'Pump dispenses only after authorization. Upon hanging, transaction locks and appears on POS tender queue with identical amount.',
    payloadTemplate: JSON.stringify(
      {
        pumpNumber: 3,
        fuelGrade: 'EVO_95',
        tankId: 'TANK_01_GASOLINE',
        volumeLitres: 10.0,
        unitPrice: 1.629,
        totalAmount: 16.29,
        domsTransactionId: 'TRX_DOMS_991823',
        nozzleId: 1,
      },
      null,
      2
    ),
    confluenceDescriptionSk: `### ⛽ Fyzická Exekúcia Palivového Testu (WET)
- **Zariadenie**: Výdajný stojan Tokheim Quantium 510
- **Riadiaca jednotka**: DOMS 5000 Forecourt Controller
- **Protokol**: IFSF-LON / Doms POS Interface

#### Overované parametre:
1. Blokovanie výdaja pred autorizáciou
2. Správne priradenie nádrže v tankovom hospodárstve (Tank Gauge Veeder-Root)
3. Automatické zastavenie pri dosiahnutí predvoleného limitu`,
    confluenceDescriptionEn: `### ⛽ Physical Fuel Test Execution (WET)
- **Hardware**: Tokheim Quantium 510 Dispenser
- **Controller**: DOMS 5000 Forecourt Controller
- **Protocol**: IFSF-LON / Doms POS Interface

#### Verification Scope:
1. Dispense lock prior to authorization
2. Correct tank assignment in ATG system (Veeder-Root gauge)
3. Automatic cutoff upon reaching preset volume`,
  },
  {
    id: 'fiscal-ekasa-eet',
    category: 'FISCAL',
    nameSk: '🧾 Fiškálny modul eKasa (SK) / EET (CZ) / ANAF (RO)',
    nameEn: '🧾 Fiscal Module eKasa (SK) / EET (CZ) / ANAF (RO)',
    descriptionSk: 'Šablóna pre fiškálnu registračnú pokladnicu, odoslanie dokladu na Finančnú správu a offline úložisko.',
    descriptionEn: 'Template for fiscal receipt registration, tax authority submission and offline storage.',
    actionSk: '1. Dokončenie nákupu s platbou v hotovosti.\n2. Odoslanie fiškálneho requestu do chráneného dátového úložiska (CHDÚ).\n3. Vygenerovanie unikátneho identifikátora dokladu (UID/OKP) zo servera Finančnej správy.\n4. Tlač platného pokladničného dokladu s QR kódom a overenie čitateľnosti.',
    actionEn: '1. Complete sale with cash payment.\n2. Submit fiscal payload to protected fiscal memory (Datapac OEC / Fiscat).\n3. Obtain official tax signature / UID from government fiscal server.\n4. Print receipt with 2D QR code and verify scanning with tax app.',
    expectedResultSk: 'Doklad úspešne fiškalizovaný v online režime so stavom "SENT". QR kód je overiteľný cez overovaciu aplikáciu.',
    expectedResultEn: 'Receipt successfully fiscalized online with status "SENT". QR code verified with tax authority mobile validator.',
    payloadTemplate: JSON.stringify(
      {
        market: 'SK_EKASA',
        fiscalBox: 'Datapac OEC v2',
        receiptNumber: '2026-09-001948',
        taxBase20: 13.58,
        vat20: 2.71,
        totalAmount: 16.29,
        currency: 'EUR',
        chduIdentifier: 'SK8829104820193810',
        onlineMode: true,
      },
      null,
      2
    ),
    confluenceDescriptionSk: `### 🧾 Fiškálna Registrácia Dokladu (eKasa / ANAF)
- **Trh**: Slovensko (Zákon 289/2008 Z.z. o eKase) / Rumunsko (ANAF)
- **Modul**: Datapac OEC / Fiscat
- **Režim**: Online autorizácia s automatickým offline fallbackom pri výpadku optiky

#### Záchranný offline scenár:
V prípade výpadku spojenia musí pokladnica uložiť doklad do lokálneho CHDÚ, vytlačiť náhradný offline kód a po obnovení konektivity doklad do 48 hodín doslať.`,
    confluenceDescriptionEn: `### 🧾 Fiscal Receipt Registration (eKasa / ANAF)
- **Market**: Slovakia (Act 289/2008) / Romania (ANAF)
- **Fiscal Unit**: Datapac OEC / Fiscat
- **Mode**: Online authorization with automatic offline fallback on network loss

#### Offline Contingency:
If network drops, POS must store receipt in local protected memory, print emergency offline code, and sync within 48 hours upon link restoration.`,
  },
  {
    id: 'opt-giftcards-fleet',
    category: 'PAYMENT',
    nameSk: '💳 OPT Bezobslužný automat & Palivové karty (MOL/Slovnaft Move)',
    nameEn: '💳 Outdoor Payment Terminal (OPT) & Fleet/Gift Cards',
    descriptionSk: 'Šablóna pre bezobslužné tankovanie 24/7, platbu palivovou kartou a autorizáciu bankového terminálu.',
    descriptionEn: 'Template for 24/7 unattended fueling, fleet card and payment gateway authorization.',
    actionSk: '1. Vloženie Slovnaft Fleet karty do čítačky OPT terminálu.\n2. Zadanie PIN kódu a autorizácia stavu konta vo fleetovom systéme.\n3. Výber stojanu a nastavenie limitu tankovania (100 EUR).\n4. Úspešné natankovanie a vytlačenie daňového dokladu priamo na OPT.',
    actionEn: '1. Insert Slovnaft Fleet card into OPT smartcard reader.\n2. Enter PIN and verify credit authorization against fleet backend.\n3. Select dispenser and set authorization ceiling (100 EUR).\n4. Successful fueling and receipt printout at OPT terminal.',
    expectedResultSk: 'Fleet systém zablokuje čiastku, stojan vydá palivo a po dokončení sa zaúčtuje presná suma s vygenerovaním elektronickej faktúry.',
    expectedResultEn: 'Fleet backend reserves pre-auth amount, dispenser fuels, and settlement reconciles actual amount with e-invoice generated.',
    payloadTemplate: JSON.stringify(
      {
        terminalType: 'OPT_UNATTENDED',
        cardType: 'SLOVNAFT_GOLD_FLEET',
        cardNumberMasked: '7004-xxxx-xxxx-4912',
        pinVerified: true,
        authorizedCeilingEur: 100.0,
        actualDispensedEur: 68.42,
        fleetTransactionRef: 'FLT_RO_2026_09812',
      },
      null,
      2
    ),
    confluenceDescriptionSk: `### 💳 OPT & B2B Fleet Integrácia
- **Terminál**: Hectronic / Tokheim Crypto VGA OPT
- **Platobná brána**: SwitchioPay / SixPay / Epay
- **Karty**: B2B Slovnaft Card, MOL Fleet Card, DKV, UTA, Mastercard/Visa`,
    confluenceDescriptionEn: `### 💳 OPT & B2B Fleet Integration
- **Terminal**: Hectronic / Tokheim Crypto VGA OPT
- **Payment Gateway**: SwitchioPay / SixPay / Epay
- **Cards**: B2B Slovnaft Card, MOL Fleet Card, DKV, UTA, Mastercard/Visa`,
  },
  {
    id: 'sap-settlement-migo',
    category: 'SAP',
    nameSk: '🏢 SAP ERP Integrácia & Skladový príjem MIGO / Denná uzávierka',
    nameEn: '🏢 SAP ERP Integration & MIGO Goods Receipt / Daily Settlement',
    descriptionSk: 'Šablóna pre odoslanie dátovej dávky do SAP IS-Oil a SAP IS-Retail cez SAP PO / EAI.',
    descriptionEn: 'Template for batch data submission to SAP IS-Oil and SAP IS-Retail via SAP PO / EAI.',
    actionSk: '1. Generovanie dennej uzávierky (End of Day - EOD) na pokladni POS.\n2. Vytvorenie SSR settlement dátového balíčka a odoslanie cez rozhranie IF_RITS_009.\n3. Spracovanie správy v SAP PO s mapovaním na IDoc OILBLM_SAVEM02.\n4. Zápis skladových pohybov a finančných položiek do SAP IS-Oil (Sybase DB / HANA).',
    actionEn: '1. Trigger End of Day (EOD) daily settlement on POS.\n2. Generate SSR settlement payload and dispatch via interface IF_RITS_009.\n3. SAP PO processing with mapping to IDoc OILBLM_SAVEM02.\n4. Commit inventory movements and accounting items to SAP IS-Oil (Sybase DB / HANA).',
    expectedResultSk: 'IDoc v SAP má status 53 (Úspešne zaúčtovaný). Skladové zásoby paliva a tovaru na predajni presne sedia s fyzickým stavom.',
    expectedResultEn: 'IDoc in SAP shows status 53 (Successfully posted). Fuel and dry inventory match forecourt physical measurements.',
    payloadTemplate: JSON.stringify(
      {
        interfaceId: 'IF_RITS_009',
        idocType: 'OILBLM_SAVEM02',
        settlementDate: '2026-09-07',
        stationId: 'SK_BA_PRISTAVNA_001',
        totalSalesGross: 14829.4,
        totalVatAmount: 2471.56,
        idocStatus: '53_POSTED_SUCCESSFULLY',
        sapDocumentNumber: '4900182910',
      },
      null,
      2
    ),
    confluenceDescriptionSk: `### 🏢 SAP ERP Integračný Tok (EOD Settlement)
- **Rozhranie**: IF_RITS_009 (POS to SAP PO) & IF_RITS_010 (SAP Inbound)
- **IDoc**: OILBLM_SAVEM02 (Palivové pohyby) / WMMBID02 (Skladové tovary MIGO)
- **Cieľový systém**: SAP IS-Oil EHP 8.0 & SAP CAR (HANA DB)`,
    confluenceDescriptionEn: `### 🏢 SAP ERP Integration Flow (EOD Settlement)
- **Interface**: IF_RITS_009 (POS to SAP PO) & IF_RITS_010 (SAP Inbound)
- **IDoc**: OILBLM_SAVEM02 (Fuel movements) / WMMBID02 (Shop goods receipt MIGO)
- **Target**: SAP IS-Oil EHP 8.0 & SAP CAR (HANA DB)`,
  },
];
