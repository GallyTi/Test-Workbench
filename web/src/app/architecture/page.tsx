'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Network,
  Server,
  Database,
  Shield,
  Activity,
  Search,
  ExternalLink,
  ChevronRight,
  Cpu,
  Monitor,
  Fuel,
  Receipt,
  CreditCard,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ArrowRight,
  Info,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { exportToCsv } from '@/lib/export-csv';

interface ArchitectureInterface {
  id: string;
  source: string;
  target: string;
  protocol: string;
  direction: 'Uni' | 'Bi';
  category: 'SAP_EAI' | 'FORECOURT' | 'FISCAL' | 'PAYMENT' | 'THIRD_PARTY' | 'LOYALTY';
  nameSk: string;
  nameEn: string;
  descriptionSk: string;
  descriptionEn: string;
  status: 'PROD_READY' | 'TESTING' | 'MOCKED';
  payloadSample?: string;
  linkedStream: 'WET' | 'DRY' | 'SERVICE' | 'FIN' | 'OCI_SO';
  linkedBadge: 'wet SeS' | 'dry SeS' | 'service SeS' | 'highway SeS';
}

const INTERFACES: ArchitectureInterface[] = [
  {
    id: 'IF_RITS_001',
    source: 'Fuel Station POS',
    target: 'DOMS 5000 Controller',
    protocol: 'REST / TCP (IFSF-LON)',
    direction: 'Bi',
    category: 'FORECOURT',
    nameSk: 'Autorizácia výdajného stojanu & Predautorizácia',
    nameEn: 'Dispenser Authorization & Pre-auth',
    descriptionSk: 'Príkaz z pokladnice na odblokovanie tankovacej pištole, nastavenie limitu a voľbu palivového mixu.',
    descriptionEn: 'POS command to unblock fueling nozzle, configure preset ceiling and select fuel grade.',
    status: 'PROD_READY',
    linkedStream: 'WET',
    linkedBadge: 'wet SeS',
    payloadSample: '{\n  "action": "AUTHORIZE_PUMP",\n  "pumpId": 3,\n  "limitAmount": 50.00,\n  "currency": "EUR"\n}',
  },
  {
    id: 'IF_RITS_002',
    source: 'DOMS 5000 Controller',
    target: 'Fuel Station POS',
    protocol: 'IFSF-LON Event Stream',
    direction: 'Uni',
    category: 'FORECOURT',
    nameSk: 'Ukončenie výdaja paliva (Fuel Sale Completed)',
    nameEn: 'Fuel Sale Completion Notification',
    descriptionSk: 'Zaslanie presného objemu odčerpaného paliva z pištole, jednotkovej ceny a celkovej sumy do pokladne.',
    descriptionEn: 'Transmission of dispensed volume, unit price, and total monetary value to POS ticket.',
    status: 'PROD_READY',
    linkedStream: 'WET',
    linkedBadge: 'wet SeS',
    payloadSample: '{\n  "event": "DISPENSE_FINISHED",\n  "pump": 3,\n  "volumeLitres": 32.41,\n  "pricePerLitre": 1.629,\n  "totalAmount": 52.80\n}',
  },
  {
    id: 'IF_RITS_003',
    source: 'Fuel Station POS',
    target: 'Fiscal Unit (Datapac OEC / Fiscat)',
    protocol: 'Serial RS-232 / USB CHDÚ Driver',
    direction: 'Bi',
    category: 'FISCAL',
    nameSk: 'Fiškalizácia pokladničného dokladu (eKasa / ANAF)',
    nameEn: 'Fiscal Receipt Registration (eKasa / ANAF)',
    descriptionSk: 'Zápis daňových položiek do chráneného pamäťového úložiska a online odoslanie na Finančnú správu.',
    descriptionEn: 'Registration of tax entries into protected fiscal memory and online sync to tax authority.',
    status: 'PROD_READY',
    linkedStream: 'FIN',
    linkedBadge: 'highwaySeS' as any,
    payloadSample: '{\n  "receiptType": "CASH_SALE",\n  "vat20Base": 44.00,\n  "vat20Tax": 8.80,\n  "chduUuid": "SK-849102-EKASA"\n}',
  },
  {
    id: 'IF_RITS_004',
    source: 'Fuel Station POS / OPT',
    target: 'EFT Payment Terminal (Switchio / SixPay)',
    protocol: 'TCP/IP ISO 8583 / ZVT Protocol',
    direction: 'Bi',
    category: 'PAYMENT',
    nameSk: 'Autorizácia bezhotovostnej platby kartou',
    nameEn: 'Card Payment Authorization',
    descriptionSk: 'Komunikácia s platobným terminálom pre bezkontaktné platby, Apple Pay, Google Pay a B2B MOL karty.',
    descriptionEn: 'Interaction with EFTPOS terminal for contactless, EMV chip, and B2B fleet card settlement.',
    status: 'PROD_READY',
    linkedStream: 'FIN',
    linkedBadge: 'highwaySeS' as any,
    payloadSample: '{\n  "authAmount": 52.80,\n  "cardScheme": "VISA_MASTERCARD",\n  "stan": "091244",\n  "authCode": "OK8812"\n}',
  },
  {
    id: 'IF_RITS_005',
    source: 'Cloud Office / SAP PO',
    target: 'Fuel Station POS / Simplified POS',
    protocol: 'HTTPS REST / JSON',
    direction: 'Uni',
    category: 'SAP_EAI',
    nameSk: 'Distribúcia cenníkov palív a kmeňových tovarov',
    nameEn: 'Fuel Price Pole & Article Master Data Sync',
    descriptionSk: 'Automatický import denných palivových cien z centrály a aktualizácia promo akcií Fresh Corner.',
    descriptionEn: 'Automated fuel price update from HQ and Fresh Corner promo campaign synchronization.',
    status: 'PROD_READY',
    linkedStream: 'WET',
    linkedBadge: 'wet SeS',
    payloadSample: '{\n  "stationId": "SK0194",\n  "prices": [\n    {"grade": "EVO_95", "price": 1.629},\n    {"grade": "EVO_DIESEL", "price": 1.589}\n  ]\n}',
  },
  {
    id: 'IF_RITS_006',
    source: 'Fuel Station POS',
    target: 'Cloud Office',
    protocol: 'HTTPS REST (EOD Batch)',
    direction: 'Uni',
    category: 'SAP_EAI',
    nameSk: 'Denná finančná a palivová uzávierka (EOD Shift)',
    nameEn: 'End-of-Day Shift & SSR Settlement Export',
    descriptionSk: 'Odoslanie súhrnnej uzávierky zmeny: celkový obrat, odvody hotovosti, manká a stav počítadiel stojanov.',
    descriptionEn: 'Transmission of shift closing package: revenue totals, cash drops, variances, dispenser meter readings.',
    status: 'PROD_READY',
    linkedStream: 'FIN',
    linkedBadge: 'highwaySeS' as any,
    payloadSample: '{\n  "station": "SK0194",\n  "shiftNumber": 2,\n  "grossSalesEur": 14209.50,\n  "totalFuelLitres": 8740.2\n}',
  },
  {
    id: 'IF_RITS_008',
    source: 'SAP PO (Enterprise Application Integration)',
    target: 'SAP IS-Retail / SAP CAR',
    protocol: 'IDoc MATMAS05 / SOAP WSDL',
    direction: 'Uni',
    category: 'SAP_EAI',
    nameSk: 'Kmeňové dáta materiálov & POSDM Transakcie',
    nameEn: 'Material Master IDocs & POSDM CAR Sync',
    descriptionSk: 'Odosielanie položkových predajov do SAP Customer Activity Repository (CAR) na HANA DB.',
    descriptionEn: 'Streaming itemized transactions into SAP CAR on SAP HANA for real-time analytics.',
    status: 'TESTING',
    linkedStream: 'DRY',
    linkedBadge: 'dry SeS',
    payloadSample: '{\n  "idoc": "POSDM_SALES_COMMIT",\n  "store": "SK0194",\n  "hanaBatch": "BATCH-2026-09-HANA"\n}',
  },
  {
    id: 'IF_RITS_009',
    source: 'SAP PO / EAI Connector',
    target: 'SAP IS-Oil & Sybase DB',
    protocol: 'IDoc OILBLM_SAVEM02 (Fuel Movements)',
    direction: 'Bi',
    category: 'SAP_EAI',
    nameSk: 'SAP IS-Oil Účtovanie Palivových Pohybov',
    nameEn: 'SAP IS-Oil Fuel Movement Booking',
    descriptionSk: 'Zápis do primárnej tabuľky FUEL MOVEMENTS v Sybase DB / HANA pre materiálové hospodárstvo palív.',
    descriptionEn: 'Direct write into central FUEL MOVEMENTS table for refinery inventory reconciliation.',
    status: 'TESTING',
    linkedStream: 'WET',
    linkedBadge: 'wet SeS',
    payloadSample: '{\n  "idoc": "OILBLM_SAVEM02",\n  "postingStatus": 53,\n  "fuelMovements": 4\n}',
  },
  {
    id: 'IF_RITS_011',
    source: 'Outdoor Payment Terminal (OPT Tokheim)',
    target: 'DOMS 5000 Forecourt Controller',
    protocol: 'IFSF-LON Dispenser Loop',
    direction: 'Bi',
    category: 'FORECOURT',
    nameSk: 'Bezobslužná autorizácia OPT automatu 24/7',
    nameEn: 'OPT Unattended Fueling Authorization',
    descriptionSk: 'Autonómne riadenie čerpadla z vonkajšieho platobného automatu bez účasti personálu stanice.',
    descriptionEn: 'Autonomous dispenser control from outdoor payment terminal during night/unattended shifts.',
    status: 'PROD_READY',
    linkedStream: 'WET',
    linkedBadge: 'wet SeS',
    payloadSample: '{\n  "terminal": "OPT_CRYPTO_VGA",\n  "preAuthCard": "OK",\n  "authorizedLitres": 60\n}',
  },
  {
    id: 'IF_RITS_015',
    source: 'Fuel Station POS',
    target: 'FORTUNA Lottery API',
    protocol: 'SOAP / XML over HTTPS',
    direction: 'Bi',
    category: 'THIRD_PARTY',
    nameSk: 'Stávkový a lotériový modul FORTUNA',
    nameEn: 'FORTUNA Lottery & Betting Voucher Gateway',
    descriptionSk: 'Overovanie stávkových tiketov, predaj stieracích žrebov a vyplácanie výhier na pokladnici.',
    descriptionEn: 'Validation of betting tickets, lottery scratchcards sale and payout on POS.',
    status: 'PROD_READY',
    linkedStream: 'DRY',
    linkedBadge: 'dry SeS',
    payloadSample: '{\n  "provider": "FORTUNA_RO",\n  "voucherBarcode": "992100482910",\n  "payoutEur": 25.00\n}',
  },
  {
    id: 'IF_RITS_016',
    source: 'Fuel Station POS',
    target: 'Un-Doi Utility Payments',
    protocol: 'REST / JSON OAuth2',
    direction: 'Bi',
    category: 'THIRD_PARTY',
    nameSk: 'Platby faktúr & Složeniek Un-Doi (Rumunsko)',
    nameEn: 'Un-Doi Utility Bill Payment Service (Romania)',
    descriptionSk: 'Úhrady energií, faktúr za plyn, mobilných operátorov a poplatkov za diaľničné známky.',
    descriptionEn: 'Settlement of utility bills, gas, telecoms, and road vignette levies on RO stations.',
    status: 'MOCKED',
    linkedStream: 'DRY',
    linkedBadge: 'dry SeS',
    payloadSample: '{\n  "biller": "ELECTRICA_RO",\n  "invoiceCode": "98120481",\n  "amountRon": 182.40\n}',
  },
  {
    id: 'IF_RITS_020',
    source: 'Fuel Station POS / Mobile App',
    target: 'Slovnaft Move / MOL Move Loyalty API',
    protocol: 'REST / JSON OAuth2',
    direction: 'Bi',
    category: 'LOYALTY',
    nameSk: 'Vernostný program Slovnaft Move & Zľavové kupóny',
    nameEn: 'Slovnaft Move Loyalty & Voucher Engine',
    descriptionSk: 'Získavanie bodov za tankovanie a nákup, uplatňovanie digitálnych kupónov a káv zadarmo.',
    descriptionEn: 'Points accumulation on fueling and shop purchases, dynamic discounts, and digital coupons.',
    status: 'PROD_READY',
    linkedStream: 'OCI_SO',
    linkedBadge: 'highwaySeS' as any,
    payloadSample: '{\n  "cardNumber": "9820010099882211",\n  "pointsAwarded": 105,\n  "couponApplied": "COFFEE_FREE"\n}',
  },
  {
    id: 'IF_RITS_025',
    source: 'Veeder-Root TLS-450 ATG',
    target: 'DOMS 5000 / Cloud Office',
    protocol: 'Serial / Modbus TCP',
    direction: 'Uni',
    category: 'FORECOURT',
    nameSk: 'Hladinomery v nádržiach (Tank Gauging & Wet Stock)',
    nameEn: 'Automatic Tank Gauging (ATG) & Water Influx',
    descriptionSk: 'Meranie výšky hladiny benzínu, nafty, detekcia spodnej vody a teplotná kompenzácia na 15°C.',
    descriptionEn: 'Level probing for gasoline and diesel, bottom water detection, and 15°C temperature compensation.',
    status: 'PROD_READY',
    linkedStream: 'WET',
    linkedBadge: 'wet SeS',
    payloadSample: '{\n  "tank": 1,\n  "product": "EVO_95",\n  "grossVolume": 28490,\n  "waterHeightMm": 0.0,\n  "tempC": 14.8\n}',
  },
  {
    id: 'IF_RITS_145',
    source: 'Fuel Station POS',
    target: 'Istobal / Kärcher Car Wash Controller',
    protocol: 'RS-485 / Web Relay Protocol',
    direction: 'Bi',
    category: 'FORECOURT',
    nameSk: 'Autoumyváreň Istobal & Generátor Umývacích Kódov',
    nameEn: 'Car Wash Controller & Pin Voucher Dispenser',
    descriptionSk: 'Generovanie 6-miestnych jednorazových kódov pre umývacie programy a sledovanie chybových stavov umyvárky.',
    descriptionEn: 'Issuance of single-use 6-digit wash program pin codes and machine fault status monitoring.',
    status: 'PROD_READY',
    linkedStream: 'SERVICE',
    linkedBadge: 'service SeS',
    payloadSample: '{\n  "programId": "PROGRAM_PREMIUM_WAX",\n  "washCode": "841-902",\n  "validUntil": "2026-09-14T23:59:59Z"\n}',
  },
];

