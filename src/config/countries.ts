import { CurrencyConfig, DeliveryConfig, SupportedCountry } from '../types';

export const SUPPORTED_COUNTRIES: SupportedCountry[] = ['Bangladesh', 'India', 'Pakistan'];

export const COUNTRY_CURRENCIES: Record<SupportedCountry, CurrencyConfig> = {
  Bangladesh: {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    phoneCode: '+880',
    exchangeRateFromBDT: 1.0,
  },
  India: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    phoneCode: '+91',
    exchangeRateFromBDT: 0.70,
  },
  Pakistan: {
    code: 'PKR',
    symbol: '₨',
    name: 'Pakistani Rupee',
    phoneCode: '+92',
    exchangeRateFromBDT: 2.30,
  },
};

export const DELIVERY_CONFIGS: Record<SupportedCountry, DeliveryConfig> = {
  Bangladesh: {
    country: 'Bangladesh',
    defaultCodCharge: 100, // 100 BDT
    outsideCityCharge: 150,
    currency: 'BDT',
    symbol: '৳',
  },
  India: {
    country: 'India',
    defaultCodCharge: 150, // 150 INR
    outsideCityCharge: 200,
    currency: 'INR',
    symbol: '₹',
  },
  Pakistan: {
    country: 'Pakistan',
    defaultCodCharge: 450, // 450 PKR
    outsideCityCharge: 550,
    currency: 'PKR',
    symbol: '₨',
  },
};

export const COUNTRY_DELIVERY_CONFIGS: Record<
  SupportedCountry,
  { country: SupportedCountry; baseDeliveryCharge: number; outsideCityCharge: number; currency: string; currencySymbol: string }
> = {
  Bangladesh: {
    country: 'Bangladesh',
    baseDeliveryCharge: 100,
    outsideCityCharge: 150,
    currency: 'BDT',
    currencySymbol: '৳',
  },
  India: {
    country: 'India',
    baseDeliveryCharge: 150,
    outsideCityCharge: 200,
    currency: 'INR',
    currencySymbol: '₹',
  },
  Pakistan: {
    country: 'Pakistan',
    baseDeliveryCharge: 450,
    outsideCityCharge: 550,
    currency: 'PKR',
    currencySymbol: '₨',
  },
};

export interface CodPaymentMethodInfo {
  id: string;
  name: string;
  badge?: string;
  accountDetails: {
    merchantNumber?: string;
    accountType?: string;
    binancePayId?: string;
    walletAddress?: string;
    network?: string;
  };
  instructions: string;
}

