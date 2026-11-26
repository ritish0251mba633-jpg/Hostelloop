export enum ProductCategory {
  HostelEssentials = 'Hostel Essentials',
  StudyStationery = 'Study & Stationery',
  Electronics = 'Electronics',
  Furniture = 'Furniture',
  StorageOrganisation = 'Storage & Organisation',
  SportsFitness = 'Sports & Fitness',
  OtherStudentEssentials = 'Other Student Essentials',
}

export enum ItemCondition {
  BrandNew = 'Brand New',
  LikeNew = 'Like New',
  Good = 'Good',
  Fair = 'Fair',
}

export enum TransactionType {
  Sell = 'Sell',
  Exchange = 'Exchange',
  Rent = 'Rent',
  Donate = 'Donate',
}

export enum AvailabilityStatus {
  Available = 'Available',
  Reserved = 'Reserved',
  Sold = 'Sold',
}

export enum ModerationStatus {
  Approved = 'approved',
  Pending = 'pending',
  Rejected = 'rejected',
}

export enum VerificationStatus {
  Verified = 'verified',
  Pending = 'pending',
  DemoUnverified = 'demo_unverified',
}

export type AuthProviderType = 'google_firebase' | 'email' | 'demo';

export type SortOption =
  | 'relevant'
  | 'recent'
  | 'price_asc'
  | 'price_desc';

export type AppRoute =
  | 'home'
  | 'explore'
  | 'product'
  | 'sell'
  | 'my-listings'
  | 'activity'
  | 'messages'
  | 'profile'
  | 'safety'
  | 'admin'
  | 'signin'
  | 'complete-profile';

export interface UserProfile {
  id: string;
  googleUid?: string;
  authProvider: AuthProviderType;
  name: string;
  email: string;
  campusEmail?: string;
  campusAffiliation: string;
  role: 'student' | 'admin';
  verificationStatus: VerificationStatus;
  isDemoAccount: boolean;
  profileCompleted: boolean;
  hostelBlock: string;
  roomNumber: string;
  programAndYear: string;
  phone: string;
  whatsappOptIn: boolean;
  avatarUrl?: string;
  bio: string;
  joinedAt: string;
  accountStatus: 'active' | 'suspended';
  verifiedAt?: string;
}

export interface ProductListing {
  id: string;
  title: string;
  category: ProductCategory;
  description: string;
  price: number;
  originalPrice?: number;
  condition: ItemCondition;
  images: string[];
  transactionType: TransactionType;
  availability: AvailabilityStatus;
  moderationStatus: ModerationStatus;
  sellerId: string;
  sellerName: string;
  sellerHostelBlock: string;
  sellerVerificationStatus: VerificationStatus;
  sellerContactPreference: 'Campus Inquiry + WhatsApp' | 'Campus Inquiry Only';
  sellerPhone?: string;
  pickupLocation: string;
  createdAt: string;
  isDemo: boolean;
  featuredExperimentOptIn?: boolean;
  exchangePreference?: string;
  rentPeriod?: string;
  viewCount: number;
}

export interface InquiryRecord {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImage: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerVerificationStatus: VerificationStatus;
  sellerId: string;
  sellerName: string;
  message: string;
  preferredMeetupSpot: string;
  proposedTime: string;
  status: 'Pending Seller Response' | 'Seller Responded' | 'Meetup Scheduled' | 'Completed' | 'Closed';
  sellerReply?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportRecord {
  id: string;
  targetType: 'listing' | 'user';
  targetId: string;
  targetName: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  isDemo: boolean;
  createdAt: string;
}

export interface TransactionFeedback {
  id: string;
  inquiryId: string;
  listingId: string;
  listingTitle: string;
  rating: number;
  wouldUseAgain: boolean;
  alternativeWouldHaveUsed: string;
  notes: string;
  createdAt: string;
}

export interface UnitEconomicsScenario {
  name: 'Conservative' | 'Base' | 'Ambitious';
  customers: number;
  avgTransactionValue: number;
  commissionRate: number;
  variableCostPerTxn: number;
  monthlyFixedCost: number;
  purchasesPerCustomer: number;
}

export interface CalculatedEconomics {
  grossTransactionVolume: number;
  indicativePlatformCommissionPerTxn: number;
  monthlyPlatformRevenue: number;
  totalVariableCosts: number;
  operatingSurplus: number;
  breakEvenTransactions: number;
}
