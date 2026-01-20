export const LOCALES = {
  EN: "en",
  AM: "am-ET",
  OM: "om-ET",
  TI: "ti-ET",
  SW: "sw",
  FR: "fr",
  AR: "ar",
  PT: "pt",
  WO: "wo",
}

export const RTL_LOCALES = [LOCALES.AR]

export const CURRENCY_BY_LOCALE = {
  [LOCALES.EN]: "USD",
  [LOCALES.AM]: "ETB", // Ethiopian Birr
  [LOCALES.OM]: "ETB", // Ethiopian Birr
  [LOCALES.TI]: "ETB", // Ethiopian Birr
  [LOCALES.SW]: "KES", // Kenyan Shilling
  [LOCALES.FR]: "XOF", // West African CFA Franc
  [LOCALES.AR]: "SDG", // Sudanese Pound
  [LOCALES.PT]: "MZN", // Mozambican Metical
  [LOCALES.WO]: "XOF", // West African CFA Franc
}

export const CURRENCIES = {
  KES: { name: "Kenyan Shilling", locale: "en-KE" },
  ETB: { name: "Ethiopian Birr", locale: "am-ET" },
  UGX: { name: "Ugandan Shilling", locale: "en-UG" },
  TZS: { name: "Tanzanian Shilling", locale: "sw-TZ" },
  CDF: { name: "Congolese Franc", locale: "fr-CD" },
  MZN: { name: "Mozambican Metical", locale: "pt-MZ" },
  ZAR: { name: "South African Rand", locale: "en-ZA" },
  GMD: { name: "Gambian Dalasi", locale: "en-GM" },
  GNF: { name: "Guinean Franc", locale: "fr-GN" },
  XOF: { name: "West African CFA Franc", locale: "fr-SN" },
  SDG: { name: "Sudanese Pound", locale: "ar-SD" },
  SOS: { name: "Somali Shilling", locale: "so-SO" },
  USD: { name: "US Dollar", locale: "en-US" },
}

export const TIMEZONE_BY_LOCALE = {
  [LOCALES.EN]: "UTC",
  [LOCALES.AM]: "Africa/Addis_Ababa",
  [LOCALES.OM]: "Africa/Addis_Ababa",
  [LOCALES.TI]: "Africa/Addis_Ababa",
  [LOCALES.SW]: "Africa/Dar_es_Salaam",
  [LOCALES.FR]: "Africa/Dakar",
  [LOCALES.AR]: "Africa/Khartoum",
  [LOCALES.PT]: "Africa/Maputo",
  [LOCALES.WO]: "Africa/Dakar",
}

