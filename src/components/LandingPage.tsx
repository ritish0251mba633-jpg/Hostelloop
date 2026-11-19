import { useState, FormEvent } from 'react';
import {
  Search,
  ArrowRight,
  BookOpen,
  Lamp,
  Plug,
  Armchair,
  Archive,
  Dumbbell,
  Backpack,
  ShieldCheck,
  Leaf,
  Wallet,
  Repeat,
} from 'lucide-react';
import {
  AppRoute,
  ProductCategory,
  ProductListing,
} from '../types/marketplace';
import { HERO_CAMPUS_IMAGE, SAMPLE_TESTIMONIALS } from '../data/seedData';
import { formatINR } from '../utils/marketplaceLogic';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';

interface LandingPageProps {
  listings: ProductListing[];
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onSelectListing: (listing: ProductListing) => void;
  onSearchSubmit: (query: string) => void;
  onCategorySelect: (category: ProductCategory) => void;
  onNavigate: (route: AppRoute) => void;
}

const CATEGORY_CARDS: {
  category: ProductCategory;
  subtitle: string;
  icon: typeof Lamp;
}[] = [
  { category: ProductCategory.HostelEssentials, subtitle: 'Mattresses, bedding & daily gear', icon: Lamp },
  { category: ProductCategory.StudyStationery, subtitle: 'Lamps, calculators & notes', icon: BookOpen },
  { category: ProductCategory.Electronics, subtitle: 'Kettles, extension boards & cables', icon: Plug },
  { category: ProductCategory.Furniture, subtitle: 'Study tables, chairs & shelves', icon: Armchair },
  { category: ProductCategory.StorageOrganisation, subtitle: 'Closet organizers & bins', icon: Archive },
  { category: ProductCategory.SportsFitness, subtitle: 'Dumbbells, mats & campus sports', icon: Dumbbell },
  { category: ProductCategory.OtherStudentEssentials, subtitle: 'Backpacks, umbrellas & travel', icon: Backpack },
];

