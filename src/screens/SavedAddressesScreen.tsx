import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2, ArrowLeft, X, Home, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Address, SupportedCountry } from '../types';
import {
  BANGLADESH_DIVISIONS,
  BANGLADESH_ALL_DISTRICTS,
  INDIA_STATES,
  PAKISTAN_PROVINCES,
  COUNTRY_CURRENCIES,
  SUPPORTED_COUNTRIES,
} from '../config/countries';

interface SavedAddressesScreenProps {
  onNavigate: (route: string) => void;
}

export function SavedAddressesScreen({ onNavigate }: SavedAddressesScreenProps) {
  const { user, token, activeCountry } = useAuth();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Address form fields
  const [formCountry, setFormCountry] = useState<SupportedCountry>(activeCountry);
  const [fullName, setFullName] = useState('');
  const [mobileDigits, setMobileDigits] = useState('');
  const [divisionOrState, setDivisionOrState] = useState('');
  const [districtOrCity, setDistrictOrCity] = useState('');
  const [upazilaThana, setUpazilaThana] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [label, setLabel] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const phoneCode = COUNTRY_CURRENCIES[formCountry].phoneCode;

  const fetchAddresses = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [token]);

  const resetForm = () => {
    setEditingAddressId(null);
    setFormCountry(activeCountry);
    setFullName(user?.fullName || '');
    setMobileDigits(user?.mobile?.replace(/^\+\d+/, '') || '');
    setDivisionOrState('');
    setDistrictOrCity('');
    setUpazilaThana('');
    setStreetAddress('');
    setPostalCode('');
    setLabel('Home');
    setIsDefault(addresses.length === 0);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddressId(addr.id);
    setFormCountry(addr.country);
    setFullName(addr.fullName);
    const pCode = COUNTRY_CURRENCIES[addr.country]?.phoneCode || '';
    setMobileDigits(addr.mobileNumber.startsWith(pCode) ? addr.mobileNumber.slice(pCode.length) : addr.mobileNumber);
    setDivisionOrState(addr.divisionOrState || '');
    setDistrictOrCity(addr.districtOrCity || addr.city || '');
    setUpazilaThana(addr.upazilaThana || '');
    setStreetAddress(addr.streetAddress);
    setPostalCode(addr.postalCode || '');
    setLabel(addr.label || 'Home');
    setIsDefault(addr.isDefault);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!fullName.trim() || !mobileDigits.trim() || !streetAddress.trim()) {
      showToast('Please complete all required address fields', 'warning');
      return;
    }

    const fullMobile = `${phoneCode}${mobileDigits.trim()}`;

    setIsSaving(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        mobileNumber: fullMobile,
        country: formCountry,
        divisionOrState,
        districtOrCity,
        city: districtOrCity,
        upazilaThana,
        streetAddress: streetAddress.trim(),
        postalCode: postalCode.trim(),
        label,
        isDefault,
      };

      let res;
      if (editingAddressId) {
        res = await fetch(`/api/addresses/${editingAddressId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        showToast(editingAddressId ? 'Address updated successfully' : 'New address added', 'success');
        setIsModalOpen(false);
        fetchAddresses();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to save address', 'error');
      }
    } catch (err: any) {
      showToast('Network error while saving address', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Address deleted', 'info');
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      showToast('Failed to delete address', 'error');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/addresses/${id}/default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Default delivery address updated', 'success');
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === id }))
        );
      }
    } catch (err) {
      showToast('Failed to set default address', 'error');
    }
  };

  // District options for Bangladesh based on selected division
  const bdDistricts = formCountry === 'Bangladesh' && divisionOrState && BANGLADESH_DIVISIONS[divisionOrState]
    ? BANGLADESH_DIVISIONS[divisionOrState]
    : BANGLADESH_ALL_DISTRICTS;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => onNavigate('my-account')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Account</span>
      </button>

      <div className="flex items-center justify-between pb-6 border-b border-neutral-200/80 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 font-['Outfit',sans-serif]">
            Saved Addresses
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your delivery destinations for verified international orders
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
          ))}
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                addr.isDefault
                  ? 'border-indigo-400 ring-2 ring-indigo-50 shadow-xs'
                  : 'border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              <div>
                {/* Header label & Default badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-md">
                      {addr.label === 'Office' ? (
                        <Building2 className="w-3 h-3 text-neutral-500" />
                      ) : (
                        <Home className="w-3 h-3 text-neutral-500" />
                      )}
                      {addr.label}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">({addr.country})</span>
                  </div>

                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-semibold text-neutral-500 hover:text-indigo-600 transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                {/* Recipient Details */}
                <h3 className="font-bold text-neutral-900 text-sm">{addr.fullName}</h3>
                <p className="text-xs font-mono text-neutral-600 mt-0.5">{addr.mobileNumber}</p>

                {/* Full Address */}
                <div className="text-xs text-neutral-600 mt-2 space-y-0.5">
                  <p className="text-neutral-800">{addr.streetAddress}</p>
                  {addr.upazilaThana && <p>Upazila/Thana: {addr.upazilaThana}</p>}
                  <p>
                    {addr.districtOrCity || addr.city}
                    {addr.divisionOrState ? `, ${addr.divisionOrState}` : ''}
                    {addr.postalCode ? ` - ${addr.postalCode}` : ''}
                  </p>
                  <p className="font-semibold text-neutral-900">{addr.country}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-neutral-100">
                <button
                  onClick={() => openEditModal(addr)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200/80">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 font-['Outfit',sans-serif]">No Saved Addresses</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-6">
            You don't have any saved delivery addresses yet. Add your home or office address for fast checkout.
          </p>
          <button
            onClick={openAddModal}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs"
          >
            Add First Address
          </button>
        </div>
      )}

      {/* ADDRESS MODAL (Country Specific) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-neutral-900 mb-1 font-['Outfit',sans-serif]">
                {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
              </h3>
              <p className="text-xs text-neutral-500 mb-6">
                Accurate address details ensure fast and seamless courier delivery
              </p>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Country Switcher inside modal */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Country
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setFormCountry(c);
                          setDivisionOrState('');
                          setDistrictOrCity('');
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          formCountry === c
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                            : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <span>{c === 'Bangladesh' ? '🇧🇩' : c === 'India' ? '🇮🇳' : '🇵🇰'}</span>
                        <span className="truncate">{c}</span>
                      </button>
                    ))}
                  </div>
                </div>

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
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                      Contact Mobile Number *
                    </label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-neutral-200 bg-neutral-100 text-xs font-bold text-neutral-700 select-none">
                        {phoneCode}
                      </span>
                      <input
                        type="tel"
                        value={mobileDigits}
                        onChange={(e) => setMobileDigits(e.target.value.replace(/\D/g, ''))}
                        placeholder="1712345678"
                        className="w-full pl-3 pr-3 py-2.5 rounded-r-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Country-Specific Division / District Fields */}
                {formCountry === 'Bangladesh' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                          Division *
                        </label>
                        <select
                          value={divisionOrState}
                          onChange={(e) => {
                            setDivisionOrState(e.target.value);
                            setDistrictOrCity('');
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                          required
                        >
                          <option value="">Select Division</option>
                          {Object.keys(BANGLADESH_DIVISIONS).map((div) => (
                            <option key={div} value={div}>
                              {div} Division
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                          District (64 Districts) *
                        </label>
                        <select
                          value={districtOrCity}
                          onChange={(e) => setDistrictOrCity(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                          required
                        >
                          <option value="">Select District</option>
                          {bdDistricts.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                        Upazila / Thana *
                      </label>
                      <input
                        type="text"
                        value={upazilaThana}
                        onChange={(e) => setUpazilaThana(e.target.value)}
                        placeholder="e.g. Dhanmondi, Mirpur, Gulshan, Savar"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                        required
                      />
                    </div>
                  </>
                )}

                {formCountry === 'India' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                        State / UT *
                      </label>
                      <select
                        value={divisionOrState}
                        onChange={(e) => setDivisionOrState(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                        required
                      >
                        <option value="">Select State</option>
                        {INDIA_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                        City / District *
                      </label>
                      <input
                        type="text"
                        value={districtOrCity}
                        onChange={(e) => setDistrictOrCity(e.target.value)}
                        placeholder="e.g. Mumbai, Bengaluru, Pune"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                        required
                      />
                    </div>
                  </div>
                )}

                {formCountry === 'Pakistan' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                        Province / Territory *
                      </label>
                      <select
                        value={divisionOrState}
                        onChange={(e) => setDivisionOrState(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                        required
                      >
                        <option value="">Select Province</option>
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
                        value={districtOrCity}
                        onChange={(e) => setDistrictOrCity(e.target.value)}
                        placeholder="e.g. Lahore, Karachi, Islamabad"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Street Address & Postal Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                      Street / House / Road Details *
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. House 42, Road 7A, Block D"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                      Postal / PIN Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 1209"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-indigo-600 outline-hidden font-mono"
                    />
                  </div>
                </div>

                {/* Address Label (Home, Office, Other) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Address Label
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Home', 'Office', 'Other'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLabel(l)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          label === l
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                            : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        {l === 'Office' ? <Building2 className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                        <span>{l}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Set as primary default delivery address</span>
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
