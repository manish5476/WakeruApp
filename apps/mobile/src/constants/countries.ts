// src/constants/countries.ts

export interface CountryData {
  code: string;
  name: string;
  emoji: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
}

export interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}

export const POPULAR_COUNTRY_CODES = [
  'IN',
  'US',
  'AE',
  'GB',
  'FR',
  'SG',
  'TH',
  'JP',
  'ID',
  'MY',
  'AU',
  'CH',
  'IT',
  'ES',
  'DE',
  'CA',
  'VN',
  'TR',
  'EG',
  'SA',
];

export const WORLD_COUNTRIES: CountryData[] = [
  {
    code: 'IN',
    name: 'India',
    emoji: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    currencyName: 'Indian Rupee',
  },
  {
    code: 'US',
    name: 'United States',
    emoji: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    currencyName: 'US Dollar',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    emoji: '🇦🇪',
    currency: 'AED',
    currencySymbol: 'AED ',
    currencyName: 'UAE Dirham',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    emoji: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    currencyName: 'British Pound',
  },
  {
    code: 'FR',
    name: 'France',
    emoji: '🇫🇷',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'DE',
    name: 'Germany',
    emoji: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'IT',
    name: 'Italy',
    emoji: '🇮🇹',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'ES',
    name: 'Spain',
    emoji: '🇪🇸',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'SG',
    name: 'Singapore',
    emoji: '🇸🇬',
    currency: 'SGD',
    currencySymbol: 'S$',
    currencyName: 'Singapore Dollar',
  },
  {
    code: 'TH',
    name: 'Thailand',
    emoji: '🇹🇭',
    currency: 'THB',
    currencySymbol: '฿',
    currencyName: 'Thai Baht',
  },
  {
    code: 'JP',
    name: 'Japan',
    emoji: '🇯🇵',
    currency: 'JPY',
    currencySymbol: '¥',
    currencyName: 'Japanese Yen',
  },
  {
    code: 'ID',
    name: 'Indonesia',
    emoji: '🇮🇩',
    currency: 'IDR',
    currencySymbol: 'Rp ',
    currencyName: 'Indonesian Rupiah',
  },
  {
    code: 'MY',
    name: 'Malaysia',
    emoji: '🇲🇾',
    currency: 'MYR',
    currencySymbol: 'RM ',
    currencyName: 'Malaysian Ringgit',
  },
  {
    code: 'AU',
    name: 'Australia',
    emoji: '🇦🇺',
    currency: 'AUD',
    currencySymbol: 'A$',
    currencyName: 'Australian Dollar',
  },
  {
    code: 'CA',
    name: 'Canada',
    emoji: '🇨🇦',
    currency: 'CAD',
    currencySymbol: 'C$',
    currencyName: 'Canadian Dollar',
  },
  {
    code: 'CH',
    name: 'Switzerland',
    emoji: '🇨🇭',
    currency: 'CHF',
    currencySymbol: 'CHF ',
    currencyName: 'Swiss Franc',
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    emoji: '🇸🇦',
    currency: 'SAR',
    currencySymbol: 'SAR ',
    currencyName: 'Saudi Riyal',
  },
  {
    code: 'VN',
    name: 'Vietnam',
    emoji: '🇻🇳',
    currency: 'VND',
    currencySymbol: '₫',
    currencyName: 'Vietnamese Dong',
  },
  {
    code: 'TR',
    name: 'Turkey',
    emoji: '🇹🇷',
    currency: 'TRY',
    currencySymbol: '₺',
    currencyName: 'Turkish Lira',
  },
  {
    code: 'EG',
    name: 'Egypt',
    emoji: '🇪🇬',
    currency: 'EGP',
    currencySymbol: 'E£ ',
    currencyName: 'Egyptian Pound',
  },
  {
    code: 'KR',
    name: 'South Korea',
    emoji: '🇰🇷',
    currency: 'KRW',
    currencySymbol: '₩',
    currencyName: 'South Korean Won',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    emoji: '🇳🇱',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'GR',
    name: 'Greece',
    emoji: '🇬🇷',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'PT',
    name: 'Portugal',
    emoji: '🇵🇹',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'AT',
    name: 'Austria',
    emoji: '🇦🇹',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'BE',
    name: 'Belgium',
    emoji: '🇧🇪',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'IE',
    name: 'Ireland',
    emoji: '🇮🇪',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'SE',
    name: 'Sweden',
    emoji: '🇸🇪',
    currency: 'SEK',
    currencySymbol: 'kr ',
    currencyName: 'Swedish Krona',
  },
  {
    code: 'NO',
    name: 'Norway',
    emoji: '🇳🇴',
    currency: 'NOK',
    currencySymbol: 'kr ',
    currencyName: 'Norwegian Krone',
  },
  {
    code: 'DK',
    name: 'Denmark',
    emoji: '🇩🇰',
    currency: 'DKK',
    currencySymbol: 'kr ',
    currencyName: 'Danish Krone',
  },
  {
    code: 'FI',
    name: 'Finland',
    emoji: '🇫🇮',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    emoji: '🇳🇿',
    currency: 'NZD',
    currencySymbol: 'NZ$',
    currencyName: 'New Zealand Dollar',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    emoji: '🇿🇦',
    currency: 'ZAR',
    currencySymbol: 'R ',
    currencyName: 'South African Rand',
  },
  {
    code: 'BR',
    name: 'Brazil',
    emoji: '🇧🇷',
    currency: 'BRL',
    currencySymbol: 'R$',
    currencyName: 'Brazilian Real',
  },
  {
    code: 'MX',
    name: 'Mexico',
    emoji: '🇲🇽',
    currency: 'MXN',
    currencySymbol: 'Mex$',
    currencyName: 'Mexican Peso',
  },
  {
    code: 'RU',
    name: 'Russia',
    emoji: '🇷🇺',
    currency: 'RUB',
    currencySymbol: '₽',
    currencyName: 'Russian Ruble',
  },
  {
    code: 'CN',
    name: 'China',
    emoji: '🇨🇳',
    currency: 'CNY',
    currencySymbol: '¥',
    currencyName: 'Chinese Yuan',
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    emoji: '🇭🇰',
    currency: 'HKD',
    currencySymbol: 'HK$',
    currencyName: 'Hong Kong Dollar',
  },
  {
    code: 'TW',
    name: 'Taiwan',
    emoji: '🇹🇼',
    currency: 'TWD',
    currencySymbol: 'NT$',
    currencyName: 'New Taiwan Dollar',
  },
  {
    code: 'PH',
    name: 'Philippines',
    emoji: '🇵🇭',
    currency: 'PHP',
    currencySymbol: '₱',
    currencyName: 'Philippine Peso',
  },
  {
    code: 'LK',
    name: 'Sri Lanka',
    emoji: '🇱🇰',
    currency: 'LKR',
    currencySymbol: 'Rs ',
    currencyName: 'Sri Lankan Rupee',
  },
  {
    code: 'NP',
    name: 'Nepal',
    emoji: '🇳🇵',
    currency: 'NPR',
    currencySymbol: 'Rs ',
    currencyName: 'Nepalese Rupee',
  },
  {
    code: 'MV',
    name: 'Maldives',
    emoji: '🇲🇻',
    currency: 'MVR',
    currencySymbol: 'Rf ',
    currencyName: 'Maldivian Rufiyaa',
  },
  {
    code: 'OM',
    name: 'Oman',
    emoji: '🇴🇲',
    currency: 'OMR',
    currencySymbol: 'OMR ',
    currencyName: 'Omani Rial',
  },
  {
    code: 'QA',
    name: 'Qatar',
    emoji: '🇶🇦',
    currency: 'QAR',
    currencySymbol: 'QAR ',
    currencyName: 'Qatari Riyal',
  },
  {
    code: 'BH',
    name: 'Bahrain',
    emoji: '🇧🇭',
    currency: 'BHD',
    currencySymbol: 'BD ',
    currencyName: 'Bahraini Dinar',
  },
  {
    code: 'KW',
    name: 'Kuwait',
    emoji: '🇰🇼',
    currency: 'KWD',
    currencySymbol: 'KD ',
    currencyName: 'Kuwaiti Dinar',
  },
  {
    code: 'JO',
    name: 'Jordan',
    emoji: '🇯🇴',
    currency: 'JOD',
    currencySymbol: 'JD ',
    currencyName: 'Jordanian Dinar',
  },
  {
    code: 'IL',
    name: 'Israel',
    emoji: '🇮🇱',
    currency: 'ILS',
    currencySymbol: '₪',
    currencyName: 'Israeli Shekel',
  },
  {
    code: 'MU',
    name: 'Mauritius',
    emoji: '🇲🇺',
    currency: 'MUR',
    currencySymbol: 'Rs ',
    currencyName: 'Mauritian Rupee',
  },
  {
    code: 'SC',
    name: 'Seychelles',
    emoji: '🇸🇨',
    currency: 'SCR',
    currencySymbol: 'SR ',
    currencyName: 'Seychellois Rupee',
  },
  {
    code: 'KE',
    name: 'Kenya',
    emoji: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh ',
    currencyName: 'Kenyan Shilling',
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    emoji: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh ',
    currencyName: 'Tanzanian Shilling',
  },
  {
    code: 'MA',
    name: 'Morocco',
    emoji: '🇲🇦',
    currency: 'MAD',
    currencySymbol: 'MAD ',
    currencyName: 'Moroccan Dirham',
  },
  {
    code: 'PL',
    name: 'Poland',
    emoji: '🇵🇱',
    currency: 'PLN',
    currencySymbol: 'zł',
    currencyName: 'Polish Zloty',
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    emoji: '🇨🇿',
    currency: 'CZK',
    currencySymbol: 'Kč',
    currencyName: 'Czech Koruna',
  },
  {
    code: 'HU',
    name: 'Hungary',
    emoji: '🇭🇺',
    currency: 'HUF',
    currencySymbol: 'Ft ',
    currencyName: 'Hungarian Forint',
  },
  {
    code: 'RO',
    name: 'Romania',
    emoji: '🇷🇴',
    currency: 'RON',
    currencySymbol: 'lei ',
    currencyName: 'Romanian Leu',
  },
  {
    code: 'HR',
    name: 'Croatia',
    emoji: '🇭🇷',
    currency: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
  },
  {
    code: 'IS',
    name: 'Iceland',
    emoji: '🇮🇸',
    currency: 'ISK',
    currencySymbol: 'kr ',
    currencyName: 'Icelandic Krona',
  },
  {
    code: 'AR',
    name: 'Argentina',
    emoji: '🇦🇷',
    currency: 'ARS',
    currencySymbol: '$',
    currencyName: 'Argentine Peso',
  },
  {
    code: 'CL',
    name: 'Chile',
    emoji: '🇨🇱',
    currency: 'CLP',
    currencySymbol: '$',
    currencyName: 'Chilean Peso',
  },
  {
    code: 'CO',
    name: 'Colombia',
    emoji: '🇨🇴',
    currency: 'COP',
    currencySymbol: '$',
    currencyName: 'Colombian Peso',
  },
  {
    code: 'PE',
    name: 'Peru',
    emoji: '🇵🇪',
    currency: 'PEN',
    currencySymbol: 'S/ ',
    currencyName: 'Peruvian Sol',
  },
  {
    code: 'CR',
    name: 'Costa Rica',
    emoji: '🇨🇷',
    currency: 'CRC',
    currencySymbol: '₡',
    currencyName: 'Costa Rican Colon',
  },
  {
    code: 'PA',
    name: 'Panama',
    emoji: '🇵🇦',
    currency: 'USD',
    currencySymbol: '$',
    currencyName: 'US Dollar',
  },
  {
    code: 'GE',
    name: 'Georgia',
    emoji: '🇬🇪',
    currency: 'GEL',
    currencySymbol: '₾',
    currencyName: 'Georgian Lari',
  },
  {
    code: 'AZ',
    name: 'Azerbaijan',
    emoji: '🇦🇿',
    currency: 'AZN',
    currencySymbol: '₼',
    currencyName: 'Azerbaijani Manat',
  },
  {
    code: 'KZ',
    name: 'Kazakhstan',
    emoji: '🇰🇿',
    currency: 'KZT',
    currencySymbol: '₸',
    currencyName: 'Kazakhstani Tenge',
  },
  {
    code: 'UZ',
    name: 'Uzbekistan',
    emoji: 'UZ',
    currency: 'UZS',
    currencySymbol: 'soʻm ',
    currencyName: 'Uzbekistani Som',
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    emoji: '🇧🇩',
    currency: 'BDT',
    currencySymbol: '৳',
    currencyName: 'Bangladeshi Taka',
  },
  {
    code: 'PK',
    name: 'Pakistan',
    emoji: '🇵🇰',
    currency: 'PKR',
    currencySymbol: 'Rs ',
    currencyName: 'Pakistani Rupee',
  },
  {
    code: 'BT',
    name: 'Bhutan',
    emoji: '🇧🇹',
    currency: 'BTN',
    currencySymbol: 'Nu ',
    currencyName: 'Bhutanese Ngultrum',
  },
  {
    code: 'MM',
    name: 'Myanmar',
    emoji: '🇲🇲',
    currency: 'MMK',
    currencySymbol: 'K ',
    currencyName: 'Myanmar Kyat',
  },
  {
    code: 'KH',
    name: 'Cambodia',
    emoji: '🇰🇭',
    currency: 'USD',
    currencySymbol: '$',
    currencyName: 'US Dollar',
  },
  {
    code: 'LA',
    name: 'Laos',
    emoji: '🇱🇦',
    currency: 'LAK',
    currencySymbol: '₭',
    currencyName: 'Lao Kip',
  },
  {
    code: 'FJ',
    name: 'Fiji',
    emoji: '🇫🇯',
    currency: 'FJD',
    currencySymbol: 'FJ$',
    currencyName: 'Fijian Dollar',
  },
];