export function LandingPage({
  listings,
  wishlistIds,
  onToggleWishlist,
  onSelectListing,
  onSearchSubmit,
  onCategorySelect,
  onNavigate,
}: LandingPageProps) {
  const [heroQuery, setHeroQuery] = useState('');

  const handleHeroSearch = (e: FormEvent) => {
    e.preventDefault();
    onSearchSubmit(heroQuery);
  };

  const featuredListings = listings
    .filter((l) => l.featuredExperimentOptIn)
    .slice(0, 3);
  const recentlyListed = listings.slice(0, 6);
  const previewListings = listings.slice(0, 2);

  return (
    <div className="bg-[#F8FAF8]">
      {/* 1. Storefront Hero */}
      <section className="bg-white border-b border-[#E2EAE5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Copy & Search */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-[#145C45] tracking-wide mb-3">
                DBS Global University · Selaqui, Dehradun · Your Campus. Your Marketplace. Your Loop.
              </p>

              <h1
                className="font-bold text-[#202824] tracking-tight leading-[1.08] text-balance"
                style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.4rem)' }}
              >
                Everything Your Hostel Needs. Already on Campus.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-[#526058] leading-relaxed max-w-xl">
                Buy smarter. Sell faster. Reuse better. Discover affordable hostel essentials
                from students around your campus — buy, sell, exchange, rent, or donate within DGU.
              </p>

              {/* Realistic Campus Search Bar */}
              <form onSubmit={handleHeroSearch} className="mt-7 max-w-xl">
                <label htmlFor="hero-search-input" className="sr-only">
                  Search lamps, mattresses, calculators, furniture
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5 p-1.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-xl focus-within:border-[#145C45] focus-within:ring-2 focus-within:ring-[#145C45]/15">
                  <div className="relative flex-1 flex items-center">
                    <Search className="w-4 h-4 text-[#526058] ml-3 shrink-0" />
                    <input
                      id="hero-search-input"
                      type="text"
                      value={heroQuery}
                      onChange={(e) => setHeroQuery(e.target.value)}
                      placeholder="Search lamps, mattresses, calculators, furniture..."
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-[#202824] placeholder:text-[#73827A] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Search Campus
                  </button>
                </div>
              </form>

              {/* Primary + Secondary CTAs */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Explore Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('sell')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#DDF4E7] hover:bg-[#CBEBD9] text-[#145C45] text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Start Selling</span>
                </button>
              </div>

              <div className="mt-7 pt-6 border-t border-[#EEF3EF] flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#526058]">
                <span className="font-medium text-[#202824]">BUY · SELL · EXCHANGE · RENT · DONATE</span>
                <span>DGU Selaqui Campus Pilot</span>
                <span>Public Campus Pickup Zones</span>
              </div>
            </div>

            {/* Right Visual Showcase + Preview Cards */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden border border-[#E2EAE5] flex-1 min-h-[280px] lg:min-h-[380px]">
                <ProductImage
                  src={HERO_CAMPUS_IMAGE}
                  alt="DGU Selaqui sunlit hostel study room with desk, lamp, and textbooks"
                  className="w-full h-full lg:h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                  <p className="text-xs font-medium text-[#B8E986]">
                    Campus Reuse Showcase · Selaqui, Dehradun
                  </p>
                  <p className="text-sm sm:text-base font-medium mt-1">
                    Move-in essentials from graduating seniors — inspected and picked up right on campus.
                  </p>
                </div>
              </div>

              {/* Marketplace Preview Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {previewListings.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectListing(item)}
                    className="flex items-center gap-3 p-3 bg-[#F8FAF8] hover:bg-[#DDF4E7]/50 border border-[#E2EAE5] rounded-xl text-left transition-colors"
                  >
                    <ProductImage
                      src={item.images[0]}
                      alt={item.title}
                      className="w-16 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-[#526058] truncate">
                        DEMO LISTING · {item.condition}
                      </p>
                      <p className="text-sm font-semibold text-[#202824] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs font-semibold text-[#145C45] font-mono-tabular">
                        {formatINR(item.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Popular Campus Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#202824] tracking-tight">
              Browse by Hostel Category
            </h2>
            <p className="text-sm text-[#526058] mt-1">
              Structured around what DGU students actually need when moving in or out.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-sm font-medium text-[#145C45] hover:underline whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            View all listings
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORY_CARDS.map((cat) => {
            const Icon = cat.icon;
            const count = listings.filter((l) => l.category === cat.category).length;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => onCategorySelect(cat.category)}
                className="group bg-white p-5 rounded-xl border border-[#E2EAE5] hover:border-[#145C45] text-left transition-all duration-150 flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-lg bg-[#DDF4E7] text-[#145C45] flex items-center justify-center shrink-0 group-hover:bg-[#145C45] group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#202824] group-hover:text-[#145C45]">
                    {cat.category}
                  </h3>
                  <p className="text-xs text-[#526058] mt-0.5 line-clamp-1">{cat.subtitle}</p>
                  <p className="text-xs font-mono-tabular text-[#145C45] mt-2">
                    {count} {count === 1 ? 'listing' : 'listings'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Recently Listed Campus Essentials */}
      <section className="bg-white border-y border-[#E2EAE5] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-medium text-[#145C45] mb-1">
                Seeded Demo Catalog · Illustrative DGU Listings
              </p>
              <h2 className="text-2xl font-bold text-[#202824] tracking-tight">
                Recently Listed on Campus
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#145C45] hover:underline whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <span>Explore full catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyListed.map((listing) => (
              <ProductCard
                key={listing.id}
                listing={listing}
                isWishlisted={wishlistIds.includes(listing.id)}
                onToggleWishlist={onToggleWishlist}
                onSelect={onSelectListing}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. How HostelLoop Works & Why Buy From Fellow Students */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-[#145C45] mb-2">
              Designed for the Hostel Lifecycle
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202824] tracking-tight text-balance">
              How HostelLoop Replaces Scattered WhatsApp Groups
            </h2>
            <p className="text-sm text-[#526058] mt-3 leading-relaxed">
              New hostelers arrive needing lamps, mattresses, calculators, and desks all at once.
              Graduating seniors leave with usable items they struggle to sell in time.
              HostelLoop structures both sides in one campus place.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => onNavigate('safety')}
                className="text-sm font-medium text-[#145C45] hover:underline inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Read Campus Safety & Meetup Guidelines</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E2EAE5]">
              <p className="text-xs font-mono-tabular font-semibold text-[#145C45] mb-2">
                01. List or Discover
              </p>
              <h3 className="text-base font-semibold text-[#202824]">
                Clear Photos & Condition
              </h3>
              <p className="text-sm text-[#526058] mt-2 leading-relaxed">
                Filter by category, price, or transaction type — buy, exchange, rent for exam week, or claim free senior donations.
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#E2EAE5]">
              <p className="text-xs font-mono-tabular font-semibold text-[#145C45] mb-2">
                02. Verify & Connect
              </p>
              <h3 className="text-base font-semibold text-[#202824]">
                DGU Campus Community
              </h3>
              <p className="text-sm text-[#526058] mt-2 leading-relaxed">
                Submit a campus inquiry directly to the seller or connect via WhatsApp when the seller opts in.
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#E2EAE5]">
              <p className="text-xs font-mono-tabular font-semibold text-[#145C45] mb-2">
                03. Inspect & Exchange
              </p>
              <h3 className="text-base font-semibold text-[#202824]">
                Zero Shipping Hassle
              </h3>
              <p className="text-sm text-[#526058] mt-2 leading-relaxed">
                Meet in daylight at public spots like the Central Library Entrance or Academic Courtyard, inspect the item, and close.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sustainability & Affordability + Featured Campus Listings */}
      <section className="bg-[#145C45] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <p className="text-xs font-medium text-[#B8E986] mb-2">
                Affordability & Campus Sustainability
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                Keep Usable Hostel Gear Circulating Inside DGU
              </h2>
              <p className="text-sm sm:text-base text-[#DDF4E7] mt-3 leading-relaxed">
                Buying pre-owned essentials from a senior saves students 45–70% compared to retail
                stores in Dehradun while preventing serviceable desks, kettles, and mattresses from
                ending up unused or discarded at semester checkout.
              </p>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 border border-white/15 rounded-xl p-4">
                <Wallet className="w-5 h-5 text-[#B8E986] mb-2" />
                <p className="text-xl font-bold font-mono-tabular">₹500</p>
                <p className="text-xs text-[#DDF4E7] mt-1">
                  Assumed avg. transaction value (Pilot hypothesis)
                </p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-xl p-4">
                <Repeat className="w-5 h-5 text-[#B8E986] mb-2" />
                <p className="text-xl font-bold font-mono-tabular">5 Modes</p>
                <p className="text-xs text-[#DDF4E7] mt-1">
                  Buy, Sell, Exchange, Rent & Donate in one campus loop
                </p>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-xl p-4">
                <Leaf className="w-5 h-5 text-[#B8E986] mb-2" />
                <p className="text-xl font-bold font-mono-tabular">0 km</p>
                <p className="text-xs text-[#DDF4E7] mt-1">
                  Off-campus shipping required — walk-up hostel handover
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Campus Listings + Sample Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        {featuredListings.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
              <div>
                <p className="text-xs font-medium text-[#145C45]">
                  Featured Campus Picks · Demo Listings
                </p>
                <h2 className="text-2xl font-bold text-[#202824] tracking-tight mt-0.5">
                  High-Demand Move-In Essentials
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <ProductCard
                  key={listing.id}
                  listing={listing}
                  isWishlisted={wishlistIds.includes(listing.id)}
                  onToggleWishlist={onToggleWishlist}
                  onSelect={onSelectListing}
                />
              ))}
            </div>
          </div>
        )}

        {/* Clearly Labelled Sample Testimonials */}
        <div className="pt-4 border-t border-[#E2EAE5]">
          <div className="mb-8">
            <p className="text-xs font-medium text-[#526058] mb-1">
              Sample / Demo Content — Illustrative Campus Scenarios
            </p>
            <h2 className="text-2xl font-bold text-[#202824] tracking-tight">
              Why DGU Students Use a Dedicated Campus Loop
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SAMPLE_TESTIMONIALS.map((t) => (
              <blockquote
                key={t.id}
                className="bg-white p-6 rounded-xl border border-[#E2EAE5] flex flex-col justify-between gap-4"
              >
                <p className="text-sm text-[#202824] leading-relaxed">“{t.quote}”</p>
                <footer className="pt-4 border-t border-[#F0F4F1]">
                  <p className="text-sm font-semibold text-[#202824]">{t.name}</p>
                  <p className="text-xs text-[#526058] mt-0.5">{t.role}</p>
                  <p className="text-xs font-medium text-[#145C45] mt-1">{t.outcome}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>

        {/* Community CTA */}
        <div className="bg-[#DDF4E7] border border-[#C3E5D2] rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-[#202824] tracking-tight">
              Ready to Join the DGU HostelLoop Pilot?
            </h2>
            <p className="text-sm text-[#202824]/80 mt-2 leading-relaxed">
              List one item you no longer need before semester checkout or browse affordable hostel
              essentials already waiting inside campus blocks.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('sell')}
              className="px-5 py-3 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              List an Unused Item
            </button>
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="px-5 py-3 bg-white hover:bg-[#F8FAF8] text-[#145C45] border border-[#145C45]/25 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
