import { useState } from 'react';
import { Menu, X, ChevronDown, Heart, ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';
import { AppRoute, UserProfile, VerificationStatus } from '../types/marketplace';

interface NavbarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  currentUser: UserProfile | null;
  wishlistCount: number;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Navbar({
  activeRoute,
  onNavigate,
  currentUser,
  wishlistCount,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const primaryLinks: { label: string; route: AppRoute }[] = [
    { label: 'Home', route: 'home' },
    { label: 'Explore', route: 'explore' },
    { label: 'Sell an Item', route: 'sell' },
    { label: 'My Activity', route: 'activity' },
    { label: 'Trust & Safety', route: 'safety' },
  ];

  const workspaceRoutes: AppRoute[] = ['my-listings', 'activity', 'messages', 'profile', 'admin'];
  const showWorkspaceSubnav = workspaceRoutes.includes(activeRoute);

  const handleLinkClick = (route: AppRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E2EAE5]">
      {/* Main 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          className="text-xl font-bold tracking-tight text-[#145C45] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C45] rounded-md px-1"
        >
          HostelLoop
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-7">
          {primaryLinks.map((item) => {
            const isActive =
              activeRoute === item.route ||
              (item.route === 'activity' &&
                ['my-listings', 'messages'].includes(activeRoute));
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleLinkClick(item.route)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C45] ${
                  isActive
                    ? 'text-[#145C45] border-[#145C45]'
                    : 'text-[#526058] border-transparent hover:text-[#202824] hover:border-[#C5D5CC]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action / Account Control */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-label="Open student account menu"
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#202824] bg-[#F8FAF8] hover:bg-[#DDF4E7]/60 border border-[#E2EAE5] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C45]"
              >
                <span className="max-w-[140px] truncate">{currentUser.name.split(' ')[0]}</span>
                {wishlistCount > 0 && (
                  <span className="text-xs font-mono-tabular text-[#145C45]">
                    · {wishlistCount} saved
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-[#526058]" />
              </button>

              {accountMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white border border-[#E2EAE5] rounded-xl shadow-lg py-2 z-50"
                  role="menu"
                >
                  <div className="px-4 py-2.5 border-b border-[#EEF3EF]">
                    <p className="text-sm font-semibold text-[#202824] truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-[#526058] truncate">{currentUser.email}</p>
                    <p className="text-[11px] font-medium mt-1 text-[#145C45]">
                      {currentUser.verificationStatus === VerificationStatus.Verified
                        ? 'Verified DGU Student'
                        : currentUser.isDemoAccount
                          ? 'Demo Mode Account'
                          : 'Pending DGU Verification'}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleLinkClick('profile')}
                    className="w-full text-left px-4 py-2 text-sm text-[#202824] hover:bg-[#F8FAF8] transition-colors"
                  >
                    Student Profile & Settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleLinkClick('my-listings')}
                    className="w-full text-left px-4 py-2 text-sm text-[#202824] hover:bg-[#F8FAF8] transition-colors"
                  >
                    My Listings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleLinkClick('messages')}
                    className="w-full text-left px-4 py-2 text-sm text-[#202824] hover:bg-[#F8FAF8] transition-colors"
                  >
                    Messages & Inquiries
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleLinkClick('activity')}
                    className="w-full text-left px-4 py-2 text-sm text-[#202824] hover:bg-[#F8FAF8] flex items-center justify-between transition-colors"
                  >
                    <span>Saved Wishlist</span>
                    <span className="text-xs font-mono-tabular text-[#526058]">{wishlistCount}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleLinkClick('admin')}
                    className="w-full text-left px-4 py-2 text-sm text-[#145C45] font-medium hover:bg-[#F8FAF8] flex items-center gap-2 transition-colors border-t border-[#EEF3EF] mt-1 pt-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Admin & Pilot Console</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#145C45] hover:bg-[#0F4634] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C45]"
            >
              Sign In
            </button>
          )}

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-lg text-[#202824] hover:bg-[#F8FAF8] min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Contextual Workspace Sub-Bar */}
      {showWorkspaceSubnav && (
        <div className="bg-[#F8FAF8] border-t border-[#EEF3EF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2">
            {(
              [
                { label: 'My Listings', route: 'my-listings' },
                { label: 'My Activity & Wishlist', route: 'activity' },
                { label: 'Messages', route: 'messages' },
                { label: 'Profile', route: 'profile' },
                { label: 'Admin Dashboard', route: 'admin' },
              ] as { label: string; route: AppRoute }[]
            ).map((tab) => (
              <button
                key={tab.route}
                type="button"
                onClick={() => handleLinkClick(tab.route)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  activeRoute === tab.route
                    ? 'bg-white text-[#145C45] border border-[#D4E3DA] shadow-xs'
                    : 'text-[#526058] hover:text-[#202824]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E2EAE5] px-4 py-4 space-y-1">
          {primaryLinks.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => handleLinkClick(item.route)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] ${
                activeRoute === item.route
                  ? 'bg-[#DDF4E7] text-[#145C45]'
                  : 'text-[#202824] hover:bg-[#F8FAF8]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-[#EEF3EF] space-y-1">
            <button
              type="button"
              onClick={() => handleLinkClick('my-listings')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#202824] hover:bg-[#F8FAF8] min-h-[44px]"
            >
              My Listings
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('messages')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#202824] hover:bg-[#F8FAF8] min-h-[44px]"
            >
              Messages & Inquiries
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('profile')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#202824] hover:bg-[#F8FAF8] flex items-center justify-between min-h-[44px]"
            >
              <span>Profile & Wishlist</span>
              <span className="text-xs font-mono-tabular text-[#145C45] flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" /> {wishlistCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('admin')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#145C45] hover:bg-[#F8FAF8] flex items-center gap-2 min-h-[44px]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin & Pilot Console</span>
            </button>
          </div>
          <div className="pt-3 border-t border-[#EEF3EF]">
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-rose-700 bg-rose-50 rounded-lg min-h-[44px]"
              >
                Sign Out ({currentUser.name.split(' ')[0]})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#145C45] rounded-lg min-h-[44px]"
              >
                Sign In / Join HostelLoop
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