export const COUNTRY_CURRENCY_MAP: Record<string, CountryData> =
  WORLD_COUNTRIES.reduce(
    (acc, item) => {
      acc[item.code] = item;
      return acc;
    },
    {} as Record<string, CountryData>,
  );

export const SUPPORTED_CURRENCIES: CurrencyData[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED ', flag: '🇦🇪' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF ', flag: '🇨🇭' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM ', flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp ', flag: '🇮🇩' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR ', flag: '🇸🇦' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR ', flag: '🇶🇦' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR ', flag: '🇴🇲' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD ', flag: '🇰🇼' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD ', flag: '🇧🇭' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R ', flag: '🇿🇦' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr ', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr ', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr ', flag: '🇩🇰' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£ ', flag: '🇪🇬' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf ', flag: '🇲🇻' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs ', flag: '🇱🇰' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs ', flag: '🇳🇵' },
];

export function getCountryByCode(code?: string): CountryData | undefined {
  if (!code) return undefined;
  return COUNTRY_CURRENCY_MAP[code.toUpperCase()];
}

export function getCurrencyInfo(code?: string): CurrencyData {
  const found = SUPPORTED_CURRENCIES.find(c => c.code === code?.toUpperCase());
  if (found) return found;
  return {
    code: code?.toUpperCase() || 'INR',
    name: code?.toUpperCase() || 'Currency',
    symbol: code?.toUpperCase() || '₹',
  };
}

