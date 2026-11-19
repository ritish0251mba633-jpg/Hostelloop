import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import {
  AvailabilityStatus,
  ItemCondition,
  ProductCategory,
  ProductListing,
  SortOption,
  TransactionType,
} from '../types/marketplace';
import {
  ALL_CATEGORIES,
  ALL_CONDITIONS,
  ALL_TRANSACTION_TYPES,
  filterAndSortListings,
} from '../utils/marketplaceLogic';
import { ProductCard } from './ProductCard';

interface ExploreMarketplaceProps {
  listings: ProductListing[];
  wishlistIds: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: ProductCategory | 'All';
  onCategoryChange: (c: ProductCategory | 'All') => void;
  selectedTransactionType: TransactionType | 'All';
  onTransactionTypeChange: (t: TransactionType | 'All') => void;
  selectedCondition: ItemCondition | 'All';
  onConditionChange: (cond: ItemCondition | 'All') => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onlyAvailable: boolean;
  onOnlyAvailableChange: (v: boolean) => void;
  onToggleWishlist: (id: string) => void;
  onSelectListing: (listing: ProductListing) => void;
  onResetFilters: () => void;
  onStartSelling: () => void;
}

export function ExploreMarketplace({
  listings,
  wishlistIds,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTransactionType,
  onTransactionTypeChange,
  selectedCondition,
  onConditionChange,
  sortBy,
  onSortChange,
  onlyAvailable,
  onOnlyAvailableChange,
  onToggleWishlist,
  onSelectListing,
  onResetFilters,
  onStartSelling,
}: ExploreMarketplaceProps) {
  const filtered = filterAndSortListings(listings, {
    searchQuery,
    category: selectedCategory,
    transactionType: selectedTransactionType,
    condition: selectedCondition,
    availability: onlyAvailable ? AvailabilityStatus.Available : 'All',
    sortBy,
  });

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedTransactionType !== 'All' ||
    selectedCondition !== 'All' ||
    onlyAvailable;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2EAE5]">
        <div>
          <p className="text-xs font-medium text-[#145C45] mb-1">
            DGU Selaqui Campus Catalog
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#202824] tracking-tight">
            Explore Hostel Essentials
          </h1>
          <p className="text-sm text-[#526058] mt-1">
            Browse items shared by DGU students. Sample seed items are marked as DEMO LISTING.
          </p>
        </div>

        <div className="text-sm text-[#526058] font-mono-tabular">
          Showing <strong className="text-[#202824]">{filtered.length}</strong>{' '}
          {filtered.length === 1 ? 'listing' : 'listings'}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <label htmlFor="explore-search" className="sr-only">
              Search marketplace items
            </label>
            <Search className="w-4 h-4 text-[#526058] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="explore-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search study lamps, calculators, hostel blocks..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4E3DA] rounded-lg text-sm text-[#202824] placeholder:text-[#73827A] focus:outline-none focus:border-[#145C45] focus:ring-2 focus:ring-[#145C45]/15"
            />
          </div>

          {/* Transaction Type Select */}
          <div className="lg:col-span-2">
            <label htmlFor="filter-txn-type" className="sr-only">
              Filter by transaction type
            </label>
            <select
              id="filter-txn-type"
              value={selectedTransactionType}
              onChange={(e) =>
                onTransactionTypeChange(e.target.value as TransactionType | 'All')
              }
              className="w-full px-3 py-2.5 bg-white border border-[#D4E3DA] rounded-lg text-sm text-[#202824] focus:outline-none focus:border-[#145C45]"
            >
              <option value="All">All Modes</option>
              {ALL_TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Select */}
          <div className="lg:col-span-2">
            <label htmlFor="filter-condition" className="sr-only">
              Filter by condition
            </label>
            <select
              id="filter-condition"
              value={selectedCondition}
              onChange={(e) =>
                onConditionChange(e.target.value as ItemCondition | 'All')
              }
              className="w-full px-3 py-2.5 bg-white border border-[#D4E3DA] rounded-lg text-sm text-[#202824] focus:outline-none focus:border-[#145C45]"
            >
              <option value="All">Any Condition</option>
              {ALL_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#526058] shrink-0 hidden sm:block" />
            <label htmlFor="sort-listings" className="sr-only">
              Sort listings
            </label>
            <select
              id="sort-listings"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full px-3 py-2.5 bg-white border border-[#D4E3DA] rounded-lg text-sm text-[#202824] focus:outline-none focus:border-[#145C45]"
            >
              <option value="relevant">Sort: Most Relevant</option>
              <option value="recent">Sort: Recently Listed</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Interactive Category Tabs */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div
            role="tablist"
            aria-label="Filter by product category"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'All'}
              onClick={() => onCategoryChange('All')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-[#145C45] text-white'
                  : 'bg-white text-[#526058] border border-[#E2EAE5] hover:text-[#202824]'
              }`}
            >
              All Categories
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#145C45] text-white'
                    : 'bg-white text-[#526058] border border-[#E2EAE5] hover:text-[#202824]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs text-[#526058] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => onOnlyAvailableChange(e.target.checked)}
                className="rounded border-[#C5D5CC] text-[#145C45] focus:ring-[#145C45]"
              />
              <span>Available only</span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#145C45] hover:underline whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Grid or Empty State */}
      {filtered.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((listing) => (
            <ProductCard
              key={listing.id}
              listing={listing}
              isWishlisted={wishlistIds.includes(listing.id)}
              onToggleWishlist={onToggleWishlist}
              onSelect={onSelectListing}
            />
          ))}
        </div>
      ) : (
        <div className="mt-10 bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center max-w-xl mx-auto">
          <h2 className="text-lg font-semibold text-[#202824]">
            No matching campus items found
          </h2>
          <p className="text-sm text-[#526058] mt-2">
            Try clearing your search query or switching categories. Seniors add new hostel gear as
            the semester wraps up.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 text-sm font-medium text-[#145C45] bg-[#DDF4E7] hover:bg-[#CBEBD9] rounded-lg transition-colors"
            >
              Reset all filters
            </button>
            <button
              type="button"
              onClick={onStartSelling}
              className="px-4 py-2 text-sm font-medium text-white bg-[#145C45] hover:bg-[#0F4634] rounded-lg transition-colors"
            >
              List an item instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
