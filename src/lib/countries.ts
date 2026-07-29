export interface Country {
  code: string;
  nameAr: string;
  nameEn: string;
}

export const ALL_COUNTRIES: Country[] = [
  // Arab World
  { code: 'EG', nameAr: 'مصر', nameEn: 'Egypt' },
  { code: 'SA', nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia' },
  { code: 'AE', nameAr: 'الإمارات العربية المتحدة', nameEn: 'United Arab Emirates' },
  { code: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait' },
  { code: 'QA', nameAr: 'قطر', nameEn: 'Qatar' },
  { code: 'BH', nameAr: 'البحرين', nameEn: 'Bahrain' },
  { code: 'OM', nameAr: 'عُمان', nameEn: 'Oman' },
  { code: 'IQ', nameAr: 'العراق', nameEn: 'Iraq' },
  { code: 'JO', nameAr: 'الأردن', nameEn: 'Jordan' },
  { code: 'SY', nameAr: 'سوريا', nameEn: 'Syria' },
  { code: 'LB', nameAr: 'لبنان', nameEn: 'Lebanon' },
  { code: 'PS', nameAr: 'فلسطين', nameEn: 'Palestine' },
  { code: 'YE', nameAr: 'اليمن', nameEn: 'Yemen' },
  { code: 'DZ', nameAr: 'الجزائر', nameEn: 'Algeria' },
  { code: 'MA', nameAr: 'المغرب', nameEn: 'Morocco' },
  { code: 'TN', nameAr: 'تونس', nameEn: 'Tunisia' },
  { code: 'LY', nameAr: 'ليبيا', nameEn: 'Libya' },
  { code: 'SD', nameAr: 'السودان', nameEn: 'Sudan' },
  { code: 'SO', nameAr: 'الصومال', nameEn: 'Somalia' },
  { code: 'MR', nameAr: 'موريتانيا', nameEn: 'Mauritania' },
  { code: 'DJ', nameAr: 'جيبوتي', nameEn: 'Djibouti' },
  { code: 'KM', nameAr: 'جزر القمر', nameEn: 'Comoros' },

  // Rest of Middle East & Africa
  { code: 'TR', nameAr: 'تركيا', nameEn: 'Turkey' },
  { code: 'IR', nameAr: 'إيران', nameEn: 'Iran' },
  { code: 'NG', nameAr: 'نيجيريا', nameEn: 'Nigeria' },
  { code: 'ZA', nameAr: 'جنوب إفريقيا', nameEn: 'South Africa' },
  { code: 'KE', nameAr: 'كينيا', nameEn: 'Kenya' },
  { code: 'GH', nameAr: 'غانا', nameEn: 'Ghana' },
  { code: 'ET', nameAr: 'إثيوبيا', nameEn: 'Ethiopia' },
  { code: 'AO', nameAr: 'أنغولا', nameEn: 'Angola' },
  { code: 'BJ', nameAr: 'بنين', nameEn: 'Benin' },
  { code: 'BW', nameAr: 'بوتسوانا', nameEn: 'Botswana' },
  { code: 'BF', nameAr: 'بوركينا فاسو', nameEn: 'Burkina Faso' },
  { code: 'BI', nameAr: 'بوروندي', nameEn: 'Burundi' },
  { code: 'CM', nameAr: 'الكاميرون', nameEn: 'Cameroon' },
  { code: 'CV', nameAr: 'الرأس الأخضر', nameEn: 'Cape Verde' },
  { code: 'CF', nameAr: 'جمهورية أفريقيا الوسطى', nameEn: 'Central African Republic' },
  { code: 'TD', nameAr: 'تشاد', nameEn: 'Chad' },
  { code: 'CG', nameAr: 'الكونغو - برازافيل', nameEn: 'Congo - Brazzaville' },
  { code: 'CD', nameAr: 'جمهورية الكونغو الديمقراطية', nameEn: 'Congo - Kinshasa' },
  { code: 'CI', nameAr: 'ساحل العاج', nameEn: 'Côte d’Ivoire' },
  { code: 'GQ', nameAr: 'غينيا الاستوائية', nameEn: 'Equatorial Guinea' },
  { code: 'ER', nameAr: 'إريتريا', nameEn: 'Eritrea' },
  { code: 'SZ', nameAr: 'إسواتيني', nameEn: 'Eswatini' },
  { code: 'GA', nameAr: 'الغابون', nameEn: 'Gabon' },
  { code: 'GM', nameAr: 'غامبيا', nameEn: 'Gambia' },
  { code: 'GN', nameAr: 'غينيا', nameEn: 'Guinea' },
  { code: 'GW', nameAr: 'غينيا بيساو', nameEn: 'Guinea-Bissau' },
  { code: 'LS', nameAr: 'ليسوتو', nameEn: 'Lesotho' },
  { code: 'LR', nameAr: 'ليبيريا', nameEn: 'Liberia' },
  { code: 'MG', nameAr: 'مدغشقر', nameEn: 'Madagascar' },
  { code: 'MW', nameAr: 'مالاوي', nameEn: 'Malawi' },
  { code: 'ML', nameAr: 'مالي', nameEn: 'Mali' },
  { code: 'MU', nameAr: 'موريشيوس', nameEn: 'Mauritius' },
  { code: 'MZ', nameAr: 'موزمبيق', nameEn: 'Mozambique' },
  { code: 'NA', nameAr: 'ناميبيا', nameEn: 'Namibia' },
  { code: 'NE', nameAr: 'النيجر', nameEn: 'Niger' },
  { code: 'RW', nameAr: 'رواندا', nameEn: 'Rwanda' },
  { code: 'ST', nameAr: 'ساو تومي وبرينسيب', nameEn: 'São Tomé & Príncipe' },
  { code: 'SN', nameAr: 'السنغال', nameEn: 'Senegal' },
  { code: 'SC', nameAr: 'سيشل', nameEn: 'Seychelles' },
  { code: 'SL', nameAr: 'سيراليون', nameEn: 'Sierra Leone' },
  { code: 'SS', nameAr: 'جنوب السودان', nameEn: 'South Sudan' },
  { code: 'TZ', nameAr: 'تنزانيا', nameEn: 'Tanzania' },
  { code: 'TG', nameAr: 'توغو', nameEn: 'Togo' },
  { code: 'UG', nameAr: 'أوغندا', nameEn: 'Uganda' },
  { code: 'ZM', nameAr: 'زامبيا', nameEn: 'Zambia' },
  { code: 'ZW', nameAr: 'زيمبابوي', nameEn: 'Zimbabwe' },

  // Europe
  { code: 'GB', nameAr: 'المملكة المتحدة', nameEn: 'United Kingdom' },
  { code: 'DE', nameAr: 'ألمانيا', nameEn: 'Germany' },
  { code: 'FR', nameAr: 'فرنسا', nameEn: 'France' },
  { code: 'IT', nameAr: 'إيطاليا', nameEn: 'Italy' },
  { code: 'ES', nameAr: 'إسبانيا', nameEn: 'Spain' },
  { code: 'NL', nameAr: 'هولندا', nameEn: 'Netherlands' },
  { code: 'BE', nameAr: 'بلجيكا', nameEn: 'Belgium' },
  { code: 'CH', nameAr: 'سويسرا', nameEn: 'Switzerland' },
  { code: 'SE', nameAr: 'السويد', nameEn: 'Sweden' },
  { code: 'NO', nameAr: 'النرويج', nameEn: 'Norway' },
  { code: 'DK', nameAr: 'الدنمارك', nameEn: 'Denmark' },
  { code: 'FI', nameAr: 'فنلندا', nameEn: 'Finland' },
  { code: 'RU', nameAr: 'روسيا', nameEn: 'Russia' },
  { code: 'UA', nameAr: 'أوكرانيا', nameEn: 'Ukraine' },
  { code: 'PL', nameAr: 'بولندا', nameEn: 'Poland' },
  { code: 'AT', nameAr: 'النمسا', nameEn: 'Austria' },
  { code: 'GR', nameAr: 'اليونان', nameEn: 'Greece' },
  { code: 'PT', nameAr: 'البرتغال', nameEn: 'Portugal' },
  { code: 'IE', nameAr: 'أيرلندا', nameEn: 'Ireland' },
  { code: 'AL', nameAr: 'ألبانيا', nameEn: 'Albania' },
  { code: 'AD', nameAr: 'أندورا', nameEn: 'Andorra' },
  { code: 'AM', nameAr: 'أرمينيا', nameEn: 'Armenia' },
  { code: 'AZ', nameAr: 'أذربيجان', nameEn: 'Azerbaijan' },
  { code: 'BY', nameAr: 'بيلاروسيا', nameEn: 'Belarus' },
  { code: 'BA', nameAr: 'البوسنة والهرسك', nameEn: 'Bosnia & Herzegovina' },
  { code: 'BG', nameAr: 'بلغاريا', nameEn: 'Bulgaria' },
  { code: 'HR', nameAr: 'كرواتيا', nameEn: 'Croatia' },
  { code: 'CY', nameAr: 'قبرص', nameEn: 'Cyprus' },
  { code: 'CZ', nameAr: 'جمهورية التشيك', nameEn: 'Czechia' },
  { code: 'EE', nameAr: 'إستونيا', nameEn: 'Estonia' },
  { code: 'GE', nameAr: 'جورجيا', nameEn: 'Georgia' },
  { code: 'HU', nameAr: 'المجر', nameEn: 'Hungary' },
  { code: 'IS', nameAr: 'آيسلندا', nameEn: 'Iceland' },
  { code: 'KZ', nameAr: 'كازاخستان', nameEn: 'Kazakhstan' },
  { code: 'XK', nameAr: 'كوسوفو', nameEn: 'Kosovo' },
  { code: 'LV', nameAr: 'لاتفيا', nameEn: 'Latvia' },
  { code: 'LI', nameAr: 'ليختنشتاين', nameEn: 'Liechtenstein' },
  { code: 'LT', nameAr: 'ليتوانيا', nameEn: 'Lithuania' },
  { code: 'LU', nameAr: 'لوكسمبورغ', nameEn: 'Luxembourg' },
  { code: 'MT', nameAr: 'مالطا', nameEn: 'Malta' },
  { code: 'MD', nameAr: 'مولدوفا', nameEn: 'Moldova' },
  { code: 'MC', nameAr: 'موناكو', nameEn: 'Monaco' },
  { code: 'ME', nameAr: 'الجبل الأسود', nameEn: 'Montenegro' },
  { code: 'MK', nameAr: 'مقدونيا الشمالية', nameEn: 'North Macedonia' },
  { code: 'RO', nameAr: 'رومانيا', nameEn: 'Romania' },
  { code: 'SM', nameAr: 'سان مارينو', nameEn: 'San Marino' },
  { code: 'RS', nameAr: 'صربيا', nameEn: 'Serbia' },
  { code: 'SK', nameAr: 'سلوفاكيا', nameEn: 'Slovakia' },
  { code: 'SI', nameAr: 'سلوفينيا', nameEn: 'Slovenia' },
  { code: 'VA', nameAr: 'الفاتيكان', nameEn: 'Vatican City' },

  // Americas
  { code: 'US', nameAr: 'الولايات المتحدة الأمريكية', nameEn: 'United States' },
  { code: 'CA', nameAr: 'كندا', nameEn: 'Canada' },
  { code: 'MX', nameAr: 'المكسيك', nameEn: 'Mexico' },
  { code: 'BR', nameAr: 'البرازيل', nameEn: 'Brazil' },
  { code: 'AR', nameAr: 'الأرجنتين', nameEn: 'Argentina' },
  { code: 'CO', nameAr: 'كولومبيا', nameEn: 'Colombia' },
  { code: 'CL', nameAr: 'تشيلي', nameEn: 'Chile' },
  { code: 'AG', nameAr: 'أنتيغوا وبربودا', nameEn: 'Antigua & Barbuda' },
  { code: 'BS', nameAr: 'البهاما', nameEn: 'Bahamas' },
  { code: 'BB', nameAr: 'باربادوس', nameEn: 'Barbados' },
  { code: 'BZ', nameAr: 'بليز', nameEn: 'Belize' },
  { code: 'BO', nameAr: 'بوليفيا', nameEn: 'Bolivia' },
  { code: 'CR', nameAr: 'كوستاريكا', nameEn: 'Costa Rica' },
  { code: 'CU', nameAr: 'كوبا', nameEn: 'Cuba' },
  { code: 'DM', nameAr: 'دومينيكا', nameEn: 'Dominica' },
  { code: 'DO', nameAr: 'جمهورية الدومينيكان', nameEn: 'Dominican Republic' },
  { code: 'EC', nameAr: 'الإكوادور', nameEn: 'Ecuador' },
  { code: 'SV', nameAr: 'السلفادور', nameEn: 'El Salvador' },
  { code: 'GD', nameAr: 'غرينادا', nameEn: 'Grenada' },
  { code: 'GT', nameAr: 'غواتيمالا', nameEn: 'Guatemala' },
  { code: 'GY', nameAr: 'غيانا', nameEn: 'Guyana' },
  { code: 'HT', nameAr: 'هايتي', nameEn: 'Haiti' },
  { code: 'HN', nameAr: 'هندوراس', nameEn: 'Honduras' },
  { code: 'JM', nameAr: 'جامايكا', nameEn: 'Jamaica' },
  { code: 'NI', nameAr: 'نيكاراغوا', nameEn: 'Nicaragua' },
  { code: 'PA', nameAr: 'بنما', nameEn: 'Panama' },
  { code: 'PY', nameAr: 'باراغواي', nameEn: 'Paraguay' },
  { code: 'PE', nameAr: 'بيرو', nameEn: 'Peru' },
  { code: 'KN', nameAr: 'سانت كيتس ونيفيس', nameEn: 'St. Kitts & Nevis' },
  { code: 'LC', nameAr: 'سانت لوسيا', nameEn: 'St. Lucia' },
  { code: 'VC', nameAr: 'سانت فنسنت والغرينادين', nameEn: 'St. Vincent & Grenadines' },
  { code: 'SR', nameAr: 'سورينام', nameEn: 'Suriname' },
  { code: 'TT', nameAr: 'ترينيداد وتوباغو', nameEn: 'Trinidad & Tobago' },
  { code: 'UY', nameAr: 'أوروغواي', nameEn: 'Uruguay' },
  { code: 'VE', nameAr: 'فنزويلا', nameEn: 'Venezuela' },

  // Asia & Oceania
  { code: 'CN', nameAr: 'الصين', nameEn: 'China' },
  { code: 'JP', nameAr: 'اليابان', nameEn: 'Japan' },
  { code: 'IN', nameAr: 'الهند', nameEn: 'India' },
  { code: 'PK', nameAr: 'باكستان', nameEn: 'Pakistan' },
  { code: 'BD', nameAr: 'بنغلاديش', nameEn: 'Bangladesh' },
  { code: 'KR', nameAr: 'كوريا الجنوبية', nameEn: 'South Korea' },
  { code: 'KP', nameAr: 'كوريا الشمالية', nameEn: 'North Korea' },
  { code: 'ID', nameAr: 'إندونيسيا', nameEn: 'Indonesia' },
  { code: 'MY', nameAr: 'ماليزيا', nameEn: 'Malaysia' },
  { code: 'TH', nameAr: 'تايلاند', nameEn: 'Thailand' },
  { code: 'PH', nameAr: 'الفلبين', nameEn: 'Philippines' },
  { code: 'VN', nameAr: 'فيتنام', nameEn: 'Vietnam' },
  { code: 'AU', nameAr: 'أستراليا', nameEn: 'Australia' },
  { code: 'NZ', nameAr: 'نيوزيلندا', nameEn: 'New Zealand' },
  { code: 'AF', nameAr: 'أفغانستان', nameEn: 'Afghanistan' },
  { code: 'BN', nameAr: 'بروناي', nameEn: 'Brunei' },
  { code: 'KH', nameAr: 'كمبوديا', nameEn: 'Cambodia' },
  { code: 'FJ', nameAr: 'فيجي', nameEn: 'Fiji' },
  { code: 'KG', nameAr: 'قيرغيزستان', nameEn: 'Kyrgyzstan' },
  { code: 'LA', nameAr: 'لاوس', nameEn: 'Laos' },
  { code: 'MV', nameAr: 'جزر المالديف', nameEn: 'Maldives' },
  { code: 'MN', nameAr: 'منغوليا', nameEn: 'Mongolia' },
  { code: 'MM', nameAr: 'ميانمار (بورما)', nameEn: 'Myanmar (Burma)' },
  { code: 'NP', nameAr: 'نيبال', nameEn: 'Nepal' },
  { code: 'PG', nameAr: 'بابوا غينيا الجديدة', nameEn: 'Papua New Guinea' },
  { code: 'SG', nameAr: 'سنغافورة', nameEn: 'Singapore' },
  { code: 'LK', nameAr: 'سريلانكا', nameEn: 'Sri Lanka' },
  { code: 'TJ', nameAr: 'طاجيكستان', nameEn: 'Tajikistan' },
  { code: 'TL', nameAr: 'تيمور الشرقية', nameEn: 'Timor-Leste' },
  { code: 'TM', nameAr: 'تركمانستان', nameEn: 'Turkmenistan' },
  { code: 'UZ', nameAr: 'أوزبكستان', nameEn: 'Uzbekistan' },
  { code: 'VU', nameAr: 'فانواتو', nameEn: 'Vanuatu' },
  { code: 'WS', nameAr: 'ساموا', nameEn: 'Samoa' }
];

const TIMEZONE_MAP: Record<string, string> = {
  'Africa/Cairo': 'EG',
  'Asia/Riyadh': 'SA',
  'Asia/Dubai': 'AE',
  'Asia/Kuwait': 'KW',
  'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Asia/Baghdad': 'IQ',
  'Asia/Amman': 'JO',
  'Asia/Damascus': 'SY',
  'Asia/Beirut': 'LB',
  'Asia/Gaza': 'PS',
  'Asia/Hebron': 'PS',
  'Asia/Aden': 'YE',
  'Africa/Algiers': 'DZ',
  'Africa/Casablanca': 'MA',
  'Africa/Tunis': 'TN',
  'Africa/Tripoli': 'LY',
  'Africa/Khartoum': 'SD',
  'Europe/Istanbul': 'TR',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'America/New_York': 'US',
  'America/Los_Angeles': 'US',
  'America/Chicago': 'US',
};

/**
 * Detect user country via IP Geolocation APIs with fallbacks.
 */
export async function detectUserCountry(): Promise<{ country: Country; ip: string }> {
  let detectedCode = '';
  let ip = '';

  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.country_code) {
        detectedCode = data.country_code.toUpperCase();
        ip = data.ip || '';
      }
    }
  } catch {
    // Continue
  }

  if (!detectedCode) {
    try {
      const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.country_code) {
          detectedCode = data.country_code.toUpperCase();
          ip = data.ip || '';
        }
      }
    } catch {
      // Continue
    }
  }

  if (!detectedCode) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && TIMEZONE_MAP[tz]) {
        detectedCode = TIMEZONE_MAP[tz];
      }
    } catch {
      // Fallback
    }
  }

  if (!detectedCode) {
    detectedCode = 'EG';
  }

  const found = ALL_COUNTRIES.find((c) => c.code === detectedCode) || ALL_COUNTRIES[0];
  return { country: found, ip };
}

