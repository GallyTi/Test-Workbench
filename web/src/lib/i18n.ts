import { useAppStore, AppLang } from './store';

export const TRANSLATIONS: Record<string, { sk: string; en: string }> = {
  // Navigation
  'nav.dashboard': { sk: 'Prehľad', en: 'Dashboard' },
  'nav.testCases': { sk: 'Testovacie scenáre', en: 'Test Cases' },
  'nav.testRuns': { sk: 'Exekúcie testov', en: 'Test Runs' },
  'nav.bugs': { sk: 'Defekty & Jira', en: 'Bugs & Jira' },
  'nav.docs': { sk: 'Confluence Wiki', en: 'Confluence Docs' },
  'nav.graph': { sk: 'Architektúra (Graph)', en: 'Architecture Graph' },
  'nav.excelImport': { sk: 'Excel Import', en: 'Excel Import' },
  'nav.admin': { sk: 'Administrácia', en: 'Admin' },
  'nav.bottlenecks': { sk: 'Úzke miesta & SLA', en: 'Bottlenecks & SLA' },
  'nav.users': { sk: 'Správa používateľov', en: 'User Management' },
  'nav.auditLogs': { sk: 'Audit Logy', en: 'Audit Logs' },
  'nav.logout': { sk: 'Odhlásiť sa', en: 'Logout' },
  'nav.login': { sk: 'Prihlásiť sa', en: 'Login' },

  // Common Actions
  'action.save': { sk: 'Uložiť', en: 'Save' },
  'action.cancel': { sk: 'Zrušiť', en: 'Cancel' },
  'action.delete': { sk: 'Vymazať', en: 'Delete' },
  'action.edit': { sk: 'Upraviť', en: 'Edit' },
  'action.create': { sk: 'Vytvoriť', en: 'Create' },
  'action.search': { sk: 'Hľadať...', en: 'Search...' },
  'action.refresh': { sk: 'Obnoviť', en: 'Refresh' },
  'action.back': { sk: 'Späť', en: 'Back' },
  'action.close': { sk: 'Zatvoriť', en: 'Close' },
  'action.copy': { sk: 'Kopírovať', en: 'Copy' },
  'action.copied': { sk: 'Skopírované', en: 'Copied' },
  'action.download': { sk: 'Stiahnuť', en: 'Download' },
  'action.reportBug': { sk: 'Nahlásiť chybu', en: 'Report Bug' },
  'action.copyForAi': { sk: 'Kopírovať hlásenie pre Asistenta / AI', en: 'Copy Report for Assistant / AI' },
  'action.reset': { sk: 'Zresetovať', en: 'Reset' },
  'action.submit': { sk: 'Odoslať', en: 'Submit' },
  'action.linkJira': { sk: 'Napojiť Jira Ticket', en: 'Link Jira Ticket' },

  // Statuses
  'status.passed': { sk: 'Úspešné', en: 'Passed' },
  'status.failed': { sk: 'Zlyhané', en: 'Failed' },
  'status.blocked': { sk: 'Blokované', en: 'Blocked' },
  'status.in_progress': { sk: 'Prebieha', en: 'In Progress' },
  'status.untested': { sk: 'Netestované', en: 'Untested' },
  'status.skipped': { sk: 'Preskočené', en: 'Skipped' },
  'status.draft': { sk: 'Koncept', en: 'Draft' },
  'status.ready': { sk: 'Pripravené', en: 'Ready' },

  // Bug severities
  'severity.minor': { sk: 'Drobná (Minor)', en: 'Minor' },
  'severity.major': { sk: 'Závažná (Major)', en: 'Major' },
  'severity.critical': { sk: 'Kritická (Critical)', en: 'Critical' },
  'severity.blocker': { sk: 'Blokujúca (Blocker)', en: 'Blocker' },

  // Bug statuses
  'bugStatus.open': { sk: 'Otvorená (Open)', en: 'Open' },
  'bugStatus.in_progress': { sk: 'V riešení (In Progress)', en: 'In Progress' },
  'bugStatus.resolved': { sk: 'Vyriešená (Resolved)', en: 'Resolved' },
  'bugStatus.closed': { sk: 'Uzavretá (Closed)', en: 'Closed' },

  // Footer & System
  'footer.platform': { sk: 'RITS Enterprise Test Workbench', en: 'RITS Enterprise Test Workbench' },
  'footer.connected': { sk: 'Systém aktívny (Online)', en: 'System Connected (Online)' },
  'footer.version': { sk: 'Verzia v2.4.0-prod', en: 'Version v2.4.0-prod' },
  'footer.reportIssue': { sk: 'Nahlásiť problém / chybu', en: 'Report Issue / Bug' },
  'footer.apiDocs': { sk: 'Swagger API Docs', en: 'Swagger API Docs' },
  'footer.quickNav': { sk: 'Rýchla navigácia', en: 'Quick Navigation' },

  // Themes & Lang
  'theme.dark': { sk: 'Tmavý režim', en: 'Dark Mode' },
  'theme.light': { sk: 'Biely režim', en: 'Light Mode' },
  'lang.switch': { sk: 'Jazyk: EN / SK', en: 'Language: SK / EN' },
};

export function t(key: string, lang: AppLang = 'sk'): string {
  if (TRANSLATIONS[key]) {
    return TRANSLATIONS[key][lang] || TRANSLATIONS[key].sk || key;
  }
  return key;
}

export function useTranslation() {
  const { lang, setLang, toggleLang } = useAppStore();
  return {
    t: (key: string) => t(key, lang),
    lang,
    setLang,
    toggleLang,
  };
}
