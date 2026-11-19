import { useState, FormEvent } from 'react';
import {
  ArrowLeft,
  Heart,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  AvailabilityStatus,
  ProductListing,
  TransactionType,
  UserProfile,
  VerificationStatus,
} from '../types/marketplace';
import {
  buildWhatsAppLink,
  calculateDiscountPercent,
  CAMPUS_PICKUP_LOCATIONS,
  formatINR,
} from '../utils/marketplaceLogic';
import { api } from '../utils/api';
import { ProductImage } from './ProductImage';
import { ProductCard } from './ProductCard';

interface ProductDetailViewProps {
  listing: ProductListing;
  allListings: ProductListing[];
  wishlistIds: string[];
  currentUser: UserProfile | null;
  onBack: () => void;
  onToggleWishlist: (id: string) => void;
  onSelectListing: (listing: ProductListing) => void;
  onOpenAuth: () => void;
  onInquiryCreated: () => void;
}

export function ProductDetailView({
  listing,
  allListings,
  wishlistIds,
  currentUser,
  onBack,
  onToggleWishlist,
  onSelectListing,
  onOpenAuth,
  onInquiryCreated,
}: ProductDetailViewProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [meetupSpot, setMeetupSpot] = useState(listing.pickupLocation);
  const [proposedTime, setProposedTime] = useState('Today after 4:30 PM');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquiryFeedback, setInquiryFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Misleading item condition or pricing');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  const isWishlisted = wishlistIds.includes(listing.id);
  const discount = calculateDiscountPercent(listing.price, listing.originalPrice);
  const whatsappUrl = buildWhatsAppLink(listing.sellerPhone, listing.title);

  const similarProducts = allListings
    .filter((item) => item.id !== listing.id && item.category === listing.category)
    .slice(0, 3);

  const handleInquirySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSubmittingInquiry(true);
    setInquiryFeedback(null);
    try {
      await api.createInquiry({
        listingId: listing.id,
        message: inquiryMessage,
        preferredMeetupSpot: meetupSpot,
        proposedTime,
      });
      setInquiryFeedback({
        type: 'success',
        text: 'Inquiry submitted! Track seller responses inside My Activity & Messages.',
      });
      setInquiryMessage('');
      setShowInquiryForm(false);
      onInquiryCreated();
    } catch (err) {
      setInquiryFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to send inquiry.',
      });
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleReportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    try {
      await api.submitReport({
        targetType: 'listing',
        targetId: listing.id,
        targetName: listing.title,
        reason: reportReason,
        details: reportDetails,
      });
      setReportStatus('Report logged for campus moderation review.');
      setReportDetails('');
    } catch (err) {
      setReportStatus(err instanceof Error ? err.message : 'Failed to submit report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const verificationLabel =
    listing.sellerVerificationStatus === VerificationStatus.Verified
      ? 'Verified DGU Student'
      : listing.isDemo
        ? 'Demo Seed Seller (Not Verified)'
        : 'Pending DGU Verification';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb Back */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#526058] hover:text-[#145C45] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Marketplace</span>
      </button>

      {/* Main Contiguous 2-Column PDP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Gallery */}
        <div className="lg:col-span-7 space-y-3">
          <div className="aspect-[4/3] bg-white rounded-2xl border border-[#E2EAE5] overflow-hidden">
            <ProductImage
              src={listing.images[selectedImageIdx] || listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>

          {listing.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {listing.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  aria-label={`View photo ${idx + 1} of ${listing.title}`}
                  className={`w-20 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                    selectedImageIdx === idx
                      ? 'border-[#145C45]'
                      : 'border-[#E2EAE5] opacity-75 hover:opacity-100'
                  }`}
                >
                  <ProductImage
                    src={img}
                    alt={`${listing.title} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Contiguous Purchase & Inquiry Module */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2EAE5] p-6 sm:p-7 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#526058]">
              <span>{listing.category}</span>
              <span aria-hidden="true">·</span>
              <span>{listing.transactionType}</span>
              <span aria-hidden="true">·</span>
              <span>{listing.availability}</span>
              {listing.isDemo && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#145C45]">DEMO LISTING</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#202824] tracking-tight mt-2">
              {listing.title}
            </h1>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#145C45] font-mono-tabular">
                {listing.transactionType === TransactionType.Donate
                  ? 'Free · Campus Donation'
                  : formatINR(listing.price)}
              </span>
              {listing.rentPeriod && (
                <span className="text-xs text-[#526058]">{listing.rentPeriod}</span>
              )}
              {listing.originalPrice && listing.originalPrice > listing.price && (
                <>
                  <span className="text-sm text-[#73827A] line-through font-mono-tabular">
                    {formatINR(listing.originalPrice)}
                  </span>
                  {discount && (
                    <span className="text-xs font-semibold text-[#145C45]">
                      Save {discount}%
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Condition & Campus Pickup Grid */}
          <div className="grid grid-cols-2 gap-3 py-4 border-y border-[#EEF3EF] text-sm">
            <div>
              <p className="text-xs text-[#526058]">Disclosed Condition</p>
              <p className="font-semibold text-[#202824] mt-0.5">{listing.condition}</p>
            </div>
            <div>
              <p className="text-xs text-[#526058]">Listed On</p>
              <p className="font-medium text-[#202824] mt-0.5 flex items-center gap-1 font-mono-tabular text-xs">
                <Calendar className="w-3.5 h-3.5 text-[#526058]" />
                {new Date(listing.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-[#526058]">Preferred Campus Meetup Spot</p>
              <p className="font-medium text-[#202824] mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#145C45] shrink-0" />
                <span>{listing.pickupLocation}</span>
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xs font-semibold text-[#526058] uppercase tracking-wider">
              Item Description
            </h2>
            <p className="text-sm text-[#202824] leading-relaxed mt-2">
              {listing.description}
            </p>
            {listing.exchangePreference && (
              <p className="text-xs text-[#145C45] mt-2">
                Open to exchange for: {listing.exchangePreference}
              </p>
            )}
          </div>

          {/* Seller Profile Box */}
          <div className="bg-[#F8FAF8] rounded-xl border border-[#E2EAE5] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#526058]">Listed by</p>
                <p className="text-sm font-semibold text-[#202824] mt-0.5">
                  {listing.sellerName}
                </p>
                <p className="text-xs text-[#526058] mt-0.5">
                  {listing.sellerHostelBlock} · {listing.sellerContactPreference}
                </p>
              </div>
              <span
                className={`text-xs font-medium inline-flex items-center gap-1 ${
                  listing.sellerVerificationStatus === VerificationStatus.Verified
                    ? 'text-[#145C45]'
                    : 'text-[#526058]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{verificationLabel}</span>
              </span>
            </div>
          </div>

          {/* Inquiry Feedback */}
          {inquiryFeedback && (
            <div
              className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 ${
                inquiryFeedback.type === 'success'
                  ? 'bg-[#DDF4E7] text-[#145C45]'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{inquiryFeedback.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={listing.availability === AvailabilityStatus.Sold}
                onClick={() => {
                  if (!currentUser) {
                    onOpenAuth();
                  } else {
                    setShowInquiryForm((prev) => !prev);
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#145C45] hover:bg-[#0F4634] disabled:bg-[#9FB3A7] text-white text-sm font-medium rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {listing.availability === AvailabilityStatus.Sold
                    ? 'Item Sold'
                    : 'Contact Seller'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(listing.id)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                  isWishlisted
                    ? 'bg-[#DDF4E7] border-[#145C45] text-[#145C45]'
                    : 'bg-white border-[#D4E3DA] text-[#202824] hover:bg-[#F8FAF8]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                <span>{isWishlisted ? 'Saved' : 'Save to Wishlist'}</span>
              </button>
            </div>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#DDF4E7] hover:bg-[#CBEBD9] text-[#145C45] text-sm font-medium rounded-lg transition-colors"
              >
                <span>Message on WhatsApp (Seller Opted In)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Contact Seller Inquiry Form */}
          {showInquiryForm && (
            <form
              onSubmit={handleInquirySubmit}
              className="pt-4 border-t border-[#E2EAE5] space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#202824]">
                  Send Campus Inquiry
                </h3>
                <span className="text-[11px] text-[#526058]">
                  {listing.isDemo
                    ? 'Demo Mode Inquiry (No real seller alert)'
                    : 'Saved to Campus Activity'}
                </span>
              </div>

              <div>
                <label
                  htmlFor="inquiry-meetup"
                  className="block text-xs font-medium text-[#526058] mb-1"
                >
                  Proposed Campus Pickup Spot
                </label>
                <select
                  id="inquiry-meetup"
                  value={meetupSpot}
                  onChange={(e) => setMeetupSpot(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824]"
                >
                  {CAMPUS_PICKUP_LOCATIONS.map((spot) => (
                    <option key={spot} value={spot}>
                      {spot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="inquiry-time"
                  className="block text-xs font-medium text-[#526058] mb-1"
                >
                  Preferred Time Window
                </label>
                <input
                  id="inquiry-time"
                  type="text"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="inquiry-msg"
                  className="block text-xs font-medium text-[#526058] mb-1"
                >
                  Message to {listing.sellerName}
                </label>
                <textarea
                  id="inquiry-msg"
                  rows={3}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="Ask about item details, inspect availability, or confirm pickup..."
                  className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm text-[#202824]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInquiryForm(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[#526058] hover:text-[#202824]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="px-4 py-2 bg-[#145C45] hover:bg-[#0F4634] text-white text-xs font-medium rounded-lg"
                >
                  {submittingInquiry ? 'Sending...' : 'Submit Inquiry'}
                </button>
              </div>
            </form>
          )}

          {/* Safety & Report Footer */}
          <div className="pt-3 border-t border-[#EEF3EF] flex items-center justify-between text-xs text-[#526058]">
            <span>Inspect in person at a public DGU spot before paying.</span>
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1 text-rose-700 hover:underline whitespace-nowrap shrink-0"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report listing</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <div className="bg-white rounded-2xl border border-[#E2EAE5] max-w-md w-full p-6 space-y-4">
            <h2 id="report-modal-title" className="text-lg font-bold text-[#202824]">
              Report Listing: {listing.title}
            </h2>
            {reportStatus ? (
              <div className="space-y-4">
                <p className="text-sm text-[#145C45] bg-[#DDF4E7] p-3 rounded-lg">
                  {reportStatus}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportStatus(null);
                  }}
                  className="w-full py-2.5 bg-[#145C45] text-white text-sm font-medium rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="report-reason"
                    className="block text-xs font-medium text-[#526058] mb-1"
                  >
                    Reason
                  </label>
                  <select
                    id="report-reason"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D4E3DA] rounded-lg text-sm"
                  >
                    <option>Misleading item condition or pricing</option>
                    <option>Prohibited hostel item</option>
                    <option>Suspicious or duplicate listing</option>
                    <option>Seller unresponsive / safety concern</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="report-details"
                    className="block text-xs font-medium text-[#526058] mb-1"
                  >
                    Additional Details
                  </label>
                  <textarea
                    id="report-details"
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Share context for campus moderators..."
                    className="w-full px-3 py-2 border border-[#D4E3DA] rounded-lg text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-sm text-[#526058]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-sm font-medium rounded-lg"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="mt-14 pt-10 border-t border-[#E2EAE5]">
          <h2 className="text-xl font-bold text-[#202824] tracking-tight mb-6">
            Similar Items in {listing.category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((item) => (
              <ProductCard
                key={item.id}
                listing={item}
                isWishlisted={wishlistIds.includes(item.id)}
                onToggleWishlist={onToggleWishlist}
                onSelect={onSelectListing}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
