import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  ShieldCheck,
  Building2,
  Home,
  Plus,
  ArrowLeft,
  X,
  Lock,
  User as UserIcon,
  HelpCircle,
  FileCheck,
  Copy,
  Check,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Address, SupportedCountry, DynamicPaymentMethod } from '../types';
import { supabase } from '../lib/supabase';
import { dataService } from '../services/dataService';
import {
  COUNTRY_CURRENCIES,
  COUNTRY_DELIVERY_CONFIGS,
  COUNTRY_COD_METHODS,
  BANGLADESH_DIVISIONS,
  BANGLADESH_ALL_DISTRICTS,
  BANGLADESH_UPAZILAS,
  INDIA_STATES,
  PAKISTAN_PROVINCES,
  formatPrice,
  convertPrice,
} from '../config/countries';

interface CheckoutScreenProps {
  onNavigate: (route: string, param?: string) => void;
  onOrderPlaced?: (orderId: string) => void;
}

export function CheckoutScreen({ onNavigate, onOrderPlaced }: CheckoutScreenProps) {
  const { user, token, activeCountry } = useAuth();
  const { items, subtotal, isCodAvailable, clearCart } = useCart();
  const { showToast } = useToast();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);

  // Address fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [mobileDigits, setMobileDigits] = useState(user?.mobile?.replace(/^\+\d+/, '') || '');

  // Country-specific fields
  // Bangladesh
  const [bdDivision, setBdDivision] = useState('');
  const [bdDistrict, setBdDistrict] = useState('');
  const [bdUpazila, setBdUpazila] = useState('');
  const [bdArea, setBdArea] = useState('');
  const [bdPostalCode, setBdPostalCode] = useState('');

  // India
  const [inState, setInState] = useState('');
  const [inDistrict, setInDistrict] = useState('');
  const [inCity, setInCity] = useState('');
  const [inLocality, setInLocality] = useState('');
  const [inVillage, setInVillage] = useState('');
  const [inPinCode, setInPinCode] = useState('');

  // Pakistan
  const [pkProvince, setPkProvince] = useState('');
  const [pkDistrict, setPkDistrict] = useState('');
  const [pkCity, setPkCity] = useState('');
  const [pkLocality, setPkLocality] = useState('');
  const [pkVillage, setPkVillage] = useState('');
  const [pkPostalCode, setPkPostalCode] = useState('');

  // Unified Full Address Textarea
  const [fullAddressText, setFullAddressText] = useState('');
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Office' | 'Other'>('Home');

  // Dynamic Payment Methods loaded live from Supabase (Admin configured)
  const [paymentMethods, setPaymentMethods] = useState<DynamicPaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Filter active online methods for current country (excludes standalone COD option)
  const onlinePaymentMethods = React.useMemo(() => {
    return paymentMethods.filter(
      (m) => m.isActive && !m.isArchived && m.code !== 'cod' && m.type !== 'cod'
    );
  }, [paymentMethods]);

  // Check if COD is active in Admin configuration for the country
  const codPaymentMethod = React.useMemo(() => {
    return paymentMethods.find(
      (m) => (m.code === 'cod' || m.type === 'cod') && m.isActive && !m.isArchived
    );
  }, [paymentMethods]);

  // If methods are loaded, respect whether COD is active in Admin
  const isCodActiveInAdmin = isLoadingPaymentMethods || Boolean(codPaymentMethod);
  const effectiveCodAvailable = isCodAvailable && isCodActiveInAdmin;

  // Selected payment method object
  const selectedMethodObj = React.useMemo(() => {
    if (onlinePaymentMethods.length === 0) return null;
    return (
      onlinePaymentMethods.find(
        (m) => m.id === selectedMethodId || m.code === selectedMethodId
      ) || onlinePaymentMethods[0]
    );
  }, [onlinePaymentMethods, selectedMethodId]);

  // Load payment methods from Supabase & API for the activeCountry
  useEffect(() => {
    let isMounted = true;
    const fetchMethods = async () => {
      setIsLoadingPaymentMethods(true);
      try {
        const methods = await dataService.getPaymentMethods(activeCountry);
        if (isMounted) {
          setPaymentMethods(methods);
          const online = methods.filter(
            (m) => m.isActive && !m.isArchived && m.code !== 'cod' && m.type !== 'cod'
          );
          if (online.length > 0) {
            setSelectedMethodId((prev) => {
              const exists = online.some((m) => m.id === prev || m.code === prev);
              return exists ? prev : online[0].id;
            });
          }
        }
      } catch (err) {
        console.error('[Checkout] Failed to load payment methods:', err);
      } finally {
        if (isMounted) setIsLoadingPaymentMethods(false);
      }
    };

    fetchMethods();

    // Subscribe to realtime changes from Admin updates in Supabase
    const unsubscribe = dataService.subscribeToPaymentMethods(() => {
      fetchMethods();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeCountry]);

  // Payment Selection: Cash on Delivery or Prepaid
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'prepaid'>('cod');

  // Proof Fields
  const [senderPhoneOrId, setSenderPhoneOrId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [proofScreenshot, setProofScreenshot] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Calculate dynamic delivery charge
  const deliveryConfig = COUNTRY_DELIVERY_CONFIGS[activeCountry];
  let dynamicDeliveryCharge = deliveryConfig.baseDeliveryCharge;

  if (activeCountry === 'Bangladesh') {
    let currentDistrict = '';
    if (selectedAddressId && !showNewAddressForm) {
      const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
      currentDistrict = selectedAddr?.district || selectedAddr?.districtOrCity || '';
    } else {
      currentDistrict = bdDistrict;
    }
    // Inside Dhaka is ৳100, outside Dhaka is ৳150
    const isOutsideDhaka = currentDistrict.trim().toLowerCase() !== 'dhaka' && currentDistrict.trim() !== '';
    dynamicDeliveryCharge = isOutsideDhaka ? 150 : 100;
  }

  const grandTotal = subtotal + dynamicDeliveryCharge;
  const advanceAmountToPay = paymentMethod === 'cod' ? dynamicDeliveryCharge : grandTotal;
  const remainingCodAmount = paymentMethod === 'cod' ? subtotal : 0;
  const phoneCode = COUNTRY_CURRENCIES[activeCountry].phoneCode;

  // Reset payment method if COD becomes unavailable
  useEffect(() => {
    if (!effectiveCodAvailable && paymentMethod === 'cod') {
      setPaymentMethod('prepaid');
    }
  }, [effectiveCodAvailable, paymentMethod]);

  // Fetch saved addresses for logged-in user
  useEffect(() => {
    if (!token) return;
    const fetchAddr = async () => {
      try {
        const res = await fetch('/api/addresses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list: Address[] = (data.addresses || []).filter(
            (a: Address) => a.country === activeCountry
          );
          setSavedAddresses(list);
          const defaultOne = list.find((a) => a.isDefault) || list[0];
          if (defaultOne) {
            setSelectedAddressId(defaultOne.id);
            setShowNewAddressForm(false);
          } else {
            setShowNewAddressForm(true);
          }
        }
      } catch (err) {
        console.error('Failed to load addresses:', err);
      }
    };
    fetchAddr();
  }, [token, activeCountry]);

  // Handle image upload
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Receipt image size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setProofScreenshot(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Check if form is touched for exit confirmation dialog
  const isFormDirty =
    Boolean(fullName || mobileDigits || fullAddressText || senderPhoneOrId || transactionId);

  const handleBackNavigation = () => {
    if (isFormDirty) {
      setShowExitConfirmModal(true);
    } else {
      onNavigate('cart');
    }
  };

  // Submit order & verification
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      onNavigate('login', 'checkout');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your shopping cart is empty.');
      return;
    }

    let finalAddress: any = null;

    if (selectedAddressId && !showNewAddressForm) {
      const found = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!found) {
        setErrorMessage('Please select a valid saved delivery address.');
        return;
      }
      finalAddress = {
        fullName: found.fullName,
        mobileNumber: found.phone || found.mobileNumber,
        phone: found.phone || found.mobileNumber,
        country: found.country,
        divisionOrState: found.division || found.divisionOrState || found.state || found.province,
        districtOrCity: found.district || found.districtOrCity || found.city,
        city: found.district || found.districtOrCity || found.city,
        upazilaThana: found.upazila || found.upazilaThana,
        area: found.area,
        streetAddress: found.streetAddress || found.fullAddress,
        fullAddress: found.fullAddress,
        postalCode: found.postalCode || found.pinCode,
      };
    } else {
      // Validate inline address
      if (!fullName.trim()) {
        setErrorMessage('Recipient Full Name is required.');
        return;
      }
      if (!mobileDigits.trim() || mobileDigits.trim().length < 7) {
        setErrorMessage('A valid Contact Mobile Number is required for delivery.');
        return;
      }
      if (!fullAddressText.trim()) {
        setErrorMessage('Please provide your complete delivery address in the address box.');
        return;
      }

      if (activeCountry === 'Bangladesh') {
        if (!bdDivision) {
          setErrorMessage('Please select your Division.');
          return;
        }
        if (!bdDistrict) {
          setErrorMessage('Please select your District.');
          return;
        }
      } else if (activeCountry === 'India') {
        if (!inState) {
          setErrorMessage('Please select your State.');
          return;
        }
        if (!inCity.trim()) {
          setErrorMessage('Please enter your City / Town.');
          return;
        }
        if (!inPinCode.trim() || !/^\d{6}$/.test(inPinCode.trim())) {
          setErrorMessage('Please enter a valid 6-digit PIN Code.');
          return;
        }
      } else if (activeCountry === 'Pakistan') {
        if (!pkProvince) {
          setErrorMessage('Please select your Province / Region.');
          return;
        }
        if (!pkCity.trim()) {
          setErrorMessage('Please enter your City.');
          return;
        }
      }

      finalAddress = {
        fullName: fullName.trim(),
        mobileNumber: `${phoneCode}${mobileDigits.trim()}`,
        phone: `${phoneCode}${mobileDigits.trim()}`,
        country: activeCountry,
        fullAddress: fullAddressText.trim(),
        streetAddress: fullAddressText.trim(),
        division: activeCountry === 'Bangladesh' ? bdDivision : undefined,
        divisionOrState:
          activeCountry === 'Bangladesh'
            ? bdDivision
            : activeCountry === 'India'
            ? inState
            : pkProvince,
        district:
          activeCountry === 'Bangladesh'
            ? bdDistrict
            : activeCountry === 'India'
            ? inDistrict.trim() || inCity.trim()
            : pkDistrict.trim() || pkCity.trim(),
        districtOrCity:
          activeCountry === 'Bangladesh'
            ? bdDistrict
            : activeCountry === 'India'
            ? inCity.trim()
            : pkCity.trim(),
        city:
          activeCountry === 'Bangladesh'
            ? bdDistrict
            : activeCountry === 'India'
            ? inCity.trim()
            : pkCity.trim(),
        upazila: activeCountry === 'Bangladesh' ? bdUpazila : undefined,
        upazilaThana: activeCountry === 'Bangladesh' ? bdUpazila : undefined,
        area:
          activeCountry === 'Bangladesh'
            ? bdArea
            : activeCountry === 'India'
            ? inLocality
            : pkLocality,
        postalCode:
          activeCountry === 'Bangladesh'
            ? bdPostalCode
            : activeCountry === 'India'
            ? inPinCode
            : pkPostalCode,
        state: activeCountry === 'India' ? inState : undefined,
        pinCode: activeCountry === 'India' ? inPinCode : undefined,
        province: activeCountry === 'Pakistan' ? pkProvince : undefined,
      };
    }

    // Validate payment proof
    if (!senderPhoneOrId.trim()) {
      setErrorMessage(
        activeCountry === 'Bangladesh'
          ? 'Please enter the Sender Mobile / Bank Account number used for payment.'
          : 'Please enter your Binance Pay ID / Sender Wallet / Account ID.'
      );
      return;
    }

    if (!transactionId.trim()) {
      setErrorMessage('Please provide the Transaction ID (TrxID / Hash / UTR) for verification.');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentCustomerId = user.id;
      const shippingInfo = {
        fullName: finalAddress.fullName || user.fullName,
        email: user.email,
        phone: finalAddress.phone || finalAddress.mobileNumber || user.mobile,
        country: finalAddress.country || activeCountry,
        ...finalAddress,
      };

      const cartItems = items.map((i) => ({
        productId: i.productId,
        name: i.product.name,
        image: i.product.images?.[0] || '',
        price: convertPrice(i.product.basePriceBDT, activeCountry),
        quantity: i.quantity,
        selectedVariants: i.selectedVariants,
        direct_payment_required: Boolean(
          i.direct_payment_required ||
          i.product?.direct_payment_required ||
          i.product?.isCodEligible === false
        ),
      }));

      const deliveryFee = dynamicDeliveryCharge;
      const currentMethodObj = selectedMethodObj;
      const selectedMethodName = currentMethodObj?.displayName || currentMethodObj?.name || 'Online Payment';
      const selectedMethod = paymentMethod === 'cod' ? 'COD' : selectedMethodName;
      const senderNumber = senderPhoneOrId.trim();
      const uploadedProofImageUrl = proofScreenshot || '';

      // Check if any cart item requires direct payment
      const requiresDirectPayment = cartItems.some(item => item.direct_payment_required);
      const paymentType = requiresDirectPayment ? 'DIRECT_PAYMENT_REQUIRED' : (selectedMethod === 'COD' ? 'COD' : 'ONLINE_PAYMENT');
      const isCod = !requiresDirectPayment && selectedMethod === 'COD';

      const { data: order, error } = await supabase.from('orders').insert({
        id: `ord_${Date.now()}`,
        order_number: `INTL-${Date.now().toString().slice(-6)}`,
        customer_id: currentCustomerId,
        customer_name: shippingInfo.fullName,
        customer_email: shippingInfo.email,
        customer_mobile: shippingInfo.phone,
        country: shippingInfo.country,
        shipping_address: shippingInfo,
        items: cartItems,
        product_total: subtotal,
        delivery_charge: deliveryFee,
        grand_total: subtotal + deliveryFee,
        payment_method: selectedMethod,
        payment_type: paymentType,
        is_cod: isCod,
        order_status: 'pending',
        payment_status: isCod ? 'pending' : 'submitted'
      }).select().single();

      if (error) {
        console.warn('[Supabase Orders Notice]:', error.message);
      }

      if (order) {
        if (!order.currency) {
          order.currency = COUNTRY_CURRENCIES[activeCountry]?.code || 'BDT';
        }
        await supabase.from('payments').insert({
          id: `pmt_${Date.now()}`,
          order_id: order.id,
          order_number: order.order_number,
          customer_id: currentCustomerId,
          customer_name: shippingInfo.fullName,
          amount: order.grand_total,
          currency: order.currency,
          payment_method: selectedMethod,
          sender_number: senderNumber,
          transaction_id: transactionId,
          payment_screenshot: uploadedProofImageUrl,
          status: 'pending'
        });
      }

      const orderPayload = {
        id: order?.id,
        order_number: order?.order_number,
        items: items.map((i) => ({
          productId: i.productId,
          slug: i.product.slug,
          name: i.product.name,
          image: i.product.images[0],
          price: convertPrice(i.product.basePriceBDT, activeCountry),
          basePriceBDT: i.product.basePriceBDT,
          quantity: i.quantity,
          selectedVariants: i.selectedVariants,
          direct_payment_required: Boolean(
            i.direct_payment_required ||
            i.product?.direct_payment_required ||
            i.product?.isCodEligible === false
          ),
        })),
        addressId: selectedAddressId && !showNewAddressForm ? selectedAddressId : undefined,
        deliveryAddress: finalAddress,
        saveAddress: saveAddressForFuture && showNewAddressForm,
        paymentMethod: selectedMethod,
        paymentType,
        isCod,
        selectedPaymentMethodId: selectedMethodId,
        senderPhoneOrId: senderPhoneOrId.trim(),
        transactionId: transactionId.trim(),
        proofScreenshotUrl: proofScreenshot || undefined,
        customerNotes: customerNotes.trim(),
        country: activeCountry,
        isOutsideCity: activeCountry === 'Bangladesh' ? bdDistrict.toLowerCase() !== 'dhaka' : false,
        paymentProof: {
          method: selectedMethod,
          senderInfo: senderPhoneOrId.trim(),
          transactionId: transactionId.trim(),
          screenshotUrl: proofScreenshot || undefined,
        },
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (res.ok && data?.order) {
        const confirmedId = data.order.id || order?.id;
        showToast('Order received! Payment verification is currently in progress.', 'success');
        clearCart();
        if (onOrderPlaced) {
          onOrderPlaced(confirmedId);
        } else {
          onNavigate('order-confirmation', confirmedId);
        }
      } else if (order) {
        const confirmedId = order.id;
        showToast('Order received! Payment verification is currently in progress.', 'success');
        clearCart();
        if (onOrderPlaced) {
          onOrderPlaced(confirmedId);
        } else {
          onNavigate('order-confirmation', confirmedId);
        }
      } else {
        setErrorMessage(data?.error || error?.message || 'Failed to submit order. Please check inputs and retry.');
      }
    } catch (err) {
      console.error('Order submission error:', err);
      setErrorMessage('A network error occurred while submitting your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is guest, show mandatory customer login prompt (Section 1)
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200/80 shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif] mb-3">
            Customer Account Required
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-md mx-auto mb-8">
            To ensure reliable courier dispatch, address validation, and secure payment verification, a
            registered customer account is required before placing an order.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('login', 'checkout')}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In to Checkout</span>
            </button>
            <button
              onClick={() => onNavigate('register', 'checkout')}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Create New Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-xs text-neutral-400">
            Guest users can browse products and add items to bag. All items in your cart remain saved.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Return Button */}
      <button
        type="button"
        onClick={handleBackNavigation}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cart</span>
      </button>

      {/* Screen Title */}
      <div className="pb-6 border-b border-neutral-200/80 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
              Checkout & Delivery
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Serving <strong className="text-neutral-900">{activeCountry}</strong> with verified express
              couriers and payment verification.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ordering as {user.fullName}</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Delivery & Payment Details */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Delivery Address */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                      Delivery Destination ({activeCountry})
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Accurate address information ensures prompt delivery
                    </p>
                  </div>
                </div>

                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {showNewAddressForm ? 'Select Saved Address' : '+ Add New Address'}
                  </button>
                )}
              </div>

              {/* Saved Addresses list */}
              {!showNewAddressForm && savedAddresses.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                            isSelected
                              ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/20'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-900">{addr.fullName}</span>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-sm font-bold">
                                  Default
                                </span>
                              )}
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <p className="text-xs text-neutral-600 font-mono mb-1">{addr.phone || addr.mobileNumber}</p>
                          <p className="text-xs text-neutral-700 line-clamp-2">{addr.fullAddress || addr.streetAddress}</p>
                          <p className="text-[11px] text-neutral-400 mt-1">
                            {[
                              addr.upazila || addr.upazilaThana,
                              addr.district || addr.districtOrCity || addr.city,
                              addr.division || addr.state || addr.province,
                              addr.postalCode || addr.pinCode,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Dynamic Country Address Form */
                <div className="space-y-4">
                  {/* Recipient Full Name & Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                        Recipient Full Name *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Tanvir Ahmed / Priya Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                        Contact Mobile Number *
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-neutral-200 bg-neutral-100 text-xs font-bold text-neutral-700 select-none">
                          {phoneCode}
                        </span>
                        <input
                          type="tel"
                          value={mobileDigits}
                          onChange={(e) => setMobileDigits(e.target.value.replace(/\D/g, ''))}
                          placeholder={
                            activeCountry === 'Bangladesh'
                              ? '1712345678'
                              : activeCountry === 'India'
                              ? '9876543210'
                              : '3001234567'
                          }
                          className="w-full pl-3 pr-3 py-2.5 rounded-r-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* BANGLADESH ADDRESS SPECIFICATIONS */}
                  {activeCountry === 'Bangladesh' && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            Division *
                          </label>
                          <select
                            value={bdDivision}
                            onChange={(e) => {
                              setBdDivision(e.target.value);
                              setBdDistrict('');
                              setBdUpazila('');
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden bg-white"
                            required
                          >
                            <option value="">Select Division (8 Divisions)</option>
                            {Object.keys(BANGLADESH_DIVISIONS).map((div) => (
                              <option key={div} value={div}>
                                {div} Division
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            District (All 64 Districts) *
                          </label>
                          <select
                            value={bdDistrict}
                            onChange={(e) => {
                              setBdDistrict(e.target.value);
                              setBdUpazila('');
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden bg-white"
                            required
                          >
                            <option value="">Select District</option>
                            {(bdDivision && BANGLADESH_DIVISIONS[bdDivision]
                              ? BANGLADESH_DIVISIONS[bdDivision]
                              : BANGLADESH_ALL_DISTRICTS
                            ).map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            Upazila / Thana
                          </label>
                          {bdDistrict && BANGLADESH_UPAZILAS[bdDistrict] ? (
                            <select
                              value={bdUpazila}
                              onChange={(e) => setBdUpazila(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden bg-white"
                            >
                              <option value="">Select Upazila / Thana</option>
                              {BANGLADESH_UPAZILAS[bdDistrict].map((up) => (
                                <option key={up} value={up}>
                                  {up}
                                </option>
                              ))}
                              <option value="Other">Other / Custom</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={bdUpazila}
                              onChange={(e) => setBdUpazila(e.target.value)}
                              placeholder="e.g. Mirpur / Dhanmondi"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            Area / Locality
                          </label>
                          <input
                            type="text"
                            value={bdArea}
                            onChange={(e) => setBdArea(e.target.value)}
                            placeholder="e.g. Sector 4, Block C"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={bdPostalCode}
                            onChange={(e) => setBdPostalCode(e.target.value)}
                            placeholder="e.g. 1205"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* INDIA ADDRESS SPECIFICATIONS */}
                  {activeCountry === 'India' && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            State *
                          </label>
                          <select
                            value={inState}
                            onChange={(e) => setInState(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden bg-white"
                            required
                          >
                            <option value="">Select State / Union Territory</option>
                            {INDIA_STATES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            City / Town *
                          </label>
                          <input
                            type="text"
                            value={inCity}
                            onChange={(e) => setInCity(e.target.value)}
                            placeholder="e.g. Mumbai, Bengaluru, Pune"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            District
                          </label>
                          <input
                            type="text"
                            value={inDistrict}
                            onChange={(e) => setInDistrict(e.target.value)}
                            placeholder="District name"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            Area / Landmark
                          </label>
                          <input
                            type="text"
                            value={inLocality}
                            onChange={(e) => setInLocality(e.target.value)}
                            placeholder="e.g. Near Metro Station"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            PIN Code (6 Digits) *
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={inPinCode}
                            onChange={(e) => setInPinCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="e.g. 400001"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden font-mono"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                          Village / Local Area (where applicable)
                        </label>
                        <input
                          type="text"
                          value={inVillage}
                          onChange={(e) => setInVillage(e.target.value)}
                          placeholder="Village or local hamlet name (optional)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* PAKISTAN ADDRESS SPECIFICATIONS */}
                  {activeCountry === 'Pakistan' && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            Province / Region *
                          </label>
                          <select
                            value={pkProvince}
                            onChange={(e) => setPkProvince(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden bg-white"
                            required
                          >
                            <option value="">Select Province / Region</option>
                            {PAKISTAN_PROVINCES.map((pr) => (
                              <option key={pr} value={pr}>
                                {pr}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            City *
                          </label>
                          <input
                            type="text"
                            value={pkCity}
                            onChange={(e) => setPkCity(e.target.value)}
                            placeholder="e.g. Karachi, Lahore, Islamabad"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            District
                          </label>
                          <input
                            type="text"
                            value={pkDistrict}
                            onChange={(e) => setPkDistrict(e.target.value)}
                            placeholder="District name"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            Area / Sector / Phase
                          </label>
                          <input
                            type="text"
                            value={pkLocality}
                            onChange={(e) => setPkLocality(e.target.value)}
                            placeholder="e.g. DHA Phase 5, Gulberg"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={pkPostalCode}
                            onChange={(e) => setPkPostalCode(e.target.value)}
                            placeholder="e.g. 54000"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                          Village / Local Area (where applicable)
                        </label>
                        <input
                          type="text"
                          value={pkVillage}
                          onChange={(e) => setPkVillage(e.target.value)}
                          placeholder="Village or local settlement name (optional)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* UNIFIED FULL ADDRESS TEXTAREA (MANDATORY LABEL & PROMPT) */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1.5">
                      Enter Full Address *
                    </label>
                    <textarea
                      rows={3}
                      value={fullAddressText}
                      onChange={(e) => setFullAddressText(e.target.value)}
                      placeholder="Enter your complete address carefully. Please make sure the address is correct. Include House/Flat/Plot number, Road/Street name, building name, and landmark."
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                      required
                    />
                    <span className="text-[11px] text-neutral-400 block mt-1">
                      Enter your complete address carefully. Please make sure the address is correct.
                    </span>
                  </div>

                  {/* Save address checkbox */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="saveAddressCheckbox"
                      checked={saveAddressForFuture}
                      onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 rounded-sm cursor-pointer"
                    />
                    <label
                      htmlFor="saveAddressCheckbox"
                      className="text-xs font-semibold text-neutral-700 cursor-pointer select-none"
                    >
                      Save this delivery address to my account for future orders
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Payment Mode Selection (COD vs Prepaid) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-neutral-100">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">
                    Payment Mode
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Choose Cash on Delivery (Advance Delivery Charge) or 100% Prepaid
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Cash on Delivery option */}
                <div
                  onClick={() => effectiveCodAvailable && setPaymentMethod('cod')}
                  className={`p-5 rounded-2xl border transition-all relative ${
                    !effectiveCodAvailable
                      ? 'opacity-50 cursor-not-allowed bg-neutral-50 border-neutral-200'
                      : paymentMethod === 'cod'
                      ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/20 cursor-pointer'
                      : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-neutral-900">Cash on Delivery</span>
                    <Truck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Pay ONLY <strong>{formatPrice(dynamicDeliveryCharge, activeCountry)}</strong> delivery
                    charge online now. Remaining product balance of{' '}
                    <strong>{formatPrice(subtotal, activeCountry)}</strong> is collected in cash by the courier
                    upon delivery.
                  </p>
                  {!effectiveCodAvailable && (
                    <span className="inline-block text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold mt-2">
                      {!isCodAvailable ? 'Ineligible item in cart' : 'COD unavailable for this destination'}
                    </span>
                  )}
                </div>

                {/* Prepaid option */}
                <div
                  onClick={() => setPaymentMethod('prepaid')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    paymentMethod === 'prepaid'
                      ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/20'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-neutral-900">Prepaid (Full Online)</span>
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Pay 100% (<strong>{formatPrice(grandTotal, activeCountry)}</strong>) online now. Priority
                    dispatch and zero cash exchange at your doorstep.
                  </p>
                </div>
              </div>

              {/* Step 3: Advance / Online Payment Instructions & Verification Proof */}
              <div className="mt-8 pt-6 border-t border-neutral-100">
                <div className="mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                    {paymentMethod === 'cod' ? 'Advance Delivery Charge Payable Now' : 'Full Online Payment Payable Now'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-neutral-900 font-['Outfit',sans-serif]">
                      {formatPrice(advanceAmountToPay, activeCountry)}
                    </span>
                    {paymentMethod === 'cod' && (
                      <span className="text-xs text-neutral-500">
                        (Remaining {formatPrice(subtotal, activeCountry)} due in cash at doorstep)
                      </span>
                    )}
                  </div>
                </div>

                {/* Gateway / Channel selector */}
                {isLoadingPaymentMethods ? (
                  <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-500 mb-4 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />
                    <span>Loading available payment methods for {activeCountry}...</span>
                  </div>
                ) : onlinePaymentMethods.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-4">
                    No active online payment methods are currently configured for {activeCountry}. Please contact customer support.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 mb-4">
                    {onlinePaymentMethods.map((m) => {
                      const isSelected = selectedMethodObj?.id === m.id || selectedMethodObj?.code === m.code;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethodId(m.id)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          {m.logoUrl ? (
                            <img
                              src={m.logoUrl}
                              alt={m.displayName || m.name}
                              className="w-5 h-5 object-contain rounded-xs shrink-0 bg-white p-0.5"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          <span>{m.displayName || m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Account Details Box */}
                {selectedMethodObj && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-200/90 text-xs mb-6 space-y-3.5">
                    {/* Method Header with Logo & Name */}
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200/70">
                      <div className="flex items-center gap-2.5">
                        {selectedMethodObj.logoUrl ? (
                          <img
                            src={selectedMethodObj.logoUrl}
                            alt={selectedMethodObj.displayName || selectedMethodObj.name}
                            className="w-7 h-7 object-contain rounded-md bg-white p-0.5 border border-neutral-200 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div>
                          <span className="font-extrabold text-sm text-neutral-900 block leading-tight">
                            {selectedMethodObj.displayName || selectedMethodObj.name}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            Recipient Account Details
                          </span>
                        </div>
                      </div>
                      {(selectedMethodObj.accountType || selectedMethodObj.cryptoNetwork) && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                          {selectedMethodObj.accountType || selectedMethodObj.cryptoNetwork}
                        </span>
                      )}
                    </div>

                    {/* Number Display (Mobile Banking / Merchant / Account) */}
                    {(selectedMethodObj.accountNumber || selectedMethodObj.mobileNumber || selectedMethodObj.merchantNumber) && (
                      <div className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center justify-between gap-2 shadow-2xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                            {selectedMethodObj.type === 'crypto'
                              ? (selectedMethodObj.accountName || 'Binance Pay ID')
                              : selectedMethodObj.merchantNumber
                              ? 'Merchant Account Number'
                              : selectedMethodObj.accountType
                              ? `${selectedMethodObj.accountType} Number`
                              : 'Account / Mobile Number'}
                          </span>
                          <span className="text-neutral-900 font-mono text-sm font-extrabold tracking-wide select-all">
                            {selectedMethodObj.accountNumber || selectedMethodObj.mobileNumber || selectedMethodObj.merchantNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const val = selectedMethodObj.accountNumber || selectedMethodObj.mobileNumber || selectedMethodObj.merchantNumber || '';
                            navigator.clipboard.writeText(val);
                            setCopiedField('number');
                            showToast('Number copied to clipboard', 'info');
                            setTimeout(() => setCopiedField(null), 2000);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {copiedField === 'number' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Crypto TRC20 / Wallet Address */}
                    {selectedMethodObj.walletAddress && (
                      <div className="bg-white p-3 rounded-xl border border-neutral-200 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                            Wallet Address {selectedMethodObj.cryptoNetwork ? `(${selectedMethodObj.cryptoNetwork})` : ''}
                          </span>
                          <span className="text-neutral-900 font-mono text-xs font-bold break-all block select-all">
                            {selectedMethodObj.walletAddress}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedMethodObj.walletAddress || '');
                            setCopiedField('wallet');
                            showToast('Wallet address copied to clipboard', 'info');
                            setTimeout(() => setCopiedField(null), 2000);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {copiedField === 'wallet' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Bank Transfer Details */}
                    {selectedMethodObj.bankName && (
                      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 space-y-1.5 text-xs shadow-2xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-500 font-medium">Bank Name:</span>
                          <span className="font-bold text-neutral-900">{selectedMethodObj.bankName}</span>
                        </div>
                        {selectedMethodObj.accountName && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500 font-medium">Account Name:</span>
                            <span className="font-bold text-neutral-800">{selectedMethodObj.accountName}</span>
                          </div>
                        )}
                        {selectedMethodObj.accountNumber && (
                          <div className="flex justify-between font-mono">
                            <span className="text-neutral-500 font-sans font-medium">Account Number:</span>
                            <span className="font-bold text-neutral-900">{selectedMethodObj.accountNumber}</span>
                          </div>
                        )}
                        {selectedMethodObj.branch && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500 font-medium">Branch:</span>
                            <span className="text-neutral-700">{selectedMethodObj.branch}</span>
                          </div>
                        )}
                        {selectedMethodObj.routingSwift && (
                          <div className="flex justify-between font-mono">
                            <span className="text-neutral-500 font-sans font-medium">Routing / SWIFT:</span>
                            <span className="font-bold text-neutral-800">{selectedMethodObj.routingSwift}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Instructions Box */}
                    {(selectedMethodObj.customerInstructions || selectedMethodObj.instructions) && (
                      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="whitespace-pre-line">
                          {selectedMethodObj.customerInstructions || selectedMethodObj.instructions}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Proof inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                      {selectedMethodObj?.type === 'crypto'
                        ? 'Sender Binance Pay ID / Wallet Address *'
                        : selectedMethodObj?.type === 'bank_transfer'
                        ? 'Sender Bank Name & Account Number *'
                        : `Sender Mobile Number (${selectedMethodObj?.displayName || selectedMethodObj?.name || 'Account'}) *`}
                    </label>
                    <input
                      type="text"
                      value={senderPhoneOrId}
                      onChange={(e) => setSenderPhoneOrId(e.target.value)}
                      placeholder={
                        selectedMethodObj?.type === 'crypto'
                          ? 'e.g. Binance Pay ID or Sender TRC20 address'
                          : selectedMethodObj?.type === 'bank_transfer'
                          ? 'e.g. Account Name & Number'
                          : activeCountry === 'Bangladesh'
                          ? 'e.g. 017xxxxxxxx'
                          : 'e.g. Sender phone or account'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                      {selectedMethodObj?.type === 'crypto'
                        ? 'Transaction Hash (TXID) *'
                        : selectedMethodObj?.type === 'bank_transfer'
                        ? 'Deposit Slip Ref / Transaction Ref *'
                        : 'Transaction ID (TrxID / Reference) *'}
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder={selectedMethodObj?.type === 'crypto' ? 'e.g. 0xabc... or TXID' : 'e.g. 9J4K2L8M1N'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden font-mono uppercase"
                      required
                    />
                  </div>
                </div>

                {/* Screenshot upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Payment Receipt Screenshot (Recommended)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 cursor-pointer shadow-xs">
                      <Upload className="w-4 h-4 text-neutral-500" />
                      <span>{proofScreenshot ? 'Change Receipt' : 'Upload Receipt Screenshot'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                    </label>
                    {proofScreenshot && (
                      <div className="flex items-center gap-2">
                        <img
                          src={proofScreenshot}
                          alt="Receipt proof"
                          className="w-10 h-10 object-cover rounded-lg border border-neutral-200"
                        />
                        <button
                          type="button"
                          onClick={() => setProofScreenshot('')}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Special Instructions Note */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                Delivery Notes / Courier Instructions (Optional)
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="e.g. Ring doorbell twice or call 10 minutes prior to delivery"
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
              />
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs sticky top-28">
            <h2 className="text-xl font-bold text-neutral-900 font-['Outfit',sans-serif] mb-4">
              Order Summary
            </h2>

            {/* Items List Mini */}
            <div className="max-h-52 overflow-y-auto space-y-3 pr-1 mb-4 pb-4 border-b border-neutral-100">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${JSON.stringify(item.selectedVariants)}`}
                  className="flex items-center gap-3 text-xs"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-10 h-10 object-cover rounded-lg shrink-0 border border-neutral-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{item.product.name}</p>
                    <p className="text-neutral-400 text-[11px]">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-neutral-900 font-mono">
                    {formatPrice(
                      convertPrice(item.product.basePriceBDT, activeCountry) * item.quantity,
                      activeCountry
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-2.5 text-xs pb-4 border-b border-neutral-100">
              <div className="flex justify-between text-neutral-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatPrice(subtotal, activeCountry)}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Delivery Charge ({activeCountry})</span>
                <span className="font-semibold text-neutral-900">
                  {formatPrice(dynamicDeliveryCharge, activeCountry)}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Import Taxes / Duty</span>
                <span className="font-semibold text-emerald-600">0.00 / Included</span>
              </div>
            </div>

            {/* Total */}
            <div className="py-4 border-b border-neutral-100 flex justify-between items-baseline">
              <span className="text-sm font-bold text-neutral-900">Total Order Value</span>
              <span className="text-2xl font-black text-neutral-900 font-['Outfit',sans-serif]">
                {formatPrice(grandTotal, activeCountry)}
              </span>
            </div>

            {/* Payment Schedule Card */}
            <div className="my-5 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-xs">
              <div className="flex justify-between font-bold text-indigo-950 text-sm">
                <span>Advance to Pay Online:</span>
                <span>{formatPrice(advanceAmountToPay, activeCountry)}</span>
              </div>
              {paymentMethod === 'cod' ? (
                <div className="mt-2 pt-2 border-t border-indigo-200/60 text-[11px] text-indigo-900 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Due on Delivery (Cash):</span>
                    <span className="font-bold">{formatPrice(remainingCodAmount, activeCountry)}</span>
                  </div>
                  <p className="text-[10px] text-indigo-700 leading-tight pt-1">
                    You are paying ONLY the delivery charge now. The courier will collect {formatPrice(remainingCodAmount, activeCountry)} in cash upon delivery.
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-indigo-700 leading-tight mt-1">
                  100% full online prepaid order. No cash collection at doorstep.
                </p>
              )}
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified manual order verification before courier dispatch</span>
            </div>

            {/* Placement CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Submitting Order...' : 'Submit Order & Payment for Verification'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Exit Modal (Section 47) */}
      <AnimatePresence>
        {showExitConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif] mb-2">
                Leave Checkout?
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed mb-6">
                Are you sure you want to leave checkout? Your order details have not been saved.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowExitConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  Continue Checkout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirmModal(false);
                    onNavigate('cart');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-100 transition-colors"
                >
                  Leave Checkout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