export interface QuickBudgetOption {
  amount: number;
  label: string;
}

export function getQuickBudgets(
  currencyCode: string = 'INR',
): QuickBudgetOption[] {
  const code = currencyCode.toUpperCase();
  const info = getCurrencyInfo(code);
  const sym = info.symbol.trim();

  switch (code) {
    case 'INR':
      return [
        { amount: 10000, label: `+${sym}10k` },
        { amount: 25000, label: `+${sym}25k` },
        { amount: 50000, label: `+${sym}50k` },
        { amount: 100000, label: `+${sym}1L` },
      ];
    case 'USD':
    case 'EUR':
    case 'GBP':
    case 'CHF':
    case 'AUD':
    case 'CAD':
    case 'SGD':
    case 'NZD':
      return [
        { amount: 500, label: `+${sym}500` },
        { amount: 1000, label: `+${sym}1k` },
        { amount: 2500, label: `+${sym}2.5k` },
        { amount: 5000, label: `+${sym}5k` },
      ];
    case 'AED':
    case 'SAR':
    case 'QAR':
      return [
        { amount: 2000, label: `+${sym} 2k` },
        { amount: 5000, label: `+${sym} 5k` },
        { amount: 10000, label: `+${sym} 10k` },
        { amount: 20000, label: `+${sym} 20k` },
      ];
    case 'THB':
    case 'TRY':
    case 'ZAR':
      return [
        { amount: 15000, label: `+${sym}15k` },
        { amount: 30000, label: `+${sym}30k` },
        { amount: 60000, label: `+${sym}60k` },
        { amount: 120000, label: `+${sym}120k` },
      ];
    case 'JPY':
      return [
        { amount: 50000, label: `+${sym}50k` },
        { amount: 100000, label: `+${sym}100k` },
        { amount: 250000, label: `+${sym}250k` },
        { amount: 500000, label: `+${sym}500k` },
      ];
    case 'KRW':
    case 'IDR':
    case 'VND':
      return [
        { amount: 500000, label: `+500k` },
        { amount: 1000000, label: `+1M` },
        { amount: 2500000, label: `+2.5M` },
        { amount: 5000000, label: `+5M` },
      ];
    default:
      return [
        { amount: 1000, label: `+${sym}1k` },
        { amount: 5000, label: `+${sym}5k` },
        { amount: 10000, label: `+${sym}10k` },
        { amount: 25000, label: `+${sym}25k` },
      ];
  }
}
