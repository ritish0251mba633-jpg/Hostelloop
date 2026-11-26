import { useState, FormEvent } from 'react';
import { CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types/marketplace';
import { api } from '../utils/api';
import { saveStoredFirebaseProfile } from '../utils/googleAuth';
import { CAMPUS_AFFILIATION_OPTIONS } from '../utils/marketplaceLogic';

interface ProfileCompletionPageProps {
  currentUser: UserProfile;
  onCompleted: (user: UserProfile) => Promise<void>;
}

export function ProfileCompletionPage({
  currentUser,
  onCompleted,
}: ProfileCompletionPageProps) {
  const [name, setName] = useState(currentUser.name || '');
  const [campusAffiliation, setCampusAffiliation] = useState(
    currentUser.campusAffiliation || CAMPUS_AFFILIATION_OPTIONS[0]
  );
  const [hostelBlock, setHostelBlock] = useState(currentUser.hostelBlock || 'Boys Hostel Block A');
  const [roomNumber, setRoomNumber] = useState(currentUser.roomNumber || '');
  const [programAndYear, setProgramAndYear] = useState(
    currentUser.programAndYear || 'MBA · 1st Year'
  );
  const [bio, setBio] = useState(currentUser.bio || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = (currentUser.name || 'S')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const buildCompletedLocalUser = (): UserProfile => {
    const updated: UserProfile = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      campusAffiliation,
      hostelBlock,
      roomNumber: roomNumber.trim(),
      programAndYear: programAndYear.trim(),
      bio: bio.trim() || currentUser.bio,
      profileCompleted: true,
    };
    saveStoredFirebaseProfile(updated);
    return updated;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user } = await api.completeProfile({
        name,
        campusAffiliation,
        hostelBlock,
        roomNumber,
        programAndYear,
        bio,
      });
      saveStoredFirebaseProfile(user);
      await onCompleted(user);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string };
      if (apiErr?.status === 404 && currentUser.authProvider === 'google_firebase') {
        await onCompleted(buildCompletedLocalUser());
      } else {
        setError(err instanceof Error ? err.message : 'Unable to save profile details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      const { user } = await api.completeProfile({
        name: name || currentUser.name,
        campusAffiliation,
        hostelBlock,
        roomNumber,
        programAndYear,
        bio,
      });
      saveStoredFirebaseProfile(user);
      await onCompleted(user);
    } catch {
      await onCompleted(buildCompletedLocalUser());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAF8] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white border border-[#E2EAE5] rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-5 border-b border-[#EEF3EF]">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border border-[#D4E3DA]"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#145C45] text-white flex items-center justify-center font-bold text-lg">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#145C45] bg-[#DDF4E7] px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3" />
              Google Account Connected
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#202824] mt-1">
              Complete Your Campus Profile
            </h1>
            <p className="text-xs text-[#526058] truncate">{currentUser.email}</p>
          </div>
        </div>

        <div className="p-3.5 bg-[#F8FAF8] border border-[#E2EAE5] rounded-xl text-xs text-[#526058] flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            You are signed in as <strong>Google Signed In · Campus Unverified</strong>. Select your
            campus affiliation below—if you have a <code className="text-[#145C45]">@dgu.ac.in</code>{' '}
            email, you can optionally verify it anytime in Profile Settings for a Verified DGU
            Student badge.
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="complete-name"
              className="block text-xs font-medium text-[#526058] mb-1"
            >
              Display Name *
            </label>
            <input
              id="complete-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="complete-campus"
              className="block text-xs font-medium text-[#526058] mb-1"
            >
              Campus Affiliation *
            </label>
            <select
              id="complete-campus"
              value={campusAffiliation}
              onChange={(e) => setCampusAffiliation(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
            >
              {CAMPUS_AFFILIATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="complete-hostel"
                className="block text-xs font-medium text-[#526058] mb-1"
              >
                Hostel / Residence Area *
              </label>
              <select
                id="complete-hostel"
                value={hostelBlock}
                onChange={(e) => setHostelBlock(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
              >
                <option>Boys Hostel Block A</option>
                <option>Boys Hostel Block B</option>
                <option>Girls Hostel Block</option>
                <option>Off-Campus Selaqui</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="complete-room"
                className="block text-xs font-medium text-[#526058] mb-1"
              >
                Room Number (Optional)
              </label>
              <input
                id="complete-room"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g., A-214"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="complete-program"
              className="block text-xs font-medium text-[#526058] mb-1"
            >
              Program & Year
            </label>
            <input
              id="complete-program"
              type="text"
              value={programAndYear}
              onChange={(e) => setProgramAndYear(e.target.value)}
              placeholder="e.g., MBA · 1st Year or B.Tech CSE · 2nd Year"
              className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="complete-bio"
              className="block text-xs font-medium text-[#526058] mb-1"
            >
              Short Introduction (Optional)
            </label>
            <textarea
              id="complete-bio"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What hostel essentials are you looking for or passing on?"
              className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
              className="text-xs font-medium text-[#526058] hover:text-[#202824]"
            >
              Skip for now & explore marketplace
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-xl transition-colors"
            >
              <span>{submitting ? 'Saving Profile...' : 'Continue to Marketplace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
