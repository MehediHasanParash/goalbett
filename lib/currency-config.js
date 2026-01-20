export const CURRENCIES = {
  // Fiat Currencies - Main list from pasted-text.txt
  USD: { code: "USD", name: "United States Dollar", symbol: "$", locale: "en-US" },
  EUR: { code: "EUR", name: "Euro", symbol: "€", locale: "en-GB" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", locale: "en-NG" },
  KES: { code: "KES", name: "Kenyan Shilling", symbol: "Sh", locale: "en-KE" },
  GHS: { code: "GHS", name: "Ghana Cedi", symbol: "₵", locale: "en-GH" },
  ZAR: { code: "ZAR", name: "South African Rand", symbol: "R", locale: "en-ZA" },
  UGX: { code: "UGX", name: "Ugandan Shilling", symbol: "Sh", locale: "en-UG" },
  TZS: { code: "TZS", name: "Tanzanian Shilling", symbol: "Sh", locale: "sw-TZ" },
  ETB: { code: "ETB", name: "Ethiopian Birr", symbol: "Br", locale: "am-ET" },
  ERN: { code: "ERN", name: "Eritrean Nakfa", symbol: "Nfk", locale: "en-ER" },
  RWF: { code: "RWF", name: "Rwandan Franc", symbol: "Fr", locale: "rw-RW" },
  BIF: { code: "BIF", name: "Burundian Franc", symbol: "Fr", locale: "fr-BI" },
  MWK: { code: "MWK", name: "Malawian Kwacha", symbol: "MK", locale: "en-MW" },
  ZMW: { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", locale: "en-ZM" },
  AOA: { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", locale: "pt-AO" },
  MZN: { code: "MZN", name: "Mozambican Metical", symbol: "MT", locale: "pt-MZ" },
  XOF: { code: "XOF", name: "West African CFA Franc", symbol: "Fr", locale: "fr-SN" },
  XAF: { code: "XAF", name: "Central African CFA Franc", symbol: "Fr", locale: "fr-CM" },
  MAD: { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", locale: "ar-MA" },
  EGP: { code: "EGP", name: "Egyptian Pound", symbol: "£", locale: "ar-EG" },
  DZD: { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", locale: "ar-DZ" },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "﷼", locale: "ar-SA" },
  AED: { code: "AED", name: "UAE Dirham", symbol: "د.إ", locale: "ar-AE" },
  TRY: { code: "TRY", name: "Turkish Lira", symbol: "₺", locale: "tr-TR" },
  RUB: { code: "RUB", name: "Russian Ruble", symbol: "₽", locale: "ru-RU" },
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "hi-IN" },
  PKR: { code: "PKR", name: "Pakistani Rupee", symbol: "₨", locale: "en-PK" },
  BDT: { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", locale: "bn-BD" },
  BRL: { code: "BRL", name: "Brazilian Real", symbol: "R$", locale: "pt-BR" },
  MXN: { code: "MXN", name: "Mexican Peso", symbol: "$", locale: "es-MX" },

  // Cryptocurrencies
  USDT_TRC20: { code: "USDT_TRC20", name: "USDT (TRC20)", symbol: "₮", locale: "en-US", isCrypto: true },
  USDT_ERC20: { code: "USDT_ERC20", name: "USDT (ERC20)", symbol: "₮", locale: "en-US", isCrypto: true },
  BTC: { code: "BTC", name: "Bitcoin", symbol: "₿", locale: "en-US", isCrypto: true },
  ETH: { code: "ETH", name: "Ethereum", symbol: "Ξ", locale: "en-US", isCrypto: true },
}

export const LANGUAGES = {
  en: { code: "en", name: "English", nativeName: "English" },
  fr: { code: "fr", name: "French", nativeName: "Français" },
  es: { code: "es", name: "Spanish", nativeName: "Español" },
  pt: { code: "pt", name: "Portuguese", nativeName: "Português" },
  ar: { code: "ar", name: "Arabic", nativeName: "العربية" },
  sw: { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  ha: { code: "ha", name: "Hausa", nativeName: "Hausa" },
  yo: { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
  ig: { code: "ig", name: "Igbo", nativeName: "Igbo" },
  am: { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  ti: { code: "ti", name: "Tigrinya", nativeName: "ትግርኛ" },
  om: { code: "om", name: "Oromo", nativeName: "Oromoo" },
  so: { code: "so", name: "Somali", nativeName: "Soomaali" },
  zu: { code: "zu", name: "isiZulu", nativeName: "isiZulu" },
  sn: { code: "sn", name: "Shona", nativeName: "chiShona" },
  ny: { code: "ny", name: "Chichewa", nativeName: "Chichewa" },
  ln: { code: "ln", name: "Lingala", nativeName: "Lingála" },
  ts: { code: "ts", name: "Xitsonga", nativeName: "Xitsonga" },
  st: { code: "st", name: "Sesotho", nativeName: "Sesotho" },
  tn: { code: "tn", name: "Setswana", nativeName: "Setswana" },
  af: { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
  de: { code: "de", name: "German", nativeName: "Deutsch" },
  it: { code: "it", name: "Italian", nativeName: "Italiano" },
  tr: { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  ru: { code: "ru", name: "Russian", nativeName: "Русский" },
  hi: { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  ur: { code: "ur", name: "Urdu", nativeName: "اردو" },
}

// Generate dropdown options for UI components
export const CURRENCY_OPTIONS = Object.values(CURRENCIES).map((curr) => ({
  value: curr.code,
  label: `${curr.code} – ${curr.name}`,
  symbol: curr.symbol,
  isCrypto: curr.isCrypto || false,
}))

export const UNIQUE_CURRENCY_OPTIONS = CURRENCY_OPTIONS

export const LANGUAGE_OPTIONS = Object.values(LANGUAGES).map((lang) => ({
  value: lang.code,
  label: lang.name,
  nativeName: lang.nativeName,
}))

// Get currency info by code
export const getCurrencyByCode = (code) => {
  return Object.values(CURRENCIES).find((curr) => curr.code === code) || null
}

// Get language info by code
export const getLanguageByCode = (code) => {
  return LANGUAGES[code] || null
}

export const CURRENCY_CONFIG_BY_LANGUAGE = {
  English: {
    name: "English",
    currencies: [CURRENCIES.USD, CURRENCIES.GBP, CURRENCIES.KES, CURRENCIES.ZAR, CURRENCIES.NGN],
  },
  French: {
    name: "French",
    currencies: [CURRENCIES.EUR, CURRENCIES.XOF, CURRENCIES.XAF],
  },
  Spanish: {
    name: "Spanish",
    currencies: [CURRENCIES.EUR, CURRENCIES.MXN],
  },
  Portuguese: {
    name: "Portuguese",
    currencies: [CURRENCIES.BRL, CURRENCIES.MZN, CURRENCIES.AOA],
  },
  Arabic: {
    name: "Arabic",
    currencies: [CURRENCIES.AED, CURRENCIES.SAR, CURRENCIES.EGP, CURRENCIES.DZD, CURRENCIES.MAD],
  },
  Swahili: {
    name: "Swahili",
    currencies: [CURRENCIES.KES, CURRENCIES.TZS, CURRENCIES.UGX],
  },
  Hausa: {
    name: "Hausa",
    currencies: [CURRENCIES.NGN, CURRENCIES.XOF],
  },
  Yoruba: {
    name: "Yoruba",
    currencies: [CURRENCIES.NGN],
  },
  Igbo: {
    name: "Igbo",
    currencies: [CURRENCIES.NGN],
  },
  Amharic: {
    name: "Amharic",
    currencies: [CURRENCIES.ETB],
  },
  Tigrinya: {
    name: "Tigrinya",
    currencies: [CURRENCIES.ETB, CURRENCIES.ERN],
  },
  Oromo: {
    name: "Oromo",
    currencies: [CURRENCIES.ETB],
  },
  Somali: {
    name: "Somali",
    currencies: [CURRENCIES.USD, CURRENCIES.KES],
  },
  isiZulu: {
    name: "isiZulu",
    currencies: [CURRENCIES.ZAR],
  },
  Shona: {
    name: "Shona",
    currencies: [CURRENCIES.USD, CURRENCIES.ZAR],
  },
  Chichewa: {
    name: "Chichewa",
    currencies: [CURRENCIES.MWK],
  },
  Lingala: {
    name: "Lingala",
    currencies: [CURRENCIES.XAF],
  },
  Xitsonga: {
    name: "Xitsonga",
    currencies: [CURRENCIES.ZAR, CURRENCIES.MZN],
  },
  Sesotho: {
    name: "Sesotho",
    currencies: [CURRENCIES.ZAR],
  },
  Setswana: {
    name: "Setswana",
    currencies: [CURRENCIES.ZAR],
  },
  Afrikaans: {
    name: "Afrikaans",
    currencies: [CURRENCIES.ZAR],
  },
  German: {
    name: "German",
    currencies: [CURRENCIES.EUR],
  },
  Italian: {
    name: "Italian",
    currencies: [CURRENCIES.EUR],
  },
  Turkish: {
    name: "Turkish",
    currencies: [CURRENCIES.TRY],
  },
  Russian: {
    name: "Russian",
    currencies: [CURRENCIES.RUB],
  },
  Hindi: {
    name: "Hindi",
    currencies: [CURRENCIES.INR],
  },
  Urdu: {
    name: "Urdu",
    currencies: [CURRENCIES.PKR, CURRENCIES.INR],
  },
}

export const SUPPORTED_LANGUAGES = LANGUAGE_OPTIONS
export const CURRENCY_CONFIG = CURRENCY_CONFIG_BY_LANGUAGE
