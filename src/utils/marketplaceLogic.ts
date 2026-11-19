import {
  AvailabilityStatus,
  ItemCondition,
  ModerationStatus,
  ProductCategory,
  ProductListing,
  SortOption,
  TransactionType,
  UnitEconomicsScenario,
  CalculatedEconomics,
} from '../types/marketplace';

export const DEFAULT_ALLOWED_DGU_DOMAINS = ['dgu.ac.in'];

export const CAMPUS_PICKUP_LOCATIONS = [
  'Main Academic Block Courtyard',
  'Central Library Entrance',
  'Boys Hostel Block A Reception',
  'Boys Hostel Block B Reception',
  'Girls Hostel Block Reception',
  'Campus Cafeteria Lawn',
  'DGU Main Gate Security Desk',
];

export const ALL_CATEGORIES: ProductCategory[] = [
  ProductCategory.HostelEssentials,
  ProductCategory.StudyStationery,
  ProductCategory.Electronics,
  ProductCategory.Furniture,
  ProductCategory.StorageOrganisation,
  ProductCategory.SportsFitness,
  ProductCategory.OtherStudentEssentials,
];

export const ALL_CONDITIONS: ItemCondition[] = [
  ItemCondition.BrandNew,
  ItemCondition.LikeNew,
  ItemCondition.Good,
  ItemCondition.Fair,
];

export const ALL_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.Sell,
  TransactionType.Exchange,
  TransactionType.Rent,
  TransactionType.Donate,
];

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function calculateDiscountPercent(price: number, originalPrice?: number): number | null {
  if (!originalPrice || originalPrice <= price || price <= 0) {
    return null;
  }
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export interface EmailValidationResult {
  valid: boolean;
  isAllowedCampusDomain: boolean;
  domain: string;
  error?: string;
}

export function validateDguEmail(
  email: string,
  allowedDomains: string[] = DEFAULT_ALLOWED_DGU_DOMAINS
): EmailValidationResult {
  const normalized = email.trim().toLowerCase();
  const basicFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicFormat.test(normalized)) {
    return {
      valid: false,
      isAllowedCampusDomain: false,
      domain: '',
      error: 'Enter a valid email address.',
    };
  }
  const domain = normalized.split('@')[1] || '';
  const isAllowed = allowedDomains.some(
    (allowed) => domain === allowed.toLowerCase() || domain.endsWith(`.${allowed.toLowerCase()}`)
  );
  if (!isAllowed) {
    return {
      valid: false,
      isAllowedCampusDomain: false,
      domain,
      error: `Campus sign-up is restricted to authorized DGU student emails (@${allowedDomains.join(', @')}). Use Demo Mode to explore without a DGU email.`,
    };
  }
  return {
    valid: true,
    isAllowedCampusDomain: true,
    domain,
  };
}

export interface ListingFilterParams {
  searchQuery?: string;
  category?: ProductCategory | 'All';
  transactionType?: TransactionType | 'All';
  condition?: ItemCondition | 'All';
  availability?: AvailabilityStatus | 'All';
  sortBy?: SortOption;
  includeUnapproved?: boolean;
}

