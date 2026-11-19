import { useState, FormEvent, ChangeEvent } from 'react';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  ItemCondition,
  ProductCategory,
  ProductListing,
  TransactionType,
  UserProfile,
} from '../types/marketplace';
import {
  ALL_CATEGORIES,
  ALL_CONDITIONS,
  ALL_TRANSACTION_TYPES,
  CAMPUS_PICKUP_LOCATIONS,
  ListingValidationErrors,
  validateListingInput,
} from '../utils/marketplaceLogic';
import { DEMO_PRODUCT_IMAGE_OPTIONS } from '../data/seedData';
import { api } from '../utils/api';
import { ProductImage } from './ProductImage';

interface SellItemPageProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onListingCreated: (listing: ProductListing) => void;
  onViewListing: (listing: ProductListing) => void;
}

export function SellItemPage({
  currentUser,
  onOpenAuth,
  onListingCreated,
  onViewListing,
}: SellItemPageProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProductCategory>(ProductCategory.StudyStationery);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.Sell);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [condition, setCondition] = useState<ItemCondition>(ItemCondition.LikeNew);
  const [description, setDescription] = useState('');
  const [pickupLocation, setPickupLocation] = useState(CAMPUS_PICKUP_LOCATIONS[0]);
  const [contactPreference, setContactPreference] = useState<
    'Campus Inquiry Only' | 'Campus Inquiry + WhatsApp'
  >('Campus Inquiry Only');
  const [sellerPhone, setSellerPhone] = useState(currentUser?.phone || '');
  const [exchangePreference, setExchangePreference] = useState('');
  const [rentPeriod, setRentPeriod] = useState('Per Month');
  const [featuredExperimentOptIn, setFeaturedExperimentOptIn] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const [errors, setErrors] = useState<ListingValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdListing, setCreatedListing] = useState<ProductListing | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files)
      .slice(0, 4 - images.length)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setImages((prev) => [...prev, reader.result as string].slice(0, 4));
            setErrors((prev) => ({ ...prev, images: undefined }));
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const addSampleImage = (url: string) => {
    setImages((prev) => (prev.includes(url) ? prev : [...prev, url].slice(0, 4)));
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const effectivePrice = transactionType === TransactionType.Donate ? 0 : price;
    const validation = validateListingInput({
      title,
      category,
      description,
      price: effectivePrice,
      originalPrice,
      condition,
      transactionType,
      pickupLocation,
      images,
      contactPreference,
      sellerPhone,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const { listing } = await api.createListing({
        title,
        category,
        description,
        price: Number(effectivePrice),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        condition,
        transactionType,
        pickupLocation,
        images,
        contactPreference,
        sellerPhone: contactPreference === 'Campus Inquiry + WhatsApp' ? sellerPhone : undefined,
        exchangePreference:
          transactionType === TransactionType.Exchange ? exchangePreference : undefined,
        rentPeriod: transactionType === TransactionType.Rent ? rentPeriod : undefined,
        featuredExperimentOptIn,
      });
      setCreatedListing(listing);
      onListingCreated(listing);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Unable to publish listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setPrice('');
    setOriginalPrice('');
    setDescription('');
    setImages([]);
    setExchangePreference('');
    setFeaturedExperimentOptIn(false);
    setCreatedListing(null);
    setErrors({});
  };

  if (createdListing) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-[#E2EAE5] p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#DDF4E7] text-[#145C45] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#202824]">
            Your Listing Is Live on HostelLoop
          </h1>
          <p className="text-sm text-[#526058]">
            <strong>{createdListing.title}</strong> has been added to the DGU campus marketplace
            and appears in Explore and My Listings.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onViewListing(createdListing)}
              className="px-5 py-2.5 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-lg"
            >
              View Listing Page
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 bg-[#DDF4E7] hover:bg-[#CBEBD9] text-[#145C45] text-sm font-medium rounded-lg"
            >
              List Another Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="pb-6 border-b border-[#E2EAE5] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#145C45] mb-1">
            Campus Seller Studio
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#202824] tracking-tight">
            List an Item for DGU Students
          </h1>
          <p className="text-sm text-[#526058] mt-1">
            Sell, exchange, rent, or donate reusable hostel and study essentials within campus.
          </p>
        </div>

        {!currentUser && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-4 py-2 bg-[#DDF4E7] text-[#145C45] text-sm font-medium rounded-lg whitespace-nowrap shrink-0"
          >
            Sign In or Enter Demo Mode to Publish
          </button>
        )}
      </div>

      {serverError && (
        <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        <div className="bg-white rounded-2xl border border-[#E2EAE5] p-6 space-y-5">
          <h2 className="text-base font-semibold text-[#202824]">
            1. Item Details & Transaction Mode
          </h2>

          {/* Transaction Mode Segmented Tabs */}
          <div>
            <span className="block text-xs font-medium text-[#526058] mb-2">
              Transaction Type
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_TRANSACTION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setTransactionType(type);
                    if (type === TransactionType.Donate) setPrice('0');
                  }}
                  className={`py-2.5 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    transactionType === type
                      ? 'bg-[#145C45] text-white border-[#145C45]'
                      : 'bg-[#F8FAF8] text-[#202824] border-[#D4E3DA] hover:bg-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="sell-title"
                className="block text-xs font-medium text-[#526058] mb-1.5"
              >
                Product Name *
              </label>
              <input
                id="sell-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Wooden Study Desk Lamp or Casio Scientific Calculator"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824] focus:outline-none focus:border-[#145C45]"
              />
              {errors.title && (
                <p className="text-xs text-rose-700 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sell-category"
                className="block text-xs font-medium text-[#526058] mb-1.5"
              >
                Category *
              </label>
              <select
                id="sell-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824]"
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sell-condition"
                className="block text-xs font-medium text-[#526058] mb-1.5"
              >
                Condition *
              </label>
              <select
                id="sell-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824]"
              >
                {ALL_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sell-price"
                className="block text-xs font-medium text-[#526058] mb-1.5"
              >
                {transactionType === TransactionType.Rent
                  ? 'Rental Price (₹) *'
                  : transactionType === TransactionType.Donate
                    ? 'Price (₹0 for Donation)'
                    : 'Selling Price (₹) *'}
              </label>
              <input
                id="sell-price"
                type="number"
                min="0"
                disabled={transactionType === TransactionType.Donate}
                value={transactionType === TransactionType.Donate ? '0' : price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 350"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824] font-mono-tabular disabled:opacity-60"
              />
              {errors.price && (
                <p className="text-xs text-rose-700 mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sell-original-price"
                className="block text-xs font-medium text-[#526058] mb-1.5"
              >
                Original Retail Price (₹, Optional)
              </label>
              <input
                id="sell-original-price"
                type="number"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="e.g., 899"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824] font-mono-tabular"
              />
              {errors.originalPrice && (
                <p className="text-xs text-rose-700 mt-1">{errors.originalPrice}</p>
              )}
            </div>

            {transactionType === TransactionType.Exchange && (
              <div className="sm:col-span-2">
                <label
                  htmlFor="sell-exchange-pref"
                  className="block text-xs font-medium text-[#526058] mb-1.5"
                >
                  What would you like to exchange for?
                </label>
                <input
                  id="sell-exchange-pref"
                  type="text"
                  value={exchangePreference}
                  onChange={(e) => setExchangePreference(e.target.value)}
                  placeholder="e.g., MBA semester textbooks or desk organizer"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                />
              </div>
            )}

            {transactionType === TransactionType.Rent && (
              <div className="sm:col-span-2">
                <label
                  htmlFor="sell-rent-period"
                  className="block text-xs font-medium text-[#526058] mb-1.5"
                >
                  Rental Duration Unit
                </label>
                <select
                  id="sell-rent-period"
                  value={rentPeriod}
                  onChange={(e) => setRentPeriod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                >
                  <option>Per Week</option>
                  <option>Per Month</option>
                  <option>Per Semester</option>
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label
                htmlFor="sell-description"
                className="block text-xs font-medium text-[#526058] mb-1.5"
              >
                Honest Description & Condition Notes *
              </label>
              <textarea
                id="sell-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention how long you used it, any minor wear/scratches, and what accessories are included..."
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824]"
              />
              {errors.description && (
                <p className="text-xs text-rose-700 mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Photos */}
        <div className="bg-white rounded-2xl border border-[#E2EAE5] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#202824]">
                2. Product Photographs *
              </h2>
              <p className="text-xs text-[#526058]">
                Upload up to 4 clear photos (or select a sample hostel item photo below for pilot testing).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#DDF4E7] hover:bg-[#CBEBD9] text-[#145C45] text-sm font-medium rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
            <span className="text-xs text-[#526058]">
              {images.length}/4 added
            </span>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {images.map((src, idx) => (
                <div
                  key={`preview-${idx}`}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#E2EAE5]"
                >
                  <ProductImage
                    src={src}
                    alt={`Uploaded preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    aria-label={`Remove photo ${idx + 1}`}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/70 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick sample presets */}
          <div className="pt-2 border-t border-[#EEF3EF]">
            <p className="text-xs text-[#526058] mb-2">
              Quick Sample Product Photos (for testing without uploading files):
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {DEMO_PRODUCT_IMAGE_OPTIONS.slice(0, 6).map((opt) => (
                <button
                  key={opt.url}
                  type="button"
                  onClick={() => addSampleImage(opt.url)}
                  className="px-2.5 py-1.5 text-xs bg-[#F8FAF8] hover:bg-[#DDF4E7] border border-[#D4E3DA] rounded-md text-[#202824] whitespace-nowrap shrink-0"
                >
                  + {opt.label}
                </button>
              ))}
            </div>
          </div>

          {errors.images && (
            <p className="text-xs text-rose-700">{errors.images}</p>
          )}
        </div>

        {/* 3. Pickup & Contact Preference */}
        <div className="bg-white rounded-2xl border border-[#E2EAE5] p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#202824]">
            3. Campus Pickup & Contact Preference
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sell-pickup"
                className="block text-xs font-medium text-[#526058] mb-1.5"
              >
                Campus Pickup Location *
              </label>
              <select
                id="sell-pickup"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824]"
              >
                {CAMPUS_PICKUP_LOCATIONS.map((spot) => (
                  <option key={spot} value={spot}>
                    {spot}
                  </option>
                ))}
              </select>
              {errors.pickupLocation && (
                <p className="text-xs text-rose-700 mt-1">{errors.pickupLocation}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sell-contact-pref"
                className="block text-xs font-medium text-[#526058] mb-1.5"
              >
                Seller Contact Preference
              </label>
              <select
                id="sell-contact-pref"
                value={contactPreference}
                onChange={(e) =>
                  setContactPreference(
                    e.target.value as 'Campus Inquiry Only' | 'Campus Inquiry + WhatsApp'
                  )
                }
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824]"
              >
                <option value="Campus Inquiry Only">Campus Inquiry Only</option>
                <option value="Campus Inquiry + WhatsApp">Campus Inquiry + WhatsApp</option>
              </select>
            </div>

            {contactPreference === 'Campus Inquiry + WhatsApp' && (
              <div className="sm:col-span-2">
                <label
                  htmlFor="sell-phone"
                  className="block text-xs font-medium text-[#526058] mb-1.5"
                >
                  WhatsApp Mobile Number (10-digit Indian mobile) *
                </label>
                <input
                  id="sell-phone"
                  type="tel"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="e.g., 9876543210"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm font-mono-tabular"
                />
                {errors.sellerPhone && (
                  <p className="text-xs text-rose-700 mt-1">{errors.sellerPhone}</p>
                )}
              </div>
            )}
          </div>

          {/* Optional Pilot Experiment Notice (No payment charged) */}
          <div className="pt-3 border-t border-[#EEF3EF]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={featuredExperimentOptIn}
                onChange={(e) => setFeaturedExperimentOptIn(e.target.checked)}
                className="mt-0.5 rounded border-[#C5D5CC] text-[#145C45] focus:ring-[#145C45]"
              />
              <span className="text-xs text-[#526058] leading-relaxed">
                <strong className="text-[#202824]">
                  Express interest in ₹20 Featured Listing Pilot Experiment (No payment charged)
                </strong>{' '}
                — Helps the HostelLoop venture team measure seller willingness to pay during the
                DGU 30-day pilot. No fees are collected automatically.
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-[#145C45] hover:bg-[#0F4634] disabled:bg-[#9FB3A7] text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting
              ? 'Publishing Listing...'
              : currentUser
                ? 'Publish Campus Listing'
                : 'Sign In & Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
