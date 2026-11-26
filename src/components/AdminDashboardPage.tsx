import { useEffect, useState, useCallback } from 'react';
import {
  Check,
  X,
  ShieldAlert,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  ModerationStatus,
  ProductListing,
  ReportRecord,
  TransactionFeedback,
  UnitEconomicsScenario,
  UserProfile,
} from '../types/marketplace';
import {
  ILLUSTRATIVE_PILOT_METRICS,
  VENTURE_SCENARIOS,
} from '../data/seedData';
import {
  calculateUnitEconomics,
  formatINR,
  getUserIdentityBadge,
} from '../utils/marketplaceLogic';
import { api } from '../utils/api';

interface AdminDashboardPageProps {
  currentUser: UserProfile | null;
  onEnterDemoAdmin: () => void;
  onDataMutated: () => void;
}

export function AdminDashboardPage({
  currentUser,
  onEnterDemoAdmin,
  onDataMutated,
}: AdminDashboardPageProps) {
  const [adminTab, setAdminTab] = useState<
    'listings' | 'users' | 'reports' | 'business-model'
  >('listings');
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    totalListings: 0,
    demoListingsCount: 0,
    liveUserListingsCount: 0,
    activeListings: 0,
    pendingListings: 0,
    completedTransactions: 0,
    reportedListings: 0,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [feedback, setFeedback] = useState<TransactionFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedScenarioName, setSelectedScenarioName] =
    useState<UnitEconomicsScenario['name']>('Base');

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOverview();
      setStats(res.stats);
      setUsers(res.users);
      setListings(res.listings);
      setReports(res.reports);
      setFeedback(res.feedback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const isAdmin = currentUser?.role === 'admin';

  const handleModerateListing = async (
    listingId: string,
    moderationStatus: ModerationStatus
  ) => {
    setActionError(null);
    try {
      await api.updateListing(listingId, { moderationStatus });
      await fetchOverview();
      onDataMutated();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Switch to Demo Admin to perform moderation actions.'
      );
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    setActionError(null);
    try {
      const next = user.accountStatus === 'active' ? 'suspended' : 'active';
      await api.updateUserStatus(user.id, next);
      await fetchOverview();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Admin permission required.'
      );
    }
  };

  const handleReportAction = async (
    reportId: string,
    status: 'resolved' | 'dismissed'
  ) => {
    setActionError(null);
    try {
      await api.updateReportStatus(reportId, status);
      await fetchOverview();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Admin permission required.'
      );
    }
  };

  const activeScenario =
    VENTURE_SCENARIOS.find((s) => s.name === selectedScenarioName) ||
    VENTURE_SCENARIOS[1];
  const calculated = calculateUnitEconomics(activeScenario);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header + Demo Admin Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2EAE5]">
        <div>
          <p className="text-xs font-medium text-[#145C45] mb-1">
            Campus Operations & Venture Pilot Console
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#202824] tracking-tight">
            Admin & Moderation Dashboard
          </h1>
          <p className="text-sm text-[#526058] mt-1">
            Distinguishes live local database counts from illustrative DGU Venture Quest planning assumptions.
          </p>
        </div>

        {!isAdmin && (
          <button
            type="button"
            onClick={onEnterDemoAdmin}
            className="px-4 py-2.5 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-lg whitespace-nowrap shrink-0"
          >
            Enable Demo Admin Controls
          </button>
        )}
      </div>

      {/* Explicit Data Provenance Banner */}
      <div className="bg-[#DDF4E7]/60 border border-[#C3E5D2] rounded-xl p-4 flex items-start gap-3 text-xs text-[#202824]">
        <Info className="w-4 h-4 text-[#145C45] mt-0.5 shrink-0" />
        <div>
          <strong>Analytics Transparency:</strong> Counts below combine{' '}
          <span className="font-mono-tabular font-semibold">
            {stats.demoListingsCount} seeded demo listings
          </span>{' '}
          with{' '}
          <span className="font-mono-tabular font-semibold">
            {stats.liveUserListingsCount} user-created listings
          </span>{' '}
          stored in this environment. Business model projections in the Business Model tab are{' '}
          <strong>proposed venture assumptions</strong>, not actual revenue.
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-[#E2EAE5] rounded-xl p-4">
          <p className="text-xs text-[#526058]">Total Users</p>
          <p className="text-2xl font-bold text-[#202824] font-mono-tabular mt-1">
            {loading ? '—' : stats.totalUsers}
          </p>
          <p className="text-[11px] text-[#526058] mt-1">
            {stats.verifiedUsers} DGU verified
          </p>
        </div>
        <div className="bg-white border border-[#E2EAE5] rounded-xl p-4">
          <p className="text-xs text-[#526058]">Total Listings</p>
          <p className="text-2xl font-bold text-[#202824] font-mono-tabular mt-1">
            {loading ? '—' : stats.totalListings}
          </p>
          <p className="text-[11px] text-[#526058] mt-1">
            {stats.demoListingsCount} demo · {stats.liveUserListingsCount} live
          </p>
        </div>
        <div className="bg-white border border-[#E2EAE5] rounded-xl p-4">
          <p className="text-xs text-[#526058]">Active Listings</p>
          <p className="text-2xl font-bold text-[#145C45] font-mono-tabular mt-1">
            {loading ? '—' : stats.activeListings}
          </p>
        </div>
        <div className="bg-white border border-[#E2EAE5] rounded-xl p-4">
          <p className="text-xs text-[#526058]">Pending Review</p>
          <p className="text-2xl font-bold text-amber-700 font-mono-tabular mt-1">
            {loading ? '—' : stats.pendingListings}
          </p>
        </div>
        <div className="bg-white border border-[#E2EAE5] rounded-xl p-4">
          <p className="text-xs text-[#526058]">Completed Txns</p>
          <p className="text-2xl font-bold text-[#202824] font-mono-tabular mt-1">
            {loading ? '—' : stats.completedTransactions}
          </p>
        </div>
        <div className="bg-white border border-[#E2EAE5] rounded-xl p-4">
          <p className="text-xs text-[#526058]">Open Reports</p>
          <p className="text-2xl font-bold text-rose-700 font-mono-tabular mt-1">
            {loading ? '—' : stats.reportedListings}
          </p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E2EAE5] pb-2">
        {(
          [
            { id: 'listings', label: 'Listing Moderation' },
            { id: 'users', label: 'User Management' },
            { id: 'reports', label: `Safety Reports (${reports.length})` },
            { id: 'business-model', label: 'Business Model & Pilot Economics' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setAdminTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              adminTab === tab.id
                ? 'bg-[#145C45] text-white'
                : 'text-[#526058] hover:bg-white hover:text-[#202824]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Listing Moderation Table */}
      {adminTab === 'listings' && (
        <div className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAF8] border-b border-[#E2EAE5] text-xs text-[#526058]">
                <tr>
                  <th className="py-3 px-4 font-medium">Listing</th>
                  <th className="py-3 px-4 font-medium">Origin</th>
                  <th className="py-3 px-4 font-medium">Seller</th>
                  <th className="py-3 px-4 font-medium text-right">Price</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3EF]">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAF8]/60">
                    <td className="py-3 px-4 font-medium text-[#202824]">
                      {item.title}
                      <span className="block text-xs font-normal text-[#526058]">
                        {item.category} · {item.condition}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#526058]">
                      {item.isDemo ? 'Sample Demo' : 'User Created'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#202824]">
                      {item.sellerName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular font-medium">
                      {formatINR(item.price)}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span
                        className={`font-medium ${
                          item.moderationStatus === ModerationStatus.Approved
                            ? 'text-[#145C45]'
                            : item.moderationStatus === ModerationStatus.Pending
                              ? 'text-amber-700'
                              : 'text-rose-700'
                        }`}
                      >
                        {item.moderationStatus} · {item.availability}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleModerateListing(item.id, ModerationStatus.Approved)
                          }
                          aria-label={`Approve ${item.title}`}
                          className="p-1.5 text-[#145C45] hover:bg-[#DDF4E7] rounded-md"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleModerateListing(item.id, ModerationStatus.Rejected)
                          }
                          aria-label={`Reject ${item.title}`}
                          className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-md"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. User Management */}
      {adminTab === 'users' && (
        <div className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAF8] border-b border-[#E2EAE5] text-xs text-[#526058]">
                <tr>
                  <th className="py-3 px-4 font-medium">Student</th>
                  <th className="py-3 px-4 font-medium">Email & Auth</th>
                  <th className="py-3 px-4 font-medium">Verification</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3EF]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAF8]/60">
                    <td className="py-3 px-4 font-medium text-[#202824]">
                      {u.name}
                      <span className="block text-xs font-normal text-[#526058]">
                        {u.hostelBlock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#526058]">
                      {u.email}
                      {u.campusEmail && u.campusEmail !== u.email && (
                        <span className="block text-[11px] text-[#145C45]">
                          Campus: {u.campusEmail}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {getUserIdentityBadge(u).label}
                    </td>
                    <td className="py-3 px-4 text-xs capitalize">{u.role}</td>
                    <td className="py-3 px-4 text-xs capitalize">{u.accountStatus}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(u)}
                        className="px-3 py-1 text-xs font-medium border border-[#D4E3DA] rounded-md hover:bg-[#F8FAF8]"
                      >
                        {u.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Reported Listings */}
      {adminTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-sm text-[#526058] bg-white border border-[#E2EAE5] rounded-xl p-6">
              No safety reports submitted yet.
            </p>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white border border-[#E2EAE5] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs text-[#526058]">
                    {rep.targetType.toUpperCase()} · Reported by {rep.reporterName} ·{' '}
                    <span className="font-semibold text-[#202824]">{rep.status}</span>
                    {rep.isDemo ? ' · SAMPLE REPORT' : ''}
                  </p>
                  <h3 className="text-base font-semibold text-[#202824]">
                    {rep.targetName} — {rep.reason}
                  </h3>
                  <p className="text-sm text-[#526058]">{rep.details}</p>
                </div>

                {rep.status === 'open' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReportAction(rep.id, 'resolved')}
                      className="px-3.5 py-2 bg-[#145C45] text-white text-xs font-medium rounded-lg"
                    >
                      Mark Resolved
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReportAction(rep.id, 'dismissed')}
                      className="px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] text-[#202824] text-xs font-medium rounded-lg"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Business Model & 30-Day Venture Pilot Economics */}
      {adminTab === 'business-model' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#202824] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#145C45]" />
                  <span>Proposed HostelLoop Business Model & Unit Economics</span>
                </h2>
                <p className="text-xs text-[#526058] mt-1">
                  Illustrative planning assumptions from DGU Venture Quest. HostelLoop does not
                  charge users automatically in MVP v1.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#F8FAF8] border border-[#E2EAE5] rounded-lg self-start">
                {VENTURE_SCENARIOS.map((sc) => (
                  <button
                    key={sc.name}
                    type="button"
                    onClick={() => setSelectedScenarioName(sc.name)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      selectedScenarioName === sc.name
                        ? 'bg-[#145C45] text-white'
                        : 'text-[#526058] hover:text-[#202824]'
                    }`}
                  >
                    {sc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-[#F8FAF8] rounded-xl border border-[#EEF3EF]">
                <p className="text-xs text-[#526058]">Proposed Commission</p>
                <p className="text-xl font-bold text-[#202824] font-mono-tabular mt-1">
                  {Math.round(activeScenario.commissionRate * 100)}%
                </p>
                <p className="text-[11px] text-[#526058] mt-0.5">
                  On {formatINR(activeScenario.avgTransactionValue)} avg. order
                </p>
              </div>
              <div className="p-4 bg-[#F8FAF8] rounded-xl border border-[#EEF3EF]">
                <p className="text-xs text-[#526058]">Indicative Revenue / Txn</p>
                <p className="text-xl font-bold text-[#145C45] font-mono-tabular mt-1">
                  {formatINR(calculated.indicativePlatformCommissionPerTxn)}
                </p>
                <p className="text-[11px] text-[#526058] mt-0.5">
                  Optional featured listing test: {formatINR(ILLUSTRATIVE_PILOT_METRICS.featuredListingExperimentPrice)}
                </p>
              </div>
              <div className="p-4 bg-[#F8FAF8] rounded-xl border border-[#EEF3EF]">
                <p className="text-xs text-[#526058]">Projected Monthly Revenue</p>
                <p className="text-xl font-bold text-[#202824] font-mono-tabular mt-1">
                  {formatINR(calculated.monthlyPlatformRevenue)}
                </p>
                <p className="text-[11px] text-[#526058] mt-0.5">
                  {activeScenario.customers} assumed monthly txns
                </p>
              </div>
              <div className="p-4 bg-[#F8FAF8] rounded-xl border border-[#EEF3EF]">
                <p className="text-xs text-[#526058]">Net Operating Surplus</p>
                <p className="text-xl font-bold text-[#202824] font-mono-tabular mt-1">
                  {formatINR(calculated.operatingSurplus)}
                </p>
                <p className="text-[11px] text-[#526058] mt-0.5">
                  Break-even: {calculated.breakEvenTransactions} txns/mo
                </p>
              </div>
            </div>

            {/* Market Size & Pilot Targets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#EEF3EF]">
              <div>
                <p className="text-xs text-[#526058]">TAM (DGU 3,000+ Students Proxy)</p>
                <p className="text-base font-bold text-[#202824] font-mono-tabular">
                  {formatINR(ILLUSTRATIVE_PILOT_METRICS.tamInr)} / yr (Illustrative)
                </p>
              </div>
              <div>
                <p className="text-xs text-[#526058]">SAM (1,000 Hostel Beachhead)</p>
                <p className="text-base font-bold text-[#202824] font-mono-tabular">
                  {formatINR(ILLUSTRATIVE_PILOT_METRICS.samInr)} / yr (Illustrative)
                </p>
              </div>
              <div>
                <p className="text-xs text-[#526058]">SOM (150 30-Day Pilot Target Users)</p>
                <p className="text-base font-bold text-[#202824] font-mono-tabular">
                  {formatINR(ILLUSTRATIVE_PILOT_METRICS.somInr)} / yr (Illustrative)
                </p>
              </div>
            </div>
          </div>

          {/* Post-Transaction Pilot Feedback collected */}
          <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6">
            <h3 className="text-base font-semibold text-[#202824] mb-3">
              Collected Pilot Transaction Feedback ({feedback.length})
            </h3>
            {feedback.length === 0 ? (
              <p className="text-sm text-[#526058]">
                No post-transaction feedback submitted yet. Complete a buyer-seller inquiry and
                submit feedback in My Activity to see real pilot responses here.
              </p>
            ) : (
              <div className="space-y-3">
                {feedback.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 bg-[#F8FAF8] rounded-xl border border-[#EEF3EF] text-sm"
                  >
                    <p className="font-semibold text-[#202824]">
                      {f.listingTitle} · Rating {f.rating}/5 ·{' '}
                      {f.wouldUseAgain ? 'Would use again' : 'Would not reuse'}
                    </p>
                    <p className="text-xs text-[#526058] mt-1">
                      Alternative would have used: {f.alternativeWouldHaveUsed}
                    </p>
                    {f.notes && <p className="text-xs text-[#202824] mt-1">{f.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