export const COUNTRY_COD_METHODS: Record<SupportedCountry, CodPaymentMethodInfo[]> = {
  Bangladesh: [
    {
      id: 'bkash',
      name: 'bKash',
      badge: 'Fast & Instant',
      accountDetails: {
        merchantNumber: '01789-001122',
        accountType: 'Merchant / Send Money',
      },
      instructions:
        'Pay the Delivery Charge (৳100) to our bKash Merchant Number 01789-001122 via bKash App or dial *247#. After completing the transaction, enter your sender phone number, Transaction ID (TrxID), and upload payment screenshot.',
    },
    {
      id: 'nagad',
      name: 'Nagad',
      badge: 'Popular',
      accountDetails: {
        merchantNumber: '01889-001122',
        accountType: 'Merchant / Send Money',
      },
      instructions:
        'Pay the Delivery Charge (৳100) to our Nagad Number 01889-001122. Dial *167# or use the Nagad App. Enter sender mobile number and the Transaction ID below.',
    },
    {
      id: 'upay',
      name: 'Upay',
      badge: 'UCB Upay',
      accountDetails: {
        merchantNumber: '01989-001122',
        accountType: 'Merchant / Send Money',
      },
      instructions:
        'Pay the Delivery Charge (৳100 inside Dhaka, ৳150 outside) to our Upay Number 01989-001122 using the Upay App. Provide your sender mobile and Transaction ID.',
    },
    {
      id: 'bank_transfer',
      name: 'Banking (Bank Transfer)',
      badge: 'City / BRAC Bank',
      accountDetails: {
        merchantNumber: 'City Bank AC: 1502938471001',
        accountType: 'Corporate Current Account',
      },
      instructions:
        'Transfer the Delivery Charge (৳100 inside Dhaka, ৳150 outside) to City Bank PLC. AC Name: International Shop Ltd, AC Number: 1502938471001, Branch: Gulshan, Routing: 225272654. Enter your Sender Bank / Account Number and Transaction Reference ID below.',
    },
  ],
  India: [
    {
      id: 'binance_usd',
      name: 'USD / Binance Pay',
      badge: 'Fast & Recommended',
      accountDetails: {
        binancePayId: '492817291',
        walletAddress: 'TY19D4mRkq89eTuvM9xG178bNfG3A6wK9L',
        network: 'USDT (TRC20) or Binance Pay',
      },
      instructions:
        'Pay ONLY the Delivery Charge online in USD ($1.80 USDT) to Binance Pay ID 492817291 or TRC20 address. Enter your Binance Pay ID / Transaction Hash and upload proof. The remaining product amount will be collected in INR cash by the delivery courier at your doorstep.',
    },
    {
      id: 'upi_transfer',
      name: 'UPI / NetBanking',
      badge: 'Instant QR / VPA',
      accountDetails: {
        merchantNumber: 'intlshop@icici',
        accountType: 'UPI Handle',
      },
      instructions:
        'Pay the Delivery Charge (₹150) using any UPI App (Google Pay, PhonePe, Paytm) to VPA: intlshop@icici. Enter your UPI Reference Number / UTR below.',
    },
  ],
  Pakistan: [
    {
      id: 'binance_usd',
      name: 'USD / Binance Pay',
      badge: 'Fast & Recommended',
      accountDetails: {
        binancePayId: '492817291',
        walletAddress: 'TY19D4mRkq89eTuvM9xG178bNfG3A6wK9L',
        network: 'USDT (TRC20) or Binance Pay',
      },
      instructions:
        'Pay ONLY the Delivery Charge online in USD ($1.60 USDT) to Binance Pay ID 492817291 or TRC20 address. Enter your Binance Pay ID / Transaction Hash and upload proof. The remaining product amount will be collected in PKR cash by the delivery courier at your doorstep.',
    },
    {
      id: 'easypaisa',
      name: 'Easypaisa / JazzCash',
      badge: 'Mobile Banking',
      accountDetails: {
        merchantNumber: '0300-9876543',
        accountType: 'Merchant Till Account',
      },
      instructions:
        'Transfer the Delivery Charge (₨450) via Easypaisa or JazzCash to 0300-9876543. Enter your sender mobile number and Transaction ID below.',
    },
  ],
};

// All 64 Districts of Bangladesh arranged by Division
export const BANGLADESH_DIVISIONS: Record<string, string[]> = {
  Dhaka: [
    'Dhaka',
    'Gazipur',
    'Narayanganj',
    'Tangail',
    'Kishoreganj',
    'Manikganj',
    'Munshiganj',
    'Narsingdi',
    'Faridpur',
    'Gopalganj',
    'Madaripur',
    'Rajbari',
    'Shariatpur',
  ],
  Chattogram: [
    'Chattogram',
    'Cox\'s Bazar',
    'Cumilla',
    'Feni',
    'Brahmanbaria',
    'Rangamati',
    'Khagrachhari',
    'Bandarban',
    'Noakhali',
    'Lakshmipur',
    'Chandpur',
  ],
  Rajshahi: [
    'Rajshahi',
    'Bogura',
    'Joypurhat',
    'Naogaon',
    'Natore',
    'Chapainawabganj',
    'Pabna',
    'Sirajganj',
  ],
  Khulna: [
    'Khulna',
    'Bagerhat',
    'Chuadanga',
    'Jashore',
    'Jhenaidah',
    'Kushtia',
    'Magura',
    'Meherpur',
    'Narail',
    'Satkhira',
  ],
  Barishal: [
    'Barishal',
    'Barguna',
    'Bhola',
    'Jhalokati',
    'Patuakhali',
    'Pirojpur',
  ],
  Sylhet: [
    'Sylhet',
    'Habiganj',
    'Moulvibazar',
    'Sunamganj',
  ],
  Rangpur: [
    'Rangpur',
    'Dinajpur',
    'Gaibandha',
    'Kurigram',
    'Lalmonirhat',
    'Nilphamari',
    'Panchagarh',
    'Thakurgaon',
  ],
  Mymensingh: [
    'Mymensingh',
    'Jamalpur',
    'Netrokona',
    'Sherpur',
  ],
};

