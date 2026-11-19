import { useEffect, useState, useCallback } from 'react';
import {
  AppRoute,
  ItemCondition,
  ProductCategory,
  ProductListing,
  SortOption,
  TransactionType,
  UserProfile,
  InquiryRecord,
} from './types/marketplace';
import { SEED_LISTINGS } from './data/seedData';
import { api, setAuthToken } from './utils/api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ExploreMarketplace } from './components/ExploreMarketplace';
import { ProductDetailView } from './components/ProductDetailView';
import { SellItemPage } from './components/SellItemPage';
import { ActivityHubPage } from './components/ActivityHubPage';
import { ProfilePage } from './components/ProfilePage';
import { TrustSafetyPage } from './components/TrustSafetyPage';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('home');
  const [selectedListing, setSelectedListing] = useState<ProductListing | null>(null);

  const [listings, setListings] = useState<ProductListing[]>(SEED_LISTINGS);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allowedDomains, setAllowedDomains] = useState<string[]>(['dgu.ac.in']);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Explore filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType | 'All'>('All');
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('relevant');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const [listingsRes, wishlistRes, meRes, cfgRes] = await Promise.all([
        api.getListings(),
        api.getWishlist(),
        api.getMe(),
        api.getConfig(),
      ]);
      setListings(listingsRes.listings);
      setWishlistIds(wishlistRes.wishlistIds);
      setCurrentUser(meRes.user);
      setAllowedDomains(cfgRes.allowedDomains);

      if (meRes.user) {
        const inqRes = await api.getInquiries();
        setInquiries(inqRes.inquiries);
      } else {
        setInquiries([]);
      }
    } catch {
      // Fallback gracefully to seed listings if offline
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const navigateTo = (route: AppRoute) => {
    setActiveRoute(route);
    if (route !== 'product') {
      setSelectedListing(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectListing = (listing: ProductListing) => {
    setSelectedListing(listing);
    setActiveRoute('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleWishlist = async (listingId: string) => {
    // Optimistic update
    setWishlistIds((prev) =>
      prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId]
    );
    try {
      const res = await api.toggleWishlist(listingId);
      setWishlistIds(res.wishlistIds);
    } catch {
      // revert on error
      refreshData();
    }
  };

  const handleSearchFromHero = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory('All');
    navigateTo('explore');
  };

  const handleCategorySelect = (category: ProductCategory) => {
    setSelectedCategory(category);
    setSearchQuery('');
    navigateTo('explore');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTransactionType('All');
    setSelectedCondition('All');
    setSortBy('relevant');
    setOnlyAvailable(false);
  };

  const handleAuthenticated = async (user: UserProfile) => {
    setCurrentUser(user);
    await refreshData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setAuthToken(null);
    setCurrentUser(null);
    setInquiries([]);
    await refreshData();
  };

  const handleEnterDemoAdmin = async () => {
    const { token, user } = await api.enterDemoSession('admin');
    setAuthToken(token);
    await handleAuthenticated(user);
  };

  // Sync selectedListing if listings updated
  const activeProduct = selectedListing
    ? listings.find((l) => l.id === selectedListing.id) || selectedListing
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-[#202824]">
      <Navbar
        activeRoute={activeRoute}
        onNavigate={navigateTo}
        currentUser={currentUser}
        wishlistCount={wishlistIds.length}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Explicit Demo Mode Banner when signed into a Demo Account */}
      {currentUser?.isDemoAccount && (
        <div className="bg-[#DDF4E7] border-b border-[#C3E5D2] px-4 py-1.5 text-center text-xs text-[#145C45]">
          <strong>Demo Mode:</strong> Signed in as {currentUser.name} · Local sample data (separate from verified @dgu.ac.in accounts).
        </div>
      )}

      <main className="flex-1">
        {loadingInitial ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
            <div className="h-10 w-72 bg-[#E8EFEA] rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-[#E2EAE5] rounded-xl h-80 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeRoute === 'home' && (
              <LandingPage
                listings={listings}
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
                onSelectListing={handleSelectListing}
                onSearchSubmit={handleSearchFromHero}
                onCategorySelect={handleCategorySelect}
                onNavigate={navigateTo}
              />
            )}

            {activeRoute === 'explore' && (
              <ExploreMarketplace
                listings={listings}
                wishlistIds={wishlistIds}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedTransactionType={selectedTransactionType}
                onTransactionTypeChange={setSelectedTransactionType}
                selectedCondition={selectedCondition}
                onConditionChange={setSelectedCondition}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onlyAvailable={onlyAvailable}
                onOnlyAvailableChange={setOnlyAvailable}
                onToggleWishlist={handleToggleWishlist}
                onSelectListing={handleSelectListing}
                onResetFilters={handleResetFilters}
                onStartSelling={() => navigateTo('sell')}
              />
            )}

            {activeRoute === 'product' && activeProduct && (
              <ProductDetailView
                listing={activeProduct}
                allListings={listings}
                wishlistIds={wishlistIds}
                currentUser={currentUser}
                onBack={() => navigateTo('explore')}
                onToggleWishlist={handleToggleWishlist}
                onSelectListing={handleSelectListing}
                onOpenAuth={() => setAuthModalOpen(true)}
                onInquiryCreated={refreshData}
              />
            )}

            {activeRoute === 'sell' && (
              <SellItemPage
                currentUser={currentUser}
                onOpenAuth={() => setAuthModalOpen(true)}
                onListingCreated={() => refreshData()}
                onViewListing={handleSelectListing}
              />
            )}

            {(activeRoute === 'my-listings' ||
              activeRoute === 'activity' ||
              activeRoute === 'messages') && (
              <ActivityHubPage
                activeTab={activeRoute}
                onTabChange={navigateTo}
                currentUser={currentUser}
                listings={listings}
                wishlistIds={wishlistIds}
                inquiries={inquiries}
                onToggleWishlist={handleToggleWishlist}
                onSelectListing={handleSelectListing}
                onListingsChanged={refreshData}
                onInquiriesChanged={refreshData}
                onOpenAuth={() => setAuthModalOpen(true)}
                onNavigateSell={() => navigateTo('sell')}
              />
            )}

            {activeRoute === 'profile' && (
              <ProfilePage
                currentUser={currentUser}
                listings={listings}
                wishlistIds={wishlistIds}
                inquiries={inquiries}
                onProfileUpdated={handleAuthenticated}
                onOpenAuth={() => setAuthModalOpen(true)}
                onNavigate={navigateTo}
              />
            )}

            {activeRoute === 'safety' && <TrustSafetyPage listings={listings} />}

            {activeRoute === 'admin' && (
              <AdminDashboardPage
                currentUser={currentUser}
                onEnterDemoAdmin={handleEnterDemoAdmin}
                onDataMutated={refreshData}
              />
            )}
          </>
        )}
      </main>

      {/* Clean Site Footer */}
      <footer className="bg-white border-t border-[#E2EAE5] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div className="md:col-span-2 space-y-2">
            <p className="text-lg font-bold text-[#145C45]">HostelLoop</p>
            <p className="text-xs font-medium text-[#202824]">
              Your Campus. Your Marketplace. Your Loop.
            </p>
            <p className="text-xs text-[#526058] max-w-md leading-relaxed">
              Campus-specific marketplace prototype built for DBS Global University (DGU), Selaqui,
              Dehradun. Facilitating Buy, Sell, Exchange, Rent, and Donate among hostel students.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#202824]">Marketplace</p>
            <ul className="space-y-1.5 text-xs text-[#526058]">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('explore')}
                  className="hover:text-[#145C45]"
                >
                  Explore All Items
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('sell')}
                  className="hover:text-[#145C45]"
                >
                  Sell or Donate an Item
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('my-listings')}
                  className="hover:text-[#145C45]"
                >
                  My Listings & Wishlist
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('messages')}
                  className="hover:text-[#145C45]"
                >
                  Buyer–Seller Inquiries
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#202824]">Campus & Venture</p>
            <ul className="space-y-1.5 text-xs text-[#526058]">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('safety')}
                  className="hover:text-[#145C45]"
                >
                  Trust & Safety Guidelines
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('profile')}
                  className="hover:text-[#145C45]"
                >
                  DGU Student Profile
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className="hover:text-[#145C45]"
                >
                  Admin & Pilot Economics
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#EEF3EF] py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#73827A]">
          <span>© 2026 HostelLoop · DGU Selaqui Campus Venture MVP</span>
          <span>Sample listings and unit economics projections are labelled for demonstration.</span>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        allowedDomains={allowedDomains}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}
