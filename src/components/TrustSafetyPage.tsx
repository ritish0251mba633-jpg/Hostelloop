import { useState, FormEvent } from 'react';
import {
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import { ProductListing } from '../types/marketplace';
import { CAMPUS_PICKUP_LOCATIONS } from '../utils/marketplaceLogic';
import { api } from '../utils/api';

interface TrustSafetyPageProps {
  listings: ProductListing[];
}

export function TrustSafetyPage({ listings }: TrustSafetyPageProps) {
  const [targetType, setTargetType] = useState<'listing' | 'user'>('listing');
  const [targetId, setTargetId] = useState(listings[0]?.id || 'general-campus-safety');
  const [reason, setReason] = useState('Misleading condition or photographs');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const handleReport = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmittedMsg(null);
    try {
      const targetListing = listings.find((l) => l.id === targetId);
      await api.submitReport({
        targetType,
        targetId,
        targetName:
          targetType === 'listing'
            ? targetListing?.title || targetId
            : targetId,
        reason,
        details,
      });
      setSubmittedMsg(
        'Your safety report has been recorded in the campus moderation queue.'
      );
      setDetails('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      <div className="pb-6 border-b border-[#E2EAE5]">
        <p className="text-xs font-medium text-[#145C45] mb-1">
          Campus Community Standards · DBS Global University
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#202824] tracking-tight">
          Trust & Safety on HostelLoop
        </h1>
        <p className="text-sm text-[#526058] mt-1 max-w-2xl">
          Peer-to-peer hostel exchanges work best when condition expectations, student identity,
          and public campus meetup locations are transparent.
        </p>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 space-y-2.5">
          <ShieldCheck className="w-6 h-6 text-[#145C45]" />
          <h2 className="text-base font-semibold text-[#202824]">
            Honest Verification Policy
          </h2>
          <p className="text-sm text-[#526058] leading-relaxed">
            Only accounts that confirm ownership of an authorized <strong>@dgu.ac.in</strong>{' '}
            student email receive the Verified DGU Student label. Demo accounts and pending
            sign-ups are explicitly marked as unverified.
          </p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 space-y-2.5">
          <FileCheck2 className="w-6 h-6 text-[#145C45]" />
          <h2 className="text-base font-semibold text-[#202824]">
            Condition Disclosure Rules
          </h2>
          <p className="text-sm text-[#526058] leading-relaxed">
            Sellers must classify every item honestly (Brand New, Like New, Good, or Fair) and
            state any scratches, missing parts, or hostel electrical compatibility notes upfront.
          </p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 space-y-2.5">
          <Camera className="w-6 h-6 text-[#145C45]" />
          <h2 className="text-base font-semibold text-[#202824]">
            Clear Product Photographs
          </h2>
          <p className="text-sm text-[#526058] leading-relaxed">
            Every listing requires clear photos so incoming students can inspect build quality
            before arranging a campus meetup.
          </p>
        </div>
      </div>

      {/* Safe Campus Meetup Spots + Buyer/Seller Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white border border-[#E2EAE5] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#202824] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#145C45]" />
            <span>Recommended Public Campus Meetup Zones</span>
          </h2>
          <p className="text-sm text-[#526058]">
            Always complete inspections and handovers in well-lit, populated DGU campus locations
            during daytime hours:
          </p>
          <ul className="space-y-2.5 text-sm text-[#202824]">
            {CAMPUS_PICKUP_LOCATIONS.map((spot) => (
              <li
                key={spot}
                className="flex items-center gap-2.5 p-2.5 bg-[#F8FAF8] rounded-lg border border-[#EEF3EF]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#145C45] shrink-0" />
                <span>{spot}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E2EAE5] rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-[#202824]">
            Buyer & Seller Guidelines
          </h2>
          <div className="space-y-4 text-sm text-[#526058]">
            <div>
              <h3 className="font-semibold text-[#202824]">For Hostel Buyers</h3>
              <ul className="mt-1.5 space-y-1 list-disc list-inside">
                <li>Test electronics (lamps, kettles, extension cords) before paying.</li>
                <li>Never pay an advance deposit to an unverified account before seeing the item.</li>
                <li>Confirm hostel appliance rules with your warden when purchasing high-wattage items.</li>
              </ul>
            </div>
            <div className="pt-3 border-t border-[#EEF3EF]">
              <h3 className="font-semibold text-[#202824]">For Senior & Student Sellers</h3>
              <ul className="mt-1.5 space-y-1 list-disc list-inside">
                <li>Clean and air out mattresses, chairs, and kettles prior to handover.</li>
                <li>Update listing status to Reserved or Sold promptly once committed.</li>
                <li>Meet at Hostel Reception or Academic Courtyard rather than private rooms.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Report Listing or User Form */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 sm:p-8">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-lg font-semibold text-[#202824] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-700" />
            <span>Report a Listing or User</span>
          </h2>
          <p className="text-sm text-[#526058]">
            Flag misleading condition descriptions, prohibited items, or unsafe student conduct for
            the HostelLoop campus moderation queue.
          </p>

          {submittedMsg && (
            <div className="p-3.5 bg-[#DDF4E7] text-[#145C45] rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submittedMsg}</span>
            </div>
          )}

          <form onSubmit={handleReport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#526058] mb-1">
                  Report Type
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as 'listing' | 'user')}
                  className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                >
                  <option value="listing">Report a Listing</option>
                  <option value="user">Report a User</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#526058] mb-1">
                  {targetType === 'listing' ? 'Select Listing' : 'User Name or Email'}
                </label>
                {targetType === 'listing' ? (
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                  >
                    {listings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({l.sellerName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="Enter student name or @dgu.ac.in email"
                    className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                    required
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#526058] mb-1">
                Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#526058] mb-1">
                Details for Moderators
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what happened..."
                className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-sm font-medium rounded-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Safety Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