export const BANGLADESH_ALL_DISTRICTS: string[] = Object.values(BANGLADESH_DIVISIONS).flat().sort();

export const BANGLADESH_UPAZILAS: Record<string, string[]> = {
  Dhaka: [
    'Dhanmondi', 'Gulshan', 'Banani', 'Mirpur', 'Uttara', 'Mohammadpur', 'Motijheel', 'Tejgaon',
    'Badda', 'Khilgaon', 'Jatrabari', 'Lalbagh', 'Savar', 'Dhamrai', 'Keraniganj', 'Nawabganj', 'Dohar'
  ],
  Gazipur: ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj', 'Tongi'],
  Narayanganj: ['Narayanganj Sadar', 'Bandar', 'Rupganj', 'Sonargaon', 'Araihazar'],
  Chattogram: ['Kotwali', 'Panchlaish', 'Pahartali', 'Halishahar', 'Agrabad', 'Khulshi', 'Hathazari', 'Sitakunda', 'Patiya', 'Boalkhali', 'Raozan', 'Fatikchhari'],
  Cumilla: ['Cumilla Adarsha Sadar', 'Cumilla Sadar Dakshin', 'Barura', 'Chandina', 'Daudkandi', 'Laksam', 'Debidwar', 'Muradnagar'],
  Sylhet: ['Sylhet Sadar', 'Beanibazar', 'Golapganj', 'Zakiganj', 'Kanaighat', 'Fenchuganj', 'Biswanath', 'Osmani Nagar'],
  Rajshahi: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Paba', 'Bagha', 'Charghat', 'Durgapur', 'Godagari', 'Tanore', 'Puthia'],
  Khulna: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Rupsha', 'Terokhada'],
  Barishal: ['Barishal Sadar', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur', 'Agailjhara'],
  Rangpur: ['Rangpur Sadar', 'Badarganj', 'Gangachhara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
  Mymensingh: ['Mymensingh Sadar', 'Bhaluka', 'Fulbaria', 'Gafargaon', 'Gouripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Trishal', 'Tara Khanda'],
  Bogura: ['Bogura Sadar', 'Adamdighi', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatala'],
};

export const INDIA_STATES: string[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi (NCT)',
  'Chandigarh',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
];

export const PAKISTAN_PROVINCES: string[] = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu and Kashmir',
  'Gilgit-Baltistan',
];

/**
 * Currency conversion helper
 */
export function convertPrice(basePriceBDT: number, targetCountry: SupportedCountry): number {
  const config = COUNTRY_CURRENCIES[targetCountry];
  if (!config) return basePriceBDT;
  return Math.round(basePriceBDT * config.exchangeRateFromBDT);
}

export function formatPrice(price: number, targetCountry: SupportedCountry): string {
  const config = COUNTRY_CURRENCIES[targetCountry];
  if (!config) return `৳${price.toLocaleString()}`;
  return `${config.symbol}${price.toLocaleString()}`;
}