const translations = {
  [LOCALES.EN]: {
    common: {
      welcome: "Welcome to GoalBet",
      login: "Login",
      logout: "Logout",
      home: "Home",
      settings: "Settings",
      language: "Language",
    },
    sports: {
      sportsbook: "Sportsbook",
      liveGames: "Live Games",
      upcomingGames: "Upcoming Games",
    },
    jackpot: {
      jackpots: "Jackpots",
      totalPool: "Total Pool",
      yourBet: "Your Bet",
    },
    wallet: {
      balance: "Balance",
      deposit: "Deposit",
      withdraw: "Withdraw",
      transaction: "Transactions",
    },
    admin: {
      dashboard: "Admin Dashboard",
      users: "Users",
      reports: "Reports",
      settings: "System Settings",
    },
    agent: {
      dashboard: "Agent Dashboard",
      cashBets: "Cash Bets",
      customers: "Customers",
      reconciliation: "Reconciliation",
      sellCredits: "Sell Credits",
      addMoneyToPlayer: "Add Money to Player",
    },
  },
  [LOCALES.AR]: {
    common: {
      welcome: "أهلا وسهلا ��ك في GoalBet",
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      home: "الرئيسية",
      settings: "الإعدادات",
      language: "اللغة",
    },
    sports: {
      sportsbook: "كتب الرياضات",
      liveGames: "الألعاب المباشرة",
      upcomingGames: "الألعاب القادمة",
    },
    jackpot: {
      jackpots: "الجوائز الكبرى",
      totalPool: "إجمالي المجموعة",
      yourBet: "رهانك",
    },
    wallet: {
      balance: "الرصيد",
      deposit: "إيداع",
      withdraw: "سحب",
      transaction: "معاملات",
    },
    admin: {
      dashboard: "لوحة معلومات الإدارة",
      users: "المستخدمون",
      reports: "التقارير",
      settings: "إعدادات النظام",
    },
    agent: {
      dashboard: "لوحة معلومات الوكيل",
      cashBets: "الرهانات النقدية",
      customers: "العملاء",
      reconciliation: "التسوية",
      sellCredits: "بيع الأرصدة",
      addMoneyToPlayer: "إضافة أموال للاعب",
    },
  },
  [LOCALES.PT]: {
    common: {
      welcome: "Bem-vindo ao GoalBet",
      login: "Entrar",
      logout: "Sair",
      home: "Início",
      settings: "Configurações",
      language: "Idioma",
    },
    sports: {
      sportsbook: "Livro de Esportes",
      liveGames: "Jogos ao Vivo",
      upcomingGames: "Próximos Jogos",
    },
    jackpot: {
      jackpots: "Jackpots",
      totalPool: "Total Pool",
      yourBet: "Seu Aposta",
    },
    wallet: {
      balance: "Saldo",
      deposit: "Depósito",
      withdraw: "Retirada",
      transaction: "Transações",
    },
    admin: {
      dashboard: "Painel Administrativo",
      users: "Usuários",
      reports: "Relatórios",
      settings: "Configurações do Sistema",
    },
    agent: {
      dashboard: "Painel do Agente",
      cashBets: "Apostas em Dinheiro",
      customers: "Clientes",
      reconciliation: "Reconciliação",
      sellCredits: "Vender Créditos",
      addMoneyToPlayer: "Adicionar Dinheiro ao Jogador",
    },
  },
  [LOCALES.WO]: {
    common: {
      welcome: "GoalBet ci ñu ngi mooy",
      login: "Dawet",
      logout: "Dawet ci",
      home: "Dëkk",
      settings: "Xog",
      language: "Xëb",
    },
    sports: {
      sportsbook: "Kanam ñuy wax",
      liveGames: "Xog yi ñuy wax",
      upcomingGames: "Xog yi ñuy wax ñu gën a",
    },
    jackpot: {
      jackpots: "Jackpots",
      totalPool: "Total Pool",
      yourBet: "Xog yi ñu am",
    },
    wallet: {
      balance: "Balance",
      deposit: "Deposit",
      withdraw: "Withdraw",
      transaction: "Transactions",
    },
    admin: {
      dashboard: "Admin Dashboard",
      users: "Users",
      reports: "Reports",
      settings: "System Settings",
    },
    agent: {
      dashboard: "Agent Dashboard",
      cashBets: "Cash Bets",
      customers: "Customers",
      reconciliation: "Reconciliation",
      sellCredits: "Sell Credits",
      addMoneyToPlayer: "Add Money to Player",
    },
  },
  [LOCALES.SW]: {
    common: {
      welcome: "Karibu kwenye GoalBet",
      login: "Ingia",
      logout: "Toka",
      home: "Nyumbani",
      settings: "Mipango",
      language: "Lugha",
    },
    agent: {
      sellCredits: "Uza Mikakati",
      addMoneyToPlayer: "Ongeza Pesa kwa Mchezaji",
    },
  },
  [LOCALES.AM]: {
    common: {
      welcome: "ወደ ጎልበት አቀብለዋለሁ",
      login: "ግባ",
      logout: "ውጣ",
      home: "ቤት",
      settings: "ቅንብር",
      language: "ቋንቋ",
    },
    agent: {
      sellCredits: "ክሬዲት ሸጥ",
      addMoneyToPlayer: "ለተጫዋች ገንዘብ ጨምር",
    },
  },
  [LOCALES.OM]: {
    common: {
      welcome: "Galatoomi GoalBet keessaa",
      login: "Gal",
      logout: "Baasi",
      home: "Mana",
      settings: "Qindaamuuwwan",
      language: "Afaan",
    },
    agent: {
      sellCredits: "Krediiti Gurgura",
      addMoneyToPlayer: "Muka Barattoota Keessa Dabalaa",
    },
  },
  [LOCALES.TI]: {
    common: {
      welcome: "ናብ ጎልበት ብደሓን መጹ",
      login: "ምእታው",
      logout: "ውፃ",
      home: "ገዛ",
      settings: "ምቅልላው",
      language: "ቛንቋ",
    },
    agent: {
      sellCredits: "ክሬዲት ምሸጥ",
      addMoneyToPlayer: "ናብ ጨዋታ ገንዘብ ምትእስሳር",
    },
  },
  [LOCALES.FR]: {
    common: {
      welcome: "Bienvenue sur GoalBet",
      login: "Connexion",
      logout: "Déconnexion",
      home: "Accueil",
      settings: "Paramètres",
      language: "Langue",
    },
    agent: {
      sellCredits: "Vendre des Crédits",
      addMoneyToPlayer: "Ajouter de l'Argent au Joueur",
    },
  },
}

export const getTranslation = (locale, namespace, key) => {
  return translations[locale]?.[namespace]?.[key] || translations[LOCALES.EN][namespace]?.[key] || key
}

export const isRTL = (locale) => {
  return RTL_LOCALES.includes(locale)
}

export const getCurrency = (locale) => {
  return CURRENCY_BY_LOCALE[locale] || "USD"
}

export const formatCurrency = (amount, locale) => {
  const currency = getCurrency(locale)
  const currencyInfo = CURRENCIES[currency]
  return new Intl.NumberFormat(currencyInfo?.locale || locale, {
    style: "currency",
    currency,
  }).format(amount)
}

export const formatDate = (date, locale) => {
  return new Intl.DateTimeFormat(locale).format(new Date(date))
}

export const setLocale = (locale) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("preferred_locale", locale)
    document.documentElement.lang = locale
    document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr"
  }
}

export const getLocale = () => {
  if (typeof window === "undefined") {
    return LOCALES.EN
  }
  return localStorage.getItem("preferred_locale") || LOCALES.EN
}
