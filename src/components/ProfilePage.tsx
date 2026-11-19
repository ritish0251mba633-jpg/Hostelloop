import { useState, FormEvent } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Mail,
  User,
} from 'lucide-react';
import {
  AppRoute,
  AvailabilityStatus,
  InquiryRecord,
  ProductListing,
  UserProfile,
  VerificationStatus,
} from '../types/marketplace';
import { api } from '../utils/api';

interface ProfilePageProps {
  currentUser: UserProfile | null;
  listings: ProductListing[];
  wishlistIds: string[];
  inquiries: InquiryRecord[];
  onProfileUpdated: (user: UserProfile) => void;
  onOpenAuth: () => void;
  onNavigate: (route: AppRoute) => void;
}

export function ProfilePage({
  currentUser,
  listings,
  wishlistIds,
  inquiries,
  onProfileUpdated,
  onOpenAuth,
  onNavigate,
}: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [hostelBlock, setHostelBlock] = useState(currentUser?.hostelBlock || 'Boys Hostel Block A');
  const [roomNumber, setRoomNumber] = useState(currentUser?.roomNumber || '');
  const [programAndYear, setProgramAndYear] = useState(currentUser?.programAndYear || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [whatsappOptIn, setWhatsappOptIn] = useState(currentUser?.whatsappOptIn || false);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [simulatedInboxCode, setSimulatedInboxCode] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-8 text-center space-y-4">
          <User className="w-10 h-10 text-[#145C45] mx-auto" />
          <h1 className="text-2xl font-bold text-[#202824]">
            Student Profile & Account
          </h1>
          <p className="text-sm text-[#526058]">
            Sign in with your DGU student email (@dgu.ac.in) or explore using our clearly labelled Demo Mode.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-6 py-3 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-lg"
          >
            Sign In / Create DGU Account
          </button>
        </div>
      </div>
    );
  }

  const myListings = listings.filter((l) => l.sellerId === currentUser.id);
  const itemsSold = myListings.filter((l) => l.availability === AvailabilityStatus.Sold).length;
  const itemsPurchased = inquiries.filter(
    (i) => i.buyerId === currentUser.id && i.status === 'Completed'
  ).length;
  const myInquiriesCount = inquiries.filter(
    (i) => i.buyerId === currentUser.id || i.sellerId === currentUser.id
  ).length;

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    try {
      const { user } = await api.updateProfile({
        name,
        hostelBlock,
        roomNumber,
        programAndYear,
        phone,
        whatsappOptIn,
        bio,
      });
      onProfileUpdated(user);
      setEditing(false);
      setSaveMessage('Profile updated successfully.');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestCode = async () => {
    setVerifyError(null);
    try {
      const res = await api.resendVerificationCode();
      setSimulatedInboxCode(res.demoVerificationCode);
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Could not generate code.');
    }
  };

  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError(null);
    try {
      const { user } = await api.verifyEmail(verificationCodeInput);
      onProfileUpdated(user);
      setVerificationCodeInput('');
      setSimulatedInboxCode(null);
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const initials = currentUser.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header Card */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-5">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-16 h-16 rounded-full object-cover border border-[#D4E3DA]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#145C45] text-white flex items-center justify-center text-xl font-bold shrink-0">
              {initials}
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-[#202824]">{currentUser.name}</h1>
              {currentUser.verificationStatus === VerificationStatus.Verified ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#145C45] bg-[#DDF4E7] px-2.5 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified DGU Student
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {currentUser.isDemoAccount
                    ? 'Demo Mode Account (Unverified)'
                    : 'Pending DGU Email Verification'}
                </span>
              )}
            </div>
            <p className="text-sm text-[#526058] mt-1">
              {currentUser.email} · {currentUser.programAndYear} · {currentUser.hostelBlock}
              {currentUser.roomNumber ? ` (${currentUser.roomNumber})` : ''}
            </p>
            <p className="text-sm text-[#202824] mt-2 max-w-2xl">{currentUser.bio}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setName(currentUser.name);
            setHostelBlock(currentUser.hostelBlock);
            setRoomNumber(currentUser.roomNumber);
            setProgramAndYear(currentUser.programAndYear);
            setPhone(currentUser.phone);
            setWhatsappOptIn(currentUser.whatsappOptIn);
            setBio(currentUser.bio);
            setEditing((prev) => !prev);
          }}
          className="px-4 py-2.5 bg-[#DDF4E7] hover:bg-[#CBEBD9] text-[#145C45] text-sm font-medium rounded-lg whitespace-nowrap self-start md:self-center"
        >
          {editing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      {/* Truthful Verification Banner if Pending */}
      {currentUser.verificationStatus === VerificationStatus.Pending &&
        !currentUser.isDemoAccount && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#202824] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-700" />
                  <span>Complete Your DGU Email Verification</span>
                </h2>
                <p className="text-xs text-[#526058] mt-1">
                  Your account is restricted until you confirm ownership of {currentUser.email}. HostelLoop never marks unverified students as verified.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRequestCode}
                className="px-4 py-2 bg-white border border-amber-300 text-xs font-medium text-[#202824] rounded-lg whitespace-nowrap self-start"
              >
                Send Verification Code
              </button>
            </div>

            {simulatedInboxCode && (
              <p className="text-xs bg-white border border-amber-200 p-3 rounded-lg text-[#202824]">
                <strong>Simulated Campus Inbox (Local Mode):</strong> Your 6-digit DGU verification code is{' '}
                <span className="font-mono-tabular font-bold text-[#145C45]">
                  {simulatedInboxCode}
                </span>
              </p>
            )}

            <form onSubmit={handleVerifyEmail} className="flex flex-col sm:flex-row gap-2.5 max-w-md">
              <input
                type="text"
                value={verificationCodeInput}
                onChange={(e) => setVerificationCodeInput(e.target.value)}
                placeholder="Enter 6-digit code"
                className="flex-1 px-3.5 py-2 bg-white border border-amber-300 rounded-lg text-sm font-mono-tabular"
                required
              />
              <button
                type="submit"
                disabled={verifying}
                className="px-4 py-2 bg-[#145C45] text-white text-sm font-medium rounded-lg"
              >
                {verifying ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
            {verifyError && <p className="text-xs text-rose-700">{verifyError}</p>}
          </div>
        )}

      {saveMessage && (
        <div className="p-3.5 bg-[#DDF4E7] text-[#145C45] rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Edit Profile Form */}
      {editing && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-[#E2EAE5] rounded-2xl p-6 space-y-4"
        >
          <h2 className="text-base font-semibold text-[#202824]">
            Edit Student Profile & Account Settings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#526058] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#526058] mb-1">
                Program & Year
              </label>
              <input
                type="text"
                value={programAndYear}
                onChange={(e) => setProgramAndYear(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#526058] mb-1">
                Hostel Block
              </label>
              <select
                value={hostelBlock}
                onChange={(e) => setHostelBlock(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
              >
                <option>Boys Hostel Block A</option>
                <option>Boys Hostel Block B</option>
                <option>Girls Hostel Block</option>
                <option>Off-Campus Selaqui</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#526058] mb-1">
                Room Number (Optional)
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#526058] mb-1">
                Mobile Number (for optional WhatsApp contact)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit Indian mobile"
                className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm font-mono-tabular"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 text-sm text-[#202824] cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                />
                <span>Allow buyers to see WhatsApp link on my listings</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#526058] mb-1">
                Short Campus Bio
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm text-[#526058]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#145C45] text-white text-sm font-medium rounded-lg"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('my-listings')}
          className="bg-white border border-[#E2EAE5] hover:border-[#145C45] rounded-xl p-5 text-left transition-colors"
        >
          <p className="text-xs text-[#526058]">My Listings</p>
          <p className="text-2xl font-bold text-[#202824] font-mono-tabular mt-1">
            {myListings.length}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('activity')}
          className="bg-white border border-[#E2EAE5] hover:border-[#145C45] rounded-xl p-5 text-left transition-colors"
        >
          <p className="text-xs text-[#526058]">Wishlist</p>
          <p className="text-2xl font-bold text-[#202824] font-mono-tabular mt-1">
            {wishlistIds.length}
          </p>
        </button>
        <div className="bg-white border border-[#E2EAE5] rounded-xl p-5">
          <p className="text-xs text-[#526058]">Items Sold</p>
          <p className="text-2xl font-bold text-[#202824] font-mono-tabular mt-1">
            {itemsSold}
          </p>
        </div>
        <div className="bg-white border border-[#E2EAE5] rounded-xl p-5">
          <p className="text-xs text-[#526058]">Items Purchased</p>
          <p className="text-2xl font-bold text-[#202824] font-mono-tabular mt-1">
            {itemsPurchased}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('messages')}
          className="bg-white border border-[#E2EAE5] hover:border-[#145C45] rounded-xl p-5 text-left transition-colors"
        >
          <p className="text-xs text-[#526058]">My Inquiries</p>
          <p className="text-2xl font-bold text-[#202824] font-mono-tabular mt-1">
            {myInquiriesCount}
          </p>
        </button>
      </div>
    </div>
  );
}
