import { Heart, MapPin } from 'lucide-react';
import {
  AvailabilityStatus,
  ProductListing,
  TransactionType,
} from '../types/marketplace';
import { calculateDiscountPercent, formatINR } from '../utils/marketplaceLogic';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  listing: ProductListing;
  isWishlisted: boolean;
  onToggleWishlist: (listingId: string) => void;
  onSelect: (listing: ProductListing) => void;
}

export function ProductCard({
  listing,
  isWishlisted,
  onToggleWishlist,
  onSelect,
}: ProductCardProps) {
  const discount = calculateDiscountPercent(listing.price, listing.originalPrice);

  return (
    <article className="group bg-white rounded-xl border border-[#E2EAE5] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Image Canvas (65-75% visual focus) */}
      <div className="relative aspect-[4/3] bg-[#F4F7F5] overflow-hidden">
        <button
          type="button"
          onClick={() => onSelect(listing)}
          aria-label={`View details for ${listing.title}`}
          className="w-full h-full block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#145C45]"
        >
          <ProductImage
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>

        {/* Wishlist Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(listing.id);
          }}
          aria-label={
            isWishlisted
              ? `Remove ${listing.title} from wishlist`
              : `Save ${listing.title} to wishlist`
          }
          aria-pressed={isWishlisted}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C45] ${
            isWishlisted
              ? 'bg-[#145C45] text-white'
              : 'bg-white/90 text-[#202824] hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Sold / Reserved scrim when unavailable */}
        {listing.availability !== AvailabilityStatus.Available && (
          <div className="absolute inset-x-0 bottom-0 bg-[#202824]/80 text-white text-xs font-medium px-3 py-1.5 text-center">
            {listing.availability}
          </div>
        )}
      </div>

      {/* Card Body - Zero-pill clean typography */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Quiet 1-line kicker */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#526058] mb-1">
            <span className="truncate">
              {listing.category} · {listing.condition}
            </span>
            {listing.isDemo && (
              <span className="text-[11px] font-medium text-[#145C45] whitespace-nowrap shrink-0">
                DEMO LISTING
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="text-base font-semibold text-[#202824] leading-snug line-clamp-1">
            <button
              type="button"
              onClick={() => onSelect(listing)}
              className="text-left hover:text-[#145C45] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {listing.title}
            </button>
          </h3>

          {/* Seller & Campus Pickup */}
          <p className="text-xs text-[#526058] mt-1.5 flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#145C45]" />
            <span className="truncate">
              {listing.sellerName} · {listing.pickupLocation}
            </span>
          </p>
        </div>

        {/* Price Row */}
        <div className="pt-2.5 border-t border-[#F0F4F1] flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-[#202824] font-mono-tabular">
              {listing.transactionType === TransactionType.Donate
                ? 'Free · Donate'
                : formatINR(listing.price)}
            </span>
            {listing.originalPrice && listing.originalPrice > listing.price && (
              <span className="text-xs text-[#73827A] line-through font-mono-tabular">
                {formatINR(listing.originalPrice)}
              </span>
            )}
            {discount && (
              <span className="text-xs font-medium text-[#145C45] font-mono-tabular">
                -{discount}%
              </span>
            )}
          </div>

          <span className="text-xs font-medium text-[#526058] whitespace-nowrap shrink-0">
            {listing.transactionType} · {listing.availability}
          </span>
        </div>
      </div>
    </article>
  );
}