export function getSortedCountriesList(detectedCountryCode: string, isAr: boolean = true) {
  const detected = ALL_COUNTRIES.find((c) => c.code === detectedCountryCode) || ALL_COUNTRIES[0];

  const remaining = ALL_COUNTRIES.filter((c) => c.code !== detected.code).sort((a, b) => {
    const nameA = isAr ? a.nameAr : a.nameEn;
    const nameB = isAr ? b.nameAr : b.nameEn;
    return nameA.localeCompare(nameB, isAr ? 'ar' : 'en');
  });

  return {
    detectedCountry: detected,
    sortedList: [detected, ...remaining],
  };
}

export const DIAL_CODES_MAP: Record<string, { dialCode: string; phoneLength: number; placeholder: string }> = {
  EG: { dialCode: '20+', phoneLength: 10, placeholder: '--- --- ---' },
  SA: { dialCode: '966+', phoneLength: 9, placeholder: '--- --- ---' },
  AE: { dialCode: '971+', phoneLength: 9, placeholder: '--- --- ---' },
  KW: { dialCode: '965+', phoneLength: 8, placeholder: '---- ----' },
  QA: { dialCode: '974+', phoneLength: 8, placeholder: '---- ----' },
  BH: { dialCode: '973+', phoneLength: 8, placeholder: '---- ----' },
  OM: { dialCode: '968+', phoneLength: 8, placeholder: '---- ----' },
  IQ: { dialCode: '964+', phoneLength: 10, placeholder: '--- --- ---' },
  JO: { dialCode: '962+', phoneLength: 9, placeholder: '--- --- ---' },
  SY: { dialCode: '963+', phoneLength: 9, placeholder: '--- --- ---' },
  LB: { dialCode: '961+', phoneLength: 8, placeholder: '---- ----' },
  PS: { dialCode: '970+', phoneLength: 9, placeholder: '--- --- ---' },
  YE: { dialCode: '967+', phoneLength: 9, placeholder: '--- --- ---' },
  DZ: { dialCode: '213+', phoneLength: 9, placeholder: '--- --- ---' },
  MA: { dialCode: '212+', phoneLength: 9, placeholder: '--- --- ---' },
  TN: { dialCode: '216+', phoneLength: 8, placeholder: '---- ----' },
  LY: { dialCode: '218+', phoneLength: 9, placeholder: '--- --- ---' },
  SD: { dialCode: '249+', phoneLength: 9, placeholder: '--- --- ---' },
  SO: { dialCode: '252+', phoneLength: 9, placeholder: '--- --- ---' },
  MR: { dialCode: '222+', phoneLength: 8, placeholder: '---- ----' },
  DJ: { dialCode: '253+', phoneLength: 8, placeholder: '---- ----' },
  KM: { dialCode: '269+', phoneLength: 7, placeholder: '--- ----' },
  TR: { dialCode: '90+', phoneLength: 10, placeholder: '--- --- ----' },
  IR: { dialCode: '98+', phoneLength: 10, placeholder: '--- --- ----' },
  NG: { dialCode: '234+', phoneLength: 10, placeholder: '--- --- ----' },
  ZA: { dialCode: '27+', phoneLength: 9, placeholder: '--- --- ---' },
  KE: { dialCode: '254+', phoneLength: 9, placeholder: '--- --- ---' },
  GH: { dialCode: '233+', phoneLength: 9, placeholder: '--- --- ---' },
  ET: { dialCode: '251+', phoneLength: 9, placeholder: '--- --- ---' },
  GB: { dialCode: '44+', phoneLength: 10, placeholder: '---- ------' },
  DE: { dialCode: '49+', phoneLength: 11, placeholder: '---- -------' },
  FR: { dialCode: '33+', phoneLength: 9, placeholder: '--- --- ---' },
  IT: { dialCode: '39+', phoneLength: 10, placeholder: '--- -------' },
  ES: { dialCode: '34+', phoneLength: 9, placeholder: '--- --- ---' },
  NL: { dialCode: '31+', phoneLength: 9, placeholder: '--- --- ---' },
  RU: { dialCode: '7+', phoneLength: 10, placeholder: '--- --- ----' },
  US: { dialCode: '1+', phoneLength: 10, placeholder: '--- --- ----' },
  CA: { dialCode: '1+', phoneLength: 10, placeholder: '--- --- ----' },
  MX: { dialCode: '52+', phoneLength: 10, placeholder: '--- --- ----' },
  BR: { dialCode: '55+', phoneLength: 11, placeholder: '----- ----' },
  AR: { dialCode: '54+', phoneLength: 10, placeholder: '--- --- ----' },
  CN: { dialCode: '86+', phoneLength: 11, placeholder: '----- ----' },
  JP: { dialCode: '81+', phoneLength: 10, placeholder: '---- ----' },
  IN: { dialCode: '91+', phoneLength: 10, placeholder: '----- -----' },
  PK: { dialCode: '92+', phoneLength: 10, placeholder: '--- -------' },
  BD: { dialCode: '880+', phoneLength: 10, placeholder: '---- ------' },
  KR: { dialCode: '82+', phoneLength: 10, placeholder: '--- ---- ----' },
  ID: { dialCode: '62+', phoneLength: 11, placeholder: '---- ------' },
  MY: { dialCode: '60+', phoneLength: 9, placeholder: '--- -------' },
  TH: { dialCode: '66+', phoneLength: 9, placeholder: '--- --- ---' },
  PH: { dialCode: '63+', phoneLength: 10, placeholder: '--- --- ----' },
  VN: { dialCode: '84+', phoneLength: 9, placeholder: '--- --- ---' },
  AU: { dialCode: '61+', phoneLength: 9, placeholder: '--- --- ---' },
};

export function getCountryDialInfo(countryNameOrCode: string) {
  const countryObj = ALL_COUNTRIES.find(
    (c) => c.code === countryNameOrCode || c.nameAr === countryNameOrCode || c.nameEn === countryNameOrCode
  );
  const code = countryObj?.code || 'EG';
  const info = DIAL_CODES_MAP[code] || { dialCode: '20+', phoneLength: 10, placeholder: '--- --- ---' };
  return {
    countryObj,
    dialCode: info.dialCode,
    phoneLength: info.phoneLength,
    placeholder: info.placeholder,
  };
}

