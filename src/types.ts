export type SupportedCountry = 'Bangladesh' | 'India' | 'Pakistan';

export type CurrencyCode = 'BDT' | 'INR' | 'PKR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  phoneCode: string;
  exchangeRateFromBDT: number; // 1 BDT = rate * Currency
}

export interface DeliveryConfig {
  country: SupportedCountry;
  defaultCodCharge: number; // In local currency
  outsideCityCharge?: number;
  currency: CurrencyCode;
  symbol: string;
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  country: SupportedCountry;
  dob: string; // YYYY-MM-DD
  gender: 'Male' | 'Female';
  avatarUrl?: string;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  country: SupportedCountry;
  fullName: string;
  phone: string;
  mobileNumber?: string;
  fullAddress: string;
  streetAddress?: string;
  isDefault: boolean;
  label?: string;
  // Bangladesh fields
  division?: string;
  divisionOrState?: string;
  district?: string;
  districtOrCity?: string;
  upazila?: string;
  upazilaThana?: string;
  area?: string;
  postalCode?: string;
  // India fields
  state?: string;
  city?: string;
  pinCode?: string;
  // Pakistan fields
  province?: string;
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  customerName: string;
  avatarUrl?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  date: string;
  isVerifiedPurchase: boolean;
  photos?: string[];
  status: 'approved' | 'pending';
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  images: string[];
  basePriceBDT: number; // Stored in BDT as base
  originalPriceBDT?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  variants?: ProductVariant[];
  isCodEligible: boolean;
  isCodAvailable?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  shippingInfo: string;
  returnPolicy: string;
  warrantyInfo: string;
  offer?: {
    title: string;
    discountPercent: number;
    expiresAt: string; // ISO timestamp
  };
  product_payment_rules?: any[];
  product_variants?: any[];
  status?: string;
  is_archived?: boolean;
  direct_payment_required?: boolean;
}

export interface CartItem {
  productId: string;
  product: Product;
  selectedVariants: Record<string, string>;
  quantity: number;
  direct_payment_required?: boolean;
}

export interface PaymentProof {
  method: string;
  senderInfo: string;
  transactionId: string;
  screenshotUrl?: string;
  submittedAt: string;
  notes?: string;
}

export interface DynamicPaymentMethod {
  id: string;
  name: string;
  displayName: string;
  code: string;
  type: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  logoUrl?: string | null;
  iconName?: string | null;
  isActive: boolean;
  isArchived: boolean;
  sortOrder: number;
  country?: string | null;
  supportedCountries: string[];
  supportedCurrencies: string[];
  accountNumber?: string | null;
  mobileNumber?: string | null;
  merchantNumber?: string | null;
  accountType?: string | null;
  walletAddress?: string | null;
  cryptoNetwork?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  branch?: string | null;
  routingSwift?: string | null;
  instructions?: string | null;
  customerInstructions?: string | null;
  adminVerificationInstructions?: string | null;
  requireSenderNumber?: boolean;
  requireTransactionId?: boolean;
  requireScreenshot?: boolean;
  requireEmail?: boolean;
  requireWalletAddress?: boolean;
  requireTransactionHash?: boolean;
  requireAccountName?: boolean;
  requireSenderBankAccount?: boolean;
  minAmount?: number | null;
  maxAmount?: number | null;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'pending_verification' | 'verified' | 'paid' | 'failed';

export interface OrderTimelineItem {
  status: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price?: number;
  selectedVariants?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  country: SupportedCountry;
  currency: CurrencyCode;
  currencySymbol?: string;
  exchangeRate: number;
  deliveryAddress: Address;
  items: OrderItem[];
  productSubtotal: number;
  subtotal?: number;
  discount: number;
  deliveryCharge: number;
  tax: number; // 0 when disabled
  totalAmount: number;
  paymentMethod: string;
  selectedPaymentMethodId?: string;
  senderPhoneOrId?: string;
  transactionId?: string;
  proofScreenshotUrl?: string;
  deliveryPaymentStatus?: 'Pending' | 'Verified' | 'Rejected';
  isCod: boolean;
  amountPaidOnline: number;
  remainingCodAmount: number;
  paymentStatus: PaymentStatus;
  paymentProof?: PaymentProof;
  orderStatus: OrderStatus;
  timeline: OrderTimelineItem[];
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'offer' | 'account' | 'announcement' | 'system';
  isRead: boolean;
  createdAt: string;
  orderId?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  subject: string;
  category?: string | null;
  message: string;
  screenshotUrl?: string | null;
  orderId?: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt?: string;
}