export function filterAndSortListings(
  listings: ProductListing[],
  params: ListingFilterParams
): ProductListing[] {
  const {
    searchQuery = '',
    category = 'All',
    transactionType = 'All',
    condition = 'All',
    availability = 'All',
    sortBy = 'relevant',
    includeUnapproved = false,
  } = params;

  const query = searchQuery.trim().toLowerCase();

  const filtered = listings.filter((item) => {
    if (!includeUnapproved && item.moderationStatus !== ModerationStatus.Approved) {
      return false;
    }
    if (category !== 'All' && item.category !== category) {
      return false;
    }
    if (transactionType !== 'All' && item.transactionType !== transactionType) {
      return false;
    }
    if (condition !== 'All' && item.condition !== condition) {
      return false;
    }
    if (availability !== 'All' && item.availability !== availability) {
      return false;
    }
    if (query) {
      const haystack = [
        item.title,
        item.description,
        item.category,
        item.sellerName,
        item.pickupLocation,
        item.condition,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (sortBy === 'price_asc') {
      return a.price - b.price;
    }
    if (sortBy === 'price_desc') {
      return b.price - a.price;
    }
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // 'relevant': exact/title match first, then featured experiment, then available, then recent
    const score = (item: ProductListing) => {
      let s = 0;
      if (query && item.title.toLowerCase().includes(query)) s += 100;
      if (item.availability === AvailabilityStatus.Available) s += 30;
      if (item.featuredExperimentOptIn) s += 10;
      return s;
    };
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return sorted;
}

export interface ListingInput {
  title: string;
  category: string;
  description: string;
  price: number | string;
  originalPrice?: number | string;
  condition: string;
  transactionType: string;
  pickupLocation: string;
  images: string[];
  contactPreference: string;
  sellerPhone?: string;
}

export interface ListingValidationErrors {
  title?: string;
  category?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  condition?: string;
  pickupLocation?: string;
  images?: string;
  sellerPhone?: string;
}

export function validateListingInput(input: ListingInput): {
  valid: boolean;
  errors: ListingValidationErrors;
} {
  const errors: ListingValidationErrors = {};

  if (!input.title || input.title.trim().length < 3) {
    errors.title = 'Enter a descriptive product name (at least 3 characters).';
  }
  if (!ALL_CATEGORIES.includes(input.category as ProductCategory)) {
    errors.category = 'Select a valid campus category.';
  }
  if (!input.description || input.description.trim().length < 15) {
    errors.description = 'Add at least 15 characters describing condition, age, and usage.';
  }

  const numericPrice = Number(input.price);
  if (input.transactionType === TransactionType.Donate) {
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      errors.price = 'Price must be ₹0 for donated items.';
    }
  } else {
    if (input.price === '' || Number.isNaN(numericPrice) || numericPrice <= 0) {
      errors.price = 'Enter a valid selling or rental price in ₹ (greater than 0).';
    }
  }

  if (input.originalPrice !== undefined && input.originalPrice !== '') {
    const numericOriginal = Number(input.originalPrice);
    if (Number.isNaN(numericOriginal) || numericOriginal < numericPrice) {
      errors.originalPrice = 'Original retail price should be greater than or equal to your asking price.';
    }
  }

  if (!ALL_CONDITIONS.includes(input.condition as ItemCondition)) {
    errors.condition = 'Select the honest condition of the item.';
  }
  if (!input.pickupLocation || input.pickupLocation.trim().length < 3) {
    errors.pickupLocation = 'Specify a safe DGU campus pickup location.';
  }
  if (!input.images || input.images.length === 0) {
    errors.images = 'Add at least one clear product photograph or preview.';
  }
  if (
    input.contactPreference === 'Campus Inquiry + WhatsApp' &&
    (!input.sellerPhone || !/^\+?\d{10,13}$/.test(input.sellerPhone.replace(/[\s-]/g, '')))
  ) {
    errors.sellerPhone = 'Enter a valid 10-digit Indian mobile number to enable WhatsApp contact.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateUnitEconomics(scenario: UnitEconomicsScenario): CalculatedEconomics {
  const totalTxns = scenario.customers * scenario.purchasesPerCustomer;
  const grossTransactionVolume = totalTxns * scenario.avgTransactionValue;
  const indicativePlatformCommissionPerTxn =
    Math.round(scenario.avgTransactionValue * scenario.commissionRate);
  const monthlyPlatformRevenue = totalTxns * indicativePlatformCommissionPerTxn;
  const totalVariableCosts = totalTxns * scenario.variableCostPerTxn;
  const operatingSurplus =
    monthlyPlatformRevenue - totalVariableCosts - scenario.monthlyFixedCost;
  const netContributionPerTxn =
    indicativePlatformCommissionPerTxn - scenario.variableCostPerTxn;
  const breakEvenTransactions =
    netContributionPerTxn > 0
      ? Math.ceil(scenario.monthlyFixedCost / netContributionPerTxn)
      : 0;

  return {
    grossTransactionVolume,
    indicativePlatformCommissionPerTxn,
    monthlyPlatformRevenue,
    totalVariableCosts,
    operatingSurplus,
    breakEvenTransactions,
  };
}

export function buildWhatsAppLink(phone: string | undefined, listingTitle: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 10) return null;
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  const text = encodeURIComponent(
    `Hi! I saw your "${listingTitle}" listing on HostelLoop (DGU Selaqui). Is it still available?`
  );
  return `https://wa.me/${normalized}?text=${text}`;
}
