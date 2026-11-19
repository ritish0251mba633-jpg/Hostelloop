import { useState, FormEvent } from 'react';
import {
  Trash2,
  CheckCircle2,
  MessageSquare,
  Heart,
  Package,
  Star,
} from 'lucide-react';
import {
  AppRoute,
  AvailabilityStatus,
  InquiryRecord,
  ProductListing,
  UserProfile,
} from '../types/marketplace';
import { formatINR } from '../utils/marketplaceLogic';
import { api } from '../utils/api';
import { ProductImage } from './ProductImage';
import { ProductCard } from './ProductCard';

interface ActivityHubPageProps {
  activeTab: 'my-listings' | 'activity' | 'messages';
  onTabChange: (route: AppRoute) => void;
  currentUser: UserProfile | null;
  listings: ProductListing[];
  wishlistIds: string[];
  inquiries: InquiryRecord[];
  onToggleWishlist: (id: string) => void;
  onSelectListing: (listing: ProductListing) => void;
  onListingsChanged: () => void;
  onInquiriesChanged: () => void;
  onOpenAuth: () => void;
  onNavigateSell: () => void;
}

export function ActivityHubPage({
  activeTab,
  onTabChange,
  currentUser,
  listings,
  wishlistIds,
  inquiries,
  onToggleWishlist,
  onSelectListing,
  onListingsChanged,
  onInquiriesChanged,
  onOpenAuth,
  onNavigateSell,
}: ActivityHubPageProps) {
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackInquiry, setFeedbackInquiry] = useState<InquiryRecord | null>(null);
  const [rating, setRating] = useState(5);
  const [wouldUseAgain, setWouldUseAgain] = useState(true);
  const [alternativeUsed, setAlternativeUsed] = useState('WhatsApp student groups');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackSubmittedIds, setFeedbackSubmittedIds] = useState<string[]>([]);

  const myListings = currentUser
    ? listings.filter((l) => l.sellerId === currentUser.id)
    : [];
  const wishlistedItems = listings.filter((l) => wishlistIds.includes(l.id));
  const sentInquiries = currentUser
    ? inquiries.filter((i) => i.buyerId === currentUser.id)
    : [];
  const receivedInquiries = currentUser
    ? inquiries.filter((i) => i.sellerId === currentUser.id)
    : [];

  const handleAvailabilityUpdate = async (
    listingId: string,
    availability: AvailabilityStatus
  ) => {
    setUpdatingId(listingId);
    try {
      await api.updateListing(listingId, { availability });
      onListingsChanged();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    setUpdatingId(listingId);
    try {
      await api.deleteListing(listingId);
      onListingsChanged();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInquiryReply = async (
    inquiryId: string,
    status: InquiryRecord['status']
  ) => {
    setUpdatingId(inquiryId);
    try {
      await api.updateInquiry(inquiryId, {
        status,
        sellerReply: replyDrafts[inquiryId] || undefined,
      });
      onInquiriesChanged();
      onListingsChanged();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmitFeedback = async (e: FormEvent) => {
    e.preventDefault();
    if (!feedbackInquiry) return;
    await api.submitFeedback({
      inquiryId: feedbackInquiry.id,
      listingId: feedbackInquiry.listingId,
      listingTitle: feedbackInquiry.listingTitle,
      rating,
      wouldUseAgain,
      alternativeWouldHaveUsed: alternativeUsed,
      notes: feedbackNotes,
    });
    setFeedbackSubmittedIds((prev) => [...prev, feedbackInquiry.id]);
    setFeedbackInquiry(null);
    setFeedbackNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2EAE5]">
        <div>
          <p className="text-xs font-medium text-[#145C45] mb-1">
            Campus Workspace
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#202824] tracking-tight">
            {activeTab === 'my-listings'
              ? 'My Listings'
              : activeTab === 'messages'
                ? 'Messages & Buyer–Seller Inquiries'
                : 'My Activity & Saved Wishlist'}
          </h1>
          <p className="text-sm text-[#526058] mt-1">
            Manage your active items, saved essentials, and campus meetup inquiries.
          </p>
        </div>

        {/* Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#E2EAE5] rounded-xl self-start">
          <button
            type="button"
            onClick={() => onTabChange('my-listings')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'my-listings'
                ? 'bg-[#145C45] text-white'
                : 'text-[#526058] hover:text-[#202824]'
            }`}
          >
            My Listings ({myListings.length})
          </button>
          <button
            type="button"
            onClick={() => onTabChange('activity')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'activity'
                ? 'bg-[#145C45] text-white'
                : 'text-[#526058] hover:text-[#202824]'
            }`}
          >
            Wishlist ({wishlistedItems.length})
          </button>
          <button
            type="button"
            onClick={() => onTabChange('messages')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'messages'
                ? 'bg-[#145C45] text-white'
                : 'text-[#526058] hover:text-[#202824]'
            }`}
          >
            Messages ({inquiries.length})
          </button>
        </div>
      </div>

      {/* Tab 1: My Listings */}
      {activeTab === 'my-listings' && (
        <div className="mt-8">
          {!currentUser ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-8 text-center max-w-lg mx-auto">
              <Package className="w-8 h-8 text-[#145C45] mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-[#202824]">
                Sign in to manage your campus listings
              </h2>
              <p className="text-sm text-[#526058] mt-1">
                Sign in with your DGU email or enter Demo Mode to publish and manage hostel items.
              </p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="mt-5 px-5 py-2.5 bg-[#145C45] text-white text-sm font-medium rounded-lg"
              >
                Sign In / Enter Demo Mode
              </button>
            </div>
          ) : myListings.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center max-w-lg mx-auto">
              <h2 className="text-lg font-semibold text-[#202824]">
                You haven’t listed any items yet
              </h2>
              <p className="text-sm text-[#526058] mt-1">
                Have a lamp, textbook, kettle, or storage box you no longer need? List it for fellow DGU students.
              </p>
              <button
                type="button"
                onClick={onNavigateSell}
                className="mt-5 px-5 py-2.5 bg-[#145C45] text-white text-sm font-medium rounded-lg"
              >
                List Your First Item
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#E2EAE5] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <ProductImage
                      src={item.images[0]}
                      alt={item.title}
                      className="w-24 h-18 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-[#526058]">
                        {item.category} · {item.condition} · {item.transactionType}
                        {item.isDemo ? ' · DEMO LISTING' : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() => onSelectListing(item)}
                        className="text-base font-semibold text-[#202824] hover:text-[#145C45] text-left truncate block"
                      >
                        {item.title}
                      </button>
                      <p className="text-sm font-semibold text-[#145C45] font-mono-tabular mt-0.5">
                        {formatINR(item.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <label htmlFor={`avail-${item.id}`} className="sr-only">
                      Availability status for {item.title}
                    </label>
                    <select
                      id={`avail-${item.id}`}
                      value={item.availability}
                      disabled={updatingId === item.id}
                      onChange={(e) =>
                        handleAvailabilityUpdate(
                          item.id,
                          e.target.value as AvailabilityStatus
                        )
                      }
                      className="px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-xs font-medium text-[#202824]"
                    >
                      <option value={AvailabilityStatus.Available}>Available</option>
                      <option value={AvailabilityStatus.Reserved}>Reserved</option>
                      <option value={AvailabilityStatus.Sold}>Sold</option>
                    </select>

                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => handleDeleteListing(item.id)}
                      aria-label={`Delete ${item.title}`}
                      className="p-2 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Wishlist */}
      {activeTab === 'activity' && (
        <div className="mt-8">
          {wishlistedItems.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center max-w-lg mx-auto">
              <Heart className="w-8 h-8 text-[#145C45] mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-[#202824]">
                Your wishlist is empty
              </h2>
              <p className="text-sm text-[#526058] mt-1">
                Tap the heart icon on any campus listing to save it here while comparing prices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistedItems.map((item) => (
                <ProductCard
                  key={item.id}
                  listing={item}
                  isWishlisted={true}
                  onToggleWishlist={onToggleWishlist}
                  onSelect={onSelectListing}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Messages & Buyer-Seller Inquiries */}
      {activeTab === 'messages' && (
        <div className="mt-8 space-y-8">
          {!currentUser ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-8 text-center max-w-lg mx-auto">
              <MessageSquare className="w-8 h-8 text-[#145C45] mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-[#202824]">
                Sign in to view buyer and seller inquiries
              </h2>
              <p className="text-sm text-[#526058] mt-1">
                Note: Without an external real-time chat server configured, inquiries operate via persisted campus status tracking and Demo Mode.
              </p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="mt-5 px-5 py-2.5 bg-[#145C45] text-white text-sm font-medium rounded-lg"
              >
                Sign In / Enter Demo Mode
              </button>
            </div>
          ) : (
            <>
              {/* Demo Mode notice when applicable */}
              <div className="bg-[#DDF4E7]/60 border border-[#C3E5D2] rounded-xl px-4 py-3 text-xs text-[#202824]">
                <strong>Buyer–Seller Connection Notice:</strong> Inquiries are persisted in the local campus database. Real-time push chat/SMS is not connected in MVP v1; sellers coordinate directly via inquiry status updates or opted-in WhatsApp links.
              </div>

              {/* Sent Inquiries */}
              <section>
                <h2 className="text-lg font-semibold text-[#202824] mb-4">
                  Inquiries You Sent ({sentInquiries.length})
                </h2>
                {sentInquiries.length === 0 ? (
                  <p className="text-sm text-[#526058] bg-white border border-[#E2EAE5] rounded-xl p-6">
                    You haven’t contacted any sellers yet. Open a listing and click “Contact Seller” to propose a campus meetup.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sentInquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="bg-white border border-[#E2EAE5] rounded-xl p-5 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="text-xs text-[#526058]">
                              To {inq.sellerName} · {inq.preferredMeetupSpot} · {inq.proposedTime}
                              {inq.isDemo ? ' · DEMO INQUIRY' : ''}
                            </p>
                            <h3 className="text-base font-semibold text-[#202824] mt-0.5">
                              {inq.listingTitle} ·{' '}
                              <span className="font-mono-tabular text-[#145C45]">
                                {formatINR(inq.listingPrice)}
                              </span>
                            </h3>
                          </div>
                          <span className="text-xs font-semibold text-[#145C45] bg-[#DDF4E7] px-2.5 py-1 rounded-md self-start sm:self-center">
                            {inq.status}
                          </span>
                        </div>
                        <p className="text-sm text-[#202824] bg-[#F8FAF8] p-3 rounded-lg">
                          {inq.message}
                        </p>
                        {inq.sellerReply && (
                          <p className="text-sm text-[#145C45] bg-[#DDF4E7]/40 p-3 rounded-lg">
                            <strong>Seller reply:</strong> {inq.sellerReply}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                          {inq.status !== 'Completed' && (
                            <button
                              type="button"
                              onClick={() => handleInquiryReply(inq.id, 'Completed')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#145C45] text-white text-xs font-medium rounded-lg"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Meetup Completed</span>
                            </button>
                          )}
                          {inq.status === 'Completed' &&
                            !feedbackSubmittedIds.includes(inq.id) && (
                              <button
                                type="button"
                                onClick={() => setFeedbackInquiry(inq)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DDF4E7] text-[#145C45] text-xs font-medium rounded-lg"
                              >
                                <Star className="w-3.5 h-3.5" />
                                <span>Share Transaction Feedback</span>
                              </button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Received Inquiries */}
              <section>
                <h2 className="text-lg font-semibold text-[#202824] mb-4">
                  Inquiries Received on Your Listings ({receivedInquiries.length})
                </h2>
                {receivedInquiries.length === 0 ? (
                  <p className="text-sm text-[#526058] bg-white border border-[#E2EAE5] rounded-xl p-6">
                    No incoming buyer inquiries yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {receivedInquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="bg-white border border-[#E2EAE5] rounded-xl p-5 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="text-xs text-[#526058]">
                              From {inq.buyerName} ({inq.buyerEmail}) · {inq.preferredMeetupSpot}
                            </p>
                            <h3 className="text-base font-semibold text-[#202824] mt-0.5">
                              {inq.listingTitle}
                            </h3>
                          </div>
                          <span className="text-xs font-semibold text-[#145C45] bg-[#DDF4E7] px-2.5 py-1 rounded-md self-start">
                            {inq.status}
                          </span>
                        </div>

                        <p className="text-sm text-[#202824] bg-[#F8FAF8] p-3 rounded-lg">
                          {inq.message}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={replyDrafts[inq.id] ?? inq.sellerReply ?? ''}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({ ...prev, [inq.id]: e.target.value }))
                            }
                            placeholder="Write meetup confirmation or reply..."
                            className="flex-1 px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            disabled={updatingId === inq.id}
                            onClick={() => handleInquiryReply(inq.id, 'Seller Responded')}
                            className="px-4 py-2 bg-[#145C45] text-white text-xs font-medium rounded-lg whitespace-nowrap"
                          >
                            Send Reply
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === inq.id}
                            onClick={() => handleInquiryReply(inq.id, 'Completed')}
                            className="px-4 py-2 bg-[#DDF4E7] text-[#145C45] text-xs font-medium rounded-lg whitespace-nowrap"
                          >
                            Mark Completed
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* Post-Transaction Feedback Modal */}
      {feedbackInquiry && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSubmitFeedback}
            className="bg-white rounded-2xl border border-[#E2EAE5] max-w-md w-full p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-[#202824]">
              Post-Transaction Feedback: {feedbackInquiry.listingTitle}
            </h2>
            <p className="text-xs text-[#526058]">
              Helps validate the HostelLoop campus MVP (Mission 10).
            </p>
            <div>
              <label className="block text-xs font-medium text-[#526058] mb-1">
                Experience Rating (1–5)
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#D4E3DA] rounded-lg text-sm"
              >
                <option value={5}>5 — Smooth & trustworthy</option>
                <option value={4}>4 — Good campus exchange</option>
                <option value={3}>3 — Average</option>
                <option value={2}>2 — Needs improvement</option>
                <option value={1}>1 — Poor experience</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#526058] mb-1">
                What alternative would you have used without HostelLoop?
              </label>
              <select
                value={alternativeUsed}
                onChange={(e) => setAlternativeUsed(e.target.value)}
                className="w-full px-3 py-2 border border-[#D4E3DA] rounded-lg text-sm"
              >
                <option>WhatsApp student groups</option>
                <option>Buying new from local shop / Amazon</option>
                <option>Asking seniors or roommates</option>
                <option>OLX / general second-hand app</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#202824]">
              <input
                type="checkbox"
                checked={wouldUseAgain}
                onChange={(e) => setWouldUseAgain(e.target.checked)}
              />
              <span>I would use HostelLoop again and recommend it to peers</span>
            </label>
            <textarea
              rows={2}
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              placeholder="Any quick notes on meetup or condition..."
              className="w-full px-3 py-2 border border-[#D4E3DA] rounded-lg text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeedbackInquiry(null)}
                className="px-4 py-2 text-sm text-[#526058]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#145C45] text-white text-sm font-medium rounded-lg"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