export default function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState<'PAGE1_TOPOLOGY' | 'PAGE2_SERVICES'>('PAGE1_TOPOLOGY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedInterface, setSelectedInterface] = useState<ArchitectureInterface | null>(null);

  // Filtering
  const filteredInterfaces = INTERFACES.filter((iface) => {
    const matchesSearch =
      iface.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iface.nameSk.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iface.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iface.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iface.target.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || iface.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleExportCsv = () => {
    exportToCsv(
      `RITS_Architecture_Interfaces_${new Date().toISOString().slice(0, 10)}`,
      [
        { header: 'Interface ID', accessor: 'id' },
        { header: 'Názov (SK)', accessor: 'nameSk' },
        { header: 'Názov (EN)', accessor: 'nameEn' },
        { header: 'Zdrojový systém', accessor: 'source' },
        { header: 'Cieľový systém', accessor: 'target' },
        { header: 'Protokol', accessor: 'protocol' },
        { header: 'Kategória', accessor: 'category' },
        { header: 'Status', accessor: 'status' },
        { header: 'Stream', accessor: 'linkedStream' },
        { header: 'SeS Odznak', accessor: 'linkedBadge' },
      ],
      INTERFACES
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/20 p-6 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono border-blue-400/40 text-blue-300">
                RITS ARCHITECTURE R6.1 SPECIFICATION
              </Badge>
              <Badge variant="default" className="text-[10px] bg-emerald-600">
                INTERAKTÍVNA TRANSFORMÁCIA Z PDF
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Network className="w-8 h-8 text-blue-400" />
              RITS Enterprise Architektúra & Integračná Topológia
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Presná kópia architektúry z technickej dokumentácie{' '}
              <span className="font-mono text-blue-300">RITS_Architecture_R6.1.pdf</span>. Prepínajte medzi
              integračnou topológiou (SAP PO / Direct APIs) a doménovým rozpadom mikroslužieb Posybe2 stanice.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleExportCsv}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2 font-medium"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Exportovať Rozhrania do CSV
            </Button>
            <Link href="/graph">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2 font-medium"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                Otvoriť 3D Graf
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Switching */}
        <div className="mt-6 flex items-center gap-2 border-b border-white/10 pb-1">
          <button
            onClick={() => setActiveTab('PAGE1_TOPOLOGY')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'PAGE1_TOPOLOGY'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Network className="w-4 h-4" />
            Strana 1: RITS Integračná Topológia (SAP PO & Direct APIs)
          </button>
          <button
            onClick={() => setActiveTab('PAGE2_SERVICES')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'PAGE2_SERVICES'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Strana 2: Čerpacia Stanica & Posybe2 Mikroslužby
          </button>
        </div>
      </div>

      {/* TAB 1: RITS INTERFACE & TOPOLOGY (PAGE 1 OF PDF) */}
      {activeTab === 'PAGE1_TOPOLOGY' && (
        <div className="space-y-6">
          {/* Visual Architecture Map Canvas */}
          <Card className="p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Schéma Dátových Tokov a Prepojení (Architecture Blueprint)
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Kliknite na ktorýkoľvek uzol alebo prepojenie pre zobrazenie technickej špecifikácie.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> SAP PO / EAI
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Forecourt / Palivá
                </span>
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Tretie strany
                </span>
              </div>
            </div>

            {/* Architecture Node Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/70 dark:bg-black/40 border border-slate-200 dark:border-white/10">
              {/* Column 1: ERP & Central Systems */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1 border-b border-slate-200 dark:border-white/10">
                  🏢 ERP & Centrála (SAP & DB)
                </div>

                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-1.5 hover:border-blue-400 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-300">SAP IS-Oil</span>
                    <Badge variant="outline" className="text-[9px] font-mono text-blue-400 border-blue-400/30">
                      HANA / Sybase
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Centrálne účtovanie palív, tabuľka <span className="font-mono text-blue-300">FUEL MOVEMENTS</span>,
                    IDoc OILBLM_SAVEM02.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-blue-400">
                    <span>IF_RITS_009</span>
                    <span className="text-emerald-400">ONLINE</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-1.5 hover:border-indigo-400 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-indigo-300">SAP CAR & IS-Retail</span>
                    <Badge variant="outline" className="text-[9px] font-mono text-indigo-400 border-indigo-400/30">
                      HANA DB
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Customer Activity Repository (POSDM), analýza košíkov, IDoc MATMAS05 tovarov.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-indigo-400">
                    <span>IF_RITS_008</span>
                    <span className="text-amber-400">TESTING</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/10 space-y-1.5 hover:border-white/20 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">Cloud Office</span>
                    <Badge variant="outline" className="text-[9px] font-mono text-slate-400">
                      Sybase DB
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Správa staníc, cenníky palív, promo akcie Fresh Corner, denné uzávierky EOD.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>IF_RITS_005, 006</span>
                    <span className="text-emerald-400">ONLINE</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Integration Bus (SAP PO / EAI) */}
              <div className="space-y-3 flex flex-col justify-center">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 pb-1 border-b border-slate-200 dark:border-white/10">
                  🔄 Enterprise Integration Bus
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-950/40 via-purple-900/20 to-slate-950 border border-purple-500/40 shadow-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-600/30 border border-purple-400/40">
                      <Network className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">SAP Process Orchestration</h4>
                      <p className="text-[10px] font-mono text-purple-300">SAP PO / EAI Middleware</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Transformácia dátových štruktúr, smerovanie správ medzi stanicami a centrálnymi systémami MOL Group.
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-purple-500/20">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Transformácia:</span>
                      <span className="text-purple-300 font-semibold">XML / JSON / IDoc</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Protokoly:</span>
                      <span className="text-purple-300 font-semibold">SOAP, REST, RFC, JMS</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Zabezpečenie:</span>
                      <span className="text-purple-300 font-semibold">mTLS / OAuth2 / HMAC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Fuel Station Core (POS & DOMS) */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 pb-1 border-b border-slate-200 dark:border-white/10">
                  ⛽ Čerpacia Stanica (POS & DOMS)
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5 hover:border-emerald-400 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-300">Fuel Station POS</span>
                    <Badge variant="outline" className="text-[9px] font-mono text-emerald-400 border-emerald-400/30">
                      Windows POS
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Dotyková pokladňa, autorizácia stojanov, fiškalizácia eKasa/ANAF, storno a zľavy Move.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                    <span>IF_RITS_001, 003, 004</span>
                    <span className="text-emerald-400">READY</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5 hover:border-cyan-400 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-cyan-300">DOMS 5000 Forecourt Controller</span>
                    <Badge variant="outline" className="text-[9px] font-mono text-cyan-400 border-cyan-400/30">
                      IFSF-LON
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Riadenie stojanov Tokheim/Wayne/Gilbarco, hladinomery Veeder-Root, cenový totem.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                    <span>IF_RITS_001, 002, 025</span>
                    <span className="text-emerald-400">READY</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5 hover:border-amber-400 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-300">OPT Outdoor Terminal</span>
                    <Badge variant="outline" className="text-[9px] font-mono text-amber-400 border-amber-400/30">
                      Tokheim Crypto VGA
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Bezobslužné nočné tankovanie 24/7, priame spojenie na DOMS a bankový switch.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-amber-400">
                    <span>IF_RITS_011, 012</span>
                    <span className="text-emerald-400">READY</span>
                  </div>
                </div>
              </div>

              {/* Column 4: External Systems & Trhy */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 pb-1 border-b border-slate-200 dark:border-white/10">
                  🌐 Priame Externé Systémy & Trhy
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5 hover:border-rose-400 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-rose-300">Finančná správa (SK/RO/CZ)</span>
                    <Badge variant="outline" className="text-[9px] font-mono text-rose-400 border-rose-400/30">
                      eKasa / ANAF
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Zákonná fiškalizácia dokladov, overovanie UID, offline úložisko CHDÚ.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-rose-400">
                    <span>IF_RITS_003</span>
                    <span className="text-emerald-400">CERTIFIED</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-1.5 hover:border-violet-400 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-violet-300">Platobné Brány & Fleet</span>
                    <Badge variant="outline" className="text-[9px] font-mono text-violet-400 border-violet-400/30">
                      Switchio / SixPay
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Bankové karty, MOL Fleet Card, DKV, UTA, Epay zúčtovanie.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-violet-400">
                    <span>IF_RITS_004</span>
                    <span className="text-emerald-400">READY</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/10 space-y-1.5 hover:border-white/20 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">Služby Tretích Strán</span>
                    <Badge variant="outline" className="text-[9px] font-mono text-slate-400">
                      RO / SK
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Un-Doi (faktúry RO), FORTUNA lotéria, Istobal umývacie kódy, Slovnaft Move.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>IF_RITS_015, 016, 020, 145</span>
                    <span className="text-blue-400">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hľadať rozhranie (napr. IF_RITS_001, DOMS, SAP, eKasa)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/50 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-xs text-slate-500 dark:text-zinc-400 shrink-0 font-medium">Kategória:</span>
              {(['ALL', 'FORECOURT', 'SAP_EAI', 'FISCAL', 'PAYMENT', 'THIRD_PARTY', 'LOYALTY'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Interfaces Table */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Katalóg Rozhraní RITS ({filteredInterfaces.length} z {INTERFACES.length})
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                Prepojené s Testovacími Behmami a SeS Odznakmi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-zinc-400 font-mono text-[11px] border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-4">Kód Rozhrania</th>
                    <th className="py-3 px-4">Názov & Účel</th>
                    <th className="py-3 px-4">Dátový Tok (Zdroj → Cieľ)</th>
                    <th className="py-3 px-4">Protokol</th>
                    <th className="py-3 px-4">Stream & SeS Odznak</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Akcie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.05]">
                  {filteredInterfaces.map((iface) => (
                    <tr
                      key={iface.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedInterface(iface)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {iface.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{iface.nameSk}</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-xs">
                          {iface.descriptionSk}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                          <span className="font-semibold text-blue-500">{iface.source}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-purple-500">{iface.target}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-400 text-[10px]">
                        {iface.protocol}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] font-mono">
                            {iface.linkedStream}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] font-mono border-amber-500/40 text-amber-500">
                            {iface.linkedBadge}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            iface.status === 'PROD_READY'
                              ? 'success'
                              : iface.status === 'TESTING'
                              ? 'warning'
                              : 'outline'
                          }
                          className="text-[9px] font-mono"
                        >
                          {iface.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInterface(iface);
                          }}
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: FUEL STATION & POSYBE2 MICROSERVICES (PAGE 2 OF PDF) */}
      {activeTab === 'PAGE2_SERVICES' && (
        <div className="space-y-6">
          {/* Posybe2 Microservices Domain Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Domain 1: Management Domain */}
            <Card className="p-5 space-y-3 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">1. Management Domain</h4>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono">
                  4 SLUŽBY
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Správa stanice, zamestnancov, prístupových práv a hardvérových profilov pokladníc.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Station Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Employee Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Terminal Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Configuration Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
              </div>
            </Card>

            {/* Domain 2: Transaction Domain */}
            <Card className="p-5 space-y-3 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">2. Transaction Domain</h4>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono">
                  4 SLUŽBY
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Jadro pokladničného predaja: košík, platby, storno operácie a denné uzávierky.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Sales Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Order Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Tender/Payment Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Shift & EOD Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
              </div>
            </Card>

            {/* Domain 3: Inventory & Wet Stock Domain */}
            <Card className="p-5 space-y-3 border-l-4 border-l-cyan-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-cyan-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">3. Inventory & Fuel Domain</h4>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono">
                  4 SLUŽBY
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Pohyby zásob na predajni, skladový príjem tovaru MIGO a tankové hospodárstvo palív.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Stock Movement Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Tank Gauge Service (ATG)</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Waste & Loss Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">MIGO Goods Receipt Service</span>
                  <span className="text-[10px] font-mono text-amber-500">TESTING</span>
                </div>
              </div>
            </Card>

            {/* Domain 4: Integration Domain */}
            <Card className="p-5 space-y-3 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-purple-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">4. Integration Domain</h4>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono">
                  4 OVLÁDAČE
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Periférne adaptéry pre DOMS, fiškálny box, bankový terminál a SAP PO konektor.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">DOMS Forecourt Connector</span>
                  <span className="text-[10px] font-mono text-emerald-500">IFSF-LON READY</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Fiscal Box Driver (eKasa/ANAF)</span>
                  <span className="text-[10px] font-mono text-emerald-500">ONLINE</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">EFT Bank Payment Driver</span>
                  <span className="text-[10px] font-mono text-emerald-500">ONLINE</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">SAP PO Outbound Agent</span>
                  <span className="text-[10px] font-mono text-amber-500">QUEUE: 0</span>
                </div>
              </div>
            </Card>

            {/* Domain 5: Catalog & Pricing Domain */}
            <Card className="p-5 space-y-3 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">5. Catalog & Pricing Domain</h4>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono">
                  3 SLUŽBY
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Položkový katalóg produktov, akcie Fresh Corner, palivové cenovky a vernostné pravidlá.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Product Catalog Service</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Price & Promo Engine</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Loyalty Engine (Move)</span>
                  <span className="text-[10px] font-mono text-emerald-500">HEALTH: OK</span>
                </div>
              </div>
            </Card>

            {/* Domain 6: Supporting & Infrastructure */}
            <Card className="p-5 space-y-3 border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-rose-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">6. Supporting Domain</h4>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono">
                  4 KOMPONENTY
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Ocelot API Gateway, Keycloak Identity Provider, RabbitMQ a MinIO S3 objektové úložisko.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Ocelot API Gateway</span>
                  <span className="text-[10px] font-mono text-emerald-500">HTTPS READY</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Keycloak IdP (OAuth2)</span>
                  <span className="text-[10px] font-mono text-emerald-500">TOKENS: VALID</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">RabbitMQ Message Broker</span>
                  <span className="text-[10px] font-mono text-emerald-500">EXCHANGES: OK</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">MinIO S3 Attachments</span>
                  <span className="text-[10px] font-mono text-emerald-500">CONNECTED</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Interface Detail Slide-over / Modal */}
      {selectedInterface && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/15 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className="font-mono text-xs text-blue-500 border-blue-500/30">
                  {selectedInterface.id}
                </Badge>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedInterface.nameSk}
                </h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedInterface(null)}
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Popis Architektonického Rozhrania:
                </span>
                <p className="text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {selectedInterface.descriptionSk}
                </p>
                <p className="text-slate-500 dark:text-zinc-500 italic text-[11px]">
                  {selectedInterface.descriptionEn}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Zdrojový Systém:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{selectedInterface.source}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Cieľový Systém:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{selectedInterface.target}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Protokol / Dátový Typ:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedInterface.protocol}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block">Smer Komunikácie:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    {selectedInterface.direction === 'Bi' ? 'Obojsmerný (Bidirectional)' : 'Jednosmerný (Unidirectional)'}
                  </span>
                </div>
              </div>

              {selectedInterface.payloadSample && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Ukážka Dátovej Štruktúry (Payload JSON / IDoc):
                  </span>
                  <pre className="p-3 rounded-xl bg-black/90 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-emerald-500/20 max-h-48">
                    {selectedInterface.payloadSample}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedInterface.linkedStream}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-500">
                  {selectedInterface.linkedBadge}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/test-cases?search=${selectedInterface.id}`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Zobraziť Testy pre toto Rozhranie
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => setSelectedInterface(null)} className="text-xs">
                  Zavrieť
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
